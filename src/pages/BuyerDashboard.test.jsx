import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildMarketplaceSeed, buildPriceAlertSubscription, buildQuoteOffer, buildQuoteRequest } from '../test/marketplaceFixtures';
import { renderWithRouter } from '../test/renderWithRouter';
import BuyerDashboard from './BuyerDashboard';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockDatabase = vi.hoisted(() => ({
  acceptOffer: vi.fn(),
  cancelQuoteRequest: vi.fn(),
  createReview: vi.fn(),
  createQuoteRequest: vi.fn(),
  getBuyerReviewOpportunities: vi.fn(),
  getBuyerStats: vi.fn(),
  getFavorites: vi.fn(),
  getProducts: vi.fn(),
  getPriceAlerts: vi.fn(),
  getPriceAlertSubscriptions: vi.fn(),
  getQuoteRequestsForBuyer: vi.fn(),
  getReviewsForUser: vi.fn(),
  getSupplierProfile: vi.fn(),
  getSupplierStats: vi.fn(),
  removePriceAlertSubscription: vi.fn(),
  subscribeToPriceAlert: vi.fn(),
  toggleFavorite: vi.fn(),
}));

vi.mock('../services/database', () => mockDatabase);

describe('BuyerDashboard', () => {
  const seed = buildMarketplaceSeed();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      currentUser: seed.buyer,
      categories: seed.categories,
      saveBuyerProfile: vi.fn(),
    });

    mockDatabase.getProducts.mockResolvedValue(seed.products);
    mockDatabase.getQuoteRequestsForBuyer.mockResolvedValue(
      seed.quoteRequests.filter((quote) => quote.buyer_id === 'buyer-1'),
    );
    mockDatabase.getBuyerStats.mockResolvedValue({ totalOrders: 1, rating: 4.8, favoriteSuppliers: 1 });
    mockDatabase.getBuyerReviewOpportunities.mockResolvedValue([]);
    mockDatabase.getFavorites.mockResolvedValue(seed.favorites);
    mockDatabase.getPriceAlertSubscriptions.mockResolvedValue(seed.priceAlertSubscriptions);
    mockDatabase.getPriceAlerts.mockResolvedValue(seed.priceAlerts);
    mockDatabase.subscribeToPriceAlert.mockResolvedValue(
      buildPriceAlertSubscription({
        id: 'subscription-2',
        buyer_id: 'buyer-1',
        category_id: 'cat-2',
        categories: seed.categories[1],
      }),
    );
    mockDatabase.getSupplierStats.mockResolvedValue({ rating: 4.9, totalSales: 4, recurringClients: 2 });
    mockDatabase.getSupplierProfile.mockResolvedValue(seed.supplier);
    mockDatabase.getReviewsForUser.mockResolvedValue(seed.reviews);
    mockDatabase.toggleFavorite.mockResolvedValue(true);
  });

  it('muestra datos reales de favoritos y alertas en sus tabs', async () => {
    const user = userEvent.setup();

    renderWithRouter(<BuyerDashboard />);

    expect(await screen.findByText('Harina premium')).toBeInTheDocument();
    expect(screen.getByText('Alerta activa')).toBeInTheDocument();
    expect(screen.getByText('Precio a la baja')).toBeInTheDocument();
    expect(screen.getByText(/Antes \$1\.350/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Favoritos' }));
    expect(await screen.findByText('Valle Frio SpA')).toBeInTheDocument();
    expect(screen.getByText(/Guardado /)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Alertas' }));
    expect(await screen.findByText('Cambios recientes de precio')).toBeInTheDocument();
    expect(screen.getAllByText('Harina premium').length).toBeGreaterThan(0);
    expect(screen.getByText(/Valle Frio SpA \/ Harinas y cereales/)).toBeInTheDocument();
  });

  it('permite crear una suscripcion de alerta por categoria', async () => {
    const user = userEvent.setup();

    renderWithRouter(<BuyerDashboard />);

    await user.click(screen.getByRole('button', { name: 'Alertas' }));
    await screen.findByText('Seguir alertas de precio');

    await user.selectOptions(screen.getByLabelText('Categoria'), 'cat-2');
    await user.click(screen.getByRole('button', { name: 'Guardar alerta' }));

    await waitFor(() => {
      expect(mockDatabase.subscribeToPriceAlert).toHaveBeenCalledWith('buyer-1', {
        categoryId: 'cat-2',
        productId: null,
      });
    });
  });

  it('permite crear una nueva RFQ desde el modal principal', async () => {
    const user = userEvent.setup();
    const createdQuote = buildQuoteRequest({
      id: 'quote-99',
      buyer_id: 'buyer-1',
      requester_id: 'buyer-1',
      product_name: 'Mantequilla premium',
      category_id: 'cat-2',
      quantity: 120,
      unit: 'kg',
      delivery_date: '2026-04-12',
      notes: 'Despacho refrigerado AM',
      categories: seed.categories[1],
      users: seed.buyer,
      quote_offers: [],
    });
    mockDatabase.createQuoteRequest.mockResolvedValue(createdQuote);

    renderWithRouter(<BuyerDashboard />);

    await user.click(await screen.findByRole('button', { name: 'Nueva cotizacion' }));
    await user.type(screen.getByLabelText(/Producto necesitado/i), 'Mantequilla premium');
    await user.selectOptions(screen.getByLabelText('Categoria'), 'cat-2');
    await user.type(screen.getByLabelText(/Cantidad/i), '120');
    await user.selectOptions(screen.getByLabelText('Unidad'), 'kg');
    await user.type(screen.getByLabelText(/Fecha de entrega requerida/i), '2026-04-12');
    await user.type(screen.getByLabelText(/Notas para proveedores/i), 'Despacho refrigerado AM');
    await user.click(screen.getByRole('button', { name: 'Enviar cotizacion' }));

    await waitFor(() => {
      expect(mockDatabase.createQuoteRequest).toHaveBeenCalledWith({
        buyer_id: 'buyer-1',
        requester_id: 'buyer-1',
        product_name: 'Mantequilla premium',
        category_id: 'cat-2',
        quantity: 120,
        unit: 'kg',
        delivery_date: '2026-04-12',
        notes: 'Despacho refrigerado AM',
      });
    });

    expect(await screen.findByText('Cotizacion creada. Ahora los proveedores pueden ofertar.')).toBeInTheDocument();
    expect(await screen.findByText('Mantequilla premium')).toBeInTheDocument();
  });

  it('permite dejar una reseña para una oferta aceptada elegible', async () => {
    const user = userEvent.setup();
    const acceptedQuote = buildQuoteRequest({
      id: 'quote-accepted',
      buyer_id: 'buyer-1',
      requester_id: 'buyer-1',
      product_name: 'Crema premium',
      category_id: 'cat-2',
      quantity: 60,
      unit: 'kg',
      delivery_date: '2026-04-15',
      status: 'closed',
      categories: seed.categories[1],
      users: seed.buyer,
      quote_offers: [],
    });
    const acceptedOffer = buildQuoteOffer({
      id: 'offer-accepted',
      quote_id: 'quote-accepted',
      quote_requests: acceptedQuote,
      supplier_id: 'supplier-1',
      responder_id: 'supplier-1',
      price: 1850,
      notes: 'Oferta aceptada',
      estimated_lead_time: '48 horas',
      status: 'accepted',
      users: {
        id: 'supplier-1',
        company_name: 'Valle Frio SpA',
        city: 'Santiago',
        verified: true,
      },
    });
    acceptedQuote.quote_offers = [acceptedOffer];

    mockDatabase.getQuoteRequestsForBuyer.mockResolvedValue([
      acceptedQuote,
    ]);
    mockDatabase.getBuyerReviewOpportunities.mockResolvedValue([
      {
        quoteOfferId: 'offer-accepted',
        quoteId: 'quote-accepted',
        reviewedId: 'supplier-1',
        supplierName: 'Valle Frio SpA',
        productName: 'Crema premium',
      },
    ]);
    mockDatabase.createReview.mockResolvedValue({
      id: 'review-99',
      quote_offer_id: 'offer-accepted',
    });

    renderWithRouter(<BuyerDashboard />);

    await user.click(await screen.findByRole('button', { name: 'Mi Perfil' }));
    await user.click(await screen.findByRole('button', { name: 'Dejar reseña' }));
    await user.selectOptions(screen.getByLabelText(/Calificacion/i), '5');
    await user.type(screen.getByLabelText(/Comentario/i), 'Entrega impecable y muy buena comunicación.');
    await user.click(screen.getByRole('button', { name: 'Publicar reseña' }));

    await waitFor(() => {
      expect(mockDatabase.createReview).toHaveBeenCalledWith({
        reviewerId: 'buyer-1',
        reviewedId: 'supplier-1',
        quoteOfferId: 'offer-accepted',
        rating: 5,
        comment: 'Entrega impecable y muy buena comunicación.',
      });
    });
  });
});
