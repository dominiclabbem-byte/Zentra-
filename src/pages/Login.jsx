import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { resolvePostLoginPath } from '../lib/navigation';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, login } = useAuth();
  const role = searchParams.get('role') || '';
  const isSupplier = role === 'proveedor';
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const nextPath = searchParams.get('next');

  useEffect(() => {
    if (currentUser) {
      navigate(resolvePostLoginPath(currentUser, nextPath), { replace: true });
    }
  }, [currentUser, navigate, nextPath]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const user = await login(form);
      navigate(resolvePostLoginPath(user, nextPath), { replace: true });
    } catch (error) {
      setToast({
        message: error.message || 'No se pudo iniciar sesion.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ui-page px-4 py-10">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-md mx-auto">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-ink to-brand-inkLight rounded-2xl mb-4 shadow-xl shadow-brand-ink/20">
            {role ? (
              <span className="text-3xl" aria-hidden="true">{isSupplier ? '🏪' : '🛒'}</span>
            ) : (
              <svg className="w-8 h-8 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25m0 0A2.25 2.25 0 0013.5 3h-3A2.25 2.25 0 008.25 5.25m7.5 0v3.75m0 0H18a2.25 2.25 0 012.25 2.25v6A2.25 2.25 0 0118 19.5H6a2.25 2.25 0 01-2.25-2.25v-6A2.25 2.25 0 016 9h2.25m7.5 0h-7.5" />
              </svg>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-brand-ink">
            {role ? 'Iniciar sesion' : 'Ingresar a Zentra'}
          </h1>
          <p className="text-gray-500 mt-2">
            {role
              ? <>Accede como <span className="font-semibold text-brand-ink">{isSupplier ? 'Proveedor' : 'Comprador'}</span>.</>
              : 'Accede a tu cuenta para gestionar tu perfil comprador o proveedor.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              id="login-email"
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="ui-input"
              placeholder="contacto@empresa.cl"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1.5">Contrasena</label>
            <input
              id="login-password"
              type="password"
              required
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="ui-input"
              placeholder="Tu contrasena"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-brand-ink to-brand-inkLight hover:from-brand-inkLight hover:to-brand-ink text-white font-bold py-4 rounded-xl text-lg transition-all hover:shadow-xl hover:shadow-brand-ink/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>

          <div className="text-sm text-gray-500 space-y-2 pt-2">
            <p>
              Aun no tienes cuenta?{' '}
              <Link to={isSupplier ? '/registro-proveedor' : '/registro-comprador'} className="text-brand-accent font-medium hover:underline">
                {isSupplier ? 'Crear perfil proveedor' : 'Crear perfil comprador'}
              </Link>
            </p>
            {!role && (
              <p>
                Si vendes en la plataforma, puedes crear tu cuenta en{' '}
                <Link to="/registro-proveedor" className="text-brand-accent font-medium hover:underline">
                  registro proveedor
                </Link>
                .
              </p>
            )}
            {role && (
              <p>
                Eres {isSupplier ? 'comprador' : 'proveedor'}?{' '}
                <Link to={`/ingresar?role=${isSupplier ? 'comprador' : 'proveedor'}`} className="text-brand-accent font-medium hover:underline">
                  Cambia aqui
                </Link>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
