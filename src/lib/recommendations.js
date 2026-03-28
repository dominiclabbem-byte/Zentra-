function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function tokenize(value = '') {
  return [...new Set(
    normalizeText(value)
      .split(/[^a-z0-9]+/g)
      .filter((token) => token.length >= 3),
  )];
}

function createHashScore(value = '') {
  return Array.from(String(value)).reduce((total, char) => ((total * 31) + char.charCodeAt(0)) % 17, 0);
}

function collectRecentQuoteSignals(buyerQuotes = []) {
  return buyerQuotes.reduce((signals, quote) => {
    if (quote?.categoryId) signals.categoryIds.add(quote.categoryId);
    if (quote?.categoryName) signals.categoryNames.add(quote.categoryName);
    tokenize(quote?.productName).forEach((token) => signals.productTokens.add(token));
    (quote?.offers ?? []).forEach((offer) => {
      if (offer?.supplierId) signals.supplierIds.add(offer.supplierId);
      if (offer?.status === 'accepted' && offer?.supplierId) {
        signals.acceptedSupplierIds.add(offer.supplierId);
      }
    });
    return signals;
  }, {
    categoryIds: new Set(),
    categoryNames: new Set(),
    productTokens: new Set(),
    supplierIds: new Set(),
    acceptedSupplierIds: new Set(),
  });
}

export function buildBuyerRecommendationSignals({
  buyerProfile,
  buyerQuotes = [],
  favoriteSuppliers = [],
  buyerActivityEvents = [],
  recentSearchTerms = [],
  currentSearch = '',
  alertSubscriptions = [],
} = {}) {
  const quoteSignals = collectRecentQuoteSignals(buyerQuotes);
  const eventCategoryIds = new Set(
    buyerActivityEvents
      .map((event) => event?.category_id)
      .filter(Boolean),
  );
  const eventSearchTerms = buyerActivityEvents
    .filter((event) => event?.event_type === 'search')
    .map((event) => event.search_term);
  const eventProductIds = new Set(
    buyerActivityEvents
      .filter((event) => ['product_view', 'quote_created'].includes(event?.event_type))
      .map((event) => event.product_id)
      .filter(Boolean),
  );
  const eventSupplierIds = new Set(
    buyerActivityEvents
      .filter((event) => ['supplier_view', 'favorite_added', 'quote_created'].includes(event?.event_type))
      .map((event) => event.supplier_id)
      .filter(Boolean),
  );
  const categoryNames = new Set([
    ...(buyerProfile?.categories ?? []),
    ...quoteSignals.categoryNames,
  ].filter(Boolean));
  const categoryIds = new Set([
    ...quoteSignals.categoryIds,
    ...eventCategoryIds,
    ...alertSubscriptions
      .filter((subscription) => subscription?.category_id && !subscription?.product_id)
      .map((subscription) => subscription.category_id),
  ]);
  const favoriteSupplierIds = new Set(favoriteSuppliers.map((supplier) => supplier.id).filter(Boolean));
  const searchTerms = [
    currentSearch,
    ...recentSearchTerms,
    ...eventSearchTerms,
  ].flatMap((term) => tokenize(term));
  const productTokens = new Set(quoteSignals.productTokens);

  return {
    categoryNames,
    categoryIds,
    productTokens,
    searchTerms: new Set(searchTerms),
    favoriteSupplierIds,
    interactedSupplierIds: new Set([
      ...quoteSignals.supplierIds,
      ...eventSupplierIds,
    ]),
    acceptedSupplierIds: quoteSignals.acceptedSupplierIds,
    interactedProductIds: eventProductIds,
    trackedProductIds: new Set(
      alertSubscriptions
        .filter((subscription) => subscription?.product_id)
        .map((subscription) => subscription.product_id),
    ),
  };
}

export function scoreRecommendedProduct(product, signals) {
  const reasons = [];
  let score = 0;

  const productTokens = new Set([
    ...tokenize(product?.name),
    ...tokenize(product?.category),
    ...tokenize(product?.description),
    ...tokenize(product?.supplierName),
  ]);

  if (signals.categoryIds.has(product?.categoryId) || signals.categoryNames.has(product?.category)) {
    score += 28;
    reasons.push('Alineado con tus categorias y RFQs');
  }

  const matchingHistoryTokens = [...signals.productTokens].filter((token) => productTokens.has(token));
  if (matchingHistoryTokens.length > 0) {
    score += Math.min(22, 10 + (matchingHistoryTokens.length * 4));
    reasons.push('Relacionado con tus cotizaciones recientes');
  }

  const matchingSearchTokens = [...signals.searchTerms].filter((token) => productTokens.has(token));
  if (matchingSearchTokens.length > 0) {
    score += Math.min(24, 10 + (matchingSearchTokens.length * 5));
    reasons.push('Coincide con tus busquedas');
  }

  if (signals.favoriteSupplierIds.has(product?.supplierId)) {
    score += 18;
    reasons.push('Proveedor guardado en favoritos');
  } else if (signals.acceptedSupplierIds.has(product?.supplierId)) {
    score += 16;
    reasons.push('Proveedor con ofertas aceptadas');
  } else if (signals.interactedSupplierIds.has(product?.supplierId)) {
    score += 8;
    reasons.push('Proveedor con el que ya interactuaste');
  }

  if (signals.interactedProductIds.has(product?.id)) {
    score += 14;
    reasons.push('Ya exploraste este producto');
  }

  if (product?.recentPriceAlert?.change === 'down') {
    score += 12;
    reasons.push('Oportunidad de precio reciente');
  } else if (product?.hasTrackedPriceAlert || signals.trackedProductIds.has(product?.id)) {
    score += 6;
    reasons.push('Sigues este producto o categoria');
  }

  if (product?.supplierVerified) {
    score += 8;
    reasons.push('Proveedor verificado');
  }

  if (product?.createdAt) {
    const ageInDays = Math.floor((Date.now() - new Date(product.createdAt).getTime()) / 86_400_000);
    if (ageInDays <= 14) {
      score += 8;
      reasons.push('Actualizado recientemente');
    } else if (ageInDays <= 45) {
      score += 4;
    }
  }

  score += createHashScore(product?.id) % 4;

  return {
    ...product,
    recommendationScore: score,
    recommendationReasons: reasons.slice(0, 3),
  };
}

export function buildBuyerRecommendations(products = [], input = {}) {
  const signals = buildBuyerRecommendationSignals(input);

  return products
    .map((product) => scoreRecommendedProduct(product, signals))
    .sort((left, right) => {
      if (right.recommendationScore !== left.recommendationScore) {
        return right.recommendationScore - left.recommendationScore;
      }

      if (left.supplierVerified !== right.supplierVerified) {
        return left.supplierVerified ? -1 : 1;
      }

      if (left.recentPriceAlert && !right.recentPriceAlert) return -1;
      if (!left.recentPriceAlert && right.recentPriceAlert) return 1;
      return left.name.localeCompare(right.name, 'es');
    });
}
