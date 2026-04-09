// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    .select('*')
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

  return json({
    ok: true,
    mode: 'scaffold',
    pendingCount: deliveries?.length ?? 0,
    providersConfigured: {
      resend: Boolean(Deno.env.get('RESEND_API_KEY')),
      twilioSid: Boolean(Deno.env.get('TWILIO_ACCOUNT_SID')),
      twilioToken: Boolean(Deno.env.get('TWILIO_AUTH_TOKEN')),
      twilioFrom: Boolean(Deno.env.get('TWILIO_FROM_NUMBER')),
    },
    message: 'Notification delivery processor scaffold is installed, but provider sending is not implemented yet.',
    nextStep: 'Implement provider adapters for email and SMS, then update notification_deliveries statuses after each attempt.',
  });
});
