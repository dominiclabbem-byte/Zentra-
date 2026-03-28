import { createMarketplaceScenario } from '../test/marketplaceScenario';
import { buildQuoteRequest } from '../test/marketplaceFixtures';

const scenarioInstances = new Map();

function getSessionKey() {
  if (typeof window === 'undefined') return 'default';
  return window.localStorage.getItem('zentra:e2e:session') || 'default';
}

function buildScenario() {
  const scenario = createMarketplaceScenario();
  const role = getCurrentRole();

  if (role === 'supplier') {
    const hasOpenQuoteWithoutOffer = scenario.state.quoteRequests.some((quote) => (
      quote.status === 'open'
      && quote.buyer_id === 'buyer-1'
      && (!quote.quote_offers || quote.quote_offers.length === 0)
    ));

    if (!hasOpenQuoteWithoutOffer) {
      const fallbackQuote = buildQuoteRequest({
        id: 'quote-e2e-open',
        buyer_id: 'buyer-1',
        requester_id: 'buyer-1',
        product_name: 'Leche UHT',
        category_id: 'cat-2',
        quantity: 90,
        unit: 'cajas',
        delivery_date: '2026-04-20',
        notes: 'Despacho en frio a primera hora',
        status: 'open',
        categories: scenario.state.categories.find((category) => category.id === 'cat-2') ?? scenario.state.categories[0],
        users: scenario.state.buyer,
        quote_offers: [],
      });

      scenario.state.quoteRequests.unshift(fallbackQuote);
    }
  }

  return scenario;
}

function ensureScenario() {
  const sessionKey = getSessionKey();

  if (!scenarioInstances.has(sessionKey)) {
    const scenario = buildScenario();
    scenarioInstances.set(sessionKey, scenario);
  }

  return scenarioInstances.get(sessionKey);
}

export function isE2EMode() {
  if (typeof window === 'undefined') return false;

  try {
    return (
      window.localStorage.getItem('zentra:e2e') === '1'
      || new URLSearchParams(window.location.search).get('e2e') === '1'
    );
  } catch {
    return false;
  }
}

function getCurrentRole() {
  if (typeof window === 'undefined') return 'buyer';
  return window.localStorage.getItem('zentra:e2e:role') || 'buyer';
}

function getAuthSnapshot() {
  const scenario = ensureScenario();
  const role = getCurrentRole();

  if (role === 'supplier') {
    return scenario.auth.supplier();
  }

  return scenario.auth.buyer();
}

export async function e2eSignIn({ email }) {
  if (typeof window !== 'undefined') {
    const role = email?.includes('vallefrio') || email?.includes('supplier') ? 'supplier' : 'buyer';
    window.localStorage.setItem('zentra:e2e:role', role);
  }

  return { user: await e2eGetCurrentUser() };
}

export async function e2eSignOut() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('zentra:e2e:role');
  }
}

export async function e2eGetCurrentUser() {
  return getAuthSnapshot().currentUser;
}

export async function e2eGetCategories() {
  return ensureScenario().api.getCategories();
}

export async function e2eGetPlans() {
  return ensureScenario().api.getPlans();
}

export async function e2eGetProducts(filters) {
  return ensureScenario().api.getProducts(filters);
}

export async function e2eCreateQuoteRequest(payload) {
  return ensureScenario().api.createQuoteRequest(payload);
}

export async function e2eGetQuoteRequestsForBuyer(buyerId) {
  return ensureScenario().api.getQuoteRequestsForBuyer(buyerId);
}

export async function e2eGetRelevantQuoteRequestsForSupplier(supplierId, filters = {}) {
  const quotes = await ensureScenario().api.getRelevantQuoteRequestsForSupplier(supplierId);
  if (!filters.statuses?.length) return quotes;
  return quotes.filter((quote) => filters.statuses.includes(quote.status));
}

export async function e2eGetOffersForSupplier(supplierId) {
  return ensureScenario().api.getOffersForSupplier(supplierId);
}

export async function e2eSubmitOffer(payload) {
  return ensureScenario().api.submitOffer(payload);
}

export async function e2eAcceptOffer(offerId) {
  return ensureScenario().api.acceptOffer(offerId);
}

export async function e2eCancelQuoteRequest(quoteId) {
  return ensureScenario().api.cancelQuoteRequest(quoteId);
}

export async function e2eGetBuyerStats(buyerId) {
  return ensureScenario().api.getBuyerStats(buyerId);
}

export async function e2eGetSupplierStats(supplierId) {
  return ensureScenario().api.getSupplierStats(supplierId);
}

export async function e2eGetFavorites(buyerId) {
  return ensureScenario().api.getFavorites(buyerId);
}

export async function e2eToggleFavorite(buyerId, supplierId) {
  return ensureScenario().api.toggleFavorite(buyerId, supplierId);
}

export async function e2eGetPriceAlertSubscriptions(buyerId) {
  return ensureScenario().api.getPriceAlertSubscriptions(buyerId);
}

export async function e2eSubscribeToPriceAlert(buyerId, payload) {
  return ensureScenario().api.subscribeToPriceAlert(buyerId, payload);
}

export async function e2eRemovePriceAlertSubscription(subscriptionId, buyerId) {
  return ensureScenario().api.removePriceAlertSubscription(subscriptionId, buyerId);
}

export async function e2eGetPriceAlerts(buyerId) {
  return ensureScenario().api.getPriceAlerts(buyerId);
}

export async function e2eGetSupplierUsageSummary(supplierId) {
  return ensureScenario().api.getSupplierUsageSummary(supplierId);
}

export async function e2eGetReviewsForUser(userId) {
  return ensureScenario().api.getReviewsForUser(userId);
}

export async function e2eGetBuyerReviewOpportunities(buyerId) {
  return ensureScenario().api.getBuyerReviewOpportunities(buyerId);
}

export async function e2eCreateReview(payload) {
  return ensureScenario().api.createReview(payload);
}

export async function e2eGetBuyerProfile(userId) {
  return ensureScenario().api.getBuyerProfile(userId);
}

export async function e2eGetSupplierProfile(userId) {
  return ensureScenario().api.getSupplierProfile(userId);
}

export async function e2eSubscribeToPlan(supplierId, planId) {
  return ensureScenario().api.subscribeToPlan(supplierId, planId);
}

export async function e2eUpdateOfferPipelineStatus(payload) {
  return ensureScenario().api.updateOfferPipelineStatus(payload);
}
