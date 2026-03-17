import { useState } from 'react';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import { quoteRequests, priceAlerts } from '../data/mockData';

const units = ['kg', 'unidades', 'cajas'];

const statusColors = {
  'Recibiendo ofertas': 'bg-blue-100 text-blue-700',
  '3 ofertas recibidas': 'bg-green-100 text-green-700',
};

export default function BuyerDashboard() {
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    product: '',
    quantity: '',
    unit: 'kg',
    deliveryDate: '',
  });

  const handleQuoteSubmit = (e) => {
    e.preventDefault();
    setShowModal(false);
    setToast({ message: '¡Cotización enviada! Recibirás ofertas en menos de 24hrs.', type: 'success' });
    setQuoteForm({ product: '', quantity: '', unit: 'kg', deliveryDate: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showModal && (
        <Modal title="Nueva Cotización" onClose={() => setShowModal(false)}>
          <form onSubmit={handleQuoteSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producto necesitado <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Frambuesa IQF"
                value={quoteForm.product}
                onChange={(e) => setQuoteForm({ ...quoteForm, product: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="500"
                  value={quoteForm.quantity}
                  onChange={(e) => setQuoteForm({ ...quoteForm, quantity: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20"
                />
              </div>
              <div className="w-28">
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                <select
                  value={quoteForm.unit}
                  onChange={(e) => setQuoteForm({ ...quoteForm, unit: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] bg-white"
                >
                  {units.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de entrega requerida <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={quoteForm.deliveryDate}
                onChange={(e) => setQuoteForm({ ...quoteForm, deliveryDate: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#0D1F3C] text-white font-bold py-3 rounded-xl hover:bg-[#1a3260] transition-colors"
              >
                Enviar cotización
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Page header */}
      <div className="bg-[#0D1F3C] text-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[#2ECAD5] text-sm font-medium mb-1">Panel de comprador</p>
            <h1 className="text-2xl font-bold">Bienvenido, Pastelería Mozart 🎂</h1>
            <p className="text-gray-400 text-sm mt-1">Santiago · Pastelería · RUT 72.345.678-9</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#2ECAD5] hover:bg-[#22a8b2] text-[#0D1F3C] font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
          >
            <span className="text-lg">+</span> Nueva cotización
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Cotizaciones activas', value: '3', icon: '📋' },
            { label: 'Ofertas recibidas', value: '7', icon: '📬' },
            { label: 'Proveedores contactados', value: '12', icon: '🤝' },
            { label: 'Ahorro estimado', value: '18%', icon: '💰' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-[#0D1F3C]">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Active quotes */}
        <div>
          <h2 className="text-xl font-bold text-[#0D1F3C] mb-4">Cotizaciones activas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quoteRequests.map((q) => (
              <div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-2xl">
                    {q.product.toLowerCase().includes('frambuesa') ? '🍓'
                      : q.product.toLowerCase().includes('berry') || q.product.toLowerCase().includes('berries') ? '🫐'
                      : q.product.toLowerCase().includes('mango') ? '🥭'
                      : '🌿'}
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[q.status] || 'bg-gray-100 text-gray-600'}`}>
                    {q.status}
                  </span>
                </div>
                <h3 className="font-bold text-[#0D1F3C] mb-1">{q.product}</h3>
                <p className="text-sm text-gray-500">Cantidad: {q.quantity}</p>
                <p className="text-xs text-gray-400 mt-2">📅 {q.date}</p>
                <button className="mt-4 w-full text-sm text-[#2ECAD5] border border-[#2ECAD5] hover:bg-[#2ECAD5]/10 font-medium py-2 rounded-lg transition-colors">
                  Ver ofertas
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Price alerts */}
        <div>
          <h2 className="text-xl font-bold text-[#0D1F3C] mb-4">Alertas de precio</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {priceAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-4 p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                  alert.change === 'down' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {alert.change === 'down' ? '📉' : '📈'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#0D1F3C] text-sm">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Proveedor: {alert.supplier} · {alert.date}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${
                  alert.change === 'down' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {alert.change === 'down' ? '↓ Bajó' : '↑ Subió'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended suppliers */}
        <div>
          <h2 className="text-xl font-bold text-[#0D1F3C] mb-4">Proveedores recomendados para ti</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: 'Valle Frío SpA', match: '98%', category: 'Berries IQF · Mix berries', city: 'Santiago' },
              { name: 'Surfrut Ltda.', match: '91%', category: 'Berries IQF · Verduras IQF', city: 'Rancagua' },
              { name: 'Best Food Chile SpA', match: '85%', category: 'Frutas tropicales · IQF', city: 'Valparaíso' },
            ].map((s) => (
              <div key={s.name} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-[#0D1F3C]/5 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🏭</div>
                <div className="min-w-0">
                  <p className="font-bold text-[#0D1F3C] text-sm">{s.name}</p>
                  <p className="text-xs text-[#2ECAD5]">{s.category}</p>
                  <p className="text-xs text-gray-400">📍 {s.city}</p>
                </div>
                <span className="ml-auto text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full flex-shrink-0">
                  {s.match}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
