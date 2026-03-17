import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

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
    <nav className="bg-[#0D1F3C] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl">🥗</span>
            <span className="font-bold text-xl tracking-tight">
              Prospecto<span className="text-[#2ECAD5]">Legal</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-[#2ECAD5] text-[#0D1F3C]'
                    : 'text-gray-300 hover:text-white hover:bg-[#1a3260]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-[#1a3260]"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#1a3260] border-t border-[#2ECAD5]/20">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-3 text-sm font-medium border-b border-[#0D1F3C] transition-colors ${
                location.pathname === link.to
                  ? 'text-[#2ECAD5] bg-[#0D1F3C]'
                  : 'text-gray-300 hover:text-white hover:bg-[#0D1F3C]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
