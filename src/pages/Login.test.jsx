import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithRouter } from '../test/renderWithRouter';
import Login from './Login';

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

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      currentUser: null,
      login: vi.fn(),
    });
  });

  it('redirige a dashboard comprador cuando next apunta a un rol no disponible', async () => {
    const user = userEvent.setup();
    const loginMock = vi.fn().mockResolvedValue({
      id: 'buyer-1',
      is_buyer: true,
      is_supplier: false,
      is_admin: false,
    });

    mockUseAuth.mockReturnValue({
      currentUser: null,
      login: loginMock,
    });

    renderWithRouter(<Login />, { route: '/ingresar?next=%2Fregistro-proveedor' });

    await user.type(screen.getByLabelText('Email'), 'compras@mozart.cl');
    await user.type(screen.getByLabelText('Contrasena'), 'SuperSecreta123');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard-comprador', { replace: true });
    });
  });
});
