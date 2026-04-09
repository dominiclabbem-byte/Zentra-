import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_PASSWORD = process.env.SEED_PASSWORD || 'ZentraDemo123!';

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

const DEMO_ACCOUNTS = {
  admin: {
    email: 'admin@zentra.cl',
    companyName: 'Zentra Admin',
    rut: '99.999.999-9',
    city: 'Santiago',
    address: 'Av. Apoquindo 4100, Las Condes',
    description: 'Cuenta administradora para validar pilotos, backfills y demo del catalogo.',
    phone: '+56 2 2400 0001',
    whatsapp: '+56 9 9000 0001',
    website: 'https://www.zentraai.cl',
    isAdmin: true,
    isBuyer: false,
    isSupplier: false,
    verified: true,
  },
  suppliers: [
    {
      email: 'ventas@vallefrio.cl',
      companyName: 'Valle Frio SpA',
      rut: '76.234.567-8',
      city: 'Santiago',
      address: 'Av. Lo Echevers 550, Quilicura',
      description: 'Distribuidor mayorista de insumos de panaderia, lacteos y aceites para canal horeca.',
      phone: '+56 2 2345 6789',
      whatsapp: '+56 9 8765 4321',
      website: 'https://www.vallefrio.cl',
      isBuyer: true,
      isSupplier: true,
      verified: true,
      supplierProfile: { giro: 'Distribucion mayorista de alimentos', response_rate: 91 },
      categories: ['Harinas y cereales', 'Lacteos', 'Aceites y grasas', 'Abarrotes'],
      plan: 'pro',
      extraSubscriptions: [],
    },
    {
      email: 'contacto@molinosdelsur.cl',
      companyName: 'Molinos del Sur SpA',
      rut: '77.345.678-1',
      city: 'Rancagua',
      address: 'Ruta 5 Sur Km 86, Rancagua',
      description: 'Molineria y granel institucional con foco en harinas, azucares y secos.',
      phone: '+56 72 244 8811',
      whatsapp: '+56 9 7333 8811',
      website: 'https://www.molinosdelsur.cl',
      isBuyer: false,
      isSupplier: true,
      verified: true,
      supplierProfile: { giro: 'Molienda y envasado industrial', response_rate: 96 },
      categories: ['Harinas y cereales', 'Legumbres', 'Abarrotes', 'Frutos secos'],
      plan: 'enterprise',
      extraSubscriptions: [],
    },
    {
      email: 'ventas@agrosur.cl',
      companyName: 'AgroSur Foods Ltda.',
      rut: '78.456.789-2',
      city: 'Temuco',
      address: 'Camino Labranza 4200, Temuco',
      description: 'Proveedor de IQF, frutas, verduras y congelados para produccion y catering.',
      phone: '+56 45 267 9900',
      whatsapp: '+56 9 7888 9900',
      website: 'https://www.agrosur.cl',
      isBuyer: false,
      isSupplier: true,
      verified: true,
      supplierProfile: { giro: 'Agroindustria y congelados IQF', response_rate: 88 },
      categories: ['Frutas y verduras', 'Congelados IQF', 'Abarrotes'],
      plan: 'starter',
      extraSubscriptions: [
        {
          plan: 'pro',
          status: 'pending_payment',
          billing_provider: 'flow',
          billing_status: 'pending_checkout',
          billing_reference: 'demo-flow-agrosur-upgrade',
          billing_customer_email: 'ventas@agrosur.cl',
          provider_checkout_url: 'https://sandbox.flow.cl/demo/agrosur-upgrade',
        },
      ],
    },
  ],
  buyers: [
    {
      email: 'compras@mozart.cl',
      companyName: 'Pasteleria Mozart Ltda.',
      rut: '72.345.678-9',
      city: 'Santiago',
      address: 'Av. Italia 1580, Providencia',
      description: 'Pasteleria premium con foco en masas, lacteos y fruta congelada.',
      phone: '+56 2 2987 6543',
      whatsapp: '+56 9 1234 5678',
      website: '',
      verified: true,
      buyerProfile: { business_type: 'pasteleria', monthly_volume: '2000 kg', preferred_contact: 'email' },
      categories: ['Harinas y cereales', 'Lacteos', 'Frutas y verduras'],
    },
    {
      email: 'compras@ritz.cl',
      companyName: 'Hotel Ritz Santiago',
      rut: '96.789.012-3',
      city: 'Santiago',
      address: 'Av. Kennedy 5555, Vitacura',
      description: 'Cadena hotelera con abastecimiento de cocina central y room service.',
      phone: '+56 2 2211 3344',
      whatsapp: '+56 9 4555 6677',
      website: 'https://www.ritz.cl',
      verified: true,
      buyerProfile: { business_type: 'hotel', monthly_volume: '6000 kg', preferred_contact: 'whatsapp' },
      categories: ['Lacteos', 'Aceites y grasas', 'Abarrotes'],
    },
    {
      email: 'abastecimiento@puertosur.cl',
      companyName: 'Puerto Sur Cocina',
      rut: '96.123.456-7',
      city: 'Valparaiso',
      address: 'Muelle Baron 12, Valparaiso',
      description: 'Restaurante y banqueteria costera con foco en volumen y estacionalidad.',
      phone: '+56 32 212 3344',
      whatsapp: '+56 9 5566 7788',
      website: '',
      verified: true,
      buyerProfile: { business_type: 'restaurante', monthly_volume: '1500 kg', preferred_contact: 'email' },
      categories: ['Aceites y grasas', 'Abarrotes', 'Congelados IQF'],
    },
    {
      email: 'compras@cateringandes.cl',
      companyName: 'Catering Andes SpA',
      rut: '97.654.321-0',
      city: 'Concepcion',
      address: 'Los Carrera 1400, Concepcion',
      description: 'Catering corporativo con picos de demanda y compras por evento.',
      phone: '+56 41 223 8899',
      whatsapp: '+56 9 7788 9900',
      website: 'https://www.cateringandes.cl',
      verified: true,
      buyerProfile: { business_type: 'catering', monthly_volume: '2500 kg', preferred_contact: 'llamada' },
      categories: ['Congelados IQF', 'Frutas y verduras', 'Abarrotes'],
    },
  ],
};

function stableUuid(seed) {
  let hash = 0n;
  for (const char of String(seed)) {
    hash = (hash * 131n + BigInt(char.charCodeAt(0))) % 1000000000000n;
  }
  return `00000000-0000-4000-8000-${hash.toString().padStart(12, '0')}`;
}

function iso(value) {
  return new Date(value).toISOString();
}

function startOfMonthIso() {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
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

async function ensureAuthUser(account) {
  const authUsersByEmail = await listAuthUsersByEmail();
  const existing = authUsersByEmail.get(account.email.toLowerCase());
  const metadata = {
    company_name: account.companyName,
    is_admin: Boolean(account.isAdmin),
    is_buyer: Boolean(account.isBuyer),
    is_supplier: Boolean(account.isSupplier),
  };

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      email: account.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: metadata,
      app_metadata: { role: account.isAdmin ? 'admin' : account.isSupplier ? 'supplier' : 'buyer' },
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: metadata,
    app_metadata: { role: account.isAdmin ? 'admin' : account.isSupplier ? 'supplier' : 'buyer' },
  });
  if (error) throw error;
  return data.user;
}

