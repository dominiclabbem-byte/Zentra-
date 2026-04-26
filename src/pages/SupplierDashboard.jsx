import { useState, useCallback, useEffect, useMemo } from 'react';
import { CheckCircle2, Package, Sparkles, UploadCloud } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import StatDetailModal from '../components/StatDetailModal';
import QuoteConversationModal from '../components/QuoteConversationModal';
import DashboardPageHeader from '../components/DashboardPageHeader';
import ProductImageCarousel from '../components/ProductImageCarousel';
import { useAuth } from '../context/AuthContext';
import {
  buildBuyerProfileView,
  buildSupplierProfileView,
  formatMemberSince,
  getPlanKey,
  normalizeUserRecord,
} from '../lib/profileAdapters';
import {
  PRODUCT_GRADIENTS as productGradients,
  buildProductFormFromCard,
  createEmptyProductForm,
  deriveProductStatus,
  mapProductRecordToCard,
} from '../lib/productAdapters';
import {
  EDITABLE_OFFER_PIPELINE_OPTIONS,
  mapQuoteOfferRecord,
  mapQuoteRequestRecord,
} from '../lib/quoteAdapters';
import {
  buildSupplierBuyerRelationships,
  buildSupplierWorkspaceSummary,
} from '../lib/supplierWorkspaceAdapters';
import { getSupplierEntitlements } from '../lib/planEntitlements';
import {
  createProduct,
  createReview,
  deleteProduct,
  ensureQuoteConversationForSupplier,
  getBuyerProfile,
  getBuyerStats,
  getOffersForSupplier,
  getQuoteConversationById,
  getQuoteConversationForQuote,
  getQuoteConversationMessages,
  getRelevantQuoteRequestsForSupplier,
  getProducts,
  getReviewsForUser,
  getSupplierReviewOpportunities,
  getSupplierStats,
  getSupplierUsageSummary,
  markQuoteConversationRead,
  sendQuoteConversationMessage,
  submitOffer,
  updateProduct,
  updateOfferPipelineStatus,
  uploadAvatar,
} from '../services/database';
import { generateProductImage } from '../services/imageGenerator';
import { mapQuoteConversationMessageRecord, mapQuoteConversationRecord } from '../lib/conversationAdapters';

const initialProfile = {
  companyName: 'Valle Frio SpA',
  description: 'Distribuidor mayorista de insumos alimentarios',
  rut: '76.234.567-8',
  city: 'Santiago, Chile',
  address: 'Av. Providencia 1234, Of. 501',
  giro: 'Distribucion mayorista de alimentos e insumos para la industria gastronomica',
  email: 'ventas@vallefrio.cl',
  phone: '+56 2 2345 6789',
  whatsapp: '+56 9 8765 4321',
  website: 'www.vallefrio.cl',
  categories: ['Congelados IQF', 'Lacteos', 'Carnes y cecinas'],
};

function normalizeSupplierDashboardTab(tab) {
  return ['agents', 'plan'].includes(tab) ? 'quotes' : tab;
}

