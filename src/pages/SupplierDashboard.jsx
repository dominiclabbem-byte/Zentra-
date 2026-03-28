import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import DashboardPageHeader from '../components/DashboardPageHeader';
import { salesAgents } from '../data/mockData';
import { chatWithAgent } from '../services/claudeApi';
import { speakText as ttsSpeak, stopSpeaking as ttsStop } from '../services/ttsService';
import VoiceCall from '../components/VoiceCall';
import { generateProductImage } from '../services/imageGenerator';
import { useAuth } from '../context/AuthContext';
import {
  buildBuyerProfileView,
  buildSupplierProfileView,
  formatMemberSince,
  formatPlanName,
  getPlanKey,
  mapPlanRowToCard,
  normalizeUserRecord,
} from '../lib/profileAdapters';
import {
  PRODUCT_EMOJIS as productEmojis,
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
import {
  formatLimitLabel,
  getSupplierEntitlements,
} from '../lib/planEntitlements';
import {
  createProduct,
  deleteProduct,
  getBuyerProfile,
  getBuyerStats,
  getOffersForSupplier,
  getRelevantQuoteRequestsForSupplier,
  getProducts,
  getReviewsForUser,
  getSupplierStats,
  getSupplierUsageSummary,
  submitOffer,
  updateProduct,
  updateOfferPipelineStatus,
} from '../services/database';

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

export default function SupplierDashboard() {
  const navigate = useNavigate();
  const {
    currentUser,
    categories: categoryOptions,
    plans,
    changeSupplierPlan,
    requestSupplierPlanBilling,
    saveSupplierProfile,
  } = useAuth();
  const defaultProductCategory = categoryOptions[0]?.name ?? 'Otros';
  const liveProfile = currentUser ? buildSupplierProfileView(currentUser) : initialProfile;
  const profile = liveProfile;
  const currentPlanKey = getPlanKey(currentUser) ?? 'starter';
  const currentPlanLabel = formatPlanName(currentPlanKey);
  const memberSinceLabel = formatMemberSince(currentUser?.created_at);
  const pendingPlanRequest = currentUser?.pendingSubscription ?? null;
  const [toast, setToast] = useState(null);
  const [quoteModal, setQuoteModal] = useState(null);
  const [offerForm, setOfferForm] = useState({ price: '', notes: '', estimatedLeadTime: '' });
  const [activeTab, setActiveTab] = useState('quotes');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
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
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [openQuotes, setOpenQuotes] = useState([]);
  const [supplierOffers, setSupplierOffers] = useState([]);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [isUpdatingOfferId, setIsUpdatingOfferId] = useState('');
  const [loadingBuyerId, setLoadingBuyerId] = useState('');
  const [supplierStats, setSupplierStats] = useState({ rating: 0, totalSales: 0, recurringClients: 0, totalReviews: 0 });
  const [supplierReviews, setSupplierReviews] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [usageSummary, setUsageSummary] = useState({
    activeProducts: 0,
    quoteResponsesThisMonth: 0,
    aiConversationsThisMonth: 0,
    voiceCallsThisMonth: 0,
  });
  const [usageLoading, setUsageLoading] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [isPreparingBilling, setIsPreparingBilling] = useState(false);

  const [imageMode, setImageMode] = useState('upload'); // 'upload' | 'generate'
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

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

  const handleGenerateImage = async () => {
    if (!aiPrompt.trim()) {
      setToast({ message: 'Escribe una descripción para generar la imagen', type: 'error' });
      return;
    }
    setAiLoading(true);
    try {
      const imageData = await generateProductImage(aiPrompt.trim());
      setProductForm((prev) => ({ ...prev, image: null, imagePreview: imageData }));
      setToast({ message: 'Imagen generada exitosamente', type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleProductImage = (e) => {
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
      setProductForm((prev) => ({ ...prev, image: file, imagePreview: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const removeProductImage = () => {
    setProductForm((prev) => ({ ...prev, image: null, imagePreview: null }));
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();

    if (!currentUser?.id) return;
    if (!editingProductId && !entitlements.canCreateProduct) {
      setToast({ message: 'Tu plan actual llego al limite de productos activos. Actualiza el plan para seguir publicando.', type: 'error' });
      setActiveTab('plan');
      return;
    }

    const categoryRecord = categoryOptions.find((category) => category.name === productForm.category);

    if (!categoryRecord) {
      setToast({ message: 'Selecciona una categoria valida.', type: 'error' });
      return;
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
      image_url: productForm.imagePreview || null,
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
  const [voiceCallActive, setVoiceCallActive] = useState(false);

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

  const loadSupplierInsights = useCallback(async () => {
    if (!currentUser?.id) {
      setSupplierStats({ rating: 0, totalSales: 0, recurringClients: 0, totalReviews: 0 });
      setSupplierReviews([]);
      return;
    }

    setInsightsLoading(true);

    try {
      const [stats, reviews] = await Promise.all([
        getSupplierStats(currentUser.id),
        getReviewsForUser(currentUser.id),
      ]);

      setSupplierStats(stats);
      setSupplierReviews(reviews ?? []);
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
      setToast({ message: 'Tu plan actual ya uso todos los productos activos disponibles.', type: 'error' });
      setActiveTab('plan');
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

  const openQuoteOfferModal = (quote) => {
    setOfferForm({ price: '', notes: '', estimatedLeadTime: '' });
    setQuoteModal(quote);
  };

  const closeQuoteOfferModal = () => {
    setQuoteModal(null);
    setOfferForm({ price: '', notes: '', estimatedLeadTime: '' });
  };

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
    if (!entitlements.canRespondToQuotes) {
      setToast({ message: 'Tu plan actual llego al limite mensual de respuestas RFQ. Actualiza el plan para seguir cotizando.', type: 'error' });
      setActiveTab('plan');
      return;
    }

    setIsSubmittingOffer(true);

    try {
      await submitOffer({
        quoteId: quoteModal.id,
        supplierId: currentUser.id,
        responderId: currentUser.id,
        price: Number(offerForm.price),
        notes: offerForm.notes || null,
        estimatedLeadTime: offerForm.estimatedLeadTime || null,
      });

      await loadQuotesData();
      await refreshUsageSummary();
      closeQuoteOfferModal();
      setToast({ message: `Oferta enviada a ${quoteModal.buyerName}.`, type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'No se pudo enviar la oferta.', type: 'error' });
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
  const planCards = useMemo(() => plans.map((plan) => mapPlanRowToCard(plan)), [plans]);
  const currentPlanCard = useMemo(
    () => planCards.find((plan) => plan.key === currentPlanKey) ?? planCards[0] ?? null,
    [currentPlanKey, planCards],
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
  const hasAgentFeature = entitlements.hasAgents;
  const hasAgentAccess = entitlements.canUseAgents;
  const hasVoiceAccess = entitlements.canUseVoiceCalls;

  const [agentLoading, setAgentLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);

  const isVoiceAgent = selectedAgent?.type === 'Llamadas IA';

  const speakTextChat = useCallback((text) => {
    ttsSpeak(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  }, []);

  const stopSpeakingChat = useCallback(() => {
    ttsStop();
    setIsSpeaking(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (!hasVoiceAccess) {
      setToast({ message: 'Tu plan actual no tiene cupo disponible para llamadas de voz este mes.', type: 'error' });
      setActiveTab('plan');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setToast({ message: 'Tu navegador no soporta reconocimiento de voz. Usa Chrome.', type: 'error' });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CL';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setToast({ message: 'No se pudo captar el audio. Intenta de nuevo.', type: 'error' });
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
  }, [hasVoiceAccess, isListening]);

  const handleAgentChat = async (e) => {
    e.preventDefault();
    if (!hasAgentAccess) {
      setToast({ message: 'Tu plan actual no tiene conversaciones IA disponibles este mes.', type: 'error' });
      setActiveTab('plan');
      return;
    }
    if (!chatInput.trim() || agentLoading) return;
    const now = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { role: 'user', text: chatInput, time: now };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput('');
    setAgentLoading(true);

    try {
      const responseText = await chatWithAgent(
        selectedAgent.name,
        selectedAgent.type,
        updatedMessages,
        profile,
      );
      setChatMessages((prev) => [
        ...prev,
        { role: 'agent', text: responseText, time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) },
      ]);
      // Auto-speak response for voice agent (Carlos)
      if (isVoiceAgent) speakTextChat(responseText);
    } catch {
      const fallback = [
        `Entendido. He actualizado la estrategia de contacto. Los prospectos recibiran el nuevo mensaje a partir de manana.`,
        `He revisado las metricas. La tasa de respuesta subio un 12% esta semana. Recomiendo mantener la frecuencia actual.`,
        `Perfecto, pausare las llamadas automaticas a ese cliente. Puedes reactivarlas cuando quieras.`,
        `Listo. He priorizado los leads de Santiago y Valparaiso. Las proximas 10 interacciones seran con esos prospectos.`,
      ];
      const text = fallback[Math.floor(Math.random() * fallback.length)];
      setChatMessages((prev) => [
        ...prev,
        { role: 'agent', text, time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) },
      ]);
      if (isVoiceAgent) speakTextChat(text);
    } finally {
      setAgentLoading(false);
    }
  };

  const selectAgent = (agent) => {
    setSelectedAgent(agent);
    setChatMessages([
      { role: 'agent', text: `Hola! Soy ${agent.name}, tu agente de ventas IA. Hoy he gestionado ${agent.conversationsToday} conversaciones. En que puedo ayudarte?`, time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) },
    ]);
  };

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

  const handlePlanChange = async (planId) => {
    if (!currentUser?.id || planId === currentUser?.activeSubscription?.plan_id) {
      return;
    }

    setIsChangingPlan(true);

    try {
      await changeSupplierPlan(planId);
      setToast({ message: 'Plan actualizado correctamente.', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'No se pudo actualizar el plan.', type: 'error' });
    } finally {
      setIsChangingPlan(false);
    }
  };

  const handlePrepareFlowBilling = async (planId) => {
    if (!currentUser?.id || !requestSupplierPlanBilling) return;
    if (pendingPlanRequest?.plan_id === planId) return;

    setIsPreparingBilling(true);

    try {
      await requestSupplierPlanBilling(planId);
      setToast({ message: 'Solicitud Flow preparada. Podras conectar checkout y webhooks cuando habilites tu cuenta.', type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'No se pudo preparar la solicitud de billing.', type: 'error' });
    } finally {
      setIsPreparingBilling(false);
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
      label: 'Quote Inbox',
      active: activeTab === 'quotes',
      onClick: () => setActiveTab('quotes'),
      badge: workspaceSummary.openRelevantQuotes,
    },
    {
      id: 'buyers',
      label: 'Compradores',
      active: activeTab === 'buyers',
      onClick: () => setActiveTab('buyers'),
      badge: buyerRelationships.length,
    },
    {
      id: 'agents',
      label: 'Agentes de Venta IA',
      active: activeTab === 'agents',
      onClick: () => setActiveTab('agents'),
      dot: hasAgentFeature,
    },
    {
      id: 'plan',
      label: 'Plan',
      active: activeTab === 'plan',
      onClick: () => setActiveTab('plan'),
      badge: currentPlanLabel,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] bg-grid">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {voiceCallActive && selectedAgent && (
        <VoiceCall
          agent={selectedAgent}
          profile={profile}
          onClose={() => setVoiceCallActive(false)}
          onToast={setToast}
        />
      )}

      {quoteModal && (
        <Modal title={`Cotizar -- ${quoteModal.productName}`} onClose={closeQuoteOfferModal}>
          <div className="bg-[#f8fafc] rounded-xl p-4 mb-5 text-sm space-y-1.5">
            <p><span className="font-medium text-gray-400 text-xs uppercase tracking-wide">Comprador</span><br /><span className="text-[#0D1F3C] font-semibold">{quoteModal.buyerName}</span></p>
            <p><span className="font-medium text-gray-400 text-xs uppercase tracking-wide">Producto</span><br /><span className="text-[#0D1F3C]">{quoteModal.productName}</span></p>
            <p><span className="font-medium text-gray-400 text-xs uppercase tracking-wide">Cantidad</span><br /><span className="text-[#0D1F3C]">{quoteModal.quantityLabel}</span></p>
            <p><span className="font-medium text-gray-400 text-xs uppercase tracking-wide">Entrega</span><br /><span className="text-[#0D1F3C]">{quoteModal.deliveryDateLabel}</span></p>
            <p><span className="font-medium text-gray-400 text-xs uppercase tracking-wide">Notas</span><br /><span className="text-[#0D1F3C]">{quoteModal.notes || 'Sin notas adicionales'}</span></p>
          </div>
          <form onSubmit={handleOfferSubmit} className="space-y-4">
            <div>
              <label htmlFor="offer-price" className="block text-sm font-medium text-gray-700 mb-1.5">
                Precio ofertado (CLP) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
                <input
                  id="offer-price"
                  type="number"
                  required
                  min="1"
                  placeholder="4.200"
                  value={offerForm.price}
                  onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                />
              </div>
            </div>
            <div>
              <label htmlFor="offer-lead-time" className="block text-sm font-medium text-gray-700 mb-1.5">
                Lead time estimado
              </label>
              <input
                id="offer-lead-time"
                type="text"
                placeholder="Ej: 48 horas, 3 dias habiles"
                value={offerForm.estimatedLeadTime}
                onChange={(e) => setOfferForm({ ...offerForm, estimatedLeadTime: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
              />
            </div>
            <div>
              <label htmlFor="offer-notes" className="block text-sm font-medium text-gray-700 mb-1.5">
                Notas adicionales
              </label>
              <textarea
                id="offer-notes"
                rows={3}
                placeholder="Ej: Disponibilidad inmediata. Entrega en 48hrs. Incluye flete a Santiago."
                value={offerForm.notes}
                onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 resize-none transition-all"
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
                {isSubmittingOffer ? 'Enviando...' : 'Enviar oferta'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {productDetail && (
        <Modal title={productDetail.name} onClose={() => setProductDetail(null)}>
          {/* Product image */}
          <div className={`relative h-56 rounded-xl ${productDetail.customImage ? '' : `bg-gradient-to-br ${productDetail.gradient}`} overflow-hidden mb-5`}>
            {productDetail.customImage ? (
              <img src={productDetail.customImage} alt={productDetail.imageAlt} className="w-full h-full object-cover" />
            ) : (
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
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-8xl filter drop-shadow-lg">{productDetail.emoji}</div>
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Imagen generada con IA
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#f8fafc] rounded-xl p-3.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Precio</span>
                <p className="text-lg font-extrabold text-[#0D1F3C] mt-0.5">{productDetail.price}</p>
              </div>
              <div className="bg-[#f8fafc] rounded-xl p-3.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Stock</span>
                <p className="text-lg font-extrabold text-[#0D1F3C] mt-0.5">{productDetail.stock}</p>
              </div>
              <div className="bg-[#f8fafc] rounded-xl p-3.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Categoria</span>
                <p className="text-sm font-semibold text-[#0D1F3C] mt-0.5">{productDetail.category}</p>
              </div>
              <div className="bg-[#f8fafc] rounded-xl p-3.5">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Estado</span>
                <p className={`text-sm font-semibold mt-0.5 ${productDetail.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {productDetail.status === 'active' ? 'Disponible' : 'Stock bajo'}
                </p>
              </div>
            </div>

            <div className="bg-[#f8fafc] rounded-xl p-3.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Descripcion</span>
              <p className="text-sm text-gray-700 mt-1 leading-relaxed">{productDetail.description}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => openEditProductModal(productDetail)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Editar
              </button>
              <button
                onClick={() => {
                  setProductDetail(null);
                  setToast({ message: 'Imagen regenerada con IA exitosamente', type: 'success' });
                }}
                className="flex-1 bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-400/20 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Regenerar imagen IA
              </button>
            </div>
          </div>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giro</label>
                  <input
                    type="text"
                    value={profileForm.giro}
                    onChange={(e) => setProfileForm({ ...profileForm, giro: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sitio web</label>
                  <input
                    type="text"
                    value={profileForm.website}
                    onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Categories section */}
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
                  value={selectedCategoryId || categoryOptions.find((category) => !profileForm.categories.includes(category.name))?.id || ''}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 bg-white transition-all"
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
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Categoria <span className="text-red-500">*</span>
              </label>
              <select
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] bg-white transition-all"
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
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                  />
                </div>
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Por</label>
                <select
                  value={productForm.priceUnit}
                  onChange={(e) => setProductForm({ ...productForm, priceUnit: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] bg-white transition-all"
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Unidad</label>
                <select
                  value={productForm.stockUnit}
                  onChange={(e) => setProductForm({ ...productForm, stockUnit: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] bg-white transition-all"
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
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 resize-none transition-all"
              />
            </div>

            {/* Image upload / AI generation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Foto del producto
              </label>

              {/* Toggle: Upload vs Generate */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                    imageMode === 'upload'
                      ? 'border-[#2ECAD5] bg-[#2ECAD5]/10 text-[#0D1F3C]'
                      : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-1.5">📁</span> Subir imagen
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('generate')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                    imageMode === 'generate'
                      ? 'border-purple-400 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-1.5">✨</span> Crear con IA
                </button>
              </div>

              {/* Preview of existing image */}
              {productForm.imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 mb-3">
                  <img
                    src={productForm.imagePreview}
                    alt="Vista previa"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => { removeProductImage(); setAiPrompt(''); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur-md text-white rounded-lg flex items-center justify-center hover:bg-black/70 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {productForm.image && (
                    <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-md text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                      {(productForm.image.size / 1024).toFixed(0)} KB
                    </div>
                  )}
                  {!productForm.image && (
                    <div className="absolute bottom-2 left-2 bg-purple-600/80 backdrop-blur-md text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                      ✨ Generada con IA
                    </div>
                  )}
                </div>
              ) : imageMode === 'upload' ? (
                /* Upload mode */
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#2ECAD5] hover:bg-[#2ECAD5]/5 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-2 pb-3">
                    <svg className="w-8 h-8 text-gray-300 group-hover:text-[#2ECAD5] transition-colors mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21zm14.25-15.75a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-400 group-hover:text-gray-600">Subir foto del producto</p>
                    <p className="text-[10px] text-gray-300 mt-1">JPG, PNG o WebP (max. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProductImage}
                    className="hidden"
                  />
                </label>
              ) : (
                /* AI Generate mode */
                <div className="border-2 border-dashed border-purple-200 rounded-xl p-4 bg-purple-50/50 space-y-3">
                  <p className="text-xs text-purple-600 font-medium">
                    Describe cómo quieres que se vea la imagen y la IA la creará por ti.
                  </p>
                  <textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ej: Caja de tomates cherry orgánicos frescos con gotas de agua, fondo blanco, iluminación de estudio..."
                    className="w-full border border-purple-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 resize-none transition-all bg-white"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Fondo blanco, estilo catálogo',
                      'Vista cenital, fondo oscuro',
                      'Estilo premium, elegante',
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setAiPrompt((prev) => prev ? `${prev}, ${tag.toLowerCase()}` : tag)}
                        className="text-[10px] px-2.5 py-1 rounded-full border border-purple-200 text-purple-500 hover:bg-purple-100 hover:border-purple-300 transition-all"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={aiLoading || !aiPrompt.trim()}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                      aiLoading || !aiPrompt.trim()
                        ? 'bg-purple-200 text-purple-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-purple-500/20'
                    }`}
                  >
                    {aiLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generando imagen...
                      </span>
                    ) : (
                      '✨ Generar imagen con IA'
                    )}
                  </button>
                </div>
              )}
              <p className="text-[10px] text-gray-400 mt-1.5">Opcional. Si no subes foto, se usará una imagen generada automáticamente.</p>
            </div>

            {/* Preview */}
            <div className="bg-[#f8fafc] rounded-xl p-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Vista previa</p>
              <div className="flex items-center gap-3">
                {productForm.imagePreview ? (
                  <img src={productForm.imagePreview} alt="Preview" className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className={`w-12 h-12 bg-gradient-to-br ${productGradients[products.length % productGradients.length]} rounded-xl flex items-center justify-center text-2xl`}>
                    {productEmojis[productForm.category] || '🍽️'}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-[#0D1F3C]">{productForm.name || 'Nombre del producto'}</p>
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
          className="fixed inset-0 z-50 flex items-start justify-center bg-[#0D1F3C]/50 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && setViewingBuyer(null)}
        >
          <div className="transform-gpu bg-[#f8fafc] rounded-2xl shadow-2xl shadow-[#0D1F3C]/20 w-full max-w-3xl my-8 animate-fade-in-up overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-[#0D1F3C] via-[#1a3260] to-[#0D1F3C] relative">
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
              <div className="w-20 h-20 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-2xl flex items-center justify-center text-[#2ECAD5] text-2xl font-extrabold border-4 border-white shadow-lg -mt-10 relative z-10">
                {viewingBuyer.initials}
              </div>
              <div className="mt-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0D1F3C]">{viewingBuyer.name}</h2>
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
                  { label: 'RFQs creadas', value: viewingBuyer.totalOrders, sub: '', icon: (
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
                      <span className="text-lg font-extrabold text-[#0D1F3C]">{s.value}</span>
                      {s.sub && <span className="text-[10px] text-gray-400">{s.sub}</span>}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <h4 className="text-sm font-bold text-[#0D1F3C] mb-3">Informacion del negocio</h4>
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
                        <span className="font-semibold text-[#0D1F3C] text-xs text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <h4 className="text-sm font-bold text-[#0D1F3C] mb-3">Contacto</h4>
                  <div className="space-y-2.5 text-sm">
                    {[
                      { label: 'Email', value: viewingBuyer.email },
                      { label: 'Telefono', value: viewingBuyer.phone },
                      { label: 'WhatsApp', value: viewingBuyer.whatsapp },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                        <span className="text-gray-400 text-xs">{item.label}</span>
                        <span className="font-semibold text-[#0D1F3C] text-xs">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#0D1F3C] mb-2">Categorias de interes</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingBuyer.categories.length > 0 ? (
                    viewingBuyer.categories.map((category) => (
                      <span key={category} className="text-xs font-medium bg-[#f0fdfa] text-[#0D1F3C] border border-[#2ECAD5]/20 px-3 py-1.5 rounded-lg">
                        {category}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">No hay categorias informadas por este comprador.</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#0D1F3C] mb-3">RFQ actual</h4>
                <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                  <div className="flex justify-between gap-3">
                    <span className="text-sm text-gray-400">Producto</span>
                    <span className="text-sm font-semibold text-[#0D1F3C] text-right">{viewingBuyer.quote.productName}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-sm text-gray-400">Cantidad</span>
                    <span className="text-sm font-semibold text-[#0D1F3C] text-right">{viewingBuyer.quote.quantityLabel}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-sm text-gray-400">Entrega</span>
                    <span className="text-sm font-semibold text-[#0D1F3C] text-right">{viewingBuyer.quote.deliveryDateLabel}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Notas</span>
                    <p className="text-sm text-[#0D1F3C] mt-1">{viewingBuyer.quote.notes || 'Sin notas adicionales.'}</p>
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
        badges={[{ label: `Plan ${currentPlanLabel}` }]}
        action={{
          onClick: () => navigate(currentUser?.is_buyer ? '/dashboard-comprador' : '/registro-comprador'),
          label: currentUser?.is_buyer ? 'Ir a comprador' : 'Activar comprador',
          className: 'flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-blue-500 text-[#0D1F3C] font-bold transition-all whitespace-nowrap hover:scale-[1.02] shadow-lg shadow-emerald-400/20 hover:shadow-emerald-400/40',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          ),
        }}
        tabs={headerTabs}
        accentBlobClass="bg-[#2ECAD5]/5"
      />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ===== PROFILE TAB ===== */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            {/* Profile header card */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden card-premium">
              {/* Cover / banner */}
              <div className="h-32 bg-gradient-to-r from-[#0D1F3C] via-[#1a3260] to-[#0D1F3C] relative">
                <div className="absolute inset-0 bg-grid opacity-20" />
                <div className="absolute top-4 right-4 w-40 h-40 bg-[#2ECAD5]/10 rounded-full blur-[60px]" />
              </div>
              <div className="px-6 pb-6 relative">
                {/* Avatar */}
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl flex items-center justify-center text-white text-3xl font-extrabold border-4 border-white shadow-lg -mt-12 relative z-10">
                  {profile.companyName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="mt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#0D1F3C]">{profile.companyName}</h2>
                    <p className="text-gray-500 text-sm mt-1">{profile.description}</p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="text-xs font-bold bg-gradient-to-r from-emerald-400 to-blue-500 text-white px-3 py-1 rounded-full">Plan {currentPlanLabel}</span>
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
                { label: 'Valoracion', value: insightsLoading ? '--' : supplierRatingLabel, sub: `/ 5.0 · ${supplierStats.totalReviews || 0} resenas`, icon: (
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )},
                { label: 'Ofertas aceptadas', value: workspaceSummary.acceptedOffers, sub: `${workspaceSummary.submittedOffers} enviadas`, icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                )},
                { label: 'Tasa de respuesta', value: workspaceSummary.responseRateLabel, sub: `${workspaceSummary.opportunityCount} oportunidades`, icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )},
                { label: 'Clientes recurrentes', value: supplierStats.recurringClients, sub: `${workspaceSummary.activeBuyers} compradores activos`, icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                )},
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 card-premium">
                  <div className="w-9 h-9 bg-[#f8fafc] rounded-xl flex items-center justify-center text-gray-400 mb-3">
                    {s.icon}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-[#0D1F3C]">{s.value}</span>
                    <span className="text-xs text-gray-400">{s.sub}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company info */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 card-premium">
                <h3 className="text-lg font-extrabold text-[#0D1F3C] mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
                        <span className="text-sm font-semibold text-[#0D1F3C]">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 card-premium">
              <h3 className="text-lg font-extrabold text-[#0D1F3C] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
                Categorias que ofrezco
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.categories.map((cat) => (
                  <span key={cat} className="text-sm font-medium bg-[#f0fdfa] text-[#0D1F3C] border border-[#2ECAD5]/20 px-4 py-2 rounded-xl">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Recent reviews */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 card-premium">
              <h3 className="text-lg font-extrabold text-[#0D1F3C] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                Resenas recientes
              </h3>
              {insightsLoading ? (
                <div className="rounded-2xl bg-[#f8fafc] px-4 py-6 text-sm text-gray-400">
                  Cargando resenas...
                </div>
              ) : profileReviews.length ? (
                <div className="space-y-4">
                  {profileReviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-xl flex items-center justify-center text-white text-xs font-bold">
                            {review.buyer.charAt(0)}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-[#0D1F3C]">
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
                <div className="rounded-2xl bg-[#f8fafc] px-4 py-6 text-sm text-gray-400">
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
                { label: 'RFQs abiertas', value: workspaceSummary.openRelevantQuotes, color: 'text-[#0D1F3C]' },
                { label: 'Ofertas enviadas', value: workspaceSummary.submittedOffers, color: 'text-[#2ECAD5]' },
                { label: 'Ofertas aceptadas', value: workspaceSummary.acceptedOffers, color: 'text-emerald-500' },
                { label: 'Win rate', value: workspaceSummary.winRateLabel, color: 'text-indigo-500' },
                { label: 'Tasa de respuesta', value: workspaceSummary.responseRateLabel, color: 'text-amber-500' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-6 card-premium">
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">{stat.label}</div>
                  <div className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-[#0D1F3C]">Inbox de RFQs</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">{openQuotes.length} solicitudes abiertas</span>
              </div>

              {quotesLoading ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
                  Cargando RFQs...
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
                            <tr key={quote.id} className="hover:bg-[#f8fafc] transition-colors">
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => openBuyerSummary(quote)}
                                  disabled={loadingBuyerId === quote.buyerId}
                                  className="flex items-center gap-3 group/buyer disabled:opacity-60"
                                >
                                  <div className="w-9 h-9 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-lg flex items-center justify-center text-[#2ECAD5] text-xs font-bold">
                                    {quote.buyerName.charAt(0)}
                                  </div>
                                  <span className="font-semibold text-[#0D1F3C] text-sm group-hover/buyer:text-[#2ECAD5] transition-colors underline decoration-transparent group-hover/buyer:decoration-[#2ECAD5]">
                                    {loadingBuyerId === quote.buyerId ? 'Cargando...' : quote.buyerName}
                                  </span>
                                </button>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-semibold text-[#0D1F3C]">{quote.productName}</p>
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
                                  </div>
                                ) : (
                                  entitlements.canRespondToQuotes ? (
                                    <button
                                      onClick={() => openQuoteOfferModal(quote)}
                                      className="bg-gradient-to-r from-emerald-400 to-blue-500 hover:shadow-lg hover:shadow-emerald-400/20 text-[#0D1F3C] font-bold text-sm px-4 py-2 rounded-lg transition-all"
                                    >
                                      Cotizar
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => setActiveTab('plan')}
                                      className="bg-gray-100 text-gray-500 font-bold text-sm px-4 py-2 rounded-lg transition-all"
                                    >
                                      Limite del plan
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
                                className="font-bold text-[#0D1F3C] hover:text-[#2ECAD5] transition-colors text-left disabled:opacity-60"
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
                                  onClick={() => setActiveTab('plan')}
                                  className="bg-gray-100 text-gray-500 font-bold text-sm px-4 py-2 rounded-lg transition-all"
                                >
                                  Limite del plan
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
                  <h3 className="text-lg font-bold text-[#0D1F3C]">No hay RFQs abiertas ahora mismo</h3>
                  <p className="text-sm text-gray-400 mt-2">Cuando un comprador publique una necesidad, aparecerá en este inbox.</p>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-[#0D1F3C]">Mis ofertas</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">{supplierOffers.length} ofertas enviadas</span>
              </div>

              {supplierOffers.length > 0 ? (
                <div className="space-y-3">
                  {supplierOffers.map((offer) => (
                    <div key={offer.id} className="bg-white rounded-2xl border border-gray-100 p-5 card-premium">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-[#0D1F3C]">{offer.quote?.productName || 'RFQ'}</h3>
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
                          <p className="text-sm text-gray-400 mt-1">Lead time: {offer.estimatedLeadTime}</p>
                          <p className="text-sm text-gray-600 mt-3">{offer.notes || 'Sin notas adicionales.'}</p>
                        </div>
                        <div className="lg:text-right">
                          <div className="text-2xl font-extrabold text-[#0D1F3C]">{offer.priceLabel}</div>
                          <div className="text-xs text-gray-400 mt-1">{offer.createdAtLabel}</div>
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
                                className="min-w-[180px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-[#0D1F3C] focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 disabled:opacity-60"
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
                  <h3 className="text-lg font-bold text-[#0D1F3C]">Todavia no envias ofertas</h3>
                  <p className="text-sm text-gray-400 mt-2">Abre una RFQ del inbox y responde con precio, notas y lead time.</p>
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
                { label: 'Productos activos', value: products.filter(p => p.status === 'active').length, color: 'text-emerald-500' },
                { label: 'Stock bajo', value: products.filter(p => p.status === 'low_stock').length, color: 'text-amber-500' },
                { label: 'Categorias', value: [...new Set(products.map(p => p.category))].length, color: 'text-[#2ECAD5]' },
                { label: 'Total productos', value: products.length, color: 'text-[#0D1F3C]' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 card-premium">
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">{s.label}</div>
                  <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Section header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-[#0D1F3C]">Catalogo de productos</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Imagenes generadas con IA (Nano Banana Pro 2) / {formatLimitLabel(entitlements.productLimit, 'productos')}
                </p>
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
                {entitlements.canCreateProduct ? 'Agregar producto' : 'Limite del plan'}
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
                  <div className={`relative h-48 ${product.customImage ? '' : `bg-gradient-to-br ${product.gradient}`} overflow-hidden`}>
                    {product.customImage ? (
                      <img src={product.customImage} alt={product.imageAlt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
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
                        {/* Central product emoji */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-7xl filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-500">
                            {product.emoji}
                          </div>
                        </div>
                      </>
                    )}
                    {/* Badge */}
                    <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      {product.customImage ? (
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
                          IA Gen
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
                        <h3 className="font-bold text-[#0D1F3C] text-sm group-hover:text-[#2ECAD5] transition-colors">{product.name}</h3>
                        <span className="text-xs text-gray-400">{product.category}</span>
                      </div>
                      <span className="text-lg font-extrabold text-[#0D1F3C]">{product.price}</span>
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
                        <span className="text-xs font-semibold text-[#2ECAD5] group-hover:underline">Ver detalle →</span>
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
                { label: 'Compradores activos', value: workspaceSummary.activeBuyers, color: 'text-[#0D1F3C]' },
                { label: 'Clientes ganados', value: buyerRelationships.filter((buyer) => buyer.acceptedOffers > 0).length, color: 'text-emerald-500' },
                { label: 'Seguimientos abiertos', value: buyerRelationships.filter((buyer) => buyer.pendingOffers > 0).length, color: 'text-amber-500' },
                { label: 'Favoritos buyer-side', value: supplierStats.recurringClients, color: 'text-[#2ECAD5]' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-6 card-premium">
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">{stat.label}</div>
                  <div className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</div>
                </div>
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
                            <h3 className="text-base font-bold text-[#0D1F3C] hover:text-[#2ECAD5] transition-colors">
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
                            <span key={category} className="text-xs font-medium bg-[#f8fafc] text-gray-500 px-3 py-1 rounded-full border border-gray-100">
                              {category}
                            </span>
                          )) : (
                            <span className="text-xs font-medium bg-[#f8fafc] text-gray-400 px-3 py-1 rounded-full border border-gray-100">
                              Sin categorias aun
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center min-w-[280px]">
                        <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
                          <div className="text-xl font-extrabold text-[#0D1F3C]">{buyer.openRfqs}</div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-1">RFQs abiertas</div>
                        </div>
                        <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
                          <div className="text-xl font-extrabold text-[#2ECAD5]">{buyer.submittedOffers}</div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-1">Ofertas</div>
                        </div>
                        <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
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
                <h3 className="text-lg font-bold text-[#0D1F3C]">Todavia no tienes relaciones buyer activas</h3>
                <p className="text-sm text-gray-400 mt-2">A medida que respondas RFQs relevantes y cierres ofertas, este espacio se convierte en tu cartera comercial.</p>
              </div>
            )}
          </div>
        )}

        {/* ===== PLAN TAB ===== */}
        {activeTab === 'plan' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 xl:grid-cols-[1.3fr,0.7fr] gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 card-premium">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#2ECAD5]">Workspace activo</span>
                    <h2 className="text-2xl font-extrabold text-[#0D1F3C] mt-2">
                      Plan {currentPlanCard?.name ?? currentPlanLabel}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2 max-w-2xl">
                      Este plan gobierna acceso a agentes IA, voz y capacidades operativas del panel supplier. Puedes seguir usando activacion interna para desarrollo, y en paralelo dejar preparado el billing con Flow.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#0D1F3C] px-5 py-4 text-white min-w-[180px]">
                    <div className="text-xs uppercase tracking-wide text-white/60">Precio referencial</div>
                    <div className="text-2xl font-extrabold mt-1">{currentPlanCard?.price ?? '$0'}</div>
                    <div className="text-xs text-white/60 mt-1">{currentPlanCard?.period ?? '/mes'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
                  {[
                    { label: 'Agents IA', enabled: Boolean(currentPlanDetails?.has_agents) },
                    { label: 'Voice IA', enabled: Boolean(currentPlanDetails?.has_voice_calls) },
                    { label: 'CRM / export', enabled: Boolean(currentPlanDetails?.has_crm) },
                    { label: 'API', enabled: Boolean(currentPlanDetails?.has_api) },
                  ].map((feature) => (
                    <div key={feature.label} className={`rounded-2xl border px-4 py-4 ${feature.enabled ? 'border-emerald-100 bg-emerald-50' : 'border-gray-100 bg-[#f8fafc]'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#0D1F3C]">{feature.label}</span>
                        <span className={`w-2.5 h-2.5 rounded-full ${feature.enabled ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                      </div>
                      <p className={`text-xs mt-2 ${feature.enabled ? 'text-emerald-700' : 'text-gray-400'}`}>
                        {feature.enabled ? 'Disponible ahora' : 'Bloqueado en este plan'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6 card-premium">
                <h3 className="text-lg font-extrabold text-[#0D1F3C]">Impacto del plan</h3>
                <div className="space-y-4 mt-4">
                  <div className="rounded-2xl bg-[#f8fafc] px-4 py-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Productos activos</div>
                    <div className="text-2xl font-extrabold text-[#0D1F3C] mt-1">{usageSummary.activeProducts}</div>
                    <div className="text-xs text-gray-400 mt-1">{formatLimitLabel(entitlements.productLimit, 'productos')}</div>
                  </div>
                  <div className="rounded-2xl bg-[#f8fafc] px-4 py-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">RFQs respondidas</div>
                    <div className="text-2xl font-extrabold text-emerald-500 mt-1">{usageSummary.quoteResponsesThisMonth}</div>
                    <div className="text-xs text-gray-400 mt-1">{formatLimitLabel(entitlements.quoteResponseLimit, 'RFQs')}</div>
                  </div>
                  <div className="rounded-2xl bg-[#f8fafc] px-4 py-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Conversaciones IA</div>
                    <div className="text-2xl font-extrabold text-[#2ECAD5] mt-1">{usageSummary.aiConversationsThisMonth}</div>
                    <div className="text-xs text-gray-400 mt-1">{formatLimitLabel(entitlements.aiConversationLimit, 'conversaciones')}</div>
                  </div>
                  <div className="rounded-2xl bg-[#f8fafc] px-4 py-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Llamadas voz</div>
                    <div className="text-2xl font-extrabold text-indigo-500 mt-1">{usageSummary.voiceCallsThisMonth}</div>
                    <div className="text-xs text-gray-400 mt-1">{formatLimitLabel(entitlements.voiceCallLimit, 'llamadas')}</div>
                  </div>
                  {usageLoading && <div className="text-xs text-gray-400">Actualizando uso mensual...</div>}
                </div>

                <div className="mt-5 rounded-2xl border border-dashed border-[#2ECAD5]/30 bg-[#f0fdfa] px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-[#2ECAD5]">Billing Flow</div>
                      <div className="text-sm font-bold text-[#0D1F3C] mt-1">
                        {pendingPlanRequest
                          ? `Solicitud pendiente para Plan ${pendingPlanRequest.plans?.name ?? pendingPlanRequest.plan_id}`
                          : 'Aun no hay una solicitud de cobro preparada'}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {pendingPlanRequest
                          ? `Referencia ${pendingPlanRequest.billing_reference ?? 'sin referencia'} · estado ${pendingPlanRequest.billing_status ?? 'pendiente'}`
                          : 'Cuando abras tu cuenta en Flow, este bloque servira para conectar checkout, referencia y webhook sin rehacer la logica de planes.'}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full ${
                      pendingPlanRequest ? 'bg-amber-300 text-amber-950' : 'bg-white text-gray-500 border border-gray-200'
                    }`}>
                      {pendingPlanRequest ? 'Pendiente' : 'Placeholder'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {planCards.map((plan) => {
                const isCurrent = plan.key === currentPlanKey;
                const hasPendingFlowRequest = pendingPlanRequest?.plan_id === plan.id;

                return (
                  <div key={plan.id} className={`rounded-2xl border p-6 ${isCurrent ? 'border-[#2ECAD5] bg-[#2ECAD5]/5 shadow-lg shadow-emerald-400/10' : 'border-gray-100 bg-white card-premium'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-extrabold text-[#0D1F3C]">{plan.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{plan.price}{plan.period}</p>
                      </div>
                      {isCurrent ? (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-emerald-400 text-emerald-950">
                          Actual
                        </span>
                      ) : hasPendingFlowRequest ? (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full bg-amber-300 text-amber-950">
                          Flow pendiente
                        </span>
                      ) : null}
                    </div>

                    <div className="space-y-3 mt-5">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#2ECAD5]" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-5">
                      <div className="rounded-xl bg-[#f8fafc] px-3 py-2">
                        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Productos</div>
                        <div className="text-sm font-bold text-[#0D1F3C] mt-1">{plan.maxActiveProducts ?? 'Ilimitado'}</div>
                      </div>
                      <div className="rounded-xl bg-[#f8fafc] px-3 py-2">
                        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">RFQs / mes</div>
                        <div className="text-sm font-bold text-[#0D1F3C] mt-1">{plan.maxQuoteResponsesPerMonth ?? 'Ilimitado'}</div>
                      </div>
                    </div>

                    <div className="space-y-2 mt-5">
                      <button
                        type="button"
                        disabled={isCurrent || isChangingPlan}
                        onClick={() => handlePlanChange(plan.id)}
                        className={`w-full rounded-xl py-3 text-sm font-bold transition-all ${
                          isCurrent
                            ? 'bg-gray-100 text-gray-400 cursor-default'
                            : 'bg-gradient-to-r from-emerald-400 to-blue-500 text-[#0D1F3C] hover:shadow-lg hover:shadow-emerald-400/20'
                        } ${isChangingPlan ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {isCurrent ? 'Plan actual' : isChangingPlan ? 'Actualizando...' : `Cambiar a ${plan.name}`}
                      </button>

                      {!isCurrent && (
                        <button
                          type="button"
                          disabled={isPreparingBilling || hasPendingFlowRequest}
                          onClick={() => handlePrepareFlowBilling(plan.id)}
                          className={`w-full rounded-xl py-3 text-sm font-semibold border transition-all ${
                            hasPendingFlowRequest
                              ? 'border-amber-200 bg-amber-50 text-amber-700 cursor-default'
                              : 'border-[#2ECAD5]/30 text-[#0D1F3C] hover:bg-[#2ECAD5]/5'
                          } ${isPreparingBilling ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {hasPendingFlowRequest ? 'Flow pendiente para este plan' : isPreparingBilling ? 'Preparando Flow...' : 'Preparar pago con Flow'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== AGENTS TAB ===== */}
        {activeTab === 'agents' && (
          <div className="animate-fade-in">
            {!hasAgentFeature ? (
              /* Upgrade CTA */
              <div className="max-w-lg mx-auto text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-[#2ECAD5]/10 to-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-extrabold text-[#0D1F3C] mb-3">Agentes de Venta IA</h3>
                <p className="text-gray-500 mb-6 leading-relaxed">
                  Automatiza tus ventas con agentes inteligentes que contactan prospectos por WhatsApp, email y llamadas.
                  Disponible en planes <strong className="text-[#0D1F3C]">Pro</strong> y <strong className="text-[#0D1F3C]">Enterprise</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('plan')}
                  className="bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-400/20 hover:scale-[1.02]"
                >
                  Actualizar a Pro
                </button>
              </div>
            ) : !hasAgentAccess ? (
              <div className="max-w-lg mx-auto text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-200/60 to-orange-300/60 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 6.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-extrabold text-[#0D1F3C] mb-3">Límite mensual de IA alcanzado</h3>
                <p className="text-gray-500 mb-6 leading-relaxed">
                  Ya consumiste las conversaciones IA disponibles para este ciclo. Puedes seguir usando RFQ y catálogo, o cambiar de plan para ampliar el cupo.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('plan')}
                  className="bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-400/20 hover:scale-[1.02]"
                >
                  Ver plan y cupos
                </button>
              </div>
            ) : (
              /* Agents Panel */
              <div className="space-y-6">
                {/* Agent stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Agentes activos', value: salesAgents.filter(a => a.status === 'active').length, color: 'text-emerald-500' },
                    { label: 'Conversaciones hoy', value: salesAgents.reduce((acc, a) => acc + a.conversationsToday, 0), color: 'text-[#0D1F3C]' },
                    { label: 'Conversiones semana', value: salesAgents.reduce((acc, a) => acc + a.conversionsThisWeek, 0), color: 'text-[#2ECAD5]' },
                    { label: 'Satisfaccion promedio', value: '93%', color: 'text-amber-500' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 card-premium">
                      <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">{s.label}</div>
                      <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Agent list */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">Tus agentes</h3>
                    {salesAgents.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => selectAgent(agent)}
                        className={`w-full text-left rounded-2xl border p-5 transition-all ${
                          selectedAgent?.id === agent.id
                            ? 'border-[#2ECAD5] bg-[#2ECAD5]/5 shadow-lg shadow-emerald-400/10'
                            : 'border-gray-100 bg-white hover:border-gray-200 card-premium'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                            agent.status === 'active'
                              ? 'bg-gradient-to-br from-emerald-400 to-blue-500 text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}>
                            {agent.avatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#0D1F3C] text-sm">{agent.name}</span>
                              <span className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                            </div>
                            <span className="text-xs text-gray-400">{agent.type}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-sm font-bold text-[#0D1F3C]">{agent.conversationsToday}</div>
                            <div className="text-[10px] text-gray-400">Hoy</div>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#2ECAD5]">{agent.conversionsThisWeek}</div>
                            <div className="text-[10px] text-gray-400">Conv.</div>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-amber-500">{agent.satisfaction}</div>
                            <div className="text-[10px] text-gray-400">Satisf.</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Agent detail + chat */}
                  <div className="lg:col-span-2">
                    {!selectedAgent ? (
                      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center h-full flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-[#f8fafc] rounded-2xl flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                          </svg>
                        </div>
                        <p className="text-gray-400 text-sm">Selecciona un agente para ver su actividad e interactuar</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col" style={{ minHeight: '520px' }}>
                        {/* Agent header */}
                        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between bg-[#f8fafc]">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                              selectedAgent.status === 'active'
                                ? 'bg-gradient-to-br from-emerald-400 to-blue-500 text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}>
                              {selectedAgent.avatar}
                            </div>
                            <div>
                              <div className="font-bold text-[#0D1F3C] text-sm">{selectedAgent.name}</div>
                              <div className="text-xs text-gray-400">{selectedAgent.type} / {selectedAgent.lastActivity}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isVoiceAgent && selectedAgent.status === 'active' && entitlements.hasVoiceCalls && (
                              <button
                                onClick={() => {
                                  if (!hasVoiceAccess) {
                                    setToast({ message: 'Ya agotaste el cupo mensual de voz disponible en tu plan.', type: 'error' });
                                    setActiveTab('plan');
                                    return;
                                  }

                                  setVoiceCallActive(true);
                                }}
                                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                                  hasVoiceAccess
                                    ? 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200'
                                    : 'bg-gray-100 text-gray-400 border-gray-200'
                                }`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                </svg>
                                {hasVoiceAccess ? 'Llamar' : 'Sin cupo'}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setToast({
                                  message: selectedAgent.status === 'active'
                                    ? `${selectedAgent.name} pausado`
                                    : `${selectedAgent.name} activado`,
                                  type: 'info',
                                });
                              }}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                                selectedAgent.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              {selectedAgent.status === 'active' ? 'Activo' : 'Pausado'}
                            </button>
                          </div>
                        </div>

                        {/* Recent conversations */}
                        <div className="border-b border-gray-100 px-6 py-3">
                          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Conversaciones recientes</div>
                          <div className="space-y-2">
                            {selectedAgent.recentConversations.map((conv) => (
                              <div key={conv.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[#f8fafc] transition-colors">
                                <div className="w-7 h-7 bg-[#0D1F3C]/5 rounded-lg flex items-center justify-center flex-shrink-0">
                                  {conv.channel === 'WhatsApp' ? (
                                    <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.118.549 4.107 1.511 5.839L.057 23.7a.5.5 0 00.608.612l5.961-1.529A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.978 0-3.83-.562-5.397-1.534l-.386-.232-4.005 1.028 1.047-3.925-.254-.403A9.96 9.96 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                                  ) : conv.channel === 'Email' ? (
                                    <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                                  ) : (
                                    <svg className="w-3.5 h-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-[#0D1F3C]">{conv.contact}</span>
                                    <span className="text-[10px] text-gray-400">{conv.time}</span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{conv.message}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Chat area */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3" style={{ maxHeight: '220px' }}>
                          {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                                msg.role === 'user'
                                  ? 'bg-[#0D1F3C] text-white rounded-br-md'
                                  : 'bg-[#f0fafb] text-[#0D1F3C] border border-[#2ECAD5]/20 rounded-bl-md'
                              }`}>
                                <p>{msg.text}</p>
                                <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-gray-400' : 'text-gray-400'}`}>{msg.time}</p>
                              </div>
                            </div>
                          ))}
                          {agentLoading && (
                            <div className="flex justify-start">
                              <div className="bg-[#f0fafb] border border-[#2ECAD5]/20 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-[#2ECAD5] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-[#2ECAD5] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-[#2ECAD5] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Speaking indicator */}
                        {isSpeaking && isVoiceAgent && (
                          <div className="border-t border-[#2ECAD5]/20 bg-[#f0fafb] px-4 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-[#2ECAD5] font-semibold">
                              <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                              </svg>
                              Carlos esta hablando...
                            </div>
                            <button
                              type="button"
                              onClick={stopSpeakingChat}
                              className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors"
                            >
                              Detener
                            </button>
                          </div>
                        )}

                        {/* Chat input */}
                        <form onSubmit={handleAgentChat} className="border-t border-gray-100 px-4 py-3 flex items-center gap-2">
                          {isVoiceAgent && (
                            <button
                              type="button"
                              onClick={toggleListening}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                                isListening
                                  ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                                  : 'bg-purple-50 text-purple-500 hover:bg-purple-100 border border-purple-200'
                              }`}
                              title={isListening ? 'Detener grabacion' : 'Hablar con Carlos'}
                            >
                              {isListening ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                                </svg>
                              )}
                            </button>
                          )}
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder={isListening ? 'Escuchando...' : isVoiceAgent ? 'Escribe o usa el microfono...' : `Mensaje a ${selectedAgent.name}...`}
                            className={`flex-1 bg-[#f8fafc] border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all ${isListening ? 'border-red-300 bg-red-50/50' : 'border-gray-100'}`}
                          />
                          <button
                            type="submit"
                            disabled={agentLoading}
                            className={`w-10 h-10 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-xl flex items-center justify-center text-[#0D1F3C] transition-all flex-shrink-0 ${agentLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-emerald-400/20'}`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
