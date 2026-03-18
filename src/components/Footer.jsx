import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#060e1a] text-gray-400 mt-auto relative overflow-hidden">
      {/* Subtle top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#2ECAD5]/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#2ECAD5] to-[#22a8b2] rounded-lg flex items-center justify-center">
                <span className="text-[#0D1F3C] font-black text-sm">BD</span>
              </div>
              <span className="font-bold text-xl text-white">
                Bodega<span className="text-[#2ECAD5]"> Digital</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              Conectamos proveedores de insumos gastronomicos con compradores en Chile.
              Rapido, verificado y confiable.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Plataforma</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/registro-comprador" className="hover:text-[#2ECAD5] transition-colors duration-200">Registro Comprador</Link></li>
              <li><Link to="/registro-proveedor" className="hover:text-[#2ECAD5] transition-colors duration-200">Registro Proveedor</Link></li>
              <li><Link to="/dashboard-comprador" className="hover:text-[#2ECAD5] transition-colors duration-200">Dashboard Comprador</Link></li>
              <li><Link to="/dashboard-proveedor" className="hover:text-[#2ECAD5] transition-colors duration-200">Dashboard Proveedor</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-[#2ECAD5]/10 rounded flex items-center justify-center text-xs">@</span>
                contacto@bodegadigital.cl
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-[#2ECAD5]/10 rounded flex items-center justify-center text-xs">T</span>
                +56 9 1234 5678
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-[#2ECAD5]/10 rounded flex items-center justify-center text-xs">S</span>
                Santiago, Chile
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 pt-6 text-center text-sm text-gray-600">
          &copy; 2026 Bodega Digital. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
