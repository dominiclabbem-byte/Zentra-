import { Link } from 'react-router-dom';

const valueProps = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'Cotizaciones en 24hrs',
    description: 'Recibe propuestas de multiples proveedores verificados en menos de 24 horas.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Proveedores verificados',
    description: 'Todos los proveedores estan validados con su RUT chileno y documentacion vigente.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
    title: 'Alertas inteligentes',
    description: 'Recibe notificaciones automaticas cuando los precios de tus insumos cambien.',
  },
];

const featuredSuppliers = [
  { name: 'Valle Frio SpA', category: 'Berries IQF / Mix berries', city: 'Santiago', rating: '4.9' },
  { name: 'Best Food Chile SpA', category: 'Frutas tropicales / Verduras IQF', city: 'Valparaiso', rating: '4.7' },
  { name: 'Surfrut Ltda.', category: 'Berries IQF / Verduras IQF', city: 'Rancagua', rating: '4.8' },
];

const stats = [
  { value: '180+', label: 'Proveedores activos' },
  { value: '500+', label: 'Compradores' },
  { value: '24hrs', label: 'Tiempo respuesta' },
  { value: '98%', label: 'Satisfaccion' },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-[#0a1628] text-white py-24 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#2ECAD5]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2.5 mb-8 text-sm text-[#2ECAD5] font-medium animate-fade-in-up">
            <span className="w-2 h-2 bg-[#2ECAD5] rounded-full animate-pulse" />
            Marketplace gastronomico para Chile
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Conecta con los mejores{' '}
            <span className="gradient-text">proveedores de insumos</span>{' '}
            gastronomicos
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            La plataforma que une a restaurantes, pastelerias y hoteles de Chile con
            proveedores verificados de frutas IQF, berries y mas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link
              to="/registro-proveedor"
              className="bg-gradient-to-r from-[#2ECAD5] to-[#22a8b2] hover:from-[#22a8b2] hover:to-[#1a9aa3] text-[#0D1F3C] font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-[1.02] shadow-xl shadow-[#2ECAD5]/20 hover:shadow-[#2ECAD5]/30"
            >
              Soy Proveedor
            </Link>
            <Link
              to="/registro-comprador"
              className="glass hover:bg-white/10 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-[1.02]"
            >
              Soy Comprador
            </Link>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-xl p-4">
                <div className="text-2xl font-extrabold text-white">{s.value}</div>
                <div className="text-xs text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value propositions */}
      <section className="py-20 px-4 bg-white relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[#2ECAD5] text-sm font-semibold uppercase tracking-widest mb-3">Ventajas</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0D1F3C] mb-3">Por que ProspectoLegal?</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Todo lo que necesitas para agilizar tus compras de insumos</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {valueProps.map((vp) => (
              <div
                key={vp.title}
                className="bg-white border border-gray-100 rounded-2xl p-8 card-premium group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-[#2ECAD5]/10 to-[#2ECAD5]/5 rounded-2xl flex items-center justify-center text-[#2ECAD5] mb-5 group-hover:from-[#2ECAD5] group-hover:to-[#22a8b2] group-hover:text-white transition-all duration-300">
                  {vp.icon}
                </div>
                <h3 className="text-lg font-bold text-[#0D1F3C] mb-2">
                  {vp.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{vp.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-[#f8fafc] bg-grid">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[#2ECAD5] text-sm font-semibold uppercase tracking-widest mb-3">Proceso</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0D1F3C] mb-3">Como funciona?</h2>
            <p className="text-gray-500 text-lg">Simple y rapido en 3 pasos</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Registrate gratis', desc: 'Crea tu perfil como comprador o proveedor en menos de 2 minutos.', icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
              )},
              { step: '2', title: 'Publica o recibe', desc: 'Compradores publican sus necesidades y proveedores responden con ofertas.', icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              )},
              { step: '3', title: 'Cierra el trato', desc: 'Compara precios, elige la mejor oferta y coordina la entrega.', icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                </svg>
              )},
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2ECAD5]/20 to-transparent rounded-2xl rotate-6 group-hover:rotate-12 transition-transform" />
                  <div className="relative w-20 h-20 bg-[#0D1F3C] text-[#2ECAD5] rounded-2xl flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-r from-[#2ECAD5] to-[#22a8b2] rounded-lg flex items-center justify-center text-[#0D1F3C] font-bold text-xs shadow-lg">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[#0D1F3C] mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured suppliers */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-[#2ECAD5] text-sm font-semibold uppercase tracking-widest mb-3">Partners</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0D1F3C] mb-3">Proveedores destacados</h2>
            <p className="text-gray-500 text-lg">Empresas verificadas listas para atenderte</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredSuppliers.map((s) => (
              <div
                key={s.name}
                className="border border-gray-100 rounded-2xl p-6 card-premium group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-xl flex items-center justify-center text-[#2ECAD5]">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 7.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                    <svg className="w-4 h-4 fill-amber-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {s.rating}
                  </div>
                </div>
                <h3 className="font-bold text-[#0D1F3C] text-lg mb-1">{s.name}</h3>
                <p className="text-sm text-[#2ECAD5] font-medium mb-1">{s.category}</p>
                <p className="text-sm text-gray-400 flex items-center gap-1 mb-4">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {s.city}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-3 py-1 rounded-full border border-emerald-100">
                    <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    RUT verificado
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="relative bg-[#0a1628] text-white py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#2ECAD5]/5 rounded-full blur-[100px]" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Listo para empezar?</h2>
          <p className="text-gray-400 mb-10 text-lg leading-relaxed">
            Unete a cientos de empresas gastronomicas chilenas que ya usan ProspectoLegal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/registro-proveedor"
              className="bg-gradient-to-r from-[#2ECAD5] to-[#22a8b2] text-[#0D1F3C] font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-[1.02] shadow-xl shadow-[#2ECAD5]/20"
            >
              Registrar mi empresa
            </Link>
            <Link
              to="/registro-comprador"
              className="glass hover:bg-white/10 font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-[1.02]"
            >
              Buscar proveedores
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
