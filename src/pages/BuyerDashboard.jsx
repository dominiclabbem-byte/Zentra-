import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import StatDetailModal from '../components/StatDetailModal';
import QuoteConversationModal from '../components/QuoteConversationModal';
import DashboardPageHeader from '../components/DashboardPageHeader';
import { useAuth } from '../context/AuthContext';
import {
  BUSINESS_TYPE_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  buildBuyerProfileView,
  buildSupplierProfileView,
  formatCLP,
  formatMemberSince,
  formatPlanName,
  getPlanKey,
  normalizeUserRecord,
} from '../lib/profileAdapters';
import {
  acceptOffer,
  cancelQuoteRequest,
  createReview,
  createQuoteRequest,
  getBuyerActivityEvents,
  getBuyerReviewOpportunities,
  getBuyerStats,
  getFavorites,
  getProducts,
  getPriceAlerts,
  getPriceAlertSubscriptions,
  getQuoteConversationById,
  getQuoteConversationForQuote,
  getQuoteConversationMessages,
  getQuoteRequestsForBuyer,
  getReviewsForUser,
  getSupplierProfile,
  getSupplierStats,
  markQuoteConversationRead,
  removePriceAlertSubscription,
  sendQuoteConversationMessage,
  subscribeToPriceAlert,
  trackBuyerActivityEvent,
  toggleFavorite,
  uploadAvatar,
} from '../services/database';
import { mapQuoteConversationMessageRecord, mapQuoteConversationRecord } from '../lib/conversationAdapters';
import { mapProductRecordToCard } from '../lib/productAdapters';
import { buildBuyerRecommendations } from '../lib/recommendations';
import { formatQuoteDateTime, mapQuoteRequestRecord, sortQuoteOffersForBuyer } from '../lib/quoteAdapters';

const units = ['kg', 'unidades', 'cajas'];
const initialQuoteForm = {
  product: '',
  categoryId: '',
  quantity: '',
  unit: 'kg',
  deliveryDate: '',
  notes: '',
  sourceProductId: '',
  sourceSupplierId: '',
  sourceContext: '',
};

const initialReviewForm = {
  quoteOfferId: '',
  reviewedId: '',
  supplierName: '',
  productName: '',
  rating: 5,
  comment: '',
};

const RECENT_BUYER_SEARCHES_STORAGE_KEY = 'zentra:buyer-recent-searches';

function loadRecentBuyerSearches() {
  if (typeof window === 'undefined') return [];

  try {
    const rawValue = window.localStorage.getItem(RECENT_BUYER_SEARCHES_STORAGE_KEY);
    if (!rawValue) return [];

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue)
      ? parsedValue.filter((term) => typeof term === 'string')
      : [];
  } catch {
    return [];
  }
}

function saveRecentBuyerSearches(terms) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(RECENT_BUYER_SEARCHES_STORAGE_KEY, JSON.stringify(terms));
  } catch {
    // Optional UX enhancement only.
  }
}

const initialBuyerProfile = {
  companyName: 'Pasteleria Mozart Ltda.',
  initials: 'PM',
  description: 'Pasteleria y reposteria gourmet',
  rut: '72.345.678-9',
  city: 'Santiago, Chile',
  address: 'Av. Italia 1580, Nunoa',
  businessType: 'Pasteleria',
  businessTypeValue: 'pasteleria',
  monthlyVolume: 'Aprox. 2.000 kg/mes',
  contactMethod: 'Email',
  contactMethodValue: 'email',
  email: 'compras@pasteleriamozart.cl',
  phone: '+56 2 2987 6543',
  whatsapp: '+56 9 1234 5678',
  categories: ['Pasteleria'],
  frequentProducts: ['Harina extra fina', 'Chocolate cobertura', 'Crema vegetal', 'Mantequilla', 'Azucar flor', 'Frambuesa IQF', 'Levadura fresca'],
};

function takeSingle(value) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function mapReviewRecord(review) {
  const reviewer = takeSingle(review.users);

  return {
    id: review.id,
    buyer: reviewer?.company_name ?? 'Comprador verificado',
    city: reviewer?.city ?? '',
    rating: Number(review.rating) || 0,
    comment: review.comment ?? '',
    date: formatQuoteDateTime(review.created_at),
  };
}

function mapFavoriteSupplier(favoriteRow) {
  const supplierRecord = normalizeUserRecord(takeSingle(favoriteRow.users));
  const supplierView = buildSupplierProfileView(supplierRecord);
  const activeProducts = (supplierRecord?.products ?? []).filter((product) => product.status !== 'inactive');

  return {
    id: supplierRecord?.id,
    initials: supplierView.initials,
    name: supplierView.companyName,
    description: supplierView.description,
    city: supplierView.city,
    categories: supplierView.categories,
    verified: Boolean(supplierRecord?.verified),
    plan: formatPlanName(getPlanKey(supplierRecord)),
    responseRate: supplierView.responseRate ?? 0,
    productCount: activeProducts.length,
    savedAtLabel: formatQuoteDateTime(favoriteRow.created_at),
  };
}

function mapPriceAlertRecord(alert) {
  const product = takeSingle(alert.products);
  const supplier = takeSingle(product?.users);
  const category = takeSingle(product?.categories);
  const isDown = alert.direction === 'down';

  return {
    id: alert.id,
    productId: alert.product_id,
    categoryId: product?.category_id ?? category?.id ?? '',
    productName: product?.name ?? 'Producto',
    supplierName: supplier?.company_name ?? 'Proveedor',
    categoryName: category?.name ?? 'Sin categoria',
    previousPrice: formatCLP(alert.old_price),
    currentPrice: formatCLP(alert.new_price),
    change: alert.direction ?? 'down',
    changeLabel: isDown ? 'Bajo' : 'Subio',
    impactLabel: isDown ? 'Mejor oportunidad' : 'Precio al alza',
    signalLabel: isDown ? 'Precio a la baja' : 'Precio al alza',
    dateLabel: formatQuoteDateTime(alert.created_at),
    createdAt: alert.created_at,
  };
}

