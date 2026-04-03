import { describe, expect, it } from 'vitest';
import {
  buildSupplierBuyerRelationships,
  buildSupplierWorkspaceSummary,
} from './supplierWorkspaceAdapters';

describe('supplierWorkspaceAdapters', () => {
  it('calcula summary supplier a partir de RFQs relevantes y ofertas enviadas', () => {
    const summary = buildSupplierWorkspaceSummary(
      [
        { id: 'quote-1', buyerId: 'buyer-1' },
      ],
      [
        { id: 'offer-1', quoteId: 'quote-1', buyerId: 'buyer-1', status: 'pending' },
        { id: 'offer-2', quoteId: 'quote-2', buyerId: 'buyer-2', status: 'accepted' },
      ],
    );

    expect(summary).toMatchObject({
      openRelevantQuotes: 1,
      submittedOffers: 2,
      acceptedOffers: 1,
      pendingOffers: 1,
      activeBuyers: 2,
      opportunityCount: 2,
      responseRateLabel: '100%',
      winRateLabel: '50%',
    });
  });

  it('agrupa compradores segun oportunidades abiertas, ofertas y cierres', () => {
    const buyers = buildSupplierBuyerRelationships(
      [
        {
          id: 'quote-1',
          buyerId: 'buyer-1',
          buyerName: 'Pasteleria Mozart',
          buyerCity: 'Santiago',
          buyerVerified: true,
          categoryName: 'Harinas y cereales',
          createdAt: '2026-03-24T09:00:00Z',
        },
      ],
      [
        {
          id: 'offer-1',
          quoteId: 'quote-1',
          buyerId: 'buyer-1',
          buyerName: 'Pasteleria Mozart',
          buyerCity: 'Santiago',
          buyerVerified: true,
          status: 'pending',
          createdAt: '2026-03-24T11:00:00Z',
          quote: {
            buyerId: 'buyer-1',
            categoryName: 'Harinas y cereales',
          },
        },
        {
          id: 'offer-2',
          quoteId: 'quote-2',
          buyerId: 'buyer-2',
          buyerName: 'Hotel Ritz',
          buyerCity: 'Santiago',
          buyerVerified: false,
          status: 'accepted',
          createdAt: '2026-03-24T12:00:00Z',
          quote: {
            buyerId: 'buyer-2',
            categoryName: 'Lacteos',
          },
        },
      ],
    );

    expect(buyers[0]).toMatchObject({
      buyerId: 'buyer-2',
      acceptedOffers: 1,
      relationshipStage: 'Cliente ganado',
      categories: ['Lacteos'],
    });

    expect(buyers[1]).toMatchObject({
      buyerId: 'buyer-1',
      openRfqs: 1,
      submittedOffers: 1,
      pendingOffers: 1,
      relationshipStage: 'En negociacion',
      categories: ['Harinas y cereales'],
    });
  });
});
