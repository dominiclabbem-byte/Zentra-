import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithRouter } from '../test/renderWithRouter';
import Navbar from './Navbar';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

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
});
