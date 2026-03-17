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
    setToast({ message: '¡Registro exitoso! Tu cuenta ha sido creada.', type: 'success' });
    setTimeout(() => navigate('/dashboard-proveedor'), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0D1F3C] rounded-2xl text-3xl mb-4">
            🏭
          </div>
          <h1 className="text-3xl font-bold text-[#0D1F3C]">Registro de Proveedor</h1>
          <p className="text-gray-500 mt-2">Comienza a recibir solicitudes de cotización de compradores verificados</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-lg font-bold text-[#0D1F3C] mb-5 flex items-center gap-2">
              <span className="w-7 h-7 bg-[#2ECAD5] text-[#0D1F3C] rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Datos de la empresa
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la empresa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Valle Frío SpA"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RUT empresa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="76.234.567-8"
                  value={form.rut}
                  onChange={(e) => setForm({ ...form, rut: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre contacto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Juan Pérez"
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="contacto@empresa.cl"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+56 9 1234 5678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-lg font-bold text-[#0D1F3C] mb-2 flex items-center gap-2">
              <span className="w-7 h-7 bg-[#2ECAD5] text-[#0D1F3C] rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Categorías que comercializa
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
                        ? 'border-[#2ECAD5] bg-[#2ECAD5]/10 text-[#0D1F3C]'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span>{selected ? '✅' : '⬜'}</span>
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plan selector */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-lg font-bold text-[#0D1F3C] mb-2 flex items-center gap-2">
              <span className="w-7 h-7 bg-[#2ECAD5] text-[#0D1F3C] rounded-full flex items-center justify-center text-sm font-bold">3</span>
              Elige tu plan
            </h2>
            <p className="text-sm text-gray-500 mb-6">Sin contrato de permanencia · Cancela cuando quieras</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative text-left rounded-2xl border-2 p-5 transition-all ${
                    selectedPlan === plan.id
                      ? 'border-[#2ECAD5] bg-[#2ECAD5]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${plan.highlight ? 'ring-2 ring-[#2ECAD5]/30' : ''}`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2ECAD5] text-[#0D1F3C] text-xs font-bold px-3 py-1 rounded-full">
                      MÁS POPULAR
                    </span>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-[#0D1F3C] text-lg">{plan.name}</span>
                    {selectedPlan === plan.id && <span className="text-[#2ECAD5] text-xl">✓</span>}
                  </div>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-[#0D1F3C]">{plan.price}</span>
                    <span className="text-gray-400 text-sm">{plan.period}</span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-[#2ECAD5] mt-0.5">✓</span>
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
            className="w-full bg-[#0D1F3C] hover:bg-[#1a3260] text-white font-bold py-4 rounded-xl text-lg transition-colors"
          >
            Crear cuenta de proveedor →
          </button>
          <p className="text-center text-sm text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <a href="/dashboard-proveedor" className="text-[#2ECAD5] hover:underline">
              Ir a mi dashboard
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
