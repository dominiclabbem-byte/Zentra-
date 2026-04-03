import { describe, expect, it } from 'vitest';
import { createMarketplaceScenario } from './marketplaceScenario';

describe('marketplaceScenario', () => {
  it('permite encadenar buyer -> supplier -> buyer con estado persistente', async () => {
    const scenario = createMarketplaceScenario();

    const createdQuote = await scenario.api.createQuoteRequest({
      buyer_id: 'buyer-1',
      requester_id: 'buyer-1',
      product_name: 'Azucar flor',
      category_id: 'cat-1',
      quantity: 300,
      unit: 'kg',
      delivery_date: '2026-04-01',
      notes: 'Entrega a primera hora',
    });

    expect(createdQuote.status).toBe('in_review');

    const relevantQuotes = await scenario.api.getRelevantQuoteRequestsForSupplier('supplier-1');
    expect(relevantQuotes.some((quote) => quote.id === createdQuote.id)).toBe(true);

    const offer = await scenario.api.submitOffer({
      quoteId: createdQuote.id,
      supplierId: 'supplier-1',
      responderId: 'supplier-1',
      price: 1190,
      notes: 'Descuento por volumen',
      estimatedLeadTime: '3 dias',
    });

    expect(offer.status).toBe('pending');

    const buyerQuotes = await scenario.api.getQuoteRequestsForBuyer('buyer-1');
    expect(buyerQuotes[0].quote_offers).toHaveLength(1);

    await scenario.api.acceptOffer(offer.id);

    const closedQuotes = await scenario.api.getQuoteRequestsForBuyer('buyer-1');
    expect(closedQuotes.find((quote) => quote.id === createdQuote.id).status).toBe('closed');

    const supplierOffers = await scenario.api.getOffersForSupplier('supplier-1');
    expect(supplierOffers.find((item) => item.id === offer.id).status).toBe('accepted');
  });

  it('actualiza limites y uso de plan sin perder el historial', async () => {
    const scenario = createMarketplaceScenario();

    const nextSubscription = await scenario.api.subscribeToPlan('supplier-1', 'plan-3');
    expect(nextSubscription.plans.name).toBe('enterprise');

    const usage = await scenario.api.getSupplierUsageSummary('supplier-1');
    expect(usage.activeProducts).toBeGreaterThan(0);
    expect(usage.quoteResponsesThisMonth).toBeGreaterThan(0);
  });

  it('permite preparar una solicitud pending_payment para Flow sin cambiar el plan activo', async () => {
    const scenario = createMarketplaceScenario();

    const request = await scenario.api.requestFlowPlanActivation('supplier-1', 'plan-3', 'billing@vallefrio.cl');

    expect(request.status).toBe('pending_payment');
    expect(request.billing_provider).toBe('flow');
    expect(request.billing_status).toBe('pending_checkout');

    const active = await scenario.api.getActiveSubscription('supplier-1');
    expect(active.plan_id).toBe('plan-2');
  });

  it('evita duplicar favoritos y suscripciones de alerta ya existentes', async () => {
    const scenario = createMarketplaceScenario();

    expect(await scenario.api.toggleFavorite('buyer-1', 'supplier-1')).toBe(false);
    expect((await scenario.api.getFavorites('buyer-1')).length).toBe(0);

    expect(await scenario.api.toggleFavorite('buyer-1', 'supplier-1')).toBe(true);
    expect((await scenario.api.getFavorites('buyer-1')).length).toBe(1);

    const existingAlert = await scenario.api.subscribeToPriceAlert('buyer-1', {
      categoryId: 'cat-1',
      productId: null,
    });
    expect(existingAlert.id).toBe('subscription-1');

    const productAlert = await scenario.api.subscribeToPriceAlert('buyer-1', {
      categoryId: null,
      productId: 'prod-2',
    });
    expect(productAlert.product_id).toBe('prod-2');
    expect((await scenario.api.getPriceAlertSubscriptions('buyer-1')).length).toBe(2);
  });

  it('registra conversaciones de agente y conserva el orden de mensajes', async () => {
    const scenario = createMarketplaceScenario();

    const conversation = await scenario.api.createAgentConversation('agent-1', {
      contactName: 'Juan Perez',
      channel: 'voice',
    });

    await scenario.api.saveAgentMessage(conversation.id, {
      role: 'assistant',
      content: 'Hola, puedo ayudarte con tu cotizacion.',
    });
    await scenario.api.saveAgentMessage(conversation.id, {
      role: 'user',
      content: 'Necesito 300 kg de harina premium.',
    });

    const messages = await scenario.api.getConversationMessages(conversation.id);
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('assistant');
    expect(messages[1].role).toBe('user');
  });

  it('al aceptar una oferta rechaza las competidoras y actualiza stats del supplier', async () => {
    const scenario = createMarketplaceScenario();

    const rivalOffer = await scenario.api.submitOffer({
      quoteId: 'quote-1',
      supplierId: 'supplier-1',
      responderId: 'supplier-1',
      price: 1280,
      notes: 'Oferta alternativa',
      estimatedLeadTime: '4 dias',
    });

    await scenario.api.acceptOffer('offer-1');

    const offersForQuote = await scenario.api.getOffersForQuote('quote-1');
    expect(offersForQuote.find((offer) => offer.id === 'offer-1').status).toBe('accepted');
    expect(offersForQuote.find((offer) => offer.id === rivalOffer.id).status).toBe('rejected');

    const supplierStats = await scenario.api.getSupplierStats('supplier-1');
    expect(supplierStats.totalSales).toBeGreaterThanOrEqual(1);
  });

  it('al cancelar una RFQ la saca del inbox supplier y rechaza ofertas pendientes', async () => {
    const scenario = createMarketplaceScenario();

    await scenario.api.submitOffer({
      quoteId: 'quote-1',
      supplierId: 'supplier-1',
      responderId: 'supplier-1',
      price: 1210,
      notes: 'Disponible esta semana',
      estimatedLeadTime: '3 dias',
    });

    await scenario.api.cancelQuoteRequest('quote-1');

    const buyerQuotes = await scenario.api.getQuoteRequestsForBuyer('buyer-1');
    expect(buyerQuotes.find((quote) => quote.id === 'quote-1').status).toBe('cancelled');

    const relevantQuotes = await scenario.api.getRelevantQuoteRequestsForSupplier('supplier-1');
    expect(relevantQuotes.some((quote) => quote.id === 'quote-1')).toBe(false);

    const supplierOffers = await scenario.api.getOffersForSupplier('supplier-1');
    expect(supplierOffers.find((offer) => offer.quote_id === 'quote-1').status).toBe('rejected');
  });

  it('mantiene consistente el catalogo supplier al crear, editar y eliminar productos', async () => {
    const scenario = createMarketplaceScenario();

    const created = await scenario.api.createProduct({
      supplier_id: 'supplier-1',
      category_id: 'cat-2',
      name: 'Crema pastelera',
      description: 'Base lactea para reposteria',
      price: 4200,
      price_unit: 'kg',
      stock: 60,
      stock_unit: 'kg',
      status: 'active',
    });
    expect(created.name).toBe('Crema pastelera');

    const updated = await scenario.api.updateProduct(created.id, {
      price: 4500,
      status: 'low_stock',
    });
    expect(updated.price).toBe(4500);
    expect(updated.status).toBe('low_stock');

    const usageAfterUpdate = await scenario.api.getSupplierUsageSummary('supplier-1');
    expect(usageAfterUpdate.activeProducts).toBeGreaterThan(0);

    await scenario.api.deleteProduct(created.id);
    const products = await scenario.api.getProducts({ supplierId: 'supplier-1', includeAllStatuses: true });
    expect(products.some((product) => product.id === created.id)).toBe(false);
  });

  it('permite crear una review y luego recuperarla desde la ficha del proveedor', async () => {
    const scenario = createMarketplaceScenario();
    const quote = await scenario.api.createQuoteRequest({
      buyer_id: 'buyer-1',
      requester_id: 'buyer-1',
      product_name: 'Crema premium',
      category_id: 'cat-2',
      quantity: 40,
      unit: 'kg',
      delivery_date: '2026-04-20',
      notes: 'Entrega AM',
    });
    const offer = await scenario.api.submitOffer({
      quoteId: quote.id,
      supplierId: 'supplier-1',
      responderId: 'supplier-1',
      price: 2200,
      notes: 'Lote refrigerado',
      estimatedLeadTime: '48 horas',
    });
    await scenario.api.acceptOffer(offer.id);

    const review = await scenario.api.createReview({
      reviewerId: 'buyer-1',
      reviewedId: 'supplier-1',
      quoteOfferId: offer.id,
      rating: 5,
      comment: 'Llego puntual y con excelente calidad.',
    });

    expect(review.reviewed_id).toBe('supplier-1');

    const reviews = await scenario.api.getReviewsForUser('supplier-1');
    expect(reviews.some((item) => item.id === review.id)).toBe(true);
    expect(reviews[0].comment).toContain('excelente calidad');
  });

  it('solo permite reseñar contrapartes con una oferta aceptada elegible', async () => {
    const scenario = createMarketplaceScenario();

    await expect(scenario.api.createReview({
      reviewerId: 'buyer-1',
      reviewedId: 'supplier-1',
      quoteOfferId: 'offer-1',
      rating: 4,
      comment: 'No deberia pasar',
    })).rejects.toThrow(/operaciones aceptadas/i);
  });

  it('expone oportunidades de reseña y recalcula el rating agregado tras una nueva review', async () => {
    const scenario = createMarketplaceScenario();
    const quote = await scenario.api.createQuoteRequest({
      buyer_id: 'buyer-1',
      requester_id: 'buyer-1',
      product_name: 'Mantequilla premium',
      category_id: 'cat-2',
      quantity: 80,
      unit: 'kg',
      delivery_date: '2026-04-21',
      notes: 'Entrega a primera hora',
    });
    const offer = await scenario.api.submitOffer({
      quoteId: quote.id,
      supplierId: 'supplier-1',
      responderId: 'supplier-1',
      price: 4100,
      notes: 'Incluye cadena de frio',
      estimatedLeadTime: '72 horas',
    });
    await scenario.api.acceptOffer(offer.id);

    const opportunitiesBefore = await scenario.api.getBuyerReviewOpportunities('buyer-1');
    expect(opportunitiesBefore.some((item) => item.quoteOfferId === offer.id)).toBe(true);

    const statsBefore = await scenario.api.getSupplierStats('supplier-1');

    await scenario.api.createReview({
      reviewerId: 'buyer-1',
      reviewedId: 'supplier-1',
      quoteOfferId: offer.id,
      rating: 4,
      comment: 'Buen servicio y entrega ordenada.',
    });

    const opportunitiesAfter = await scenario.api.getBuyerReviewOpportunities('buyer-1');
    expect(opportunitiesAfter.some((item) => item.quoteOfferId === offer.id)).toBe(false);

    const statsAfter = await scenario.api.getSupplierStats('supplier-1');
    expect(statsAfter.totalReviews).toBe(statsBefore.totalReviews + 1);
    expect(statsAfter.rating).toBeGreaterThan(0);
    expect(statsAfter.rating).not.toBe(statsBefore.rating);
  });

  it('filtra alertas segun suscripciones activas y deja de mostrarlas al remover la suscripcion', async () => {
    const scenario = createMarketplaceScenario();

    const alertsBefore = await scenario.api.getPriceAlerts('buyer-1');
    expect(alertsBefore.length).toBeGreaterThan(0);

    await scenario.api.removePriceAlertSubscription('subscription-1', 'buyer-1');

    const subscriptions = await scenario.api.getPriceAlertSubscriptions('buyer-1');
    expect(subscriptions.some((item) => item.id === 'subscription-1')).toBe(false);

    const alertsAfter = await scenario.api.getPriceAlerts('buyer-1');
    expect(alertsAfter.length).toBe(0);
  });

  it('deduplica el feed de alertas y conserva solo el cambio mas reciente por producto', async () => {
    const scenario = createMarketplaceScenario();

    scenario.state.priceAlerts.unshift({
      ...scenario.state.priceAlerts[0],
      id: 'alert-2',
      old_price: 1200,
      new_price: 1180,
      created_at: '2026-03-24T12:00:00Z',
    });

    const alerts = await scenario.api.getPriceAlerts('buyer-1');

    expect(alerts).toHaveLength(1);
    expect(alerts[0].id).toBe('alert-2');
    expect(alerts[0].new_price).toBe(1180);
  });

  it('genera notificaciones in-app para RFQs, ofertas y aceptaciones', async () => {
    const scenario = createMarketplaceScenario();

    const quote = await scenario.api.createQuoteRequest({
      buyer_id: 'buyer-1',
      requester_id: 'buyer-1',
      product_name: 'Aceite vegetal',
      category_id: 'cat-1',
      quantity: 40,
      unit: 'cajas',
      delivery_date: '2026-04-18',
      notes: 'Entrega PM',
    });

    const supplierNotifications = await scenario.api.getNotifications('supplier-1');
    expect(supplierNotifications.some((item) => item.type === 'rfq_created' && item.entity_id === quote.id)).toBe(true);

    const offer = await scenario.api.submitOffer({
      quoteId: quote.id,
      supplierId: 'supplier-1',
      responderId: 'supplier-1',
      price: 2100,
      notes: 'Incluye despacho',
      estimatedLeadTime: '48 horas',
    });

    const buyerNotifications = await scenario.api.getNotifications('buyer-1');
    expect(buyerNotifications.some((item) => item.type === 'offer_received' && item.entity_id === offer.id)).toBe(true);

    await scenario.api.acceptOffer(offer.id);

    const supplierNotificationsAfter = await scenario.api.getNotifications('supplier-1');
    expect(supplierNotificationsAfter.some((item) => item.type === 'offer_accepted' && item.entity_id === offer.id)).toBe(true);
  });

  it('permite marcar notificaciones como leidas', async () => {
    const scenario = createMarketplaceScenario();

    const notifications = await scenario.api.getNotifications('buyer-1');
    expect(notifications[0].read_at).toBeNull();

    await scenario.api.markNotificationRead(notifications[0].id, 'buyer-1');
    const updated = await scenario.api.getNotifications('buyer-1');
    expect(updated[0].read_at).not.toBeNull();

    await scenario.api.markAllNotificationsRead('buyer-1');
    const allRead = await scenario.api.getNotifications('buyer-1');
    expect(allRead.every((item) => item.read_at)).toBe(true);
  });
});
