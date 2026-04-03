import { useEffect, useState } from 'react';
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
import { getProducts, getSupplierProfile, getSupplierStats } from '../services/database';

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

  const supplierOptions = ['Todos', ...new Set(catalogProducts.map((product) => product.supplierName).filter(Boolean))];
  const categoryFilters = ['Todos', ...categoryOptions.map((category) => category.name)];
  const filteredProducts = catalogProducts.filter((product) => {
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

      <section className="px-4 py-10">
        <div className="max-w-6xl mx-auto">
          {catalogLoading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
              Cargando marketplace...
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const supplierInsight = supplierInsights[product.supplierId];

                return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => openSupplierFromProduct(product)}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden card-premium text-left group"
                >
                  <div className={`relative h-52 ${product.customImage ? '' : `bg-gradient-to-br ${product.gradient}`} overflow-hidden`}>
                    {product.customImage ? (
                      <img src={product.customImage} alt={product.imageAlt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <>
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute top-4 left-4 w-24 h-24 bg-white/30 rounded-full blur-xl" />
                          <div className="absolute bottom-6 right-6 w-28 h-28 bg-white/20 rounded-full blur-2xl" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center text-7xl">
                          {product.emoji}
                        </div>
                      </>
                    )}

                    <div className="absolute top-3 left-3 bg-black/35 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {product.category}
                    </div>

                    {product.status === 'low_stock' && (
                      <div className="absolute top-3 right-3 text-[10px] font-bold bg-amber-400/90 text-amber-900 px-2.5 py-1 rounded-full">
                        Stock bajo
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-extrabold text-[#0D1F3C] truncate">{product.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{product.stock}</p>
                      </div>
                      <span className="text-lg font-extrabold text-[#0D1F3C] whitespace-nowrap">{product.price}</span>
                    </div>

                    <p className="text-sm text-gray-500 leading-relaxed mt-3 min-h-[42px]">{product.description || 'Producto publicado en el marketplace de Zentra.'}</p>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#0D1F3C] truncate">{product.supplierName || 'Proveedor Zentra'}</p>
                        <p className="text-[11px] text-gray-400">
                          {[supplierInsight?.city, supplierInsight?.categories?.slice(0, 2).join(' / ')].filter(Boolean).join(' / ') || 'Ver ficha publica del proveedor'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {supplierInsight?.verified && (
                          <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">
                            Verificado
                          </span>
                        )}
                        <span className="text-sm font-bold text-[#2ECAD5] group-hover:translate-x-0.5 transition-transform">
                          {supplierInsight ? Number(supplierInsight.rating || 0).toFixed(1) : 'Abrir'}
                        </span>
                      </div>
                    </div>
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
                </button>
                );
              })}
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
