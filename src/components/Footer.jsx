import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import mainLogo from '../assets/zentra_main_logo.png';
import { getFooterLinks } from '../lib/navigation';

export default function Footer() {
  const footerLinks = getFooterLinks();

  return (
    <footer className="bg-[#060e1a] text-gray-400 mt-auto relative overflow-hidden">
      {/* Subtle top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-brand-accent/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center mb-4">
              <img
                src={mainLogo}
                alt="Z"
                style={{ height: '58px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))', marginTop: '4px' }}
              />
              <span className="text-3xl font-extrabold tracking-tight -ml-4 text-transparent bg-clip-text bg-gradient-to-r from-[#5b8af0] to-[#00e5b0]">entra</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              Conectamos proveedores de insumos gastronomicos con compradores en Chile.
              Rapido, verificado y confiable.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand-accent/20 bg-brand-accent/10 px-3 py-1.5 text-xs font-semibold text-brand-accent">
              <ShieldCheck className="h-3.5 w-3.5" />
              Red verificada food service
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Plataforma</h4>
            <ul className="space-y-3 text-sm">
              {footerLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-brand-accent transition-colors duration-200">
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
                <Mail className="h-4 w-4 text-brand-accent" />
                contacto@zentra.cl
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-accent" />
                +56 9 1234 5678
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-accent" />
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