async function upsertPublicUser(account, authId) {
  const verifiedAt = account.verified ? iso('2026-03-20T09:00:00Z') : null;
  const row = {
    auth_id: authId,
    email: account.email,
    company_name: account.companyName,
    rut: account.rut,
    city: account.city,
    address: account.address,
    description: account.description,
    phone: account.phone,
    whatsapp: account.whatsapp,
    website: account.website,
    is_supplier: Boolean(account.isSupplier),
    is_buyer: Boolean(account.isBuyer),
    is_admin: Boolean(account.isAdmin),
    verified: Boolean(account.verified),
    verification_status: account.verified ? 'verified' : 'pending',
    verified_at: verifiedAt,
  };

  const { data, error } = await supabase
    .from('users')
    .upsert(row, { onConflict: 'email' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function loadLookups() {
  const [{ data: categories, error: categoriesError }, { data: plans, error: plansError }] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('plans').select('*'),
  ]);

  if (categoriesError) throw categoriesError;
  if (plansError) throw plansError;

  return {
    categoriesByName: new Map((categories ?? []).map((row) => [row.name, row])),
    plansByName: new Map((plans ?? []).map((row) => [row.name, row])),
  };
}

async function selectIds(table, column, values) {
  if (!values.length) return [];
  const { data, error } = await supabase.from(table).select(column).in(column, values);
  if (error) throw error;
  return (data ?? []).map((row) => row[column]).filter(Boolean);
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
}

function buildDemoData(lookups, usersByEmail) {
  const categoryId = (name) => {
    const row = lookups.categoriesByName.get(name);
    if (!row) throw new Error(`No existe la categoria ${name}`);
    return row.id;
  };

  const planId = (name) => {
    const row = lookups.plansByName.get(name);
    if (!row) throw new Error(`No existe el plan ${name}`);
    return row.id;
  };

  const userId = (email) => {
    const row = usersByEmail.get(email);
    if (!row) throw new Error(`No existe el usuario publico ${email}`);
    return row.id;
  };

  const product = (supplierEmail, slug, {
    name,
    category,
    description,
    price,
    price_unit = 'kg',
    stock,
    stock_unit = 'kg',
    status = 'active',
    created_at,
  }) => ({
    id: stableUuid(`product:${supplierEmail}:${slug}`),
    supplier_id: userId(supplierEmail),
    category_id: categoryId(category),
    name,
    description,
    price,
    price_unit,
    stock,
    stock_unit,
    status,
    created_at: iso(created_at),
    updated_at: iso(created_at),
  });

  const products = [
    product('ventas@vallefrio.cl', 'harina-000', {
      name: 'Harina premium 000',
      category: 'Harinas y cereales',
      description: 'Harina panadera de alta absorcion para masas dulces y bolleria.',
      price: 1190,
      stock: 1800,
      created_at: '2026-03-10T09:00:00Z',
    }),
    product('ventas@vallefrio.cl', 'harina-integral', {
      name: 'Harina integral fina',
      category: 'Harinas y cereales',
      description: 'Formato horeca para panificacion con fibra.',
      price: 1290,
      stock: 900,
      created_at: '2026-03-11T09:00:00Z',
    }),
    product('ventas@vallefrio.cl', 'mantequilla-laminada', {
      name: 'Mantequilla laminada premium',
      category: 'Lacteos',
      description: 'Bloque profesional para hojaldre y viennoiserie.',
      price: 6450,
      price_unit: 'kg',
      stock: 260,
      stock_unit: 'kg',
      created_at: '2026-03-12T09:00:00Z',
    }),
    product('ventas@vallefrio.cl', 'crema-uht', {
      name: 'Crema UHT 35%',
      category: 'Lacteos',
      description: 'Caja de 12 litros para cocina y pasteleria.',
      price: 45800,
      price_unit: 'caja',
      stock: 48,
      stock_unit: 'caja',
      created_at: '2026-03-13T09:00:00Z',
    }),
    product('ventas@vallefrio.cl', 'aceite-oliva', {
      name: 'Aceite de oliva extra virgen 5L',
      category: 'Aceites y grasas',
      description: 'Formato gastronomico premium.',
      price: 14800,
      price_unit: 'unidad',
      stock: 64,
      stock_unit: 'unidad',
      created_at: '2026-03-14T09:00:00Z',
    }),
    product('ventas@vallefrio.cl', 'aceite-girasol', {
      name: 'Aceite de girasol 10L',
      category: 'Aceites y grasas',
      description: 'Bidon institucional para cocina central.',
      price: 17300,
      price_unit: 'unidad',
      stock: 44,
      stock_unit: 'unidad',
      created_at: '2026-03-15T09:00:00Z',
    }),
    product('ventas@vallefrio.cl', 'azucar-rubia', {
      name: 'Azucar rubia 1 kg',
      category: 'Abarrotes',
      description: 'Bolsa horeca para cocina y reposteria.',
      price: 1190,
      stock: 200,
      created_at: '2026-03-16T09:00:00Z',
    }),
    product('ventas@vallefrio.cl', 'leche-uht', {
      name: 'Leche entera UHT',
      category: 'Lacteos',
      description: 'Caja por 12 unidades para abastecimiento continuo.',
      price: 9200,
      price_unit: 'caja',
      stock: 20,
      stock_unit: 'caja',
      status: 'low_stock',
      created_at: '2026-03-17T09:00:00Z',
    }),
    product('contacto@molinosdelsur.cl', 'harina-flor', {
      name: 'Harina flor premium',
      category: 'Harinas y cereales',
      description: 'Harina refinada para pasteleria, cocina y panaderia.',
      price: 1080,
      stock: 1100,
      created_at: '2026-03-10T10:00:00Z',
    }),
    product('contacto@molinosdelsur.cl', 'harina-repostera', {
      name: 'Harina repostera extra fina',
      category: 'Harinas y cereales',
      description: 'Formato ideal para bizcochos y galletas.',
      price: 1160,
      stock: 760,
      created_at: '2026-03-11T10:00:00Z',
    }),
    product('contacto@molinosdelsur.cl', 'avena-instantanea', {
      name: 'Avena instantanea premium',
      category: 'Abarrotes',
      description: 'Saco institucional 25 kg.',
      price: 22900,
      price_unit: 'saco',
      stock: 80,
      stock_unit: 'saco',
      created_at: '2026-03-12T10:00:00Z',
    }),
    product('contacto@molinosdelsur.cl', 'lenteja-calibre-7', {
      name: 'Lenteja calibre 7',
      category: 'Legumbres',
      description: 'Saco 25 kg con trazabilidad de origen.',
      price: 23900,
      price_unit: 'saco',
      stock: 120,
      stock_unit: 'saco',
      created_at: '2026-03-13T10:00:00Z',
    }),
    product('contacto@molinosdelsur.cl', 'garbanzo-extra', {
      name: 'Garbanzo extra seleccion',
      category: 'Legumbres',
      description: 'Granel horeca para preparaciones de volumen.',
      price: 26100,
      price_unit: 'saco',
      stock: 90,
      stock_unit: 'saco',
      created_at: '2026-03-14T10:00:00Z',
    }),
    product('contacto@molinosdelsur.cl', 'azucar-granulada', {
      name: 'Azucar granulada',
      category: 'Abarrotes',
      description: 'Bolsa 1 kg para panaderia y cocina central.',
      price: 1080,
      stock: 12,
      status: 'low_stock',
      created_at: '2026-03-15T10:00:00Z',
    }),
    product('contacto@molinosdelsur.cl', 'nuez-mariposa', {
      name: 'Nuez mariposa seleccion',
      category: 'Frutos secos',
      description: 'Formato 5 kg para pasteleria y desayuno buffet.',
      price: 51800,
      price_unit: 'caja',
      stock: 18,
      stock_unit: 'caja',
      created_at: '2026-03-16T10:00:00Z',
    }),
    product('contacto@molinosdelsur.cl', 'almendra-laminada', {
      name: 'Almendra laminada',
      category: 'Frutos secos',
      description: 'Caja 5 kg para terminaciones y rellenos.',
      price: 55900,
      price_unit: 'caja',
      stock: 16,
      stock_unit: 'caja',
      created_at: '2026-03-17T10:00:00Z',
    }),
    product('ventas@agrosur.cl', 'frambuesa-iqf', {
      name: 'Frambuesa IQF',
      category: 'Frutas y verduras',
      description: 'Bolsa de 2.5 kg congelada para temporada alta.',
      price: 8800,
      price_unit: 'bolsa',
      stock: 240,
      stock_unit: 'bolsa',
      created_at: '2026-03-10T11:00:00Z',
    }),
    product('ventas@agrosur.cl', 'mango-cubos', {
      name: 'Mango cubos IQF',
      category: 'Congelados IQF',
      description: 'Caja 10 kg lista para smoothie y postres.',
      price: 32400,
      price_unit: 'caja',
      stock: 38,
      stock_unit: 'caja',
      created_at: '2026-03-11T11:00:00Z',
    }),
    product('ventas@agrosur.cl', 'mix-verduras', {
      name: 'Mix verduras congeladas',
      category: 'Congelados IQF',
      description: 'Mezcla institucional para cocina de volumen.',
      price: 6200,
      stock: 310,
      created_at: '2026-03-12T11:00:00Z',
    }),
    product('ventas@agrosur.cl', 'brocoli-iqf', {
      name: 'Brocoli IQF',
      category: 'Congelados IQF',
      description: 'Floretes congelados listos para regeneracion.',
      price: 5900,
      stock: 280,
      created_at: '2026-03-13T11:00:00Z',
    }),
    product('ventas@agrosur.cl', 'espinaca-hoja', {
      name: 'Espinaca hoja congelada',
      category: 'Congelados IQF',
      description: 'Formato horeca para rellenos, salsas y quiches.',
      price: 5300,
      stock: 170,
      created_at: '2026-03-14T11:00:00Z',
    }),
    product('ventas@agrosur.cl', 'pure-tomate', {
      name: 'Pure de tomate 5 kg',
      category: 'Abarrotes',
      description: 'Bolsa institucional para salsas base.',
      price: 6900,
      price_unit: 'unidad',
      stock: 85,
      stock_unit: 'unidad',
      created_at: '2026-03-15T11:00:00Z',
    }),
    product('ventas@agrosur.cl', 'zanahoria-baby', {
      name: 'Zanahoria baby congelada',
      category: 'Frutas y verduras',
      description: 'Formato gastronómico listo para cocina.',
      price: 5600,
      stock: 140,
      created_at: '2026-03-16T11:00:00Z',
    }),
    product('ventas@agrosur.cl', 'frutilla-iqf', {
      name: 'Frutilla IQF',
      category: 'Frutas y verduras',
      description: 'Caja 10 kg para pasteleria y jugos.',
      price: 29800,
      price_unit: 'caja',
      stock: 26,
      stock_unit: 'caja',
      created_at: '2026-03-17T11:00:00Z',
    }),
  ];

  const productBySlug = new Map(products.map((row) => [row.id, row]));
  const findProductId = (supplierEmail, slug) => stableUuid(`product:${supplierEmail}:${slug}`);

  const quote = (slug, {
    buyerEmail,
    product_name,
    category,
    quantity,
    unit,
    delivery_date,
    status,
    notes,
    created_at,
  }) => ({
    id: stableUuid(`quote:${slug}`),
    buyer_id: userId(buyerEmail),
    requester_id: userId(buyerEmail),
    product_name,
    category_id: categoryId(category),
    quantity,
    unit,
    delivery_date,
    status,
    notes,
    created_at: iso(created_at),
    updated_at: iso(created_at),
  });

  const quoteRequests = [
    quote('mozart-harina-000', {
      buyerEmail: 'compras@mozart.cl',
      product_name: 'Harina premium 000',
      category: 'Harinas y cereales',
      quantity: 500,
      unit: 'kg',
      delivery_date: '2026-04-08',
      status: 'closed',
      notes: 'Entrega AM con descarga en bodega principal.',
      created_at: '2026-03-24T08:00:00Z',
    }),
    quote('mozart-mantequilla', {
      buyerEmail: 'compras@mozart.cl',
      product_name: 'Mantequilla laminada premium',
      category: 'Lacteos',
      quantity: 120,
      unit: 'kg',
      delivery_date: '2026-04-06',
      status: 'in_review',
      notes: 'Necesitamos validar condiciones de frio y ventana horaria.',
      created_at: '2026-03-25T09:00:00Z',
    }),
    quote('ritz-gouda', {
      buyerEmail: 'compras@ritz.cl',
      product_name: 'Queso gouda laminado',
      category: 'Lacteos',
      quantity: 150,
      unit: 'kg',
      delivery_date: '2026-04-05',
      status: 'closed',
      notes: 'Reposicion semanal para buffet y eventos.',
      created_at: '2026-03-23T07:00:00Z',
    }),
    quote('puertosur-aceite', {
      buyerEmail: 'abastecimiento@puertosur.cl',
      product_name: 'Aceite de oliva extra virgen 5L',
      category: 'Aceites y grasas',
      quantity: 90,
      unit: 'unidad',
      delivery_date: '2026-04-09',
      status: 'open',
      notes: 'Oferta anual, comparar condiciones y despacho.',
      created_at: '2026-03-26T11:30:00Z',
    }),
    quote('puertosur-harina', {
      buyerEmail: 'abastecimiento@puertosur.cl',
      product_name: 'Harina flor premium',
      category: 'Harinas y cereales',
      quantity: 350,
      unit: 'kg',
      delivery_date: '2026-04-07',
      status: 'in_review',
      notes: 'Compra mensual para linea de masas y rebozados.',
      created_at: '2026-03-24T11:45:00Z',
    }),
    quote('catering-frambuesa', {
      buyerEmail: 'compras@cateringandes.cl',
      product_name: 'Frambuesa IQF',
      category: 'Frutas y verduras',
      quantity: 250,
      unit: 'kg',
      delivery_date: '2026-04-10',
      status: 'in_review',
      notes: 'Temporada alta y activaciones corporativas.',
      created_at: '2026-03-24T09:45:00Z',
    }),
    quote('mozart-azucar', {
      buyerEmail: 'compras@mozart.cl',
      product_name: 'Azucar granulada',
      category: 'Abarrotes',
      quantity: 300,
      unit: 'kg',
      delivery_date: '2026-04-03',
      status: 'cancelled',
      notes: 'Solicitud cancelada por cambio de proveedor.',
      created_at: '2026-03-22T10:00:00Z',
    }),
  ];

  const quoteId = (slug) => stableUuid(`quote:${slug}`);

  const offer = (slug, {
    quoteSlug,
    supplierEmail,
    price,
    notes,
    estimated_lead_time,
    status,
    pipeline_status,
    created_at,
  }) => ({
    id: stableUuid(`offer:${slug}`),
    quote_id: quoteId(quoteSlug),
    supplier_id: userId(supplierEmail),
    responder_id: userId(supplierEmail),
    price,
    notes,
    estimated_lead_time,
    status,
    pipeline_status,
    created_at: iso(created_at),
  });

  const quoteOffers = [
    offer('mozart-harina-valle', {
      quoteSlug: 'mozart-harina-000',
      supplierEmail: 'ventas@vallefrio.cl',
      price: 1150,
      notes: 'Podemos entregar en 48 horas y congelar precio por 15 dias.',
      estimated_lead_time: '2 dias',
      status: 'accepted',
      pipeline_status: 'won',
      created_at: '2026-03-24T10:00:00Z',
    }),
    offer('mozart-harina-molinos', {
      quoteSlug: 'mozart-harina-000',
      supplierEmail: 'contacto@molinosdelsur.cl',
      price: 1190,
      notes: 'Precio por volumen mensual y despacho regional.',
      estimated_lead_time: '3 dias',
      status: 'rejected',
      pipeline_status: 'lost',
      created_at: '2026-03-24T10:15:00Z',
    }),
    offer('mozart-mantequilla-valle', {
      quoteSlug: 'mozart-mantequilla',
      supplierEmail: 'ventas@vallefrio.cl',
      price: 6320,
      notes: 'Incluye control de frio y ventana AM.',
      estimated_lead_time: '2 dias',
      status: 'pending',
      pipeline_status: 'negotiation',
      created_at: '2026-03-25T10:30:00Z',
    }),
    offer('ritz-gouda-valle', {
      quoteSlug: 'ritz-gouda',
      supplierEmail: 'ventas@vallefrio.cl',
      price: 8420,
      notes: 'Oferta cerrada con calendario semanal y trazabilidad de lote.',
      estimated_lead_time: '5 dias',
      status: 'accepted',
      pipeline_status: 'won',
      created_at: '2026-03-23T08:00:00Z',
    }),
    offer('puertosur-harina-molinos', {
      quoteSlug: 'puertosur-harina',
      supplierEmail: 'contacto@molinosdelsur.cl',
      price: 1090,
      notes: 'Podemos asegurar volumen mensual con despacho programado.',
      estimated_lead_time: '3 dias',
      status: 'pending',
      pipeline_status: 'follow_up',
      created_at: '2026-03-24T13:30:00Z',
    }),
    offer('catering-frambuesa-agro', {
      quoteSlug: 'catering-frambuesa',
      supplierEmail: 'ventas@agrosur.cl',
      price: 8700,
      notes: 'Stock reservado para abril y mayo con despacho refrigerado.',
      estimated_lead_time: '4 dias',
      status: 'pending',
      pipeline_status: 'submitted',
      created_at: '2026-03-24T11:00:00Z',
    }),
    offer('mozart-azucar-molinos', {
      quoteSlug: 'mozart-azucar',
      supplierEmail: 'contacto@molinosdelsur.cl',
      price: 1040,
      notes: 'La RFQ se cancelo antes del cierre.',
      estimated_lead_time: '3 dias',
      status: 'rejected',
      pipeline_status: 'lost',
      created_at: '2026-03-22T10:45:00Z',
    }),
  ];

  const favorites = [
    { buyer_id: userId('compras@mozart.cl'), supplier_id: userId('ventas@vallefrio.cl'), created_at: iso('2026-03-20T09:00:00Z') },
    { buyer_id: userId('compras@mozart.cl'), supplier_id: userId('contacto@molinosdelsur.cl'), created_at: iso('2026-03-21T09:00:00Z') },
    { buyer_id: userId('compras@ritz.cl'), supplier_id: userId('ventas@vallefrio.cl'), created_at: iso('2026-03-21T12:00:00Z') },
    { buyer_id: userId('abastecimiento@puertosur.cl'), supplier_id: userId('contacto@molinosdelsur.cl'), created_at: iso('2026-03-23T09:00:00Z') },
    { buyer_id: userId('compras@cateringandes.cl'), supplier_id: userId('ventas@agrosur.cl'), created_at: iso('2026-03-23T11:00:00Z') },
  ];

  const priceAlertSubscriptions = [
    {
      id: stableUuid('price-alert-sub:mozart:harinas'),
      buyer_id: userId('compras@mozart.cl'),
      category_id: categoryId('Harinas y cereales'),
      product_id: null,
    },
    {
      id: stableUuid('price-alert-sub:mozart:aceite'),
      buyer_id: userId('compras@mozart.cl'),
      category_id: null,
      product_id: findProductId('ventas@vallefrio.cl', 'aceite-oliva'),
    },
    {
      id: stableUuid('price-alert-sub:ritz:lacteos'),
      buyer_id: userId('compras@ritz.cl'),
      category_id: categoryId('Lacteos'),
      product_id: null,
    },
    {
      id: stableUuid('price-alert-sub:puertosur:aceite'),
      buyer_id: userId('abastecimiento@puertosur.cl'),
      category_id: null,
      product_id: findProductId('ventas@vallefrio.cl', 'aceite-oliva'),
    },
    {
      id: stableUuid('price-alert-sub:catering:congelados'),
      buyer_id: userId('compras@cateringandes.cl'),
      category_id: categoryId('Congelados IQF'),
      product_id: null,
    },
  ];

  const priceAlerts = [
    {
      id: stableUuid('price-alert:harina-000-down'),
      product_id: findProductId('ventas@vallefrio.cl', 'harina-000'),
      old_price: 1230,
      new_price: 1190,
      direction: 'down',
      created_at: iso('2026-03-28T09:00:00Z'),
    },
    {
      id: stableUuid('price-alert:frambuesa-down'),
      product_id: findProductId('ventas@agrosur.cl', 'frambuesa-iqf'),
      old_price: 9200,
      new_price: 8800,
      direction: 'down',
      created_at: iso('2026-03-29T10:00:00Z'),
    },
    {
      id: stableUuid('price-alert:aceite-up'),
      product_id: findProductId('ventas@vallefrio.cl', 'aceite-oliva'),
      old_price: 14200,
      new_price: 14800,
      direction: 'up',
      created_at: iso('2026-03-30T09:30:00Z'),
    },
  ];

  const reviews = [
    {
      id: stableUuid('review:mozart:valle-harina'),
      reviewer_id: userId('compras@mozart.cl'),
      reviewed_id: userId('ventas@vallefrio.cl'),
      quote_offer_id: stableUuid('offer:mozart-harina-valle'),
      rating: 5,
      comment: 'Excelente respuesta, precio competitivo y despacho muy ordenado.',
      created_at: iso('2026-03-28T15:00:00Z'),
    },
    {
      id: stableUuid('review:ritz:valle-gouda'),
      reviewer_id: userId('compras@ritz.cl'),
      reviewed_id: userId('ventas@vallefrio.cl'),
      quote_offer_id: stableUuid('offer:ritz-gouda-valle'),
      rating: 4,
      comment: 'Buen cumplimiento y seguimiento semanal.',
      created_at: iso('2026-03-29T11:00:00Z'),
    },
  ];

  const verificationRecords = [...usersByEmail.values()].flatMap((user) => {
    const account = [
      DEMO_ACCOUNTS.admin,
      ...DEMO_ACCOUNTS.suppliers,
      ...DEMO_ACCOUNTS.buyers,
    ].find((row) => row.email === user.email);

    if (!account) return [];

    const base = {
      user_id: user.id,
      status: account.verified ? 'approved' : 'pending',
      reviewed_at: account.verified ? iso('2026-03-20T09:00:00Z') : null,
      created_at: iso('2026-03-20T09:00:00Z'),
      submitted_at: iso('2026-03-19T09:00:00Z'),
    };

    if (account.isAdmin) {
      return [{
        id: stableUuid(`verification:${user.email}:company`),
        ...base,
        verification_type: 'company',
        document_label: 'Cuenta administradora validada',
      }];
    }

    return [
      {
        id: stableUuid(`verification:${user.email}:rut`),
        ...base,
        verification_type: 'rut',
        document_label: 'RUT validado',
      },
      {
        id: stableUuid(`verification:${user.email}:${account.isSupplier ? 'supplier' : 'buyer'}`),
        ...base,
        verification_type: account.isSupplier ? 'supplier_profile' : 'buyer_profile',
        document_label: account.isSupplier ? 'Ficha comercial validada' : 'Perfil comprador validado',
      },
    ];
  });

  const subscriptions = [
    {
      id: stableUuid('subscription:valle:active-pro'),
      supplier_id: userId('ventas@vallefrio.cl'),
      plan_id: planId('pro'),
      status: 'active',
      started_at: iso('2026-03-01T00:00:00Z'),
      expires_at: iso('2026-05-01T00:00:00Z'),
      billing_provider: 'internal',
      billing_status: 'paid',
      billing_reference: 'demo-vallefrio-active',
      billing_customer_email: 'ventas@vallefrio.cl',
      paid_at: iso('2026-03-01T00:00:00Z'),
    },
    {
      id: stableUuid('subscription:molinos:active-enterprise'),
      supplier_id: userId('contacto@molinosdelsur.cl'),
      plan_id: planId('enterprise'),
      status: 'active',
      started_at: iso('2026-03-05T00:00:00Z'),
      expires_at: iso('2026-05-05T00:00:00Z'),
      billing_provider: 'internal',
      billing_status: 'paid',
      billing_reference: 'demo-molinos-active',
      billing_customer_email: 'contacto@molinosdelsur.cl',
      paid_at: iso('2026-03-05T00:00:00Z'),
    },
    {
      id: stableUuid('subscription:agrosur:active-starter'),
      supplier_id: userId('ventas@agrosur.cl'),
      plan_id: planId('starter'),
      status: 'active',
      started_at: iso('2026-03-10T00:00:00Z'),
      expires_at: iso('2026-05-10T00:00:00Z'),
      billing_provider: 'internal',
      billing_status: 'paid',
      billing_reference: 'demo-agrosur-active',
      billing_customer_email: 'ventas@agrosur.cl',
      paid_at: iso('2026-03-10T00:00:00Z'),
    },
    {
      id: stableUuid('subscription:agrosur:pending-pro'),
      supplier_id: userId('ventas@agrosur.cl'),
      plan_id: planId('pro'),
      status: 'pending_payment',
      started_at: iso('2026-03-30T00:00:00Z'),
      expires_at: iso('2026-04-02T00:00:00Z'),
      billing_provider: 'flow',
      billing_status: 'pending_checkout',
      billing_reference: 'demo-flow-agrosur-upgrade',
      billing_customer_email: 'ventas@agrosur.cl',
      provider_checkout_url: 'https://sandbox.flow.cl/demo/agrosur-upgrade',
    },
  ];

  const buyerActivityEvents = [
    {
      id: stableUuid('activity:mozart:search-harina'),
      buyer_id: userId('compras@mozart.cl'),
      event_type: 'search',
      search_term: 'harina premium',
      category_id: categoryId('Harinas y cereales'),
      metadata: { source: 'catalog' },
      created_at: iso('2026-03-28T09:10:00Z'),
    },
    {
      id: stableUuid('activity:mozart:product-view-harina'),
      buyer_id: userId('compras@mozart.cl'),
      event_type: 'product_view',
      product_id: findProductId('ventas@vallefrio.cl', 'harina-000'),
      supplier_id: userId('ventas@vallefrio.cl'),
      category_id: categoryId('Harinas y cereales'),
      metadata: { source: 'catalog' },
      created_at: iso('2026-03-28T09:11:00Z'),
    },
    {
      id: stableUuid('activity:mozart:supplier-view-valle'),
      buyer_id: userId('compras@mozart.cl'),
      event_type: 'supplier_view',
      supplier_id: userId('ventas@vallefrio.cl'),
      metadata: { source: 'product_modal' },
      created_at: iso('2026-03-28T09:12:00Z'),
    },
    {
      id: stableUuid('activity:mozart:favorite-valle'),
      buyer_id: userId('compras@mozart.cl'),
      event_type: 'favorite_added',
      supplier_id: userId('ventas@vallefrio.cl'),
      metadata: { source: 'supplier_modal' },
      created_at: iso('2026-03-28T09:13:00Z'),
    },
    {
      id: stableUuid('activity:mozart:quote-created-harina'),
      buyer_id: userId('compras@mozart.cl'),
      event_type: 'quote_created',
      product_id: findProductId('ventas@vallefrio.cl', 'harina-000'),
      supplier_id: userId('ventas@vallefrio.cl'),
      quote_request_id: quoteId('mozart-harina-000'),
      category_id: categoryId('Harinas y cereales'),
      metadata: { source: 'manual_quote' },
      created_at: iso('2026-03-28T09:20:00Z'),
    },
    {
      id: stableUuid('activity:ritz:search-queso'),
      buyer_id: userId('compras@ritz.cl'),
      event_type: 'search',
      search_term: 'queso gouda laminado',
      category_id: categoryId('Lacteos'),
      metadata: { source: 'catalog' },
      created_at: iso('2026-03-27T14:00:00Z'),
    },
    {
      id: stableUuid('activity:ritz:product-view-crema'),
      buyer_id: userId('compras@ritz.cl'),
      event_type: 'product_view',
      product_id: findProductId('ventas@vallefrio.cl', 'crema-uht'),
      supplier_id: userId('ventas@vallefrio.cl'),
      category_id: categoryId('Lacteos'),
      metadata: { source: 'catalog' },
      created_at: iso('2026-03-27T14:04:00Z'),
    },
    {
      id: stableUuid('activity:ritz:quote-created-gouda'),
      buyer_id: userId('compras@ritz.cl'),
      event_type: 'quote_created',
      supplier_id: userId('ventas@vallefrio.cl'),
      quote_request_id: quoteId('ritz-gouda'),
      category_id: categoryId('Lacteos'),
      metadata: { source: 'manual_quote' },
      created_at: iso('2026-03-27T14:20:00Z'),
    },
    {
      id: stableUuid('activity:puertosur:search-aceite'),
      buyer_id: userId('abastecimiento@puertosur.cl'),
      event_type: 'search',
      search_term: 'aceite oliva 5l',
      category_id: categoryId('Aceites y grasas'),
      metadata: { source: 'catalog' },
      created_at: iso('2026-03-29T10:00:00Z'),
    },
    {
      id: stableUuid('activity:puertosur:supplier-view-molinos'),
      buyer_id: userId('abastecimiento@puertosur.cl'),
      event_type: 'supplier_view',
      supplier_id: userId('contacto@molinosdelsur.cl'),
      metadata: { source: 'supplier_modal' },
      created_at: iso('2026-03-29T10:07:00Z'),
    },
    {
      id: stableUuid('activity:puertosur:quote-created-harina'),
      buyer_id: userId('abastecimiento@puertosur.cl'),
      event_type: 'quote_created',
      supplier_id: userId('contacto@molinosdelsur.cl'),
      quote_request_id: quoteId('puertosur-harina'),
      category_id: categoryId('Harinas y cereales'),
      metadata: { source: 'manual_quote' },
      created_at: iso('2026-03-29T10:15:00Z'),
    },
    {
      id: stableUuid('activity:catering:search-frambuesa'),
      buyer_id: userId('compras@cateringandes.cl'),
      event_type: 'search',
      search_term: 'frambuesa iqf',
      category_id: categoryId('Frutas y verduras'),
      metadata: { source: 'catalog' },
      created_at: iso('2026-03-30T11:00:00Z'),
    },
    {
      id: stableUuid('activity:catering:product-view-frambuesa'),
      buyer_id: userId('compras@cateringandes.cl'),
      event_type: 'product_view',
      product_id: findProductId('ventas@agrosur.cl', 'frambuesa-iqf'),
      supplier_id: userId('ventas@agrosur.cl'),
      category_id: categoryId('Frutas y verduras'),
      metadata: { source: 'catalog' },
      created_at: iso('2026-03-30T11:02:00Z'),
    },
    {
      id: stableUuid('activity:catering:favorite-agro'),
      buyer_id: userId('compras@cateringandes.cl'),
      event_type: 'favorite_added',
      supplier_id: userId('ventas@agrosur.cl'),
      metadata: { source: 'supplier_modal' },
      created_at: iso('2026-03-30T11:04:00Z'),
    },
  ];

  const aiAgents = [
    {
      id: stableUuid('agent:valle'),
      supplier_id: userId('ventas@vallefrio.cl'),
      name: 'Asistente comercial Valle Frio',
      type: 'whatsapp_email',
      status: 'active',
      created_at: iso('2026-03-01T00:00:00Z'),
    },
    {
      id: stableUuid('agent:molinos'),
      supplier_id: userId('contacto@molinosdelsur.cl'),
      name: 'Asistente comercial Molinos',
      type: 'email',
      status: 'active',
      created_at: iso('2026-03-01T00:00:00Z'),
    },
    {
      id: stableUuid('agent:agro'),
      supplier_id: userId('ventas@agrosur.cl'),
      name: 'Asistente comercial AgroSur',
      type: 'voice',
      status: 'active',
      created_at: iso('2026-03-01T00:00:00Z'),
    },
  ];

  const agentConversations = [
    {
      id: stableUuid('agent-convo:valle:mozart'),
      agent_id: stableUuid('agent:valle'),
      contact_name: 'Pasteleria Mozart',
      channel: 'email',
      status: 'active',
      started_at: iso('2026-03-28T14:00:00Z'),
    },
    {
      id: stableUuid('agent-convo:valle:ritz'),
      agent_id: stableUuid('agent:valle'),
      contact_name: 'Hotel Ritz Santiago',
      channel: 'whatsapp',
      status: 'active',
      started_at: iso('2026-03-29T12:00:00Z'),
    },
    {
      id: stableUuid('agent-convo:molinos:puertosur'),
      agent_id: stableUuid('agent:molinos'),
      contact_name: 'Puerto Sur Cocina',
      channel: 'email',
      status: 'active',
      started_at: iso('2026-03-30T09:00:00Z'),
    },
    {
      id: stableUuid('agent-convo:agro:catering'),
      agent_id: stableUuid('agent:agro'),
      contact_name: 'Catering Andes',
      channel: 'voice',
      status: 'active',
      started_at: iso('2026-03-30T15:00:00Z'),
    },
  ];

  const agentMessages = [
    {
      id: stableUuid('agent-message:valle:1'),
      conversation_id: stableUuid('agent-convo:valle:mozart'),
      role: 'agent',
      content: 'Tenemos harina premium y mantequilla laminada con despacho AM.',
      created_at: iso('2026-03-28T14:01:00Z'),
    },
    {
      id: stableUuid('agent-message:valle:2'),
      conversation_id: stableUuid('agent-convo:valle:mozart'),
      role: 'user',
      content: 'Necesito asegurar 500 kg y una ventana de entrega temprana.',
      created_at: iso('2026-03-28T14:02:00Z'),
    },
    {
      id: stableUuid('agent-message:molinos:1'),
      conversation_id: stableUuid('agent-convo:molinos:puertosur'),
      role: 'agent',
      content: 'Podemos ofrecer harina flor con despacho mensual programado.',
      created_at: iso('2026-03-30T09:01:00Z'),
    },
    {
      id: stableUuid('agent-message:agro:1'),
      conversation_id: stableUuid('agent-convo:agro:catering'),
      role: 'agent',
      content: 'Tomamos tu requerimiento de frambuesa IQF para temporada alta.',
      created_at: iso('2026-03-30T15:01:00Z'),
    },
  ];

  return {
    products,
    quoteRequests,
    quoteOffers,
    favorites,
    priceAlertSubscriptions,
    priceAlerts,
    reviews,
    verificationRecords,
    subscriptions,
    buyerActivityEvents,
    aiAgents,
    agentConversations,
    agentMessages,
  };
}

async function insertRows(table, rows) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw error;
}

