import { supabase } from './supabase';

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
    .select('*, buyer_profiles(*), supplier_profiles(*)')
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
      user_categories(category_id, categories(id, name, emoji)),
      products(*),
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
      user_categories(category_id, categories(id, name, emoji))
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
    .select('*, categories(name, emoji), users!supplier_id(company_name)')
    .eq('status', 'active');

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
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getQuoteRequestsForBuyer(buyerId) {
  const { data, error } = await supabase
    .from('quote_requests')
    .select('*, quote_offers(count)')
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getOpenQuoteRequests() {
  const { data, error } = await supabase
    .from('quote_requests')
    .select('*, users!buyer_id(company_name, city, rut), quote_offers(count)')
    .eq('status', 'open')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function submitOffer({ quoteId, supplierId, price, notes }) {
  const { data, error } = await supabase
    .from('quote_offers')
    .insert({
      quote_id: quoteId,
      supplier_id: supplierId,
      price,
      notes,
    })
    .select()
    .single();
  if (error) throw error;

  // Actualizar status de la cotizacion
  await supabase
    .from('quote_requests')
    .update({ status: 'in_progress' })
    .eq('id', quoteId)
    .eq('status', 'open');

  return data;
}

export async function getOffersForQuote(quoteId) {
  const { data, error } = await supabase
    .from('quote_offers')
    .select('*, users!supplier_id(company_name, city, verified)')
    .eq('quote_id', quoteId)
    .order('price', { ascending: true });
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

  // Cerrar cotizacion y rechazar otras ofertas
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
    .select('*, users!reviewer_id(company_name)')
    .eq('reviewed_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ========================
// FAVORITOS
// ========================

export async function toggleFavorite(buyerId, supplierId) {
  const { data: existing } = await supabase
    .from('favorites')
    .select()
    .eq('buyer_id', buyerId)
    .eq('supplier_id', supplierId)
    .single();

  if (existing) {
    await supabase
      .from('favorites')
      .delete()
      .eq('buyer_id', buyerId)
      .eq('supplier_id', supplierId);
    return false; // removed
  }

  await supabase.from('favorites').insert({ buyer_id: buyerId, supplier_id: supplierId });
  return true; // added
}

export async function getFavorites(buyerId) {
  const { data, error } = await supabase
    .from('favorites')
    .select('*, users!supplier_id(id, company_name, city, verified)')
    .eq('buyer_id', buyerId);
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
  // Obtener alertas de categorias/productos que el buyer sigue
  const { data: subs } = await supabase
    .from('price_alert_subscriptions')
    .select('category_id, product_id')
    .eq('buyer_id', buyerId);

  if (!subs?.length) return [];

  const categoryIds = subs.filter(s => s.category_id).map(s => s.category_id);
  const productIds = subs.filter(s => s.product_id).map(s => s.product_id);

  let query = supabase
    .from('price_alerts')
    .select('*, products(name, category_id, users!supplier_id(company_name))')
    .order('created_at', { ascending: false })
    .limit(20);

  if (productIds.length) {
    query = query.in('product_id', productIds);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function subscribeToPriceAlert(buyerId, { categoryId, productId }) {
  const { data, error } = await supabase
    .from('price_alert_subscriptions')
    .insert({
      buyer_id: buyerId,
      category_id: categoryId || null,
      product_id: productId || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
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
  // Cancelar suscripcion activa
  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('supplier_id', supplierId)
    .eq('status', 'active');

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

export async function setUserCategories(userId, categoryIds) {
  // Borrar existentes y reinsertar
  await supabase.from('user_categories').delete().eq('user_id', userId);

  if (categoryIds.length === 0) return [];

  const rows = categoryIds.map(cid => ({ user_id: userId, category_id: cid }));
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
  const [quotesRes, reviewsRes, favoritesRes] = await Promise.all([
    supabase
      .from('quote_offers')
      .select('id', { count: 'exact', head: true })
      .eq('supplier_id', supplierId)
      .eq('status', 'accepted'),
    supabase.rpc('get_user_rating', { p_user_id: supplierId }),
    supabase
      .from('favorites')
      .select('id', { count: 'exact', head: true })
      .eq('supplier_id', supplierId),
  ]);

  return {
    totalSales: quotesRes.count || 0,
    rating: reviewsRes.data || 0,
    recurringClients: favoritesRes.count || 0,
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
      .select('id', { count: 'exact', head: true })
      .eq('buyer_id', buyerId),
  ]);

  return {
    totalOrders: quotesRes.count || 0,
    rating: reviewsRes.data || 0,
    favoriteSuppliers: favoritesRes.count || 0,
  };
}
