import { useNavigate } from 'react-router-dom';
import { LogIn, ShoppingCart, Store, UserPlus } from 'lucide-react';

export default function AuthChoiceModal({ role, onClose }) {
  const navigate = useNavigate();

  const isSupplier = role === 'proveedor';
  const label = isSupplier ? 'Proveedor' : 'Comprador';
  const RoleIcon = isSupplier ? Store : ShoppingCart;
  const registerPath = isSupplier ? '/registro-proveedor' : '/registro-comprador';
  const loginPath = `/ingresar?role=${role}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-fade-in-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-ink to-brand-inkLight rounded-2xl mb-4 shadow-xl shadow-brand-ink/20">
            <RoleIcon className="h-8 w-8 text-brand-accent" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-extrabold text-brand-ink">{label}</h2>
          <p className="text-sm text-gray-400 mt-1">Que deseas hacer?</p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(loginPath);
            }}
            className="w-full bg-gradient-to-r from-emerald-400 to-blue-500 hover:from-emerald-500 hover:to-blue-600 text-white font-bold px-6 py-4 rounded-2xl text-base transition-all hover:scale-[1.02] shadow-lg shadow-emerald-400/20 flex items-center justify-center gap-2"
          >
            <LogIn className="h-5 w-5" />
            Iniciar sesion
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(registerPath);
            }}
            className="w-full bg-white border-2 border-gray-100 hover:border-brand-accent/40 text-brand-ink font-bold px-6 py-4 rounded-2xl text-base transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <UserPlus className="h-5 w-5 text-brand-accent" />
            Registrarse
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
