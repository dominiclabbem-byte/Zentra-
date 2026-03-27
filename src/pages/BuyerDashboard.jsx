import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import { quoteRequests, priceAlerts, supplierProfiles, supplierProducts, categories as allCategories } from '../data/mockData';
import ZChat from '../components/ZChat';

const units = ['kg', 'unidades', 'cajas'];

// Coordenadas aproximadas de ciudades chilenas
const CITY_COORDS = {
  'santiago': { lat: -33.4489, lng: -70.6693 },
  'temuco': { lat: -38.7359, lng: -72.5904 },
  'valparaiso': { lat: -33.0458, lng: -71.6197 },
  'concepcion': { lat: -36.8201, lng: -73.0444 },
  'antofagasta': { lat: -23.6509, lng: -70.3975 },
  'la serena': { lat: -29.9027, lng: -71.2519 },
  'rancagua': { lat: -34.1703, lng: -70.7444 },
  'talca': { lat: -35.4264, lng: -71.6554 },
  'arica': { lat: -18.4783, lng: -70.3126 },
  'iquique': { lat: -20.2307, lng: -70.1357 },
  'puerto montt': { lat: -41.4693, lng: -72.9424 },
  'punta arenas': { lat: -53.1638, lng: -70.9171 },
};

function getCityCoords(cityStr) {
  if (!cityStr) return null;
  const normalized = cityStr.toLowerCase().split(',')[0].trim();
  return CITY_COORDS[normalized] || null;
}

