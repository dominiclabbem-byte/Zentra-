import {
  buildMarketplaceSeed,
  buildProduct,
  buildQuoteOffer,
  buildQuoteRequest,
  buildReview,
  buildSubscription,
} from './marketplaceFixtures.js';

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function takeSingle(value) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function countMatches(rows, predicate) {
  return rows.filter(predicate).length;
}

function getAverageRating(reviews, userId) {
  const ratings = reviews
    .filter((review) => review.reviewed_id === userId)
    .map((review) => Number(review.rating) || 0)
    .filter((rating) => rating > 0);

  if (!ratings.length) return 0;

  return ratings.reduce((total, rating) => total + rating, 0) / ratings.length;
}

function canReviewQuoteOffer(state, reviewerId, reviewedId, quoteOfferId) {
  const offer = state.quoteOffers.find((item) => item.id === quoteOfferId);
  if (!offer || offer.status !== 'accepted') return false;

  const quote = state.quoteRequests.find((item) => item.id === offer.quote_id);
  if (!quote) return false;

  const isEligibleCounterparty = (
    (quote.buyer_id === reviewerId && offer.supplier_id === reviewedId)
    || (offer.supplier_id === reviewerId && quote.buyer_id === reviewedId)
  );

  if (!isEligibleCounterparty) return false;

  return !state.reviews.some((review) => (
    review.quote_offer_id === quoteOfferId
    && review.reviewer_id === reviewerId
  ));
}

function filterProducts(products, filters = {}) {
  let next = [...products];

  if (filters.status) {
    next = Array.isArray(filters.status)
      ? next.filter((product) => filters.status.includes(product.status))
      : next.filter((product) => product.status === filters.status);
  } else if (!filters.includeAllStatuses) {
    next = next.filter((product) => product.status === 'active');
  }

  if (filters.categoryId) next = next.filter((product) => product.category_id === filters.categoryId);
  if (filters.supplierId) next = next.filter((product) => product.supplier_id === filters.supplierId);
  if (filters.search) {
    const search = filters.search.toLowerCase();
    next = next.filter((product) => product.name.toLowerCase().includes(search));
  }

  return next;
}

function attachSupplierQuoteRelations(offer) {
  const quote = takeSingle(offer.quote_requests) ?? offer.quote_requests ?? null;

  return {
    ...clone(offer),
    users: clone(offer.users),
    quote_requests: quote ? {
      ...clone(quote),
      categories: clone(takeSingle(quote.categories) ?? quote.categories),
      users: clone(takeSingle(quote.users) ?? quote.users),
    } : null,
  };
}

