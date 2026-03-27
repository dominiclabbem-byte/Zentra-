import { supabase } from './supabase';

const USER_PROFILE_SELECT = `
  *,
  buyer_profiles(*),
  supplier_profiles(*),
  user_categories(scope, category_id, categories(id, name, emoji)),
  subscriptions(*, plans(*))
`;

const SUPPLIER_CATEGORY_SCOPE = 'supplier_catalog';
const SUPPLIER_RELEVANT_QUOTE_SELECT = `
  *,
  categories(id, name, emoji),
  users!buyer_id(company_name, city, rut, verified),
  quote_offers(
    id,
    quote_id,
    supplier_id,
    responder_id,
    price,
    notes,
    estimated_lead_time,
    status,
    pipeline_status,
    created_at,
    users!supplier_id(company_name, city, verified)
  )
`;

function takeSingle(value) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

async function getUserCategoryIds(userId, scope) {
  const { data, error } = await supabase
    .from('user_categories')
    .select('category_id')
    .eq('user_id', userId)
    .eq('scope', scope);

  if (error) throw error;

  return (data ?? [])
    .map((row) => row.category_id)
    .filter(Boolean);
}

// ========================
// AUTH
// ========================

export async function signUp({ email, password, companyName, rut, city, isSupplier, isBuyer }) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  if (authError) throw authError;

  const { data, error } = await supabase
    .from('users')
    .insert({
      auth_id: authData.user.id,
      email,
      company_name: companyName,
      rut,
      city,
      is_supplier: isSupplier,
      is_buyer: isBuyer,
    })
    .select()
    .single();
  if (error) throw error;

  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select(USER_PROFILE_SELECT)
    .eq('auth_id', user.id)
    .single();
  if (error) throw error;

  return data;
}

// ========================
// USERS & PROFILES
// ========================

export async function updateUser(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function enableBuyerRole(userId, buyerData) {
  // Activar rol comprador para un proveedor (modo distribuidor)
  await supabase.from('users').update({ is_buyer: true }).eq('id', userId);

  const { data, error } = await supabase
    .from('buyer_profiles')
    .upsert({ user_id: userId, ...buyerData })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSupplierProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      supplier_profiles(*),
      user_categories(scope, category_id, categories(id, name, emoji)),
      products(*, categories(name, emoji)),
      subscriptions(*, plans(*))
    `)
    .eq('id', userId)
    .eq('is_supplier', true)
    .single();
  if (error) throw error;
  return data;
}

export async function getBuyerProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      buyer_profiles(*),
      user_categories(scope, category_id, categories(id, name, emoji))
    `)
    .eq('id', userId)
    .eq('is_buyer', true)
    .single();
  if (error) throw error;
  return data;
}

// ========================
// PRODUCTS
// ========================

export async function getProducts(filters = {}) {
  let query = supabase
    .from('products')
    .select('*, categories(name, emoji), users!supplier_id(company_name)');

  if (filters.status) {
    query = Array.isArray(filters.status)
      ? query.in('status', filters.status)
      : query.eq('status', filters.status);
  } else if (!filters.includeAllStatuses) {
    query = query.eq('status', 'active');
  }

  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters.supplierId) query = query.eq('supplier_id', filters.supplierId);
  if (filters.search) query = query.ilike('name', `%${filters.search}%`);

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createProduct(product) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProduct(productId, updates) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(productId) {
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
}

// ========================
// COTIZACIONES
// ========================

export async function createQuoteRequest(quote) {
  const { data, error } = await supabase
    .from('quote_requests')
    .insert(quote)
    .select(`
      *,
      categories(id, name, emoji),
      quote_offers(
        *,
        users!supplier_id(company_name, city, verified)
      )
    `)
    .single();
  if (error) throw error;
  return data;
}

