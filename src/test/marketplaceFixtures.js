const DEFAULT_CATEGORY_EMOJIS = {
  'Harinas y cereales': '🌾',
  Lacteos: '🧀',
  'Carnes y cecinas': '🥩',
  'Frutas y verduras': '🥬',
  Abarrotes: '📦',
  Otros: '🍽️',
};

function takeSingle(value) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function makeStableUuid(seed) {
  const chars = Array.from(String(seed));
  const hash = chars.reduce((total, char) => ((total * 31) + char.charCodeAt(0)) % 1_000_000_000_000, 0);
  return `00000000-0000-4000-8000-${String(hash).padStart(12, '0')}`;
}

export function buildCategory(overrides = {}) {
  const name = overrides.name ?? 'Harinas y cereales';

  return {
    id: overrides.id ?? `cat-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name,
    emoji: overrides.emoji ?? DEFAULT_CATEGORY_EMOJIS[name] ?? '🍽️',
    ...overrides,
  };
}

export function buildPlan(overrides = {}) {
  const name = overrides.name ?? 'starter';

  return {
    id: overrides.id ?? `plan-${name}`,
    name,
    price_clp: overrides.price_clp ?? 150000,
    has_agents: overrides.has_agents ?? false,
    has_voice_calls: overrides.has_voice_calls ?? false,
    has_crm: overrides.has_crm ?? false,
    has_api: overrides.has_api ?? false,
    max_active_products: overrides.max_active_products ?? 25,
    max_quote_responses_per_month: overrides.max_quote_responses_per_month ?? 20,
    max_ai_conversations_per_month: overrides.max_ai_conversations_per_month ?? 0,
    max_voice_calls_per_month: overrides.max_voice_calls_per_month ?? 0,
  };
}

export function buildSubscription(plan, overrides = {}) {
  const planRecord = takeSingle(plan) ?? buildPlan();
  const supplierId = overrides.supplier_id ?? 'supplier-1';

  return {
    id: overrides.id ?? makeStableUuid(`subscription:${planRecord.id}:${supplierId}`),
    supplier_id: supplierId,
    plan_id: overrides.plan_id ?? planRecord.id,
    status: overrides.status ?? 'active',
    expires_at: overrides.expires_at ?? '2026-12-31T00:00:00Z',
    plans: planRecord,
    ...overrides,
  };
}

export function buildBuyerUser(overrides = {}) {
  const buyerCategories = overrides.buyerCategories ?? [
    buildCategory({ id: 'cat-1', name: 'Harinas y cereales', emoji: '🌾' }),
  ];

  return {
    id: overrides.id ?? 'buyer-1',
    company_name: overrides.company_name ?? 'Pasteleria Mozart',
    email: overrides.email ?? 'compras@mozart.cl',
    description: overrides.description ?? 'Pasteleria y reposteria gourmet',
    rut: overrides.rut ?? '72.345.678-9',
    city: overrides.city ?? 'Santiago',
    address: overrides.address ?? 'Av. Italia 1580',
    phone: overrides.phone ?? '+56 2 2987 6543',
    whatsapp: overrides.whatsapp ?? '+56 9 1234 5678',
    website: overrides.website ?? '',
    verified: overrides.verified ?? true,
    created_at: overrides.created_at ?? '2026-01-10T00:00:00Z',
    is_buyer: true,
    is_supplier: false,
    buyer_profiles: overrides.buyer_profiles ?? {
      business_type: 'pasteleria',
      monthly_volume: '2000 kg',
      preferred_contact: 'email',
    },
    supplier_profiles: overrides.supplier_profiles ?? null,
    user_categories: overrides.user_categories ?? buyerCategories.map((category) => ({
      scope: 'buyer_interest',
      category_id: category.id,
      categories: category,
    })),
    subscriptions: overrides.subscriptions ?? [],
    buyerProfile: overrides.buyerProfile,
    buyerCategories,
    supplierCategories: overrides.supplierCategories ?? [],
  };
}

export function buildSupplierUser(overrides = {}) {
  const supplierCategories = overrides.supplierCategories ?? [
    buildCategory({ id: 'cat-1', name: 'Harinas y cereales', emoji: '🌾' }),
    buildCategory({ id: 'cat-2', name: 'Lacteos', emoji: '🧀' }),
  ];
  const products = overrides.products ?? [];
  const plan = overrides.plan ?? buildPlan({
    id: 'plan-2',
    name: 'pro',
    price_clp: 280000,
    has_agents: true,
    has_voice_calls: true,
    max_active_products: 200,
    max_quote_responses_per_month: 250,
    max_ai_conversations_per_month: 200,
    max_voice_calls_per_month: 200,
  });

  return {
    id: overrides.id ?? 'supplier-1',
    company_name: overrides.company_name ?? 'Valle Frio SpA',
    email: overrides.email ?? 'ventas@vallefrio.cl',
    description: overrides.description ?? 'Distribuidor mayorista de insumos alimentarios',
    rut: overrides.rut ?? '76.234.567-8',
    city: overrides.city ?? 'Santiago',
    address: overrides.address ?? 'Av. Providencia 1234',
    phone: overrides.phone ?? '+56 2 2345 6789',
    whatsapp: overrides.whatsapp ?? '+56 9 8765 4321',
    website: overrides.website ?? 'www.vallefrio.cl',
    verified: overrides.verified ?? true,
    created_at: overrides.created_at ?? '2026-01-10T00:00:00Z',
    is_buyer: overrides.is_buyer ?? true,
    is_supplier: true,
    supplier_profiles: overrides.supplier_profiles ?? {
      giro: 'Distribucion mayorista de alimentos',
      response_rate: 84,
    },
    buyer_profiles: overrides.buyer_profiles ?? null,
    user_categories: overrides.user_categories ?? supplierCategories.map((category) => ({
      scope: 'supplier_catalog',
      category_id: category.id,
      categories: category,
    })),
    products,
    subscriptions: overrides.subscriptions ?? [buildSubscription(plan, { supplier_id: overrides.id ?? 'supplier-1' })],
    supplierProfile: overrides.supplierProfile,
    supplierCategories,
    activeSubscription: overrides.activeSubscription,
  };
}

export function buildProduct(overrides = {}) {
  const category = takeSingle(overrides.categories) ?? buildCategory({
    id: overrides.category_id ?? 'cat-1',
    name: overrides.categoryName ?? 'Harinas y cereales',
  });
  const supplier = takeSingle(overrides.users) ?? { id: overrides.supplier_id ?? 'supplier-1', company_name: overrides.supplierName ?? 'Valle Frio SpA' };

  return {
    id: overrides.id ?? 'prod-1',
    supplier_id: overrides.supplier_id ?? supplier.id,
    category_id: overrides.category_id ?? category.id,
    name: overrides.name ?? 'Harina premium',
    description: overrides.description ?? 'Harina panadera premium',
    price: overrides.price ?? 1200,
    price_unit: overrides.price_unit ?? 'kg',
    stock: overrides.stock ?? 150,
    stock_unit: overrides.stock_unit ?? 'kg',
    status: overrides.status ?? 'active',
    image_url: overrides.image_url ?? null,
    created_at: overrides.created_at ?? '2026-03-24T08:00:00Z',
    categories: category,
    users: supplier,
    ...overrides,
  };
}

export function buildQuoteOffer(overrides = {}) {
  const supplier = takeSingle(overrides.users) ?? {
    id: overrides.supplier_id ?? 'supplier-1',
    company_name: overrides.supplierName ?? 'Valle Frio SpA',
    city: overrides.supplierCity ?? 'Santiago',
    verified: overrides.supplierVerified ?? true,
  };
  const quote = takeSingle(overrides.quote_requests) ?? buildQuoteRequest({
    id: overrides.quote_id ?? 'quote-1',
    buyer_id: overrides.buyer_id ?? 'buyer-1',
    product_name: overrides.product_name ?? 'Harina premium',
  });

  return {
    id: overrides.id ?? 'offer-1',
    quote_id: overrides.quote_id ?? quote.id,
    supplier_id: overrides.supplier_id ?? supplier.id,
    responder_id: overrides.responder_id ?? supplier.id,
    price: overrides.price ?? 1200,
    notes: overrides.notes ?? 'Entrega rapida',
    estimated_lead_time: overrides.estimated_lead_time ?? '2 dias',
    status: overrides.status ?? 'pending',
    pipeline_status: overrides.pipeline_status ?? 'submitted',
    created_at: overrides.created_at ?? '2026-03-24T09:15:00Z',
    users: supplier,
    quote_requests: quote,
    ...overrides,
  };
}

export function buildQuoteRequest(overrides = {}) {
  const category = takeSingle(overrides.categories) ?? buildCategory({
    id: overrides.category_id ?? 'cat-1',
    name: overrides.categoryName ?? 'Harinas y cereales',
  });
  const buyer = takeSingle(overrides.users) ?? {
    id: overrides.buyer_id ?? 'buyer-1',
    company_name: overrides.buyerName ?? 'Pasteleria Mozart Ltda.',
    city: overrides.buyerCity ?? 'Santiago',
    rut: overrides.buyerRut ?? '72.345.678-9',
    verified: overrides.buyerVerified ?? true,
  };

  return {
    id: overrides.id ?? 'quote-1',
    buyer_id: overrides.buyer_id ?? buyer.id,
    requester_id: overrides.requester_id ?? buyer.id,
    product_name: overrides.product_name ?? 'Harina premium',
    category_id: overrides.category_id ?? category.id,
    quantity: overrides.quantity ?? 500,
    unit: overrides.unit ?? 'kg',
    delivery_date: overrides.delivery_date ?? '2026-03-30',
    notes: overrides.notes ?? 'Entrega AM',
    status: overrides.status ?? 'in_review',
    created_at: overrides.created_at ?? '2026-03-24T08:00:00Z',
    categories: category,
    users: buyer,
    quote_offers: overrides.quote_offers ?? [],
    ...overrides,
  };
}

export function buildFavorite(overrides = {}) {
  const supplier = takeSingle(overrides.users) ?? buildSupplierUser({
    id: overrides.supplier_id ?? 'supplier-1',
    company_name: overrides.company_name ?? 'Valle Frio SpA',
  });

  return {
    created_at: overrides.created_at ?? '2026-03-24T09:00:00Z',
    buyer_id: overrides.buyer_id ?? 'buyer-1',
    supplier_id: overrides.supplier_id ?? supplier.id,
    users: supplier,
    ...overrides,
  };
}

export function buildPriceAlertSubscription(overrides = {}) {
  const category = takeSingle(overrides.categories) ?? buildCategory({
    id: overrides.category_id ?? 'cat-1',
    name: overrides.categoryName ?? 'Harinas y cereales',
  });
  const product = takeSingle(overrides.products) ?? (overrides.product_id ? buildProduct({
    id: overrides.product_id,
    category_id: category.id,
    categoryName: category.name,
    name: overrides.productName ?? 'Harina premium',
  }) : null);

  return {
    id: overrides.id ?? 'subscription-1',
    buyer_id: overrides.buyer_id ?? 'buyer-1',
    category_id: overrides.category_id ?? category.id,
    product_id: overrides.product_id ?? null,
    categories: category,
    products: product,
    created_at: overrides.created_at ?? '2026-03-24T10:00:00Z',
    ...overrides,
  };
}

export function buildPriceAlert(overrides = {}) {
  const product = takeSingle(overrides.products) ?? buildProduct({
    id: overrides.product_id ?? 'prod-1',
    category_id: overrides.category_id ?? 'cat-1',
    categoryName: overrides.categoryName ?? 'Harinas y cereales',
    supplier_id: overrides.supplier_id ?? 'supplier-1',
  });

  return {
    id: overrides.id ?? 'alert-1',
    product_id: overrides.product_id ?? product.id,
    old_price: overrides.old_price ?? 1350,
    new_price: overrides.new_price ?? 1200,
    direction: overrides.direction ?? 'down',
    created_at: overrides.created_at ?? '2026-03-24T10:00:00Z',
    products: product,
    ...overrides,
  };
}

export function buildReview(overrides = {}) {
  const reviewer = takeSingle(overrides.users) ?? buildBuyerUser({
    id: overrides.reviewer_id ?? 'buyer-1',
    company_name: overrides.reviewerName ?? 'Pasteleria Mozart Ltda.',
  });

  return {
    id: overrides.id ?? 'review-1',
    reviewer_id: overrides.reviewer_id ?? reviewer.id,
    reviewed_id: overrides.reviewed_id ?? 'supplier-1',
    quote_offer_id: overrides.quote_offer_id ?? 'offer-1',
    rating: overrides.rating ?? 5,
    comment: overrides.comment ?? 'Entrega puntual y excelente calidad.',
    created_at: overrides.created_at ?? '2026-03-24T10:30:00Z',
    users: reviewer,
    ...overrides,
  };
}

export function buildMarketplaceSeed(overrides = {}) {
  const starterPlan = buildPlan({
    id: 'plan-1',
    name: 'starter',
    price_clp: 150000,
    has_agents: false,
    has_voice_calls: false,
    max_active_products: 25,
    max_quote_responses_per_month: 20,
    max_ai_conversations_per_month: 0,
    max_voice_calls_per_month: 0,
  });
  const proPlan = buildPlan({
    id: 'plan-2',
    name: 'pro',
    price_clp: 280000,
    has_agents: true,
    has_voice_calls: true,
    max_active_products: 200,
    max_quote_responses_per_month: 250,
    max_ai_conversations_per_month: 200,
    max_voice_calls_per_month: 200,
  });
  const enterprisePlan = buildPlan({
    id: 'plan-3',
    name: 'enterprise',
    price_clp: 400000,
    has_agents: true,
    has_voice_calls: true,
    has_crm: true,
    has_api: true,
    max_active_products: null,
    max_quote_responses_per_month: null,
    max_ai_conversations_per_month: null,
    max_voice_calls_per_month: null,
  });

  const categories = overrides.categories ?? [
    buildCategory({ id: 'cat-1', name: 'Harinas y cereales', emoji: '🌾' }),
    buildCategory({ id: 'cat-2', name: 'Lacteos', emoji: '🧀' }),
    buildCategory({ id: 'cat-3', name: 'Frutas y verduras', emoji: '🥬' }),
  ];

  const supplierSubscription = buildSubscription(proPlan, { supplier_id: 'supplier-1' });
  const buyer = buildBuyerUser({ buyerCategories: [categories[0]] });
  const secondBuyer = buildBuyerUser({
    id: 'buyer-2',
    company_name: 'Hotel Ritz Santiago',
    email: 'compras@ritz.cl',
    description: 'Hotel boutique con cocina de alto volumen',
    rut: '96.789.012-3',
    city: 'Santiago',
    address: 'Av. Kennedy 5555',
    phone: '+56 2 2211 3344',
    whatsapp: '+56 9 4555 6677',
    verified: false,
    created_at: '2026-01-12T00:00:00Z',
    buyerCategories: [categories[1]],
  });
  const supplier = buildSupplierUser({
    supplierCategories: [categories[0], categories[1]],
    subscriptions: [supplierSubscription],
    activeSubscription: supplierSubscription,
  });
  const product = buildProduct({
    id: 'prod-1',
    supplier_id: supplier.id,
    category_id: categories[0].id,
    name: 'Harina premium',
    description: 'Harina panadera premium',
    price: 1200,
    stock: 150,
    categories: categories[0],
    users: { id: supplier.id, company_name: supplier.company_name, verified: supplier.verified },
  });
  const secondProduct = buildProduct({
    id: 'prod-2',
    supplier_id: supplier.id,
    category_id: categories[1].id,
    name: 'Queso gouda',
    description: 'Queso semi madurado para cocina profesional',
    price: 8500,
    stock: 18,
    status: 'low_stock',
    categories: categories[1],
    users: { id: supplier.id, company_name: supplier.company_name, verified: supplier.verified },
  });
  const quote = buildQuoteRequest({
    id: 'quote-1',
    buyer_id: buyer.id,
    requester_id: buyer.id,
    buyerName: buyer.company_name,
    buyerCity: buyer.city,
    buyerRut: buyer.rut,
    product_name: 'Harina premium',
    category_id: categories[0].id,
    categories: categories[0],
    quantity: 500,
    unit: 'kg',
    delivery_date: '2026-03-30',
    notes: 'Entrega AM',
    status: 'in_review',
    created_at: '2026-03-24T08:00:00Z',
  });
  const closedQuote = buildQuoteRequest({
    id: 'quote-2',
    buyer_id: secondBuyer.id,
    requester_id: secondBuyer.id,
    buyerName: secondBuyer.company_name,
    buyerCity: secondBuyer.city,
    buyerRut: secondBuyer.rut,
    product_name: 'Queso gouda',
    category_id: categories[1].id,
    categories: categories[1],
    quantity: 120,
    unit: 'kg',
    delivery_date: '2026-03-29',
    notes: 'Entrega semanal',
    status: 'closed',
    created_at: '2026-03-23T07:00:00Z',
  });
  const offer = buildQuoteOffer({
    id: 'offer-1',
    quote_id: quote.id,
    quote_requests: quote,
    supplier_id: supplier.id,
    responder_id: supplier.id,
    supplierName: supplier.company_name,
    supplierCity: supplier.city,
    price: 1200,
    notes: 'Entrega rapida',
    estimated_lead_time: '2 dias',
    status: 'pending',
    pipeline_status: 'submitted',
  });
  const acceptedOffer = buildQuoteOffer({
    id: 'offer-2',
    quote_id: closedQuote.id,
    quote_requests: closedQuote,
    supplier_id: supplier.id,
    responder_id: supplier.id,
    supplierName: supplier.company_name,
    supplierCity: supplier.city,
    price: 8500,
    notes: 'Oferta aceptada',
    estimated_lead_time: '5 dias',
    status: 'accepted',
    pipeline_status: 'won',
    created_at: '2026-03-24T07:00:00Z',
  });
  quote.quote_offers = [offer];
  closedQuote.quote_offers = [acceptedOffer];
  const favorite = buildFavorite({ supplier_id: supplier.id, users: supplier });
  const alertSubscription = buildPriceAlertSubscription({
    id: 'subscription-1',
    buyer_id: buyer.id,
    category_id: categories[0].id,
    categories: categories[0],
  });
  const alert = buildPriceAlert({
    id: 'alert-1',
    product_id: product.id,
    category_id: categories[0].id,
    products: product,
  });
  const review = buildReview({
    id: 'review-1',
    reviewed_id: supplier.id,
    reviewer_id: buyer.id,
    users: buyer,
  });

  return {
    categories,
    plans: [starterPlan, proPlan, enterprisePlan],
    buyer,
    supplier,
    products: [product, secondProduct],
    quoteRequests: [quote, closedQuote],
    quoteOffers: [offer, acceptedOffer],
    favorites: [favorite],
    priceAlertSubscriptions: [alertSubscription],
    priceAlerts: [alert],
    reviews: [review],
    agents: [
      {
        id: 'agent-1',
        supplier_id: supplier.id,
        name: 'Asistente comercial',
        channel: 'text',
        created_at: '2026-03-01T00:00:00Z',
      },
    ],
    conversations: [],
    messages: [],
  };
}
