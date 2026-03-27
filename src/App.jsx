import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RenderProfiler from './components/RenderProfiler';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import BuyerRegistration from './pages/BuyerRegistration';
import SupplierRegistration from './pages/SupplierRegistration';
import BuyerDashboard from './pages/BuyerDashboard';
import SupplierDashboard from './pages/SupplierDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Marketplace from './pages/Marketplace';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <RenderProfiler id="Navbar">
          <Navbar />
        </RenderProfiler>
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<RenderProfiler id="Landing"><Landing /></RenderProfiler>} />
            <Route path="/marketplace" element={<RenderProfiler id="Marketplace"><Marketplace /></RenderProfiler>} />
            <Route path="/ingresar" element={<RenderProfiler id="Login"><Login /></RenderProfiler>} />
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
        </main>
        <RenderProfiler id="Footer">
          <Footer />
        </RenderProfiler>
      </div>
    </BrowserRouter>
  );
}
