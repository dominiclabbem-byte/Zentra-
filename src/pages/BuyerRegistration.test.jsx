import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithRouter } from '../test/renderWithRouter';
import BuyerRegistration from './BuyerRegistration';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('BuyerRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      currentUser: null,
      categories: [
        { id: 'cat-1', name: 'Harinas', emoji: '🌾' },
      ],
      registerBuyer: vi.fn(),
      saveBuyerProfile: vi.fn(),
    });
  });

  it('muestra un mensaje claro si el RUT ya existe en otra cuenta', async () => {
    const user = userEvent.setup();
    const registerBuyer = vi.fn().mockRejectedValue(new Error('Database error saving new user'));

    mockUseAuth.mockReturnValue({
      currentUser: null,
      categories: [
        { id: 'cat-1', name: 'Harinas', emoji: '🌾' },
      ],
      registerBuyer,
      saveBuyerProfile: vi.fn(),
    });

    renderWithRouter(<BuyerRegistration />);

    await user.type(screen.getByLabelText('Email'), 'compras@mozart.cl');
    await user.type(screen.getByLabelText('Contrasena'), 'SuperSecreta123');
    await user.type(screen.getByLabelText('Confirmar contrasena'), 'SuperSecreta123');
    await user.type(screen.getByLabelText('Nombre del negocio'), 'Pasteleria Mozart');
    await user.type(screen.getByLabelText('RUT empresa'), '72.345.678-9');
    await user.type(screen.getByLabelText('Ciudad'), 'Santiago');
    await user.selectOptions(screen.getByLabelText('Tipo de negocio'), 'pasteleria');
    await user.click(screen.getByRole('button', { name: /Harinas/i }));
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Crear cuenta de comprador' }));

    expect(await screen.findByText(/Ya existe una cuenta con el RUT 72.345.678-9/i)).toBeInTheDocument();
  });
});