export default function BuyerDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentUser,
    categories: categoryOptions,
    notifications = [],
    saveBuyerProfile,
    refreshCurrentUser,
  } = useAuth();
  const liveBuyerProfile = currentUser ? buildBuyerProfileView(currentUser) : initialBuyerProfile;
  const buyerProfile = liveBuyerProfile;
  const memberSinceLabel = formatMemberSince(currentUser?.created_at);

  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState(() => location.state?.activeTab ?? 'catalog');
  const [catalogFilter, setCatalogFilter] = useState('Todos');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [recentSearchTerms, setRecentSearchTerms] = useState(() => loadRecentBuyerSearches());
  const [buyerActivityEvents, setBuyerActivityEvents] = useState([]);
  const [viewingSupplier, setViewingSupplier] = useState(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState(initialBuyerProfile);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [quoteForm, setQuoteForm] = useState(initialQuoteForm);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [buyerQuotes, setBuyerQuotes] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [isSendingConversationMessage, setIsSendingConversationMessage] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteActionId, setQuoteActionId] = useState('');
  const [buyerStats, setBuyerStats] = useState({ totalOrders: 0, rating: 0, favoriteSuppliers: 0 });
  const [favoriteSuppliers, setFavoriteSuppliers] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [alertSubscriptions, setAlertSubscriptions] = useState([]);
  const [buyerAlerts, setBuyerAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [statDetail, setStatDetail] = useState(null);
  const [favoriteActionId, setFavoriteActionId] = useState('');
  const [subscriptionActionId, setSubscriptionActionId] = useState('');
  const [isSavingAlertSubscription, setIsSavingAlertSubscription] = useState(false);
  const [reviewOpportunities, setReviewOpportunities] = useState([]);
  const [reviewForm, setReviewForm] = useState(initialReviewForm);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [alertForm, setAlertForm] = useState({
    mode: 'category',
    categoryId: '',
    productId: '',
  });
  const lastTrackedSearchRef = useRef('');

  const unreadBuyerOfferNotifications = useMemo(
    () => notifications.filter((notification) => (
      !notification.read_at
      && ['offer_received', 'message_received'].includes(notification.type)
    )).length,
    [notifications],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setCatalogLoading(true);

      try {
        const data = await getProducts();
        if (!cancelled) {
          setCatalogProducts(data.map((product) => mapProductRecordToCard(product)));
        }
      } catch (error) {
        if (!cancelled) {
          setToast({ message: error.message || 'No se pudo cargar el catalogo.', type: 'error' });
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      }
    }

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const normalizedSearch = catalogSearch.trim();
    if (normalizedSearch.length < 3) return undefined;

    const timeoutId = window.setTimeout(() => {
      setRecentSearchTerms((current) => {
        const nextTerms = [
          normalizedSearch,
          ...current.filter((term) => term.toLowerCase() !== normalizedSearch.toLowerCase()),
        ].slice(0, 6);

        saveRecentBuyerSearches(nextTerms);
        return nextTerms;
      });

      const normalizedKey = normalizedSearch.toLowerCase();
      if (currentUser?.id && lastTrackedSearchRef.current !== normalizedKey) {
        lastTrackedSearchRef.current = normalizedKey;
        trackBuyerActivityEvent({
          buyerId: currentUser.id,
          eventType: 'search',
          searchTerm: normalizedSearch,
        })
          .then((event) => {
            setBuyerActivityEvents((current) => [event, ...current].slice(0, 80));
          })
          .catch(() => {});
      }
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [catalogSearch, currentUser?.id]);

  const loadBuyerQuotes = useCallback(async () => {
    if (!currentUser?.id) {
      setBuyerQuotes([]);
      return [];
    }

    setQuotesLoading(true);

    try {
      const data = await getQuoteRequestsForBuyer(currentUser.id);
      const mappedQuotes = data.map((quote) => mapQuoteRequestRecord(quote));
      setBuyerQuotes(mappedQuotes);
      return mappedQuotes;
    } catch (error) {
      setToast({ message: error.message || 'No se pudieron cargar tus cotizaciones.', type: 'error' });
      return [];
    } finally {
      setQuotesLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadBuyerQuotes();
  }, [loadBuyerQuotes]);

  const recordBuyerActivity = useCallback(async ({
    eventType,
    productId = null,
    supplierId = null,
    quoteRequestId = null,
    categoryId = null,
    searchTerm = null,
    metadata = {},
  }) => {
    if (!currentUser?.id) return null;

    try {
      const event = await trackBuyerActivityEvent({
        buyerId: currentUser.id,
        eventType,
        productId,
        supplierId,
        quoteRequestId,
        categoryId,
        searchTerm,
        metadata,
      });

      setBuyerActivityEvents((current) => [event, ...current].slice(0, 80));
      return event;
    } catch {
      return null;
    }
  }, [currentUser?.id]);

  const loadBuyerWorkspace = useCallback(async () => {
    if (!currentUser?.id) {
      setBuyerStats({ totalOrders: 0, rating: 0, favoriteSuppliers: 0 });
      setFavoriteSuppliers([]);
      setBuyerActivityEvents([]);
      setAlertSubscriptions([]);
      setBuyerAlerts([]);
      setReviewOpportunities([]);
      setFavoritesLoading(false);
      setAlertsLoading(false);
      return;
    }

    setFavoritesLoading(true);
    setAlertsLoading(true);

    try {
      const [statsData, favoritesData, activityEventsData, subscriptionsData, alertsData, reviewOpportunitiesData] = await Promise.all([
        getBuyerStats(currentUser.id),
        getFavorites(currentUser.id),
        getBuyerActivityEvents(currentUser.id, { limit: 80 }),
        getPriceAlertSubscriptions(currentUser.id),
        getPriceAlerts(currentUser.id),
        getBuyerReviewOpportunities(currentUser.id),
      ]);

      setBuyerStats(statsData);
      setFavoriteSuppliers((favoritesData ?? []).map((favorite) => mapFavoriteSupplier(favorite)).filter((favorite) => favorite.id));
      setBuyerActivityEvents(activityEventsData ?? []);
      setAlertSubscriptions(subscriptionsData ?? []);
      setBuyerAlerts((alertsData ?? []).map((alert) => mapPriceAlertRecord(alert)));
      setReviewOpportunities(reviewOpportunitiesData ?? []);
    } catch (error) {
      setToast({ message: error.message || 'No se pudo cargar tu workspace buyer.', type: 'error' });
    } finally {
      setFavoritesLoading(false);
      setAlertsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadBuyerWorkspace();
  }, [loadBuyerWorkspace]);

  useEffect(() => {
    if (!location.state?.openQuoteModal) {
      return;
    }

    setShowModal(true);
    setQuoteForm({
      ...initialQuoteForm,
      ...(location.state?.quotePrefill ?? {}),
    });
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const openQuoteModal = useCallback((prefill = {}) => {
    setQuoteForm({ ...initialQuoteForm, ...prefill });
    setShowModal(true);
  }, []);

  const closeConversation = useCallback(() => {
    setActiveConversation(null);
    setConversationMessages([]);
  }, []);

  const handleRepeatQuote = useCallback((quote) => {
    if (!quote) return;

    openQuoteModal({
      product: quote.productName ?? '',
      categoryId: quote.categoryId ?? '',
      quantity: quote.quantityValue ? String(quote.quantityValue) : '',
      unit: quote.unit ?? 'kg',
      notes: quote.notes ?? '',
    });
  }, [openQuoteModal]);

  const loadConversationForBuyer = useCallback(async ({ conversationId = null, quoteId = null, supplierId = null, closeQuoteDetail = false } = {}) => {
    if (!currentUser?.id) return null;

    setConversationLoading(true);

    try {
      const conversationRecord = conversationId
        ? await getQuoteConversationById(conversationId)
        : await getQuoteConversationForQuote(quoteId, supplierId);

      if (!conversationRecord) {
        setToast({ message: 'Todavia no existe una conversacion disponible para esta oferta.', type: 'error' });
        return null;
      }

      const [messageRows, markedConversation] = await Promise.all([
        getQuoteConversationMessages(conversationRecord.id),
        markQuoteConversationRead({ conversationId: conversationRecord.id, userId: currentUser.id }),
      ]);

      const mappedConversation = mapQuoteConversationRecord(markedConversation ?? conversationRecord);
      setActiveConversation(mappedConversation);
      setConversationMessages(messageRows.map((message) => mapQuoteConversationMessageRecord(message)));

      if (closeQuoteDetail) {
        setSelectedQuote(null);
      }

      return mappedConversation;
    } catch (error) {
      setToast({ message: error.message || 'No se pudo cargar la conversacion.', type: 'error' });
      return null;
    } finally {
      setConversationLoading(false);
    }
  }, [currentUser?.id]);

  const refreshActiveConversation = useCallback(async () => {
    if (!activeConversation?.id || !currentUser?.id) return;

    try {
      const [conversationRecord, messageRows, markedConversation] = await Promise.all([
        getQuoteConversationById(activeConversation.id),
        getQuoteConversationMessages(activeConversation.id),
        markQuoteConversationRead({ conversationId: activeConversation.id, userId: currentUser.id }),
      ]);

      if (!conversationRecord) {
        closeConversation();
        return;
      }

      setActiveConversation(mapQuoteConversationRecord(markedConversation ?? conversationRecord));
      setConversationMessages(messageRows.map((message) => mapQuoteConversationMessageRecord(message)));
    } catch (error) {
      setToast({ message: error.message || 'No se pudo actualizar la conversacion.', type: 'error' });
    }
  }, [activeConversation?.id, closeConversation, currentUser?.id]);

  const handleSendConversationMessage = useCallback(async (body) => {
    if (!activeConversation?.id || !currentUser?.id) return;

    setIsSendingConversationMessage(true);

    try {
      await sendQuoteConversationMessage({
        conversationId: activeConversation.id,
        senderUserId: currentUser.id,
        body,
      });
      await refreshActiveConversation();
    } catch (error) {
      setToast({ message: error.message || 'No se pudo enviar el mensaje.', type: 'error' });
    } finally {
      setIsSendingConversationMessage(false);
    }
  }, [activeConversation?.id, currentUser?.id, refreshActiveConversation]);

  const enrichQuoteForBuyer = useCallback(async (quote) => {
    if (!quote) return null;

    const supplierIds = [...new Set(quote.offers.map((offer) => offer.supplierId).filter(Boolean))];
    const statsEntries = await Promise.all(
      supplierIds.map(async (supplierId) => {
        try {
          const stats = await getSupplierStats(supplierId);
          return [supplierId, stats];
        } catch {
          return [supplierId, null];
        }
      }),
    );

    const statsMap = new Map(statsEntries);
    const offers = sortQuoteOffersForBuyer(
      quote.offers.map((offer) => ({
        ...offer,
        supplierRating: Number(statsMap.get(offer.supplierId)?.rating ?? 0),
      })),
    );

    return {
      ...quote,
      offers,
    };
  }, []);

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser?.id) {
      setToast({ message: 'Necesitas iniciar sesion para crear una cotizacion.', type: 'error' });
      return;
    }

    setIsSubmittingQuote(true);

    try {
      const savedQuote = mapQuoteRequestRecord(await createQuoteRequest({
        buyer_id: currentUser.id,
        requester_id: currentUser.id,
        product_name: quoteForm.product,
        category_id: quoteForm.categoryId || null,
        quantity: Number(quoteForm.quantity),
        unit: quoteForm.unit,
        delivery_date: quoteForm.deliveryDate,
        notes: quoteForm.notes || null,
      }));

      setBuyerQuotes((currentQuotes) => [savedQuote, ...currentQuotes]);
      await recordBuyerActivity({
        eventType: 'quote_created',
        productId: quoteForm.sourceProductId || null,
        supplierId: quoteForm.sourceSupplierId || null,
        quoteRequestId: savedQuote.id,
        categoryId: quoteForm.categoryId || null,
        metadata: {
          sourceContext: quoteForm.sourceContext || 'manual',
          productName: quoteForm.product,
        },
      });
      setShowModal(false);
      setActiveTab('dashboard');
      setQuoteForm(initialQuoteForm);
      setToast({ message: 'Cotizacion creada. Ahora los proveedores pueden ofertar.', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'No se pudo crear la cotizacion.', type: 'error' });
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id) return;
    try {
      await uploadAvatar(currentUser.id, file);
      await refreshCurrentUser();
      setToast({ message: 'Foto de perfil actualizada', type: 'success' });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Avatar error:', err);
      setToast({ message: err?.message || 'No se pudo subir la foto', type: 'error' });
    }
  };

  const openEditProfile = () => {
    setProfileForm({ ...buyerProfile });
    setSelectedCategoryId('');
    setEditProfileOpen(true);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();

    try {
      const categoryIds = categoryOptions
        .filter((category) => profileForm.categories.includes(category.name))
        .map((category) => category.id);

      const updatedUser = await saveBuyerProfile({
        companyName: profileForm.companyName,
        rut: profileForm.rut,
        city: profileForm.city,
        address: profileForm.address,
        description: profileForm.description,
        businessType: profileForm.businessTypeValue || profileForm.businessType,
        monthlyVolume: profileForm.monthlyVolume,
        contactMethod: profileForm.contactMethodValue || 'email',
        categoryIds,
        phone: profileForm.phone,
        whatsapp: profileForm.whatsapp,
      });

      const nextProfile = buildBuyerProfileView(updatedUser);
      setProfileForm(nextProfile);
      setEditProfileOpen(false);
      setToast({ message: 'Perfil actualizado exitosamente', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'No se pudo actualizar el perfil.', type: 'error' });
    }
  };

  const handleAddCategory = () => {
    const fallbackCategoryId = categoryOptions.find((category) => !profileForm.categories.includes(category.name))?.id;
    const categoryName = categoryOptions.find((category) => category.id === (selectedCategoryId || fallbackCategoryId))?.name;
    if (categoryName && !profileForm.categories.includes(categoryName)) {
      setProfileForm({ ...profileForm, categories: [...profileForm.categories, categoryName] });
    }
  };

  const handleRemoveCategory = (cat) => {
    setProfileForm({ ...profileForm, categories: profileForm.categories.filter((c) => c !== cat) });
  };

  const openSupplierProfile = async (supplierId, options = {}) => {
    try {
      const [supplierRaw, supplierStats, supplierReviews] = await Promise.all([
        getSupplierProfile(supplierId),
        getSupplierStats(supplierId),
        getReviewsForUser(supplierId),
      ]);

      const supplierRecord = normalizeUserRecord(supplierRaw);
      const supplierView = buildSupplierProfileView(supplierRecord);

      setViewingSupplier({
        id: supplierRecord.id,
        initials: supplierView.initials,
        name: supplierView.companyName,
        description: supplierView.description,
        plan: formatPlanName(getPlanKey(supplierRecord)),
        verified: supplierRecord?.verified,
        memberSince: formatMemberSince(supplierRecord?.created_at),
        rating: Number(supplierStats?.rating ?? 0),
        totalSales: supplierStats?.totalSales ?? 0,
        responseRate: `${supplierView.responseRate || 0}%`,
        recurringClients: supplierStats?.recurringClients ?? 0,
        rut: supplierView.rut,
        city: supplierView.city,
        address: supplierView.address,
        giro: supplierView.giro,
        email: supplierView.email,
        phone: supplierView.phone,
        whatsapp: supplierView.whatsapp,
        website: supplierView.website,
        categories: supplierView.categories,
        categoryItems: supplierRecord?.supplierCategories ?? [],
        requestProductName: options.requestProductName ?? '',
        requestCategoryId: options.requestCategoryId ?? '',
        products: (supplierRecord?.products ?? [])
          .filter((item) => item.status !== 'inactive')
          .map((item) => mapProductRecordToCard(item)),
        reviews: (supplierReviews ?? []).map((review) => mapReviewRecord(review)),
        isFavorite: favoriteSuppliers.some((supplier) => supplier.id === supplierRecord.id),
      });

      if (options.trackActivity !== false) {
        await recordBuyerActivity({
          eventType: 'supplier_view',
          supplierId,
          productId: options.productId ?? null,
          categoryId: options.requestCategoryId ?? null,
          metadata: {
            sourceContext: options.sourceContext ?? 'supplier_profile',
            productName: options.requestProductName ?? '',
          },
        });
      }
    } catch (error) {
      setToast({ message: error.message || 'No se pudo cargar el proveedor.', type: 'error' });
    }
  };

  const openSupplierFromProduct = async (product) => {
    await recordBuyerActivity({
      eventType: 'product_view',
      productId: product.id,
      supplierId: product.supplierId,
      categoryId: product.categoryId ?? null,
      metadata: {
        sourceContext: 'catalog',
        productName: product.name,
      },
    });

    await openSupplierProfile(product.supplierId, {
      requestProductName: product.name,
      requestCategoryId: product.categoryId ?? '',
      productId: product.id,
      sourceContext: 'catalog',
    });
  };

  const renderCatalogProductCard = (product, { showRecommendationMeta = false } = {}) => (
    <div
      key={product.id}
      className={`bg-white rounded-2xl border border-gray-100 overflow-hidden card-premium cursor-pointer group ${
        showRecommendationMeta ? 'h-full flex flex-col' : ''
      }`}
      onClick={() => openSupplierFromProduct(product)}
    >
      <div className={`relative ${showRecommendationMeta ? 'h-28 sm:h-32' : 'h-40'} bg-gradient-to-br ${product.gradient} overflow-hidden`}>
        {product.imageUrls?.[0] ? (
          <img src={product.imageUrls[0]} alt={product.imageAlt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <>
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-3 left-3 w-16 h-16 bg-white/30 rounded-full blur-xl" />
              <div className="absolute bottom-4 right-4 w-20 h-20 bg-white/20 rounded-full blur-2xl" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`${showRecommendationMeta ? 'text-4xl' : 'text-5xl'} filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-500`}>
                {product.emoji}
              </div>
            </div>
          </>
        )}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1.5">
          {showRecommendationMeta && product.recommendationScore > 0 && (
            <div className="text-[9px] font-bold bg-[#0D1F3C]/90 text-white px-2 py-0.5 rounded-full shadow-sm">
              Para ti
            </div>
          )}
          {product.hasTrackedPriceAlert && (
            <div className="text-[9px] font-bold bg-white/90 text-[#0D1F3C] px-2 py-0.5 rounded-full shadow-sm">
              Alerta activa
            </div>
          )}
          {product.recentPriceAlert && (
            <div
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm ${
                product.recentPriceAlert.change === 'down'
                  ? 'bg-emerald-400/95 text-emerald-950'
                  : 'bg-rose-400/95 text-rose-950'
              }`}
            >
              {product.recentPriceAlert.signalLabel}
            </div>
          )}
        </div>
        {product.status === 'low_stock' && (
          <div className="absolute top-2 right-2 text-[9px] font-bold bg-amber-400/90 text-amber-900 px-2 py-0.5 rounded-full">
            Stock bajo
          </div>
        )}
      </div>

      <div className={`${showRecommendationMeta ? 'p-2.5 flex-1 flex flex-col' : 'p-3.5'}`}>
        <h3 className={`${showRecommendationMeta ? 'text-[13px]' : 'text-sm'} font-bold text-[#0D1F3C] truncate`}>{product.name}</h3>
        <p className={`${showRecommendationMeta ? 'text-[10px]' : 'text-xs'} text-gray-400 mt-0.5 truncate`}>{product.category}</p>
        <div className={`flex items-center justify-between ${showRecommendationMeta ? 'mt-2' : 'mt-3'}`}>
          <span className={`${showRecommendationMeta ? 'text-sm' : 'text-base'} font-extrabold text-[#0D1F3C]`}>{product.price}</span>
        </div>
        {showRecommendationMeta && product.recommendationReasons?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1 min-h-[40px] content-start">
            {product.recommendationReasons.slice(0, 2).map((reason) => (
              <span key={`${product.id}-${reason}`} className="text-[9px] font-semibold bg-[#f2f7fb] text-[#0D1F3C] border border-[#dce9f2] px-1.5 py-0.5 rounded-full">
                {reason}
              </span>
            ))}
          </div>
        )}
        {product.recentPriceAlert && (
          <div className={`mt-2 rounded-xl border border-gray-100 bg-[#f8fafc] ${showRecommendationMeta ? 'px-2 py-1.5' : 'px-3 py-2'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`${showRecommendationMeta ? 'text-[10px]' : 'text-[11px]'} font-semibold text-[#0D1F3C]`}>{product.recentPriceAlert.impactLabel}</span>
              <span className={`text-[10px] font-bold ${
                product.recentPriceAlert.change === 'down' ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {product.recentPriceAlert.change === 'down' ? '↓' : '↑'} {product.recentPriceAlert.currentPrice}
              </span>
            </div>
            <p className={`${showRecommendationMeta ? 'text-[9px]' : 'text-[10px]'} text-gray-400 mt-1`}>
              Antes {product.recentPriceAlert.previousPrice} · {product.recentPriceAlert.dateLabel}
            </p>
          </div>
        )}
        <div className="flex-1" />
        {product.supplierName && (
          <div className={`flex items-center gap-2 ${showRecommendationMeta ? 'mt-2.5 pt-2.5' : 'mt-3 pt-3'} border-t border-gray-50`}>
            <div className={`${showRecommendationMeta ? 'w-5 h-5' : 'w-6 h-6'} bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-md flex items-center justify-center text-[#2ECAD5] text-[8px] font-bold flex-shrink-0`}>
              {product.supplierName.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`${showRecommendationMeta ? 'text-[10px]' : 'text-[11px]'} font-semibold text-gray-600 truncate`}>{product.supplierName}</p>
              <span className={`${showRecommendationMeta ? 'text-[9px]' : 'text-[10px]'} text-gray-400`}>Ver proveedor</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const handleOpenQuoteOffers = useCallback(async (quote) => {
    setSelectedQuote(quote);
    const refreshedQuotes = await loadBuyerQuotes();
    const nextQuote = refreshedQuotes.find((item) => item.id === quote.id) ?? quote;
    setSelectedQuote(await enrichQuoteForBuyer(nextQuote));
  }, [enrichQuoteForBuyer, loadBuyerQuotes]);

  useEffect(() => {
    if (!location.state?.activeTab && !location.state?.focusQuoteId && !location.state?.focusOfferId && !location.state?.focusConversationId) {
      return;
    }

    let cancelled = false;

    async function applyNotificationState() {
      if (location.state?.activeTab) {
        setActiveTab(location.state.activeTab);
      }

      const targetQuoteId = location.state?.focusQuoteId;
      const targetOfferId = location.state?.focusOfferId;
      const targetConversationId = location.state?.focusConversationId;

      if (!targetQuoteId && !targetOfferId && !targetConversationId) {
        navigate(location.pathname, { replace: true, state: null });
        return;
      }

      try {
        let resolvedQuoteId = targetQuoteId;
        let resolvedOfferId = targetOfferId;

        if (targetConversationId) {
          const conversationRecord = await getQuoteConversationById(targetConversationId);
          if (cancelled) return;
          resolvedQuoteId = conversationRecord?.quote_request_id ?? resolvedQuoteId;
          resolvedOfferId = resolvedOfferId ?? null;
        }

        const refreshedQuotes = await loadBuyerQuotes();
        if (cancelled) return;

        const matchingQuote = refreshedQuotes.find((quote) => (
          (resolvedQuoteId && quote.id === resolvedQuoteId)
          || (resolvedOfferId && quote.offers.some((offer) => offer.id === resolvedOfferId))
        ));

        if (matchingQuote) {
          await handleOpenQuoteOffers(matchingQuote);
          if (!cancelled && targetConversationId) {
            await loadConversationForBuyer({ conversationId: targetConversationId, closeQuoteDetail: true });
          }
        } else if (targetConversationId) {
          await loadConversationForBuyer({ conversationId: targetConversationId });
        }
      } catch (error) {
        if (!cancelled) {
          setToast({ message: error.message || 'No se pudo abrir la conversacion solicitada.', type: 'error' });
        }
      } finally {
        if (!cancelled) {
          navigate(location.pathname, { replace: true, state: null });
        }
      }
    }

    applyNotificationState();

    return () => {
      cancelled = true;
    };
  }, [handleOpenQuoteOffers, loadBuyerQuotes, loadConversationForBuyer, location.pathname, location.state, navigate]);

  const handleAcceptQuoteOffer = async (offerId) => {
    if (!selectedQuote) return;

    setQuoteActionId(offerId);

    try {
      await acceptOffer(offerId);
      const refreshedQuotes = await loadBuyerQuotes();
      const nextQuote = refreshedQuotes.find((quote) => quote.id === selectedQuote.id) ?? null;
      setSelectedQuote(await enrichQuoteForBuyer(nextQuote));
      await loadBuyerWorkspace();
      setToast({ message: 'Oferta aceptada. La cotizacion quedo cerrada.', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'No se pudo aceptar la oferta.', type: 'error' });
    } finally {
      setQuoteActionId('');
    }
  };

  const handleCancelBuyerQuote = useCallback(async (quoteId) => {
    setQuoteActionId(quoteId);

    try {
      await cancelQuoteRequest(quoteId);
      const refreshedQuotes = await loadBuyerQuotes();

      if (selectedQuote?.id === quoteId) {
        setSelectedQuote(await enrichQuoteForBuyer(refreshedQuotes.find((quote) => quote.id === quoteId) ?? null));
      }

      setToast({ message: 'Cotizacion cancelada.', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'No se pudo cancelar la cotizacion.', type: 'error' });
    } finally {
      setQuoteActionId('');
    }
  }, [enrichQuoteForBuyer, loadBuyerQuotes, selectedQuote?.id]);

  const handleToggleFavorite = async (supplierId) => {
    if (!currentUser?.id) {
      setToast({ message: 'Necesitas iniciar sesion para guardar favoritos.', type: 'error' });
      return;
    }

    setFavoriteActionId(supplierId);

    try {
      const isFavorite = await toggleFavorite(currentUser.id, supplierId);
      await recordBuyerActivity({
        eventType: isFavorite ? 'favorite_added' : 'favorite_removed',
        supplierId,
        metadata: {
          sourceContext: viewingSupplier?.id === supplierId ? 'supplier_profile' : 'favorites',
        },
      });
      await loadBuyerWorkspace();

      setViewingSupplier((currentSupplier) => (
        currentSupplier?.id === supplierId
          ? { ...currentSupplier, isFavorite }
          : currentSupplier
      ));

      setToast({
        message: isFavorite ? 'Proveedor agregado a favoritos.' : 'Proveedor removido de favoritos.',
        type: 'success',
      });
    } catch (error) {
      setToast({ message: error.message || 'No se pudo actualizar favoritos.', type: 'error' });
    } finally {
      setFavoriteActionId('');
    }
  };

  const handleSubscribeToAlert = async (payload) => {
    if (!currentUser?.id) {
      setToast({ message: 'Necesitas iniciar sesion para seguir alertas.', type: 'error' });
      return;
    }

    setIsSavingAlertSubscription(true);

    try {
      await subscribeToPriceAlert(currentUser.id, payload);
      await loadBuyerWorkspace();
      setAlertForm({ mode: 'category', categoryId: '', productId: '' });
      setToast({ message: 'Alerta de precio activada.', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'No se pudo activar la alerta.', type: 'error' });
    } finally {
      setIsSavingAlertSubscription(false);
    }
  };

  const handleCreateAlertSubscription = async (event) => {
    event.preventDefault();

    const payload = alertForm.mode === 'product'
      ? { productId: alertForm.productId || null, categoryId: null }
      : { productId: null, categoryId: alertForm.categoryId || null };

    await handleSubscribeToAlert(payload);
  };

  const handleRemoveAlertSubscription = async (subscriptionId) => {
    if (!currentUser?.id) {
      setToast({ message: 'Necesitas iniciar sesion para editar alertas.', type: 'error' });
      return;
    }

    setSubscriptionActionId(subscriptionId);

    try {
      await removePriceAlertSubscription(subscriptionId, currentUser.id);
      await loadBuyerWorkspace();
      setToast({ message: 'Alerta removida.', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'No se pudo remover la alerta.', type: 'error' });
    } finally {
      setSubscriptionActionId('');
    }
  };

  const handleFollowCurrentSupplierCategory = async () => {
    if (!viewingSupplier) return;

    const categoryId = viewingSupplier.requestCategoryId || viewingSupplier.categoryItems?.[0]?.id || '';
    if (!categoryId) {
      setToast({ message: 'Este proveedor no tiene una categoria asociada para seguir alertas.', type: 'error' });
      return;
    }

    await handleSubscribeToAlert({ categoryId, productId: null });
  };

  const openReviewModal = useCallback((opportunity) => {
    setReviewForm({
      quoteOfferId: opportunity.quoteOfferId,
      reviewedId: opportunity.reviewedId,
      supplierName: opportunity.supplierName,
      productName: opportunity.productName,
      rating: 5,
      comment: '',
    });
  }, []);

  const closeReviewModal = useCallback(() => {
    setReviewForm(initialReviewForm);
  }, []);

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser?.id || !reviewForm.quoteOfferId || !reviewForm.reviewedId) {
      setToast({ message: 'No se pudo preparar la reseña.', type: 'error' });
      return;
    }

    setIsSubmittingReview(true);

    try {
      await createReview({
        reviewerId: currentUser.id,
        reviewedId: reviewForm.reviewedId,
        quoteOfferId: reviewForm.quoteOfferId,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
      });
      await loadBuyerWorkspace();
      closeReviewModal();
      setToast({ message: `Reseña publicada para ${reviewForm.supplierName}.`, type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'No se pudo publicar la reseña.', type: 'error' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const reviewOpportunityMap = useMemo(
    () => new Map(reviewOpportunities.map((opportunity) => [opportunity.quoteOfferId, opportunity])),
    [reviewOpportunities],
  );

  const quoteSummary = useMemo(() => {
    const activeQuotes = buyerQuotes.filter((quote) => ['open', 'in_review'].includes(quote.status));
    const totalOffersReceived = buyerQuotes.reduce((total, quote) => total + quote.offerCount, 0);
    const activeSuppliers = new Set(
      buyerQuotes
        .flatMap((quote) => quote.offers)
        .map((offer) => offer.supplierId)
        .filter(Boolean),
    ).size;
    const closedQuotes = buyerQuotes.filter((quote) => quote.status === 'closed').length;
    const acceptedOffers = buyerQuotes
      .flatMap((quote) => quote.offers
        .filter((offer) => offer.status === 'accepted')
        .map((offer) => ({
          ...offer,
          quoteId: quote.id,
          quoteProductName: quote.productName,
          quoteQuantityLabel: quote.quantityLabel,
          quoteDeliveryDateLabel: quote.deliveryDateLabel,
        })))
      .sort((left, right) => left.priceValue - right.priceValue);

    return {
      activeQuotes,
      totalOffersReceived,
      activeSuppliers,
      closedQuotes,
      acceptedOffers,
    };
  }, [buyerQuotes]);

  const catalogFilterOptions = useMemo(
    () => ['Todos', ...categoryOptions.map((category) => category.name)],
    [categoryOptions],
  );

  const catalogPriceSignalMap = useMemo(() => {
    const latestByProductId = new Map();

    buyerAlerts.forEach((alert) => {
      if (!alert.productId) return;

      const existing = latestByProductId.get(alert.productId);
      if (!existing || new Date(alert.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
        latestByProductId.set(alert.productId, alert);
      }
    });

    return latestByProductId;
  }, [buyerAlerts]);

  const trackedAlertTargets = useMemo(() => ({
    productIds: new Set(
      alertSubscriptions
        .filter((subscription) => subscription.product_id)
        .map((subscription) => subscription.product_id),
    ),
    categoryIds: new Set(
      alertSubscriptions
        .filter((subscription) => !subscription.product_id && subscription.category_id)
        .map((subscription) => subscription.category_id),
    ),
  }), [alertSubscriptions]);

  const catalogProductsWithSignals = useMemo(
    () => catalogProducts.map((product) => ({
      ...product,
      recentPriceAlert: catalogPriceSignalMap.get(product.id) ?? null,
      hasTrackedPriceAlert: trackedAlertTargets.productIds.has(product.id)
        || trackedAlertTargets.categoryIds.has(product.categoryId),
    })),
    [catalogPriceSignalMap, catalogProducts, trackedAlertTargets],
  );

  const recommendedCatalogProducts = useMemo(
    () => buildBuyerRecommendations(catalogProductsWithSignals, {
      buyerProfile,
      buyerQuotes,
      favoriteSuppliers,
      buyerActivityEvents,
      recentSearchTerms,
      currentSearch: catalogSearch,
      alertSubscriptions,
    }).slice(0, 4),
    [alertSubscriptions, buyerActivityEvents, buyerProfile, buyerQuotes, catalogProductsWithSignals, catalogSearch, favoriteSuppliers, recentSearchTerms],
  );

  const filteredCatalogProducts = useMemo(() => {
    const normalizedSearch = catalogSearch.trim().toLowerCase();

    return catalogProductsWithSignals
      .filter((product) => {
        const matchCategory = catalogFilter === 'Todos' || product.category === catalogFilter;
        const matchSearch = !normalizedSearch
          || product.name.toLowerCase().includes(normalizedSearch)
          || product.category.toLowerCase().includes(normalizedSearch);

        return matchCategory && matchSearch;
      })
      .sort((left, right) => {
        if (left.recentPriceAlert && !right.recentPriceAlert) return -1;
        if (!left.recentPriceAlert && right.recentPriceAlert) return 1;
        return left.name.localeCompare(right.name, 'es');
      });
  }, [catalogFilter, catalogProductsWithSignals, catalogSearch]);

  const alertProductOptions = useMemo(
    () => [...catalogProductsWithSignals].sort((left, right) => left.name.localeCompare(right.name, 'es')),
    [catalogProductsWithSignals],
  );

  const showRecommendedCatalog = activeTab === 'catalog' && catalogFilter === 'Todos' && !catalogSearch.trim();
  const recommendedCatalogProductIds = useMemo(
    () => new Set(recommendedCatalogProducts.map((product) => product.id)),
    [recommendedCatalogProducts],
  );
  const catalogGridProducts = useMemo(
    () => (showRecommendedCatalog
      ? filteredCatalogProducts.filter((product) => !recommendedCatalogProductIds.has(product.id))
      : filteredCatalogProducts),
    [filteredCatalogProducts, recommendedCatalogProductIds, showRecommendedCatalog],
  );

  const availableProfileCategories = useMemo(
    () => categoryOptions.filter((category) => !profileForm.categories.includes(category.name)),
    [categoryOptions, profileForm.categories],
  );

  const activeQuotes = quoteSummary.activeQuotes;
  const totalOffersReceived = quoteSummary.totalOffersReceived;
  const activeSuppliers = quoteSummary.activeSuppliers;
  const closedQuotes = quoteSummary.closedQuotes;
  const acceptedOffers = quoteSummary.acceptedOffers;
  const quoteHistory = useMemo(
    () => [...buyerQuotes].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    [buyerQuotes],
  );

  const dashboardTabContent = useMemo(() => (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Cotizaciones activas',
            value: activeQuotes.length,
            items: buyerQuotes.filter(q => ['open','in_review'].includes(q.status)).map(q => ({ label: q.productName, value: q.statusLabel, sub: `${q.quantityLabel} · ${q.createdAtLabel}` })),
            emptyText: 'No hay cotizaciones activas',
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            ),
          },
          {
            label: 'Ofertas recibidas',
            value: totalOffersReceived,
            items: buyerQuotes.filter(q => q.offers.length > 0).map(q => ({ label: q.productName, value: `${q.offers.length} oferta${q.offers.length !== 1 ? 's' : ''}`, sub: q.offers.map(o => o.supplierName).filter(Boolean).join(', ') })),
            emptyText: 'Aun no recibiste ofertas',
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            ),
          },
          {
            label: 'Proveedores ofertando',
            value: activeSuppliers,
            items: [...new Map(buyerQuotes.flatMap(q => q.offers).filter(o => o.supplierId && o.supplierName).map(o => [o.supplierId, o])).values()].map(o => ({ label: o.supplierName, sub: o.supplierCity || '' })),
            emptyText: 'Ningún proveedor ha ofertado aun',
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            ),
          },
          {
            label: 'Cotizaciones cerradas',
            value: closedQuotes,
            items: buyerQuotes.filter(q => q.status === 'closed').map(q => ({ label: q.productName, value: q.statusLabel, sub: q.createdAtLabel })),
            emptyText: 'No hay cotizaciones cerradas',
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m6 2.25a9 9 0 11-18 0 9 9 0 0118 0Z" />
              </svg>
            ),
          },
        ].map((s) => (
          <button key={s.label} type="button" onClick={() => setStatDetail({ title: s.label, value: s.value, items: s.items, emptyText: s.emptyText })} className="bg-white rounded-2xl border border-gray-100 p-5 card-premium text-left hover:border-[#2ECAD5]/40 hover:shadow-md transition-all group">
            <div className="w-9 h-9 bg-[#f8fafc] rounded-xl flex items-center justify-center text-gray-400 mb-3 group-hover:bg-[#2ECAD5]/10 group-hover:text-[#2ECAD5] transition-colors">
              {s.icon}
            </div>
            <div className="text-2xl font-extrabold text-[#0D1F3C]">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </button>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-extrabold text-[#0D1F3C] mb-4">Cotizaciones activas</h2>
        {quotesLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
            Cargando cotizaciones...
          </div>
        ) : buyerQuotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {buyerQuotes.map((quote) => {
              const acceptedOffer = quote.offers.find((offer) => offer.status === 'accepted');

              return (
                <div key={quote.id} className="bg-white rounded-2xl border border-gray-100 p-5 card-premium">
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#2ECAD5]/10 to-[#2ECAD5]/5 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${quote.statusClass}`}>
                      {quote.statusLabel}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#0D1F3C] mb-1">{quote.productName}</h3>
                  <p className="text-sm text-gray-500">{quote.quantityLabel}</p>
                  <p className="text-xs text-gray-400 mt-1">{quote.categoryName} / Entrega {quote.deliveryDateLabel}</p>
                  <p className="text-xs text-gray-400 mt-2">{quote.createdAtLabel}</p>
                  {quote.offers.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {quote.offers.map((offer) => offer.supplierName).filter(Boolean).map((name) => (
                        <span key={name} className="text-[10px] font-semibold bg-[#f2f7fb] text-[#0D1F3C] border border-[#dce9f2] px-2 py-0.5 rounded-full">
                          🏪 {name}
                        </span>
                      ))}
                    </div>
                  )}
                  {acceptedOffer && (
                    <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Oferta aceptada</div>
                      <div className="text-sm font-bold text-[#0D1F3C] mt-1">{acceptedOffer.supplierName}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {acceptedOffer.priceLabel} / Entrega estimada: {acceptedOffer.estimatedLeadTime}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => handleOpenQuoteOffers(quote)}
                      className="flex-1 text-sm text-[#2ECAD5] border border-[#2ECAD5]/30 hover:bg-[#2ECAD5]/5 font-semibold py-2.5 rounded-xl transition-all"
                    >
                      Ver ofertas
                    </button>
                    {['open', 'in_review'].includes(quote.status) && (
                      <button
                        type="button"
                        onClick={() => handleCancelBuyerQuote(quote.id)}
                        disabled={quoteActionId === quote.id}
                        className="px-4 text-sm text-rose-600 border border-rose-200 hover:bg-rose-50 font-semibold py-2.5 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {quoteActionId === quote.id ? '...' : 'Cancelar'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <h3 className="text-lg font-bold text-[#0D1F3C]">Aun no creas tu primera Solicitud de Cotización</h3>
            <p className="text-sm text-gray-400 mt-2">Publica una necesidad de compra y empieza a comparar ofertas reales.</p>
            <button
              type="button"
              onClick={() => openQuoteModal()}
              className="mt-5 bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold px-5 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-400/20"
            >
              Crear cotizacion
            </button>
          </div>
        )}
      </div>

      {reviewOpportunities.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-extrabold text-[#0D1F3C]">Reseñas pendientes</h2>
            <span className="text-[10px] font-bold bg-amber-400 text-amber-900 px-2.5 py-1 rounded-full animate-pulse">
              {reviewOpportunities.length} pendiente{reviewOpportunities.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviewOpportunities.map((opportunity) => (
              <div key={opportunity.quoteOfferId} className="bg-white rounded-2xl border border-amber-100 p-5 card-premium">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#0D1F3C] truncate">{opportunity.supplierName}</p>
                    <p className="text-xs text-gray-400 truncate">{opportunity.productName}</p>
                  </div>
                </div>
                <div className="text-[10px] font-semibold text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5 mb-3">
                  ✅ Compra verificada — Deja tu opinión
                </div>
                <button
                  type="button"
                  onClick={() => openReviewModal(opportunity)}
                  className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold text-sm py-2.5 rounded-xl hover:shadow-lg hover:shadow-amber-400/20 transition-all"
                >
                  Dejar reseña
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-extrabold text-[#0D1F3C] mb-4">Historial de cotizaciones</h2>
        {quoteHistory.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {quoteHistory.map((quote, index) => {
              const acceptedOffer = quote.offers.find((offer) => offer.status === 'accepted');

              return (
                <div
                  key={quote.id}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-[#f8fafc] transition-colors ${
                    index < quoteHistory.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    quote.status === 'closed'
                      ? 'bg-emerald-50'
                      : quote.status === 'cancelled'
                        ? 'bg-rose-50'
                        : 'bg-[#f8fafc]'
                  }`}>
                    <svg className={`w-5 h-5 ${
                      quote.status === 'closed'
                        ? 'text-emerald-500'
                        : quote.status === 'cancelled'
                          ? 'text-rose-500'
                          : 'text-[#2ECAD5]'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-[#0D1F3C]">{quote.productName}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${quote.statusClass}`}>
                        {quote.statusLabel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {quote.quantityLabel} / {quote.categoryName} / {quote.createdAtLabel}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {quote.offerCount} {quote.offerCount === 1 ? 'oferta recibida' : 'ofertas recibidas'}
                      {acceptedOffer ? ` / Mejor cierre ${acceptedOffer.priceLabel}` : ''}
                    </p>
                    {acceptedOffer?.supplierName ? (
                      <p className="text-xs font-semibold text-[#0D1F3C] mt-0.5">🏪 {acceptedOffer.supplierName}</p>
                    ) : quote.offers.length > 0 ? (
                      <p className="text-xs text-gray-500 mt-0.5">
                        🏪 {quote.offers.map((o) => o.supplierName).filter(Boolean).join(', ')}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRepeatQuote(quote)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#2ECAD5] border border-[#2ECAD5]/30 hover:bg-[#2ECAD5]/5 px-3 py-2 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Repetir cotizacion
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
            Aun no tienes historial de cotizaciones.
          </div>
        )}
      </div>
    </div>
  ), [
    activeQuotes.length,
    activeSuppliers,
    buyerQuotes,
    closedQuotes,
    handleCancelBuyerQuote,
    handleOpenQuoteOffers,
    handleRepeatQuote,
    openQuoteModal,
    openReviewModal,
    quoteActionId,
    quoteHistory,
    quotesLoading,
    reviewOpportunities,
    setStatDetail,
    totalOffersReceived,
    unreadBuyerOfferNotifications,
  ]);

  const headerTabs = [
    {
      id: 'catalog',
      label: 'Marketplace',
      active: activeTab === 'catalog',
      onClick: () => setActiveTab('catalog'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
        </svg>
      ),
    },
    {
      id: 'dashboard',
      label: 'Cotizaciones',
      active: activeTab === 'dashboard',
      onClick: () => setActiveTab('dashboard'),
      badge: unreadBuyerOfferNotifications || null,
      badgeClassName: unreadBuyerOfferNotifications
        ? 'text-[10px] font-bold bg-emerald-400 text-[#0D1F3C] px-2 py-0.5 rounded-full animate-pulse'
        : undefined,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      id: 'alerts',
      label: 'Alertas',
      active: activeTab === 'alerts',
      onClick: () => setActiveTab('alerts'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 3.94c.09-.542.56-.94 1.11-.94h1.1c.55 0 1.02.398 1.11.94l.149.897c.052.313.245.585.52.735.299.163.64.266 1.007.3l.92.085a1.125 1.125 0 01.844 1.79l-.566.777a1.125 1.125 0 00-.182.918c.065.303.098.616.098.934 0 .318-.033.631-.098.934a1.125 1.125 0 00.182.918l.566.777a1.125 1.125 0 01-.844 1.79l-.92.085a2.822 2.822 0 00-1.007.3 1.125 1.125 0 00-.52.735l-.149.897c-.09.542-.56.94-1.11.94h-1.1c-.55 0-1.02-.398-1.11-.94l-.149-.897a1.125 1.125 0 00-.52-.735 2.822 2.822 0 00-1.007-.3l-.92-.085a1.125 1.125 0 01-.844-1.79l.566-.777a1.125 1.125 0 00.182-.918 4.473 4.473 0 010-1.868 1.125 1.125 0 00-.182-.918l-.566-.777a1.125 1.125 0 01.844-1.79l.92-.085c.367-.034.708-.137 1.007-.3.275-.15.468-.422.52-.735l.149-.897z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'favorites',
      label: 'Favoritos',
      active: activeTab === 'favorites',
      onClick: () => setActiveTab('favorites'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Mi Perfil',
      active: activeTab === 'profile',
      onClick: () => setActiveTab('profile'),
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] bg-grid">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {statDetail && (
        <StatDetailModal
          title={statDetail.title}
          value={statDetail.value}
          items={statDetail.items}
          emptyText={statDetail.emptyText}
          onClose={() => setStatDetail(null)}
        />
      )}

      {showModal && (
        <Modal title="Nueva Cotizacion" onClose={() => setShowModal(false)}>
          <form onSubmit={handleQuoteSubmit} className="space-y-4">
            <div>
              <label htmlFor="quote-product" className="block text-sm font-medium text-gray-700 mb-1.5">
                Producto necesitado <span className="text-red-500">*</span>
              </label>
              <input
                id="quote-product"
                type="text"
                required
                placeholder="Ej: Harina extra fina, Aceite de oliva..."
                value={quoteForm.product}
                onChange={(e) => setQuoteForm({ ...quoteForm, product: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
              />
            </div>
            <div>
              <label htmlFor="quote-category" className="block text-sm font-medium text-gray-700 mb-1.5">Categoria</label>
              <select
                id="quote-category"
                value={quoteForm.categoryId}
                onChange={(e) => setQuoteForm({ ...quoteForm, categoryId: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] bg-white transition-all"
              >
                <option value="">Selecciona una categoria</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="quote-quantity" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cantidad <span className="text-red-500">*</span>
                </label>
                <input
                  id="quote-quantity"
                  type="number"
                  required
                  min="1"
                  placeholder="500"
                  value={quoteForm.quantity}
                  onChange={(e) => setQuoteForm({ ...quoteForm, quantity: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                />
              </div>
              <div className="w-28">
                <label htmlFor="quote-unit" className="block text-sm font-medium text-gray-700 mb-1.5">Unidad</label>
                <select
                  id="quote-unit"
                  value={quoteForm.unit}
                  onChange={(e) => setQuoteForm({ ...quoteForm, unit: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] bg-white transition-all"
                >
                  {units.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="quote-delivery-date" className="block text-sm font-medium text-gray-700 mb-1.5">
                Fecha de entrega requerida <span className="text-red-500">*</span>
              </label>
              <input
                id="quote-delivery-date"
                type="date"
                required
                value={quoteForm.deliveryDate}
                onChange={(e) => setQuoteForm({ ...quoteForm, deliveryDate: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
              />
            </div>
            <div>
              <label htmlFor="quote-notes" className="block text-sm font-medium text-gray-700 mb-1.5">
                Notas para proveedores
              </label>
              <textarea
                id="quote-notes"
                rows={3}
                placeholder="Ej: Marca preferida, calibre, formato de entrega, horario de recepcion..."
                value={quoteForm.notes}
                onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 resize-none transition-all"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmittingQuote}
                className="flex-1 bg-gradient-to-r from-[#0D1F3C] to-[#1a3260] text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmittingQuote ? 'Creando...' : 'Enviar cotizacion'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {selectedQuote && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[#0D1F3C]/50 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto"
          onClick={(event) => event.target === event.currentTarget && setSelectedQuote(null)}
        >
          <div className="transform-gpu bg-[#f8fafc] rounded-2xl shadow-2xl shadow-[#0D1F3C]/20 w-full max-w-4xl my-8 animate-fade-in-up overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-[#0D1F3C] via-[#1a3260] to-[#0D1F3C] relative">
              <div className="absolute inset-0 bg-grid opacity-20" />
              <button
                onClick={() => setSelectedQuote(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all z-10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 pb-6 relative">
              <div className="w-20 h-20 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-2xl flex items-center justify-center text-[#2ECAD5] text-2xl font-extrabold border-4 border-white shadow-lg -mt-10 relative z-10">
                SC
              </div>
              <div className="mt-4 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#0D1F3C]">{selectedQuote.productName}</h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedQuote.quantityLabel} / Entrega {selectedQuote.deliveryDateLabel}</p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${selectedQuote.statusClass}`}>
                      {selectedQuote.statusLabel}
                    </span>
                    <span className="text-xs text-gray-400">{selectedQuote.offerCount} ofertas recibidas</span>
                    <span className="text-xs text-gray-400">Creada {selectedQuote.createdAtLabel}</span>
                  </div>
                </div>
                {['open', 'in_review'].includes(selectedQuote.status) && (
                  <button
                    type="button"
                    onClick={() => handleCancelBuyerQuote(selectedQuote.id)}
                    disabled={quoteActionId === selectedQuote.id}
                    className="border border-rose-200 text-rose-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-rose-50 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {quoteActionId === selectedQuote.id ? 'Cancelando...' : 'Cancelar Solicitud'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Categoria</div>
                  <div className="text-lg font-extrabold text-[#0D1F3C] mt-1">{selectedQuote.categoryName}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Cantidad</div>
                  <div className="text-lg font-extrabold text-[#0D1F3C] mt-1">{selectedQuote.quantityLabel}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Entrega</div>
                  <div className="text-lg font-extrabold text-[#0D1F3C] mt-1">{selectedQuote.deliveryDateLabel}</div>
                </div>
              </div>

              <div className="mt-4 bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Notas</div>
                <p className="text-sm text-gray-600 mt-2">{selectedQuote.notes || 'Sin notas adicionales para esta cotizacion.'}</p>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-sm font-bold text-[#0D1F3C]">Comparar ofertas</h3>
                  <span className="text-xs text-gray-400">{selectedQuote.offerCount} proveedores</span>
                </div>

                {selectedQuote.offers.length > 0 ? (
                  <div className="space-y-3">
                    {selectedQuote.offers.map((offer) => (
                      <div key={offer.id} className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base font-bold text-[#0D1F3C]">{offer.supplierName}</h4>
                              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${offer.statusClass}`}>
                                {offer.statusLabel}
                              </span>
                              {offer.supplierVerified && (
                                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                                  Verificado
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mt-1">{offer.supplierCity || 'Ciudad no informada'} / {offer.createdAtLabel}</p>
                            <p className="text-sm text-gray-600 mt-3">{offer.notes || 'Sin comentarios adicionales.'}</p>
                          </div>

                          <div className="lg:text-right lg:min-w-[220px]">
                            <div className="text-2xl font-extrabold text-[#0D1F3C]">{offer.priceLabel}</div>
                            <div className="text-sm text-gray-400 mt-1">Entrega estimada: {offer.estimatedLeadTime}</div>
                            <div className="flex items-center gap-2 lg:justify-end mt-2">
                              <span className="text-[11px] font-semibold bg-[#f8fafc] text-[#0D1F3C] border border-gray-100 px-2.5 py-1 rounded-lg">
                                Rating {Number(offer.supplierRating ?? 0).toFixed(1)}
                              </span>
                              {offer.supplierVerified && (
                                <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-lg">
                                  Verificado
                                </span>
                              )}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2 lg:justify-end">
                              <button
                                type="button"
                                onClick={() => loadConversationForBuyer({
                                  quoteId: selectedQuote.id,
                                  supplierId: offer.supplierId,
                                  closeQuoteDetail: true,
                                })}
                                className="border border-[#2ECAD5]/30 text-[#2ECAD5] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#2ECAD5]/5 transition-all"
                              >
                                Abrir conversacion
                              </button>
                              {selectedQuote.status !== 'closed' && selectedQuote.status !== 'cancelled' && offer.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => handleAcceptQuoteOffer(offer.id)}
                                  disabled={quoteActionId === offer.id}
                                  className="bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-400/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {quoteActionId === offer.id ? 'Aceptando...' : 'Aceptar oferta'}
                                </button>
                              )}
                              {offer.status === 'accepted' && reviewOpportunityMap.has(offer.id) && (
                                <button
                                  type="button"
                                  onClick={() => openReviewModal(reviewOpportunityMap.get(offer.id))}
                                  className="border border-[#2ECAD5]/30 text-[#2ECAD5] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#2ECAD5]/5 transition-all"
                                >
                                  Dejar reseña
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-400">
                    Todavia no llegan ofertas para esta cotizacion.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {reviewForm.quoteOfferId && (
        <Modal title="Dejar reseña" onClose={closeReviewModal}>
          <form onSubmit={handleReviewSubmit} className="space-y-5">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Operacion verificada</div>
              <div className="text-sm font-bold text-[#0D1F3C] mt-1">{reviewForm.supplierName}</div>
              <p className="text-sm text-gray-600 mt-1">
                Comparte como fue la compra de {reviewForm.productName} para fortalecer la confianza del marketplace.
              </p>
            </div>

            <div>
              <label htmlFor="review-rating" className="block text-sm font-medium text-gray-700 mb-1.5">
                Calificacion <span className="text-red-500">*</span>
              </label>
              <select
                id="review-rating"
                value={reviewForm.rating}
                onChange={(event) => setReviewForm((current) => ({ ...current, rating: Number(event.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] bg-white transition-all"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>{value} estrella{value > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-1.5">
                Comentario <span className="text-red-500">*</span>
              </label>
              <textarea
                id="review-comment"
                rows={4}
                required
                minLength={12}
                placeholder="Ej: entrega puntual, buena calidad, comunicación rapida..."
                value={reviewForm.comment}
                onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 resize-none transition-all"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeReviewModal}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="flex-1 bg-gradient-to-r from-[#0D1F3C] to-[#1a3260] text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmittingReview ? 'Publicando...' : 'Publicar reseña'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editProfileOpen && (
        <Modal title="Editar perfil" onClose={() => setEditProfileOpen(false)}>
          <form onSubmit={handleProfileSave} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
            {/* Company info */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Informacion del negocio</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razon social</label>
                  <input
                    type="text"
                    required
                    value={profileForm.companyName}
                    onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                  <input
                    type="text"
                    value={profileForm.description}
                    onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                    <input
                      type="text"
                      value={profileForm.rut}
                      onChange={(e) => setProfileForm({ ...profileForm, rut: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Direccion</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de negocio</label>
                    <select
                      value={profileForm.businessTypeValue}
                      onChange={(e) => {
                        const option = BUSINESS_TYPE_OPTIONS.find((item) => item.value === e.target.value);
                        setProfileForm({
                          ...profileForm,
                          businessTypeValue: e.target.value,
                          businessType: option?.label ?? '',
                        });
                      }}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 bg-white transition-all"
                    >
                      {BUSINESS_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Volumen mensual</label>
                    <input
                      type="text"
                      value={profileForm.monthlyVolume}
                      onChange={(e) => setProfileForm({ ...profileForm, monthlyVolume: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Contacto</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    readOnly
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                    <input
                      type="tel"
                      value={profileForm.whatsapp}
                      onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medio preferido</label>
                  <select
                    value={profileForm.contactMethodValue}
                    onChange={(e) => {
                      const option = CONTACT_METHOD_OPTIONS.find((item) => item.value === e.target.value);
                      setProfileForm({
                        ...profileForm,
                        contactMethodValue: e.target.value,
                        contactMethod: option?.label ?? '',
                      });
                    }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 bg-white transition-all"
                  >
                    {CONTACT_METHOD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Categorias</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {profileForm.categories.map((cat) => (
                  <span key={cat} className="text-sm font-medium bg-[#f0fdfa] text-[#0D1F3C] border border-[#2ECAD5]/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                    {cat}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategoryId || availableProfileCategories[0]?.id || ''}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 bg-white transition-all"
                >
                  {availableProfileCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={availableProfileCategories.length === 0}
                  className="border border-[#2ECAD5] text-[#2ECAD5] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#2ECAD5]/5 transition-all text-sm"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditProfileOpen(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-400/20"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Supplier profile modal */}
      {viewingSupplier && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[#0D1F3C]/50 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && setViewingSupplier(null)}
        >
          <div className="transform-gpu bg-[#f8fafc] rounded-2xl shadow-2xl shadow-[#0D1F3C]/20 w-full max-w-3xl my-8 animate-fade-in-up overflow-hidden">
            {/* Header banner */}
            <div className="h-28 bg-gradient-to-r from-[#0D1F3C] via-[#1a3260] to-[#0D1F3C] relative">
              <div className="absolute inset-0 bg-grid opacity-20" />
              <button
                onClick={() => setViewingSupplier(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all z-10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Profile info */}
            <div className="px-6 pb-6 relative">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold border-4 border-white shadow-lg -mt-10 relative z-10">
                {viewingSupplier.initials}
              </div>
              <div className="mt-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0D1F3C]">{viewingSupplier.name}</h2>
                  <p className="text-gray-500 text-sm">{viewingSupplier.description}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] font-bold bg-gradient-to-r from-emerald-400 to-blue-500 text-white px-2.5 py-0.5 rounded-full uppercase">
                      Plan {viewingSupplier.plan}
                    </span>
                    {viewingSupplier.verified && (
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        Verificado
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">Miembro desde {viewingSupplier.memberSince}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleFavorite(viewingSupplier.id)}
                    disabled={favoriteActionId === viewingSupplier.id}
                    className={`flex items-center gap-2 font-semibold px-4 py-2.5 rounded-xl transition-all text-sm whitespace-nowrap border ${
                      viewingSupplier.isFavorite
                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        : 'bg-white text-[#0D1F3C] border-gray-200 hover:bg-gray-50'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <svg className="w-4 h-4" fill={viewingSupplier.isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                    {favoriteActionId === viewingSupplier.id
                      ? 'Guardando...'
                      : viewingSupplier.isFavorite
                        ? 'Favorito'
                        : 'Guardar proveedor'}
                  </button>
                  <button
                    type="button"
                    onClick={handleFollowCurrentSupplierCategory}
                    disabled={isSavingAlertSubscription}
                    className="flex items-center gap-2 border border-[#2ECAD5]/30 text-[#0D1F3C] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#2ECAD5]/5 transition-all text-sm whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 3.94c.09-.542.56-.94 1.11-.94h1.1c.55 0 1.02.398 1.11.94l.149.897c.052.313.245.585.52.735.299.163.64.266 1.007.3l.92.085a1.125 1.125 0 01.844 1.79l-.566.777a1.125 1.125 0 00-.182.918c.065.303.098.616.098.934 0 .318-.033.631-.098.934a1.125 1.125 0 00.182.918l.566.777a1.125 1.125 0 01-.844 1.79l-.92.085a2.822 2.822 0 00-1.007.3 1.125 1.125 0 00-.52.735l-.149.897c-.09.542-.56.94-1.11.94h-1.1c-.55 0-1.02-.398-1.11-.94l-.149-.897a1.125 1.125 0 00-.52-.735 2.822 2.822 0 00-1.007-.3l-.92-.085a1.125 1.125 0 01-.844-1.79l.566-.777a1.125 1.125 0 00.182-.918 4.473 4.473 0 010-1.868 1.125 1.125 0 00-.182-.918l-.566-.777a1.125 1.125 0 01.844-1.79l.92-.085c.367-.034.708-.137 1.007-.3.275-.15.468-.422.52-.735l.149-.897z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {isSavingAlertSubscription ? 'Activando...' : 'Seguir precios'}
                  </button>
                  <button
                    onClick={() => {
                      setViewingSupplier(null);
                      openQuoteModal({
                        product: viewingSupplier.requestProductName ?? '',
                        categoryId: viewingSupplier.requestCategoryId ?? '',
                        sourceProductId: viewingSupplier.products?.find((product) => product.name === viewingSupplier.requestProductName)?.id ?? '',
                        sourceSupplierId: viewingSupplier.id,
                        sourceContext: 'supplier_profile',
                      });
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-400/20 text-sm whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Pedir cotizacion
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 space-y-5">
              <div className="rounded-2xl border border-[#2ECAD5]/15 bg-[#f0fdfa] px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#2ECAD5]">Trust layer</div>
                  <p className="text-sm font-semibold text-[#0D1F3C] mt-1">
                    {viewingSupplier.verified
                      ? 'Proveedor validado con reputacion construida desde operaciones aceptadas y reseñas elegibles.'
                      : 'Proveedor visible en Zentra con verificacion comercial todavia en revision.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-semibold bg-white text-[#0D1F3C] border border-[#2ECAD5]/20 px-3 py-1.5 rounded-full">
                    Rating {Number(viewingSupplier.rating || 0).toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold bg-white text-[#0D1F3C] border border-[#2ECAD5]/20 px-3 py-1.5 rounded-full">
                    {viewingSupplier.verified ? 'RUT validado' : 'Revision pendiente'}
                  </span>
                  <span className="text-xs font-semibold bg-white text-[#0D1F3C] border border-[#2ECAD5]/20 px-3 py-1.5 rounded-full">
                    {viewingSupplier.reviews?.length ?? 0} reseñas publicas
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Valoracion', value: viewingSupplier.rating, sub: '/ 5.0', icon: (
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  )},
                  { label: 'Ventas', value: viewingSupplier.totalSales, sub: '', icon: (
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                  )},
                  { label: 'Tasa respuesta', value: viewingSupplier.responseRate, sub: '', icon: (
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )},
                  { label: 'Clientes recurrentes', value: viewingSupplier.recurringClients, sub: '', icon: (
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  )},
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3.5">
                    <div className="flex items-center gap-1.5 mb-1.5">{s.icon}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-extrabold text-[#0D1F3C]">{s.value}</span>
                      {s.sub && <span className="text-[10px] text-gray-400">{s.sub}</span>}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Info + Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <h4 className="text-sm font-bold text-[#0D1F3C] mb-3">Informacion</h4>
                  <div className="space-y-2.5 text-sm">
                    {[
                      { label: 'RUT', value: viewingSupplier.rut },
                      { label: 'Ciudad', value: viewingSupplier.city },
                      { label: 'Direccion', value: viewingSupplier.address },
                      { label: 'Giro', value: viewingSupplier.giro },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                        <span className="text-gray-400 text-xs">{item.label}</span>
                        <span className="font-semibold text-[#0D1F3C] text-xs text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <h4 className="text-sm font-bold text-[#0D1F3C] mb-3">Contacto</h4>
                  <div className="space-y-2.5 text-sm">
                    {[
                      { label: 'Email', value: viewingSupplier.email },
                      { label: 'Telefono', value: viewingSupplier.phone },
                      { label: 'WhatsApp', value: viewingSupplier.whatsapp },
                      { label: 'Web', value: viewingSupplier.website },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                        <span className="text-gray-400 text-xs">{item.label}</span>
                        <span className="font-semibold text-[#0D1F3C] text-xs">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-sm font-bold text-[#0D1F3C] mb-2">Categorias</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingSupplier.categories.map((cat) => (
                    <span key={cat} className="text-xs font-medium bg-[#f0fdfa] text-[#0D1F3C] border border-[#2ECAD5]/20 px-3 py-1.5 rounded-lg">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Products */}
              <div>
                <h4 className="text-sm font-bold text-[#0D1F3C] mb-3">Productos disponibles</h4>
                {viewingSupplier.products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {viewingSupplier.products.map((product) => (
                      <div key={product.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden card-premium">
                        <div className={`h-28 ${product.imageUrls?.[0] ? '' : `bg-gradient-to-br ${product.gradient}`} relative overflow-hidden`}>
                          {product.imageUrls?.[0] ? (
                            <img src={product.imageUrls[0]} alt={product.imageAlt} className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-4xl">{product.emoji}</span>
                            </div>
                          )}
                          {product.status === 'low_stock' && (
                            <span className="absolute top-2 right-2 text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              Stock bajo
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <h5 className="text-xs font-bold text-[#0D1F3C] truncate">{product.name}</h5>
                          <p className="text-[10px] text-gray-400 mt-0.5">{product.category}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-extrabold text-[#0D1F3C]">{product.price}</span>
                            <span className="text-[10px] text-gray-400">{product.stock}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-sm text-gray-400">
                    Este proveedor aun no tiene productos publicados.
                  </div>
                )}
              </div>

              {/* Reviews */}
              <div>
                <h4 className="text-sm font-bold text-[#0D1F3C] mb-3">Resenas</h4>
                {(viewingSupplier.reviews ?? []).length > 0 ? (
                  <div className="space-y-3">
                    {viewingSupplier.reviews.map((review, i) => (
                      <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-lg flex items-center justify-center text-white text-[10px] font-bold">
                              {review.buyer.charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-[#0D1F3C]">{review.buyer}</span>
                          </div>
                          <span className="text-[10px] text-gray-400">{review.date}</span>
                        </div>
                        <div className="flex items-center gap-0.5 mb-1.5 ml-9">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <svg key={j} className={`w-3 h-3 ${j < review.rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed ml-9">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-sm text-gray-400">
                    Aun no hay resenas publicadas para este proveedor.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <QuoteConversationModal
        isOpen={Boolean(activeConversation)}
        onClose={closeConversation}
        conversation={activeConversation}
        messages={conversationMessages}
        currentUserId={currentUser?.id}
        isLoading={conversationLoading}
        isSending={isSendingConversationMessage}
        onSendMessage={handleSendConversationMessage}
        onRefresh={refreshActiveConversation}
      />

      <DashboardPageHeader
        eyebrow="Panel de comprador"
        title={buyerProfile.companyName}
        subtitle={`${buyerProfile.city} / ${buyerProfile.businessType} / RUT ${buyerProfile.rut}`}
        action={{
          onClick: () => openQuoteModal(),
          label: 'Nueva cotizacion',
          className: 'flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-blue-500 hover:shadow-lg hover:shadow-emerald-400/20 text-[#0D1F3C] font-bold px-6 py-3 rounded-xl transition-all whitespace-nowrap hover:scale-[1.02]',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          ),
        }}
        tabs={headerTabs}
        accentBlobClass="bg-indigo-500/5"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ===== CATALOG TAB ===== */}
        {activeTab === 'catalog' && (
          <div className="space-y-6 animate-fade-in">
            {/* Search bar */}
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar productos, insumos, proveedores..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all shadow-sm"
              />
            </div>

            {/* Category filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {catalogFilterOptions.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCatalogFilter(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    catalogFilter === cat
                      ? 'bg-gradient-to-r from-emerald-400 to-blue-500 text-white shadow-md shadow-emerald-400/20'
                      : 'bg-white border border-gray-100 text-gray-500 hover:border-[#2ECAD5]/30 hover:text-[#0D1F3C]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {(() => {
              const relevantAlerts = buyerAlerts.filter((a) => a.productId).slice(0, 5);
              if (relevantAlerts.length === 0) return null;
              return (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0a1628] to-[#0d2040] border border-[#2ECAD5]/20 px-6 py-5">
                  <div className="absolute inset-0 bg-grid opacity-10" />
                  <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#2ECAD5]/5 to-transparent" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-[#2ECAD5] rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#2ECAD5]">Movimientos de mercado en tus seguimientos</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {relevantAlerts.map((alert) => {
                        const isDown = alert.change === 'down';
                        const pct = alert.previousPrice && alert.currentPrice
                          ? Math.abs(((parseFloat(alert.currentPrice.replace(/[^0-9]/g, '')) - parseFloat(alert.previousPrice.replace(/[^0-9]/g, ''))) / parseFloat(alert.previousPrice.replace(/[^0-9]/g, ''))) * 100).toFixed(1)
                          : null;
                        return (
                          <div key={alert.id} className={`rounded-xl border px-4 py-3 flex items-start justify-between gap-3 ${isDown ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-white truncate">{alert.productName}</div>
                              <div className="text-[11px] text-gray-400 mt-0.5 truncate">{alert.supplierName}{alert.categoryName ? ` · ${alert.categoryName}` : ''}</div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-gray-500 line-through">{alert.previousPrice}</span>
                                <span className={`text-sm font-extrabold ${isDown ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {isDown ? '↓' : '↑'} {alert.currentPrice}
                                </span>
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <div className={`text-lg font-black ${isDown ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isDown ? '-' : '+'}{pct}%
                              </div>
                              <div className={`text-[10px] font-semibold mt-0.5 ${isDown ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {isDown ? 'Bajó' : 'Subió'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {showRecommendedCatalog && recommendedCatalogProducts.length > 0 && (
              <section className="bg-gradient-to-br from-[#0D1F3C] to-[#102746] rounded-3xl p-4 sm:p-6 text-white overflow-hidden relative">
                <div className="absolute inset-0 bg-grid opacity-20" />
                <div className="relative z-10">
                  <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
                    <div>
                      <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#2ECAD5]">
                        Para ti
                      </span>
                      <h2 className="text-xl sm:text-2xl font-extrabold mt-2">Sugerencias basadas en tu actividad</h2>
                      <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl">
                        Priorizamos Solicitudes de Cotización previas, busquedas recientes, proveedores guardados y senales comerciales.
                        La cercania geografica quedara para una fase posterior cuando tengamos direccion confirmada en mapa y coordenadas.
                      </p>
                    </div>
                    {recentSearchTerms.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {recentSearchTerms.slice(0, 3).map((term) => (
                          <span key={term} className="text-[11px] font-semibold bg-white/10 border border-white/10 px-3 py-1.5 rounded-full">
                            {term}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory xl:grid xl:grid-cols-4 xl:overflow-visible xl:pb-0">
                    {recommendedCatalogProducts.map((product) => (
                      <div
                        key={product.id}
                        className="snap-start flex-shrink-0 w-[68vw] sm:w-[44vw] xl:w-auto"
                      >
                        {renderCatalogProductCard(product, { showRecommendationMeta: true })}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Product grid */}
            {(() => {
              if (catalogLoading) {
                return (
                  <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
                    Cargando catalogo...
                  </div>
                );
              }

              return catalogGridProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {catalogGridProducts.map((product) => renderCatalogProductCard(product))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-[#f8fafc] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-400">No se encontraron productos</p>
                  <p className="text-xs text-gray-300 mt-1">Prueba con otra busqueda o categoria</p>
                </div>
              );
            })()}
          </div>
        )}

        {/* ===== PROFILE TAB ===== */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            {/* Profile header card */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden card-premium">
              {/* Cover / banner */}
              <div className="h-32 bg-gradient-to-r from-[#0D1F3C] via-[#1a3260] to-[#0D1F3C] relative">
                <div className="absolute inset-0 bg-grid opacity-20" />
                <div className="absolute top-4 right-4 w-40 h-40 bg-indigo-500/10 rounded-full blur-[60px]" />
              </div>
              <div className="px-6 pb-6 relative">
                {/* Avatar */}
                <label className="w-24 h-24 rounded-2xl -mt-12 relative z-10 cursor-pointer group block">
                  {currentUser?.avatar_url
                    ? <img src={currentUser.avatar_url} alt="Avatar" className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg" />
                    : <div className="w-24 h-24 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-2xl flex items-center justify-center text-[#2ECAD5] text-3xl font-extrabold border-4 border-white shadow-lg">{buyerProfile.initials}</div>
                  }
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
                <div className="mt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#0D1F3C]">{buyerProfile.companyName}</h2>
                    <p className="text-gray-500 text-sm mt-1">{buyerProfile.description}</p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      {buyerProfile.categories.map((cat) => (
                        <span key={cat} className="text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1 rounded-full">{cat}</span>
                      ))}
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${currentUser?.verified ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${currentUser?.verified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {currentUser?.verified ? 'Verificado' : 'En revision'}
                      </span>
                      {memberSinceLabel && <span className="text-xs text-gray-400">Miembro desde {memberSinceLabel}</span>}
                    </div>
                  </div>
                  <button
                    onClick={openEditProfile}
                    className="flex items-center gap-2 border border-gray-200 text-gray-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Editar perfil
                  </button>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Solicitudes de Cotización', value: buyerStats.totalOrders || buyerQuotes.length, sub: 'totales', items: buyerQuotes.map(q => ({ label: q.productName, value: q.statusLabel, sub: `${q.quantityLabel} · ${q.createdAtLabel}` })), emptyText: 'Sin cotizaciones aun', icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                )},
                { label: 'Proveedores favoritos', value: favoriteSuppliers.length, sub: 'guardados', items: favoriteSuppliers.map(s => ({ label: s.companyName || s.name || 'Proveedor', sub: s.city || '' })), emptyText: 'No tienes favoritos guardados', icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                )},
                { label: 'Ofertas aceptadas', value: acceptedOffers.length, sub: 'cerradas', items: acceptedOffers.map(o => ({ label: o.quoteProductName, value: o.priceLabel, sub: `${o.supplierName} · ${o.quoteQuantityLabel}` })), emptyText: 'Sin ofertas aceptadas aun', icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m6 2.25a9 9 0 11-18 0 9 9 0 0118 0Z" />
                  </svg>
                )},
                { label: 'Valoracion como comprador', value: Number(buyerStats.rating || 0).toFixed(1), sub: '/ 5.0', items: [], emptyText: 'Aun no tienes valoraciones', icon: (
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )},
              ].map((s) => (
                <button key={s.label} type="button" onClick={() => setStatDetail({ title: s.label, value: `${s.value}${s.sub ? ' ' + s.sub : ''}`, items: s.items, emptyText: s.emptyText })} className="bg-white rounded-2xl border border-gray-100 p-5 card-premium text-left hover:border-[#2ECAD5]/40 hover:shadow-md transition-all group">
                  <div className="w-9 h-9 bg-[#f8fafc] rounded-xl flex items-center justify-center text-gray-400 mb-3 group-hover:bg-[#2ECAD5]/10 group-hover:text-[#2ECAD5] transition-colors">
                    {s.icon}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-[#0D1F3C]">{s.value}</span>
                    <span className="text-xs text-gray-400">{s.sub}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Business info */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 card-premium">
                <h3 className="text-lg font-extrabold text-[#0D1F3C] mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                  </svg>
                  Informacion del negocio
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Razon social', value: buyerProfile.companyName },
                    { label: 'RUT', value: buyerProfile.rut },
                    { label: 'Ciudad', value: buyerProfile.city },
                    { label: 'Direccion', value: buyerProfile.address },
                    { label: 'Tipo de negocio', value: buyerProfile.businessType },
                    { label: 'Volumen mensual', value: buyerProfile.monthlyVolume },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-400">{item.label}</span>
                      <span className="text-sm font-semibold text-[#0D1F3C]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact info */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 card-premium">
                <h3 className="text-lg font-extrabold text-[#0D1F3C] mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  Contacto
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Email', value: buyerProfile.email, icon: (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    )},
                    { label: 'Telefono', value: buyerProfile.phone, icon: (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    )},
                    { label: 'WhatsApp', value: buyerProfile.whatsapp, icon: (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                    )},
                    { label: 'Medio preferido', value: buyerProfile.contactMethod, icon: (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a3.375 3.375 0 116.75 0c0 1.5-.944 2.779-2.268 3.28-.525.199-.857.722-.857 1.284v.436M12 18.75h.008v.008H12v-.008z" />
                      </svg>
                    )},
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      {item.icon}
                      <div className="flex-1">
                        <span className="text-xs text-gray-400 block">{item.label}</span>
                        <span className="text-sm font-semibold text-[#0D1F3C]">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {buyerProfile.frequentProducts.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 card-premium">
                <h3 className="text-lg font-extrabold text-[#0D1F3C] mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                  </svg>
                  Productos que compro frecuentemente
                </h3>
                <div className="flex flex-wrap gap-2">
                  {buyerProfile.frequentProducts.map((prod) => (
                    <span key={prod} className="text-sm font-medium bg-[#f0fdfa] text-[#0D1F3C] border border-[#2ECAD5]/20 px-4 py-2 rounded-xl">
                      {prod}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Accepted offers summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 card-premium">
              <h3 className="text-lg font-extrabold text-[#0D1F3C] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m6 2.25a9 9 0 11-18 0 9 9 0 0118 0Z" />
                </svg>
                Ofertas aceptadas recientemente
              </h3>
              {acceptedOffers.length > 0 ? (
                <div className="space-y-3">
                  {acceptedOffers.slice(0, 5).map((offer) => (
                    <div key={offer.id} className="flex items-center gap-4 p-4 bg-[#f8fafc] rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400/15 to-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#0D1F3C]">{offer.quoteProductName}</p>
                        <p className="text-xs text-gray-400">
                          {offer.supplierName} / {offer.quoteQuantityLabel} / Entrega {offer.quoteDeliveryDateLabel}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[#0D1F3C]">{offer.priceLabel}</p>
                        <div className="flex flex-col items-end gap-2 mt-1">
                          <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">
                            Aceptada
                          </span>
                          {reviewOpportunityMap.has(offer.id) && (
                            <button
                              type="button"
                              onClick={() => openReviewModal(reviewOpportunityMap.get(offer.id))}
                              className="text-[11px] font-semibold text-[#2ECAD5] border border-[#2ECAD5]/30 hover:bg-[#2ECAD5]/5 px-3 py-1.5 rounded-lg transition-all"
                            >
                              Dejar reseña
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#f8fafc] rounded-xl p-6 text-center text-sm text-gray-400">
                  Aun no aceptas ofertas. Cuando cierres tu primera Solicitud de Cotización, aparecerá aqui.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== DASHBOARD TAB ===== */}
        {activeTab === 'dashboard' && dashboardTabContent}

        {/* ===== ALERTS TAB ===== */}
        {activeTab === 'alerts' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
              <form onSubmit={handleCreateAlertSubscription} className="bg-white rounded-2xl border border-gray-100 p-6 card-premium space-y-5">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0D1F3C]">Seguir alertas de precio</h2>
                  <p className="text-sm text-gray-400 mt-1">Recibe cambios de precio por categoria o por producto especifico.</p>
                </div>

                <div className="flex gap-2">
                  {[
                    { id: 'category', label: 'Por categoria' },
                    { id: 'product', label: 'Por producto' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setAlertForm({
                        mode: option.id,
                        categoryId: option.id === 'category' ? alertForm.categoryId : '',
                        productId: option.id === 'product' ? alertForm.productId : '',
                      })}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        alertForm.mode === option.id
                          ? 'bg-gradient-to-r from-emerald-400 to-blue-500 text-white shadow-md shadow-emerald-400/20'
                          : 'bg-[#f8fafc] text-gray-500 hover:text-[#0D1F3C]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {alertForm.mode === 'category' ? (
                  <div>
                    <label htmlFor="buyer-alert-category" className="block text-sm font-medium text-gray-700 mb-1.5">Categoria</label>
                    <select
                      id="buyer-alert-category"
                      value={alertForm.categoryId}
                      onChange={(event) => setAlertForm({ ...alertForm, categoryId: event.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] bg-white transition-all"
                    >
                      <option value="">Selecciona una categoria</option>
                      {categoryOptions.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="buyer-alert-product" className="block text-sm font-medium text-gray-700 mb-1.5">Producto</label>
                    <select
                      id="buyer-alert-product"
                      value={alertForm.productId}
                      onChange={(event) => setAlertForm({ ...alertForm, productId: event.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] bg-white transition-all"
                    >
                      <option value="">Selecciona un producto</option>
                      {alertProductOptions.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} / {product.category} / {product.supplierName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSavingAlertSubscription || (alertForm.mode === 'category' ? !alertForm.categoryId : !alertForm.productId)}
                  className="bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold px-5 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-400/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingAlertSubscription ? 'Guardando...' : 'Guardar alerta'}
                </button>
              </form>

              <div className="bg-white rounded-2xl border border-gray-100 p-6 card-premium">
                <h2 className="text-xl font-extrabold text-[#0D1F3C]">Seguimientos Activos</h2>
                <p className="text-sm text-gray-400 mt-1 mb-5">Controla que señales de precio quieres seguir.</p>
                {alertSubscriptions.length > 0 ? (
                  <div className="space-y-3">
                    {alertSubscriptions.map((subscription) => {
                      const category = takeSingle(subscription.categories);
                      const product = takeSingle(subscription.products);
                      const productCategory = takeSingle(product?.categories);
                      const title = product?.name ?? category?.name ?? 'Alerta';
                      const meta = product
                        ? `Producto / ${productCategory?.name ?? 'Sin categoria'}`
                        : 'Categoria';

                      return (
                        <div key={subscription.id} className="rounded-xl border border-gray-100 bg-[#f8fafc] px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-bold text-[#0D1F3C]">{title}</div>
                              <div className="text-xs text-gray-400 mt-1">{meta}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAlertSubscription(subscription.id)}
                              disabled={subscriptionActionId === subscription.id}
                              className="text-xs font-semibold text-rose-600 border border-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {subscriptionActionId === subscription.id ? 'Quitando...' : 'Quitar'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-[#f8fafc] rounded-xl p-6 text-center text-sm text-gray-400">
                    Aun no sigues alertas. Crea tu primera suscripcion desde esta misma vista.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-[#0D1F3C] mb-4">Cambios recientes de precio</h2>
              {alertsLoading ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
                  Cargando alertas...
                </div>
              ) : buyerAlerts.length > 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {buyerAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center gap-4 p-5 hover:bg-[#f8fafc] transition-colors">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        alert.change === 'down' ? 'bg-emerald-50' : 'bg-red-50'
                      }`}>
                        {alert.change === 'down' ? (
                          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#0D1F3C] text-sm">{alert.productName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {alert.supplierName} / {alert.categoryName} / {alert.previousPrice} → {alert.currentPrice}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">{alert.dateLabel}</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 ${
                        alert.change === 'down' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {alert.changeLabel}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                  <h3 className="text-lg font-bold text-[#0D1F3C]">Todavia no hay cambios de precio para tus alertas</h3>
                  <p className="text-sm text-gray-400 mt-2">Las alertas apareceran cuando un proveedor actualice el precio de un producto o categoria que sigues.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== FAVORITES TAB ===== */}
        {activeTab === 'favorites' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-xl font-extrabold text-[#0D1F3C] mb-4">Proveedores favoritos</h2>
              {favoritesLoading ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
                  Cargando favoritos...
                </div>
              ) : favoriteSuppliers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteSuppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="bg-white rounded-2xl border border-gray-100 p-5 card-premium text-left transition-all hover:border-[#2ECAD5]/30 hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-xl flex items-center justify-center text-[#2ECAD5] flex-shrink-0 text-sm font-bold">
                          {supplier.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[#0D1F3C] text-sm">{supplier.name}</p>
                          <p className="text-xs text-gray-500 truncate">{supplier.description || 'Proveedor B2B'}</p>
                          <p className="text-xs text-gray-400 mt-1">{supplier.city}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {supplier.categories.slice(0, 3).map((category) => (
                          <span key={category} className="text-[10px] font-semibold bg-[#f0fdfa] text-[#0D1F3C] border border-[#2ECAD5]/20 px-2.5 py-1 rounded-full">
                            {category}
                          </span>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-50">
                        <div>
                          <div className="text-[10px] text-gray-400">Plan</div>
                          <div className="text-xs font-bold text-[#0D1F3C] mt-1">{supplier.plan}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400">Productos</div>
                          <div className="text-xs font-bold text-[#0D1F3C] mt-1">{supplier.productCount}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400">Respuesta</div>
                          <div className="text-xs font-bold text-[#0D1F3C] mt-1">{supplier.responseRate}%</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                        <span className="text-[10px] text-gray-400">Guardado {supplier.savedAtLabel}</span>
                        {supplier.verified && (
                          <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            Verificado
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() => openSupplierProfile(supplier.id)}
                          className="flex-1 text-sm text-[#2ECAD5] border border-[#2ECAD5]/30 hover:bg-[#2ECAD5]/5 font-semibold py-2.5 rounded-xl transition-all"
                        >
                          Ver perfil
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(supplier.id)}
                          disabled={favoriteActionId === supplier.id}
                          className="px-4 text-sm text-rose-600 border border-rose-200 hover:bg-rose-50 font-semibold py-2.5 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {favoriteActionId === supplier.id ? '...' : 'Quitar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                  <h3 className="text-lg font-bold text-[#0D1F3C]">Aun no guardas proveedores favoritos</h3>
                  <p className="text-sm text-gray-400 mt-2">Explora el catalogo, abre perfiles y guarda los proveedores con los que quieres trabajar recurrentemente.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('catalog')}
                    className="mt-5 bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold px-5 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-400/20"
                  >
                    Ir al catalogo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
