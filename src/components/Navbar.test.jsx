import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithRouter } from '../test/renderWithRouter';
import Navbar from './Navbar';

const mockUseAuth = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      currentUser: {
        id: 'buyer-1',
        company_name: 'Pasteleria Mozart',
        is_buyer: true,
        is_supplier: false,
        is_admin: false,
      },
      notifications: [
        {
          id: 'notification-1',
          title: 'Nueva oferta recibida',
          message: 'Valle Frio SpA envio una oferta para Harina premium.',
          created_at: '2026-03-24T11:00:00Z',
          read_at: null,
          type: 'offer_received',
          entity_type: 'quote_offer',
          entity_id: 'offer-1',
        },
      ],
      unreadNotificationsCount: 1,
      readAllNotifications: vi.fn(),
      readNotification: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('muestra contador y dropdown de notificaciones', async () => {
    const user = userEvent.setup();

    renderWithRouter(<Navbar />);

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));

    expect(screen.getByText('Nueva oferta recibida')).toBeInTheDocument();
    expect(screen.getByText(/Valle Frio SpA envio una oferta/i)).toBeInTheDocument();
    expect(screen.getByText(/1 sin leer/i)).toBeInTheDocument();
  });

  it('muestra links alineados al rol autenticado', () => {
    renderWithRouter(<Navbar />);

    expect(screen.getByRole('link', { name: 'Dashboard Comprador' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Activar Perfil Proveedor' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Activar Perfil Comprador' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Dashboard Proveedor' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
  });

  it('navega con state contextual al hacer click en una notificacion buyer', async () => {
    const user = userEvent.setup();
    const readNotification = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      currentUser: {
        id: 'buyer-1',
        company_name: 'Pasteleria Mozart',
        is_buyer: true,
        is_supplier: false,
        is_admin: false,
      },
      notifications: [
        {
          id: 'notification-1',
          title: 'Nueva oferta recibida',
          message: 'Valle Frio SpA envio una oferta para Harina premium.',
          created_at: '2026-03-24T11:00:00Z',
          read_at: null,
          type: 'offer_received',
          entity_type: 'quote_offer',
          entity_id: 'offer-1',
        },
      ],
      unreadNotificationsCount: 1,
      readAllNotifications: vi.fn(),
      readNotification,
      logout: vi.fn(),
    });

    renderWithRouter(<Navbar />);

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));
    await user.click(screen.getByRole('button', { name: /Nueva oferta recibida/i }));

    expect(readNotification).toHaveBeenCalledWith('notification-1');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard-comprador', {
      state: {
        activeTab: 'dashboard',
        focusOfferId: 'offer-1',
        focusQuoteId: null,
      },
    });
  });

  it('navega con state contextual al hacer click en una notificacion supplier', async () => {
    const user = userEvent.setup();
    const readNotification = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      currentUser: {
        id: 'supplier-1',
        company_name: 'Valle Frio SpA',
        is_buyer: false,
        is_supplier: true,
        is_admin: false,
      },
      notifications: [
        {
          id: 'notification-2',
          title: 'RFQ nueva disponible',
          message: 'Pasteleria Mozart solicito una cotizacion nueva.',
          created_at: '2026-03-24T12:00:00Z',
          read_at: null,
          type: 'rfq_created',
          entity_type: 'quote_request',
          entity_id: 'quote-1',
        },
      ],
      unreadNotificationsCount: 1,
      readAllNotifications: vi.fn(),
      readNotification,
      logout: vi.fn(),
    });

    renderWithRouter(<Navbar />);

    await user.click(screen.getByRole('button', { name: 'Notificaciones' }));
    await user.click(screen.getByRole('button', { name: /RFQ nueva disponible/i }));

    expect(readNotification).toHaveBeenCalledWith('notification-2');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard-proveedor', {
      state: {
        activeTab: 'quotes',
        focusQuoteId: 'quote-1',
        focusOfferId: null,
      },
    });
  });
});
