import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ role, children }) {
  const location = useLocation();
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2ECAD5]/20 border-t-[#2ECAD5] rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Cargando tu cuenta...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to={`/ingresar?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (role === 'buyer' && !currentUser.is_buyer) {
    return <Navigate to="/registro-comprador" replace />;
  }

  if (role === 'supplier' && !currentUser.is_supplier) {
    return <Navigate to="/registro-proveedor" replace />;
  }

  if (role === 'admin' && !currentUser.is_admin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
