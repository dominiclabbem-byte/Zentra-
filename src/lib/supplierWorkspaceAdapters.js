import { formatQuoteDateTime } from './quoteAdapters';

function formatPercentage(value) {
  return `${Math.round(Number(value) || 0)}%`;
}

function getTimestamp(value) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function buildSupplierWorkspaceSummary(openQuotes = [], supplierOffers = []) {
  const opportunityIds = new Set([
    ...openQuotes.map((quote) => quote.id),
    ...supplierOffers.map((offer) => offer.quoteId),
  ].filter(Boolean));

  const respondedQuoteIds = new Set(
    supplierOffers
      .map((offer) => offer.quoteId)
      .filter(Boolean),
  );

  const activeBuyerIds = new Set([
    ...openQuotes.map((quote) => quote.buyerId),
    ...supplierOffers.map((offer) => offer.buyerId || offer.quote?.buyerId),
  ].filter(Boolean));

  const submittedOffers = supplierOffers.length;
  const acceptedOffers = supplierOffers.filter((offer) => offer.status === 'accepted').length;
  const pendingOffers = supplierOffers.filter((offer) => offer.status === 'pending').length;
  const responseRateValue = opportunityIds.size
    ? (respondedQuoteIds.size / opportunityIds.size) * 100
    : 0;
  const winRateValue = submittedOffers
    ? (acceptedOffers / submittedOffers) * 100
    : 0;

  return {
    openRelevantQuotes: openQuotes.length,
    submittedOffers,
    acceptedOffers,
    pendingOffers,
    activeBuyers: activeBuyerIds.size,
    opportunityCount: opportunityIds.size,
    responseRateValue,
    responseRateLabel: formatPercentage(responseRateValue),
    winRateValue,
    winRateLabel: formatPercentage(winRateValue),
  };
}

export function buildSupplierBuyerRelationships(openQuotes = [], supplierOffers = []) {
  const relationships = new Map();

  const ensureBuyer = ({ buyerId, buyerName, buyerCity, buyerVerified }) => {
    if (!buyerId) return null;

    if (!relationships.has(buyerId)) {
      relationships.set(buyerId, {
        id: buyerId,
        buyerId,
        buyerName: buyerName || 'Comprador',
        buyerCity: buyerCity || '',
        buyerVerified: Boolean(buyerVerified),
        openRfqs: 0,
        submittedOffers: 0,
        acceptedOffers: 0,
        pendingOffers: 0,
        categories: new Set(),
        lastActivity: '',
        lastActivityTimestamp: 0,
      });
    }

    const current = relationships.get(buyerId);

    if (!current.buyerName && buyerName) current.buyerName = buyerName;
    if (!current.buyerCity && buyerCity) current.buyerCity = buyerCity;
    current.buyerVerified = current.buyerVerified || Boolean(buyerVerified);

    return current;
  };

  openQuotes.forEach((quote) => {
    const buyer = ensureBuyer({
      buyerId: quote.buyerId,
      buyerName: quote.buyerName,
      buyerCity: quote.buyerCity,
      buyerVerified: quote.buyerVerified,
    });

    if (!buyer) return;

    buyer.openRfqs += 1;
    if (quote.categoryName) buyer.categories.add(quote.categoryName);

    const timestamp = getTimestamp(quote.createdAt);
    if (timestamp >= buyer.lastActivityTimestamp) {
      buyer.lastActivityTimestamp = timestamp;
      buyer.lastActivity = quote.createdAt;
    }
  });

  supplierOffers.forEach((offer) => {
    const buyer = ensureBuyer({
      buyerId: offer.buyerId || offer.quote?.buyerId,
      buyerName: offer.buyerName,
      buyerCity: offer.buyerCity,
      buyerVerified: offer.buyerVerified,
    });

    if (!buyer) return;

    buyer.submittedOffers += 1;
    if (offer.status === 'accepted') buyer.acceptedOffers += 1;
    if (offer.status === 'pending') buyer.pendingOffers += 1;
    if (offer.quote?.categoryName) buyer.categories.add(offer.quote.categoryName);

    const timestamp = getTimestamp(offer.createdAt);
    if (timestamp >= buyer.lastActivityTimestamp) {
      buyer.lastActivityTimestamp = timestamp;
      buyer.lastActivity = offer.createdAt;
    }
  });

  return [...relationships.values()]
    .map((buyer) => ({
      ...buyer,
      categories: [...buyer.categories],
      lastActivityLabel: buyer.lastActivity ? formatQuoteDateTime(buyer.lastActivity) : 'Sin actividad',
      relationshipStage: buyer.acceptedOffers > 0
        ? 'Cliente ganado'
        : buyer.pendingOffers > 0
          ? 'En negociacion'
          : buyer.openRfqs > 0
            ? 'Nueva oportunidad'
            : 'Sin actividad',
    }))
    .sort((left, right) => (
      right.acceptedOffers - left.acceptedOffers
      || right.pendingOffers - left.pendingOffers
      || right.openRfqs - left.openRfqs
      || right.lastActivityTimestamp - left.lastActivityTimestamp
    ));
}
