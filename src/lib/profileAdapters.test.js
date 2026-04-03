import { describe, expect, it } from 'vitest';
import {
  buildBuyerProfileView,
  buildSupplierProfileView,
  getDefaultDashboardPath,
  mapPlanRowToCard,
  normalizeUserRecord,
} from './profileAdapters';

describe('profileAdapters', () => {
  it('separa categorias buyer y supplier segun scope', () => {
    const normalized = normalizeUserRecord({
      id: 'user-1',
      company_name: 'Molinos y Pastas SpA',
      is_buyer: true,
      is_supplier: true,
      buyer_profiles: {
        business_type: 'pasteleria',
        monthly_volume: '2000 kg',
        preferred_contact: 'whatsapp',
      },
      supplier_profiles: {
        giro: 'Molineria',
        response_rate: 92,
      },
      subscriptions: [{ status: 'active', plans: { name: 'pro' } }],
      user_categories: [
        {
          scope: 'buyer_interest',
          categories: { id: 'cat-buyer', name: 'Lacteos', emoji: '🧀' },
        },
        {
          scope: 'supplier_catalog',
          categories: { id: 'cat-supplier', name: 'Harinas y cereales', emoji: '🌾' },
        },
      ],
    });

    expect(normalized.buyerCategories.map((category) => category.name)).toEqual(['Lacteos']);
    expect(normalized.supplierCategories.map((category) => category.name)).toEqual(['Harinas y cereales']);
    expect(normalized.activeSubscription?.plans?.name).toBe('pro');
  });

  it('construye vistas buyer y supplier a partir del usuario normalizado', () => {
    const normalized = normalizeUserRecord({
      id: 'user-2',
      company_name: 'Pasteleria Mozart Ltda.',
      email: 'compras@mozart.cl',
      description: 'Pasteleria y reposteria gourmet',
      rut: '72.345.678-9',
      city: 'Santiago',
      address: 'Av. Italia 1580',
      phone: '+56 2 2000 0000',
      whatsapp: '+56 9 2000 0000',
      website: 'https://mozart.cl',
      is_buyer: true,
      is_supplier: true,
      buyer_profiles: {
        business_type: 'pasteleria',
        monthly_volume: '2000 kg',
        preferred_contact: 'email',
      },
      supplier_profiles: {
        giro: 'Fabricacion de alimentos',
        response_rate: 88,
      },
      user_categories: [
        {
          scope: 'buyer_interest',
          categories: { id: 'cat-1', name: 'Frutas y verduras', emoji: '🥬' },
        },
        {
          scope: 'supplier_catalog',
          categories: { id: 'cat-2', name: 'Abarrotes', emoji: '📦' },
        },
      ],
    });

    expect(buildBuyerProfileView(normalized)).toMatchObject({
      companyName: 'Pasteleria Mozart Ltda.',
      businessType: 'Pasteleria',
      contactMethod: 'Email',
      categories: ['Frutas y verduras'],
    });

    expect(buildSupplierProfileView(normalized)).toMatchObject({
      companyName: 'Pasteleria Mozart Ltda.',
      giro: 'Fabricacion de alimentos',
      responseRate: 88,
      categories: ['Abarrotes'],
    });
  });

  it('mapea planes con booleans y limites listos para UI', () => {
    expect(mapPlanRowToCard({
      id: 'plan-2',
      name: 'pro',
      price_clp: 280000,
      has_agents: true,
      has_voice_calls: true,
      has_crm: false,
      has_api: false,
      max_active_products: 200,
      max_quote_responses_per_month: 250,
      max_ai_conversations_per_month: 200,
      max_voice_calls_per_month: 200,
    })).toMatchObject({
      id: 'plan-2',
      key: 'pro',
      name: 'Pro',
      highlight: true,
      hasAgents: true,
      hasVoiceCalls: true,
      maxActiveProducts: 200,
      maxQuoteResponsesPerMonth: 250,
    });
  });

  it('resuelve el dashboard por defecto tambien para admin', () => {
    expect(getDefaultDashboardPath({ is_admin: true })).toBe('/dashboard-admin');
    expect(getDefaultDashboardPath({ is_supplier: true })).toBe('/dashboard-proveedor');
    expect(getDefaultDashboardPath({ is_buyer: true })).toBe('/dashboard-comprador');
  });
});
