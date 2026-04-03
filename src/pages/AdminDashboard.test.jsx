import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithRouter } from '../test/renderWithRouter';
import AdminDashboard from './AdminDashboard';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockDatabase = vi.hoisted(() => ({
  getCategories: vi.fn(),
  getPlans: vi.fn(),
}));

vi.mock('../services/database', () => mockDatabase);

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      currentUser: {
        id: 'admin-1',
        company_name: 'Zentra Admin',
        is_admin: true,
      },
    });
    mockDatabase.getCategories.mockResolvedValue([
      { id: 'cat-1', name: 'Harinas y cereales', emoji: '🌾' },
      { id: 'cat-2', name: 'Lacteos', emoji: '🧀' },
    ]);
    mockDatabase.getPlans.mockResolvedValue([
      { id: 'plan-1', name: 'starter', price_clp: 150000 },
      { id: 'plan-2', name: 'pro', price_clp: 280000 },
    ]);
  });

  it('muestra el panel admin y datos base del backfill', async () => {
    renderWithRouter(<AdminDashboard />);

    expect(await screen.findByText('Panel de administracion')).toBeInTheDocument();
    expect(screen.getByText('Categorias cargadas')).toBeInTheDocument();
    expect(screen.getByText('Planes disponibles')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });
});
