import { beforeEach, describe, expect, it, vi } from 'vitest';

const signUpMock = vi.fn();

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      signUp: signUpMock,
    },
    from: vi.fn(),
  },
}));

const getCurrentUserMock = vi.fn();
const setUserCategoriesMock = vi.fn();
const subscribeToPlanMock = vi.fn();
const updateUserMock = vi.fn();

vi.mock('./database', () => ({
  getCurrentUser: getCurrentUserMock,
  setUserCategories: setUserCategoriesMock,
  subscribeToPlan: subscribeToPlanMock,
  updateUser: updateUserMock,
}));

describe('accountService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia metadata completa al signUp de buyer y no depende de insert directo en public.users', async () => {
    signUpMock.mockResolvedValue({
      data: {
        user: { id: 'auth-buyer-1' },
        session: null,
      },
      error: null,
    });

    getCurrentUserMock.mockResolvedValue(null);

    const { createBuyerAccount } = await import('./accountService');

    const result = await createBuyerAccount({
      companyName: 'Pasteleria Mozart',
      rut: '72.345.678-9',
      city: 'Santiago',
      address: 'Av. Italia 123',
      description: 'Pasteleria boutique',
      businessType: 'pasteleria',
      monthlyVolume: '1000 kg',
      contactMethod: 'email',
      categoryIds: ['cat-1'],
      phone: '+56911111111',
      whatsapp: '+56922222222',
      website: 'https://mozart.cl',
      email: 'compras@mozart.cl',
      password: 'SuperSecreta123',
    });

    expect(signUpMock).toHaveBeenCalledWith({
      email: 'compras@mozart.cl',
      password: 'SuperSecreta123',
      options: {
        data: {
          company_name: 'Pasteleria Mozart',
          rut: '72.345.678-9',
          city: 'Santiago',
          address: 'Av. Italia 123',
          description: 'Pasteleria boutique',
          phone: '+56911111111',
          whatsapp: '+56922222222',
          website: 'https://mozart.cl',
          is_buyer: true,
          is_supplier: false,
        },
      },
    });
    expect(result).toEqual({
      requiresEmailConfirmation: true,
      user: null,
    });
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it('reintenta leer el perfil y sincroniza buyer cuando el trigger demora en reflejar public.users', async () => {
    signUpMock.mockResolvedValue({
      data: {
        user: { id: 'auth-buyer-2' },
        session: { access_token: 'token' },
      },
      error: null,
    });

    getCurrentUserMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'user-buyer-2',
        company_name: 'Pasteleria Mozart',
      })
      .mockResolvedValueOnce({
        id: 'user-buyer-2',
        company_name: 'Pasteleria Mozart',
      });

    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const fromMock = vi.fn((table) => {
      if (table === 'buyer_profiles') {
        return { upsert: upsertMock };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const { supabase } = await import('./supabase');
    supabase.from = fromMock;

    const { createBuyerAccount } = await import('./accountService');

    const result = await createBuyerAccount({
      companyName: 'Pasteleria Mozart',
      rut: '72.345.678-9',
      city: 'Santiago',
      address: '',
      description: '',
      businessType: 'pasteleria',
      monthlyVolume: '1000 kg',
      contactMethod: 'email',
      categoryIds: ['cat-1', 'cat-2'],
      phone: '',
      whatsapp: '',
      website: '',
      email: 'compras@mozart.cl',
      password: 'SuperSecreta123',
    });

    expect(getCurrentUserMock).toHaveBeenCalledTimes(3);
    expect(updateUserMock).toHaveBeenCalledWith('user-buyer-2', {
      company_name: 'Pasteleria Mozart',
      rut: '72.345.678-9',
      city: 'Santiago',
      address: null,
      description: null,
      phone: null,
      whatsapp: null,
      website: null,
      is_buyer: true,
    });
    expect(upsertMock).toHaveBeenCalledWith({
      user_id: 'user-buyer-2',
      business_type: 'pasteleria',
      monthly_volume: '1000 kg',
      preferred_contact: 'email',
    });
    expect(setUserCategoriesMock).toHaveBeenCalledWith('user-buyer-2', ['cat-1', 'cat-2'], 'buyer_interest');
    expect(result).toEqual({
      requiresEmailConfirmation: false,
      user: {
        id: 'user-buyer-2',
        company_name: 'Pasteleria Mozart',
      },
    });
  });
});
