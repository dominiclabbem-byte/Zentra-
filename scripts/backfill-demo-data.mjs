import { createClient } from '@supabase/supabase-js';
import {
  buildBuyerUser,
  buildFavorite,
  buildPriceAlert,
  buildPriceAlertSubscription,
  buildProduct,
  buildQuoteOffer,
  buildQuoteRequest,
  buildReview,
  buildSubscription,
  buildSupplierUser,
} from '../src/test/marketplaceFixtures.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SERVICE_ROLE_KEY;
const DEFAULT_PASSWORD = process.env.SEED_PASSWORD || 'ZentraDemo123!';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function uuidFromNumber(value) {
  return `00000000-0000-4000-8000-${String(value).padStart(12, '0')}`;
}

function takeSingle(value) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function stripRelationFields(record, fields = []) {
  const next = { ...record };
  fields.forEach((field) => {
    delete next[field];
  });
  return next;
}

function normalizeQuoteRequestRow(quote) {
  return {
    id: quote.id,
    buyer_id: quote.buyer_id,
    requester_id: quote.requester_id,
    product_name: quote.product_name,
    category_id: quote.category_id,
    quantity: quote.quantity,
    unit: quote.unit,
    delivery_date: quote.delivery_date,
    status: quote.status,
    notes: quote.notes ?? null,
    created_at: quote.created_at,
  };
}

function normalizeQuoteOfferRow(offer) {
  return {
    id: offer.id,
    quote_id: offer.quote_id,
    supplier_id: offer.supplier_id,
    responder_id: offer.responder_id,
    price: offer.price,
    notes: offer.notes ?? null,
    status: offer.status,
    estimated_lead_time: offer.estimated_lead_time ?? null,
    pipeline_status: offer.pipeline_status ?? null,
    created_at: offer.created_at,
  };
}

async function upsertRows(table, rows, onConflict) {
  if (!rows.length) return;

  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict });

  if (error) throw error;
}

async function deleteSeedUsers(userIds) {
  if (!userIds.length) return;

  const { error } = await supabase
    .from('users')
    .delete()
    .in('id', userIds);

  if (error) throw error;
}

async function findAuthUserByEmail(email) {
  let page = 1;
  const perPage = 100;

  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const found = (data?.users ?? []).find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;

    if (!data?.users?.length || data.users.length < perPage) return null;
    page += 1;
  }
}

async function ensureAuthUser(persona) {
  const existing = await findAuthUserByEmail(persona.email);
  const metadata = {
    company_name: persona.company_name,
    is_admin: Boolean(persona.is_admin),
    is_buyer: Boolean(persona.is_buyer),
    is_supplier: Boolean(persona.is_supplier),
  };

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: persona.password || DEFAULT_PASSWORD,
      user_metadata: metadata,
      app_metadata: { role: persona.is_admin ? 'admin' : persona.is_supplier ? 'supplier' : 'buyer' },
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: persona.email,
    password: persona.password || DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: metadata,
    app_metadata: { role: persona.is_admin ? 'admin' : persona.is_supplier ? 'supplier' : 'buyer' },
  });
  if (error) throw error;
  return data.user;
}

async function loadLookups() {
  const [{ data: categoryRows, error: categoryError }, { data: planRows, error: planError }] = await Promise.all([
    supabase.from('categories').select('id, name, emoji'),
    supabase.from('plans').select('id, name, price_clp, has_agents, has_voice_calls, has_crm, has_api, max_active_products, max_quote_responses_per_month, max_ai_conversations_per_month, max_voice_calls_per_month'),
  ]);

  if (categoryError) throw categoryError;
  if (planError) throw planError;

  const categoriesByName = new Map((categoryRows ?? []).map((row) => [row.name, row]));
  const plansByName = new Map((planRows ?? []).map((row) => [row.name, row]));

  return { categoriesByName, plansByName };
}

