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

    const review = await scenario.api.createReview({
      reviewerId: 'buyer-1',
      reviewedId: 'supplier-1',
      quoteOfferId: 'offer-1',
      rating: 5,
      comment: 'Llego puntual y con excelente calidad.',
    });

    expect(review.reviewed_id).toBe('supplier-1');

    const reviews = await scenario.api.getReviewsForUser('supplier-1');
    expect(reviews.some((item) => item.id === review.id)).toBe(true);
    expect(reviews[0].comment).toContain('excelente calidad');
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
});
