import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#0D1F3C] text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🥗</span>
              <span className="font-bold text-xl text-white">
                Prospecto<span className="text-[#2ECAD5]">Legal</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Conectamos proveedores de insumos gastronómicos con compradores en Chile.
              Rápido, verificado y confiable.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-3">Plataforma</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/registro-comprador" className="hover:text-[#2ECAD5] transition-colors">Registro Comprador</Link></li>
              <li><Link to="/registro-proveedor" className="hover:text-[#2ECAD5] transition-colors">Registro Proveedor</Link></li>
              <li><Link to="/dashboard-comprador" className="hover:text-[#2ECAD5] transition-colors">Dashboard Comprador</Link></li>
              <li><Link to="/dashboard-proveedor" className="hover:text-[#2ECAD5] transition-colors">Dashboard Proveedor</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-3">Contacto</h4>
            <ul className="space-y-2 text-sm">
              <li>📧 contacto@prospectolegal.cl</li>
              <li>📱 +56 9 1234 5678</li>
              <li>📍 Santiago, Chile</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-500">
          © 2026 ProspectoLegal. Todos los derechos reservados. · Chile
        </div>
      </div>
    </footer>
  );
}
