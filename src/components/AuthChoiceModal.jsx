import { useNavigate } from 'react-router-dom';

export default function AuthChoiceModal({ role, onClose }) {
  const navigate = useNavigate();

  const isSupplier = role === 'proveedor';
  const label = isSupplier ? 'Proveedor' : 'Comprador';
  const emoji = isSupplier ? '🏪' : '🛒';
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-2xl mb-4 shadow-xl shadow-[#0D1F3C]/20">
            <span className="text-3xl" aria-hidden="true">{emoji}</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#0D1F3C]">{label}</h2>
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Iniciar sesion
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(registerPath);
            }}
            className="w-full bg-white border-2 border-gray-100 hover:border-[#2ECAD5]/40 text-[#0D1F3C] font-bold px-6 py-4 rounded-2xl text-base transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5 text-[#2ECAD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
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
