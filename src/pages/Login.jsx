import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import Toast from '../components/Toast';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'comprador';
  const isSupplier = role === 'proveedor';

  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulacion de login
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem('zentra_session', JSON.stringify({ role, loggedIn: true }));
      setToast({ message: 'Sesion iniciada correctamente.', type: 'success' });
      setTimeout(() => {
        navigate(
          isSupplier ? '/dashboard-proveedor' : '/dashboard-comprador',
          isSupplier ? { state: { activeTab: 'profile' } } : undefined
        );
      }, 1200);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] bg-grid flex items-center justify-center py-10 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-2xl mb-4 shadow-xl shadow-[#0D1F3C]/20">
            <span className="text-3xl">{isSupplier ? '🏪' : '🛒'}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#0D1F3C]">
            Iniciar Sesión
          </h1>
          <p className="text-gray-500 mt-2">
            Accede como <span className="font-semibold text-[#0D1F3C]">{isSupplier ? 'Proveedor' : 'Comprador'}</span>
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 card-premium animate-fade-in-up">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="empresa@ejemplo.cl"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2ECAD5] focus:ring-2 focus:ring-[#2ECAD5]/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-400 to-blue-500 hover:from-emerald-500 hover:to-blue-600 text-white font-bold py-3.5 rounded-xl text-sm transition-all hover:scale-[1.01] shadow-lg shadow-emerald-400/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-400">
              ¿No tienes cuenta?{' '}
              <Link
                to={isSupplier ? '/registro-proveedor' : '/registro-comprador'}
                className="font-semibold text-[#2ECAD5] hover:underline"
              >
                Registrarse
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-4 text-xs text-gray-400">
          ¿Eres {isSupplier ? 'comprador' : 'proveedor'}?{' '}
          <Link
            to={`/login?role=${isSupplier ? 'comprador' : 'proveedor'}`}
            className="text-[#2ECAD5] hover:underline"
          >
            Cambia aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
