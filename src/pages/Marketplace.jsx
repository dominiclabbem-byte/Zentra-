import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthChoiceModal from '../components/AuthChoiceModal';
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

export default function Marketplace() {
  const { categories: categoryOptions, currentUser } = useAuth();
  const [toast, setToast] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [supplierInsights, setSupplierInsights] = useState({});
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [supplierFilter, setSupplierFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingSupplier, setViewingSupplier] = useState(null);
  const [alertSubscriptions, setAlertSubscriptions] = useState([]);
  const [priceAlerts, setPriceAlerts] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setCatalogLoading(true);

      try {
        const data = await getProducts();
        const cards = data.map((product) => mapProductRecordToCard(product));
        const supplierIds = [...new Set(cards.map((product) => product.supplierId).filter(Boolean))];
        const insights = await Promise.all(
          supplierIds.map(async (supplierId) => {
            try {
              const [supplierRaw, supplierStats] = await Promise.all([
                getSupplierProfile(supplierId),
                getSupplierStats(supplierId),
              ]);
              const supplierRecord = normalizeUserRecord(supplierRaw);
              const supplierView = buildSupplierProfileView(supplierRecord);

              return [supplierId, {
                city: supplierView.city,
                verified: Boolean(supplierRecord?.verified),
                verificationStatus: supplierRecord?.verification_status ?? 'pending',
                rating: Number(supplierStats?.rating ?? 0),
                totalReviews: supplierStats?.totalReviews ?? 0,
                categories: supplierView.categories,
              }];
            } catch {
              return [supplierId, null];
            }
          }),
        );

        if (!cancelled) {
          setCatalogProducts(cards);
          setSupplierInsights(Object.fromEntries(insights.filter(([, value]) => value)));
        }
      } catch (error) {
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
    if (!currentUser?.id) return;
    Promise.all([
      getPriceAlertSubscriptions(currentUser.id),
      getPriceAlerts(currentUser.id),
    ]).then(([subs, alerts]) => {
      setAlertSubscriptions(subs);
      setPriceAlerts(alerts);
    }).catch(() => {});
  }, [currentUser?.id]);

  const supplierOptions = ['Todos', ...new Set(catalogProducts.map((product) => product.supplierName).filter(Boolean))];
  const categoryFilters = ['Todos', ...categoryOptions.map((category) => category.name)];

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

  const filteredProducts = catalogProductsWithSignals.filter((product) => {
    const matchesCategory = categoryFilter === 'Todos' || product.category === categoryFilter;
    const matchesSupplier = supplierFilter === 'Todos' || product.supplierName === supplierFilter;
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch = !normalizedSearch
      || product.name.toLowerCase().includes(normalizedSearch)
      || product.category.toLowerCase().includes(normalizedSearch)
      || product.supplierName.toLowerCase().includes(normalizedSearch);

    return matchesCategory && matchesSupplier && matchesSearch;
  });

  const openSupplierFromProduct = async (product) => {
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
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {viewingSupplier && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[#0D1F3C]/50 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto"
          onClick={(event) => event.target === event.currentTarget && setViewingSupplier(null)}
        >
          <div className="transform-gpu bg-[#f8fafc] rounded-2xl shadow-2xl shadow-[#0D1F3C]/20 w-full max-w-4xl my-8 animate-fade-in-up overflow-hidden">
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

            <div className="px-6 pb-6 relative">
              <div className="w-20 h-20 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-2xl flex items-center justify-center text-[#2ECAD5] text-2xl font-extrabold border-4 border-white shadow-lg -mt-10 relative z-10">
                {viewingSupplier.initials}
              </div>

              <div className="mt-4 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#0D1F3C]">{viewingSupplier.name}</h2>
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
                      <div className="text-lg font-extrabold text-[#0D1F3C] mt-1">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                <div className="lg:col-span-2 rounded-2xl border border-[#2ECAD5]/15 bg-[#f0fdfa] px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#2ECAD5]">Trust layer</div>
                    <p className="text-sm font-semibold text-[#0D1F3C] mt-1">
                      {viewingSupplier.verified
                        ? 'Proveedor con verificacion comercial aprobada y reputacion basada en operaciones reales.'
                        : 'Proveedor visible en marketplace con verificacion todavia en revision.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-semibold bg-white text-[#0D1F3C] border border-[#2ECAD5]/20 px-3 py-1.5 rounded-full">
                      Rating {Number(viewingSupplier.rating || 0).toFixed(1)}
                    </span>
                    <span className="text-xs font-semibold bg-white text-[#0D1F3C] border border-[#2ECAD5]/20 px-3 py-1.5 rounded-full">
                      {viewingSupplier.totalReviews} reseñas
                    </span>
                    <span className="text-xs font-semibold bg-white text-[#0D1F3C] border border-[#2ECAD5]/20 px-3 py-1.5 rounded-full">
                      {viewingSupplier.verified ? 'RUT validado' : 'Revision pendiente'}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <h4 className="text-sm font-bold text-[#0D1F3C] mb-3">Informacion comercial</h4>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: 'RUT', value: viewingSupplier.rut },
                      { label: 'Ciudad', value: viewingSupplier.city },
                      { label: 'Direccion', value: viewingSupplier.address },
                      { label: 'Giro', value: viewingSupplier.giro },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                        <span className="text-gray-400">{item.label}</span>
                        <span className="font-semibold text-[#0D1F3C] text-right">{item.value || '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <h4 className="text-sm font-bold text-[#0D1F3C] mb-3">Contacto</h4>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: 'Email', value: viewingSupplier.email },
                      { label: 'Telefono', value: viewingSupplier.phone },
                      { label: 'WhatsApp', value: viewingSupplier.whatsapp },
                      { label: 'Web', value: viewingSupplier.website },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                        <span className="text-gray-400">{item.label}</span>
                        <span className="font-semibold text-[#0D1F3C] text-right">{item.value || '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-bold text-[#0D1F3C] mb-3">Categorias</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingSupplier.categories.length > 0 ? (
                    viewingSupplier.categories.map((category) => (
                      <span key={category} className="text-xs font-medium bg-[#f0fdfa] text-[#0D1F3C] border border-[#2ECAD5]/20 px-3 py-1.5 rounded-lg">
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
                  <h4 className="text-sm font-bold text-[#0D1F3C]">Catalogo publicado</h4>
                  <span className="text-xs text-gray-400">{viewingSupplier.products.length} productos visibles</span>
                </div>

                {viewingSupplier.products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {viewingSupplier.products.map((product) => (
                      <div key={product.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        <div className={`h-28 ${product.customImage ? '' : `bg-gradient-to-br ${product.gradient}`} relative overflow-hidden`}>
                          {product.customImage ? (
                            <img src={product.customImage} alt={product.imageAlt} className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-4xl">
                              {product.emoji}
                            </div>
                          )}
                          {product.status === 'low_stock' && (
                            <span className="absolute top-2 right-2 text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              Stock bajo
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <h5 className="text-sm font-bold text-[#0D1F3C] truncate">{product.name}</h5>
                          <p className="text-[11px] text-gray-400 mt-0.5">{product.category}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-sm font-extrabold text-[#0D1F3C]">{product.price}</span>
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

      <section className="relative overflow-hidden bg-[#09172a] text-white px-4 py-16">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-0 left-[15%] w-80 h-80 bg-[#2ECAD5]/10 rounded-full blur-[90px]" />
        <div className="absolute bottom-0 right-[10%] w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#2ECAD5]">
              Marketplace publico
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mt-4">
              Compara catalogos reales de proveedores food service en Chile
            </h1>
            <p className="text-lg text-slate-300 mt-4 max-w-2xl leading-relaxed">
              Explora precios visibles, categorias activas y fichas publicas de proveedores sin entrar al dashboard.
            </p>
            {!currentUser && (
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Link
                  to="/ingresar?role=comprador"
                  className="bg-gradient-to-r from-emerald-400 to-blue-500 text-[#0D1F3C] font-bold px-6 py-3 rounded-xl transition-all hover:scale-[1.02] shadow-xl shadow-emerald-400/20 text-center"
                >
                  Quiero Comprar
                </Link>
                <Link
                  to="/ingresar?role=proveedor"
                  className="border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold px-6 py-3 rounded-xl transition-all text-center"
                >
                  Quiero Vender
                </Link>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {[
              { label: 'Productos visibles', value: catalogProducts.length },
              { label: 'Proveedores activos', value: supplierOptions.length - 1 },
              { label: 'Categorias activas', value: [...new Set(catalogProducts.map((product) => product.category))].length },
              { label: 'Resultados filtrados', value: filteredProducts.length },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
                <div className="text-2xl font-extrabold text-white">{item.value}</div>
                <div className="text-xs text-slate-400 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-4">
            <label className="relative block">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por producto, categoria o proveedor"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full bg-[#f8fafc] border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
              />
            </label>

            <select
              value={supplierFilter}
              onChange={(event) => setSupplierFilter(event.target.value)}
              className="w-full bg-[#f8fafc] border border-gray-100 rounded-2xl px-4 py-4 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
            >
              {supplierOptions.map((supplier) => (
                <option key={supplier} value={supplier}>
                  {supplier === 'Todos' ? 'Todos los proveedores' : supplier}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 mt-4">
            {categoryFilters.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setCategoryFilter(category)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  categoryFilter === category
                    ? 'bg-gradient-to-r from-emerald-400 to-blue-500 text-white shadow-md shadow-emerald-400/20'
                    : 'bg-white border border-gray-100 text-gray-500 hover:border-[#2ECAD5]/30 hover:text-[#0D1F3C]'
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
                              <span className={`text-sm font-extrabold ${isDown ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isDown ? '↓' : '↑'} {formatCLP(alert.new_price)}
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

      <section className="px-4 py-10">
        <div className="max-w-6xl mx-auto">
          {catalogLoading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
              Cargando marketplace...
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden card-premium cursor-pointer group"
                  onClick={() => openSupplierFromProduct(product)}
                >
                  <div className={`relative h-40 bg-gradient-to-br ${product.gradient} overflow-hidden`}>
                    {product.customImage ? (
                      <img src={product.customImage} alt={product.imageAlt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <>
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute top-3 left-3 w-16 h-16 bg-white/30 rounded-full blur-xl" />
                          <div className="absolute bottom-4 right-4 w-20 h-20 bg-white/20 rounded-full blur-2xl" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-5xl filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-500">
                            {product.emoji}
                          </div>
                        </div>
                      </>
                    )}
                    <div className="absolute top-2 left-2 flex flex-col items-start gap-1.5">
                      {product.hasTrackedPriceAlert && (
                        <div className="text-[9px] font-bold bg-white/90 text-[#0D1F3C] px-2 py-0.5 rounded-full shadow-sm">
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
                  </div>

                  <div className="p-3.5">
                    <h3 className="text-sm font-bold text-[#0D1F3C] truncate">{product.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-base font-extrabold text-[#0D1F3C]">{product.price}</span>
                    </div>
                    {product.recentPriceAlert && (
                      <div className="mt-2 rounded-xl border border-gray-100 bg-[#f8fafc] px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-[#0D1F3C]">{product.recentPriceAlert.impactLabel}</span>
                          <span className={`text-[10px] font-bold ${
                            product.recentPriceAlert.change === 'down' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {product.recentPriceAlert.change === 'down' ? '↓' : '↑'} {product.recentPriceAlert.currentPrice}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Antes {product.recentPriceAlert.previousPrice} · {product.recentPriceAlert.dateLabel}
                        </p>
                      </div>
                    )}
                    {product.supplierName && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                        <div className="w-6 h-6 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-md flex items-center justify-center text-[#2ECAD5] text-[8px] font-bold flex-shrink-0">
                          {product.supplierName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold text-gray-600 truncate">{product.supplierName}</p>
                          <span className="text-[10px] text-gray-400">Ver proveedor</span>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentUser) {
                          openSupplierFromProduct(product);
                        } else {
                          setShowAuthModal(true);
                        }
                      }}
                      className="mt-3 w-full bg-gradient-to-r from-[#0D1F3C] to-[#1a3260] hover:from-[#1a3260] hover:to-[#0D1F3C] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all hover:scale-[1.02] shadow-md"
                    >
                      Cotizar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-[#f8fafc] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#0D1F3C]">No hay resultados para ese filtro</h3>
              <p className="text-sm text-gray-400 mt-2">Prueba cambiando categoria, proveedor o termino de busqueda.</p>
            </div>
          )}
        </div>
      </section>
      {showAuthModal && <AuthChoiceModal role="comprador" onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
