import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile(filename) {
  const filePath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/g);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const separator = trimmed.indexOf('=');
    if (separator === -1) return;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (!key || process.env[key] !== undefined) return;

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  });
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.SUPABASE_SERVICE_KEY
  || process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Faltan SUPABASE_URL/VITE_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO_EMAILS = {
  admin: 'admin@zentra.cl',
  suppliers: [
    'ventas@vallefrio.cl',
    'contacto@molinosdelsur.cl',
    'ventas@agrosur.cl',
  ],
  buyers: [
    'compras@mozart.cl',
    'compras@ritz.cl',
    'abastecimiento@puertosur.cl',
    'compras@cateringandes.cl',
  ],
};

function stableUuid(seed) {
  let hash = 0n;
  for (const char of String(seed)) {
    hash = (hash * 131n + BigInt(char.charCodeAt(0))) % 1000000000000n;
  }
  return `00000000-0000-4000-8000-${hash.toString().padStart(12, '0')}`;
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

async function listAuthUsersByEmail() {
  let page = 1;
  const perPage = 100;
  const users = [];

  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }

  return new Map(users.filter((user) => user.email).map((user) => [user.email.toLowerCase(), user]));
}

async function deleteWhereIn(table, column, values) {
  if (!values.length) return;
  const { error } = await supabase.from(table).delete().in(column, values);
  if (error) throw error;
}

async function purgeDemoData({ userIds, buyerIds, supplierIds }) {
  const { data: supplierProducts, error: supplierProductsError } = await supabase
    .from('products')
    .select('id')
    .in('supplier_id', supplierIds);
  if (supplierProductsError) throw supplierProductsError;
  const demoProductIds = (supplierProducts ?? []).map((row) => row.id);

  const { data: buyerQuotes, error: buyerQuotesError } = await supabase
    .from('quote_requests')
    .select('id')
    .in('buyer_id', buyerIds);
  if (buyerQuotesError) throw buyerQuotesError;
  const demoQuoteIds = (buyerQuotes ?? []).map((row) => row.id);

  const { data: demoAgents, error: demoAgentsError } = await supabase
    .from('ai_agents')
    .select('id')
    .in('supplier_id', supplierIds);
  if (demoAgentsError) throw demoAgentsError;
  const demoAgentIds = (demoAgents ?? []).map((row) => row.id);

  const { data: demoAgentConversations, error: demoAgentConversationsError } = await supabase
    .from('agent_conversations')
    .select('id')
    .in('agent_id', demoAgentIds.length ? demoAgentIds : [stableUuid('empty-agent')]);
  if (demoAgentConversationsError) throw demoAgentConversationsError;
  const demoAgentConversationIds = (demoAgentConversations ?? []).map((row) => row.id);

  const [{ data: buyerQuoteConversations, error: buyerQuoteConversationsError }, { data: supplierQuoteConversations, error: supplierQuoteConversationsError }] = await Promise.all([
    supabase
      .from('quote_conversations')
      .select('id')
      .in('buyer_user_id', buyerIds),
    supabase
      .from('quote_conversations')
      .select('id')
      .in('supplier_user_id', supplierIds),
  ]);
  if (buyerQuoteConversationsError) throw buyerQuoteConversationsError;
  if (supplierQuoteConversationsError) throw supplierQuoteConversationsError;
  const demoQuoteConversationIds = uniq([
    ...(buyerQuoteConversations ?? []).map((row) => row.id),
    ...(supplierQuoteConversations ?? []).map((row) => row.id),
  ]);

  await deleteWhereIn('notifications', 'recipient_id', userIds);
  await deleteWhereIn('notifications', 'actor_id', userIds);
  await deleteWhereIn('notification_deliveries', 'recipient_id', userIds);
  await deleteWhereIn('notification_deliveries', 'actor_id', userIds);
  await deleteWhereIn('buyer_activity_events', 'buyer_id', buyerIds);
  await deleteWhereIn('quote_conversation_messages', 'conversation_id', demoQuoteConversationIds);
  await deleteWhereIn('quote_conversations', 'id', demoQuoteConversationIds);
  await deleteWhereIn('reviews', 'reviewer_id', userIds);
  await deleteWhereIn('reviews', 'reviewed_id', userIds);
  await deleteWhereIn('favorites', 'buyer_id', buyerIds);
  await deleteWhereIn('favorites', 'supplier_id', supplierIds);
  await deleteWhereIn('price_alert_subscriptions', 'buyer_id', buyerIds);
  await deleteWhereIn('price_alerts', 'product_id', demoProductIds);
  await deleteWhereIn('quote_offers', 'quote_id', demoQuoteIds);
  await deleteWhereIn('quote_offers', 'supplier_id', supplierIds);
  await deleteWhereIn('quote_requests', 'buyer_id', buyerIds);
  await deleteWhereIn('subscriptions', 'supplier_id', supplierIds);
  await deleteWhereIn('agent_messages', 'conversation_id', demoAgentConversationIds);
  await deleteWhereIn('agent_conversations', 'id', demoAgentConversationIds);
  await deleteWhereIn('ai_agents', 'id', demoAgentIds);
  await deleteWhereIn('products', 'supplier_id', supplierIds);
  await deleteWhereIn('user_categories', 'user_id', userIds);
  await deleteWhereIn('verification_records', 'user_id', userIds);
  await deleteWhereIn('buyer_profiles', 'user_id', buyerIds);
  await deleteWhereIn('supplier_profiles', 'user_id', supplierIds);
}

