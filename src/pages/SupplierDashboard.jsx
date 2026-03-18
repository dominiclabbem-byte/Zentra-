import { useState } from 'react';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import { quoteRequests, supplierStats, salesAgents, supplierProducts } from '../data/mockData';

const CURRENT_PLAN = 'pro'; // simulated current plan
const PLANS_WITH_AGENTS = ['pro', 'enterprise'];

export default function SupplierDashboard() {
  const [toast, setToast] = useState(null);
  const [quoteModal, setQuoteModal] = useState(null);
  const [offerForm, setOfferForm] = useState({ price: '', notes: '' });
  const [activeTab, setActiveTab] = useState('quotes');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [productDetail, setProductDetail] = useState(null);

  const hasAgentAccess = PLANS_WITH_AGENTS.includes(CURRENT_PLAN);

  const handleOfferSubmit = (e) => {
    e.preventDefault();
    setQuoteModal(null);
    setToast({ message: `Cotizacion enviada a ${quoteModal.buyer}!`, type: 'success' });
    setOfferForm({ price: '', notes: '' });
  };

  const handleAgentChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', text: chatInput, time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    setTimeout(() => {
      const responses = [
        `Entendido. He actualizado la estrategia de contacto para ${selectedAgent.name}. Los prospectos recibiran el nuevo mensaje a partir de manana.`,
        `He revisado las metricas. La tasa de respuesta subio un 12% esta semana. Recomiendo mantener la frecuencia actual de seguimiento.`,
        `Perfecto, pausare las llamadas automaticas a ese cliente. Puedes reactivarlas desde aqui cuando quieras.`,
        `Listo. He priorizado los leads de Santiago y Valparaiso como solicitaste. Las proximas 10 interacciones seran con esos prospectos.`,
      ];
      const aiMsg = {
        role: 'agent',
        text: responses[Math.floor(Math.random() * responses.length)],
        time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    }, 1200);
  };

  const selectAgent = (agent) => {
    setSelectedAgent(agent);
    setChatMessages([
      { role: 'agent', text: `Hola! Soy ${agent.name}, tu agente de ventas IA. Hoy he gestionado ${agent.conversationsToday} conversaciones. En que puedo ayudarte?`, time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) },
    ]);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] bg-grid">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {quoteModal && (
        <Modal title={`Cotizar -- ${quoteModal.product}`} onClose={() => setQuoteModal(null)}>
          <div className="bg-[#f8fafc] rounded-xl p-4 mb-5 text-sm space-y-1.5">
            <p><span className="font-medium text-gray-400 text-xs uppercase tracking-wide">Comprador</span><br /><span className="text-[#0D1F3C] font-semibold">{quoteModal.buyer}</span></p>
            <p><span className="font-medium text-gray-400 text-xs uppercase tracking-wide">Producto</span><br /><span className="text-[#0D1F3C]">{quoteModal.product}</span></p>
            <p><span className="font-medium text-gray-400 text-xs uppercase tracking-wide">Cantidad</span><br /><span className="text-[#0D1F3C]">{quoteModal.quantity}</span></p>
          </div>
          <form onSubmit={handleOfferSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Precio ofertado (CLP/kg) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
                <input
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notas adicionales
              </label>
              <textarea
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
                onClick={() => setQuoteModal(null)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-[#2ECAD5] to-[#22a8b2] text-[#0D1F3C] font-bold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-[#2ECAD5]/20"
              >
                Enviar oferta
              </button>
            </div>
          </form>
        </Modal>
      )}

      {productDetail && (
        <Modal title={productDetail.name} onClose={() => setProductDetail(null)}>
          {/* Large AI product image */}
          <div className={`relative h-56 rounded-xl bg-gradient-to-br ${productDetail.gradient} overflow-hidden mb-5`}>
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
            <div className="absolute bottom-3 left-3 bg-black/30 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Imagen generada con Nano Banana Pro 2
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
                onClick={() => {
                  setProductDetail(null);
                  setToast({ message: 'Funcion de edicion proximamente disponible', type: 'info' });
                }}
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
                className="flex-1 bg-gradient-to-r from-[#2ECAD5] to-[#22a8b2] text-[#0D1F3C] font-bold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-[#2ECAD5]/20 flex items-center justify-center gap-2"
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

      {/* Header */}
      <div className="relative bg-[#0a1628] text-white py-8 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#2ECAD5]/5 rounded-full blur-[80px]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#2ECAD5]">Panel de proveedor</span>
                <span className="text-[10px] font-bold bg-gradient-to-r from-[#2ECAD5] to-[#22a8b2] text-[#0D1F3C] px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                  Plan {CURRENT_PLAN}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold">Valle Frio SpA</h1>
              <p className="text-gray-500 text-sm mt-0.5">Santiago / RUT 76.234.567-8</p>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1 mt-6">
            <button
              onClick={() => setActiveTab('quotes')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'quotes'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              Cotizaciones
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'products'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              Mis Productos
              <span className="text-[10px] font-bold bg-white/10 text-[#2ECAD5] px-2 py-0.5 rounded-full">
                {supplierProducts.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'agents'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              Agentes de Venta IA
              {hasAgentAccess && (
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ===== QUOTES TAB ===== */}
        {activeTab === 'quotes' && (
          <div className="space-y-8 animate-fade-in">
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Compradores activos', value: supplierStats.activeBuyers, icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                ), color: 'text-[#0D1F3C]' },
                { label: 'Solicitudes este mes', value: supplierStats.quotesThisMonth, icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                ), color: 'text-[#0D1F3C]' },
                { label: 'Tasa de conversion', value: supplierStats.conversionRate, icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                ), color: 'text-[#2ECAD5]' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-6 card-premium">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#f8fafc] rounded-xl flex items-center justify-center text-gray-400">
                      {stat.icon}
                    </div>
                    <span className="text-sm text-gray-500">{stat.label}</span>
                  </div>
                  <div className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Quote requests table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-[#0D1F3C]">Solicitudes de cotizacion</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">{quoteRequests.length} solicitudes</span>
              </div>

              {/* Desktop table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hidden sm:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Comprador</th>
                      <th className="text-left px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Producto</th>
                      <th className="text-left px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Cantidad</th>
                      <th className="text-left px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                      <th className="text-left px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Accion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {quoteRequests.map((q) => (
                      <tr key={q.id} className="hover:bg-[#f8fafc] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-lg flex items-center justify-center text-[#2ECAD5] text-xs font-bold">
                              {q.buyer.charAt(0)}
                            </div>
                            <span className="font-semibold text-[#0D1F3C] text-sm">{q.buyer}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{q.product}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{q.quantity}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{q.date}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setQuoteModal(q)}
                            className="bg-gradient-to-r from-[#2ECAD5] to-[#22a8b2] hover:shadow-lg hover:shadow-[#2ECAD5]/20 text-[#0D1F3C] font-bold text-sm px-4 py-2 rounded-lg transition-all"
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
                  <div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-5 card-premium">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-[#0D1F3C]">{q.buyer}</p>
                        <p className="text-sm text-gray-500">{q.product} / {q.quantity}</p>
                        <p className="text-xs text-gray-400 mt-1">{q.date}</p>
                      </div>
                      <button
                        onClick={() => setQuoteModal(q)}
                        className="bg-gradient-to-r from-[#2ECAD5] to-[#22a8b2] text-[#0D1F3C] font-bold text-sm px-4 py-2 rounded-lg transition-all"
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
              <h2 className="text-xl font-extrabold text-[#0D1F3C] mb-4">Actividad reciente</h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {[
                  { icon: (
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ), text: 'Pasteleria Mozart acepto tu oferta de Frambuesa IQF a $4.200/kg', time: 'Hace 2 horas' },
                  { icon: (
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  ), text: 'Nueva solicitud de Mix berries -- Hotel Ritz Santiago (200 kg)', time: 'Hace 5 horas' },
                  { icon: (
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ), text: 'Catering El Toldo Azul vio tu perfil', time: 'Hace 1 dia' },
                  { icon: (
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  ), text: 'Recibiste una nueva resena 5 estrellas de Pasteleria Mozart', time: 'Hace 2 dias' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 hover:bg-[#f8fafc] transition-colors">
                    <div className="w-10 h-10 bg-[#f8fafc] rounded-xl flex items-center justify-center flex-shrink-0">
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
        )}

        {/* ===== PRODUCTS TAB ===== */}
        {activeTab === 'products' && (
          <div className="space-y-8 animate-fade-in">
            {/* Product stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Productos activos', value: supplierProducts.filter(p => p.status === 'active').length, color: 'text-emerald-500' },
                { label: 'Stock bajo', value: supplierProducts.filter(p => p.status === 'low_stock').length, color: 'text-amber-500' },
                { label: 'Categorias', value: [...new Set(supplierProducts.map(p => p.category))].length, color: 'text-[#2ECAD5]' },
                { label: 'Total productos', value: supplierProducts.length, color: 'text-[#0D1F3C]' },
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
                <p className="text-sm text-gray-400 mt-1">Imagenes generadas con IA (Nano Banana Pro 2)</p>
              </div>
              <button
                onClick={() => setToast({ message: 'Funcion de agregar producto proximamente disponible', type: 'info' })}
                className="bg-gradient-to-r from-[#2ECAD5] to-[#22a8b2] text-[#0D1F3C] font-bold text-sm px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-[#2ECAD5]/20 hover:scale-[1.02] flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Agregar producto
              </button>
            </div>

            {/* Product grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {supplierProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => setProductDetail(product)}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden card-premium cursor-pointer group"
                >
                  {/* AI-generated product image */}
                  <div className={`relative h-48 bg-gradient-to-br ${product.gradient} overflow-hidden`}>
                    {/* Decorative shapes to simulate AI-generated imagery */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-4 left-4 w-24 h-24 bg-white/30 rounded-full blur-xl" />
                      <div className="absolute bottom-6 right-6 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-black/10 rounded-full blur-lg" />
                    </div>
                    {/* Frost/ice crystal pattern for IQF */}
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
                    {/* Central product emoji/icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-7xl filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-500">
                        {product.emoji}
                      </div>
                    </div>
                    {/* AI badge */}
                    <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                      IA Gen
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
                      <span className="text-xs font-semibold text-[#2ECAD5] group-hover:underline">Ver detalle →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== AGENTS TAB ===== */}
        {activeTab === 'agents' && (
          <div className="animate-fade-in">
            {!hasAgentAccess ? (
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
                <button className="bg-gradient-to-r from-[#2ECAD5] to-[#22a8b2] text-[#0D1F3C] font-bold px-8 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-[#2ECAD5]/20 hover:scale-[1.02]">
                  Actualizar a Pro
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
                            ? 'border-[#2ECAD5] bg-[#2ECAD5]/5 shadow-lg shadow-[#2ECAD5]/10'
                            : 'border-gray-100 bg-white hover:border-gray-200 card-premium'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                            agent.status === 'active'
                              ? 'bg-gradient-to-br from-[#2ECAD5] to-[#22a8b2] text-[#0D1F3C]'
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
                                ? 'bg-gradient-to-br from-[#2ECAD5] to-[#22a8b2] text-[#0D1F3C]'
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
                        </div>

                        {/* Chat input */}
                        <form onSubmit={handleAgentChat} className="border-t border-gray-100 px-4 py-3 flex items-center gap-3">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder={`Mensaje a ${selectedAgent.name}...`}
                            className="flex-1 bg-[#f8fafc] border border-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                          />
                          <button
                            type="submit"
                            className="w-10 h-10 bg-gradient-to-r from-[#2ECAD5] to-[#22a8b2] rounded-xl flex items-center justify-center text-[#0D1F3C] hover:shadow-lg hover:shadow-[#2ECAD5]/20 transition-all flex-shrink-0"
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
