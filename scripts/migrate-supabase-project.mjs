import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

const requiredEnv = [
  'OLD_SUPABASE_URL',
  'OLD_SUPABASE_SERVICE_ROLE_KEY',
  'NEW_SUPABASE_URL',
  'NEW_SUPABASE_SERVICE_ROLE_KEY',
];

for (const name of requiredEnv) {
  if (!process.env[name]) {
    throw new Error(`Missing required env: ${name}`);
  }
}

const oldSupabase = createClient(
  process.env.OLD_SUPABASE_URL,
  process.env.OLD_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const newSupabase = createClient(
  process.env.NEW_SUPABASE_URL,
  process.env.NEW_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const PUBLIC_TABLES = [
  'categories',
  'plans',
  'users',
  'buyer_profiles',
  'supplier_profiles',
  'user_categories',
  'products',
  'quote_requests',
  'quote_conversations',
  'quote_offers',
  'quote_conversation_messages',
  'reviews',
  'favorites',
  'subscriptions',
  'price_alerts',
  'price_alert_subscriptions',
  'ai_agents',
  'agent_conversations',
  'agent_messages',
  'verification_records',
  'notifications',
  'buyer_activity_events',
  'notification_deliveries',
];

const DIRECT_TARGET_SUPPLIER_TABLE = 'quote_requests';
const STORAGE_BUCKETS = ['product-images', 'avatars'];
const PAGE_SIZE = 1000;
const DELETE_ALL_FILTERS = {
  favorites: ['buyer_id', '00000000-0000-0000-0000-000000000000'],
  user_categories: ['user_id', '00000000-0000-0000-0000-000000000000'],
  buyer_profiles: ['user_id', '00000000-0000-0000-0000-000000000000'],
  supplier_profiles: ['user_id', '00000000-0000-0000-0000-000000000000'],
};

function log(message, metadata = null) {
  if (metadata) {
    console.log(`${message} ${JSON.stringify(metadata)}`);
    return;
  }

  console.log(message);
}

function chunk(rows, size = 100) {
  const chunks = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}

function replaceSupabaseUrl(value) {
  if (typeof value === 'string') {
    return value.split(process.env.OLD_SUPABASE_URL).join(process.env.NEW_SUPABASE_URL);
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceSupabaseUrl(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, replaceSupabaseUrl(item)]),
    );
  }

  return value;
}

async function selectAll(table) {
  const rows = [];
  let from = 0;

  while (true) {
    const { data, error } = await oldSupabase
      .from(table)
      .select('*')
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`Failed reading ${table}: ${error.message}`);

    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

async function listAuthUsers(client) {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) throw new Error(`Failed listing auth users: ${error.message}`);

    users.push(...(data.users ?? []));
    if (!data.users || data.users.length < PAGE_SIZE) break;
    page += 1;
  }

  return users;
}

function temporaryPassword() {
  return `Zentra-${randomBytes(18).toString('base64url')}-2026`;
}

async function migrateAuthUsers() {
  const [oldUsers, existingNewUsers] = await Promise.all([
    listAuthUsers(oldSupabase),
    listAuthUsers(newSupabase),
  ]);

  const newByEmail = new Map(
    existingNewUsers
      .filter((user) => user.email)
      .map((user) => [user.email.toLowerCase(), user]),
  );
  const authIdMap = new Map();

  for (const oldUser of oldUsers) {
    if (!oldUser.email) continue;

    const normalizedEmail = oldUser.email.toLowerCase();
    let newUser = newByEmail.get(normalizedEmail);

    if (!newUser) {
      const { data, error } = await newSupabase.auth.admin.createUser({
        email: oldUser.email,
        password: temporaryPassword(),
        email_confirm: true,
        user_metadata: oldUser.user_metadata ?? {},
        app_metadata: oldUser.app_metadata ?? {},
      });

      if (error) throw new Error(`Failed creating auth user ${oldUser.email}: ${error.message}`);

      newUser = data.user;
      newByEmail.set(normalizedEmail, newUser);
    }

    authIdMap.set(oldUser.id, newUser.id);
  }

  log('Auth users migrated', { oldUsers: oldUsers.length, mappedUsers: authIdMap.size });
  return authIdMap;
}