function buildSeedData(lookups) {
  const cat = (name) => {
    const category = lookups.categoriesByName.get(name);
    if (!category) throw new Error(`No existe la categoria ${name}`);
    return category;
  };

  const plan = (name) => {
    const planRow = lookups.plansByName.get(name);
    if (!planRow) throw new Error(`No existe el plan ${name}`);
    return planRow;
  };

  const admin = {
    publicId: uuidFromNumber(1),
    email: 'admin@zentra.cl',
    password: DEFAULT_PASSWORD,
    company_name: 'Zentra Admin',
    rut: '99.999.999-9',
    city: 'Santiago',
    address: 'Av. Apoquindo 0001',
    description: 'Cuenta administradora de plataforma',
    phone: '+56 2 0000 0001',
    whatsapp: '+56 9 0000 0001',
    website: 'zentra.cl',
    is_admin: true,
    is_buyer: false,
    is_supplier: false,
    verified: true,
  };

  const suppliers = [
    buildSupplierUser({
      id: uuidFromNumber(101),
      company_name: 'Valle Frio SpA',
      email: 'ventas@vallefrio.cl',
      rut: '76.234.567-8',
      city: 'Santiago',
      address: 'Av. Providencia 1234',
      website: 'www.vallefrio.cl',
      supplier_profiles: { giro: 'Distribucion mayorista de alimentos', response_rate: 84 },
      supplierCategories: [cat('Harinas y cereales'), cat('Lacteos'), cat('Aceites y grasas')],
      subscriptions: [buildSubscription(plan('pro'), { supplier_id: uuidFromNumber(101) })],
      activeSubscription: buildSubscription(plan('pro'), { supplier_id: uuidFromNumber(101) }),
    }),
    buildSupplierUser({
      id: uuidFromNumber(102),
      company_name: 'Molinos del Sur SpA',
      email: 'contacto@molinosdelsur.cl',
      rut: '77.345.678-1',
      city: 'Rancagua',
      address: 'Ruta 5 Sur Km 85',
      website: 'www.molinosdelsur.cl',
      supplier_profiles: { giro: 'Molienda y envasado de harinas', response_rate: 92 },
      supplierCategories: [cat('Harinas y cereales'), cat('Legumbres')],
      subscriptions: [buildSubscription(plan('starter'), { supplier_id: uuidFromNumber(102) })],
      activeSubscription: buildSubscription(plan('starter'), { supplier_id: uuidFromNumber(102) }),
    }),
    buildSupplierUser({
      id: uuidFromNumber(103),
      company_name: 'Agroindustrial del Sur Ltda.',
      email: 'ventas@agrosur.cl',
      rut: '78.456.789-2',
      city: 'Temuco',
      address: 'Camino a Labranza 4200',
      website: 'www.agrosur.cl',
      supplier_profiles: { giro: 'Frutas, verduras y congelados', response_rate: 88 },
      supplierCategories: [cat('Frutas y verduras'), cat('Congelados IQF'), cat('Abarrotes')],
      subscriptions: [buildSubscription(plan('enterprise'), { supplier_id: uuidFromNumber(103) })],
      activeSubscription: buildSubscription(plan('enterprise'), { supplier_id: uuidFromNumber(103) }),
    }),
  ];

  const buyers = [
    buildBuyerUser({
      id: uuidFromNumber(201),
      company_name: 'Pasteleria Mozart Ltda.',
      email: 'compras@mozart.cl',
      rut: '72.345.678-9',
      city: 'Santiago',
      address: 'Av. Italia 1580',
      phone: '+56 2 2987 6543',
      whatsapp: '+56 9 1234 5678',
      buyer_profiles: { business_type: 'pasteleria', monthly_volume: '2000 kg', preferred_contact: 'email' },
      buyerCategories: [cat('Harinas y cereales'), cat('Frutas y verduras')],
      verified: true,
    }),
    buildBuyerUser({
      id: uuidFromNumber(202),
      company_name: 'Hotel Ritz Santiago',
      email: 'compras@ritz.cl',
      rut: '96.789.012-3',
      city: 'Santiago',
      address: 'Av. Kennedy 5555',
      phone: '+56 2 2211 3344',
      whatsapp: '+56 9 4555 6677',
      buyer_profiles: { business_type: 'hotel', monthly_volume: '6000 kg', preferred_contact: 'whatsapp' },
      buyerCategories: [cat('Lacteos'), cat('Aceites y grasas')],
      verified: false,
    }),
    buildBuyerUser({
      id: uuidFromNumber(203),
      company_name: 'Restaurante Puerto Sur',
      email: 'abastecimiento@puertosur.cl',
      rut: '96.123.456-7',
      city: 'Valparaiso',
      address: 'Muelle Baron 12',
      phone: '+56 32 212 3344',
      whatsapp: '+56 9 5566 7788',
      buyer_profiles: { business_type: 'restaurante', monthly_volume: '1500 kg', preferred_contact: 'email' },
      buyerCategories: [cat('Carnes y cecinas'), cat('Abarrotes')],
      verified: true,
    }),
    buildBuyerUser({
      id: uuidFromNumber(204),
      company_name: 'Catering Andes SpA',
      email: 'compras@cateringandes.cl',
      rut: '97.654.321-0',
      city: 'Concepcion',
      address: 'Los Carrera 1400',
      phone: '+56 41 223 8899',
      whatsapp: '+56 9 7788 9900',
      buyer_profiles: { business_type: 'catering', monthly_volume: '2500 kg', preferred_contact: 'llamada' },
      buyerCategories: [cat('Congelados IQF'), cat('Frutas y verduras')],
      verified: true,
    }),
  ];

  const products = [
    buildProduct({
      id: uuidFromNumber(301),
      supplier_id: suppliers[0].id,
      category_id: cat('Harinas y cereales').id,
      name: 'Harina premium 000',
      description: 'Harina panadera de alta absorcion para produccion diaria.',
      price: 1190,
      price_unit: 'kg',
      stock: 1500,
      stock_unit: 'kg',
      status: 'active',
      categories: cat('Harinas y cereales'),
      users: { id: suppliers[0].id, company_name: suppliers[0].company_name, verified: true },
    }),
    buildProduct({
      id: uuidFromNumber(302),
      supplier_id: suppliers[0].id,
      category_id: cat('Aceites y grasas').id,
      name: 'Aceite de oliva extra virgen',
      description: 'Formato profesional 5L.',
      price: 14800,
      price_unit: 'unidad',
      stock: 64,
      stock_unit: 'unidad',
      status: 'active',
      categories: cat('Aceites y grasas'),
      users: { id: suppliers[0].id, company_name: suppliers[0].company_name, verified: true },
    }),
    buildProduct({
      id: uuidFromNumber(303),
      supplier_id: suppliers[0].id,
      category_id: cat('Lacteos').id,
      name: 'Leche entera UHT',
      description: 'Caja por 12 unidades.',
      price: 9200,
      price_unit: 'caja',
      stock: 20,
      stock_unit: 'caja',
      status: 'low_stock',
      categories: cat('Lacteos'),
      users: { id: suppliers[0].id, company_name: suppliers[0].company_name, verified: true },
    }),
    buildProduct({
      id: uuidFromNumber(304),
      supplier_id: suppliers[1].id,
      category_id: cat('Harinas y cereales').id,
      name: 'Harina flor premium',
      description: 'Harina refinada para pasteleria y panaderia.',
      price: 1080,
      price_unit: 'kg',
      stock: 900,
      stock_unit: 'kg',
      status: 'active',
      categories: cat('Harinas y cereales'),
      users: { id: suppliers[1].id, company_name: suppliers[1].company_name, verified: true },
    }),
    buildProduct({
      id: uuidFromNumber(305),
      supplier_id: suppliers[1].id,
      category_id: cat('Legumbres').id,
      name: 'Lenteja calibre 7',
      description: 'Saco institucional 25 kg.',
      price: 23900,
      price_unit: 'saco',
      stock: 120,
      stock_unit: 'saco',
      status: 'active',
      categories: cat('Legumbres'),
      users: { id: suppliers[1].id, company_name: suppliers[1].company_name, verified: true },
    }),
    buildProduct({
      id: uuidFromNumber(306),
      supplier_id: suppliers[1].id,
      category_id: cat('Abarrotes').id,
      name: 'Azucar granulada',
      description: 'Bolsa 1 kg para canal horeca.',
      price: 1080,
      price_unit: 'kg',
      stock: 12,
      stock_unit: 'kg',
      status: 'low_stock',
      categories: cat('Abarrotes'),
      users: { id: suppliers[1].id, company_name: suppliers[1].company_name, verified: true },
    }),
    buildProduct({
      id: uuidFromNumber(307),
      supplier_id: suppliers[2].id,
      category_id: cat('Frutas y verduras').id,
      name: 'Frambuesa IQF',
      description: 'Bolsa de 2.5 kg congelada.',
      price: 8800,
      price_unit: 'bolsa',
      stock: 240,
      stock_unit: 'bolsa',
      status: 'active',
      categories: cat('Frutas y verduras'),
      users: { id: suppliers[2].id, company_name: suppliers[2].company_name, verified: true },
    }),
    buildProduct({
      id: uuidFromNumber(308),
      supplier_id: suppliers[2].id,
      category_id: cat('Congelados IQF').id,
      name: 'Mix verduras congeladas',
      description: 'Mezcla para cocina de volumen.',
      price: 6200,
      price_unit: 'kg',
      stock: 310,
      stock_unit: 'kg',
      status: 'active',
      categories: cat('Congelados IQF'),
      users: { id: suppliers[2].id, company_name: suppliers[2].company_name, verified: true },
    }),
  ];

  const quoteRequests = [
    buildQuoteRequest({
      id: uuidFromNumber(401),
      buyer_id: buyers[0].id,
      requester_id: buyers[0].id,
      buyerName: buyers[0].company_name,
      buyerCity: buyers[0].city,
      buyerRut: buyers[0].rut,
      product_name: 'Harina premium 000',
      category_id: cat('Harinas y cereales').id,
      categories: cat('Harinas y cereales'),
      quantity: 500,
      unit: 'kg',
      delivery_date: '2026-04-01',
      notes: 'Entrega am, descarga en bodega',
      status: 'in_review',
      created_at: '2026-03-24T08:00:00Z',
    }),
    buildQuoteRequest({
      id: uuidFromNumber(402),
      buyer_id: buyers[1].id,
      requester_id: buyers[1].id,
      buyerName: buyers[1].company_name,
      buyerCity: buyers[1].city,
      buyerRut: buyers[1].rut,
      product_name: 'Queso gouda',
      category_id: cat('Lacteos').id,
      categories: cat('Lacteos'),
      quantity: 120,
      unit: 'kg',
      delivery_date: '2026-03-29',
      notes: 'Entrega semanal programada',
      status: 'closed',
      created_at: '2026-03-23T07:00:00Z',
    }),
    buildQuoteRequest({
      id: uuidFromNumber(403),
      buyer_id: buyers[2].id,
      requester_id: buyers[2].id,
      buyerName: buyers[2].company_name,
      buyerCity: buyers[2].city,
      buyerRut: buyers[2].rut,
      product_name: 'Aceite de oliva extra virgen',
      category_id: cat('Aceites y grasas').id,
      categories: cat('Aceites y grasas'),
      quantity: 90,
      unit: 'unidad',
      delivery_date: '2026-04-03',
      notes: 'Oferta anual',
      status: 'open',
      created_at: '2026-03-24T11:30:00Z',
    }),
    buildQuoteRequest({
      id: uuidFromNumber(404),
      buyer_id: buyers[3].id,
      requester_id: buyers[3].id,
      buyerName: buyers[3].company_name,
      buyerCity: buyers[3].city,
      buyerRut: buyers[3].rut,
      product_name: 'Frambuesa IQF',
      category_id: cat('Frutas y verduras').id,
      categories: cat('Frutas y verduras'),
      quantity: 250,
      unit: 'kg',
      delivery_date: '2026-04-04',
      notes: 'Para temporada alta',
      status: 'in_review',
      created_at: '2026-03-24T09:45:00Z',
    }),
    buildQuoteRequest({
      id: uuidFromNumber(405),
      buyer_id: buyers[0].id,
      requester_id: buyers[0].id,
      buyerName: buyers[0].company_name,
      buyerCity: buyers[0].city,
      buyerRut: buyers[0].rut,
      product_name: 'Azucar granulada',
      category_id: cat('Abarrotes').id,
      categories: cat('Abarrotes'),
      quantity: 300,
      unit: 'kg',
      delivery_date: '2026-04-02',
      notes: 'Entrega fraccionada',
      status: 'cancelled',
      created_at: '2026-03-22T10:00:00Z',
    }),
  ];

  const quoteOffers = [
    buildQuoteOffer({
      id: uuidFromNumber(501),
      quote_id: quoteRequests[0].id,
      quote_requests: quoteRequests[0],
      supplier_id: suppliers[0].id,
      responder_id: suppliers[0].id,
      supplierName: suppliers[0].company_name,
      supplierCity: suppliers[0].city,
      price: 1150,
      notes: 'Entrega en 48 hrs',
      estimated_lead_time: '2 dias',
      status: 'accepted',
      pipeline_status: 'won',
      created_at: '2026-03-24T10:00:00Z',
    }),
    buildQuoteOffer({
      id: uuidFromNumber(502),
      quote_id: quoteRequests[0].id,
      quote_requests: quoteRequests[0],
      supplier_id: suppliers[1].id,
      responder_id: suppliers[1].id,
      supplierName: suppliers[1].company_name,
      supplierCity: suppliers[1].city,
      price: 1190,
      notes: 'Precio por volumen mensual',
      estimated_lead_time: '3 dias',
      status: 'pending',
      pipeline_status: 'follow_up',
      created_at: '2026-03-24T10:15:00Z',
    }),
    buildQuoteOffer({
      id: uuidFromNumber(503),
      quote_id: quoteRequests[1].id,
      quote_requests: quoteRequests[1],
      supplier_id: suppliers[0].id,
      responder_id: suppliers[0].id,
      supplierName: suppliers[0].company_name,
      supplierCity: suppliers[0].city,
      price: 8400,
      notes: 'Oferta cerrada y facturable',
      estimated_lead_time: '5 dias',
      status: 'accepted',
      pipeline_status: 'won',
      created_at: '2026-03-24T08:30:00Z',
    }),
    buildQuoteOffer({
      id: uuidFromNumber(504),
      quote_id: quoteRequests[3].id,
      quote_requests: quoteRequests[3],
      supplier_id: suppliers[2].id,
      responder_id: suppliers[2].id,
      supplierName: suppliers[2].company_name,
      supplierCity: suppliers[2].city,
      price: 8700,
      notes: 'Despacho especial para temporada',
      estimated_lead_time: '4 dias',
      status: 'pending',
      pipeline_status: 'negotiation',
      created_at: '2026-03-24T11:00:00Z',
    }),
  ];

  const favorites = [
    buildFavorite({ id: uuidFromNumber(601), buyer_id: buyers[0].id, supplier_id: suppliers[0].id, users: suppliers[0], created_at: '2026-03-20T09:00:00Z' }),
    buildFavorite({ id: uuidFromNumber(602), buyer_id: buyers[0].id, supplier_id: suppliers[1].id, users: suppliers[1], created_at: '2026-03-21T09:00:00Z' }),
    buildFavorite({ id: uuidFromNumber(603), buyer_id: buyers[1].id, supplier_id: suppliers[0].id, users: suppliers[0], created_at: '2026-03-22T09:00:00Z' }),
    buildFavorite({ id: uuidFromNumber(604), buyer_id: buyers[3].id, supplier_id: suppliers[2].id, users: suppliers[2], created_at: '2026-03-23T09:00:00Z' }),
  ];

  const priceAlertSubscriptions = [
    buildPriceAlertSubscription({ id: uuidFromNumber(701), buyer_id: buyers[0].id, category_id: cat('Harinas y cereales').id, categories: cat('Harinas y cereales'), created_at: '2026-03-20T09:30:00Z' }),
    buildPriceAlertSubscription({ id: uuidFromNumber(702), buyer_id: buyers[0].id, product_id: products[1].id, categories: cat('Aceites y grasas'), products: products[1], created_at: '2026-03-20T10:30:00Z' }),
    buildPriceAlertSubscription({ id: uuidFromNumber(703), buyer_id: buyers[1].id, category_id: cat('Lacteos').id, categories: cat('Lacteos'), created_at: '2026-03-20T11:30:00Z' }),
    buildPriceAlertSubscription({ id: uuidFromNumber(704), buyer_id: buyers[2].id, product_id: products[6].id, categories: cat('Frutas y verduras'), products: products[6], created_at: '2026-03-20T12:30:00Z' }),
    buildPriceAlertSubscription({ id: uuidFromNumber(705), buyer_id: buyers[3].id, category_id: cat('Congelados IQF').id, categories: cat('Congelados IQF'), created_at: '2026-03-20T13:30:00Z' }),
  ];

  const priceAlerts = [
    buildPriceAlert({ id: uuidFromNumber(801), product_id: products[0].id, old_price: 1230, new_price: 1190, direction: 'down', created_at: '2026-03-24T12:00:00Z', products: products[0] }),
    buildPriceAlert({ id: uuidFromNumber(802), product_id: products[6].id, old_price: 9200, new_price: 8800, direction: 'down', created_at: '2026-03-24T12:30:00Z', products: products[6] }),
  ];

  const reviews = [
    buildReview({ id: uuidFromNumber(901), reviewer_id: buyers[0].id, reviewed_id: suppliers[0].id, quote_offer_id: quoteOffers[0].id, rating: 5, comment: 'Excelente respuesta y despacho rapido.', users: buyers[0], created_at: '2026-03-24T13:00:00Z' }),
    buildReview({ id: uuidFromNumber(902), reviewer_id: buyers[1].id, reviewed_id: suppliers[0].id, quote_offer_id: quoteOffers[2].id, rating: 4, comment: 'Buen cumplimiento y seguimiento.', users: buyers[1], created_at: '2026-03-24T13:20:00Z' }),
    buildReview({ id: uuidFromNumber(903), reviewer_id: buyers[3].id, reviewed_id: suppliers[2].id, quote_offer_id: quoteOffers[3].id, rating: 5, comment: 'Muy buena calidad para temporada alta.', users: buyers[3], created_at: '2026-03-24T13:40:00Z' }),
  ];

  const agents = [
    { id: uuidFromNumber(1001), supplier_id: suppliers[0].id, name: 'Asistente comercial Valle Frio', type: 'whatsapp_email', status: 'active', created_at: '2026-03-01T00:00:00Z' },
    { id: uuidFromNumber(1002), supplier_id: suppliers[1].id, name: 'Asistente comercial Molinos', type: 'email', status: 'active', created_at: '2026-03-01T00:00:00Z' },
    { id: uuidFromNumber(1003), supplier_id: suppliers[2].id, name: 'Asistente comercial AgroSur', type: 'voice', status: 'active', created_at: '2026-03-01T00:00:00Z' },
  ];

  const conversations = [
    { id: uuidFromNumber(1101), agent_id: agents[0].id, contact_name: 'Pasteleria Mozart', channel: 'email', started_at: '2026-03-24T14:00:00Z', status: 'active' },
    { id: uuidFromNumber(1102), agent_id: agents[2].id, contact_name: 'Catering Andes', channel: 'voice', started_at: '2026-03-24T15:00:00Z', status: 'active' },
  ];

  const messages = [
    { id: uuidFromNumber(1201), conversation_id: conversations[0].id, role: 'agent', content: 'Gracias por contactarnos. Podemos cotizar harina premium y aceites.', created_at: '2026-03-24T14:01:00Z' },
    { id: uuidFromNumber(1202), conversation_id: conversations[0].id, role: 'user', content: 'Necesito 500 kg para entrega la proxima semana.', created_at: '2026-03-24T14:02:00Z' },
    { id: uuidFromNumber(1203), conversation_id: conversations[1].id, role: 'agent', content: 'Tomamos tu solicitud de frambuesa IQF.', created_at: '2026-03-24T15:01:00Z' },
    { id: uuidFromNumber(1204), conversation_id: conversations[1].id, role: 'user', content: 'Quiero asegurar stock para temporada alta.', created_at: '2026-03-24T15:02:00Z' },
  ];

  return {
    admin,
    suppliers,
    buyers,
    products,
    quoteRequests,
    quoteOffers,
    favorites,
    priceAlertSubscriptions,
    priceAlerts,
    reviews,
    agents,
    conversations,
    messages,
  };
}

