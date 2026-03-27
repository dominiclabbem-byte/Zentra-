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
});