export default function SupplierDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentUser,
    categories: categoryOptions,
    notifications = [],
    plans,
    saveSupplierProfile,
    refreshCurrentUser,
  } = useAuth();
  const defaultProductCategory = categoryOptions[0]?.name ?? 'Otros';
  const liveProfile = currentUser ? buildSupplierProfileView(currentUser) : initialProfile;
  const profile = liveProfile;
  const currentPlanKey = getPlanKey(currentUser) ?? 'starter';
  const memberSinceLabel = formatMemberSince(currentUser?.created_at);
  const unreadSupplierQuoteNotifications = useMemo(
    () => notifications.filter((notification) => (
      !notification.read_at
      && ['rfq_created', 'offer_accepted', 'rfq_cancelled', 'message_received'].includes(notification.type)
    )).length,
    [notifications],
  );
  const [toast, setToast] = useState(null);

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
  const [quoteModal, setQuoteModal] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [isSendingConversationMessage, setIsSendingConversationMessage] = useState(false);
  const [offerForm, setOfferForm] = useState({ price: '', notes: '', estimatedLeadTime: '' });
  const [activeTab, setActiveTab] = useState(() => normalizeSupplierDashboardTab(location.state?.activeTab ?? 'quotes'));
  const [productDetail, setProductDetail] = useState(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState(initialProfile);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [viewingBuyer, setViewingBuyer] = useState(null);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState(createEmptyProductForm(defaultProductCategory));
  const [imageMode, setImageMode] = useState('upload');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [openQuotes, setOpenQuotes] = useState([]);
  const [supplierOffers, setSupplierOffers] = useState([]);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [isUpdatingOfferId, setIsUpdatingOfferId] = useState('');
  const [loadingBuyerId, setLoadingBuyerId] = useState('');
  const [supplierStats, setSupplierStats] = useState({ rating: 0, totalSales: 0, recurringClients: 0, totalReviews: 0 });
  const [supplierReviews, setSupplierReviews] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [statDetail, setStatDetail] = useState(null);
  const [usageSummary, setUsageSummary] = useState({
    activeProducts: 0,
    quoteResponsesThisMonth: 0,
    aiConversationsThisMonth: 0,
    voiceCallsThisMonth: 0,
  });
  const [usageLoading, setUsageLoading] = useState(false);
  const [highlightedQuoteId, setHighlightedQuoteId] = useState('');
  const [highlightedOfferId, setHighlightedOfferId] = useState('');
  const [supplierReviewOpportunities, setSupplierReviewOpportunities] = useState([]);
  const [supplierReviewForm, setSupplierReviewForm] = useState({
    quoteOfferId: '',
    reviewedId: '',
    buyerName: '',
    productName: '',
    rating: 5,
    comment: '',
  });
  const [isSubmittingSupplierReview, setIsSubmittingSupplierReview] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!currentUser?.id) return;

    setProductsLoading(true);

    try {
      const data = await getProducts({ supplierId: currentUser.id, includeAllStatuses: true });
      setProducts(data.map((product) => mapProductRecordToCard(product)));
    } catch (error) {
      setToast({ message: error.message || 'No se pudo cargar el catalogo.', type: 'error' });
    } finally {
      setProductsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!highlightedQuoteId && !highlightedOfferId) return undefined;

    const timeout = window.setTimeout(() => {
      setHighlightedQuoteId('');
      setHighlightedOfferId('');
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [highlightedOfferId, highlightedQuoteId]);

  const handleProductImage = (e) => {
    if (productForm.imagePreviews.length >= 4) {
      setToast({ message: 'Has alcanzado el límite de 4 imágenes por producto', type: 'error' });
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Solo se permiten archivos de imagen', type: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'La imagen no puede superar 5MB', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProductForm((prev) => ({
        ...prev,
        images: [...prev.images, file],
        imagePreviews: [...prev.imagePreviews, ev.target.result]
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeProductImage = (index) => {
    setProductForm((prev) => {
      const newPreviews = [...prev.imagePreviews];
      newPreviews.splice(index, 1);
      return { ...prev, imagePreviews: newPreviews };
    });
  };

  const handleGenerateImage = async () => {
    if (productForm.imagePreviews.length >= 4) {
      setToast({ message: 'Has alcanzado el limite de 4 imagenes por producto', type: 'error' });
      return;
    }

    const prompt = aiPrompt.trim() || [productForm.name, productForm.category, productForm.description]
      .filter(Boolean)
      .join(', ');

    if (!prompt) {
      setToast({ message: 'Describe el producto antes de generar una imagen.', type: 'error' });
      return;
    }

    setAiLoading(true);

    try {
      const imageUrl = await generateProductImage(prompt);
      setProductForm((prev) => ({
        ...prev,
        imagePreviews: [...prev.imagePreviews, imageUrl],
      }));
      setAiPrompt('');
      setToast({ message: 'Imagen generada correctamente.', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'No se pudo generar la imagen.', type: 'error' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    if (!currentUser?.id) return;
    if (!editingProductId && !entitlements.canCreateProduct) {
      setToast({ message: 'Se alcanzo el limite operativo de productos activos.', type: 'error' });
      return;
    }

    const categoryRecord = categoryOptions.find((category) => category.name === productForm.category);

    if (!categoryRecord) {
      setToast({ message: 'Selecciona una categoria valida.', type: 'error' });
      return;
    }

    const CATEGORY_KEYWORDS = {
      'Frutas y verduras': ['palta', 'avocado', 'tomate', 'lechuga', 'zanahoria', 'cebolla', 'ajo', 'pepino', 'pimiento', 'pera', 'manzana', 'naranja', 'limon', 'frutilla', 'uva', 'sandia', 'melon', 'durazno', 'ciruela', 'kiwi', 'platano', 'banana', 'frambuesa', 'arandano', 'papaya', 'mango', 'piña', 'ananas', 'brocoli', 'coliflor', 'espinaca', 'acelga', 'repollo', 'zapallo', 'calabaza', 'betarraga', 'apio', 'puerro', 'espárrago', 'esparrago', 'choclo', 'maiz fresco', 'poroto verde', 'arveja fresca', 'champiñon', 'champinon', 'hongos', 'perejil', 'cilantro', 'albahaca', 'menta'],
      'Carnes y cecinas': ['pollo', 'vacuno', 'cerdo', 'cordero', 'pavo', 'jamon', 'salchicha', 'longaniza', 'chorizo', 'mortadela', 'filete', 'lomo', 'costilla', 'paleta', 'pechuga', 'muslo', 'carne', 'asado', 'osobuco', 'plateada', 'malaya', 'tocino', 'panceta', 'salame', 'salami', 'prieta', 'morcilla', 'chicharron', 'res', 'bife', 'matambre'],
      'Lacteos': ['leche', 'queso', 'yogurt', 'yogur', 'mantequilla', 'crema', 'nata', 'quesillo', 'ricota', 'ricotta', 'mozzarella', 'gouda', 'cheddar', 'camembert', 'brie', 'mantecoso', 'chanco', 'gauda', 'suero', 'kefir', 'butter'],
      'Harinas y cereales': ['harina', 'arroz', 'avena', 'semola', 'trigo', 'cebada', 'maiz', 'quinoa', 'amaranto', 'centeno', 'mijo', 'salvado', 'granola', 'muesli', 'corn flakes', 'cereal', 'polenta', 'cuscus', 'cous cous'],
      'Aceites y grasas': ['aceite', 'manteca', 'margarina', 'oliva', 'canola', 'girasol', 'maravilla', 'vegetal', 'ghee', 'coco oil', 'aceite de coco'],
      'Abarrotes': ['azucar', 'sal', 'vinagre', 'salsa', 'conserva', 'pasta', 'fideos', 'tallarines', 'spaghetti', 'macarron', 'pure de tomate', 'tomate en lata', 'atun', 'sardina', 'mermelada', 'miel', 'cafe', 'te', 'yerba', 'chocolate', 'cacao', 'vainilla', 'polvo de hornear', 'levadura', 'bicarbonato', 'gelatina', 'almidón', 'almidon', 'maicena', 'galleta', 'crackers'],
      'Especias y condimentos': ['oregano', 'comino', 'pimienta', 'paprika', 'curry', 'mostaza', 'ketchup', 'mayonesa', 'aji', 'merkén', 'merken', 'curcuma', 'canela', 'clavo', 'nuez moscada', 'laurel', 'tomillo', 'romero', 'estragón', 'estragon', 'cardamomo', 'anís', 'anis', 'hinojo', 'jengibre', 'condimento', 'aliño', 'aliño'],
      'Frutos secos': ['nuez', 'almendra', 'mani', 'maní', 'pistache', 'pistacho', 'anacardo', 'castaña', 'castana', 'macadamia', 'pecan', 'nogal', 'avellana', 'pine nut', 'pinon', 'semilla', 'chia', 'linaza', 'sesamo', 'pepita'],
      'Legumbres': ['lenteja', 'garbanzo', 'poroto', 'arveja', 'haba', 'soja', 'soya', 'frijol', 'chicharo', 'lupino', 'lupino'],
      'Congelados IQF': ['congelado', 'iqf', 'frozen', 'precocido', 'nugget', 'croqueta', 'empanado', 'rebozado'],
    };

    const productNameNormalized = productForm.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const selectedCategoryName = categoryRecord.name;

    for (const [correctCategory, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (correctCategory === selectedCategoryName) continue;
      const matched = keywords.find((kw) => {
        const kwNormalized = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        return new RegExp(`\\b${kwNormalized}\\b`).test(productNameNormalized);
      });
      if (matched) {
        setToast({
          message: `"${productForm.name}" parece pertenecer a la categoría "${correctCategory}", no a "${selectedCategoryName}". Por favor verifica la categoría antes de publicar.`,
          type: 'error',
        });
        return;
      }
    }

    const payload = {
      supplier_id: currentUser.id,
      category_id: categoryRecord.id,
      name: productForm.name,
      description: productForm.description,
      price: Number(productForm.price),
      price_unit: productForm.priceUnit,
      stock: Number(productForm.stock),
      stock_unit: productForm.stockUnit,
      status: deriveProductStatus(productForm.stock),
      image_url: productForm.imagePreviews?.[0] || null,
      image_urls: productForm.imagePreviews || [],
    };

    setIsSavingProduct(true);

    try {
      const savedRecord = editingProductId
        ? await updateProduct(editingProductId, payload)
        : await createProduct(payload);

      const mappedProduct = mapProductRecordToCard({
        ...savedRecord,
        categories: categoryRecord,
        users: { company_name: profile.companyName },
      });

      setProducts((currentProducts) => (
        editingProductId
          ? currentProducts.map((product) => product.id === mappedProduct.id ? mappedProduct : product)
          : [mappedProduct, ...currentProducts]
      ));
      setAddProductOpen(false);
      setEditingProductId(null);
      setProductForm(createEmptyProductForm(defaultProductCategory));
      setImageMode('upload');
      setAiPrompt('');
      await refreshUsageSummary();
      setToast({
        message: editingProductId
          ? `Producto "${mappedProduct.name}" actualizado`
          : `Producto "${mappedProduct.name}" agregado exitosamente`,
        type: 'success',
      });
    } catch (error) {
      setToast({ message: error.message || 'No se pudo guardar el producto.', type: 'error' });
    } finally {
      setIsSavingProduct(false);
    }
  };
  const loadQuotesData = useCallback(async () => {
    if (!currentUser?.id) {
      setOpenQuotes([]);
      setSupplierOffers([]);
      return { openQuoteRows: [], supplierOfferRows: [] };
    }

    setQuotesLoading(true);

    try {
      const [openQuoteRows, supplierOfferRows] = await Promise.all([
        getRelevantQuoteRequestsForSupplier(currentUser.id),
        getOffersForSupplier(currentUser.id),
      ]);

      setOpenQuotes(openQuoteRows.map((quote) => mapQuoteRequestRecord(quote)));
      setSupplierOffers(supplierOfferRows.map((offer) => mapQuoteOfferRecord(offer)));
      return { openQuoteRows, supplierOfferRows };
    } catch (error) {
      setToast({ message: error.message || 'No se pudieron cargar las cotizaciones.', type: 'error' });
      return { openQuoteRows: [], supplierOfferRows: [] };
    } finally {
      setQuotesLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadQuotesData();
  }, [loadQuotesData]);

  useEffect(() => {
    if (!location.state?.activeTab && !location.state?.focusQuoteId && !location.state?.focusOfferId && !location.state?.focusConversationId) {
      return;
    }

    let cancelled = false;

    async function applyNotificationState() {
      if (location.state?.activeTab) {
        setActiveTab(normalizeSupplierDashboardTab(location.state.activeTab));
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

        if (targetConversationId) {
          const conversationRecord = await getQuoteConversationById(targetConversationId);
          if (cancelled) return;
          resolvedQuoteId = conversationRecord?.quote_request_id ?? resolvedQuoteId;
        }

        const { openQuoteRows, supplierOfferRows } = await loadQuotesData();
        if (cancelled) return;

        const mappedOpenQuotes = openQuoteRows.map((quote) => mapQuoteRequestRecord(quote));
        const mappedOffers = supplierOfferRows.map((offer) => mapQuoteOfferRecord(offer));

        const matchingOpenQuote = mappedOpenQuotes.find((quote) => quote.id === resolvedQuoteId);
        const matchingOffer = mappedOffers.find((offer) => (
          offer.id === targetOfferId
          || (resolvedQuoteId && offer.quoteId === resolvedQuoteId)
        ));

        if (targetConversationId) {
          if (matchingOffer) {
            setHighlightedOfferId(matchingOffer.id);
          } else if (matchingOpenQuote) {
            setHighlightedQuoteId(matchingOpenQuote.id);
          }
          await loadConversationForSupplier({ conversationId: targetConversationId });
        } else if (matchingOpenQuote) {
          setHighlightedQuoteId(matchingOpenQuote.id);
          openQuoteOfferModal(matchingOpenQuote);
        } else if (matchingOffer) {
          setHighlightedOfferId(matchingOffer.id);
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
  }, [loadQuotesData, location.pathname, location.state, navigate]);

  const loadSupplierInsights = useCallback(async () => {
    if (!currentUser?.id) {
      setSupplierStats({ rating: 0, totalSales: 0, recurringClients: 0, totalReviews: 0 });
      setSupplierReviews([]);
      setSupplierReviewOpportunities([]);
      return;
    }

    setInsightsLoading(true);

    try {
      const [stats, reviews, reviewOpps] = await Promise.all([
        getSupplierStats(currentUser.id),
        getReviewsForUser(currentUser.id),
        getSupplierReviewOpportunities(currentUser.id),
      ]);

      setSupplierStats(stats);
      setSupplierReviews(reviews ?? []);
      setSupplierReviewOpportunities(reviewOpps ?? []);
    } catch (error) {
      setToast({ message: error.message || 'No se pudieron cargar los insights del proveedor.', type: 'error' });
    } finally {
      setInsightsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadSupplierInsights();
  }, [loadSupplierInsights]);

  const refreshUsageSummary = useCallback(async () => {
    if (!currentUser?.id) {
      setUsageSummary({
        activeProducts: 0,
        quoteResponsesThisMonth: 0,
        aiConversationsThisMonth: 0,
        voiceCallsThisMonth: 0,
      });
      return;
    }

    setUsageLoading(true);

    try {
      const usage = await getSupplierUsageSummary(currentUser.id);
      setUsageSummary(usage);
    } catch (error) {
      setToast({ message: error.message || 'No se pudo cargar el uso del plan.', type: 'error' });
    } finally {
      setUsageLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    refreshUsageSummary();
  }, [refreshUsageSummary]);

  const openEditProfile = () => {
    setProfileForm({ ...profile });
    setSelectedCategoryId('');
    setEditProfileOpen(true);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();

    try {
      const categoryIds = categoryOptions
        .filter((category) => profileForm.categories.includes(category.name))
        .map((category) => category.id);

      const updatedUser = await saveSupplierProfile({
        companyName: profileForm.companyName,
        rut: profileForm.rut,
        city: profileForm.city,
        address: profileForm.address,
        description: profileForm.description,
        giro: profileForm.giro,
        phone: profileForm.phone,
        whatsapp: profileForm.whatsapp,
        website: profileForm.website,
        categoryIds,
      });

      const nextProfile = buildSupplierProfileView(updatedUser);
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

  const openAddProductModal = () => {
    if (!entitlements.canCreateProduct) {
      setToast({ message: 'Se alcanzo el limite operativo de productos activos.', type: 'error' });
      return;
    }

    setEditingProductId(null);
    setProductForm(createEmptyProductForm(defaultProductCategory));
    setImageMode('upload');
    setAiPrompt('');
    setAddProductOpen(true);
  };

  const openEditProductModal = (product) => {
    setEditingProductId(product.id);
    setProductForm(buildProductFormFromCard(product));
    setImageMode('upload');
    setAiPrompt('');
    setProductDetail(null);
    setAddProductOpen(true);
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`¿Eliminar "${product.name}"?`)) {
      return;
    }

    try {
      await deleteProduct(product.id);
      setProducts((currentProducts) => currentProducts.filter((item) => item.id !== product.id));
      await refreshUsageSummary();
      setToast({ message: `"${product.name}" eliminado`, type: 'success' });
      if (productDetail?.id === product.id) {
        setProductDetail(null);
      }
    } catch (error) {
      setToast({ message: error.message || 'No se pudo eliminar el producto.', type: 'error' });
    }
  };

  const openSupplierReviewModal = useCallback((opportunity) => {
    setSupplierReviewForm({
      quoteOfferId: opportunity.quoteOfferId,
      reviewedId: opportunity.reviewedId,
      buyerName: opportunity.buyerName,
      productName: opportunity.productName,
      rating: 5,
      comment: '',
    });
  }, []);

  const closeSupplierReviewModal = useCallback(() => {
    setSupplierReviewForm({
      quoteOfferId: '',
      reviewedId: '',
      buyerName: '',
      productName: '',
      rating: 5,
      comment: '',
    });
  }, []);

  const handleSupplierReviewSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser?.id || !supplierReviewForm.quoteOfferId || !supplierReviewForm.reviewedId) {
      setToast({ message: 'No se pudo preparar la reseña.', type: 'error' });
      return;
    }

    setIsSubmittingSupplierReview(true);

    try {
      await createReview({
        reviewerId: currentUser.id,
        reviewedId: supplierReviewForm.reviewedId,
        quoteOfferId: supplierReviewForm.quoteOfferId,
        rating: Number(supplierReviewForm.rating),
        comment: supplierReviewForm.comment.trim(),
      });
      await loadSupplierInsights();
      closeSupplierReviewModal();
      setToast({ message: `Reseña publicada para ${supplierReviewForm.buyerName}.`, type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'No se pudo publicar la reseña.', type: 'error' });
    } finally {
      setIsSubmittingSupplierReview(false);
    }
  };

  const openQuoteOfferModal = (quote) => {
    setOfferForm({ price: '', notes: '', estimatedLeadTime: '' });
    setQuoteModal(quote);
  };

  const closeQuoteOfferModal = () => {
    setQuoteModal(null);
    setOfferForm({ price: '', notes: '', estimatedLeadTime: '' });
  };

  const closeConversation = useCallback(() => {
    setActiveConversation(null);
    setConversationMessages([]);
  }, []);

  const loadConversationForSupplier = useCallback(async ({ conversationId = null, quoteId = null, closeQuoteModal = false } = {}) => {
    if (!currentUser?.id) return null;

    setConversationLoading(true);

    try {
      const conversationRecord = conversationId
        ? await getQuoteConversationById(conversationId)
        : await getQuoteConversationForQuote(quoteId, currentUser.id);

      if (!conversationRecord) {
        setToast({ message: 'Todavia no existe una conversacion disponible para esta Solicitud de Cotización.', type: 'error' });
        return null;
      }

      const [messageRows, markedConversation] = await Promise.all([
        getQuoteConversationMessages(conversationRecord.id),
        markQuoteConversationRead({ conversationId: conversationRecord.id, userId: currentUser.id }),
      ]);

      setActiveConversation(mapQuoteConversationRecord(markedConversation ?? conversationRecord));
      setConversationMessages(messageRows.map((message) => mapQuoteConversationMessageRecord(message)));

      if (closeQuoteModal) {
        setQuoteModal(null);
        setOfferForm({ price: '', notes: '', estimatedLeadTime: '' });
      }

      return conversationRecord;
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

  const openBuyerSummary = async (quote) => {
    setLoadingBuyerId(quote.buyerId);

    try {
      const [buyerRecordRaw, buyerStats] = await Promise.all([
        getBuyerProfile(quote.buyerId),
        getBuyerStats(quote.buyerId),
      ]);
      const buyerRecord = normalizeUserRecord(buyerRecordRaw);
      const buyerView = buildBuyerProfileView(buyerRecord);

      setViewingBuyer({
        id: buyerRecord.id,
        initials: buyerView.initials,
        name: buyerView.companyName,
        description: buyerView.description,
        type: buyerView.businessType || 'Comprador',
        verified: buyerRecord?.verified,
        memberSince: formatMemberSince(buyerRecord?.created_at),
        rating: Number(buyerStats.rating || 0).toFixed(1),
        totalOrders: buyerStats.totalOrders,
        favoriteSuppliers: buyerStats.favoriteSuppliers,
        monthlyVolume: buyerView.monthlyVolume || 'Sin definir',
        rut: buyerView.rut,
        city: buyerView.city,
        address: buyerView.address,
        email: buyerView.email,
        phone: buyerView.phone,
        whatsapp: buyerView.whatsapp,
        categories: buyerView.categories,
        quote,
      });
    } catch (error) {
      setToast({ message: error.message || 'No se pudo cargar el resumen del comprador.', type: 'error' });
    } finally {
      setLoadingBuyerId('');
    }
  };

  const handleOfferSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser?.id || !quoteModal) {
      return;
    }
    const hasPrice = String(offerForm.price).trim() !== '';

    if (hasPrice && !entitlements.canRespondToQuotes) {
      setToast({ message: 'Se alcanzo el limite operativo mensual de respuestas.', type: 'error' });
      return;
    }

    setIsSubmittingOffer(true);

    try {
      const notes = offerForm.notes.trim();
      const estimatedLeadTime = offerForm.estimatedLeadTime.trim();

      if (hasPrice) {
        await submitOffer({
          quoteId: quoteModal.id,
          supplierId: currentUser.id,
          responderId: currentUser.id,
          price: Number(offerForm.price),
          notes: notes || null,
          estimatedLeadTime: estimatedLeadTime || null,
        });

        await loadQuotesData();
        await refreshUsageSummary();
        closeQuoteOfferModal();
        setToast({ message: `Oferta enviada a ${quoteModal.buyerName}.`, type: 'success' });
        return;
      }

      const messageBody = [
        notes,
        estimatedLeadTime ? `Tiempo estimado de entrega: ${estimatedLeadTime}` : '',
      ].filter(Boolean).join('\n\n');

      if (!messageBody) {
        setToast({ message: 'Escribe un mensaje o agrega un precio estimado para responder.', type: 'error' });
        return;
      }

      const conversation = await ensureQuoteConversationForSupplier({
        quoteId: quoteModal.id,
        buyerUserId: quoteModal.buyerId,
        supplierUserId: currentUser.id,
        startedByUserId: currentUser.id,
      });

      await sendQuoteConversationMessage({
        conversationId: conversation.id,
        senderUserId: currentUser.id,
        body: messageBody,
      });

      closeQuoteOfferModal();
      setToast({ message: `Mensaje enviado a ${quoteModal.buyerName}.`, type: 'success' });
      await loadConversationForSupplier({ quoteId: quoteModal.id });
    } catch (error) {
      setToast({ message: error.message || 'No se pudo responder la cotizacion.', type: 'error' });
    } finally {
      setIsSubmittingOffer(false);
    }
  };
  const workspaceSummary = useMemo(
    () => buildSupplierWorkspaceSummary(openQuotes, supplierOffers),
    [openQuotes, supplierOffers],
  );
  const buyerRelationships = useMemo(
    () => buildSupplierBuyerRelationships(openQuotes, supplierOffers),
    [openQuotes, supplierOffers],
  );
  const profileReviews = useMemo(() => (
    supplierReviews.map((review) => {
      const reviewer = Array.isArray(review.users) ? review.users[0] : review.users;

      return {
        id: review.id,
        buyer: reviewer?.company_name ?? 'Comprador',
        rating: Number(review.rating) || 0,
        comment: review.comment ?? 'Sin comentario.',
        dateLabel: review.created_at
          ? new Intl.DateTimeFormat('es-CL', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }).format(new Date(review.created_at))
          : 'Sin fecha',
      };
    })
  ), [supplierReviews]);
  const supplierRatingLabel = Number(supplierStats.rating || 0).toFixed(1);
  const supplierOfferMap = new Map(supplierOffers.map((offer) => [offer.quoteId, offer]));
  const activeSubscriptionPlan = currentUser?.activeSubscription?.plans ?? currentUser?.activeSubscription?.plan ?? null;
  const currentPlanDetails = useMemo(
    () => activeSubscriptionPlan ?? plans.find((plan) => plan.name === currentPlanKey) ?? null,
    [activeSubscriptionPlan, currentPlanKey, plans],
  );
  const entitlements = useMemo(
    () => getSupplierEntitlements(currentPlanDetails, usageSummary),
    [currentPlanDetails, usageSummary],
  );
  const handleOfferPipelineChange = async (offerId, pipelineStatus) => {
    if (!currentUser?.id) return;

    setIsUpdatingOfferId(offerId);

    try {
      const updatedOffer = await updateOfferPipelineStatus({
        offerId,
        supplierId: currentUser.id,
        pipelineStatus,
      });

      const mappedOffer = mapQuoteOfferRecord(updatedOffer);
      setSupplierOffers((currentOffers) => currentOffers.map((offer) => (
        offer.id === mappedOffer.id ? mappedOffer : offer
      )));
      setToast({ message: `Pipeline actualizado a ${mappedOffer.pipelineStatusLabel}.`, type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'No se pudo actualizar el pipeline.', type: 'error' });
    } finally {
      setIsUpdatingOfferId('');
    }
  };

  const headerTabs = [
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
    {
      id: 'products',
      label: 'Mis Productos',
      active: activeTab === 'products',
      onClick: () => setActiveTab('products'),
      badge: products.length,
    },
    {
      id: 'quotes',
      label: 'Cotizaciones',
      active: activeTab === 'quotes',
      onClick: () => setActiveTab('quotes'),
      badge: workspaceSummary.openRelevantQuotes,
      dot: unreadSupplierQuoteNotifications > 0,
      dotClassName: unreadSupplierQuoteNotifications > 0
        ? 'w-2 h-2 bg-emerald-400 rounded-full animate-ping'
        : undefined,
    },
    {
      id: 'buyers',
      label: 'Compradores',
      active: activeTab === 'buyers',
      onClick: () => setActiveTab('buyers'),
      badge: buyerRelationships.length,
    },
  ];

  return (
    <div className="ui-page">
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

      {quoteModal && (
        <Modal title={`Cotizar -- ${quoteModal.productName}`} onClose={closeQuoteOfferModal}>
          <div className="bg-brand-canvas rounded-xl p-4 mb-5 text-sm space-y-1.5">
            <p><span className="font-medium text-gray-400 text-xs uppercase tracking-wide">Comprador</span><br /><span className="text-brand-ink font-semibold">{quoteModal.buyerName}</span></p>
            <p><span className="font-medium text-gray-400 text-xs uppercase tracking-wide">Producto</span><br /><span className="text-brand-ink">{quoteModal.productName}</span></p>
            <p><span className="font-medium text-gray-400 text-xs uppercase tracking-wide">Cantidad</span><br /><span className="text-brand-ink">{quoteModal.quantityLabel}</span></p>
            <p><span className="font-medium text-gray-400 text-xs uppercase tracking-wide">Entrega</span><br /><span className="text-brand-ink">{quoteModal.deliveryDateLabel}</span></p>
            {quoteModal.notes && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <span className="font-medium text-gray-400 text-xs uppercase tracking-wide">Notas</span>
                <p className="text-brand-ink text-base font-semibold mt-1 leading-snug">{quoteModal.notes}</p>
              </div>
            )}
          </div>
          <form onSubmit={handleOfferSubmit} className="space-y-4">
            <div>
              <label htmlFor="offer-price" className="block text-sm font-medium text-gray-700 mb-1.5">
                Precio estimado (CLP, opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
                <input
                  id="offer-price"
                  type="number"
                  min="1"
                  placeholder="4.200"
                  value={offerForm.price}
                  onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
                />
              </div>
            </div>
            <div>
              <label htmlFor="offer-lead-time" className="block text-sm font-medium text-gray-700 mb-1.5">
                Tiempo estimado de entrega
              </label>
              <input
                id="offer-lead-time"
                type="text"
                placeholder="Ej: 48 horas, 3 dias habiles"
                value={offerForm.estimatedLeadTime}
                onChange={(e) => setOfferForm({ ...offerForm, estimatedLeadTime: e.target.value })}
                className="ui-input"
              />
            </div>
            <div>
              <label htmlFor="offer-notes" className="block text-base font-semibold text-gray-800 mb-1.5">
                Mensaje al comprador
              </label>
              <textarea
                id="offer-notes"
                rows={5}
                placeholder="Ej: Tenemos disponibilidad. Puedo confirmar precio por volumen y condiciones de entrega por este chat."
                value={offerForm.notes}
                onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })}
                className="w-full border-2 border-brand-accent/40 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 resize-none transition-all"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={closeQuoteOfferModal}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmittingOffer}
                className="flex-1 bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-400/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmittingOffer ? 'Enviando...' : (String(offerForm.price).trim() ? 'Enviar oferta' : 'Enviar mensaje')}
              </button>
            </div>
          </form>
        </Modal>
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

      {productDetail && (
        <Modal title={productDetail.name} onClose={() => setProductDetail(null)}>
          {/* Product image */}
          <div className="relative mb-5">
            <ProductImageCarousel
              images={productDetail.imageUrls}
              alt={productDetail.imageAlt}
              fallbackClassName={`bg-gradient-to-br ${productDetail.gradient}`}
              className="h-56 rounded-xl"
              imageClassName=""
            />
            {!productDetail.imageUrls?.length && (
              <>
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-6 left-6 w-32 h-32 bg-white/30 rounded-full blur-xl" />
                  <div className="absolute bottom-8 right-8 w-40 h-40 bg-white/20 rounded-full blur-2xl" />
                </div>
                <div className="absolute inset-0">
                  <svg className="w-full h-full opacity-10" viewBox="0 0 200 200">
                    <defs>
                      <pattern id="ice-detail" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M20 0 L20 40 M0 20 L40 20 M5 5 L35 35 M35 5 L5 35" stroke="white" strokeWidth="0.5" fill="none" />
                        <circle cx="20" cy="20" r="3" fill="white" opacity="0.5" />
                      </pattern>
                    </defs>
                    <rect width="200" height="200" fill="url(#ice-detail)" />
                  </svg>
                </div>
              </>
            )}
            <div className="absolute bottom-3 left-3 bg-black/30 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
              {productDetail.customImage ? (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                  Foto del proveedor
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4" />
                  </svg>
                  Imagen de catalogo
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-canvas rounded-xl p-3.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Precio</span>
                <p className="text-lg font-extrabold text-brand-ink mt-0.5">{productDetail.price}</p>
              </div>
              <div className="bg-brand-canvas rounded-xl p-3.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Stock</span>
                <p className="text-lg font-extrabold text-brand-ink mt-0.5">{productDetail.stock}</p>
              </div>
              <div className="bg-brand-canvas rounded-xl p-3.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Categoria</span>
                <p className="text-sm font-semibold text-brand-ink mt-0.5">{productDetail.category}</p>
              </div>
              <div className="bg-brand-canvas rounded-xl p-3.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Estado</span>
                <p className={`text-sm font-semibold mt-0.5 ${productDetail.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {productDetail.status === 'active' ? 'Disponible' : 'Stock bajo'}
                </p>
              </div>
            </div>

            <div className="bg-brand-canvas rounded-xl p-3.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Descripcion</span>
              <p className="text-sm text-gray-700 mt-1 leading-relaxed">{productDetail.description}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => openEditProductModal(productDetail)}
                className="w-full border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Editar
              </button>
            </div>
          </div>
        </Modal>
      )}
      {supplierReviewForm.quoteOfferId && (
        <Modal title="Dejar reseña" onClose={closeSupplierReviewModal}>
          <form onSubmit={handleSupplierReviewSubmit} className="space-y-5">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Venta verificada</div>
              <div className="text-sm font-bold text-brand-ink mt-1">{supplierReviewForm.buyerName}</div>
              <p className="text-sm text-gray-600 mt-1">
                Comparte como fue la venta de {supplierReviewForm.productName} para fortalecer la confianza del marketplace.
              </p>
            </div>

            <div>
              <label htmlFor="supplier-review-rating" className="block text-sm font-medium text-gray-700 mb-1.5">
                Calificacion <span className="text-red-500">*</span>
              </label>
              <select
                id="supplier-review-rating"
                value={supplierReviewForm.rating}
                onChange={(event) => setSupplierReviewForm((current) => ({ ...current, rating: Number(event.target.value) }))}
                className="ui-select"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>{value} estrella{value > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="supplier-review-comment" className="block text-sm font-medium text-gray-700 mb-1.5">
                Comentario <span className="text-red-500">*</span>
              </label>
              <textarea
                id="supplier-review-comment"
                rows={4}
                required
                minLength={12}
                placeholder="Ej: rapido en el pago, buena comunicacion, comprador recomendado..."
                value={supplierReviewForm.comment}
                onChange={(event) => setSupplierReviewForm((current) => ({ ...current, comment: event.target.value }))}
                className="ui-textarea"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeSupplierReviewModal}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmittingSupplierReview}
                className="flex-1 ui-btn-primary py-3"
              >
                {isSubmittingSupplierReview ? 'Publicando...' : 'Publicar reseña'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editProfileOpen && (
        <Modal title="Editar perfil" onClose={() => setEditProfileOpen(false)}>
          <form onSubmit={handleProfileSave} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
            {/* Company info section */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Informacion de la empresa</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razon social</label>
                  <input
                    type="text"
                    required
                    value={profileForm.companyName}
                    onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                  <input
                    type="text"
                    value={profileForm.description}
                    onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                    <input
                      type="text"
                      value={profileForm.rut}
                      onChange={(e) => setProfileForm({ ...profileForm, rut: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Direccion</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giro</label>
                  <input
                    type="text"
                    value={profileForm.giro}
                    onChange={(e) => setProfileForm({ ...profileForm, giro: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Contact section */}
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
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                    <input
                      type="tel"
                      value={profileForm.whatsapp}
                      onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sitio web</label>
                  <input
                    type="text"
                    value={profileForm.website}
                    onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Categories section */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Categorias</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {profileForm.categories.map((cat) => (
                  <span key={cat} className="text-sm font-medium bg-brand-mint text-brand-ink border border-brand-accent/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
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
                  value={selectedCategoryId || categoryOptions.find((category) => !profileForm.categories.includes(category.name))?.id || ''}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 bg-white transition-all"
                >
                  {categoryOptions
                    .filter((category) => !profileForm.categories.includes(category.name))
                    .map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={categoryOptions.filter((category) => !profileForm.categories.includes(category.name)).length === 0}
                  className="border border-brand-accent text-brand-accent font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-accent/5 transition-all text-sm"
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

      {/* Add product modal */}
      {addProductOpen && (
        <Modal title={editingProductId ? 'Editar producto' : 'Agregar nuevo producto'} onClose={() => setAddProductOpen(false)}>
          <form onSubmit={handleSaveProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre del producto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Queso mozzarella, Aceite vegetal..."
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="ui-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Categoria <span className="text-red-500">*</span>
              </label>
              <select
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="ui-select"
              >
                {categoryOptions.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Precio <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="4.500"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
                  />
                </div>
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Por</label>
                <select
                  value={productForm.priceUnit}
                  onChange={(e) => setProductForm({ ...productForm, priceUnit: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-brand-accent bg-white transition-all"
                >
                  {['kg', 'lt', 'unidad', 'caja', 'saco'].map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Stock disponible <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="1000"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  className="ui-input"
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Unidad</label>
                <select
                  value={productForm.stockUnit}
                  onChange={(e) => setProductForm({ ...productForm, stockUnit: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-brand-accent bg-white transition-all"
                >
                  {['kg', 'lt', 'unidades', 'cajas', 'sacos'].map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Descripcion
              </label>
              <textarea
                rows={3}
                placeholder="Describe el producto: origen, calibre, certificaciones, formato de venta..."
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="ui-textarea"
              />
            </div>

            {/* Image upload / generation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Fotos del producto
              </label>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                    imageMode === 'upload'
                      ? 'border-brand-accent bg-brand-accent/10 text-brand-ink'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <UploadCloud className="h-4 w-4" />
                  Subir foto
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('generate')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                    imageMode === 'generate'
                      ? 'border-brand-accent bg-brand-accent/10 text-brand-ink'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  Crear con IA
                </button>
              </div>

              {productForm.imagePreviews && productForm.imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {productForm.imagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img
                        src={preview}
                        alt={`Vista previa ${idx + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeProductImage(idx)}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur-md text-white rounded-lg flex items-center justify-center hover:bg-black/70 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {productForm.imagePreviews.length < 4 && imageMode === 'upload' && (
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-brand-accent hover:bg-brand-accent/5 transition-all group mb-3">
                  <div className="flex flex-col items-center justify-center pt-2 pb-3">
                    <UploadCloud className="w-8 h-8 text-gray-300 group-hover:text-brand-accent transition-colors mb-2" />
                    <p className="text-sm font-medium text-gray-400 group-hover:text-gray-600">Subir foto del producto ({productForm.imagePreviews.length}/4)</p>
                    <p className="text-[10px] text-gray-300 mt-1">JPG, PNG o WebP (max. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProductImage}
                    className="hidden"
                  />
                </label>
              )}

              {productForm.imagePreviews.length < 4 && imageMode === 'generate' && (
                <div className="border border-brand-accent/20 rounded-xl p-4 bg-brand-accent/5 space-y-3 mb-3">
                  <p className="text-xs text-gray-600 font-medium">
                    Describe el producto para crear una foto de catalogo limpia y profesional.
                  </p>
                  <textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ej: mango Tommy fresco cortado, fondo blanco, luz de estudio, estilo marketplace B2B..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 resize-none transition-all bg-white"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Fondo blanco',
                      'Vista de catalogo',
                      'Empaque mayorista',
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setAiPrompt((prev) => prev ? `${prev}, ${tag.toLowerCase()}` : tag)}
                        className="text-[10px] px-2.5 py-1 rounded-full border border-brand-accent/20 text-brand-ink hover:bg-white transition-all"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={aiLoading || (!aiPrompt.trim() && !productForm.name.trim())}
                    className="w-full ui-btn-primary py-3 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {aiLoading ? 'Generando imagen...' : 'Generar imagen'}
                  </button>
                </div>
              )}
              <p className="text-[10px] text-gray-400 mt-1.5">Puedes subir o generar hasta 4 fotos del producto o empaque.</p>
            </div>

            {/* Preview */}
            <div className="bg-brand-canvas rounded-xl p-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Vista previa</p>
              <div className="flex items-center gap-3">
                {productForm.imagePreviews?.[0] ? (
                  <img src={productForm.imagePreviews[0]} alt="Preview" className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className={`w-12 h-12 bg-gradient-to-br ${productGradients[products.length % productGradients.length]} rounded-xl flex items-center justify-center text-2xl`}>
                    <Package className="h-12 w-12 text-white drop-shadow" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-brand-ink">{productForm.name || 'Nombre del producto'}</p>
                  <p className="text-xs text-gray-400">{productForm.category}{productForm.price ? ` / $${productForm.price}/${productForm.priceUnit}` : ''}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setAddProductOpen(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingProduct}
                className="flex-1 bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-400/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSavingProduct ? 'Guardando...' : editingProductId ? 'Guardar cambios' : 'Agregar producto'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Buyer profile modal */}
      {viewingBuyer && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-brand-ink/50 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && setViewingBuyer(null)}
        >
          <div className="transform-gpu bg-brand-canvas rounded-2xl shadow-2xl shadow-brand-ink/20 w-full max-w-3xl my-8 animate-fade-in-up overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-brand-ink via-brand-inkLight to-brand-ink relative">
              <div className="absolute inset-0 bg-grid opacity-20" />
              <button
                onClick={() => setViewingBuyer(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all z-10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 pb-6 relative">
              <div className="w-20 h-20 bg-gradient-to-br from-brand-ink to-brand-inkLight rounded-2xl flex items-center justify-center text-brand-accent text-2xl font-extrabold border-4 border-white shadow-lg -mt-10 relative z-10">
                {viewingBuyer.initials}
              </div>
              <div className="mt-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-brand-ink">{viewingBuyer.name}</h2>
                  <p className="text-gray-500 text-sm">{viewingBuyer.description}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-2.5 py-0.5 rounded-full uppercase">
                      {viewingBuyer.type}
                    </span>
                    {viewingBuyer.verified && (
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        Verificado
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">Miembro desde {viewingBuyer.memberSince || 'Sin fecha'}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setViewingBuyer(null);
                    if (viewingBuyer.quote) {
                      openQuoteOfferModal(viewingBuyer.quote);
                    }
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-400/20 text-sm whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  Enviar oferta
                </button>
              </div>
            </div>

            <div className="px-6 pb-6 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Valoracion', value: viewingBuyer.rating, sub: '/ 5.0', icon: (
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  )},
                  { label: 'Solicitudes de Cotización', value: viewingBuyer.totalOrders, sub: '', icon: (
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  )},
                  { label: 'Favoritos', value: viewingBuyer.favoriteSuppliers, sub: '', icon: (
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m11.48 3.499 1.04 0 2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  )},
                  { label: 'Volumen mensual', value: viewingBuyer.monthlyVolume.replace('Aprox. ', ''), sub: '', icon: (
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                    </svg>
                  )},
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3.5">
                    <div className="flex items-center gap-1.5 mb-1.5">{s.icon}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-extrabold text-brand-ink">{s.value}</span>
                      {s.sub && <span className="text-[10px] text-gray-400">{s.sub}</span>}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <h4 className="text-sm font-bold text-brand-ink mb-3">Informacion del negocio</h4>
                  <div className="space-y-2.5 text-sm">
                    {[
                      { label: 'RUT', value: viewingBuyer.rut },
                      { label: 'Ciudad', value: viewingBuyer.city },
                      { label: 'Direccion', value: viewingBuyer.address },
                      { label: 'Tipo', value: viewingBuyer.type },
                      { label: 'Volumen', value: viewingBuyer.monthlyVolume },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                        <span className="text-gray-400 text-xs">{item.label}</span>
                        <span className="font-semibold text-brand-ink text-xs text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <h4 className="text-sm font-bold text-brand-ink mb-3">Contacto</h4>
                  <div className="space-y-2.5 text-sm">
                    {[
                      { label: 'Email', value: viewingBuyer.email },
                      { label: 'Telefono', value: viewingBuyer.phone },
                      { label: 'WhatsApp', value: viewingBuyer.whatsapp },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                        <span className="text-gray-400 text-xs">{item.label}</span>
                        <span className="font-semibold text-brand-ink text-xs">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-brand-ink mb-2">Categorias de interes</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingBuyer.categories.length > 0 ? (
                    viewingBuyer.categories.map((category) => (
                      <span key={category} className="text-xs font-medium bg-brand-mint text-brand-ink border border-brand-accent/20 px-3 py-1.5 rounded-lg">
                        {category}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">No hay categorias informadas por este comprador.</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-brand-ink mb-3">Solicitud de Cotización actual</h4>
                <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                  <div className="flex justify-between gap-3">
                    <span className="text-sm text-gray-400">Producto</span>
                    <span className="text-sm font-semibold text-brand-ink text-right">{viewingBuyer.quote.productName}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-sm text-gray-400">Cantidad</span>
                    <span className="text-sm font-semibold text-brand-ink text-right">{viewingBuyer.quote.quantityLabel}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-sm text-gray-400">Entrega</span>
                    <span className="text-sm font-semibold text-brand-ink text-right">{viewingBuyer.quote.deliveryDateLabel}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Notas</span>
                    <p className="text-sm text-brand-ink mt-1">{viewingBuyer.quote.notes || 'Sin notas adicionales.'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <DashboardPageHeader
        eyebrow="Panel de proveedor"
        title={profile.companyName}
        subtitle={`${profile.city} / RUT ${profile.rut}`}
        badges={[{ label: 'Proveedor activo' }]}
        action={{
          onClick: () => navigate(currentUser?.is_buyer ? '/dashboard-comprador' : '/registro-comprador'),
          label: currentUser?.is_buyer ? 'Ir a comprador' : 'Activar comprador',
          className: 'flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-blue-500 text-brand-ink font-bold transition-all whitespace-nowrap hover:scale-[1.02] shadow-lg shadow-emerald-400/20 hover:shadow-emerald-400/40',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          ),
        }}
        tabs={headerTabs}
        accentBlobClass="bg-brand-accent/5"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ===== PROFILE TAB ===== */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            {/* Profile header card */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden card-premium">
              {/* Cover / banner */}
              <div className="h-32 bg-gradient-to-r from-brand-ink via-brand-inkLight to-brand-ink relative">
                <div className="absolute inset-0 bg-grid opacity-20" />
                <div className="absolute top-4 right-4 w-40 h-40 bg-brand-accent/10 rounded-full blur-[60px]" />
              </div>
              <div className="px-6 pb-6 relative">
                {/* Avatar */}
                <label className="w-24 h-24 rounded-2xl -mt-12 relative z-10 cursor-pointer group block">
                  {currentUser?.avatar_url
                    ? <img src={currentUser.avatar_url} alt="Avatar" className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg" />
                    : <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl flex items-center justify-center text-white text-3xl font-extrabold border-4 border-white shadow-lg">{profile.companyName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</div>
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
                    <h2 className="text-2xl font-extrabold text-brand-ink">{profile.companyName}</h2>
                    <p className="text-gray-500 text-sm mt-1">{profile.description}</p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="text-xs font-bold bg-gradient-to-r from-emerald-400 to-blue-500 text-white px-3 py-1 rounded-full">Proveedor activo</span>
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
                { label: 'Valoracion', value: insightsLoading ? '--' : supplierRatingLabel, sub: `/ 5.0 · ${supplierStats.totalReviews || 0} resenas`, items: supplierReviews.map(r => ({ label: r.reviewerName || 'Comprador', value: `${r.rating}/5`, sub: r.comment || '' })), emptyText: 'Aun no tienes reseñas', icon: (
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )},
                { label: 'Ofertas aceptadas', value: workspaceSummary.acceptedOffers, sub: `${workspaceSummary.submittedOffers} enviadas`, items: supplierOffers.filter(o => o.status === 'accepted').map(o => ({ label: o.quote?.productName || 'Producto', value: o.priceLabel, sub: `${o.buyerName} · ${o.createdAtLabel}` })), emptyText: 'Sin ofertas aceptadas aun', icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                )},
                { label: 'Tasa de respuesta', value: workspaceSummary.responseRateLabel, sub: `${workspaceSummary.opportunityCount} oportunidades`, items: [{ label: 'Ofertas enviadas', value: String(workspaceSummary.submittedOffers) }, { label: 'Total oportunidades', value: String(workspaceSummary.opportunityCount) }, { label: 'Tasa calculada', value: workspaceSummary.responseRateLabel }], emptyText: 'Sin datos aun', icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )},
                { label: 'Clientes recurrentes', value: supplierStats.recurringClients, sub: `${workspaceSummary.activeBuyers} compradores activos`, items: buyerRelationships.map(b => ({ label: b.buyerName, value: `${b.acceptedOffers} aceptadas`, sub: b.buyerCity || '' })), emptyText: 'Sin compradores aun', icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                )},
              ].map((s) => (
                <button key={s.label} type="button" onClick={() => setStatDetail({ title: s.label, value: `${s.value}${s.sub ? ' ' + s.sub : ''}`, items: s.items, emptyText: s.emptyText })} className="ui-card-interactive p-5 group">
                  <div className="w-9 h-9 bg-brand-canvas rounded-xl flex items-center justify-center text-gray-400 mb-3 group-hover:bg-brand-accent/10 group-hover:text-brand-accent transition-colors">
                    {s.icon}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-brand-ink">{s.value}</span>
                    <span className="text-xs text-gray-400">{s.sub}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company info */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 card-premium">
                <h3 className="text-lg font-extrabold text-brand-ink mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                  </svg>
                  Informacion de la empresa
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Razon social', value: profile.companyName },
                    { label: 'RUT', value: profile.rut },
                    { label: 'Ciudad', value: profile.city },
                    { label: 'Direccion', value: profile.address },
                    { label: 'Giro', value: profile.giro },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-400">{item.label}</span>
                      <span className="text-sm font-semibold text-brand-ink">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact info */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 card-premium">
                <h3 className="text-lg font-extrabold text-brand-ink mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  Contacto
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Email', value: profile.email, icon: (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    )},
                    { label: 'Telefono', value: profile.phone, icon: (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    )},
                    { label: 'WhatsApp', value: profile.whatsapp, icon: (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                    )},
                    { label: 'Sitio web', value: profile.website, icon: (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                      </svg>
                    )},
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      {item.icon}
                      <div className="flex-1">
                        <span className="text-xs text-gray-400 block">{item.label}</span>
                        <span className="text-sm font-semibold text-brand-ink">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 card-premium">
              <h3 className="text-lg font-extrabold text-brand-ink mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
                Categorias que ofrezco
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.categories.map((cat) => (
                  <span key={cat} className="text-sm font-medium bg-brand-mint text-brand-ink border border-brand-accent/20 px-4 py-2 rounded-xl">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Recent reviews */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 card-premium">
              <h3 className="text-lg font-extrabold text-brand-ink mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                Resenas recientes
              </h3>
              {insightsLoading ? (
                <div className="rounded-2xl bg-brand-canvas px-4 py-6 text-sm text-gray-400">
                  Cargando resenas...
                </div>
              ) : profileReviews.length ? (
                <div className="space-y-4">
                  {profileReviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-brand-ink to-brand-inkLight rounded-xl flex items-center justify-center text-white text-xs font-bold">
                            {review.buyer.charAt(0)}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-brand-ink">
                              {review.buyer}
                            </span>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <svg key={index} className={`w-3 h-3 ${index < review.rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{review.dateLabel}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed ml-12">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-brand-canvas px-4 py-6 text-sm text-gray-400">
                  Aun no hay resenas publicadas para este proveedor.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== QUOTES TAB ===== */}
        {activeTab === 'quotes' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
              {[
                { label: 'Solicitudes de Cotización', value: workspaceSummary.openRelevantQuotes, color: 'text-brand-ink', items: openQuotes.map(q => ({ label: q.productName, value: q.statusLabel, sub: `${q.buyerName} · ${q.quantityLabel}` })), emptyText: 'Sin solicitudes abiertas' },
                { label: 'Ofertas enviadas', value: workspaceSummary.submittedOffers, color: 'text-brand-accent', items: supplierOffers.map(o => ({ label: o.quote?.productName || 'Producto', value: o.priceLabel, sub: `${o.buyerName} · ${o.statusLabel}` })), emptyText: 'Sin ofertas enviadas aun' },
                { label: 'Ofertas aceptadas', value: workspaceSummary.acceptedOffers, color: 'text-emerald-500', items: supplierOffers.filter(o => o.status === 'accepted').map(o => ({ label: o.quote?.productName || 'Producto', value: o.priceLabel, sub: `${o.buyerName} · ${o.createdAtLabel}` })), emptyText: 'Sin ofertas aceptadas aun' },
                { label: 'Win rate', value: workspaceSummary.winRateLabel, color: 'text-indigo-500', items: [{ label: 'Ofertas aceptadas', value: String(workspaceSummary.acceptedOffers) }, { label: 'Ofertas enviadas', value: String(workspaceSummary.submittedOffers) }, { label: 'Win rate calculado', value: workspaceSummary.winRateLabel }], emptyText: 'Sin datos aun' },
                { label: 'Tasa de respuesta', value: workspaceSummary.responseRateLabel, color: 'text-amber-500', items: [{ label: 'Ofertas enviadas', value: String(workspaceSummary.submittedOffers) }, { label: 'Oportunidades totales', value: String(workspaceSummary.opportunityCount) }, { label: 'Tasa calculada', value: workspaceSummary.responseRateLabel }], emptyText: 'Sin datos aun' },
              ].map((stat) => (
                <button key={stat.label} type="button" onClick={() => setStatDetail({ title: stat.label, value: stat.value, items: stat.items, emptyText: stat.emptyText })} className="ui-card-interactive p-6 group">
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">{stat.label}</div>
                  <div className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</div>
                </button>
              ))}
            </div>

            {supplierReviewOpportunities.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-extrabold text-brand-ink">Reseñas pendientes</h2>
                  <span className="text-[10px] font-bold bg-amber-400 text-amber-900 px-2.5 py-1 rounded-full animate-pulse">
                    {supplierReviewOpportunities.length} pendiente{supplierReviewOpportunities.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {supplierReviewOpportunities.map((opportunity) => (
                    <div key={opportunity.quoteOfferId} className="bg-white rounded-2xl border border-amber-100 p-5 card-premium">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-brand-ink truncate">{opportunity.buyerName}</p>
                          <p className="text-xs text-gray-400 truncate">{opportunity.productName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5 mb-3">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Venta verificada - Evalua al comprador
                      </div>
                      <button
                        type="button"
                        onClick={() => openSupplierReviewModal(opportunity)}
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-brand-ink">Solicitudes de Cotización</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">{openQuotes.length} solicitudes abiertas</span>
              </div>

              {quotesLoading ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
                  Cargando Solicitudes de Cotización...
                </div>
              ) : openQuotes.length > 0 ? (
                <>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hidden sm:block">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Comprador</th>
                          <th className="text-left px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Producto</th>
                          <th className="text-left px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Cantidad</th>
                          <th className="text-left px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Entrega</th>
                          <th className="text-left px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                          <th className="text-left px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Accion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {openQuotes.map((quote) => {
                          const existingOffer = supplierOfferMap.get(quote.id);

                          return (
                            <tr
                              key={quote.id}
                              className={`transition-colors ${
                                highlightedQuoteId === quote.id
                                  ? 'bg-emerald-50'
                                  : 'hover:bg-brand-canvas'
                              }`}
                            >
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => openBuyerSummary(quote)}
                                  disabled={loadingBuyerId === quote.buyerId}
                                  className="flex items-center gap-3 group/buyer disabled:opacity-60"
                                >
                                  <div className="w-9 h-9 bg-gradient-to-br from-brand-ink to-brand-inkLight rounded-lg flex items-center justify-center text-brand-accent text-xs font-bold">
                                    {quote.buyerName.charAt(0)}
                                  </div>
                                  <span className="font-semibold text-brand-ink text-sm group-hover/buyer:text-brand-accent transition-colors underline decoration-transparent group-hover/buyer:decoration-brand-accent">
                                    {loadingBuyerId === quote.buyerId ? 'Cargando...' : quote.buyerName}
                                  </span>
                                </button>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-semibold text-brand-ink">{quote.productName}</p>
                                <p className="text-xs text-gray-400">{quote.categoryName}</p>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">{quote.quantityLabel}</td>
                              <td className="px-6 py-4 text-sm text-gray-400">{quote.deliveryDateLabel}</td>
                              <td className="px-6 py-4">
                                <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${quote.statusClass}`}>
                                  {quote.statusLabel}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {existingOffer ? (
                                  <div className="flex flex-wrap gap-2">
                                    <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${existingOffer.statusClass}`}>
                                      {existingOffer.statusLabel}
                                    </span>
                                    <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${existingOffer.pipelineStatusClass}`}>
                                      {existingOffer.pipelineStatusLabel}
                                    </span>
                                    <button
                                      onClick={() => loadConversationForSupplier({ quoteId: quote.id })}
                                      className="text-[10px] font-semibold px-3 py-1 rounded-full border border-brand-accent/30 text-brand-accent hover:bg-brand-accent/5 transition-all"
                                    >
                                      Abrir conversacion
                                    </button>
                                  </div>
                                ) : (
                                  entitlements.canRespondToQuotes ? (
                                    <button
                                      onClick={() => openQuoteOfferModal(quote)}
                                      className="bg-gradient-to-r from-emerald-400 to-blue-500 hover:shadow-lg hover:shadow-emerald-400/20 text-brand-ink font-bold text-sm px-4 py-2 rounded-lg transition-all"
                                    >
                                      Ver Cotización
                                    </button>
                                  ) : (
                                    <button
                                      disabled
                                      className="bg-gray-100 text-gray-500 font-bold text-sm px-4 py-2 rounded-lg transition-all cursor-not-allowed"
                                    >
                                      Limite operativo
                                    </button>
                                  )
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="sm:hidden space-y-3">
                    {openQuotes.map((quote) => {
                      const existingOffer = supplierOfferMap.get(quote.id);

                      return (
                        <div key={quote.id} className="bg-white rounded-2xl border border-gray-100 p-5 card-premium">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <button
                                onClick={() => openBuyerSummary(quote)}
                                disabled={loadingBuyerId === quote.buyerId}
                                className="font-bold text-brand-ink hover:text-brand-accent transition-colors text-left disabled:opacity-60"
                              >
                                {loadingBuyerId === quote.buyerId ? 'Cargando...' : quote.buyerName}
                              </button>
                              <p className="text-sm text-gray-500 mt-1">{quote.productName}</p>
                              <p className="text-xs text-gray-400 mt-1">{quote.quantityLabel} / {quote.deliveryDateLabel}</p>
                            </div>
                            {existingOffer ? (
                              <div className="flex flex-col items-end gap-2">
                                <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${existingOffer.statusClass}`}>
                                  {existingOffer.statusLabel}
                                </span>
                                <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${existingOffer.pipelineStatusClass}`}>
                                  {existingOffer.pipelineStatusLabel}
                                </span>
                                <button
                                  onClick={() => loadConversationForSupplier({ quoteId: quote.id })}
                                  className="text-[10px] font-semibold px-3 py-1 rounded-full border border-brand-accent/30 text-brand-accent hover:bg-brand-accent/5 transition-all"
                                >
                                  Abrir conversacion
                                </button>
                              </div>
                            ) : (
                              entitlements.canRespondToQuotes ? (
                                <button
                                  onClick={() => openQuoteOfferModal(quote)}
                                  className="bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold text-sm px-4 py-2 rounded-lg transition-all"
                                >
                                  Cotizar
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="bg-gray-100 text-gray-500 font-bold text-sm px-4 py-2 rounded-lg transition-all cursor-not-allowed"
                                >
                                  Limite operativo
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                  <h3 className="text-lg font-bold text-brand-ink">No hay Solicitudes de Cotización abiertas ahora mismo</h3>
                  <p className="text-sm text-gray-400 mt-2">Cuando un comprador publique una necesidad, aparecerá en este inbox.</p>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-brand-ink">Mis ofertas</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">{supplierOffers.length} ofertas enviadas</span>
              </div>

              {supplierOffers.length > 0 ? (
                <div className="space-y-3">
                  {supplierOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className={`bg-white rounded-2xl border p-5 card-premium ${
                        highlightedOfferId === offer.id
                          ? 'border-emerald-300 ring-2 ring-emerald-100'
                          : 'border-gray-100'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-brand-ink">{offer.quote?.productName || 'Solicitud de Oferta'}</h3>
                            <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${offer.statusClass}`}>
                              {offer.statusLabel}
                            </span>
                            <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${offer.pipelineStatusClass}`}>
                              {offer.pipelineStatusLabel}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {offer.buyerName || 'Comprador'} / {offer.quote?.quantityLabel || 'Sin cantidad'} / {offer.quote?.deliveryDateLabel || 'Sin fecha'}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">Entrega estimada: {offer.estimatedLeadTime}</p>
                          <p className="text-sm text-gray-600 mt-3">{offer.notes || 'Sin notas adicionales.'}</p>
                        </div>
                        <div className="lg:text-right">
                          <div className="text-2xl font-extrabold text-brand-ink">{offer.priceLabel}</div>
                          <div className="text-xs text-gray-400 mt-1">{offer.createdAtLabel}</div>
                          <button
                            type="button"
                            onClick={() => loadConversationForSupplier({ quoteId: offer.quoteId })}
                            className="mt-4 border border-brand-accent/30 text-brand-accent font-semibold px-4 py-2 rounded-xl hover:bg-brand-accent/5 transition-all text-sm"
                          >
                            Abrir conversacion
                          </button>
                          {offer.status === 'pending' && (
                            <div className="mt-4">
                              <label htmlFor={`offer-pipeline-${offer.id}`} className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                                Pipeline interno
                              </label>
                              <select
                                id={`offer-pipeline-${offer.id}`}
                                value={offer.pipelineStatus}
                                disabled={isUpdatingOfferId === offer.id}
                                onChange={(event) => handleOfferPipelineChange(offer.id, event.target.value)}
                                className="min-w-[180px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-brand-ink focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 disabled:opacity-60"
                              >
                                {EDITABLE_OFFER_PIPELINE_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                  <h3 className="text-lg font-bold text-brand-ink">Todavia no envias ofertas</h3>
                  <p className="text-sm text-gray-400 mt-2">Abre una Solicitud de Cotización y responde con precio, notas y tiempo de entrega.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== PRODUCTS TAB ===== */}
        {activeTab === 'products' && (
          <div className="space-y-8 animate-fade-in">
            {/* Product stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Productos activos', value: products.filter(p => p.status === 'active').length, color: 'text-emerald-500', items: products.filter(p => p.status === 'active').map(p => ({ label: p.name, value: p.priceLabel || '', sub: p.category || '' })), emptyText: 'Sin productos activos' },
                { label: 'Stock bajo', value: products.filter(p => p.status === 'low_stock').length, color: 'text-amber-500', items: products.filter(p => p.status === 'low_stock').map(p => ({ label: p.name, value: p.priceLabel || '', sub: p.category || '' })), emptyText: 'Sin productos con stock bajo' },
                { label: 'Categorias', value: [...new Set(products.map(p => p.category))].length, color: 'text-brand-accent', items: [...new Set(products.map(p => p.category))].filter(Boolean).map(cat => ({ label: cat, value: `${products.filter(p => p.category === cat).length} productos` })), emptyText: 'Sin categorias' },
                { label: 'Total productos', value: products.length, color: 'text-brand-ink', items: products.map(p => ({ label: p.name, value: p.priceLabel || '', sub: p.category || '' })), emptyText: 'Sin productos en el catalogo' },
              ].map((s) => (
                <button key={s.label} type="button" onClick={() => setStatDetail({ title: s.label, value: s.value, items: s.items, emptyText: s.emptyText })} className="ui-card-interactive p-5 group">
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">{s.label}</div>
                  <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                </button>
              ))}
            </div>

            {/* Section header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-brand-ink">Catalogo de productos</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Fotos subidas o generadas con IA para tu catalogo.
                </p>
                {usageLoading && (
                  <p className="text-xs text-gray-400 mt-1">Actualizando uso operativo...</p>
                )}
              </div>
              <button
                onClick={openAddProductModal}
                className={`text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                  entitlements.canCreateProduct
                    ? 'bg-gradient-to-r from-emerald-400 to-blue-500 hover:shadow-lg hover:shadow-emerald-400/20 hover:scale-[1.02]'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {entitlements.canCreateProduct ? 'Agregar producto' : 'Limite operativo'}
              </button>
            </div>

            {/* Product grid */}
            {productsLoading ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
                Cargando catalogo...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => setProductDetail(product)}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden card-premium cursor-pointer group"
                >
                  {/* Product image */}
                  <div className="relative">
                    <ProductImageCarousel
                      images={product.imageUrls}
                      alt={product.imageAlt}
                      fallbackClassName={`bg-gradient-to-br ${product.gradient}`}
                      className="h-48"
                    />
                    {!product.imageUrls?.length && (
                      <>
                        {/* Decorative shapes */}
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute top-4 left-4 w-24 h-24 bg-white/30 rounded-full blur-xl" />
                          <div className="absolute bottom-6 right-6 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-black/10 rounded-full blur-lg" />
                        </div>
                        <div className="absolute inset-0">
                          <svg className="w-full h-full opacity-10" viewBox="0 0 200 200">
                            <defs>
                              <pattern id={`ice-${product.id}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M20 0 L20 40 M0 20 L40 20 M5 5 L35 35 M35 5 L5 35" stroke="white" strokeWidth="0.5" fill="none" />
                                <circle cx="20" cy="20" r="3" fill="white" opacity="0.5" />
                              </pattern>
                            </defs>
                            <rect width="200" height="200" fill={`url(#ice-${product.id})`} />
                          </svg>
                        </div>
                      </>
                    )}
                    {/* Badge */}
                    <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      {product.imageUrls?.length > 0 ? (
                        <>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                          </svg>
                          Foto
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                          </svg>
                          Catalogo
                        </>
                      )}
                    </div>
                    {/* Status badge */}
                    <div className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      product.status === 'active'
                        ? 'bg-emerald-400/90 text-emerald-900'
                        : 'bg-amber-400/90 text-amber-900'
                    }`}>
                      {product.status === 'active' ? 'Disponible' : 'Stock bajo'}
                    </div>
                  </div>

                  {/* Product info */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-brand-ink text-sm group-hover:text-brand-accent transition-colors">{product.name}</h3>
                        <span className="text-xs text-gray-400">{product.category}</span>
                      </div>
                      <span className="text-lg font-extrabold text-brand-ink">{product.price}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                        Stock: {product.stock}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(product);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Eliminar producto"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                        <span className="text-xs font-semibold text-brand-accent group-hover:underline">Ver detalle →</span>
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== BUYERS TAB ===== */}
        {activeTab === 'buyers' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: 'Compradores activos', value: workspaceSummary.activeBuyers, color: 'text-brand-ink', items: buyerRelationships.map(b => ({ label: b.buyerName, value: `${b.submittedOffers} ofertas`, sub: b.buyerCity || '' })), emptyText: 'Sin compradores activos' },
                { label: 'Clientes ganados', value: buyerRelationships.filter((buyer) => buyer.acceptedOffers > 0).length, color: 'text-emerald-500', items: buyerRelationships.filter(b => b.acceptedOffers > 0).map(b => ({ label: b.buyerName, value: `${b.acceptedOffers} aceptadas`, sub: b.buyerCity || '' })), emptyText: 'Aun no ganaste clientes' },
                { label: 'Seguimientos abiertos', value: buyerRelationships.filter((buyer) => buyer.pendingOffers > 0).length, color: 'text-amber-500', items: buyerRelationships.filter(b => b.pendingOffers > 0).map(b => ({ label: b.buyerName, value: `${b.pendingOffers} pendientes`, sub: b.buyerCity || '' })), emptyText: 'Sin seguimientos abiertos' },
                { label: 'Favoritos buyer-side', value: supplierStats.recurringClients, color: 'text-brand-accent', items: [], emptyText: 'Sin datos disponibles' },
              ].map((stat) => (
                <button key={stat.label} type="button" onClick={() => setStatDetail({ title: stat.label, value: stat.value, items: stat.items, emptyText: stat.emptyText })} className="ui-card-interactive p-6 group">
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">{stat.label}</div>
                  <div className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</div>
                </button>
              ))}
            </div>

            {buyerRelationships.length ? (
              <div className="space-y-3">
                {buyerRelationships.map((buyer) => (
                  <div key={buyer.id} className="bg-white rounded-2xl border border-gray-100 p-5 card-premium">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <button
                            onClick={() => openBuyerSummary({
                              buyerId: buyer.buyerId,
                              buyerName: buyer.buyerName,
                              buyerCity: buyer.buyerCity,
                              buyerVerified: buyer.buyerVerified,
                              productName: 'Relacion comercial',
                              quantityLabel: `${buyer.openRfqs} RFQs abiertas`,
                              deliveryDateLabel: buyer.lastActivityLabel,
                              notes: buyer.categories.length ? `Categorias: ${buyer.categories.join(', ')}` : 'Sin categorias asociadas',
                            })}
                            className="text-left"
                          >
                            <h3 className="text-base font-bold text-brand-ink hover:text-brand-accent transition-colors">
                              {buyer.buyerName}
                            </h3>
                          </button>
                          <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${buyer.acceptedOffers > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : buyer.pendingOffers > 0 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                            {buyer.relationshipStage}
                          </span>
                          {buyer.buyerVerified && (
                            <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                              Buyer verificado
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {buyer.buyerCity || 'Sin ciudad'} / Ultima actividad {buyer.lastActivityLabel}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {buyer.categories.length ? buyer.categories.map((category) => (
                            <span key={category} className="text-xs font-medium bg-brand-canvas text-gray-500 px-3 py-1 rounded-full border border-gray-100">
                              {category}
                            </span>
                          )) : (
                            <span className="text-xs font-medium bg-brand-canvas text-gray-400 px-3 py-1 rounded-full border border-gray-100">
                              Sin categorias aun
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center min-w-[280px]">
                        <div className="rounded-2xl bg-brand-canvas px-4 py-3">
                          <div className="text-xl font-extrabold text-brand-ink">{buyer.openRfqs}</div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-1">Solicitudes abiertas</div>
                        </div>
                        <div className="rounded-2xl bg-brand-canvas px-4 py-3">
                          <div className="text-xl font-extrabold text-brand-accent">{buyer.submittedOffers}</div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-1">Ofertas</div>
                        </div>
                        <div className="rounded-2xl bg-brand-canvas px-4 py-3">
                          <div className="text-xl font-extrabold text-emerald-500">{buyer.acceptedOffers}</div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-1">Ganadas</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <h3 className="text-lg font-bold text-brand-ink">Todavia no tienes relaciones buyer activas</h3>
                <p className="text-sm text-gray-400 mt-2">A medida que respondas Solicitudes de Cotización relevantes y cierres ofertas, este espacio se convierte en tu cartera comercial.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
