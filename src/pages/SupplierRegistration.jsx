import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import {
  buildSupplierProfileView,
  mapPlanRowToCard,
} from '../lib/profileAdapters';

const emptyForm = {
  companyName: '',
  rut: '',
  city: '',
  address: '',
  description: '',
  giro: '',
  phone: '',
  whatsapp: '',
  website: '',
  email: '',
  password: '',
  confirmPassword: '',
  selectedCategories: [],
  selectedPlan: '',
};

function getErrorMessage(error) {
  return error?.message || 'No se pudo guardar el perfil proveedor.';
}

export default function SupplierRegistration() {
  const navigate = useNavigate();
  const { currentUser, categories, plans, registerSupplier, saveSupplierProfile } = useAuth();
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const supplierProfile = useMemo(() => (
    currentUser ? buildSupplierProfileView(currentUser) : null
  ), [currentUser]);
  const planCards = useMemo(() => plans.map(mapPlanRowToCard), [plans]);

  useEffect(() => {
    const fallbackPlan = plans.find((plan) => plan.name === 'starter')?.id ?? plans[0]?.id ?? '';

    if (!currentUser) {
      setForm({
        ...emptyForm,
        selectedPlan: fallbackPlan,
      });
      return;
    }

    setForm({
      companyName: currentUser.company_name ?? '',
      rut: currentUser.rut ?? '',
      city: currentUser.city ?? '',
      address: currentUser.address ?? '',
      description: currentUser.description ?? '',
      giro: supplierProfile?.giro ?? '',
      phone: currentUser.phone ?? '',
      whatsapp: currentUser.whatsapp ?? '',
      website: currentUser.website ?? '',
      email: currentUser.email ?? '',
      password: '',
      confirmPassword: '',
      selectedCategories: currentUser.supplierCategories?.map((category) => category.id) ?? [],
      selectedPlan: currentUser.activeSubscription?.plan_id ?? fallbackPlan,
    });
  }, [currentUser, plans, supplierProfile]);

  const title = currentUser
    ? currentUser.is_supplier
      ? 'Actualizar perfil proveedor'
      : 'Activar perfil proveedor'
    : 'Registro de Proveedor';

  const subtitle = currentUser
    ? currentUser.is_supplier
      ? 'Edita la informacion comercial y el plan activo de tu organizacion.'
      : 'Tu organizacion ya existe. Solo falta activar el rol proveedor.'
    : 'Comienza a recibir solicitudes de cotizacion de compradores verificados.';

  const buttonLabel = currentUser
    ? currentUser.is_supplier
      ? 'Guardar perfil proveedor'
      : 'Activar modo proveedor'
    : 'Crear cuenta de proveedor';

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

    if (form.selectedCategories.length === 0) {
      setToast({ message: 'Selecciona al menos una categoria que comercializas.', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      companyName: form.companyName,
      rut: form.rut,
      city: form.city,
      address: form.address,
      description: form.description,
      giro: form.giro,
      phone: form.phone,
      whatsapp: form.whatsapp,
      website: form.website,
      categoryIds: form.selectedCategories,
      planId: form.selectedPlan,
      email: form.email,
      password: form.password,
    };

    try {
      if (currentUser) {
        await saveSupplierProfile(payload);
        setToast({ message: 'Perfil proveedor actualizado.', type: 'success' });
        setTimeout(() => navigate('/dashboard-proveedor'), 1200);
      } else {
        const result = await registerSupplier(payload);

        if (result.requiresEmailConfirmation && !result.user) {
          setToast({
            message: 'Cuenta creada. Revisa tu correo para confirmar y luego inicia sesion.',
            type: 'success',
          });
          setTimeout(() => navigate('/ingresar'), 1800);
        } else {
          setToast({ message: 'Cuenta de proveedor creada exitosamente.', type: 'success' });
          setTimeout(() => navigate('/dashboard-proveedor'), 1200);
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

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-2xl mb-4 shadow-xl shadow-[#0D1F3C]/20">
            <svg className="w-8 h-8 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-[#0D1F3C]">{title}</h1>
          <p className="text-gray-500 mt-2">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!currentUser && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 card-premium">
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
                    placeholder="ventas@empresa.cl"
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

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 card-premium">
            <h2 className="text-lg font-bold text-[#0D1F3C] mb-5 flex items-center gap-3">
              <span className="w-7 h-7 bg-gradient-to-r from-emerald-400 to-blue-500 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">{currentUser ? '1' : '2'}</span>
              Datos de la empresa
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la empresa</label>
                <input
                  type="text"
                  required
                  value={form.companyName}
                  onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                  placeholder="Ej: Valle Frio SpA"
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
                  placeholder="76.234.567-8"
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
                  placeholder="Av. Providencia 1234"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripcion comercial</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 resize-none transition-all"
                  placeholder="Describe tu empresa, cobertura y propuesta comercial."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Giro</label>
                <input
                  type="text"
                  value={form.giro}
                  onChange={(event) => setForm((current) => ({ ...current, giro: event.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                  placeholder="Distribucion mayorista de alimentos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefono</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                  placeholder="+56 2 2345 6789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp</label>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={(event) => setForm((current) => ({ ...current, whatsapp: event.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                  placeholder="+56 9 8765 4321"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sitio web</label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
                  placeholder="www.empresa.cl"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 card-premium">
            <h2 className="text-lg font-bold text-[#0D1F3C] mb-2 flex items-center gap-3">
              <span className="w-7 h-7 bg-gradient-to-r from-emerald-400 to-blue-500 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">{currentUser ? '2' : '3'}</span>
              Categorias que comercializa
            </h2>
            <p className="text-sm text-gray-500 mb-4">Selecciona los rubros principales de tu catalogo.</p>
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

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 card-premium">
            <h2 className="text-lg font-bold text-[#0D1F3C] mb-2 flex items-center gap-3">
              <span className="w-7 h-7 bg-gradient-to-r from-emerald-400 to-blue-500 text-white rounded-lg flex items-center justify-center text-sm font-bold shadow-sm">{currentUser ? '3' : '4'}</span>
              Elige tu plan
            </h2>
            <p className="text-sm text-gray-500 mb-6">Puedes cambiarlo despues desde tu dashboard. La activacion interna sigue disponible para desarrollo y el billing con Flow queda preparado para conectarlo mas adelante.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {planCards.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, selectedPlan: plan.id }))}
                  className={`relative text-left rounded-2xl border-2 p-6 transition-all ${
                    form.selectedPlan === plan.id
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
                    {form.selectedPlan === plan.id && (
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
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-[#2ECAD5] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="grid grid-cols-2 gap-2 mt-5">
                    <div className="rounded-xl bg-[#f8fafc] px-3 py-2">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Productos</div>
                      <div className="text-sm font-bold text-[#0D1F3C] mt-1">
                        {plan.maxActiveProducts ?? 'Ilimitado'}
                      </div>
                    </div>
                    <div className="rounded-xl bg-[#f8fafc] px-3 py-2">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">RFQs / mes</div>
                      <div className="text-sm font-bold text-[#0D1F3C] mt-1">
                        {plan.maxQuoteResponsesPerMonth ?? 'Ilimitado'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#0D1F3C] to-[#1a3260] hover:from-[#1a3260] hover:to-[#0D1F3C] text-white font-bold py-4 rounded-xl text-lg transition-all hover:shadow-xl hover:shadow-[#0D1F3C]/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Guardando...' : buttonLabel}
          </button>

          <p className="text-center text-sm text-gray-400">
            {currentUser ? (
              <Link to="/dashboard-proveedor" className="text-[#2ECAD5] hover:underline font-medium">
                Ir a mi dashboard proveedor
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
