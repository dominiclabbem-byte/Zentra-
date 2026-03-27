import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import {
  BUSINESS_TYPE_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  buildBuyerProfileView,
} from '../lib/profileAdapters';

const emptyForm = {
  companyName: '',
  rut: '',
  city: '',
  address: '',
  description: '',
  businessType: '',
  monthlyVolume: '',
  contactMethod: 'email',
  selectedCategories: [],
  phone: '',
  whatsapp: '',
  email: '',
  password: '',
  confirmPassword: '',
  consent: false,
};

function getErrorMessage(error) {
  return error?.message || 'No se pudo guardar el perfil comprador.';
}

export default function BuyerRegistration() {
  const navigate = useNavigate();
  const { currentUser, categories, registerBuyer, saveBuyerProfile } = useAuth();
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const buyerProfile = useMemo(() => (
    currentUser ? buildBuyerProfileView(currentUser) : null
  ), [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setForm(emptyForm);
      return;
    }

    setForm((current) => ({
      ...current,
      companyName: currentUser.company_name ?? '',
      rut: currentUser.rut ?? '',
      city: currentUser.city ?? '',
      address: currentUser.address ?? '',
      description: currentUser.description ?? '',
      businessType: buyerProfile?.businessTypeValue ?? '',
      monthlyVolume: buyerProfile?.monthlyVolume ?? '',
      contactMethod: buyerProfile?.contactMethodValue ?? 'email',
      selectedCategories: currentUser.buyerCategories?.map((category) => category.id) ?? [],
      phone: currentUser.phone ?? '',
      whatsapp: currentUser.whatsapp ?? '',
      email: currentUser.email ?? '',
      password: '',
      confirmPassword: '',
      consent: true,
    }));
  }, [buyerProfile, currentUser]);

  const title = currentUser
    ? currentUser.is_buyer
      ? 'Actualizar perfil comprador'
      : 'Activar perfil comprador'
    : 'Registro de Comprador';

  const subtitle = currentUser
    ? currentUser.is_buyer
      ? 'Ajusta la informacion de abastecimiento de tu organizacion.'
      : 'Tu organizacion ya existe. Solo falta activar el rol comprador.'
    : 'Crea tu cuenta para recibir cotizaciones de proveedores verificados.';

  const buttonLabel = currentUser
    ? currentUser.is_buyer
      ? 'Guardar perfil comprador'
      : 'Activar modo comprador'
    : 'Crear cuenta de comprador';

  const handleCategory = (categoryId) => {
    setForm((current) => ({
      ...current,
      selectedCategories: current.selectedCategories.includes(categoryId)
        ? current.selectedCategories.filter((id) => id !== categoryId)
        : [...current.selectedCategories, categoryId],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser && form.password !== form.confirmPassword) {
      setToast({ message: 'Las contrasenas no coinciden.', type: 'error' });
      return;
    }

    if (!currentUser && !form.consent) {
      setToast({ message: 'Debes aceptar los terminos para continuar.', type: 'error' });
      return;
    }

    if (form.selectedCategories.length === 0) {
      setToast({ message: 'Selecciona al menos una categoria de interes.', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      companyName: form.companyName,
      rut: form.rut,
      city: form.city,
      address: form.address,
      description: form.description,
      businessType: form.businessType,
      monthlyVolume: form.monthlyVolume,
      contactMethod: form.contactMethod,
      categoryIds: form.selectedCategories,
      phone: form.phone,
      whatsapp: form.whatsapp,
      email: form.email,
      password: form.password,
    };

    try {
      if (currentUser) {
        await saveBuyerProfile(payload);
        setToast({ message: 'Perfil comprador actualizado.', type: 'success' });
        setTimeout(() => navigate('/dashboard-comprador', { state: { openQuoteModal: true } }), 1200);
      } else {
        const result = await registerBuyer(payload);

        if (result.requiresEmailConfirmation && !result.user) {
          setToast({
            message: 'Cuenta creada. Revisa tu correo para confirmar y luego inicia sesion.',
            type: 'success',
          });
          setTimeout(() => navigate('/ingresar'), 1800);
        } else {
          setToast({ message: 'Cuenta de comprador creada exitosamente.', type: 'success' });
          setTimeout(() => navigate('/dashboard-comprador', { state: { openQuoteModal: true } }), 1200);
        }
      }
    } catch (error) {
      setToast({ message: getErrorMessage(error), type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] bg-grid py-10 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-2xl mb-4 shadow-xl shadow-[#0D1F3C]/20">
            <svg className="w-8 h-8 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-[#0D1F3C]">{title}</h1>
          <p className="text-gray-500 mt-2">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
          {!currentUser && (
            <div>
              <h2 className="text-lg font-bold text-[#0D1F3C] mb-5 flex items-center gap-3">
                <span className="w-7 h-7 bg-gradient-to-r from-emerald-400 to-blue-500 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">1</span>
                Cuenta de acceso
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                    placeholder="compras@empresa.cl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Contrasena</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                    placeholder="Minimo 8 caracteres"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contrasena</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={form.confirmPassword}
                    onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                    placeholder="Repite tu contrasena"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-bold text-[#0D1F3C] mb-5 flex items-center gap-3">
              <span className="w-7 h-7 bg-gradient-to-r from-emerald-400 to-blue-500 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">{currentUser ? '1' : '2'}</span>
              Datos de la empresa
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del negocio</label>
                <input
                  type="text"
                  required
                  value={form.companyName}
                  onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                  placeholder="Ej: Pasteleria Mozart"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">RUT empresa</label>
                <input
                  type="text"
                  required
                  value={form.rut}
                  onChange={(event) => setForm((current) => ({ ...current, rut: event.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                  placeholder="76.123.456-7"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ciudad</label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                  placeholder="Ej: Santiago"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Direccion</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                  placeholder="Av. Italia 1580, Nunoa"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripcion</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all resize-none"
                  placeholder="Describe tu negocio y como compras normalmente."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de negocio</label>
                <select
                  required
                  value={form.businessType}
                  onChange={(event) => setForm((current) => ({ ...current, businessType: event.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 bg-white transition-all"
                >
                  <option value="">Selecciona tu tipo de negocio</option>
                  {BUSINESS_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Volumen mensual</label>
                <input
                  type="text"
                  value={form.monthlyVolume}
                  onChange={(event) => setForm((current) => ({ ...current, monthlyVolume: event.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                  placeholder="Ej: 2.000 kg/mes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefono</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                  placeholder="+56 2 1234 5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp</label>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={(event) => setForm((current) => ({ ...current, whatsapp: event.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#0D1F3C] mb-2 flex items-center gap-3">
              <span className="w-7 h-7 bg-gradient-to-r from-emerald-400 to-blue-500 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">{currentUser ? '2' : '3'}</span>
              Categorias de interes
            </h2>
            <p className="text-sm text-gray-500 mb-4">Selecciona los rubros donde necesitas recibir ofertas.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((category) => {
                const selected = form.selectedCategories.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategory(category.id)}
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
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#0D1F3C] mb-4 flex items-center gap-3">
              <span className="w-7 h-7 bg-gradient-to-r from-emerald-400 to-blue-500 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">{currentUser ? '3' : '4'}</span>
              Medio de contacto preferido
            </h2>
            <div className="flex flex-wrap gap-3">
              {CONTACT_METHOD_OPTIONS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, contactMethod: method.value }))}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.contactMethod === method.value
                      ? 'border-[#2ECAD5] bg-[#2ECAD5]/5 text-[#0D1F3C] shadow-sm shadow-emerald-400/10'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {!currentUser && (
            <div className="bg-[#f0fafb] rounded-xl p-5 border border-[#2ECAD5]/10">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(event) => setForm((current) => ({ ...current, consent: event.target.checked }))}
                  className="mt-1 w-4 h-4 text-[#2ECAD5] rounded border-gray-300 focus:ring-[#2ECAD5]"
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  Acepto usar mis datos de empresa para crear mi perfil en Zentra y recibir ofertas de proveedores relevantes.
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#0D1F3C] to-[#1a3260] hover:from-[#1a3260] hover:to-[#0D1F3C] text-white font-bold py-4 rounded-xl text-lg transition-all hover:shadow-xl hover:shadow-[#0D1F3C]/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Guardando...' : buttonLabel}
          </button>

          <p className="text-center text-sm text-gray-400">
            {currentUser ? (
              <Link to="/dashboard-comprador" className="text-[#2ECAD5] hover:underline font-medium">
                Ir a mi dashboard comprador
              </Link>
            ) : (
              <>
                Ya tienes cuenta?{' '}
                <Link to="/ingresar" className="text-[#2ECAD5] hover:underline font-medium">
                  Ingresar
                </Link>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