export async function getQuoteRequestsForBuyer(buyerId) {
  const { data, error } = await supabase
    .from('quote_requests')
    .select(`
      *,
      categories(id, name, emoji),
      quote_offers(
        *,
        users!supplier_id(company_name, city, verified)
      )
    `)
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getOpenQuoteRequests() {
  const { data, error } = await supabase
    .from('quote_requests')
    .select(`
      *,
      categories(id, name, emoji),
      users!buyer_id(company_name, city, rut, verified),
      quote_offers(id, supplier_id, status, pipeline_status)
    `)
    .in('status', ['open', 'in_review'])
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getRelevantQuoteRequestsForSupplier(supplierId, filters = {}) {
  const categoryIds = await getUserCategoryIds(supplierId, SUPPLIER_CATEGORY_SCOPE);
  if (!categoryIds.length) return [];

  const statuses = filters.statuses?.length
    ? filters.statuses
    : ['open', 'in_review'];

  const { data, error } = await supabase
    .from('quote_requests')
    .select(SUPPLIER_RELEVANT_QUOTE_SELECT)
    .in('category_id', categoryIds)
    .in('status', statuses)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getOffersForSupplier(supplierId) {
  const { data, error } = await supabase
    .from('quote_offers')
    .select(`
      *,
      quote_requests(
        *,
        categories(id, name, emoji),
        users!buyer_id(company_name, city, rut, verified)
      )
    `)
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function submitOffer({ quoteId, supplierId, responderId, price, notes, estimatedLeadTime }) {
  const { data, error } = await supabase
    .from('quote_offers')
    .insert({
      quote_id: quoteId,
      supplier_id: supplierId,
      responder_id: responderId,
      price,
      notes,
      estimated_lead_time: estimatedLeadTime,
    })
    .select(`
      *,
      users!supplier_id(company_name, city, verified)
    `)
    .single();
  if (error) throw error;

  await supabase
    .from('quote_requests')
    .update({ status: 'in_review' })
    .eq('id', quoteId)
    .in('status', ['open', 'in_review']);

  return data;
}

export async function getOffersForQuote(quoteId) {
  const { data, error } = await supabase
    .from('quote_offers')
    .select(`
      *,
      users!supplier_id(company_name, city, verified)
    `)
    .eq('quote_id', quoteId)
    .order('price', { ascending: true });
  if (error) throw error;
  return data;
}

export async function updateOfferPipelineStatus({ offerId, supplierId, pipelineStatus }) {
  const { data, error } = await supabase
    .from('quote_offers')
    .update({ pipeline_status: pipelineStatus })
    .eq('id', offerId)
    .eq('supplier_id', supplierId)
    .select(`
      *,
      quote_requests(
        *,
        categories(id, name, emoji),
        users!buyer_id(company_name, city, rut, verified)
      ),
      users!supplier_id(company_name, city, verified)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function acceptOffer(offerId) {
  const { data, error } = await supabase
    .from('quote_offers')
    .update({ status: 'accepted' })
    .eq('id', offerId)
    .select('*, quote_requests(id)')
    .single();
  if (error) throw error;

  await supabase
    .from('quote_requests')
    .update({ status: 'closed' })
    .eq('id', data.quote_requests.id);

  await supabase
    .from('quote_offers')
    .update({ status: 'rejected' })
    .eq('quote_id', data.quote_requests.id)
    .neq('id', offerId)
    .eq('status', 'pending');

  return data;
}

export async function cancelQuoteRequest(quoteId) {
  const { data, error } = await supabase
    .from('quote_requests')
    .update({ status: 'cancelled' })
    .eq('id', quoteId)
    .select()
    .single();
  if (error) throw error;

  await supabase
    .from('quote_offers')
    .update({ status: 'rejected' })
    .eq('quote_id', quoteId)
    .eq('status', 'pending');

  return data;
}

// ========================
// RESEÑAS
// ========================

export async function createReview({ reviewerId, reviewedId, quoteOfferId, rating, comment }) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      reviewer_id: reviewerId,
      reviewed_id: reviewedId,
      quote_offer_id: quoteOfferId,
      rating,
      comment,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getReviewsForUser(userId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, users!reviewer_id(company_name, city, verified)')
    .eq('reviewed_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ========================
// FAVORITOS
// ========================

export async function toggleFavorite(buyerId, supplierId) {
  const { data: existing, error: existingError } = await supabase
    .from('favorites')
    .select('buyer_id, supplier_id')
    .eq('buyer_id', buyerId)
    .eq('supplier_id', supplierId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('buyer_id', buyerId)
      .eq('supplier_id', supplierId);
    if (error) throw error;
    return false; // removed
  }

  const { error } = await supabase
    .from('favorites')
    .insert({ buyer_id: buyerId, supplier_id: supplierId });
  if (error) throw error;

  return true; // added
}

export async function getFavorites(buyerId) {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      created_at,
      supplier_id,
      users!supplier_id(
        *,
        supplier_profiles(*),
        user_categories(scope, category_id, categories(id, name, emoji)),
        products(*, categories(name, emoji)),
        subscriptions(*, plans(*))
      )
    `)
    .eq('buyer_id', buyerId)
    .order('supplier_id', { ascending: false });
  if (error) throw error;
  return data;
}

// ========================
// PROVEEDORES (browse)
// ========================

export async function getSuppliers(filters = {}) {
  let query = supabase
    .from('users')
    .select(`
      id, company_name, city, description, verified,
      supplier_profiles(giro, response_rate),
      user_categories(categories(name, emoji)),
      products(count)
    `)
    .eq('is_supplier', true);

  if (filters.categoryId) {
    query = query.contains('user_categories', [{ category_id: filters.categoryId }]);
  }
  if (filters.search) {
    query = query.ilike('company_name', `%${filters.search}%`);
  }
  if (filters.verified) {
    query = query.eq('verified', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ========================
// ALERTAS DE PRECIO
// ========================

export async function getPriceAlerts(buyerId) {
  const subscriptions = await getPriceAlertSubscriptions(buyerId);
  if (!subscriptions.length) return [];

  const productIds = subscriptions
    .filter((subscription) => subscription.product_id)
    .map((subscription) => subscription.product_id);

  const categoryIds = subscriptions
    .filter((subscription) => subscription.category_id)
    .map((subscription) => subscription.category_id);

  const { data, error } = await supabase
    .from('price_alerts')
    .select(`
      *,
      products(
        id,
        name,
        category_id,
        price_unit,
        users!supplier_id(company_name),
        categories(name, emoji)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  return (data ?? [])
    .filter((alert) => {
      const product = takeSingle(alert.products);
      return productIds.includes(alert.product_id) || categoryIds.includes(product?.category_id);
    })
    .slice(0, 20);
}

export async function getPriceAlertSubscriptions(buyerId) {
  const { data, error } = await supabase
    .from('price_alert_subscriptions')
    .select(`
      *,
      categories(id, name, emoji),
      products(id, name, price_unit, categories(name, emoji))
    `)
    .eq('buyer_id', buyerId)
    .order('id', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function subscribeToPriceAlert(buyerId, { categoryId, productId }) {
  if (!categoryId && !productId) {
    throw new Error('Debes seleccionar una categoria o un producto para la alerta.');
  }

  let existingQuery = supabase
    .from('price_alert_subscriptions')
    .select(`
      *,
      categories(id, name, emoji),
      products(id, name, price_unit, categories(name, emoji))
    `)
    .eq('buyer_id', buyerId);

  existingQuery = productId
    ? existingQuery.eq('product_id', productId).is('category_id', null)
    : existingQuery.eq('category_id', categoryId).is('product_id', null);

  const { data: existing, error: existingError } = await existingQuery.maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('price_alert_subscriptions')
    .insert({
      buyer_id: buyerId,
      category_id: categoryId || null,
      product_id: productId || null,
    })
    .select(`
      *,
      categories(id, name, emoji),
      products(id, name, price_unit, categories(name, emoji))
    `)
    .single();
  if (error) throw error;
  return data;
}

export async function removePriceAlertSubscription(subscriptionId, buyerId) {
  const { error } = await supabase
    .from('price_alert_subscriptions')
    .delete()
    .eq('id', subscriptionId)
    .eq('buyer_id', buyerId);

  if (error) throw error;
}

// ========================
// PLANES & SUSCRIPCIONES
// ========================

export async function getPlans() {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('price_clp', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getActiveSubscription(supplierId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('supplier_id', supplierId)
    .eq('status', 'active')
    .single();
  if (error) return null;
  return data;
}

export async function subscribeToPlan(supplierId, planId) {
  const currentSubscription = await getActiveSubscription(supplierId);
  if (currentSubscription?.plan_id === planId) {
    return currentSubscription;
  }

  // Cancelar suscripcion activa
  const { error: cancelError } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('supplier_id', supplierId)
    .eq('status', 'active');
  if (cancelError) throw cancelError;

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      supplier_id: supplierId,
      plan_id: planId,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('*, plans(*)')
    .single();
  if (error) throw error;
  return data;
}

export async function getSupplierUsageSummary(supplierId) {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const monthStartIso = startOfMonth.toISOString();

  const { data: agents, error: agentsError } = await supabase
    .from('ai_agents')
    .select('id')
    .eq('supplier_id', supplierId);

  if (agentsError) throw agentsError;

  const agentIds = (agents ?? []).map((agent) => agent.id);

  const [
    productsRes,
    quoteResponsesRes,
    conversationsRes,
    voiceCallsRes,
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('supplier_id', supplierId)
      .in('status', ['active', 'low_stock']),
    supabase
      .from('quote_offers')
      .select('id', { count: 'exact', head: true })
      .eq('supplier_id', supplierId)
      .gte('created_at', monthStartIso),
    agentIds.length
      ? supabase
          .from('agent_conversations')
          .select('id', { count: 'exact', head: true })
          .in('agent_id', agentIds)
          .gte('started_at', monthStartIso)
      : Promise.resolve({ count: 0, error: null }),
    agentIds.length
      ? supabase
          .from('agent_conversations')
          .select('id', { count: 'exact', head: true })
          .in('agent_id', agentIds)
          .eq('channel', 'voice')
          .gte('started_at', monthStartIso)
      : Promise.resolve({ count: 0, error: null }),
  ]);

  if (productsRes.error) throw productsRes.error;
  if (quoteResponsesRes.error) throw quoteResponsesRes.error;
  if (conversationsRes.error) throw conversationsRes.error;
  if (voiceCallsRes.error) throw voiceCallsRes.error;

  return {
    activeProducts: productsRes.count || 0,
    quoteResponsesThisMonth: quoteResponsesRes.count || 0,
    aiConversationsThisMonth: conversationsRes.count || 0,
    voiceCallsThisMonth: voiceCallsRes.count || 0,
  };
}

// ========================
// AGENTES IA
// ========================

export async function getAgents(supplierId) {
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createAgentConversation(agentId, { contactName, channel }) {
  const { data, error } = await supabase
    .from('agent_conversations')
    .insert({ agent_id: agentId, contact_name: contactName, channel })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function saveAgentMessage(conversationId, { role, content }) {
  const { data, error } = await supabase
    .from('agent_messages')
    .insert({ conversation_id: conversationId, role, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getConversationMessages(conversationId) {
  const { data, error } = await supabase
    .from('agent_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

// ========================
// CATEGORÍAS
// ========================

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function setUserCategories(userId, categoryIds, scope = 'supplier_catalog') {
  // Mantiene buyer/supplier aislados para permitir organizaciones con ambos roles.
  await supabase
    .from('user_categories')
    .delete()
    .eq('user_id', userId)
    .eq('scope', scope);

  if (categoryIds.length === 0) return [];

  const rows = categoryIds.map((categoryId) => ({
    user_id: userId,
    category_id: categoryId,
    scope,
  }));
  const { data, error } = await supabase
    .from('user_categories')
    .insert(rows)
    .select();
  if (error) throw error;
  return data;
}

// ========================
// ESTADÍSTICAS
// ========================

export async function getSupplierStats(supplierId) {
  const [quotesRes, reviewsRes, favoritesRes, reviewCountRes] = await Promise.allSettled([
    supabase
      .from('quote_offers')
      .select('id', { count: 'exact', head: true })
      .eq('supplier_id', supplierId)
      .eq('status', 'accepted'),
    supabase.rpc('get_user_rating', { p_user_id: supplierId }),
    supabase
      .from('favorites')
      .select('supplier_id', { count: 'exact', head: true })
      .eq('supplier_id', supplierId),
    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('reviewed_id', supplierId),
  ]);

  return {
    totalSales: quotesRes.status === 'fulfilled' ? (quotesRes.value.count || 0) : 0,
    rating: reviewsRes.status === 'fulfilled' ? (reviewsRes.value.data || 0) : 0,
    recurringClients: favoritesRes.status === 'fulfilled' ? (favoritesRes.value.count || 0) : 0,
    totalReviews: reviewCountRes.status === 'fulfilled' ? (reviewCountRes.value.count || 0) : 0,
  };
}

export async function getBuyerStats(buyerId) {
  const [quotesRes, reviewsRes, favoritesRes] = await Promise.all([
    supabase
      .from('quote_requests')
      .select('id', { count: 'exact', head: true })
      .eq('buyer_id', buyerId),
    supabase.rpc('get_user_rating', { p_user_id: buyerId }),
    supabase
      .from('favorites')
      .select('supplier_id', { count: 'exact', head: true })
      .eq('buyer_id', buyerId),
  ]);

  return {
    totalOrders: quotesRes.count || 0,
    rating: reviewsRes.data || 0,
    favoriteSuppliers: favoritesRes.count || 0,
  };
}