function haversineDistance(coord1, coord2) {
  const R = 6371;
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const quoteHistory = [
  { id: 'h1', product: 'Harina extra fina', quantity: '500', unit: 'kg', deliveryDate: '2026-02-15', date: '01 Feb 2026', status: 'Completada', offersCount: 4, bestPrice: '$340.000' },
  { id: 'h2', product: 'Chocolate cobertura 70%', quantity: '100', unit: 'kg', deliveryDate: '2026-01-30', date: '18 Ene 2026', status: 'Completada', offersCount: 3, bestPrice: '$1.190.000' },
  { id: 'h3', product: 'Crema vegetal para batir', quantity: '200', unit: 'unidades', deliveryDate: '2026-01-20', date: '10 Ene 2026', status: 'Completada', offersCount: 2, bestPrice: '$560.000' },
  { id: 'h4', product: 'Mantequilla sin sal', quantity: '80', unit: 'kg', deliveryDate: '2025-12-20', date: '08 Dic 2025', status: 'Expirada', offersCount: 0, bestPrice: null },
  { id: 'h5', product: 'Azucar flor', quantity: '300', unit: 'kg', deliveryDate: '2025-11-28', date: '15 Nov 2025', status: 'Completada', offersCount: 5, bestPrice: '$195.000' },
];

const statusColors = {
  'Recibiendo ofertas': 'bg-blue-50 text-blue-600 border border-blue-100',
  '3 ofertas recibidas': 'bg-emerald-50 text-emerald-600 border border-emerald-100',
};

const initialBuyerProfile = {
  companyName: 'Pasteleria Mozart Ltda.',
  initials: 'PM',
  description: 'Pasteleria y reposteria gourmet',
  rut: '72.345.678-9',
  city: 'Santiago, Chile',
  address: 'Av. Italia 1580, Nunoa',
  businessType: 'Pasteleria y reposteria',
  monthlyVolume: 'Aprox. 2.000 kg/mes',
  email: 'compras@pasteleriamozart.cl',
  phone: '+56 2 2987 6543',
  whatsapp: '+56 9 1234 5678',
  instagram: '@pasteleriamozart',
  categories: ['Pasteleria'],
  frequentProducts: ['Harina extra fina', 'Chocolate cobertura', 'Crema vegetal', 'Mantequilla', 'Azucar flor', 'Frambuesa IQF', 'Levadura fresca'],
};

export default function BuyerDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const supplierProfile = location.state?.supplierProfile || null;
  const isSupplierBuying = !!supplierProfile;

  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'catalog');
  const [catalogFilter, setCatalogFilter] = useState('Todos');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [viewingSupplier, setViewingSupplier] = useState(null);
  const [buyerProfile, setBuyerProfile] = useState(initialBuyerProfile);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState(initialBuyerProfile);
  const [newCategory, setNewCategory] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [quoteForm, setQuoteForm] = useState({
    product: '',
    quantity: '',
    unit: 'kg',
    deliveryDate: '',
  });
  const [userCoords, setUserCoords] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        // Si no hay permiso, usar ciudad del perfil como fallback
        const coords = getCityCoords(buyerProfile.city);
        if (coords) setUserCoords(coords);
      }
    );
  }, [buyerProfile.city]);

  const handleQuoteSubmit = (e) => {
    e.preventDefault();
    setShowModal(false);
    setToast({ message: 'Cotizacion enviada! Recibiras ofertas en menos de 24hrs.', type: 'success' });
    setQuoteForm({ product: '', quantity: '', unit: 'kg', deliveryDate: '' });
  };

  const handleRepeatQuote = (quote) => {
    setQuoteForm({
      product: quote.product,
      quantity: quote.quantity,
      unit: quote.unit,
      deliveryDate: '',
    });
    setShowModal(true);
  };

  const openEditProfile = () => {
    setProfileForm({ ...buyerProfile });
    setEditProfileOpen(true);
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    setBuyerProfile({ ...profileForm });
    setEditProfileOpen(false);
    setToast({ message: 'Perfil actualizado exitosamente', type: 'success' });
  };

  const handleAddCategory = () => {
    const cat = newCategory.trim();
    if (cat && !profileForm.categories.includes(cat)) {
      setProfileForm({ ...profileForm, categories: [...profileForm.categories, cat] });
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (cat) => {
    setProfileForm({ ...profileForm, categories: profileForm.categories.filter((c) => c !== cat) });
  };

  const handleAddProduct = () => {
    const prod = newProduct.trim();
    if (prod && !profileForm.frequentProducts.includes(prod)) {
      setProfileForm({ ...profileForm, frequentProducts: [...profileForm.frequentProducts, prod] });
      setNewProduct('');
    }
  };

  const handleRemoveProduct = (prod) => {
    setProfileForm({ ...profileForm, frequentProducts: profileForm.frequentProducts.filter((p) => p !== prod) });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] bg-grid">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showModal && (
        <Modal title="Nueva Cotizacion" onClose={() => setShowModal(false)}>
          <form onSubmit={handleQuoteSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Producto necesitado <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Harina extra fina, Aceite de oliva..."
                value={quoteForm.product}
                onChange={(e) => setQuoteForm({ ...quoteForm, product: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cantidad <span className="text-red-500">*</span>
                </label>
                <input
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Unidad</label>
                <select
                  value={quoteForm.unit}
                  onChange={(e) => setQuoteForm({ ...quoteForm, unit: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] bg-white transition-all"
                >
                  {units.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Fecha de entrega requerida <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={quoteForm.deliveryDate}
                onChange={(e) => setQuoteForm({ ...quoteForm, deliveryDate: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
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
                className="flex-1 bg-gradient-to-r from-[#0D1F3C] to-[#1a3260] text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all"
              >
                Enviar cotizacion
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
                    <input
                      type="text"
                      value={profileForm.businessType}
                      onChange={(e) => setProfileForm({ ...profileForm, businessType: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                    />
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
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <input
                    type="text"
                    value={profileForm.instagram}
                    onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                  />
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
                <input
                  type="text"
                  placeholder="Nueva categoria..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="border border-[#2ECAD5] text-[#2ECAD5] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#2ECAD5]/5 transition-all text-sm"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Frequent products */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Productos frecuentes</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {profileForm.frequentProducts.map((prod) => (
                  <span key={prod} className="text-sm font-medium bg-[#f0fdfa] text-[#0D1F3C] border border-[#2ECAD5]/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                    {prod}
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(prod)}
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
                <input
                  type="text"
                  placeholder="Nuevo producto..."
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddProduct(); } }}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddProduct}
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
          className="fixed inset-0 z-50 flex items-start justify-center bg-[#0D1F3C]/60 backdrop-blur-md p-4 animate-fade-in overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && setViewingSupplier(null)}
        >
          <div className="bg-[#f8fafc] rounded-2xl shadow-2xl shadow-[#0D1F3C]/20 w-full max-w-3xl my-8 animate-fade-in-up overflow-hidden">
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
                <button
                  onClick={() => {
                    setViewingSupplier(null);
                    setShowModal(true);
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

            <div className="px-6 pb-6 space-y-5">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {supplierProducts
                    .filter((p) => viewingSupplier.products.includes(p.id))
                    .map((product) => (
                      <div key={product.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden card-premium">
                        <div className={`h-28 bg-gradient-to-br ${product.gradient} relative`}>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl">{product.emoji}</span>
                          </div>
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
              </div>

              {/* Reviews */}
              <div>
                <h4 className="text-sm font-bold text-[#0D1F3C] mb-3">Resenas</h4>
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="relative bg-[#0a1628] text-white py-8 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#2ECAD5]">Panel de comprador</span>
                {isSupplierBuying && (
                  <span className="text-[10px] font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-[#0D1F3C] px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                    Modo distribuidor
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-extrabold mt-1">
                {isSupplierBuying ? supplierProfile.companyName : 'Pasteleria Mozart'}
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {isSupplierBuying
                  ? `${supplierProfile.city} / RUT ${supplierProfile.rut}`
                  : 'Santiago / Pasteleria / RUT 72.345.678-9'}
              </p>
            </div>
            {isSupplierBuying && (
              <button
                onClick={() => navigate('/dashboard-proveedor')}
                className="flex items-center gap-2 border border-white/20 text-white font-semibold px-4 py-2 rounded-xl hover:bg-white/10 transition-all text-sm whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
                Volver a proveedor
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-blue-500 hover:shadow-lg hover:shadow-emerald-400/20 text-[#0D1F3C] font-bold px-6 py-3 rounded-xl transition-all whitespace-nowrap hover:scale-[1.02]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nueva cotizacion
            </button>
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1 mt-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'catalog'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
              </svg>
              Para ti
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              Mi Perfil
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              Cotizaciones
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'suppliers'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              Proveedores
            </button>
            <button
              onClick={() => setActiveTab('zchat')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'zchat'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              Z Chat
            </button>
          </div>
        </div>
      </div>

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
              {['Todos', ...allCategories].map((cat) => (
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

            {/* Product grid */}
            {(() => {
              const filtered = supplierProducts
                .filter((p) => {
                  const matchCat = catalogFilter === 'Todos' || p.category === catalogFilter;
                  const matchSearch = !catalogSearch || p.name.toLowerCase().includes(catalogSearch.toLowerCase()) || p.category.toLowerCase().includes(catalogSearch.toLowerCase());
                  return matchCat && matchSearch;
                })
                .sort((a, b) => {
                  if (!userCoords) return 0;
                  const supplierA = supplierProfiles.find((s) => s.products.includes(a.id));
                  const supplierB = supplierProfiles.find((s) => s.products.includes(b.id));
                  const coordsA = supplierA ? getCityCoords(supplierA.city) : null;
                  const coordsB = supplierB ? getCityCoords(supplierB.city) : null;
                  const distA = coordsA ? haversineDistance(userCoords, coordsA) : Infinity;
                  const distB = coordsB ? haversineDistance(userCoords, coordsB) : Infinity;
                  return distA - distB;
                });

              // Map product IDs to their supplier
              const getSupplierForProduct = (productId) => {
                return supplierProfiles.find((s) => s.products.includes(productId));
              };

              return filtered.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filtered.map((product) => {
                    const supplier = getSupplierForProduct(product.id);
                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-2xl border border-gray-100 overflow-hidden card-premium cursor-pointer group"
                        onClick={() => {
                          if (supplier) setViewingSupplier(supplier);
                        }}
                      >
                        {/* Product image */}
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
                          {/* Status */}
                          {product.status === 'low_stock' && (
                            <div className="absolute top-2 right-2 text-[9px] font-bold bg-amber-400/90 text-amber-900 px-2 py-0.5 rounded-full">
                              Stock bajo
                            </div>
                          )}
                          {(() => {
                            if (!userCoords || !supplier) return null;
                            const coords = getCityCoords(supplier.city);
                            if (!coords) return null;
                            const dist = haversineDistance(userCoords, coords);
                            if (dist > 100) return null;
                            return (
                              <div className="absolute top-2 left-2 text-[9px] font-bold bg-emerald-400/90 text-emerald-900 px-2 py-0.5 rounded-full">
                                Cercano
                              </div>
                            );
                          })()}
                        </div>

                        {/* Info */}
                        <div className="p-3.5">
                          <h3 className="text-sm font-bold text-[#0D1F3C] truncate">{product.name}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-base font-extrabold text-[#0D1F3C]">{product.price}</span>
                          </div>
                          {supplier && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                              <div className="w-6 h-6 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-md flex items-center justify-center text-[#2ECAD5] text-[8px] font-bold flex-shrink-0">
                                {supplier.initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold text-gray-600 truncate">{supplier.name}</p>
                                <div className="flex items-center gap-1">
                                  <svg className="w-2.5 h-2.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                  <span className="text-[10px] text-gray-400">{supplier.rating} / {supplier.city}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                <div className="w-24 h-24 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-2xl flex items-center justify-center text-[#2ECAD5] text-3xl font-extrabold border-4 border-white shadow-lg -mt-12 relative z-10">
                  {isSupplierBuying
                    ? supplierProfile.companyName.split(' ').map(w => w[0]).join('').slice(0, 2)
                    : buyerProfile.initials}
                </div>
                <div className="mt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#0D1F3C]">
                      {isSupplierBuying ? supplierProfile.companyName : buyerProfile.companyName}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                      {isSupplierBuying ? supplierProfile.description : buyerProfile.description}
                    </p>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      {isSupplierBuying ? (
                        <>
                          {supplierProfile.categories.map((cat) => (
                            <span key={cat} className="text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1 rounded-full">{cat}</span>
                          ))}
                          <span className="text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                            Distribuidor
                          </span>
                        </>
                      ) : (
                        <>
                          {buyerProfile.categories.map((cat) => (
                            <span key={cat} className="text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1 rounded-full">{cat}</span>
                          ))}
                          <span className="text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            Verificado
                          </span>
                          <span className="text-xs text-gray-400">Miembro desde Febrero 2025</span>
                        </>
                      )}
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
                { label: 'Pedidos realizados', value: '47', sub: 'este ano', icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                )},
                { label: 'Proveedores favoritos', value: '8', sub: 'guardados', icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                )},
                { label: 'Ahorro acumulado', value: '$2.1M', sub: 'CLP', icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                )},
                { label: 'Valoracion como comprador', value: '4.9', sub: '/ 5.0', icon: (
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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
              {/* Business info */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 card-premium">
                <h3 className="text-lg font-extrabold text-[#0D1F3C] mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                  </svg>
                  Informacion del negocio
                </h3>
                <div className="space-y-4">
                  {(isSupplierBuying ? [
                    { label: 'Razon social', value: supplierProfile.companyName },
                    { label: 'RUT', value: supplierProfile.rut },
                    { label: 'Ciudad', value: supplierProfile.city },
                    { label: 'Direccion', value: supplierProfile.address },
                    { label: 'Giro', value: supplierProfile.giro },
                  ] : [
                    { label: 'Razon social', value: buyerProfile.companyName },
                    { label: 'RUT', value: buyerProfile.rut },
                    { label: 'Ciudad', value: buyerProfile.city },
                    { label: 'Direccion', value: buyerProfile.address },
                    { label: 'Tipo de negocio', value: buyerProfile.businessType },
                    { label: 'Volumen mensual', value: buyerProfile.monthlyVolume },
                  ]).map((item) => (
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
                  {(isSupplierBuying ? [
                    { label: 'Email', value: supplierProfile.email, icon: (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    )},
                    { label: 'Telefono', value: supplierProfile.phone, icon: (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    )},
                    { label: 'WhatsApp', value: supplierProfile.whatsapp, icon: (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                    )},
                    { label: 'Web', value: supplierProfile.website, icon: (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                      </svg>
                    )},
                  ] : [
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
                    { label: 'Instagram', value: buyerProfile.instagram, icon: (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
                    )},
                  ]).map((item) => (
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

            {/* What I buy */}
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

            {/* Purchase history summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 card-premium">
              <h3 className="text-lg font-extrabold text-[#0D1F3C] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                </svg>
                Historial de compras reciente
              </h3>
              <div className="space-y-3">
                {[
                  { product: 'Harina de trigo extra fina', supplier: 'Agroindustrial del Sur Ltda.', amount: '800 kg', total: '$544.000', date: '2026-03-10', status: 'Entregado' },
                  { product: 'Chocolate cobertura 70%', supplier: 'Distribuidora El Roble', amount: '120 kg', total: '$1.440.000', date: '2026-03-03', status: 'Entregado' },
                  { product: 'Crema vegetal para batir', supplier: 'Valle Frio SpA', amount: '200 lt', total: '$580.000', date: '2026-02-25', status: 'Entregado' },
                ].map((order, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-[#f8fafc] rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#2ECAD5]/10 to-[#2ECAD5]/5 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#0D1F3C]">{order.product}</p>
                      <p className="text-xs text-gray-400">{order.supplier} / {order.amount} / {order.date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-[#0D1F3C]">{order.total}</p>
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== DASHBOARD TAB ===== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Cotizaciones activas', value: '3', icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                )},
                { label: 'Ofertas recibidas', value: '7', icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                )},
                { label: 'Proveedores contactados', value: '12', icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                )},
                { label: 'Ahorro estimado', value: '18%', icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                )},
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 card-premium">
                  <div className="w-9 h-9 bg-[#f8fafc] rounded-xl flex items-center justify-center text-gray-400 mb-3">
                    {s.icon}
                  </div>
                  <div className="text-2xl font-extrabold text-[#0D1F3C]">{s.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Active quotes */}
            <div>
              <h2 className="text-xl font-extrabold text-[#0D1F3C] mb-4">Cotizaciones activas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {quoteRequests.map((q) => (
                  <div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-5 card-premium">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#2ECAD5]/10 to-[#2ECAD5]/5 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                      </div>
                      <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${statusColors[q.status] || 'bg-gray-100 text-gray-600'}`}>
                        {q.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-[#0D1F3C] mb-1">{q.product}</h3>
                    <p className="text-sm text-gray-500">Cantidad: {q.quantity}</p>
                    <p className="text-xs text-gray-400 mt-2">{q.date}</p>
                    <button className="mt-4 w-full text-sm text-[#2ECAD5] border border-[#2ECAD5]/30 hover:bg-[#2ECAD5]/5 font-semibold py-2.5 rounded-xl transition-all">
                      Ver ofertas
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quote history */}
            <div>
              <h2 className="text-xl font-extrabold text-[#0D1F3C] mb-4">Historial de cotizaciones</h2>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {quoteHistory.map((q, i) => {
                  const isCompleted = q.status === 'Completada';
                  return (
                    <div
                      key={q.id}
                      className={`flex items-center gap-4 px-5 py-4 hover:bg-[#f8fafc] transition-colors ${i < quoteHistory.length - 1 ? 'border-b border-gray-50' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                        <svg className={`w-5 h-5 ${isCompleted ? 'text-emerald-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-[#0D1F3C]">{q.product}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                            {q.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {q.quantity} {q.unit} &middot; {q.date}
                          {isCompleted && q.offersCount > 0 && (
                            <span className="ml-2 text-[#2ECAD5] font-medium">{q.offersCount} ofertas &middot; Mejor precio: {q.bestPrice}</span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRepeatQuote(q)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#2ECAD5] border border-[#2ECAD5]/30 hover:bg-[#2ECAD5]/5 px-3 py-2 rounded-xl transition-all whitespace-nowrap flex-shrink-0"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Repetir
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Price alerts */}
            <div>
              <h2 className="text-xl font-extrabold text-[#0D1F3C] mb-4">Alertas de precio</h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {priceAlerts.map((alert) => (
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
                      <p className="font-semibold text-[#0D1F3C] text-sm">{alert.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Proveedor: {alert.supplier} / {alert.date}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 ${
                      alert.change === 'down' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                      {alert.change === 'down' ? 'Bajo' : 'Subio'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== SUPPLIERS TAB ===== */}
        {activeTab === 'suppliers' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-xl font-extrabold text-[#0D1F3C] mb-4">Proveedores recomendados</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {supplierProfiles.map((supplier) => (
                  <button
                    key={supplier.id}
                    onClick={() => setViewingSupplier(supplier)}
                    className="bg-white rounded-2xl border border-gray-100 p-5 card-premium text-left transition-all hover:border-[#2ECAD5]/30 hover:shadow-md group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-xl flex items-center justify-center text-[#2ECAD5] flex-shrink-0 text-sm font-bold">
                        {supplier.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#0D1F3C] text-sm">{supplier.name}</p>
                        <p className="text-xs text-[#2ECAD5] font-medium">{supplier.categories.slice(0, 2).join(' / ')}</p>
                        <p className="text-xs text-gray-400">{supplier.city}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="text-xs font-bold text-[#0D1F3C]">{supplier.rating}</span>
                        <span className="text-[10px] text-gray-400">({supplier.totalSales} ventas)</span>
                      </div>
                      {supplier.verified && (
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          Verificado
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#2ECAD5] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Ver perfil completo</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== Z CHAT TAB ===== */}
        {activeTab === 'zchat' && (
          <div className="animate-fade-in">
            <ZChat
              contacts={supplierProfiles}
              userLabel="Comprador — Pasteleria Mozart"
            />
          </div>
        )}
      </div>
    </div>
  );
}
