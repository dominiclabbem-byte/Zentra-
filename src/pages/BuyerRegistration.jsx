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
      setToast({ message: 'Debes aceptar los terminos para continuar.', type: 'error' });
      return;
    }
    setToast({ message: 'Registro exitoso! Te contactaremos pronto.', type: 'success' });
    setTimeout(() => navigate('/dashboard-comprador'), 2000);
  };

  const contactIcons = {
    Email: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    WhatsApp: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    Llamada: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
      </svg>
    ),
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] bg-grid py-10 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-2xl mb-4 shadow-xl shadow-[#0D1F3C]/20">
            <svg className="w-8 h-8 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-[#0D1F3C]">Registro de Comprador</h1>
          <p className="text-gray-500 mt-2">Crea tu cuenta para recibir cotizaciones de proveedores verificados</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
          {/* Business info */}
          <div>
            <h2 className="text-lg font-bold text-[#0D1F3C] mb-5 flex items-center gap-3">
              <span className="w-7 h-7 bg-gradient-to-r from-[#2ECAD5] to-[#22a8b2] text-[#0D1F3C] rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">1</span>
              Datos de la empresa
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre del negocio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pasteleria Mozart"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
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
                  placeholder="Ej: 76.123.456-7"
                  value={form.rut}
                  onChange={(e) => setForm({ ...form, rut: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ciudad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Santiago"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tipo de negocio <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.businessType}
                  onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 bg-white transition-all"
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
            <h2 className="text-lg font-bold text-[#0D1F3C] mb-2 flex items-center gap-3">
              <span className="w-7 h-7 bg-gradient-to-r from-[#2ECAD5] to-[#22a8b2] text-[#0D1F3C] rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">2</span>
              Categorias de interes
            </h2>
            <p className="text-sm text-gray-500 mb-4">Selecciona los productos que te interesan recibir ofertas</p>
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
                        ? 'border-[#2ECAD5] bg-[#2ECAD5]/5 text-[#0D1F3C] shadow-sm shadow-[#2ECAD5]/10'
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

          {/* Contact method */}
          <div>
            <h2 className="text-lg font-bold text-[#0D1F3C] mb-4 flex items-center gap-3">
              <span className="w-7 h-7 bg-gradient-to-r from-[#2ECAD5] to-[#22a8b2] text-[#0D1F3C] rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">3</span>
              Medio de contacto preferido
            </h2>
            <div className="flex flex-wrap gap-3">
              {contactMethods.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setForm({ ...form, contactMethod: method })}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.contactMethod === method
                      ? 'border-[#2ECAD5] bg-[#2ECAD5]/5 text-[#0D1F3C] shadow-sm shadow-[#2ECAD5]/10'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {contactIcons[method]} {method}
                </button>
              ))}
            </div>
          </div>

          {/* Consent */}
          <div className="bg-[#f0fafb] rounded-xl p-5 border border-[#2ECAD5]/10">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                className="mt-1 w-4 h-4 text-[#2ECAD5] rounded border-gray-300 focus:ring-[#2ECAD5]"
              />
              <span className="text-sm text-gray-600 leading-relaxed">
                Acepto recibir ofertas de proveedores segun mis categorias seleccionadas.
                Entiendo que mis datos seran utilizados unicamente para conectarme con proveedores
                relevantes en la plataforma ProspectoLegal.
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#0D1F3C] to-[#1a3260] hover:from-[#1a3260] hover:to-[#0D1F3C] text-white font-bold py-4 rounded-xl text-lg transition-all hover:shadow-xl hover:shadow-[#0D1F3C]/20"
          >
            Crear cuenta de comprador
          </button>

          <p className="text-center text-sm text-gray-400">
            Ya tienes cuenta?{' '}
            <a href="/dashboard-comprador" className="text-[#2ECAD5] hover:underline font-medium">
              Ir a mi dashboard
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
