import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BodegaLogo from './BodegaLogo';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/registro-comprador', label: 'Soy Comprador' },
    { to: '/registro-proveedor', label: 'Soy Proveedor' },
    { to: '/dashboard-comprador', label: 'Dashboard Comprador' },
    { to: '/dashboard-proveedor', label: 'Dashboard Proveedor' },
  ];

  return (
    <nav className="bg-[#0a1628]/95 backdrop-blur-xl text-white shadow-[0_1px_0_rgba(46,202,213,0.1)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="drop-shadow-lg group-hover:drop-shadow-xl transition-all">
              <BodegaLogo size={36} />
            </div>
            <span className="font-bold text-xl tracking-tight">
              Zen<span className="text-[#2ECAD5]">tra</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.to
                    ? 'bg-gradient-to-r from-[#2ECAD5] to-[#22a8b2] text-[#0D1F3C] shadow-lg shadow-[#2ECAD5]/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? '\u2715' : '\u2630'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
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
          </div>
        </div>
      )}
    </nav>
  );
}
