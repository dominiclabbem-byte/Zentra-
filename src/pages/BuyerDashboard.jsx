import { useState } from 'react';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import { quoteRequests, priceAlerts } from '../data/mockData';

const units = ['kg', 'unidades', 'cajas'];

const statusColors = {
  'Recibiendo ofertas': 'bg-blue-50 text-blue-600 border border-blue-100',
  '3 ofertas recibidas': 'bg-emerald-50 text-emerald-600 border border-emerald-100',
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
    setToast({ message: 'Cotizacion enviada! Recibiras ofertas en menos de 24hrs.', type: 'success' });
    setQuoteForm({ product: '', quantity: '', unit: 'kg', deliveryDate: '' });
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
                placeholder="Ej: Frambuesa IQF"
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

      {/* Page header */}
      <div className="relative bg-[#0a1628] text-white py-8 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px]" />
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#2ECAD5]">Panel de comprador</span>
            <h1 className="text-2xl font-extrabold mt-1">Pasteleria Mozart</h1>
            <p className="text-gray-500 text-sm mt-0.5">Santiago / Pasteleria / RUT 72.345.678-9</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#2ECAD5] to-[#22a8b2] hover:shadow-lg hover:shadow-[#2ECAD5]/20 text-[#0D1F3C] font-bold px-6 py-3 rounded-xl transition-all whitespace-nowrap hover:scale-[1.02]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva cotizacion
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
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

        {/* Recommended suppliers */}
        <div>
          <h2 className="text-xl font-extrabold text-[#0D1F3C] mb-4">Proveedores recomendados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: 'Valle Frio SpA', match: '98%', category: 'Berries IQF / Mix berries', city: 'Santiago' },
              { name: 'Surfrut Ltda.', match: '91%', category: 'Berries IQF / Verduras IQF', city: 'Rancagua' },
              { name: 'Best Food Chile SpA', match: '85%', category: 'Frutas tropicales / IQF', city: 'Valparaiso' },
            ].map((s) => (
              <div key={s.name} className="bg-white rounded-2xl border border-gray-100 p-5 card-premium flex items-center gap-4">
                <div className="w-11 h-11 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-xl flex items-center justify-center text-[#2ECAD5] flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#0D1F3C] text-sm">{s.name}</p>
                  <p className="text-xs text-[#2ECAD5] font-medium">{s.category}</p>
                  <p className="text-xs text-gray-400">{s.city}</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex-shrink-0">
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
