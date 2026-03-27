import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import mainLogo from '../assets/zentra_main_logo.png';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const navLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/marketplace', label: 'Marketplace' },
    { to: '/registro-comprador', label: currentUser?.is_buyer ? 'Perfil Comprador' : 'Soy Comprador' },
    { to: '/registro-proveedor', label: currentUser?.is_supplier ? 'Perfil Proveedor' : 'Soy Proveedor' },
    ...(currentUser?.is_admin ? [{ to: '/dashboard-admin', label: 'Admin' }] : []),
    ...(currentUser?.is_buyer ? [{ to: '/dashboard-comprador', label: 'Dashboard Comprador' }] : []),
    ...(currentUser?.is_supplier ? [{ to: '/dashboard-proveedor', label: 'Dashboard Proveedor' }] : []),
  ];

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
  };

  return (
    <nav className="bg-[#0a1628]/95 backdrop-blur-xl text-white shadow-[0_1px_0_rgba(46,202,213,0.1)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-1 flex-shrink-0 group">
            <div className="transition-all hover:scale-105">
              <img
                src={mainLogo}
                alt="Zentra AI"
                style={{
                  width: '120px',
                  height: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))',
                }}
              />
            </div>
            <div className="flex flex-col justify-center -ml-4">
              <span className="text-3xl font-extrabold tracking-tight">
                zentra<span className="text-emerald-400">.</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2ECAD5] to-blue-500">ai</span>
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.to
                    ? 'bg-gradient-to-r from-emerald-400 to-blue-500 text-white shadow-lg shadow-emerald-400/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {currentUser ? (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-400">
                  {currentUser.company_name}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all text-gray-400 hover:text-white hover:bg-white/5"
                >
                  Cerrar sesion
                </button>
              </>
            ) : (
              <Link
                to="/ingresar"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/ingresar'
                    ? 'bg-gradient-to-r from-emerald-400 to-blue-500 text-white shadow-lg shadow-emerald-400/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Ingresar
              </Link>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? '\u2715' : '\u2630'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#0a1628]/98 backdrop-blur-xl border-t border-[#2ECAD5]/10 animate-fade-in">
          <div className="py-2 px-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium my-0.5 transition-all ${
                  location.pathname === link.to
                    ? 'text-[#2ECAD5] bg-[#2ECAD5]/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {currentUser ? (
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium my-0.5 transition-all text-gray-400 hover:text-white hover:bg-white/5"
              >
                Cerrar sesion
              </button>
            ) : (
              <Link
                to="/ingresar"
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium my-0.5 transition-all ${
                  location.pathname === '/ingresar'
                    ? 'text-[#2ECAD5] bg-[#2ECAD5]/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Ingresar
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
