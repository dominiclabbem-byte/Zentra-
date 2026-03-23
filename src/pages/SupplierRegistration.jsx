import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { categories, plans } from '../data/mockData';

export default function SupplierRegistration() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [form, setForm] = useState({
    companyName: '',
    rut: '',
    contactName: '',
    email: '',
    phone: '',
    selectedCategories: [],
  });

  const handleCategory = (cat) => {
    setForm((f) => ({
      ...f,
      selectedCategories: f.selectedCategories.includes(cat)
        ? f.selectedCategories.filter((c) => c !== cat)
        : [...f.selectedCategories, cat],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setToast({ message: 'Registro exitoso! Tu cuenta ha sido creada.', type: 'success' });
    setTimeout(() => navigate('/dashboard-proveedor'), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] bg-grid py-10 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-2xl mb-4 shadow-xl shadow-[#0D1F3C]/20">
            <svg className="w-8 h-8 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-[#0D1F3C]">Registro de Proveedor</h1>
          <p className="text-gray-500 mt-2">Comienza a recibir solicitudes de cotizacion de compradores verificados</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 card-premium">
            <h2 className="text-lg font-bold text-[#0D1F3C] mb-5 flex items-center gap-3">
              <span className="w-7 h-7 bg-gradient-to-r from-emerald-400 to-blue-500 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">1</span>
              Datos de la empresa
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre de la empresa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Valle Frio SpA"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  RUT empresa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="76.234.567-8"
                  value={form.rut}
                  onChange={(e) => setForm({ ...form, rut: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre contacto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Juan Perez"
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="contacto@empresa.cl"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Telefono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+56 9 1234 5678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 card-premium">
            <h2 className="text-lg font-bold text-[#0D1F3C] mb-2 flex items-center gap-3">
              <span className="w-7 h-7 bg-gradient-to-r from-emerald-400 to-blue-500 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">2</span>
              Categorias que comercializa
            </h2>
            <p className="text-sm text-gray-500 mb-4">Selecciona los productos que ofreces</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((cat) => {
                const selected = form.selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategory(cat)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                      selected
                        ? 'border-[#2ECAD5] bg-[#2ECAD5]/5 text-[#0D1F3C] shadow-sm shadow-emerald-400/10'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${selected ? 'bg-[#2ECAD5] text-white' : 'bg-gray-100'}`}>
                      {selected && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </span>
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plan selector */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 card-premium">
            <h2 className="text-lg font-bold text-[#0D1F3C] mb-2 flex items-center gap-3">
              <span className="w-7 h-7 bg-gradient-to-r from-emerald-400 to-blue-500 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">3</span>
              Elige tu plan
            </h2>
            <p className="text-sm text-gray-500 mb-6">Sin contrato de permanencia / Cancela cuando quieras</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative text-left rounded-2xl border-2 p-6 transition-all ${
                    selectedPlan === plan.id
                      ? 'border-[#2ECAD5] bg-[#2ECAD5]/5 shadow-lg shadow-emerald-400/10'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${plan.highlight ? 'ring-2 ring-[#2ECAD5]/20' : ''}`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-400 to-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm">
                      Mas popular
                    </span>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-[#0D1F3C] text-lg">{plan.name}</span>
                    {selectedPlan === plan.id && (
                      <span className="w-6 h-6 bg-[#2ECAD5] rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="mb-4">
                    <span className="text-2xl font-extrabold text-[#0D1F3C]">{plan.price}</span>
                    <span className="text-gray-400 text-sm">{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-[#2ECAD5] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#0D1F3C] to-[#1a3260] hover:from-[#1a3260] hover:to-[#0D1F3C] text-white font-bold py-4 rounded-xl text-lg transition-all hover:shadow-xl hover:shadow-[#0D1F3C]/20"
          >
            Crear cuenta de proveedor
          </button>
          <p className="text-center text-sm text-gray-400">
            Ya tienes cuenta?{' '}
            <a href="/dashboard-proveedor" className="text-[#2ECAD5] hover:underline font-medium">
              Ir a mi dashboard
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
