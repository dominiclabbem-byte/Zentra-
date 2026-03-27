import { describe, expect, it } from 'vitest';
import {
  getDefaultOfferPipelineStatus,
  formatQuoteStatus,
  mapQuoteOfferRecord,
  mapQuoteRequestRecord,
  parseLeadTimeDays,
  sortQuoteOffersForBuyer,
} from './quoteAdapters';

describe('quoteAdapters', () => {
  it('formatea estados de RFQ segun status y cantidad de ofertas', () => {
    expect(formatQuoteStatus('open', 0)).toMatchObject({ label: 'Abierta' });
    expect(formatQuoteStatus('open', 2)).toMatchObject({ label: '2 ofertas' });
    expect(formatQuoteStatus('in_review', 3)).toMatchObject({ label: '3 ofertas' });
    expect(formatQuoteStatus('closed', 1)).toMatchObject({ label: 'Cerrada' });
  });

  it('convierte lead time textual a dias comparables', () => {
    expect(parseLeadTimeDays('5 dias')).toBe(5);
    expect(parseLeadTimeDays('3-5 dias')).toBe(3);
    expect(parseLeadTimeDays('Sin definir')).toBe(Number.POSITIVE_INFINITY);
  });

  it('ordena ofertas buyer-side por precio, lead time, verificacion y rating', () => {
    const sorted = sortQuoteOffersForBuyer([
      {
        id: 'offer-1',
        supplierName: 'Proveedor caro',
        priceValue: 1400,
        estimatedLeadTime: '2 dias',
        supplierVerified: true,
        supplierRating: 4.9,
      },
      {
        id: 'offer-2',
        supplierName: 'Proveedor rapido',
        priceValue: 1200,
        estimatedLeadTime: '2 dias',
        supplierVerified: false,
        supplierRating: 4.8,
      },
      {
        id: 'offer-3',
        supplierName: 'Proveedor verificado',
        priceValue: 1200,
        estimatedLeadTime: '2 dias',
        supplierVerified: true,
        supplierRating: 4.1,
      },
      {
        id: 'offer-4',
        supplierName: 'Proveedor lento',
        priceValue: 1200,
        estimatedLeadTime: '5 dias',
        supplierVerified: true,
        supplierRating: 5,
      },
    ]);

    expect(sorted.map((offer) => offer.supplierName)).toEqual([
      'Proveedor verificado',
      'Proveedor rapido',
      'Proveedor lento',
      'Proveedor caro',
    ]);
  });

  it('mapea RFQs con ofertas y metadata lista para UI', () => {
    const quote = mapQuoteRequestRecord({
      id: 'quote-1',
      buyer_id: 'buyer-1',
      requester_id: 'buyer-1',
      product_name: 'Harina premium',
      category_id: 'cat-1',
      quantity: 500,
      unit: 'kg',
      delivery_date: '2026-03-30',
      notes: 'Entrega en AM',
      status: 'in_review',
      created_at: '2026-03-24T10:30:00Z',
      categories: { id: 'cat-1', name: 'Harinas y cereales', emoji: '🌾' },
      quote_offers: [
        {
          id: 'offer-1',
          quote_id: 'quote-1',
          supplier_id: 'supplier-1',
          price: 1200,
          notes: 'Disponible inmediato',
          estimated_lead_time: '2 dias',
          status: 'pending',
          created_at: '2026-03-24T11:00:00Z',
          users: { company_name: 'Molinos del Sur', city: 'Santiago', verified: true },
        },
      ],
    });

    expect(quote).toMatchObject({
      id: 'quote-1',
      productName: 'Harina premium',
      categoryName: 'Harinas y cereales',
      quantityLabel: '500 kg',
      offerCount: 1,
      status: 'in_review',
      statusLabel: '1 oferta',
    });
    expect(quote.offers[0]).toMatchObject({
      supplierName: 'Molinos del Sur',
      priceLabel: '$1.200',
      estimatedLeadTime: '2 dias',
      supplierVerified: true,
      pipelineStatus: 'submitted',
      pipelineStatusLabel: 'Enviada',
    });
  });

  it('mapea pipeline interno explicito y default segun estado de oferta', () => {
    expect(getDefaultOfferPipelineStatus('accepted')).toBe('won');
    expect(getDefaultOfferPipelineStatus('withdrawn')).toBe('lost');

    const offer = mapQuoteOfferRecord({
      id: 'offer-9',
      quote_id: 'quote-9',
      supplier_id: 'supplier-1',
      price: 1450,
      notes: 'Seguimiento agendado',
      estimated_lead_time: '3 dias',
      status: 'pending',
      pipeline_status: 'follow_up',
      created_at: '2026-03-24T12:00:00Z',
      users: { company_name: 'Molinos del Sur', city: 'Santiago', verified: true },
      quote_requests: {
        id: 'quote-9',
        buyer_id: 'buyer-9',
        product_name: 'Mantequilla',
        quantity: 120,
        unit: 'kg',
        delivery_date: '2026-04-02',
        status: 'in_review',
        users: { company_name: 'Pasteleria Mozart', city: 'Santiago', rut: '72.345.678-9', verified: true },
        categories: { id: 'cat-2', name: 'Lacteos', emoji: '🧀' },
      },
    });

    expect(offer).toMatchObject({
      buyerId: 'buyer-9',
      buyerVerified: true,
      pipelineStatus: 'follow_up',
      pipelineStatusLabel: 'Seguimiento',
      quote: {
        categoryName: 'Lacteos',
        buyerId: 'buyer-9',
      },
    });
  });
});
