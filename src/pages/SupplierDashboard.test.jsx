import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildMarketplaceSeed, buildPlan, buildSubscription } from '../test/marketplaceFixtures';
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
  getRelevantQuoteRequestsForSupplier: vi.fn(),
  getProducts: vi.fn(),
  getReviewsForUser: vi.fn(),
  getSupplierStats: vi.fn(),
  getSupplierUsageSummary: vi.fn(),
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

  it('permite cambiar el plan desde la tab de plan', async () => {
    const user = userEvent.setup();
    const authValue = {
      currentUser: seed.supplier,
      categories: seed.categories,
      plans: seed.plans,
      saveSupplierProfile: vi.fn(),
      changeSupplierPlan: vi.fn().mockResolvedValue(seed.supplier),
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
});
