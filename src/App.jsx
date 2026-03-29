import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import Footer from './components/Footer';
import Landing from './pages/Landing';
import BuyerRegistration from './pages/BuyerRegistration';
import SupplierRegistration from './pages/SupplierRegistration';
import BuyerDashboard from './pages/BuyerDashboard';
import SupplierDashboard from './pages/SupplierDashboard';
import Login from './pages/Login';
import ZChatPage from './pages/ZChatPage';

function HomeRedirect() {
  const location = useLocation();
  // Solo redirige automaticamente si llega directo (sin key de navegacion interna)
  const isDirectEntry = location.key === 'default';
  const raw = localStorage.getItem('zentra_session');
  if (isDirectEntry && raw) {
    const session = JSON.parse(raw);
    if (session?.loggedIn) {
      return <Navigate to={session.role === 'proveedor' ? '/dashboard-proveedor' : '/dashboard-comprador'} replace />;
    }
  }
  return <Landing />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <ScrollToTop />
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/registro-comprador" element={<BuyerRegistration />} />
            <Route path="/registro-proveedor" element={<SupplierRegistration />} />
            <Route path="/dashboard-comprador" element={<BuyerDashboard />} />
            <Route path="/dashboard-proveedor" element={<SupplierDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/zchat" element={<ZChatPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
