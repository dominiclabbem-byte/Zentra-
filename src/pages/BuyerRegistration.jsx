import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { categories, businessTypes } from '../data/mockData';

const contactMethods = ['Email', 'WhatsApp', 'Llamada'];

export default function BuyerRegistration() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    businessName: '',
    rut: '',
    city: '',
    businessType: '',
    selectedCategories: [],
    contactMethod: '',
    consent: false,
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
    if (!form.consent) {
      setToast({ message: 'Debes aceptar los términos para continuar.', type: 'error' });
      return;
    }
    setToast({ message: '¡Registro exitoso! Te contactaremos pronto.', type: 'success' });
    setTimeout(() => navigate('/dashboard-comprador'), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0D1F3C] rounded-2xl text-3xl mb-4">
            🛒
          </div>
          <h1 className="text-3xl font-bold text-[#0D1F3C]">Registro de Comprador</h1>
          <p className="text-gray-500 mt-2">Crea tu cuenta para recibir cotizaciones de proveedores verificados</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          {/* Business info */}
          <div>
            <h2 className="text-lg font-bold text-[#0D1F3C] mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-[#2ECAD5] text-[#0D1F3C] rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Datos de la empresa
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del negocio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pastelería Mozart"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
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
                  placeholder="Ej: 76.123.456-7"
                  value={form.rut}
                  onChange={(e) => setForm({ ...form, rut: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Santiago"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de negocio <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.businessType}
                  onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 bg-white"
                >
                  <option value="">Selecciona tu tipo de negocio</option>
                  {businessTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h2 className="text-lg font-bold text-[#0D1F3C] mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-[#2ECAD5] text-[#0D1F3C] rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Categorías de interés
            </h2>
            <p className="text-sm text-gray-500 mb-3">Selecciona los productos que te interesan recibir ofertas</p>
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

          {/* Contact method */}
          <div>
            <h2 className="text-lg font-bold text-[#0D1F3C] mb-4 flex items-center gap-2">
              <span className="w-7 h-7 bg-[#2ECAD5] text-[#0D1F3C] rounded-full flex items-center justify-center text-sm font-bold">3</span>
              Medio de contacto preferido
            </h2>
            <div className="flex flex-wrap gap-3">
              {contactMethods.map((method) => {
                const icons = { Email: '📧', WhatsApp: '💬', Llamada: '📞' };
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setForm({ ...form, contactMethod: method })}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.contactMethod === method
                        ? 'border-[#2ECAD5] bg-[#2ECAD5]/10 text-[#0D1F3C]'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {icons[method]} {method}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Consent */}
          <div className="bg-blue-50 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                className="mt-1 w-4 h-4 text-[#2ECAD5] rounded border-gray-300"
              />
              <span className="text-sm text-gray-600 leading-relaxed">
                Acepto recibir ofertas de proveedores según mis categorías seleccionadas.
                Entiendo que mis datos serán utilizados únicamente para conectarme con proveedores
                relevantes en la plataforma ProspectoLegal.
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-[#0D1F3C] hover:bg-[#1a3260] text-white font-bold py-4 rounded-xl text-lg transition-colors"
          >
            Crear cuenta de comprador →
          </button>

          <p className="text-center text-sm text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <a href="/dashboard-comprador" className="text-[#2ECAD5] hover:underline">
              Ir a mi dashboard
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
