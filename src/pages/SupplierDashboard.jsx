import { useState } from 'react';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import { quoteRequests, supplierStats } from '../data/mockData';

export default function SupplierDashboard() {
  const [toast, setToast] = useState(null);
  const [quoteModal, setQuoteModal] = useState(null);
  const [offerForm, setOfferForm] = useState({ price: '', notes: '' });

  const handleOfferSubmit = (e) => {
    e.preventDefault();
    setQuoteModal(null);
    setToast({ message: `¡Cotización enviada a ${quoteModal.buyer}!`, type: 'success' });
    setOfferForm({ price: '', notes: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {quoteModal && (
        <Modal title={`Cotizar — ${quoteModal.product}`} onClose={() => setQuoteModal(null)}>
          <div className="bg-gray-50 rounded-xl p-4 mb-5 text-sm space-y-1">
            <p><span className="font-medium text-gray-500">Comprador:</span> <span className="text-[#0D1F3C] font-semibold">{quoteModal.buyer}</span></p>
            <p><span className="font-medium text-gray-500">Producto:</span> {quoteModal.product}</p>
            <p><span className="font-medium text-gray-500">Cantidad:</span> {quoteModal.quantity}</p>
            <p><span className="font-medium text-gray-500">Fecha solicitud:</span> {quoteModal.date}</p>
          </div>
          <form onSubmit={handleOfferSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio ofertado (CLP/kg) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="4.200"
                  value={offerForm.price}
                  onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas adicionales
              </label>
              <textarea
                rows={3}
                placeholder="Ej: Disponibilidad inmediata. Entrega en 48hrs. Incluye flete a Santiago."
                value={offerForm.notes}
                onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setQuoteModal(null)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#2ECAD5] hover:bg-[#22a8b2] text-[#0D1F3C] font-bold py-3 rounded-xl transition-colors"
              >
                Enviar oferta
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Header */}
      <div className="bg-[#0D1F3C] text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-[#2ECAD5] text-sm font-medium mb-1">Panel de proveedor</p>
          <h1 className="text-2xl font-bold">Bienvenido, Valle Frío SpA 🏭</h1>
          <p className="text-gray-400 text-sm mt-1">Santiago · RUT 76.234.567-8 · Plan Pro</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-3xl font-bold text-[#0D1F3C]">{supplierStats.activeBuyers}</div>
            <div className="text-sm text-gray-500 mt-1">Compradores activos</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
            <div className="text-3xl mb-2">📋</div>
            <div className="text-3xl font-bold text-[#0D1F3C]">{supplierStats.quotesThisMonth}</div>
            <div className="text-sm text-gray-500 mt-1">Solicitudes este mes</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-3xl font-bold text-[#2ECAD5]">{supplierStats.conversionRate}</div>
            <div className="text-sm text-gray-500 mt-1">Tasa de conversión</div>
          </div>
        </div>

        {/* Quote requests table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#0D1F3C]">Solicitudes de cotización recientes</h2>
            <span className="text-sm text-gray-400">{quoteRequests.length} solicitudes</span>
          </div>

          {/* Desktop table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hidden sm:block">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Comprador</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {quoteRequests.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#0D1F3C]/10 rounded-lg flex items-center justify-center text-sm">🏪</div>
                        <span className="font-semibold text-[#0D1F3C] text-sm">{q.buyer}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{q.product}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{q.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{q.date}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setQuoteModal(q)}
                        className="bg-[#2ECAD5] hover:bg-[#22a8b2] text-[#0D1F3C] font-bold text-sm px-4 py-2 rounded-lg transition-colors"
                      >
                        Cotizar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {quoteRequests.map((q) => (
              <div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-[#0D1F3C]">{q.buyer}</p>
                    <p className="text-sm text-gray-500">{q.product} · {q.quantity}</p>
                    <p className="text-xs text-gray-400 mt-1">{q.date}</p>
                  </div>
                  <button
                    onClick={() => setQuoteModal(q)}
                    className="bg-[#2ECAD5] hover:bg-[#22a8b2] text-[#0D1F3C] font-bold text-sm px-4 py-2 rounded-lg transition-colors"
                  >
                    Cotizar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div>
          <h2 className="text-xl font-bold text-[#0D1F3C] mb-4">Actividad reciente</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {[
              { icon: '✅', text: 'Pastelería Mozart aceptó tu oferta de Frambuesa IQF a $4.200/kg', time: 'Hace 2 horas' },
              { icon: '📩', text: 'Nueva solicitud de Mix berries — Hotel Ritz Santiago (200 kg)', time: 'Hace 5 horas' },
              { icon: '👁️', text: 'Catering El Toldo Azul vio tu perfil', time: 'Hace 1 día' },
              { icon: '⭐', text: 'Recibiste una nueva reseña 5 estrellas de Pastelería Mozart', time: 'Hace 2 días' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-5">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{item.text}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
