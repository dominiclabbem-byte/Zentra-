import { Link } from 'react-router-dom';

const valueProps = [
  {
    icon: '⚡',
    title: 'Cotizaciones en 24hrs',
    description: 'Recibe propuestas de múltiples proveedores verificados en menos de 24 horas.',
  },
  {
    icon: '✅',
    title: 'Proveedores verificados con RUT',
    description: 'Todos los proveedores están validados con su RUT chileno y documentación vigente.',
  },
  {
    icon: '🔔',
    title: 'Alertas de precio por categoría',
    description: 'Recibe notificaciones automáticas cuando los precios de tus insumos cambien.',
  },
];

const featuredSuppliers = [
  { name: 'Valle Frío SpA', category: 'Berries IQF · Mix berries', city: 'Santiago', rating: '4.9' },
  { name: 'Best Food Chile SpA', category: 'Frutas tropicales · Verduras IQF', city: 'Valparaíso', rating: '4.7' },
  { name: 'Surfrut Ltda.', category: 'Berries IQF · Verduras IQF', city: 'Rancagua', rating: '4.8' },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0D1F3C] via-[#1a3260] to-[#0D1F3C] text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#2ECAD5]/20 border border-[#2ECAD5]/40 rounded-full px-4 py-2 mb-6 text-sm text-[#2ECAD5]">
            <span>🇨🇱</span>
            <span>Marketplace gastronómico para Chile</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Conecta con los mejores{' '}
            <span className="text-[#2ECAD5]">proveedores de insumos</span>{' '}
            gastronómicos
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            La plataforma que une a restaurantes, pastelerías y hoteles de Chile con
            proveedores verificados de frutas IQF, berries y más.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/registro-proveedor"
              className="bg-[#2ECAD5] hover:bg-[#22a8b2] text-[#0D1F3C] font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg"
            >
              🏭 Soy Proveedor
            </Link>
            <Link
              to="/registro-comprador"
              className="bg-white hover:bg-gray-100 text-[#0D1F3C] font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg"
            >
              🛒 Soy Comprador
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-6">
            +180 proveedores activos · +500 compradores registrados
          </p>
        </div>
      </section>

      {/* Value propositions */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0D1F3C] mb-3">¿Por qué ProspectoLegal?</h2>
            <p className="text-gray-500 text-lg">Todo lo que necesitas para agilizar tus compras de insumos</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {valueProps.map((vp) => (
              <div
                key={vp.title}
                className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-[#2ECAD5] hover:shadow-lg transition-all group"
              >
                <div className="text-4xl mb-4">{vp.icon}</div>
                <h3 className="text-lg font-bold text-[#0D1F3C] mb-2 group-hover:text-[#2ECAD5] transition-colors">
                  {vp.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{vp.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0D1F3C] mb-3">¿Cómo funciona?</h2>
            <p className="text-gray-500 text-lg">Simple y rápido en 3 pasos</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: '📝', title: 'Regístrate gratis', desc: 'Crea tu perfil como comprador o proveedor en menos de 2 minutos.' },
              { step: '2', icon: '📋', title: 'Publica o recibe cotizaciones', desc: 'Compradores publican sus necesidades y proveedores responden con ofertas.' },
              { step: '3', icon: '🤝', title: 'Cierra el trato', desc: 'Compara precios, elige la mejor oferta y coordina la entrega.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-[#0D1F3C] text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4 font-bold">
                  {item.step}
                </div>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-bold text-[#0D1F3C] mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured suppliers */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0D1F3C] mb-3">Proveedores destacados</h2>
            <p className="text-gray-500 text-lg">Empresas verificadas listas para atenderte</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredSuppliers.map((s) => (
              <div
                key={s.name}
                className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-[#2ECAD5]/10 rounded-xl flex items-center justify-center text-2xl">
                    🏭
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                    ⭐ {s.rating}
                  </span>
                </div>
                <h3 className="font-bold text-[#0D1F3C] text-lg mb-1">{s.name}</h3>
                <p className="text-sm text-[#2ECAD5] font-medium mb-2">{s.category}</p>
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <span>📍</span>{s.city}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full">
                    ✓ RUT verificado
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="bg-[#0D1F3C] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para empezar?</h2>
          <p className="text-gray-300 mb-8 text-lg">
            Únete a cientos de empresas gastronómicas chilenas que ya usan ProspectoLegal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/registro-proveedor"
              className="bg-[#2ECAD5] hover:bg-[#22a8b2] text-[#0D1F3C] font-bold px-8 py-4 rounded-xl text-lg transition-all"
            >
              Registrar mi empresa
            </Link>
            <Link
              to="/registro-comprador"
              className="border-2 border-white hover:bg-white hover:text-[#0D1F3C] font-bold px-8 py-4 rounded-xl text-lg transition-all"
            >
              Buscar proveedores
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
