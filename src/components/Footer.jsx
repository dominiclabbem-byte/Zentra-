import { Link } from 'react-router-dom';
import mainLogo from '../assets/zentra_main_logo.png';
import { getFooterLinks } from '../lib/navigation';

export default function Footer() {
  const footerLinks = getFooterLinks();

  return (
    <footer className="bg-[#060e1a] text-gray-400 mt-auto relative overflow-hidden">
      {/* Subtle top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#2ECAD5]/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-1 mb-4">
              <img
                src={mainLogo}
                alt="Zentra AI"
                style={{ width: '120px', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))' }}
              />
              <div className="flex flex-col justify-center -ml-4">
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  zentra<span className="text-emerald-400">.</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2ECAD5] to-blue-500">ai</span>
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              🍊 Conectamos proveedores de insumos gastronomicos con compradores en Chile.
              Rapido, verificado y confiable.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Plataforma</h4>
            <ul className="space-y-3 text-sm">
              {footerLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-[#2ECAD5] transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-base">📧</span>
                contacto@zentra.cl
              </li>
              <li className="flex items-center gap-2">
                <span className="text-base">📱</span>
                +56 9 1234 5678
              </li>
              <li className="flex items-center gap-2">
                <span className="text-base">📍</span>
                Santiago, Chile
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 pt-6 text-center text-sm text-gray-600">
          &copy; 2026 Zentra. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
