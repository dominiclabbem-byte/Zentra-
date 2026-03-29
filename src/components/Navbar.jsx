import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import mainLogo from '../assets/zentra_main_logo.png';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const session = (() => { try { return JSON.parse(localStorage.getItem('zentra_session')); } catch { return null; } })();
  const isLoggedIn = session?.loggedIn;

  const handleLogout = () => {
    localStorage.removeItem('zentra_session');
    setMenuOpen(false);
    navigate('/');
  };

  const handleChat = () => {
    setMenuOpen(false);
    navigate('/zchat');
  };

  const navLinks = [
    { to: '/', label: 'Inicio', state: null },
    { to: '/dashboard-comprador', label: 'Comprador', state: null },
    { to: '/dashboard-proveedor', label: 'Proveedor', state: { activeTab: 'profile' } },
  ];

  return (
    <nav className="bg-[#0a1628]/95 backdrop-blur-xl text-white shadow-[0_1px_0_rgba(46,202,213,0.1)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 flex-shrink-0 group">
            <div className="transition-all hover:scale-105">
              <img
                src={mainLogo}
                alt="Zentra AI"
                style={{ width: '120px', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))' }}
              />
            </div>
            <div className="flex flex-col justify-center -ml-4">
              <span className="text-3xl font-extrabold tracking-tight">
                zentra<span className="text-emerald-400">.</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2ECAD5] to-blue-500">ai</span>
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.to}
                onClick={() => navigate(link.to, link.state ? { state: link.state } : undefined)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.to
                    ? 'bg-gradient-to-r from-emerald-400 to-blue-500 text-white shadow-lg shadow-emerald-400/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </button>
            ))}

            {/* ZChat button */}
            <button
              onClick={handleChat}
              title="ZChat"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <span className="text-base">💬</span>
              <span className="font-bold text-[#2ECAD5]">Z</span>
            </button>

            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-white hover:bg-red-500/10 transition-all duration-200"
              >
                Cerrar sesión
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0a1628]/98 backdrop-blur-xl border-t border-[#2ECAD5]/10 animate-fade-in">
          <div className="py-2 px-3">
            {navLinks.map((link) => (
              <button
                key={link.to}
                onClick={() => { setMenuOpen(false); navigate(link.to, link.state ? { state: link.state } : undefined); }}
                className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium my-0.5 transition-all ${
                  location.pathname === link.to
                    ? 'text-[#2ECAD5] bg-[#2ECAD5]/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={handleChat}
              className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium my-0.5 text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              💬 ZChat
            </button>
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium my-0.5 text-red-400 hover:text-white hover:bg-red-500/10 transition-all"
              >
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
