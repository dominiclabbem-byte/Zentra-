import { beforeEach, describe, expect, it, vi } from 'vitest';

const notificationsInsertMock = vi.fn();
const deliveryInsertMock = vi.fn();
const selectAfterInsertMock = vi.fn();
const singleMock = vi.fn();
const eqMock = vi.fn();
const usersInMock = vi.fn();

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
          insert: notificationsInsertMock,
        };
      }

      if (table === 'notification_deliveries') {
        return {
          insert: deliveryInsertMock,
        };
      }

      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            in: usersInMock,
          })),
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

    eqMock.mockReturnValueOnce({
      eq: vi.fn().mockResolvedValue({
        data: [{ user_id: 'supplier-1' }, { user_id: 'supplier-2' }],
        error: null,
      }),
    });

    notificationsInsertMock.mockResolvedValue({
      error: null,
    });

    usersInMock.mockResolvedValue({
      data: [
        { id: 'supplier-1', email: 'ventas1@zentra.local', phone: '+56911111111', whatsapp: null },
        { id: 'supplier-2', email: 'ventas2@zentra.local', phone: null, whatsapp: '+56922222222' },
      ],
      error: null,
    });

    deliveryInsertMock.mockResolvedValue({
      error: null,
    });
  });

  it('crea notificaciones sin hacer select posterior al insert y encola deliveries email/sms', async () => {
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

    expect(notificationsInsertMock).toHaveBeenCalledWith([
      {
        recipient_id: 'supplier-1',
        actor_id: 'buyer-1',
        type: 'rfq_created',
        title: 'Nueva cotización en tu producto',
        message: 'Se publico una nueva Solicitud de Cotización para Harina premium.',
        entity_type: 'quote_request',
        entity_id: 'quote-1',
      },
      {
        recipient_id: 'supplier-2',
        actor_id: 'buyer-1',
        type: 'rfq_created',
        title: 'Nueva cotización en tu producto',
        message: 'Se publico una nueva Solicitud de Cotización para Harina premium.',
        entity_type: 'quote_request',
        entity_id: 'quote-1',
      },
    ]);

    expect(deliveryInsertMock).toHaveBeenCalledWith([
      expect.objectContaining({
        recipient_id: 'supplier-1',
        actor_id: 'buyer-1',
        channel: 'email',
        destination: 'ventas1@zentra.local',
        template_key: 'rfq_created:email',
      }),
      expect.objectContaining({
        recipient_id: 'supplier-1',
        actor_id: 'buyer-1',
        channel: 'sms',
        destination: '+56911111111',
        template_key: 'rfq_created:sms',
      }),
      expect.objectContaining({
        recipient_id: 'supplier-2',
        actor_id: 'buyer-1',
        channel: 'email',
        destination: 'ventas2@zentra.local',
        template_key: 'rfq_created:email',
      }),
      expect.objectContaining({
        recipient_id: 'supplier-2',
        actor_id: 'buyer-1',
        channel: 'sms',
        destination: '+56922222222',
        template_key: 'rfq_created:sms',
      }),
    ]);
  });
});