async function upsertRows(table, rows, onConflict) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) throw error;
}

async function assertRequiredTables() {
  const requiredTables = [
    'users',
    'buyer_profiles',
    'supplier_profiles',
    'user_categories',
    'products',
    'quote_requests',
    'quote_offers',
    'favorites',
    'price_alert_subscriptions',
    'price_alerts',
    'reviews',
    'subscriptions',
    'notifications',
    'quote_conversations',
    'quote_conversation_messages',
    'buyer_activity_events',
    'ai_agents',
    'agent_conversations',
    'agent_messages',
    'verification_records',
  ];

  const missing = [];

  for (const table of requiredTables) {
    const { error } = await supabase
      .from(table)
      .select('*', { head: true, count: 'exact' })
      .limit(1);

    if (error?.code === 'PGRST205') {
      missing.push(table);
      continue;
    }

    if (error) throw error;
  }

  if (missing.length) {
    throw new Error(
      [
        'El proyecto Supabase no tiene todas las migraciones necesarias para el backfill demo.',
        `Tablas faltantes: ${missing.join(', ')}`,
        'Aplica primero las migraciones pendientes en cloud y luego vuelve a correr `npm run seed:demo`.',
        'Las tablas de chat/recomendaciones suelen venir de las migraciones 015_quote_conversations.sql y 016_buyer_activity_events.sql.',
      ].join(' '),
    );
  }
}