async function seed() {
  const lookups = await loadLookups();
  const seed = buildSeedData(lookups);
  const seededUserIds = [
    seed.admin.publicId,
    ...seed.suppliers.map((supplier) => supplier.id),
    ...seed.buyers.map((buyer) => buyer.id),
  ];

  await deleteSeedUsers(seededUserIds);

  const authUsers = new Map();
  for (const persona of [
    seed.admin,
    ...seed.suppliers.map((supplier) => ({
      publicId: supplier.id,
      email: supplier.email,
      password: DEFAULT_PASSWORD,
      company_name: supplier.company_name,
      rut: supplier.rut,
      city: supplier.city,
      address: supplier.address,
      description: supplier.description,
      phone: supplier.phone,
      whatsapp: supplier.whatsapp,
      website: supplier.website,
      is_admin: false,
      is_buyer: Boolean(supplier.is_buyer),
      is_supplier: true,
      verified: supplier.verified,
    })),
    ...seed.buyers.map((buyer) => ({
      publicId: buyer.id,
      email: buyer.email,
      password: DEFAULT_PASSWORD,
      company_name: buyer.company_name,
      rut: buyer.rut,
      city: buyer.city,
      address: buyer.address,
      description: buyer.description,
      phone: buyer.phone,
      whatsapp: buyer.whatsapp,
      website: buyer.website,
      is_admin: false,
      is_buyer: true,
      is_supplier: Boolean(buyer.is_supplier),
      verified: buyer.verified,
    })),
  ]) {
    const authUser = await ensureAuthUser(persona);
    authUsers.set(persona.publicId, authUser.id);
  }

  const publicUsers = [
    {
      id: seed.admin.publicId,
      auth_id: authUsers.get(seed.admin.publicId),
      email: seed.admin.email,
      company_name: seed.admin.company_name,
      rut: seed.admin.rut,
      city: seed.admin.city,
      address: seed.admin.address,
      description: seed.admin.description,
      phone: seed.admin.phone,
      whatsapp: seed.admin.whatsapp,
      website: seed.admin.website,
      is_supplier: false,
      is_buyer: false,
      is_admin: true,
      verified: true,
    },
    ...seed.suppliers.map((supplier) => ({
      id: supplier.id,
      auth_id: authUsers.get(supplier.id),
      email: supplier.email,
      company_name: supplier.company_name,
      rut: supplier.rut,
      city: supplier.city,
      address: supplier.address,
      description: supplier.description,
      phone: supplier.phone,
      whatsapp: supplier.whatsapp,
      website: supplier.website,
      is_supplier: true,
      is_buyer: Boolean(supplier.is_buyer),
      is_admin: false,
      verified: supplier.verified,
    })),
    ...seed.buyers.map((buyer) => ({
      id: buyer.id,
      auth_id: authUsers.get(buyer.id),
      email: buyer.email,
      company_name: buyer.company_name,
      rut: buyer.rut,
      city: buyer.city,
      address: buyer.address,
      description: buyer.description,
      phone: buyer.phone,
      whatsapp: buyer.whatsapp,
      website: buyer.website,
      is_supplier: Boolean(buyer.is_supplier),
      is_buyer: true,
      is_admin: false,
      verified: buyer.verified,
    })),
  ];

  await upsertRows('users', publicUsers, 'email');

  const buyerProfiles = seed.buyers.map((buyer) => ({
    user_id: buyer.id,
    business_type: buyer.buyer_profiles.business_type,
    monthly_volume: buyer.buyer_profiles.monthly_volume,
    preferred_contact: buyer.buyer_profiles.preferred_contact,
  }));
  const supplierProfiles = seed.suppliers.map((supplier) => ({
    user_id: supplier.id,
    giro: supplier.supplier_profiles.giro,
    response_rate: supplier.supplier_profiles.response_rate,
  }));

  await upsertRows('buyer_profiles', buyerProfiles, 'user_id');
  await upsertRows('supplier_profiles', supplierProfiles, 'user_id');

  const categoryRows = [
    ...seed.buyers.flatMap((buyer) => (buyer.user_categories ?? []).map((link) => ({
      user_id: buyer.id,
      category_id: link.category_id,
      scope: link.scope,
    }))),
    ...seed.suppliers.flatMap((supplier) => (supplier.user_categories ?? []).map((link) => ({
      user_id: supplier.id,
      category_id: link.category_id,
      scope: link.scope,
    }))),
  ];
  await upsertRows('user_categories', categoryRows, 'user_id,category_id,scope');

  const subscriptionRows = seed.suppliers.map((supplier, index) => {
    const subscription = takeSingle(supplier.subscriptions);
    return {
      id: subscription?.id || uuidFromNumber(1300 + index),
      supplier_id: supplier.id,
      plan_id: subscription?.plan_id || lookups.plansByName.get('starter').id,
      status: subscription?.status || 'active',
      started_at: subscription?.started_at || new Date('2026-03-01T00:00:00Z').toISOString(),
      expires_at: subscription?.expires_at || new Date('2026-04-01T00:00:00Z').toISOString(),
    };
  });
  await upsertRows('subscriptions', subscriptionRows, 'id');

  await upsertRows('products', seed.products.map((product) => stripRelationFields(product, ['categories', 'users'])), 'id');
  await upsertRows('quote_requests', seed.quoteRequests.map(normalizeQuoteRequestRow), 'id');
  await upsertRows('quote_offers', seed.quoteOffers.map(normalizeQuoteOfferRow), 'id');
  await upsertRows('favorites', seed.favorites.map((favorite) => ({
    buyer_id: favorite.buyer_id,
    supplier_id: favorite.supplier_id,
    created_at: favorite.created_at,
  })), 'buyer_id,supplier_id');
  await upsertRows('price_alert_subscriptions', seed.priceAlertSubscriptions.map((subscription) => ({
    id: subscription.id,
    buyer_id: subscription.buyer_id,
    category_id: subscription.category_id ?? null,
    product_id: subscription.product_id ?? null,
  })), 'id');
  await upsertRows('price_alerts', seed.priceAlerts.map((alert) => stripRelationFields(alert, ['products'])), 'id');
  await upsertRows('reviews', seed.reviews.map((review) => stripRelationFields(review, ['users'])), 'id');
  await upsertRows('ai_agents', seed.agents, 'id');
  await upsertRows('agent_conversations', seed.conversations, 'id');
  await upsertRows('agent_messages', seed.messages, 'id');

  const counts = {
    users: publicUsers.length,
    products: seed.products.length,
    quotes: seed.quoteRequests.length,
    offers: seed.quoteOffers.length,
    favorites: seed.favorites.length,
    alerts: seed.priceAlerts.length,
    agents: seed.agents.length,
  };

  console.log('Backfill completado.');
  console.log(JSON.stringify(counts, null, 2));
  console.log('');
  console.log('Cuentas de prueba:');
  console.log(`- admin@zentra.cl / ${DEFAULT_PASSWORD}`);
  console.log(`- ventas@vallefrio.cl / ${DEFAULT_PASSWORD}`);
  console.log(`- contacto@molinosdelsur.cl / ${DEFAULT_PASSWORD}`);
  console.log(`- ventas@agrosur.cl / ${DEFAULT_PASSWORD}`);
  console.log(`- compras@mozart.cl / ${DEFAULT_PASSWORD}`);
  console.log(`- compras@ritz.cl / ${DEFAULT_PASSWORD}`);
  console.log(`- abastecimiento@puertosur.cl / ${DEFAULT_PASSWORD}`);
  console.log(`- compras@cateringandes.cl / ${DEFAULT_PASSWORD}`);
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