function transformRows(table, rows, authIdMap) {
  return rows.map((row) => {
    const next = replaceSupabaseUrl(row);

    if (table === 'users' && next.auth_id) {
      next.auth_id = authIdMap.get(next.auth_id) ?? next.auth_id;
    }

    if (table === DIRECT_TARGET_SUPPLIER_TABLE) {
      next.target_supplier_id = null;
    }

    return next;
  });
}

async function insertRows(table, rows) {
  if (!rows.length) {
    log(`Skipped ${table}`, { rows: 0 });
    return;
  }

  for (const rowsChunk of chunk(rows)) {
    const { error } = await newSupabase
      .from(table)
      .insert(rowsChunk);

    if (error) {
      throw new Error(`Failed inserting ${table}: ${error.message}`);
    }
  }

  log(`Inserted ${table}`, { rows: rows.length });
}

async function clearPublicTables() {
  const reverseTables = [...PUBLIC_TABLES].reverse();

  for (const table of reverseTables) {
    const [column, value] = DELETE_ALL_FILTERS[table] ?? ['id', '00000000-0000-0000-0000-000000000000'];
    const { error } = await newSupabase
      .from(table)
      .delete()
      .neq(column, value);

    if (error) throw new Error(`Failed clearing ${table}: ${error.message}`);
  }

  log('Cleared public tables in destination');
}

async function restoreQuoteTargetSuppliers(originalQuoteRequests) {
  const rowsToPatch = originalQuoteRequests.filter((row) => row.target_supplier_id);

  for (const row of rowsToPatch) {
    const { error } = await newSupabase
      .from('quote_requests')
      .update({ target_supplier_id: row.target_supplier_id })
      .eq('id', row.id);

    if (error) {
      throw new Error(`Failed restoring target supplier for quote ${row.id}: ${error.message}`);
    }
  }

  log('Restored quote target suppliers', { rows: rowsToPatch.length });
}

async function listStorageObjects(bucket, prefix = '') {
  const { data, error } = await oldSupabase.storage
    .from(bucket)
    .list(prefix, { limit: PAGE_SIZE, sortBy: { column: 'name', order: 'asc' } });

  if (error) throw new Error(`Failed listing storage bucket ${bucket}: ${error.message}`);

  const rows = [];

  for (const item of data ?? []) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;

    if (item.id === null) {
      rows.push(...await listStorageObjects(bucket, path));
    } else {
      rows.push({ path, metadata: item.metadata ?? {} });
    }
  }

  return rows;
}

async function migrateStorage() {
  let copied = 0;
  let bytes = 0;

  for (const bucket of STORAGE_BUCKETS) {
    const objects = await listStorageObjects(bucket);

    for (const object of objects) {
      const { data: blob, error: downloadError } = await oldSupabase.storage
        .from(bucket)
        .download(object.path);

      if (downloadError) throw new Error(`Failed downloading ${bucket}/${object.path}: ${downloadError.message}`);

      const contentType = object.metadata.mimetype || blob.type || 'application/octet-stream';
      const { error: uploadError } = await newSupabase.storage
        .from(bucket)
        .upload(object.path, blob, {
          contentType,
          upsert: true,
        });

      if (uploadError) throw new Error(`Failed uploading ${bucket}/${object.path}: ${uploadError.message}`);

      copied += 1;
      bytes += Number(object.metadata.size ?? blob.size ?? 0);
    }

    log(`Migrated storage bucket ${bucket}`, { objects: objects.length });
  }

  log('Storage migrated', { copied, bytes });
}

async function countNewRows() {
  const counts = {};

  for (const table of PUBLIC_TABLES) {
    const { count, error } = await newSupabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) throw new Error(`Failed counting ${table}: ${error.message}`);
    counts[table] = count ?? 0;
  }

  return counts;
}

async function main() {
  log('Starting Supabase project migration');
  const authIdMap = await migrateAuthUsers();
  const tableRows = new Map();

  for (const table of PUBLIC_TABLES) {
    tableRows.set(table, await selectAll(table));
  }

  await clearPublicTables();

  for (const table of PUBLIC_TABLES) {
    const transformed = transformRows(table, tableRows.get(table) ?? [], authIdMap);
    await insertRows(table, transformed);
  }

  await restoreQuoteTargetSuppliers(tableRows.get(DIRECT_TARGET_SUPPLIER_TABLE) ?? []);
  await migrateStorage();

  log('Migration complete', await countNewRows());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
