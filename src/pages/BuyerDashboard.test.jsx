import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildMarketplaceSeed, buildPriceAlertSubscription } from '../test/marketplaceFixtures';
import { renderWithRouter } from '../test/renderWithRouter';
import BuyerDashboard from './BuyerDashboard';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockDatabase = vi.hoisted(() => ({
  acceptOffer: vi.fn(),
  cancelQuoteRequest: vi.fn(),
  createQuoteRequest: vi.fn(),
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
});
