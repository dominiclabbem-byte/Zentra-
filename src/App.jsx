import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import BuyerRegistration from './pages/BuyerRegistration';
import SupplierRegistration from './pages/SupplierRegistration';
import BuyerDashboard from './pages/BuyerDashboard';
import SupplierDashboard from './pages/SupplierDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/registro-comprador" element={<BuyerRegistration />} />
            <Route path="/registro-proveedor" element={<SupplierRegistration />} />
            <Route path="/dashboard-comprador" element={<BuyerDashboard />} />
            <Route path="/dashboard-proveedor" element={<SupplierDashboard />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
