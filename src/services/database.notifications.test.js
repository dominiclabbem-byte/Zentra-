import { beforeEach, describe, expect, it, vi } from 'vitest';

const insertMock = vi.fn();
const selectAfterInsertMock = vi.fn();
const singleMock = vi.fn();
const eqMock = vi.fn();

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'quote_requests') {
        return {
          insert: vi.fn(() => ({
            select: selectAfterInsertMock,
          })),
        };
      }

      if (table === 'user_categories') {
        return {
          select: vi.fn(() => ({
            eq: eqMock,
          })),
        };
      }

      if (table === 'notifications') {
        return {
          insert: insertMock,
        };
      }

      throw new Error(`unexpected table ${table}`);
    }),
  },
}));

describe('database notifications contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    selectAfterInsertMock.mockReturnValue({
      single: singleMock,
    });

    singleMock.mockResolvedValue({
      data: {
        id: 'quote-1',
        product_name: 'Harina premium',
        quantity: 100,
        unit: 'kg',
        delivery_date: '2026-03-30',
        notes: null,
        quote_offers: [],
        categories: { id: 'cat-1', name: 'Harinas', emoji: '🌾' },
      },
      error: null,
    });

    eqMock
      .mockReturnValueOnce({
        eq: vi.fn().mockResolvedValue({
          data: [{ user_id: 'supplier-1' }, { user_id: 'supplier-2' }],
          error: null,
        }),
      });

    insertMock.mockResolvedValue({
      error: null,
    });
  });

  it('crea notificaciones sin hacer select posterior al insert', async () => {
    const { createQuoteRequest } = await import('./database');

    await createQuoteRequest({
      buyer_id: 'buyer-1',
      requester_id: 'buyer-1',
      product_name: 'Harina premium',
      category_id: 'cat-1',
      quantity: 100,
      unit: 'kg',
      delivery_date: '2026-03-30',
      notes: null,
    });

    expect(insertMock).toHaveBeenCalledWith([
      {
        recipient_id: 'supplier-1',
        actor_id: 'buyer-1',
        type: 'rfq_created',
        title: 'Nueva RFQ en una categoria relevante',
        message: 'Se publico una nueva solicitud para Harina premium.',
        entity_type: 'quote_request',
        entity_id: 'quote-1',
      },
      {
        recipient_id: 'supplier-2',
        actor_id: 'buyer-1',
        type: 'rfq_created',
        title: 'Nueva RFQ en una categoria relevante',
        message: 'Se publico una nueva solicitud para Harina premium.',
        entity_type: 'quote_request',
        entity_id: 'quote-1',
      },
    ]);
  });
});
