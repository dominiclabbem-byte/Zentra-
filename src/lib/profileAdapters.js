export const BUYER_CATEGORY_SCOPE = 'buyer_interest';
export const SUPPLIER_CATEGORY_SCOPE = 'supplier_catalog';

export const BUSINESS_TYPE_OPTIONS = [
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'pasteleria', label: 'Pasteleria' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'catering', label: 'Catering' },
  { value: 'panaderia', label: 'Panaderia' },
  { value: 'industria_alimentaria', label: 'Industria alimentaria' },
  { value: 'supermercado', label: 'Supermercado' },
  { value: 'casino_institucional', label: 'Casino institucional' },
];

export const CONTACT_METHOD_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'llamada', label: 'Llamada' },
];

const PLAN_FEATURES = {
  starter: ['Email automatizado', 'Hasta 50 contactos/mes', 'Reportes basicos', 'Soporte por email'],
  pro: ['Email + WhatsApp', '200 llamadas IA incluidas', 'Hasta 200 contactos/mes', 'Agentes de venta IA', 'Reportes avanzados', 'Soporte prioritario'],
  enterprise: ['Agente IA con voz personalizada', 'Agentes de venta IA ilimitados', 'Contactos ilimitados', 'CRM integrado', 'Gerente de cuenta dedicado', 'API access'],
};

function takeSingle(value) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function extractCategory(categoryNode) {
  const category = takeSingle(categoryNode);
  if (!category) return null;
  return {
    id: category.id ?? category.name,
    name: category.name,
    emoji: category.emoji ?? '🍽️',
  };
}

function extractCategories(categoryLinks = []) {
  return categoryLinks
    .map((link) => extractCategory(link?.categories))
    .filter(Boolean)
    .reduce((unique, category) => {
      if (unique.some((item) => item.id === category.id)) return unique;
      return [...unique, category];
    }, []);
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function getBusinessTypeLabel(value) {
  return BUSINESS_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value ?? '';
}

export function getContactMethodLabel(value) {
  return CONTACT_METHOD_OPTIONS.find((option) => option.value === value)?.label ?? value ?? '';
}

export function formatPlanName(value) {
  if (!value) return 'Sin plan';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatCLP(value) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function mapPlanRowToCard(planRow) {
  const planKey = planRow?.name ?? 'starter';

  return {
    id: planRow?.id ?? planKey,
    key: planKey,
    name: formatPlanName(planKey),
    price: formatCLP(planRow?.price_clp ?? 0),
    period: '/mes',
    features: PLAN_FEATURES[planKey] ?? [],
    highlight: planKey === 'pro',
    hasAgents: Boolean(planRow?.has_agents),
    hasVoiceCalls: Boolean(planRow?.has_voice_calls),
    hasCrm: Boolean(planRow?.has_crm),
    hasApi: Boolean(planRow?.has_api),
    maxActiveProducts: planRow?.max_active_products ?? null,
    maxQuoteResponsesPerMonth: planRow?.max_quote_responses_per_month ?? null,
    maxAiConversationsPerMonth: planRow?.max_ai_conversations_per_month ?? null,
    maxVoiceCallsPerMonth: planRow?.max_voice_calls_per_month ?? null,
  };
}

export function getDefaultDashboardPath(user) {
  if (user?.is_admin) return '/dashboard-admin';
  if (user?.is_supplier) return '/dashboard-proveedor';
  if (user?.is_buyer) return '/dashboard-comprador';
  return '/';
}

export function normalizeUserRecord(record) {
  if (!record) return null;

  const buyerProfile = takeSingle(record.buyer_profiles);
  const supplierProfile = takeSingle(record.supplier_profiles);
  const subscriptions = Array.isArray(record.subscriptions) ? record.subscriptions : [];
  const activeSubscription = subscriptions.find((subscription) => subscription.status === 'active')
    ?? subscriptions.find((subscription) => subscription.status === 'pending_payment')
    ?? subscriptions[0]
    ?? null;
  const pendingSubscription = subscriptions.find((subscription) => subscription.status === 'pending_payment') ?? null;
  const categoryLinks = Array.isArray(record.user_categories) ? record.user_categories : [];
  const buyerLinks = categoryLinks.filter((link) => link?.scope === BUYER_CATEGORY_SCOPE);
  const supplierLinks = categoryLinks.filter((link) => link?.scope === SUPPLIER_CATEGORY_SCOPE);
  const legacyCategories = (!buyerLinks.length && !supplierLinks.length) ? extractCategories(categoryLinks) : [];
  const buyerCategories = buyerLinks.length ? extractCategories(buyerLinks) : (record.is_buyer ? legacyCategories : []);
  const supplierCategories = supplierLinks.length ? extractCategories(supplierLinks) : (record.is_supplier ? legacyCategories : []);

  return {
    ...record,
    is_admin: Boolean(record.is_admin),
    buyerProfile,
    supplierProfile,
    buyerCategories,
    supplierCategories,
    activeSubscription,
    pendingSubscription,
  };
}

export function buildBuyerProfileView(user) {
  const buyerProfile = user?.buyerProfile ?? {};

  return {
    companyName: user?.company_name ?? '',
    initials: getInitials(user?.company_name ?? ''),
    description: user?.description ?? '',
    rut: user?.rut ?? '',
    city: user?.city ?? '',
    address: user?.address ?? '',
    businessType: getBusinessTypeLabel(buyerProfile.business_type),
    businessTypeValue: buyerProfile.business_type ?? '',
    monthlyVolume: buyerProfile.monthly_volume ?? '',
    contactMethod: getContactMethodLabel(buyerProfile.preferred_contact),
    contactMethodValue: buyerProfile.preferred_contact ?? 'email',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    whatsapp: user?.whatsapp ?? '',
    website: user?.website ?? '',
    categories: user?.buyerCategories?.map((category) => category.name) ?? [],
    descriptionShort: user?.description ?? '',
    frequentProducts: [],
  };
}

export function buildSupplierProfileView(user) {
  const supplierProfile = user?.supplierProfile ?? {};

  return {
    companyName: user?.company_name ?? '',
    initials: getInitials(user?.company_name ?? ''),
    description: user?.description ?? '',
    rut: user?.rut ?? '',
    city: user?.city ?? '',
    address: user?.address ?? '',
    giro: supplierProfile.giro ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    whatsapp: user?.whatsapp ?? '',
    website: user?.website ?? '',
    categories: user?.supplierCategories?.map((category) => category.name) ?? [],
    responseRate: supplierProfile.response_rate ?? 0,
  };
}

export function getPlanKey(user) {
  return user?.activeSubscription?.plans?.name ?? user?.activeSubscription?.plan?.name ?? null;
}

export function formatMemberSince(dateValue) {
  if (!dateValue) return '';

  return new Intl.DateTimeFormat('es-CL', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateValue));
}
