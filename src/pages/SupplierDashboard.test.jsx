import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildMarketplaceSeed, buildPlan, buildQuoteOffer, buildQuoteRequest, buildSubscription } from '../test/marketplaceFixtures';
import { renderWithRouter } from '../test/renderWithRouter';
import SupplierDashboard from './SupplierDashboard';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockDatabase = vi.hoisted(() => ({
  createProduct: vi.fn(),
  deleteProduct: vi.fn(),
  getBuyerProfile: vi.fn(),
  getBuyerStats: vi.fn(),
  getOffersForSupplier: vi.fn(),
  getQuoteConversationById: vi.fn(),
  getQuoteConversationForQuote: vi.fn(),
  getQuoteConversationMessages: vi.fn(),
  getRelevantQuoteRequestsForSupplier: vi.fn(),
  getProducts: vi.fn(),
  getReviewsForUser: vi.fn(),
  getSupplierStats: vi.fn(),
  getSupplierUsageSummary: vi.fn(),
  markQuoteConversationRead: vi.fn(),
  sendQuoteConversationMessage: vi.fn(),
  submitOffer: vi.fn(),
  updateOfferPipelineStatus: vi.fn(),
  updateProduct: vi.fn(),
}));

vi.mock('../services/database', () => mockDatabase);
vi.mock('../services/claudeApi', () => ({ chatWithAgent: vi.fn() }));
vi.mock('../services/ttsService', () => ({ speakText: vi.fn(), stopSpeaking: vi.fn() }));
vi.mock('../services/imageGenerator', () => ({ generateProductImage: vi.fn() }));
vi.mock('../components/VoiceCall', () => ({ default: () => null }));

