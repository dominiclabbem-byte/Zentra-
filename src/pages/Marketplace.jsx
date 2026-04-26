import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
  Grid2X2,
  Heart,
  LayoutGrid,
  Package,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import AuthChoiceModal from '../components/AuthChoiceModal';
import ExternalContactValue from '../components/ExternalContactValue';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import {
  buildSupplierProfileView,
  formatMemberSince,
  formatPlanName,
  getPlanKey,
  normalizeUserRecord,
} from '../lib/profileAdapters';

import { mapProductRecordToCard } from '../lib/productAdapters';
import { getProducts, getPriceAlerts, getPriceAlertSubscriptions, getSupplierProfile, getSupplierStats } from '../services/database';

let marketplaceCatalogCache = null;
let marketplaceCatalogPromise = null;

function isMarketplacePerfDebugEnabled() {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem('DEBUG_MARKETPLACE_PERF') === '1';
  } catch {
    return false;
  }
}

function logMarketplacePerf(message, payload) {
  if (!isMarketplacePerfDebugEnabled()) return;
  if (payload === undefined) {
    console.log(`[perf][marketplace] ${message}`);
  } else {
    console.log(`[perf][marketplace] ${message}`, payload);
  }
}

export default function Marketplace() {
  const navigate = useNavigate();
  const { categories: categoryOptions, currentUser } = useAuth();
  const [toast, setToast] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [supplierInsights] = useState({});
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [supplierFilter, setSupplierFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingSupplier, setViewingSupplier] = useState(null);
  const [openingSupplierId, setOpeningSupplierId] = useState('');
  const [alertSubscriptions, setAlertSubscriptions] = useState([]);
  const [priceAlerts, setPriceAlerts] = useState([]);
  const catalogPerfRef = useRef({
    mountAt: typeof performance !== 'undefined' ? performance.now() : 0,
    catalogFetchStartedAt: 0,
    catalogFetchCompletedAt: 0,
    catalogMappedAt: 0,
    catalogPainted: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setCatalogLoading(true);
      catalogPerfRef.current.catalogFetchStartedAt = performance.now();
      logMarketplacePerf('catalog fetch start');

      try {
        if (marketplaceCatalogCache) {
          if (!cancelled) {
            setCatalogProducts(marketplaceCatalogCache);
          }
          return;
        }

        if (!marketplaceCatalogPromise) {
          marketplaceCatalogPromise = (async () => {
            const data = await getProducts({ lite: true });
            const fetchCompletedAt = performance.now();
            catalogPerfRef.current.catalogFetchCompletedAt = fetchCompletedAt;
            logMarketplacePerf('catalog fetch complete', {
              durationMs: Number((fetchCompletedAt - catalogPerfRef.current.catalogFetchStartedAt).toFixed(2)),
              productCount: data.length,
            });

            const mapStartedAt = performance.now();
            const cards = data.map((product) => mapProductRecordToCard(product));
            const mapCompletedAt = performance.now();
            catalogPerfRef.current.catalogMappedAt = mapCompletedAt;
            logMarketplacePerf('catalog map complete', {
              durationMs: Number((mapCompletedAt - mapStartedAt).toFixed(2)),
            });

            marketplaceCatalogCache = cards;
            return cards;
          })();
        }

        const cards = await marketplaceCatalogPromise;
        const fetchCompletedAt = performance.now();
        if (!catalogPerfRef.current.catalogFetchCompletedAt) {
          catalogPerfRef.current.catalogFetchCompletedAt = fetchCompletedAt;
        }

        if (!cancelled) {
          setCatalogProducts(cards);
        }
      } catch (error) {
        marketplaceCatalogPromise = null;
        if (!cancelled) {
          setToast({ message: error.message || 'No se pudo cargar el marketplace.', type: 'error' });
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
    if (!currentUser?.id || !currentUser?.is_buyer) return undefined;

    let cancelled = false;

    const loadAlertSignals = () => {
      const startedAt = performance.now();
      logMarketplacePerf('buyer alert signals start');
      Promise.all([
        getPriceAlertSubscriptions(currentUser.id),
        getPriceAlerts(currentUser.id),
      ]).then(([subs, alerts]) => {
        if (cancelled) return;
        setAlertSubscriptions(subs);
        setPriceAlerts(alerts);
        logMarketplacePerf('buyer alert signals complete', {
          durationMs: Number((performance.now() - startedAt).toFixed(2)),
          subscriptions: subs.length,
          alerts: alerts.length,
        });
      }).catch(() => {});
    };

    const idleHandle = typeof window !== 'undefined' && 'requestIdleCallback' in window
      ? window.requestIdleCallback(loadAlertSignals, { timeout: 1500 })
      : window.setTimeout(loadAlertSignals, 250);

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window && typeof idleHandle === 'number') {
        window.cancelIdleCallback(idleHandle);
      } else {
        window.clearTimeout(idleHandle);
      }
    };
  }, [currentUser?.id, currentUser?.is_buyer]);

  const supplierOptions = useMemo(
    () => ['Todos', ...new Set(catalogProducts.map((product) => product.supplierName).filter(Boolean))],
    [catalogProducts],
  );
  const categoryFilters = useMemo(
    () => ['Todos', ...categoryOptions.map((category) => category.name)],
    [categoryOptions],
  );

  const catalogPriceSignalMap = useMemo(() => {
    const map = new Map();
    priceAlerts.forEach((alert) => {
      if (!alert.product_id) return;
      const existing = map.get(alert.product_id);
      if (!existing || new Date(alert.created_at) > new Date(existing.created_at)) {
        const isDown = alert.direction === 'down';
        map.set(alert.product_id, {
          change: alert.direction ?? 'down',
          currentPrice: `$${Number(alert.new_price).toLocaleString('es-CL')}`,
          previousPrice: `$${Number(alert.old_price).toLocaleString('es-CL')}`,
          impactLabel: isDown ? 'Mejor oportunidad' : 'Precio al alza',
          signalLabel: isDown ? 'Precio a la baja' : 'Precio al alza',
          dateLabel: new Date(alert.created_at).toLocaleDateString('es-CL'),
          createdAt: alert.created_at,
        });
      }
    });
    return map;
  }, [priceAlerts]);

  const trackedAlertTargets = useMemo(() => ({
    productIds: new Set(alertSubscriptions.filter((s) => s.product_id).map((s) => s.product_id)),
    categoryIds: new Set(alertSubscriptions.filter((s) => !s.product_id && s.category_id).map((s) => s.category_id)),
  }), [alertSubscriptions]);

  const catalogProductsWithSignals = useMemo(() => catalogProducts.map((product) => ({
    ...product,
    recentPriceAlert: catalogPriceSignalMap.get(product.id) ?? null,
    hasTrackedPriceAlert: trackedAlertTargets.productIds.has(product.id) || trackedAlertTargets.categoryIds.has(product.categoryId),
  })), [catalogPriceSignalMap, catalogProducts, trackedAlertTargets]);

  const filteredProducts = useMemo(() => {
    const startedAt = performance.now();
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const result = catalogProductsWithSignals.filter((product) => {
      const matchesCategory = categoryFilter === 'Todos' || product.category === categoryFilter;
      const matchesSupplier = supplierFilter === 'Todos' || product.supplierName === supplierFilter;
      const matchesSearch = !normalizedSearch
        || product.name.toLowerCase().includes(normalizedSearch)
        || product.category.toLowerCase().includes(normalizedSearch)
        || product.supplierName.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSupplier && matchesSearch;
    });
    const completedAt = performance.now();

    if (catalogProductsWithSignals.length > 0) {
      logMarketplacePerf('filter products complete', {
        durationMs: Number((completedAt - startedAt).toFixed(2)),
        totalProducts: catalogProductsWithSignals.length,
        filteredProducts: result.length,
      });
    }

    return result;
  }, [catalogProductsWithSignals, categoryFilter, supplierFilter, searchTerm]);

  useEffect(() => {
    if (!catalogLoading && catalogProducts.length > 0 && !catalogPerfRef.current.catalogPainted) {
      catalogPerfRef.current.catalogPainted = true;
      logMarketplacePerf('catalog first paint ready', {
        sinceMountMs: Number((performance.now() - catalogPerfRef.current.mountAt).toFixed(2)),
        sinceFetchStartMs: Number((performance.now() - catalogPerfRef.current.catalogFetchStartedAt).toFixed(2)),
        productCount: catalogProducts.length,
      });
    }
  }, [catalogLoading, catalogProducts.length]);

  const openSupplierFromProduct = async (product) => {
    setOpeningSupplierId(product.id);

    try {
      const [supplierRaw, supplierStats] = await Promise.all([
        getSupplierProfile(product.supplierId),
        getSupplierStats(product.supplierId),
      ]);
      const supplierRecord = normalizeUserRecord(supplierRaw);
      const supplierView = buildSupplierProfileView(supplierRecord);
      const supplierInsight = supplierInsights[product.supplierId];

      setViewingSupplier({
        initials: supplierView.initials,
        name: supplierView.companyName,
        description: supplierView.description,
        plan: formatPlanName(getPlanKey(supplierRecord)),
        verified: supplierRecord?.verified,
        verificationStatus: supplierRecord?.verification_status ?? supplierInsight?.verificationStatus ?? 'pending',
        memberSince: formatMemberSince(supplierRecord?.created_at),
        rating: Number(supplierStats?.rating ?? supplierInsight?.rating ?? 0),
        totalReviews: supplierStats?.totalReviews ?? supplierInsight?.totalReviews ?? 0,
        responseRate: `${supplierView.responseRate || 0}%`,
        rut: supplierView.rut,
        city: supplierView.city,
        address: supplierView.address,
        giro: supplierView.giro,
        email: supplierView.email,
        phone: supplierView.phone,
        whatsapp: supplierView.whatsapp,
        website: supplierView.website,
        categories: supplierView.categories,
        products: (supplierRecord?.products ?? [])
          .filter((item) => item.status !== 'inactive')
          .map((item) => mapProductRecordToCard(item)),
      });
    } catch (error) {
      setToast({ message: error.message || 'No se pudo cargar el proveedor.', type: 'error' });
    } finally {
      setOpeningSupplierId('');
    }
  };

  const handleQuoteAction = (product) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    if (!currentUser.is_buyer) {
      setToast({
        message: 'Para cotizar desde marketplace necesitas activar o ingresar con un perfil comprador.',
        type: 'error',
      });
      return;
    }

    navigate('/dashboard-comprador', {
      state: {
        activeTab: 'catalog',
        openQuoteModal: true,
        quotePrefill: {
          product: product.name,
          categoryId: product.categoryId ?? '',
          sourceProductId: product.id,
          sourceSupplierId: product.supplierId,
          sourceContext: 'marketplace',
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-brand-canvas">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {viewingSupplier && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-brand-ink/50 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto"
          onClick={(event) => event.target === event.currentTarget && setViewingSupplier(null)}
        >
          <div className="transform-gpu bg-brand-canvas rounded-2xl shadow-2xl shadow-brand-ink/20 w-full max-w-4xl my-8 animate-fade-in-up overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-brand-ink via-brand-inkLight to-brand-ink relative">
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

            <div className="px-6 pb-6 relative">
              <div className="w-20 h-20 bg-gradient-to-br from-brand-ink to-brand-inkLight rounded-2xl flex items-center justify-center text-brand-accent text-2xl font-extrabold border-4 border-white shadow-lg -mt-10 relative z-10">
                {viewingSupplier.initials}
              </div>

              <div className="mt-4 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-brand-ink">{viewingSupplier.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{viewingSupplier.description}</p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-xs font-bold bg-gradient-to-r from-emerald-400 to-blue-500 text-white px-3 py-1 rounded-full">
                      Plan {viewingSupplier.plan}
                    </span>
                    {viewingSupplier.verified ? (
                      <span className="text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        Verificado
                      </span>
                    ) : (
                      <span className="text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-full">
                        En revision
                      </span>
                    )}
                    {viewingSupplier.memberSince && (
                      <span className="text-xs text-gray-400">Miembro desde {viewingSupplier.memberSince}</span>
                    )}
                    {viewingSupplier.totalReviews > 0 && (
                      <span className="text-xs text-gray-400">{viewingSupplier.totalReviews} reseñas verificadas</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 min-w-full sm:min-w-[280px] lg:min-w-[320px]">
                  {[
                    { label: 'Rating', value: viewingSupplier.rating },
                    { label: 'Respuesta', value: viewingSupplier.responseRate },
                    { label: 'Categorias', value: viewingSupplier.categories.length },
                    { label: 'Productos', value: viewingSupplier.products.length },
                  ].map((item) => (
                    <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-4">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{item.label}</div>
                      <div className="text-lg font-extrabold text-brand-ink mt-1">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                <div className="lg:col-span-2 rounded-2xl border border-brand-accent/15 bg-brand-mint px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-accent">Trust layer</div>
                    <p className="text-sm font-semibold text-brand-ink mt-1">
                      {viewingSupplier.verified
                        ? 'Proveedor con verificacion comercial aprobada y reputacion basada en operaciones reales.'
                        : 'Proveedor visible en marketplace con verificacion todavia en revision.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-semibold bg-white text-brand-ink border border-brand-accent/20 px-3 py-1.5 rounded-full">
                      Rating {Number(viewingSupplier.rating || 0).toFixed(1)}
                    </span>
                    <span className="text-xs font-semibold bg-white text-brand-ink border border-brand-accent/20 px-3 py-1.5 rounded-full">
                      {viewingSupplier.totalReviews} reseñas
                    </span>
                    <span className="text-xs font-semibold bg-white text-brand-ink border border-brand-accent/20 px-3 py-1.5 rounded-full">
                      {viewingSupplier.verified ? 'RUT validado' : 'Revision pendiente'}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <h4 className="text-sm font-bold text-brand-ink mb-3">Informacion comercial</h4>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: 'RUT', value: viewingSupplier.rut },
                      { label: 'Ciudad', value: viewingSupplier.city },
                      { label: 'Direccion', value: viewingSupplier.address },
                      { label: 'Giro', value: viewingSupplier.giro },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                        <span className="text-gray-400">{item.label}</span>
                        <span className="font-semibold text-brand-ink text-right">
                          <ExternalContactValue label={item.label} value={item.value} />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <h4 className="text-sm font-bold text-brand-ink mb-3">Contacto</h4>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: 'Email', value: viewingSupplier.email },
                      { label: 'Telefono', value: viewingSupplier.phone },
                      { label: 'WhatsApp', value: viewingSupplier.whatsapp },
                      { label: 'Web', value: viewingSupplier.website },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                        <span className="text-gray-400">{item.label}</span>
                        <span className="font-semibold text-brand-ink text-right">{item.value || '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-bold text-brand-ink mb-3">Categorias</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingSupplier.categories.length > 0 ? (
                    viewingSupplier.categories.map((category) => (
                      <span key={category} className="text-xs font-medium bg-brand-mint text-brand-ink border border-brand-accent/20 px-3 py-1.5 rounded-lg">
                        {category}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">Este proveedor aun no define categorias.</span>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h4 className="text-sm font-bold text-brand-ink">Catalogo publicado</h4>
                  <span className="text-xs text-gray-400">{viewingSupplier.products.length} productos visibles</span>
                </div>

                {viewingSupplier.products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {viewingSupplier.products.map((product) => (
                      <div key={product.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <div className={`h-28 ${product.imageUrls?.[0] ? '' : `bg-gradient-to-br ${product.gradient}`} relative overflow-hidden`}>
                          {product.imageUrls?.[0] ? (
                            <img src={product.imageUrls[0]} alt={product.imageAlt} className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/20 text-white">
                                <Package className="h-7 w-7" />
                              </div>
                            </div>
                          )}
                          {product.status === 'low_stock' && (
                            <span className="absolute top-2 right-2 text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              Stock bajo
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <h5 className="text-sm font-bold text-brand-ink truncate">{product.name}</h5>
                          <p className="text-[11px] text-gray-400 mt-0.5">{product.category}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-sm font-extrabold text-brand-ink">{product.price}</span>
                            <span className="text-[11px] text-gray-400">{product.stock}</span>
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
            </div>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden bg-brand-inkDark text-white px-4 pt-8 pb-8 md:pt-16 md:pb-16">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-0 left-[15%] w-56 h-56 md:w-80 md:h-80 bg-brand-accent/10 rounded-full blur-[70px] md:blur-[90px]" />
        <div className="absolute bottom-0 right-[10%] w-56 h-56 md:w-80 md:h-80 bg-emerald-500/10 rounded-full blur-[80px] md:blur-[100px]" />
        <div className="absolute -right-24 top-4 h-[420px] w-[420px] rounded-full border border-brand-accent/10" />
        <div className="absolute -right-10 top-16 h-[300px] w-[300px] rounded-full border border-brand-accent/10" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(480px,1fr)] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-accent/20 bg-brand-accent/10 px-4 py-2 text-[10px] md:text-xs font-semibold uppercase tracking-[0.18em] md:tracking-[0.24em] text-brand-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
              Marketplace publico
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mt-4 max-w-[12ch] md:max-w-none">
                Marketplace de proveedores <span className="text-brand-accent">verificados</span>
              </h1>
              <p className="text-sm md:text-lg text-slate-300 mt-4 max-w-xl md:max-w-2xl leading-relaxed">
                Compara catalogos reales, precios transparentes y cotiza en minutos con proveedores food service de Chile.
              </p>
              {!currentUser && (
                <div className="flex flex-col sm:flex-row gap-2.5 md:gap-3 mt-6 md:mt-8">
                  <Link
                    to="/ingresar?role=comprador"
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-blue-500 text-brand-ink font-bold px-5 py-2.5 md:px-6 md:py-3 rounded-xl transition-all hover:scale-[1.02] shadow-xl shadow-emerald-400/20 text-center text-sm md:text-base"
                  >
                    Comprar ahora
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/ingresar?role=proveedor"
                    className="inline-flex items-center justify-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold px-5 py-2.5 md:px-6 md:py-3 rounded-xl transition-all text-center text-sm md:text-base"
                  >
                    <Store className="h-4 w-4" />
                    Publicar catalogo
                  </Link>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: 'Productos visibles', value: catalogProducts.length, Icon: Package },
                { label: 'Proveedores activos', value: supplierOptions.length - 1, Icon: Users },
                { label: 'Categorias activas', value: [...new Set(catalogProducts.map((product) => product.category))].length, Icon: Grid2X2 },
                { label: 'Resultados hoy', value: filteredProducts.length, Icon: Search },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
                  <item.Icon className="h-6 w-6 text-brand-accent" />
                  <div className="mt-4 text-2xl font-black text-white">{item.value}</div>
                  <div className="text-xs text-slate-400 mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-4 md:py-6 border-y border-white/10 bg-brand-inkDark sticky top-16 z-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-3 md:gap-4">
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por producto, categoria o proveedor"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-12 pr-4 py-3 md:py-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
              />
            </label>

            <select
              value={supplierFilter}
              onChange={(event) => setSupplierFilter(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 md:py-4 text-sm text-white focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
            >
              {supplierOptions.map((supplier) => (
                <option key={supplier} value={supplier}>
                  {supplier === 'Todos' ? 'Todos los proveedores' : supplier}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 mt-3 md:mt-4">
            {categoryFilters.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setCategoryFilter(category)}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${
                  categoryFilter === category
                    ? 'bg-gradient-to-r from-emerald-400 to-blue-500 text-white shadow-md shadow-emerald-400/20'
                    : 'bg-white/[0.04] border border-white/10 text-slate-400 hover:border-brand-accent/30 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {currentUser && alertSubscriptions.length > 0 && (() => {
        const trackedProductIds = new Set(
          alertSubscriptions.map((s) => {
            const p = s.products && (Array.isArray(s.products) ? s.products[0] : s.products);
            return p?.id;
          }).filter(Boolean)
        );
        const trackedCategoryNames = new Set(
          alertSubscriptions.map((s) => {
            const c = s.categories && (Array.isArray(s.categories) ? s.categories[0] : s.categories);
            return c?.name;
          }).filter(Boolean)
        );

        const relevantAlerts = priceAlerts.filter((a) => {
          const product = a.products && (Array.isArray(a.products) ? a.products[0] : a.products);
          const category = product?.categories && (Array.isArray(product.categories) ? product.categories[0] : product.categories);
          return trackedProductIds.has(a.product_id) || trackedCategoryNames.has(category?.name);
        }).slice(0, 5);

        const formatCLP = (v) => v != null ? `$${Number(v).toLocaleString('es-CL')}` : '-';

        if (relevantAlerts.length === 0) return null;

        return (
          <section className="px-4 pt-8 pb-0">
            <div className="max-w-6xl mx-auto">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-inkDark to-[#0d2040] border border-brand-accent/20 px-6 py-5">
                <div className="absolute inset-0 bg-grid opacity-10" />
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-brand-accent/5 to-transparent" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent">Movimientos de mercado en tus seguimientos</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {relevantAlerts.map((alert) => {
                      const product = alert.products && (Array.isArray(alert.products) ? alert.products[0] : alert.products);
                      const supplier = product?.users && (Array.isArray(product.users) ? product.users[0] : product.users);
                      const category = product?.categories && (Array.isArray(product.categories) ? product.categories[0] : product.categories);
                      const isDown = alert.direction === 'down';
                      const pct = alert.old_price > 0
                        ? Math.abs(((alert.new_price - alert.old_price) / alert.old_price) * 100).toFixed(1)
                        : null;

                      return (
                        <div key={alert.id} className={`rounded-xl border px-4 py-3 flex items-start justify-between gap-3 ${isDown ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">{product?.name ?? 'Producto'}</div>
                            <div className="text-[11px] text-gray-400 mt-0.5 truncate">{supplier?.company_name ?? ''}{category?.name ? ` · ${category.name}` : ''}</div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-500 line-through">{formatCLP(alert.old_price)}</span>
                              <span className={`inline-flex items-center gap-1 text-sm font-extrabold ${isDown ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isDown ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                                {formatCLP(alert.new_price)}
                              </span>
                            </div>
                          </div>
                          <div className={`flex-shrink-0 text-right`}>
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
            </div>
          </section>
        );
      })()}

      <section className="bg-brand-inkDark px-4 py-6 md:py-10">
        <div className="max-w-6xl mx-auto grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-40 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 text-sm font-black">
                  <SlidersHorizontal className="h-4 w-4 text-brand-accent" />
                  Filtros
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('Todos');
                    setSupplierFilter('Todos');
                    setSearchTerm('');
                  }}
                  className="text-xs font-semibold text-brand-accent hover:text-white"
                >
                  Limpiar
                </button>
              </div>

              <div className="py-5 border-b border-white/10">
                <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Categorias</div>
                <div className="space-y-2">
                  {categoryFilters.slice(0, 8).map((category) => {
                    const count = category === 'Todos'
                      ? catalogProducts.length
                      : catalogProducts.filter((product) => product.category === category).length;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setCategoryFilter(category)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-xs text-slate-300 transition hover:bg-white/5"
                      >
                        <span className="inline-flex items-center gap-2">
                          <span className={`h-4 w-4 rounded border ${categoryFilter === category ? 'border-brand-accent bg-brand-accent' : 'border-slate-600'}`} />
                          {category}
                        </span>
                        <span className="text-slate-500">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="py-5 border-b border-white/10">
                <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Confianza</div>
                <div className="flex items-center justify-between rounded-xl bg-brand-accent/10 px-3 py-3 text-xs font-bold text-brand-accent">
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Proveedor verificado
                  </span>
                  <span className="h-5 w-9 rounded-full bg-brand-accent p-0.5">
                    <span className="block h-4 w-4 translate-x-4 rounded-full bg-brand-ink" />
                  </span>
                </div>
              </div>

              <div className="pt-5">
                <div className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Entrega en</div>
                {['Menos de 24 horas', '24 a 48 horas', 'Coordinar con proveedor'].map((item) => (
                  <div key={item} className="flex items-center gap-2 py-2 text-xs text-slate-400">
                    <Clock3 className="h-4 w-4 text-slate-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-400">
                Mostrando <span className="font-bold text-white">{filteredProducts.length}</span> resultados
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Ordenar por</span>
                <button type="button" className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white">
                  Mas relevantes
                </button>
                <button type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-brand-accent">
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>

          {catalogLoading ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-slate-400">
              Cargando marketplace...
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`bg-white rounded-xl border border-white/10 overflow-hidden card-premium cursor-pointer group ${
                    openingSupplierId === product.id ? 'opacity-90' : ''
                  }`}
                  onClick={() => openSupplierFromProduct(product)}
                >
                  <div className={`relative h-28 sm:h-36 md:h-40 bg-gradient-to-br ${product.gradient} overflow-hidden`}>
                    {product.imageUrls?.[0] ? (
                      <img src={product.imageUrls[0]} alt={product.imageAlt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <>
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute top-3 left-3 w-16 h-16 bg-white/30 rounded-full blur-xl" />
                          <div className="absolute bottom-4 right-4 w-20 h-20 bg-white/20 rounded-full blur-2xl" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/20 text-white shadow-lg transition-transform duration-500 group-hover:scale-110">
                            <Package className="h-8 w-8" />
                          </div>
                        </div>
                      </>
                    )}
                    <div className="absolute top-2 left-2 flex flex-col items-start gap-1.5">
                      <div className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-300 shadow-sm">
                        <CheckCircle2 className="h-3 w-3" />
                        Verificado
                      </div>
                      {product.hasTrackedPriceAlert && (
                        <div className="text-[9px] font-bold bg-white/90 text-brand-ink px-2 py-0.5 rounded-full shadow-sm">
                          Alerta activa
                        </div>
                      )}
                      {product.recentPriceAlert && (
                        <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm ${
                          product.recentPriceAlert.change === 'down'
                            ? 'bg-emerald-400/95 text-emerald-950'
                            : 'bg-rose-400/95 text-rose-950'
                        }`}>
                          {product.recentPriceAlert.signalLabel}
                        </div>
                      )}
                    </div>
                    {product.status === 'low_stock' && (
                      <div className="absolute top-2 right-2 text-[9px] font-bold bg-amber-400/90 text-amber-900 px-2 py-0.5 rounded-full">
                        Stock bajo
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(event) => event.stopPropagation()}
                      className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/85 text-brand-ink shadow-sm transition hover:text-rose-500"
                      aria-label="Guardar producto"
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-2.5 md:p-3.5">
                    <h3 className="text-[13px] md:text-sm font-bold text-brand-ink truncate">{product.name}</h3>
                    <p className="text-[10px] md:text-xs text-gray-400 mt-0.5 truncate">{product.category}</p>
                    <div className="flex items-center justify-between mt-2 md:mt-3">
                      <span className="text-sm md:text-base font-extrabold text-brand-ink">{product.price}</span>
                    </div>
                    {product.recentPriceAlert && (
                      <div className="mt-2 rounded-xl border border-gray-100 bg-brand-canvas px-2.5 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-brand-ink">{product.recentPriceAlert.impactLabel}</span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                            product.recentPriceAlert.change === 'down' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {product.recentPriceAlert.change === 'down' ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                            {product.recentPriceAlert.currentPrice}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Antes {product.recentPriceAlert.previousPrice} · {product.recentPriceAlert.dateLabel}
                        </p>
                      </div>
                    )}
                    {product.supplierName && (
                      <div className="flex items-center gap-2 mt-2.5 pt-2.5 md:mt-3 md:pt-3 border-t border-gray-50">
                        <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-brand-ink to-brand-inkLight rounded-md flex items-center justify-center text-brand-accent text-[8px] font-bold flex-shrink-0">
                          {product.supplierName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] md:text-[11px] font-semibold text-gray-600 truncate">{product.supplierName}</p>
                          <span className="text-[9px] md:text-[10px] text-gray-400">Ver proveedor</span>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      </div>
                    )}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Boxes className="h-3.5 w-3.5" />
                        {product.stock}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5" />
                        Entrega 24-48 hrs
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuoteAction(product);
                      }}
                      className="mt-2.5 md:mt-3 w-full bg-gradient-to-r from-brand-ink to-brand-inkLight hover:from-brand-inkLight hover:to-brand-ink text-white font-bold px-4 py-2 md:py-2.5 rounded-xl text-xs md:text-sm transition-all hover:scale-[1.02] shadow-md"
                    >
                      {currentUser?.is_buyer ? 'Cotizar' : currentUser ? 'Activar comprador' : 'Cotizar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-white">No hay resultados para ese filtro</h3>
              <p className="text-sm text-slate-400 mt-2">Prueba cambiando categoria, proveedor o termino de busqueda.</p>
            </div>
          )}
          </div>
        </div>
      </section>

      <section className="bg-brand-inkDark px-4 pb-12">
        <div className="mx-auto grid max-w-6xl gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white md:grid-cols-4">
          {[
            { title: 'Proveedores verificados', desc: 'Evaluados por nuestro equipo', Icon: ShieldCheck },
            { title: 'Precios transparentes', desc: 'Sin costos ocultos', Icon: Package },
            { title: 'Respuesta rapida', desc: 'Cotiza en minutos', Icon: Clock3 },
            { title: 'Entregas confiables', desc: 'Cobertura en Chile', Icon: Truck },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3 px-3 py-2 md:border-r md:border-white/10 last:border-r-0">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-accent/10 text-brand-accent">
                <item.Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-black">{item.title}</div>
                <div className="text-xs text-slate-500">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
      {showAuthModal && <AuthChoiceModal role="comprador" onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
