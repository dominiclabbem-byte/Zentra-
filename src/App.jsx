import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import RenderProfiler from './components/RenderProfiler';
import ProtectedRoute from './components/ProtectedRoute';

const Landing = lazy(() => import('./pages/Landing'));
const BuyerRegistration = lazy(() => import('./pages/BuyerRegistration'));
const SupplierRegistration = lazy(() => import('./pages/SupplierRegistration'));
const BuyerDashboard = lazy(() => import('./pages/BuyerDashboard'));
const SupplierDashboard = lazy(() => import('./pages/SupplierDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Login = lazy(() => import('./pages/Login'));
const Marketplace = lazy(() => import('./pages/Marketplace'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-brand-canvas">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-sm text-gray-500">Cargando pagina...</p>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <ScrollToTop />
        <RenderProfiler id="Navbar">
          <Navbar />
        </RenderProfiler>
        <main className="flex-1">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<RenderProfiler id="Landing"><Landing /></RenderProfiler>} />
              <Route path="/marketplace" element={<RenderProfiler id="Marketplace"><Marketplace /></RenderProfiler>} />
              <Route path="/ingresar" element={<RenderProfiler id="Login"><Login /></RenderProfiler>} />
              <Route path="/login" element={<RenderProfiler id="LoginAlias"><Login /></RenderProfiler>} />
              <Route path="/registro-comprador" element={<RenderProfiler id="BuyerRegistration"><BuyerRegistration /></RenderProfiler>} />
              <Route path="/registro-proveedor" element={<RenderProfiler id="SupplierRegistration"><SupplierRegistration /></RenderProfiler>} />
              <Route
                path="/dashboard-comprador"
                element={(
                  <ProtectedRoute role="buyer">
                    <RenderProfiler id="BuyerDashboard">
                      <BuyerDashboard />
                    </RenderProfiler>
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/dashboard-proveedor"
                element={(
                  <ProtectedRoute role="supplier">
                    <RenderProfiler id="SupplierDashboard">
                      <SupplierDashboard />
                    </RenderProfiler>
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/dashboard-admin"
                element={(
                  <ProtectedRoute role="admin">
                    <RenderProfiler id="AdminDashboard">
                      <AdminDashboard />
                    </RenderProfiler>
                  </ProtectedRoute>
                )}
              />
            </Routes>
          </Suspense>
        </main>
        <RenderProfiler id="Footer">
          <Footer />
        </RenderProfiler>
        <RenderProfiler id="ChatWidget">
          <ChatWidget />
        </RenderProfiler>
      </div>
    </BrowserRouter>
  );
}
