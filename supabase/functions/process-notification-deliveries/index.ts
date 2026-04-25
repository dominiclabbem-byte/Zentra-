// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Delivery = {
  id: string;
  channel: 'email' | 'sms';
  destination: string;
  title: string;
  message: string;
  attempts_count: number;
  payload?: Record<string, any>;
};

function json(body: Record<string, any>, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

async function sendEmail(delivery: Delivery) {
  const apiKey = requireEnv('RESEND_API_KEY');
  const from = requireEnv('NOTIFICATION_EMAIL_FROM');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [delivery.destination],
      subject: delivery.title,
      text: delivery.message,
      html: `<p>${delivery.message.replaceAll('\n', '<br>')}</p>`,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend ${response.status}: ${errorBody}`);
  }

  return { provider: 'resend', result: await response.json().catch(() => ({})) };
}

async function sendSms(delivery: Delivery) {
  const accountSid = requireEnv('TWILIO_ACCOUNT_SID');
  const authToken = requireEnv('TWILIO_AUTH_TOKEN');
  const from = requireEnv('TWILIO_FROM_NUMBER');
  const credentials = btoa(`${accountSid}:${authToken}`);
  const body = new URLSearchParams({
    To: delivery.destination,
    From: from,
    Body: `${delivery.title}\n${delivery.message}`.slice(0, 1500),
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Twilio ${response.status}: ${errorBody}`);
  }

  return { provider: 'twilio', result: await response.json().catch(() => ({})) };
}

async function sendDelivery(delivery: Delivery) {
  if (delivery.channel === 'email') return sendEmail(delivery);
  if (delivery.channel === 'sms') return sendSms(delivery);
  throw new Error(`Unsupported channel: ${delivery.channel}`);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return json({
      ok: false,
      message: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.',
    }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: deliveries, error } = await supabase
    .from('notification_deliveries')
    .select('id, channel, destination, title, message, attempts_count, payload')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) {
    return json({
      ok: false,
      message: 'Could not read pending notification deliveries.',
      error: error.message,
    }, 500);
  }

  const results = [];

  for (const delivery of (deliveries ?? []) as Delivery[]) {
    await supabase
      .from('notification_deliveries')
      .update({
        status: 'processing',
        attempts_count: (delivery.attempts_count ?? 0) + 1,
        last_error: null,
      })
      .eq('id', delivery.id);

    try {
      const sendResult = await sendDelivery(delivery);
      await supabase
        .from('notification_deliveries')
        .update({
          provider: sendResult.provider,
          status: 'sent',
          sent_at: new Date().toISOString(),
          last_error: null,
          payload: {
            ...(delivery.payload ?? {}),
            providerResult: sendResult.result,
          },
        })
        .eq('id', delivery.id);

      results.push({ id: delivery.id, channel: delivery.channel, ok: true });
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : String(sendError);
      await supabase
        .from('notification_deliveries')
        .update({
          status: 'failed',
          last_error: message.slice(0, 2000),
        })
        .eq('id', delivery.id);

      results.push({ id: delivery.id, channel: delivery.channel, ok: false, error: message });
    }
  }

  return json({
    ok: true,
    processedCount: results.length,
    results,
  });
});