async function fetchQuoteConversationMap(quotes, offers, usersByEmail) {
  const conversationMap = new Map();

  for (const offer of offers) {
    const quote = quotes.find((row) => row.id === offer.quote_id);
    if (!quote) continue;

    const { data, error } = await supabase
      .from('quote_conversations')
      .select('*')
      .eq('quote_request_id', offer.quote_id)
      .eq('supplier_user_id', offer.supplier_id)
      .single();

    if (error) throw error;
    conversationMap.set(`${offer.quote_id}:${offer.supplier_id}`, data);
  }

  return conversationMap;
}

async function seedQuoteMessagesAndNotifications(data, usersByEmail) {
  const conversationMap = await fetchQuoteConversationMap(data.quoteRequests, data.quoteOffers, usersByEmail);
  const buyerId = (email) => usersByEmail.get(email).id;
  const supplierId = (email) => usersByEmail.get(email).id;

  const messages = [
    {
      id: stableUuid('quote-message:mozart-harina:buyer-1'),
      conversation_id: conversationMap.get(`${stableUuid('quote:mozart-harina-000')}:${supplierId('ventas@vallefrio.cl')}`).id,
      sender_user_id: buyerId('compras@mozart.cl'),
      body: 'Podemos recibir antes de las 9 AM para produccion del viernes?',
      created_at: iso('2026-03-24T10:20:00Z'),
    },
    {
      id: stableUuid('quote-message:mozart-harina:supplier-1'),
      conversation_id: conversationMap.get(`${stableUuid('quote:mozart-harina-000')}:${supplierId('ventas@vallefrio.cl')}`).id,
      sender_user_id: supplierId('ventas@vallefrio.cl'),
      body: 'Si, dejamos programado despacho 7:30 AM con chofer asignado.',
      created_at: iso('2026-03-24T10:25:00Z'),
    },
    {
      id: stableUuid('quote-message:mozart-mantequilla:buyer-1'),
      conversation_id: conversationMap.get(`${stableUuid('quote:mozart-mantequilla')}:${supplierId('ventas@vallefrio.cl')}`).id,
      sender_user_id: buyerId('compras@mozart.cl'),
      body: 'Necesito confirmar rango de frio y si pueden separar en dos entregas.',
      created_at: iso('2026-03-25T11:00:00Z'),
    },
    {
      id: stableUuid('quote-message:mozart-mantequilla:supplier-1'),
      conversation_id: conversationMap.get(`${stableUuid('quote:mozart-mantequilla')}:${supplierId('ventas@vallefrio.cl')}`).id,
      sender_user_id: supplierId('ventas@vallefrio.cl'),
      body: 'Mantenemos cadena de frio y podemos separar 80 kg + 40 kg sin recargo.',
      created_at: iso('2026-03-25T11:08:00Z'),
    },
    {
      id: stableUuid('quote-message:puertosur-harina:supplier-1'),
      conversation_id: conversationMap.get(`${stableUuid('quote:puertosur-harina')}:${supplierId('contacto@molinosdelsur.cl')}`).id,
      sender_user_id: supplierId('contacto@molinosdelsur.cl'),
      body: 'Podemos sostener este precio por 30 dias si definimos volumen mensual.',
      created_at: iso('2026-03-24T14:00:00Z'),
    },
    {
      id: stableUuid('quote-message:catering-frambuesa:buyer-1'),
      conversation_id: conversationMap.get(`${stableUuid('quote:catering-frambuesa')}:${supplierId('ventas@agrosur.cl')}`).id,
      sender_user_id: buyerId('compras@cateringandes.cl'),
      body: 'Podemos cerrar hoy si reservan stock para dos eventos grandes de abril.',
      created_at: iso('2026-03-24T11:15:00Z'),
    },
    {
      id: stableUuid('quote-message:catering-frambuesa:supplier-1'),
      conversation_id: conversationMap.get(`${stableUuid('quote:catering-frambuesa')}:${supplierId('ventas@agrosur.cl')}`).id,
      sender_user_id: supplierId('ventas@agrosur.cl'),
      body: 'Reservamos stock para abril y mayo, con despacho refrigerado desde planta.',
      created_at: iso('2026-03-24T11:20:00Z'),
    },
  ];

  await insertRows('quote_conversation_messages', messages);

  const closedQuoteIds = data.quoteRequests
    .filter((quote) => ['closed', 'cancelled'].includes(quote.status))
    .map((quote) => quote.id);

  if (closedQuoteIds.length) {
    const { error: closeConversationsError } = await supabase
      .from('quote_conversations')
      .update({ status: 'closed' })
      .in('quote_request_id', closedQuoteIds);

    if (closeConversationsError) throw closeConversationsError;
  }

  const notifications = [
    {
      id: stableUuid('notification:mozart:offer-mantequilla'),
      recipient_id: buyerId('compras@mozart.cl'),
      actor_id: supplierId('ventas@vallefrio.cl'),
      type: 'offer_received',
      title: 'Nueva oferta recibida',
      message: 'Valle Frio envio una oferta para Mantequilla laminada premium.',
      entity_type: 'quote_offer',
      entity_id: stableUuid('offer:mozart-mantequilla-valle'),
      created_at: iso('2026-03-25T10:30:00Z'),
    },
    {
      id: stableUuid('notification:puertosur:offer-harina'),
      recipient_id: buyerId('abastecimiento@puertosur.cl'),
      actor_id: supplierId('contacto@molinosdelsur.cl'),
      type: 'offer_received',
      title: 'Nueva oferta recibida',
      message: 'Molinos del Sur respondio tu RFQ de harina flor premium.',
      entity_type: 'quote_offer',
      entity_id: stableUuid('offer:puertosur-harina-molinos'),
      created_at: iso('2026-03-24T13:30:00Z'),
    },
    {
      id: stableUuid('notification:catering:offer-frambuesa'),
      recipient_id: buyerId('compras@cateringandes.cl'),
      actor_id: supplierId('ventas@agrosur.cl'),
      type: 'offer_received',
      title: 'Nueva oferta recibida',
      message: 'AgroSur respondio tu RFQ de frambuesa IQF.',
      entity_type: 'quote_offer',
      entity_id: stableUuid('offer:catering-frambuesa-agro'),
      created_at: iso('2026-03-24T11:00:00Z'),
    },
    {
      id: stableUuid('notification:valle:accepted-mozart'),
      recipient_id: supplierId('ventas@vallefrio.cl'),
      actor_id: buyerId('compras@mozart.cl'),
      type: 'offer_accepted',
      title: 'Tu oferta fue aceptada',
      message: 'Pasteleria Mozart acepto tu oferta para Harina premium 000.',
      entity_type: 'quote_offer',
      entity_id: stableUuid('offer:mozart-harina-valle'),
      created_at: iso('2026-03-24T12:00:00Z'),
    },
    {
      id: stableUuid('notification:valle:accepted-ritz'),
      recipient_id: supplierId('ventas@vallefrio.cl'),
      actor_id: buyerId('compras@ritz.cl'),
      type: 'offer_accepted',
      title: 'Tu oferta fue aceptada',
      message: 'Hotel Ritz Santiago acepto tu oferta para Queso gouda laminado.',
      entity_type: 'quote_offer',
      entity_id: stableUuid('offer:ritz-gouda-valle'),
      created_at: iso('2026-03-23T12:00:00Z'),
    },
    {
      id: stableUuid('notification:molinos:rfq-cancelled'),
      recipient_id: supplierId('contacto@molinosdelsur.cl'),
      actor_id: buyerId('compras@mozart.cl'),
      type: 'rfq_cancelled',
      title: 'La RFQ fue cancelada',
      message: 'La solicitud de azucar granulada fue cancelada por el comprador.',
      entity_type: 'quote_request',
      entity_id: stableUuid('quote:mozart-azucar'),
      created_at: iso('2026-03-22T11:30:00Z'),
    },
    {
      id: stableUuid('notification:valle:message-received'),
      recipient_id: supplierId('ventas@vallefrio.cl'),
      actor_id: buyerId('compras@mozart.cl'),
      type: 'message_received',
      title: 'Nuevo mensaje en una RFQ',
      message: 'Pasteleria Mozart envio un mensaje sobre Mantequilla laminada premium.',
      entity_type: 'quote_conversation',
      entity_id: conversationMap.get(`${stableUuid('quote:mozart-mantequilla')}:${supplierId('ventas@vallefrio.cl')}`).id,
      created_at: iso('2026-03-25T11:00:00Z'),
    },
    {
      id: stableUuid('notification:catering:message-received'),
      recipient_id: buyerId('compras@cateringandes.cl'),
      actor_id: supplierId('ventas@agrosur.cl'),
      type: 'message_received',
      title: 'Nuevo mensaje en una RFQ',
      message: 'AgroSur respondio en la conversacion de frambuesa IQF.',
      entity_type: 'quote_conversation',
      entity_id: conversationMap.get(`${stableUuid('quote:catering-frambuesa')}:${supplierId('ventas@agrosur.cl')}`).id,
      created_at: iso('2026-03-24T11:20:00Z'),
    },
  ];

  await insertRows('notifications', notifications);
}