export function createMarketplaceScenario(overrides = {}) {
  const state = buildMarketplaceSeed(overrides);
  const buyer = state.buyer;
  const supplier = state.supplier;

  const supplierMap = new Map([
    [supplier.id, supplier],
  ]);

  const api = {
    async getProducts(filters = {}) {
      return clone(filterProducts(state.products, filters));
    },

    async createProduct(product) {
      const category = state.categories.find((item) => item.id === product.category_id) ?? state.categories[0];
      const next = buildProduct({
        id: `prod-${state.products.length + 1}`,
        categories: category,
        users: { id: supplier.id, company_name: supplier.company_name, verified: supplier.verified },
        ...product,
      });
      state.products = [next, ...state.products];
      supplier.products = [next, ...supplier.products];
      return clone(next);
    },

    async updateProduct(productId, updates) {
      state.products = state.products.map((product) => {
        if (product.id !== productId) return product;
        const next = { ...product, ...updates };
        if (updates.category_id) {
          next.categories = state.categories.find((category) => category.id === updates.category_id) ?? next.categories;
        }
        return next;
      });
      supplier.products = state.products.filter((product) => product.supplier_id === supplier.id);
      return clone(state.products.find((product) => product.id === productId));
    },

    async deleteProduct(productId) {
      state.products = state.products.filter((product) => product.id !== productId);
      supplier.products = supplier.products.filter((product) => product.id !== productId);
    },

    async getQuoteRequestsForBuyer(buyerId) {
      return clone(
        state.quoteRequests
          .filter((quote) => quote.buyer_id === buyerId)
          .map((quote) => ({
            ...quote,
            categories: clone(quote.categories),
            users: clone(quote.users),
            quote_offers: quote.quote_offers.map((offer) => ({
              ...clone(offer),
              users: clone(supplierMap.get(offer.supplier_id) ?? offer.users ?? {}),
            })),
          })),
      );
    },

    async getRelevantQuoteRequestsForSupplier(supplierId) {
      if (supplierId !== supplier.id) return [];

      const categoryIds = supplier.user_categories
        .filter((link) => link.scope === 'supplier_catalog')
        .map((link) => link.category_id);

      return clone(
        state.quoteRequests
          .filter((quote) => categoryIds.includes(quote.category_id) && ['open', 'in_review'].includes(quote.status))
          .map((quote) => ({
            ...quote,
            categories: clone(quote.categories),
            users: clone(quote.users),
            quote_offers: quote.quote_offers.map((offer) => ({
              ...clone(offer),
              users: clone(supplierMap.get(offer.supplier_id) ?? offer.users ?? {}),
            })),
          })),
      );
    },

    async getOffersForSupplier(supplierId) {
      return clone(
        state.quoteOffers
          .filter((offer) => offer.supplier_id === supplierId)
          .map((offer) => attachSupplierQuoteRelations(offer)),
      );
    },

    async getOffersForQuote(quoteId) {
      return clone(
        state.quoteOffers
          .filter((offer) => offer.quote_id === quoteId)
          .sort((left, right) => Number(left.price) - Number(right.price))
          .map((offer) => ({
            ...clone(offer),
            users: clone(supplierMap.get(offer.supplier_id) ?? offer.users ?? {}),
          })),
      );
    },

    async createQuoteRequest(payload) {
      const category = state.categories.find((item) => item.id === payload.category_id) ?? state.categories[0];
      const quote = buildQuoteRequest({
        ...payload,
        id: `quote-${state.quoteRequests.length + 1}`,
        categories: category,
        users: buyer,
        created_at: '2026-03-24T11:00:00Z',
        quote_offers: [],
      });
      state.quoteRequests = [quote, ...state.quoteRequests];
      return clone(quote);
    },

    async submitOffer({ quoteId, supplierId, responderId, price, notes, estimatedLeadTime }) {
      const quote = state.quoteRequests.find((item) => item.id === quoteId);
      const offer = buildQuoteOffer({
        id: `offer-${state.quoteOffers.length + 1}`,
        quote_id: quoteId,
        quote_requests: quote,
        supplier_id: supplierId,
        responder_id: responderId,
        supplierName: supplier.company_name,
        supplierCity: supplier.city,
        price,
        notes,
        estimated_lead_time: estimatedLeadTime,
      });
      state.quoteOffers = [offer, ...state.quoteOffers];
      quote.status = 'in_review';
      quote.quote_offers = [offer, ...(quote.quote_offers ?? [])];
      return clone(offer);
    },

    async updateOfferPipelineStatus({ offerId, supplierId, pipelineStatus }) {
      state.quoteOffers = state.quoteOffers.map((offer) => (
        offer.id === offerId && offer.supplier_id === supplierId
          ? { ...offer, pipeline_status: pipelineStatus }
          : offer
      ));
      return clone(state.quoteOffers.find((offer) => offer.id === offerId));
    },

    async acceptOffer(offerId) {
      const offer = state.quoteOffers.find((item) => item.id === offerId);
      if (!offer) throw new Error('offer not found');
      offer.status = 'accepted';
      offer.pipeline_status = 'won';
      state.quoteRequests = state.quoteRequests.map((quote) => (
        quote.id === offer.quote_id ? { ...quote, status: 'closed' } : quote
      ));
      state.quoteOffers = state.quoteOffers.map((item) => (
        item.quote_id === offer.quote_id && item.id !== offerId && item.status === 'pending'
          ? { ...item, status: 'rejected', pipeline_status: 'lost' }
          : item
      ));
      return clone({ ...offer, quote_requests: state.quoteRequests.find((quote) => quote.id === offer.quote_id) });
    },

    async cancelQuoteRequest(quoteId) {
      state.quoteRequests = state.quoteRequests.map((quote) => (
        quote.id === quoteId ? { ...quote, status: 'cancelled' } : quote
      ));
      state.quoteOffers = state.quoteOffers.map((offer) => (
        offer.quote_id === quoteId && offer.status === 'pending'
          ? { ...offer, status: 'rejected', pipeline_status: 'lost' }
          : offer
      ));
      return clone(state.quoteRequests.find((quote) => quote.id === quoteId));
    },

    async getFavorites(buyerId) {
      return clone(
        state.favorites
          .filter((favorite) => favorite.buyer_id === buyerId)
          .map((favorite) => ({
            ...favorite,
            users: clone(supplier),
          })),
      );
    },

    async toggleFavorite(buyerId, supplierId) {
      const existingIndex = state.favorites.findIndex((favorite) => favorite.buyer_id === buyerId && favorite.supplier_id === supplierId);
      if (existingIndex >= 0) {
        state.favorites.splice(existingIndex, 1);
        return false;
      }
      state.favorites.unshift({
        created_at: '2026-03-24T12:00:00Z',
        buyer_id: buyerId,
        supplier_id: supplierId,
        users: clone(supplier),
      });
      return true;
    },

    async getPriceAlertSubscriptions(buyerId) {
      return clone(
        state.priceAlertSubscriptions
          .filter((subscription) => subscription.buyer_id === buyerId)
          .map((subscription) => ({
            ...subscription,
            categories: clone(subscription.categories),
            products: subscription.products ? {
              ...clone(subscription.products),
              categories: clone(takeSingle(subscription.products.categories) ?? subscription.products.categories),
            } : null,
          })),
      );
    },

    async subscribeToPriceAlert(buyerId, { categoryId, productId }) {
      const existing = state.priceAlertSubscriptions.find((subscription) => (
        subscription.buyer_id === buyerId
        && ((productId && subscription.product_id === productId) || (!productId && subscription.category_id === categoryId))
      ));
      if (existing) return clone(existing);

      const category = state.categories.find((item) => item.id === categoryId) ?? state.categories[0];
      const product = productId ? state.products.find((item) => item.id === productId) ?? null : null;
      const subscription = {
        id: `subscription-${state.priceAlertSubscriptions.length + 1}`,
        buyer_id: buyerId,
        category_id: categoryId ?? null,
        product_id: productId ?? null,
        categories: category,
        products: product,
        created_at: '2026-03-24T13:00:00Z',
      };
      state.priceAlertSubscriptions.unshift(subscription);
      return clone(subscription);
    },

    async removePriceAlertSubscription(subscriptionId, buyerId) {
      state.priceAlertSubscriptions = state.priceAlertSubscriptions.filter((subscription) => (
        !(subscription.id === subscriptionId && subscription.buyer_id === buyerId)
      ));
    },

    async getPriceAlerts(buyerId) {
      const subscriptions = state.priceAlertSubscriptions.filter((subscription) => subscription.buyer_id === buyerId);
      if (!subscriptions.length) return [];

      const productIds = subscriptions.filter((subscription) => subscription.product_id).map((subscription) => subscription.product_id);
      const categoryIds = subscriptions.filter((subscription) => subscription.category_id).map((subscription) => subscription.category_id);

      return clone(
        state.priceAlerts
          .filter((alert) => {
            const product = takeSingle(alert.products);
            return productIds.includes(alert.product_id) || categoryIds.includes(product?.category_id);
          })
          .map((alert) => ({
            ...alert,
            products: (() => {
              const product = takeSingle(alert.products) ?? alert.products ?? null;
              if (!product) return null;
              return {
                ...clone(product),
                users: clone(supplier),
                categories: clone(takeSingle(product.categories) ?? product.categories),
              };
            })(),
          })),
      );
    },

    async getPlans() {
      return clone(state.plans);
    },

    async getActiveSubscription(supplierId) {
      const subscription = state.supplier.subscriptions.find((item) => item.status === 'active' && item.supplier_id === supplierId);
      return subscription ? clone(subscription) : null;
    },

    async subscribeToPlan(supplierId, planId) {
      const plan = state.plans.find((item) => item.id === planId);
      const existing = state.supplier.subscriptions.find((item) => item.status === 'active' && item.supplier_id === supplierId);
      if (existing?.plan_id === planId) return clone(existing);

      state.supplier.subscriptions = state.supplier.subscriptions.map((subscription) => (
        subscription.supplier_id === supplierId && subscription.status === 'active'
          ? { ...subscription, status: 'cancelled' }
          : subscription
      ));

      const subscription = buildSubscription(plan, {
        supplier_id: supplierId,
        plan_id: planId,
        status: 'active',
      });
      state.supplier.subscriptions.unshift(subscription);
      state.supplier.activeSubscription = subscription;
      return clone(subscription);
    },

    async getSupplierUsageSummary(supplierId) {
      const monthStart = '2026-03-01T00:00:00Z';
      return {
        activeProducts: countMatches(state.products, (product) => product.supplier_id === supplierId && ['active', 'low_stock'].includes(product.status)),
        quoteResponsesThisMonth: countMatches(state.quoteOffers, (offer) => offer.supplier_id === supplierId && offer.created_at >= monthStart),
        aiConversationsThisMonth: countMatches(state.conversations, (conversation) => conversation.supplier_id === supplierId && conversation.started_at >= monthStart),
        voiceCallsThisMonth: countMatches(state.conversations, (conversation) => conversation.supplier_id === supplierId && conversation.channel === 'voice' && conversation.started_at >= monthStart),
      };
    },

    async getAgents(supplierId) {
      return clone(state.agents.filter((agent) => agent.supplier_id === supplierId));
    },

    async createAgentConversation(agentId, { contactName, channel }) {
      const conversation = {
        id: `conv-${state.conversations.length + 1}`,
        agent_id: agentId,
        supplier_id: supplier.id,
        contact_name: contactName,
        channel,
        started_at: '2026-03-24T15:00:00Z',
      };
      state.conversations.unshift(conversation);
      return clone(conversation);
    },

    async saveAgentMessage(conversationId, { role, content }) {
      const message = {
        id: `msg-${state.messages.length + 1}`,
        conversation_id: conversationId,
        role,
        content,
        created_at: '2026-03-24T15:01:00Z',
      };
      state.messages.push(message);
      return clone(message);
    },

    async getConversationMessages(conversationId) {
      return clone(
        state.messages
          .filter((message) => message.conversation_id === conversationId)
          .sort((left, right) => left.created_at.localeCompare(right.created_at)),
      );
    },

    async getCategories() {
      return clone(state.categories);
    },

    async getBuyerStats(buyerId) {
      return {
        totalOrders: state.quoteRequests.filter((quote) => quote.buyer_id === buyerId).length,
        rating: getAverageRating(state.reviews, buyerId),
        favoriteSuppliers: state.favorites.filter((favorite) => favorite.buyer_id === buyerId).length,
      };
    },

    async getSupplierStats(supplierId) {
      return {
        totalSales: state.quoteOffers.filter((offer) => offer.supplier_id === supplierId && offer.status === 'accepted').length,
        rating: getAverageRating(state.reviews, supplierId),
        recurringClients: state.favorites.filter((favorite) => favorite.supplier_id === supplierId).length,
        totalReviews: state.reviews.filter((review) => review.reviewed_id === supplierId).length,
      };
    },

    async getBuyerReviewOpportunities(buyerId) {
      return clone(
        state.quoteOffers
          .filter((offer) => offer.status === 'accepted')
          .filter((offer) => {
            const quote = state.quoteRequests.find((item) => item.id === offer.quote_id);
            return quote?.buyer_id === buyerId;
          })
          .filter((offer) => canReviewQuoteOffer(state, buyerId, offer.supplier_id, offer.id))
          .map((offer) => {
            const quote = state.quoteRequests.find((item) => item.id === offer.quote_id);
            const supplierUser = supplierMap.get(offer.supplier_id) ?? offer.users ?? {};

            return {
              quoteOfferId: offer.id,
              quoteId: offer.quote_id,
              reviewedId: offer.supplier_id,
              supplierName: supplierUser.company_name ?? 'Proveedor',
              supplierCity: supplierUser.city ?? '',
              supplierVerified: Boolean(supplierUser.verified),
              productName: quote?.product_name ?? 'Producto',
              quantity: Number(quote?.quantity ?? 0),
              unit: quote?.unit ?? 'kg',
              deliveryDate: quote?.delivery_date ?? null,
              price: Number(offer.price ?? 0),
              estimatedLeadTime: offer.estimated_lead_time ?? '',
            };
          }),
      );
    },

    async getReviewsForUser(userId) {
      return clone(
        state.reviews
          .filter((review) => review.reviewed_id === userId)
          .map((review) => ({
            ...review,
            users: clone(review.users),
          })),
      );
    },

    async createReview({ reviewerId, reviewedId, quoteOfferId, rating, comment }) {
      if (!canReviewQuoteOffer(state, reviewerId, reviewedId, quoteOfferId)) {
        throw new Error('Solo puedes dejar reseñas para contrapartes con operaciones aceptadas.');
      }

      const reviewer = state.buyer.id === reviewerId
        ? state.buyer
        : (state.secondBuyer?.id === reviewerId ? state.secondBuyer : state.supplier);
      const review = buildReview({
        reviewer_id: reviewerId,
        reviewed_id: reviewedId,
        quote_offer_id: quoteOfferId,
        rating,
        comment,
        users: reviewer,
        created_at: '2026-03-24T14:00:00Z',
      });
      state.reviews.unshift(review);
      return clone(review);
    },

    async getBuyerProfile(userId) {
      return userId === buyer.id ? clone(buyer) : null;
    },

    async getSupplierProfile(userId) {
      if (userId !== supplier.id) return null;
      return clone({
        ...supplier,
        products: supplier.products,
        subscriptions: supplier.subscriptions,
      });
    },
  };

  const auth = {
    buyer: () => ({
      currentUser: clone(buyer),
      categories: clone(state.categories),
      plans: clone(state.plans),
      saveBuyerProfile: async (updates) => {
        Object.assign(state.buyer, updates);
        return clone(state.buyer);
      },
    }),
    supplier: () => ({
      currentUser: clone(state.supplier),
      categories: clone(state.categories),
      plans: clone(state.plans),
      saveSupplierProfile: async (updates) => {
        Object.assign(state.supplier, updates);
        return clone(state.supplier);
      },
      changeSupplierPlan: async (planId) => api.subscribeToPlan(supplier.id, planId),
    }),
  };

  return {
    state,
    api,
    auth,
  };
}
