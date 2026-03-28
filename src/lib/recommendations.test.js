import { describe, expect, it } from 'vitest';
import { buildBuyerUser, buildPriceAlertSubscription, buildProduct, buildQuoteOffer, buildQuoteRequest, buildSupplierUser } from '../test/marketplaceFixtures';
import { buildBuyerRecommendations } from './recommendations';

describe('recommendations', () => {
  it('prioriza productos alineados con RFQs, busquedas y favoritos', () => {
    const buyer = buildBuyerUser();
    const favoriteSupplier = buildSupplierUser({ id: 'supplier-1', company_name: 'Valle Frio SpA' });
    const quote = buildQuoteRequest({
      id: 'quote-1',
      buyer_id: buyer.id,
      product_name: 'Harina premium panadera',
      category_id: 'cat-1',
      categoryName: 'Harinas y cereales',
      quote_offers: [
        buildQuoteOffer({
          id: 'offer-1',
          quote_id: 'quote-1',
          supplier_id: favoriteSupplier.id,
          status: 'accepted',
        }),
      ],
    });
    const products = [
      buildProduct({
        id: 'prod-target',
        supplier_id: favoriteSupplier.id,
        users: favoriteSupplier,
        name: 'Harina premium 000',
        category_id: 'cat-1',
        categoryName: 'Harinas y cereales',
        created_at: '2026-03-27T10:00:00Z',
      }),
      buildProduct({
        id: 'prod-other',
        supplier_id: 'supplier-2',
        users: buildSupplierUser({ id: 'supplier-2', company_name: 'Lacteos del Sur' }),
        name: 'Queso gauda',
        category_id: 'cat-2',
        categoryName: 'Lacteos',
      }),
    ];

    const ranked = buildBuyerRecommendations(products, {
      buyerProfile: buyer,
      buyerQuotes: [quote],
      favoriteSuppliers: [{ id: favoriteSupplier.id, name: favoriteSupplier.company_name }],
      recentSearchTerms: ['harina premium'],
      currentSearch: 'harina',
      alertSubscriptions: [],
    });

    expect(ranked[0].id).toBe('prod-target');
    expect(ranked[0].recommendationReasons).toEqual(expect.arrayContaining([
      'Coincide con tus busquedas',
    ]));
    expect(ranked.map((product) => product.id)).toEqual(['prod-target', 'prod-other']);
  });

  it('considera alertas activas y oportunidades de precio sin depender de ubicacion', () => {
    const trackedProduct = buildProduct({
      id: 'prod-tracked',
      name: 'Mantequilla premium',
      category_id: 'cat-2',
      categoryName: 'Lacteos',
      recentPriceAlert: {
        change: 'down',
      },
      hasTrackedPriceAlert: true,
    });
    const neutralProduct = buildProduct({
      id: 'prod-neutral',
      name: 'Arroz premium',
      category_id: 'cat-3',
      categoryName: 'Abarrotes',
    });

    const ranked = buildBuyerRecommendations([neutralProduct, trackedProduct], {
      buyerProfile: buildBuyerUser(),
      buyerQuotes: [],
      favoriteSuppliers: [],
      recentSearchTerms: [],
      currentSearch: '',
      alertSubscriptions: [
        buildPriceAlertSubscription({ product_id: trackedProduct.id, category_id: null }),
      ],
    });

    expect(ranked[0].id).toBe('prod-tracked');
    expect(ranked[0].recommendationReasons).toEqual(expect.arrayContaining([
      'Oportunidad de precio reciente',
    ]));
  });

  it('degrada bien para un buyer nuevo y prioriza calidad comercial basica', () => {
    const ranked = buildBuyerRecommendations([
      buildProduct({
        id: 'prod-verified',
        name: 'Levadura instantanea',
        users: buildSupplierUser({ id: 'supplier-verified', verified: true, company_name: 'Proveedor Verificado' }),
        supplierVerified: true,
      }),
      buildProduct({
        id: 'prod-unverified',
        name: 'Levadura seca',
        users: buildSupplierUser({ id: 'supplier-unverified', verified: false, company_name: 'Proveedor Nuevo' }),
        supplierVerified: false,
      }),
    ], {
      buyerProfile: buildBuyerUser({ buyerCategories: [], user_categories: [] }),
      buyerQuotes: [],
      favoriteSuppliers: [],
      recentSearchTerms: [],
      currentSearch: '',
      alertSubscriptions: [],
    });

    expect(ranked[0].id).toBe('prod-verified');
    expect(ranked[0].recommendationReasons).toEqual(expect.arrayContaining([
      'Proveedor verificado',
    ]));
  });

  it('normaliza acentos en busquedas para no perder coincidencias evidentes', () => {
    const ranked = buildBuyerRecommendations([
      buildProduct({
        id: 'prod-aceite',
        name: 'Aceite de oliva extra virgen',
        categoryName: 'Aceites y grasas',
      }),
      buildProduct({
        id: 'prod-harina',
        name: 'Harina integral',
        categoryName: 'Harinas y cereales',
      }),
    ], {
      buyerProfile: buildBuyerUser(),
      buyerQuotes: [],
      favoriteSuppliers: [],
      recentSearchTerms: ['aceité oliva'],
      currentSearch: '',
      alertSubscriptions: [],
    });

    expect(ranked[0].id).toBe('prod-aceite');
    expect(ranked[0].recommendationReasons).toEqual(expect.arrayContaining([
      'Coincide con tus busquedas',
    ]));
  });
});