describe('SupplierDashboard', () => {
  const seed = buildMarketplaceSeed();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      currentUser: seed.supplier,
      categories: seed.categories,
      plans: seed.plans,
      saveSupplierProfile: vi.fn(),
      changeSupplierPlan: vi.fn().mockResolvedValue(seed.supplier),
      requestSupplierPlanBilling: vi.fn().mockResolvedValue(seed.supplier),
    });

    mockDatabase.getProducts.mockResolvedValue(seed.products);
    mockDatabase.getRelevantQuoteRequestsForSupplier.mockResolvedValue(
      seed.quoteRequests.filter((quote) => quote.buyer_id === 'buyer-1' && ['open', 'in_review'].includes(quote.status)),
    );
    mockDatabase.getOffersForSupplier.mockResolvedValue(seed.quoteOffers);
    mockDatabase.getSupplierStats.mockResolvedValue({
      rating: 4.7,
      totalSales: 1,
      recurringClients: 3,
      totalReviews: 2,
    });
    mockDatabase.getReviewsForUser.mockResolvedValue(seed.reviews);
    mockDatabase.getSupplierUsageSummary.mockResolvedValue({
      activeProducts: 2,
      quoteResponsesThisMonth: 2,
      aiConversationsThisMonth: 4,
      voiceCallsThisMonth: 1,
    });
    mockDatabase.updateOfferPipelineStatus.mockResolvedValue({
      ...seed.quoteOffers[0],
      pipeline_status: 'negotiation',
    });
    mockDatabase.submitOffer.mockResolvedValue(
      buildQuoteOffer({
        id: 'offer-99',
        quote_id: 'quote-1',
        supplier_id: 'supplier-1',
        responder_id: 'supplier-1',
        price: 1320,
        notes: 'Incluye entrega en frio',
        estimated_lead_time: '48 horas',
      }),
    );
    mockDatabase.getQuoteConversationForQuote.mockResolvedValue(seed.quoteConversations[0]);
    mockDatabase.getQuoteConversationById.mockResolvedValue(seed.quoteConversations[0]);
    mockDatabase.getQuoteConversationMessages.mockResolvedValue(seed.quoteConversationMessages);
    mockDatabase.markQuoteConversationRead.mockResolvedValue(seed.quoteConversations[0]);
    mockDatabase.sendQuoteConversationMessage.mockResolvedValue({
      id: 'conversation-message-2',
      conversation_id: 'conversation-1',
      sender_user_id: 'supplier-1',
      body: 'Podemos mover la entrega a primera hora.',
      created_at: '2026-03-24T10:15:00Z',
      sender: seed.supplier,
    });
  });

  it('muestra summary, cartera buyer y plan activo desde datos reales', async () => {
    const user = userEvent.setup();

    renderWithRouter(<SupplierDashboard />);

    expect(await screen.findByText('Win rate')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Compradores/ }));
    expect(await screen.findByText('Pasteleria Mozart')).toBeInTheDocument();
    expect(screen.getByText('Hotel Ritz Santiago')).toBeInTheDocument();
    expect(screen.getByText('Cliente ganado')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Plan/ }));
    expect(await screen.findByText('Workspace activo')).toBeInTheDocument();
    expect(screen.getByText('Agents IA')).toBeInTheDocument();
    expect(screen.getByText('RFQs respondidas')).toBeInTheDocument();
  });

  it('permite actualizar pipeline interno de una oferta pendiente', async () => {
    const user = userEvent.setup();

    renderWithRouter(<SupplierDashboard />);

    const pipelineSelect = await screen.findByLabelText('Pipeline interno');
    await user.selectOptions(pipelineSelect, 'negotiation');

    await waitFor(() => {
      expect(mockDatabase.updateOfferPipelineStatus).toHaveBeenCalledWith({
        offerId: 'offer-1',
        supplierId: 'supplier-1',
        pipelineStatus: 'negotiation',
      });
    });
  });

  it('permite responder una RFQ abierta desde el inbox', async () => {
    const user = userEvent.setup();
    const openQuote = buildQuoteRequest({
      id: 'quote-open',
      buyer_id: 'buyer-1',
      requester_id: 'buyer-1',
      product_name: 'Crema vegetal',
      category_id: 'cat-1',
      quantity: 80,
      unit: 'cajas',
      delivery_date: '2026-04-05',
      notes: 'Entrega refrigerada antes de las 10 AM',
      status: 'open',
      categories: seed.categories[0],
      users: seed.buyer,
      quote_offers: [],
    });
    mockDatabase.getRelevantQuoteRequestsForSupplier.mockResolvedValue([openQuote]);
    mockDatabase.getOffersForSupplier.mockResolvedValue(
      seed.quoteOffers.filter((offer) => offer.quote_id !== openQuote.id),
    );

    renderWithRouter(<SupplierDashboard />);

    const quoteButtons = await screen.findAllByRole('button', { name: 'Cotizar' });
    await user.click(quoteButtons[0]);
    await screen.findByText('Precio ofertado (CLP)');

    await user.type(screen.getByLabelText(/Precio ofertado/i), '1320');
    await user.type(screen.getByLabelText(/Lead time estimado/i), '48 horas');
    await user.type(screen.getByLabelText(/Notas adicionales/i), 'Incluye entrega en frio');
    await user.click(screen.getByRole('button', { name: 'Enviar oferta' }));

    await waitFor(() => {
      expect(mockDatabase.submitOffer).toHaveBeenCalledWith({
        quoteId: 'quote-open',
        supplierId: 'supplier-1',
        responderId: 'supplier-1',
        price: 1320,
        notes: 'Incluye entrega en frio',
        estimatedLeadTime: '48 horas',
      });
    });

    expect(await screen.findByText(/Oferta enviada a Pasteleria Mozart/i)).toBeInTheDocument();
  });

  it('permite abrir una conversacion desde una oferta enviada y responder', async () => {
    const user = userEvent.setup();

    renderWithRouter(<SupplierDashboard />);

    const openConversationButtons = await screen.findAllByRole('button', { name: 'Abrir conversacion' });
    await user.click(openConversationButtons[0]);

    expect(await screen.findByText('Conversacion RFQ')).toBeInTheDocument();
    expect(screen.getByText(/Podemos entregar en 48 horas/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText('Mensaje'), 'Podemos mover la entrega a primera hora.');
    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }));

    await waitFor(() => {
      expect(mockDatabase.sendQuoteConversationMessage).toHaveBeenCalledWith({
        conversationId: 'conversation-1',
        senderUserId: 'supplier-1',
        body: 'Podemos mover la entrega a primera hora.',
      });
    });
  });

  it('muestra la conversacion cerrada en solo lectura', async () => {
    const user = userEvent.setup();
    const closedConversation = {
      ...seed.quoteConversations[0],
      status: 'closed',
      isClosed: true,
    };

    mockDatabase.getQuoteConversationForQuote.mockResolvedValue(closedConversation);
    mockDatabase.getQuoteConversationById.mockResolvedValue(closedConversation);
    mockDatabase.markQuoteConversationRead.mockResolvedValue(closedConversation);

    renderWithRouter(<SupplierDashboard />);

    const openConversationButtons = await screen.findAllByRole('button', { name: 'Abrir conversacion' });
    await user.click(openConversationButtons[0]);

    expect(await screen.findByText(/Esta conversacion quedo en solo lectura/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Mensaje')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Enviar mensaje' })).toBeDisabled();
  });

  it('permite cambiar el plan desde la tab de plan', async () => {
    const user = userEvent.setup();
    const authValue = {
      currentUser: seed.supplier,
      categories: seed.categories,
      plans: seed.plans,
      saveSupplierProfile: vi.fn(),
      changeSupplierPlan: vi.fn().mockResolvedValue(seed.supplier),
      requestSupplierPlanBilling: vi.fn().mockResolvedValue(seed.supplier),
    };
    mockUseAuth.mockReturnValue(authValue);

    renderWithRouter(<SupplierDashboard />);

    await user.click(await screen.findByRole('button', { name: /Plan/ }));
    await user.click(screen.getByRole('button', { name: 'Cambiar a Enterprise' }));

    await waitFor(() => {
      expect(authValue.changeSupplierPlan).toHaveBeenCalledWith('plan-3');
    });
  });

  it('aplica feature gates para plan starter cuando el limite mensual ya fue usado', async () => {
    const user = userEvent.setup();

    const starterPlan = buildPlan({
      id: 'plan-1',
      name: 'starter',
      price_clp: 150000,
      has_agents: false,
      has_voice_calls: false,
      has_crm: false,
      has_api: false,
      max_active_products: 25,
      max_quote_responses_per_month: 20,
      max_ai_conversations_per_month: 0,
      max_voice_calls_per_month: 0,
    });
    mockUseAuth.mockReturnValue({
      currentUser: {
        ...seed.supplier,
        activeSubscription: buildSubscription(starterPlan, { supplier_id: seed.supplier.id }),
      },
      categories: seed.categories,
      plans: seed.plans,
      saveSupplierProfile: vi.fn(),
      changeSupplierPlan: vi.fn().mockResolvedValue(seed.supplier),
      requestSupplierPlanBilling: vi.fn().mockResolvedValue(seed.supplier),
    });
    mockDatabase.getSupplierUsageSummary.mockResolvedValue({
      activeProducts: 25,
      quoteResponsesThisMonth: 20,
      aiConversationsThisMonth: 0,
      voiceCallsThisMonth: 0,
    });

    renderWithRouter(<SupplierDashboard />);

    await user.click(await screen.findByRole('button', { name: /Mis Productos/ }));
    expect(await screen.findByRole('button', { name: 'Limite del plan' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Agentes de Venta IA/ }));
    expect(await screen.findByText('Actualizar a Pro')).toBeInTheDocument();
  });

  it('permite preparar una solicitud placeholder de pago con Flow', async () => {
    const user = userEvent.setup();
    const requestSupplierPlanBilling = vi.fn().mockResolvedValue(seed.supplier);
    const pendingSubscription = buildSubscription(seed.plans[2], {
      supplier_id: seed.supplier.id,
      plan_id: 'plan-3',
      status: 'pending_payment',
      billing_provider: 'flow',
      billing_status: 'pending_checkout',
      billing_reference: 'flow-placeholder-supplier-1-1',
    });
    const authValue = {
      currentUser: {
        ...seed.supplier,
        pendingSubscription,
        subscriptions: [seed.supplier.activeSubscription, pendingSubscription].filter(Boolean),
      },
      categories: seed.categories,
      plans: seed.plans,
      saveSupplierProfile: vi.fn(),
      changeSupplierPlan: vi.fn().mockResolvedValue(seed.supplier),
      requestSupplierPlanBilling,
    };
    mockUseAuth.mockReturnValue(authValue);

    renderWithRouter(<SupplierDashboard />);

    await user.click(await screen.findByRole('button', { name: /Plan/ }));
    expect(await screen.findByText(/Solicitud pendiente para Plan/i)).toBeInTheDocument();
    expect(screen.getByText('Flow pendiente para este plan')).toBeInTheDocument();
  });

  it('permite iniciar una solicitud nueva de Flow para otro plan', async () => {
    const user = userEvent.setup();
    const authValue = {
      currentUser: seed.supplier,
      categories: seed.categories,
      plans: seed.plans,
      saveSupplierProfile: vi.fn(),
      changeSupplierPlan: vi.fn().mockResolvedValue(seed.supplier),
      requestSupplierPlanBilling: vi.fn().mockResolvedValue(seed.supplier),
    };
    mockUseAuth.mockReturnValue(authValue);

    renderWithRouter(<SupplierDashboard />);

    await user.click(await screen.findByRole('button', { name: /Plan/ }));
    const flowButtons = screen.getAllByRole('button', { name: 'Preparar pago con Flow' });
    await user.click(flowButtons[0]);

    await waitFor(() => {
      expect(authValue.requestSupplierPlanBilling).toHaveBeenCalled();
    });
  });
});
