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

function dedupeLatestPriceAlerts(alerts) {
  const latestByProductId = new Map();

  (alerts ?? []).forEach((alert) => {
    if (!alert?.product_id) return;

    const existing = latestByProductId.get(alert.product_id);
    if (!existing || new Date(alert.created_at).getTime() > new Date(existing.created_at).getTime()) {
      latestByProductId.set(alert.product_id, alert);
    }
  });

  return [...latestByProductId.values()].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
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

function createNotification(state, payload) {
  const notification = {
    id: `notification-${state.notifications.length + 1}`,
    read_at: null,
    created_at: new Date().toISOString(),
    ...payload,
  };

  state.notifications = [notification, ...state.notifications];
  return notification;
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

function attachQuoteConversationRelations(conversation, state) {
  const quote = state.quoteRequests.find((item) => item.id === conversation.quote_request_id) ?? takeSingle(conversation.quote_requests) ?? null;
  const buyer = state.buyer.id === conversation.buyer_user_id
    ? state.buyer
    : state.secondBuyer?.id === conversation.buyer_user_id
      ? state.secondBuyer
      : takeSingle(conversation.buyer) ?? null;
  const supplier = state.supplier.id === conversation.supplier_user_id
    ? state.supplier
    : takeSingle(conversation.supplier) ?? null;

  return {
    ...clone(conversation),
    quote_requests: quote ? {
      ...clone(quote),
      categories: clone(takeSingle(quote.categories) ?? quote.categories),
      users: clone(takeSingle(quote.users) ?? quote.users),
    } : null,
    buyer: buyer ? clone(buyer) : null,
    supplier: supplier ? clone(supplier) : null,
  };
}

function createQuoteConversation(state, { quoteRequestId, supplierUserId, startedByUserId }) {
  const existing = state.quoteConversations.find((conversation) => (
    conversation.quote_request_id === quoteRequestId
    && conversation.supplier_user_id === supplierUserId
  ));
  if (existing) return existing;

  const quote = state.quoteRequests.find((item) => item.id === quoteRequestId);
  const supplierUser = state.supplier.id === supplierUserId ? state.supplier : null;
  const buyerUser = quote?.buyer_id === state.buyer.id ? state.buyer : state.secondBuyer;
  const conversation = {
    id: `conversation-${state.quoteConversations.length + 1}`,
    quote_request_id: quoteRequestId,
    buyer_user_id: quote?.buyer_id ?? buyerUser?.id ?? 'buyer-1',
    supplier_user_id: supplierUserId,
    started_by_user_id: startedByUserId,
    status: 'active',
    buyer_last_read_at: null,
    supplier_last_read_at: null,
    last_message_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    quote_requests: quote ?? null,
    buyer: buyerUser ?? null,
    supplier: supplierUser ?? null,
  };

  state.quoteConversations.unshift(conversation);
  return conversation;
}

function createQuoteConversationMessage(state, { conversationId, senderUserId, body }) {
  const conversation = state.quoteConversations.find((item) => item.id === conversationId);
  if (!conversation) {
    throw new Error('conversation not found');
  }

  const timestamp = new Date().toISOString();
  const sender = [state.buyer, state.secondBuyer, state.supplier]
    .find((user) => user?.id === senderUserId) ?? null;

  const message = {
    id: `conversation-message-${state.quoteConversationMessages.length + 1}`,
    conversation_id: conversationId,
    sender_user_id: senderUserId,
    body,
    created_at: timestamp,
    sender,
  };

  state.quoteConversationMessages.push(message);
  state.quoteConversations = state.quoteConversations.map((item) => {
    if (item.id !== conversationId) return item;

    return {
      ...item,
      last_message_at: timestamp,
      updated_at: timestamp,
      buyer_last_read_at: senderUserId === item.buyer_user_id ? timestamp : item.buyer_last_read_at,
      supplier_last_read_at: senderUserId === item.supplier_user_id ? timestamp : item.supplier_last_read_at,
    };
  });

  return message;
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

      if (supplier.supplierCategories.some((category) => category.id === quote.category_id)) {
        createNotification(state, {
          recipient_id: supplier.id,
          actor_id: quote.buyer_id,
          type: 'rfq_created',
          title: 'Nueva RFQ en una categoria relevante',
          message: `${buyer.company_name} solicito ${quote.product_name}.`,
          entity_type: 'quote_request',
          entity_id: quote.id,
        });
      }

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
      createQuoteConversation(state, {
        quoteRequestId: quoteId,
        supplierUserId: supplierId,
        startedByUserId: responderId,
      });

      createNotification(state, {
        recipient_id: quote.buyer_id,
        actor_id: supplierId,
        type: 'offer_received',
        title: 'Nueva oferta recibida',
        message: `${supplier.company_name} envio una oferta para ${quote.product_name}.`,
        entity_type: 'quote_offer',
        entity_id: offer.id,
      });

      return clone(offer);
    },

    async getQuoteConversationForQuote(quoteRequestId, supplierUserId) {
      const conversation = state.quoteConversations.find((item) => (
        item.quote_request_id === quoteRequestId
        && item.supplier_user_id === supplierUserId
      )) ?? null;

      return conversation ? attachQuoteConversationRelations(conversation, state) : null;
    },

    async getQuoteConversationById(conversationId) {
      const conversation = state.quoteConversations.find((item) => item.id === conversationId) ?? null;
      return conversation ? attachQuoteConversationRelations(conversation, state) : null;
    },

    async getQuoteConversationMessages(conversationId) {
      return clone(
        state.quoteConversationMessages
          .filter((message) => message.conversation_id === conversationId)
          .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime()),
      );
    },

    async sendQuoteConversationMessage({ conversationId, senderUserId, body }) {
      const conversation = state.quoteConversations.find((item) => item.id === conversationId);
      if (!conversation) throw new Error('conversation not found');
      if (conversation.status !== 'active') throw new Error('Esta conversacion ya no admite mensajes nuevos.');

      const message = createQuoteConversationMessage(state, {
        conversationId,
        senderUserId,
        body: body.trim(),
      });

      const quote = state.quoteRequests.find((item) => item.id === conversation.quote_request_id);
      const recipientId = senderUserId === conversation.buyer_user_id
        ? conversation.supplier_user_id
        : conversation.buyer_user_id;

      createNotification(state, {
        recipient_id: recipientId,
        actor_id: senderUserId,
        type: 'message_received',
        title: 'Nuevo mensaje en una cotizacion',
        message: `${senderUserId === conversation.buyer_user_id ? 'Comprador' : 'Proveedor'} envio un mensaje sobre ${quote?.product_name ?? 'tu RFQ'}.`,
        entity_type: 'quote_conversation',
        entity_id: conversationId,
      });

      return clone(message);
    },

    async markQuoteConversationRead({ conversationId, userId }) {
      const readAt = new Date().toISOString();
      state.quoteConversations = state.quoteConversations.map((conversation) => {
        if (conversation.id !== conversationId) return conversation;

        if (conversation.buyer_user_id === userId) {
          return { ...conversation, buyer_last_read_at: readAt, updated_at: readAt };
        }

        if (conversation.supplier_user_id === userId) {
          return { ...conversation, supplier_last_read_at: readAt, updated_at: readAt };
        }

        return conversation;
      });

      return clone(state.quoteConversations.find((conversation) => conversation.id === conversationId) ?? null);
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
      const quote = state.quoteRequests.find((item) => item.id === offer.quote_id);
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
      state.quoteConversations = state.quoteConversations.map((conversation) => (
        conversation.quote_request_id === offer.quote_id
          ? { ...conversation, status: 'closed', updated_at: new Date().toISOString() }
          : conversation
      ));

      createNotification(state, {
        recipient_id: offer.supplier_id,
        actor_id: quote?.buyer_id ?? buyer.id,
        type: 'offer_accepted',
        title: 'Tu oferta fue aceptada',
        message: `${buyer.company_name} acepto tu oferta para ${quote?.product_name ?? 'una RFQ'}.`,
        entity_type: 'quote_offer',
        entity_id: offer.id,
      });

      return clone({ ...offer, quote_requests: state.quoteRequests.find((quoteItem) => quoteItem.id === offer.quote_id) });
    },

    async cancelQuoteRequest(quoteId) {
      const quote = state.quoteRequests.find((item) => item.id === quoteId);
      const impactedOffers = state.quoteOffers.filter((offer) => offer.quote_id === quoteId && offer.status === 'pending');
      state.quoteRequests = state.quoteRequests.map((quote) => (
        quote.id === quoteId ? { ...quote, status: 'cancelled' } : quote
      ));
      state.quoteOffers = state.quoteOffers.map((offer) => (
        offer.quote_id === quoteId && offer.status === 'pending'
          ? { ...offer, status: 'rejected', pipeline_status: 'lost' }
          : offer
      ));
      state.quoteConversations = state.quoteConversations.map((conversation) => (
        conversation.quote_request_id === quoteId
          ? { ...conversation, status: 'closed', updated_at: new Date().toISOString() }
          : conversation
      ));

      impactedOffers.forEach((offer) => {
        createNotification(state, {
          recipient_id: offer.supplier_id,
          actor_id: quote?.buyer_id ?? buyer.id,
          type: 'rfq_cancelled',
          title: 'La RFQ fue cancelada',
          message: `${buyer.company_name} cancelo la solicitud para ${quote?.product_name ?? 'una RFQ'}.`,
          entity_type: 'quote_request',
          entity_id: quoteId,
        });
      });

      return clone(state.quoteRequests.find((quote) => quote.id === quoteId));
    },

    async getNotifications(userId) {
      return clone(
        state.notifications
          .filter((notification) => notification.recipient_id === userId)
          .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()),
      );
    },

    async markNotificationRead(notificationId, userId) {
      state.notifications = state.notifications.map((notification) => (
        notification.id === notificationId && notification.recipient_id === userId
          ? { ...notification, read_at: notification.read_at ?? new Date().toISOString() }
          : notification
      ));

      return clone(state.notifications.find((notification) => notification.id === notificationId) ?? null);
    },

    async markAllNotificationsRead(userId) {
      const readAt = new Date().toISOString();
      state.notifications = state.notifications.map((notification) => (
        notification.recipient_id === userId && !notification.read_at
          ? { ...notification, read_at: readAt }
          : notification
      ));
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
        dedupeLatestPriceAlerts(
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
        )
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
      state.supplier.pendingSubscription = null;
      return clone(subscription);
    },

    async requestFlowPlanActivation(supplierId, planId, billingCustomerEmail) {
      const plan = state.plans.find((item) => item.id === planId);
      const existingPending = state.supplier.subscriptions.find((item) => item.status === 'pending_payment' && item.supplier_id === supplierId);
      if (existingPending?.plan_id === planId) return clone(existingPending);

      state.supplier.subscriptions = state.supplier.subscriptions.map((subscription) => (
        subscription.supplier_id === supplierId && subscription.status === 'pending_payment'
          ? { ...subscription, status: 'cancelled', billing_status: 'cancelled' }
          : subscription
      ));

      const subscription = buildSubscription(plan, {
        supplier_id: supplierId,
        plan_id: planId,
        status: 'pending_payment',
        billing_provider: 'flow',
        billing_status: 'pending_checkout',
        billing_reference: `flow-placeholder-${supplierId}-${state.supplier.subscriptions.length + 1}`,
        billing_customer_email: billingCustomerEmail ?? supplier.email,
      });
      state.supplier.subscriptions.unshift(subscription);
      state.supplier.pendingSubscription = subscription;
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
      requestSupplierPlanBilling: async (planId) => api.requestFlowPlanActivation(supplier.id, planId, supplier.email),
    }),
  };

  return {
    state,
    api,
    auth,
  };
}