async function seed() {
  console.log('Preparando cuentas demo...');
  await assertRequiredTables();

  const allAccounts = [
    DEMO_ACCOUNTS.admin,
    ...DEMO_ACCOUNTS.suppliers,
    ...DEMO_ACCOUNTS.buyers,
  ];

  const authUsers = new Map();
  for (const account of allAccounts) {
    const authUser = await ensureAuthUser(account);
    authUsers.set(account.email, authUser.id);
  }

  const publicUsers = new Map();
  for (const account of allAccounts) {
    const user = await upsertPublicUser(account, authUsers.get(account.email));
    publicUsers.set(account.email, user);
  }

  const userIds = [...publicUsers.values()].map((row) => row.id);
  const supplierIds = DEMO_ACCOUNTS.suppliers.map((row) => publicUsers.get(row.email).id);
  const buyerIds = DEMO_ACCOUNTS.buyers.map((row) => publicUsers.get(row.email).id);

  console.log('Limpiando data demo anterior...');
  await purgeDemoData({ userIds, supplierIds, buyerIds });

  const lookups = await loadLookups();
  const data = buildDemoData(lookups, publicUsers);

  console.log('Insertando perfiles y relaciones...');
  await upsertRows('buyer_profiles', DEMO_ACCOUNTS.buyers.map((account) => ({
    user_id: publicUsers.get(account.email).id,
    ...account.buyerProfile,
  })), 'user_id');

  await upsertRows('supplier_profiles', DEMO_ACCOUNTS.suppliers.map((account) => ({
    user_id: publicUsers.get(account.email).id,
    ...account.supplierProfile,
  })), 'user_id');

  await insertRows('verification_records', data.verificationRecords);

  const userCategories = [
    ...DEMO_ACCOUNTS.suppliers.flatMap((account) => account.categories.map((name) => ({
      user_id: publicUsers.get(account.email).id,
      category_id: lookups.categoriesByName.get(name).id,
      scope: 'supplier_catalog',
    }))),
    ...DEMO_ACCOUNTS.buyers.flatMap((account) => account.categories.map((name) => ({
      user_id: publicUsers.get(account.email).id,
      category_id: lookups.categoriesByName.get(name).id,
      scope: 'buyer_interest',
    }))),
  ];
  await insertRows('user_categories', userCategories);

  console.log('Insertando suscripciones, catalogo y actividad...');
  await insertRows('subscriptions', data.subscriptions);
  await insertRows('products', data.products);
  await insertRows('price_alert_subscriptions', data.priceAlertSubscriptions);
  await insertRows('price_alerts', data.priceAlerts);
  await insertRows('favorites', data.favorites);

  console.log('Insertando RFQs, ofertas y reseñas...');
  await insertRows('quote_requests', data.quoteRequests);
  await insertRows('quote_offers', data.quoteOffers);
  await insertRows('reviews', data.reviews);
  await insertRows('buyer_activity_events', data.buyerActivityEvents);

  console.log('Insertando chat buyer/supplier y notificaciones...');
  await seedQuoteMessagesAndNotifications(data, publicUsers);

  console.log('Insertando agentes IA demo...');
  await insertRows('ai_agents', data.aiAgents);
  await insertRows('agent_conversations', data.agentConversations);
  await insertRows('agent_messages', data.agentMessages);

  const counts = {
    users: publicUsers.size,
    products: data.products.length,
    quoteRequests: data.quoteRequests.length,
    quoteOffers: data.quoteOffers.length,
    quoteConversations: data.quoteOffers.length,
    favorites: data.favorites.length,
    priceAlertSubscriptions: data.priceAlertSubscriptions.length,
    priceAlerts: data.priceAlerts.length,
    buyerActivityEvents: data.buyerActivityEvents.length,
    notifications: 8,
    aiAgents: data.aiAgents.length,
  };

  console.log('');
  console.log('Backfill demo completado.');
  console.log(JSON.stringify(counts, null, 2));
  console.log('');
  console.log('Cuentas de prueba:');
  allAccounts.forEach((account) => {
    console.log(`- ${account.email} / ${DEFAULT_PASSWORD}`);
  });
  console.log('');
  console.log(`Mes de referencia de uso de planes: desde ${startOfMonthIso()}`);
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