async function cleanupDemoData() {
  const includeAdmin = process.env.DELETE_DEMO_ADMIN === '1';
  const targetEmails = [
    ...(includeAdmin ? [DEMO_EMAILS.admin] : []),
    ...DEMO_EMAILS.suppliers,
    ...DEMO_EMAILS.buyers,
  ];

  const authUsersByEmail = await listAuthUsersByEmail();

  const { data: publicUsers, error: publicUsersError } = await supabase
    .from('users')
    .select('id, auth_id, email, is_supplier, is_buyer, is_admin')
    .in('email', targetEmails);
  if (publicUsersError) throw publicUsersError;

  const publicUsersByEmail = new Map((publicUsers ?? []).map((user) => [user.email.toLowerCase(), user]));

  const supplierIds = DEMO_EMAILS.suppliers
    .map((email) => publicUsersByEmail.get(email.toLowerCase())?.id)
    .filter(Boolean);
  const buyerIds = DEMO_EMAILS.buyers
    .map((email) => publicUsersByEmail.get(email.toLowerCase())?.id)
    .filter(Boolean);
  const adminIds = includeAdmin
    ? [publicUsersByEmail.get(DEMO_EMAILS.admin.toLowerCase())?.id].filter(Boolean)
    : [];
  const userIds = [...supplierIds, ...buyerIds, ...adminIds];

  console.log(`Limpiando demo de ${supplierIds.length} suppliers, ${buyerIds.length} buyers${includeAdmin ? ' y admin demo' : ''}...`);
  await purgeDemoData({ userIds, buyerIds, supplierIds });

  if (userIds.length) {
    const { error: deleteUsersError } = await supabase
      .from('users')
      .delete()
      .in('id', userIds);
    if (deleteUsersError) throw deleteUsersError;
  }

  const authIds = targetEmails
    .map((email) => publicUsersByEmail.get(email.toLowerCase())?.auth_id ?? authUsersByEmail.get(email.toLowerCase())?.id)
    .filter(Boolean);

  for (const authId of authIds) {
    const { error } = await supabase.auth.admin.deleteUser(authId);
    if (error) throw error;
  }

  console.log('');
  console.log('Limpieza demo completada.');
  console.log(JSON.stringify({
    removedSuppliers: supplierIds.length,
    removedBuyers: buyerIds.length,
    removedAdmin: adminIds.length,
    removedAuthUsers: authIds.length,
  }, null, 2));
  console.log('');
  console.log(includeAdmin
    ? 'Tambien se elimino la cuenta admin demo.'
    : 'La cuenta admin demo se conservo. Usa DELETE_DEMO_ADMIN=1 si tambien quieres eliminarla.');
}

cleanupDemoData().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
