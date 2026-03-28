import { useState } from 'react';
import { Link } from 'react-router-dom';
import BodegaLogo from '../components/BodegaLogo';
import mainLogo from '../assets/zentra_main_logo.png';
import AuthChoiceModal from '../components/AuthChoiceModal';
import { Avocado, Grapes, Orange, Strawberry } from '../components/FruitIllustrations';

const valueProps = [
  {
    emoji: '⚡',
    title: 'Cotizaciones en 24hrs',
    description: 'Recibe propuestas de multiples proveedores verificados en menos de 24 horas.',
  },
  {
    emoji: '🛡️',
    title: 'Proveedores verificados',
    description: 'Todos los proveedores estan validados con su RUT chileno y documentacion vigente.',
  },
  {
    emoji: '🔔',
    title: 'Alertas inteligentes',
    description: 'Recibe notificaciones automaticas cuando los precios de tus insumos cambien.',
  },
];

const featuredSuppliers = [
  { name: 'Valle Frio SpA', emoji: '🏭', category: 'Congelados / Lacteos / Carnes', city: 'Santiago', rating: '4.9' },
  { name: 'Distribuidora El Roble', emoji: '🫒', category: 'Abarrotes / Aceites / Especias', city: 'Valparaiso', rating: '4.7' },
  { name: 'Agroindustrial del Sur Ltda.', emoji: '🌾', category: 'Harinas / Cereales / Legumbres', city: 'Temuco', rating: '4.8' },
];

const stats = [
  { value: '180+', label: '🏪 Proveedores activos' },
  { value: '500+', label: '🛒 Compradores' },
  { value: '24hrs', label: '⏱️ Tiempo respuesta' },
  { value: '98%', label: '⭐ Satisfaccion' },
];

export default function Landing() {
  const [authRole, setAuthRole] = useState(null);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-[#0a1628] text-white py-24 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#2ECAD5]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]" />

        <div className="absolute top-14 left-[6%] hidden xl:block opacity-35 pointer-events-none animate-float" style={{ animationDelay: '0s' }}>
          <Strawberry className="w-20 h-20 drop-shadow-2xl" />
        </div>
        <div className="absolute top-28 right-[7%] hidden xl:block opacity-30 pointer-events-none animate-float" style={{ animationDelay: '0.9s' }}>
          <Avocado className="w-20 h-20 drop-shadow-2xl" />
        </div>
        <div className="absolute bottom-20 left-[10%] hidden xl:block opacity-30 pointer-events-none animate-float" style={{ animationDelay: '1.5s' }}>
          <Orange className="w-20 h-20 drop-shadow-2xl" />
        </div>
        <div className="absolute bottom-12 right-[10%] hidden xl:block opacity-30 pointer-events-none animate-float" style={{ animationDelay: '0.35s' }}>
          <Grapes className="w-20 h-20 drop-shadow-2xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2.5 mb-8 text-sm text-[#2ECAD5] font-medium animate-fade-in-up">
            <span className="w-2 h-2 bg-[#2ECAD5] rounded-full animate-pulse" />
            🇨🇱 La infrastructura de abastecimiento para el food service
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            GESTIONA, CONECTA Y OPTIMIZA{' '}
            <span className="gradient-text">PROVEEDORES</span>{' '}
            EN UN SOLO LUGAR
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            La plataforma que une a restaurantes, pastelerias y hoteles de Chile con
            proveedores verificados de insumos alimentarios, carnes, harinas y mas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link
              to="/marketplace"
              className="glass hover:bg-white/10 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-[1.02]"
            >
              🔎 Explorar Marketplace
            </Link>
            <button
              type="button"
              onClick={() => setAuthRole('proveedor')}
              className="bg-gradient-to-r from-emerald-400 to-blue-500 hover:from-emerald-500 hover:to-blue-600 text-[#0D1F3C] font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-[1.02] shadow-xl shadow-emerald-400/20 hover:shadow-emerald-400/30"
            >
              🏪 Soy Proveedor
            </button>
            <button
              type="button"
              onClick={() => setAuthRole('comprador')}
              className="glass hover:bg-white/10 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-[1.02]"
            >
              🛒 Soy Comprador
            </button>
          </div>
          {authRole && <AuthChoiceModal role={authRole} onClose={() => setAuthRole(null)} />}

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

      <section className="px-4 py-6 bg-[#f8fafc] border-y border-[#2ECAD5]/10">
        <div className="max-w-6xl mx-auto rounded-2xl border border-[#2ECAD5]/15 bg-white px-6 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2ECAD5]">Trust layer Zentra</div>
            <p className="text-[#0D1F3C] font-semibold mt-1">
              La reputacion visible del marketplace se construye con operaciones aceptadas, reseñas elegibles y verificacion comercial.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-semibold bg-[#f0fdfa] text-[#0D1F3C] border border-[#2ECAD5]/20 px-3 py-1.5 rounded-full">Reseñas de operaciones reales</span>
            <span className="text-xs font-semibold bg-[#f0fdfa] text-[#0D1F3C] border border-[#2ECAD5]/20 px-3 py-1.5 rounded-full">RUT y perfil verificado</span>
            <span className="text-xs font-semibold bg-[#f0fdfa] text-[#0D1F3C] border border-[#2ECAD5]/20 px-3 py-1.5 rounded-full">Rating agregado en vivo</span>
          </div>
        </div>
      </section>

      {/* B2B Connection Animation */}
      <section className="py-20 px-4 bg-[#060e1a] text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px]" />
        <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-96 h-96 bg-[#2ECAD5]/5 rounded-full blur-[120px]" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block text-[#2ECAD5] text-sm font-semibold uppercase tracking-widest mb-3">Plataforma B2B</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Conexion directa en{' '}
              <span className="gradient-text">tiempo real</span> 🔗
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Un hub inteligente que conecta compradores gastronomicos con proveedores
              verificados, eliminando intermediarios en cada transaccion
            </p>
          </div>

          {/* Desktop diagram */}
          <div className="hidden md:flex items-center gap-3">
            {/* Buyers column */}
            <div className="flex flex-col gap-3 w-52 flex-shrink-0">
              {[
                { emoji: '🍽️', label: 'Restaurantes', sub: '200+ activos' },
                { emoji: '🧁', label: 'Pastelerias', sub: '85+ activos' },
                { emoji: '🏨', label: 'Hoteles & Catering', sub: '45+ activos' },
              ].map((item) => (
                <div key={item.label} className="glass rounded-xl p-3.5 flex items-center gap-3 hover:bg-white/5 transition-colors">
                  <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">{item.label}</div>
                    <div className="text-xs text-indigo-400">{item.sub}</div>
                  </div>
                </div>
              ))}
              <div className="text-center pt-1">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Compradores</span>
              </div>
            </div>

            {/* Left animated lines */}
            <div className="flex-1 flex flex-col justify-around" style={{ height: '162px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="relative h-px w-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-[#2ECAD5]/20" />
                  <div
                    className="animate-data-flow"
                    style={{ animationDelay: `${i * 0.7}s` }}
                  />
                </div>
              ))}
            </div>

            {/* Central Hub */}
            <div className="flex-shrink-0 flex flex-col items-center gap-3 px-2">
              <div className="relative">
                <div className="absolute -inset-6 rounded-3xl bg-[#2ECAD5]/10 animate-ping-slow" />
                <div className="absolute -inset-3 rounded-2xl border border-[#2ECAD5]/20 animate-rotate-slow" />
                <div className="relative w-28 h-28 bg-gradient-to-br from-[#2ECAD5] to-[#1BA8B2] rounded-2xl flex flex-col items-center justify-center shadow-2xl shadow-emerald-400/30 z-10 gap-1 p-2">
                  <img src={mainLogo} alt="Zentra B2B Hub" className="w-16 h-auto drop-shadow-md" />
                  <span className="text-[#0D1F3C] font-black text-[9px] leading-none uppercase tracking-wider">B2B Hub</span>
                </div>
              </div>
              <div className="text-sm font-bold text-[#2ECAD5]">Zentra</div>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-[#2ECAD5] rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>

            {/* Right animated lines */}
            <div className="flex-1 flex flex-col justify-around" style={{ height: '162px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="relative h-px w-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#2ECAD5]/20 to-emerald-500/20" />
                  <div
                    className="animate-data-flow"
                    style={{ animationDelay: `${i * 0.7 + 0.35}s` }}
                  />
                </div>
              ))}
            </div>

            {/* Suppliers column */}
            <div className="flex flex-col gap-3 w-52 flex-shrink-0">
              {[
                { emoji: '🥩', label: 'Carnes y cecinas', sub: '42 proveedores' },
                { emoji: '🌾', label: 'Harinas y cereales', sub: '38 proveedores' },
                { emoji: '🧀', label: 'Lacteos', sub: '55 proveedores' },
              ].map((item) => (
                <div key={item.label} className="glass rounded-xl p-3.5 flex items-center gap-3 hover:bg-white/5 transition-colors">
                  <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">{item.label}</div>
                    <div className="text-xs text-emerald-400">{item.sub}</div>
                  </div>
                </div>
              ))}
              <div className="text-center pt-1">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Proveedores</span>
              </div>
            </div>
          </div>

          {/* Mobile layout */}
          <div className="md:hidden space-y-3">
            <div className="glass rounded-2xl p-5 text-center">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Compradores</div>
              <div className="flex justify-center gap-2 flex-wrap">
                {['🍽️ Restaurantes', '🧁 Pastelerias', '🏨 Hoteles'].map(t => (
                  <span key={t} className="bg-indigo-500/10 text-indigo-300 text-xs px-3 py-1.5 rounded-full border border-indigo-500/20">{t}</span>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-px h-8 bg-gradient-to-b from-indigo-500/50 to-[#2ECAD5]/50" />
            </div>
            <div className="glass rounded-2xl p-5 flex flex-col items-center gap-2 border border-[#2ECAD5]/25">
              <img src={mainLogo} alt="Zentra B2B Hub" className="w-16 h-auto drop-shadow-md" />
              <div className="text-sm font-bold text-[#2ECAD5]">Zentra</div>
              <div className="text-xs text-gray-400">Hub B2B inteligente 🔗</div>
            </div>
            <div className="flex justify-center">
              <div className="w-px h-8 bg-gradient-to-b from-[#2ECAD5]/50 to-emerald-500/50" />
            </div>
            <div className="glass rounded-2xl p-5 text-center">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Proveedores</div>
              <div className="flex justify-center gap-2 flex-wrap">
                {['🥩 Carnes', '🌾 Harinas', '🧀 Lacteos', '🫒 Aceites'].map(t => (
                  <span key={t} className="bg-emerald-500/10 text-emerald-300 text-xs px-3 py-1.5 rounded-full border border-emerald-500/20">{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { value: '< 2s', label: '⚡ Tiempo de match' },
              { value: '99.9%', label: '🔒 Uptime garantizado' },
              { value: '24/7', label: '🌐 Red activa' },
            ].map(m => (
              <div key={m.label} className="glass rounded-xl p-5 text-center">
                <div className="text-2xl font-extrabold text-[#2ECAD5]">{m.value}</div>
                <div className="text-xs text-gray-400 mt-1">{m.label}</div>
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
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0D1F3C] mb-3">Por que Zentra? 🚀</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Todo lo que necesitas para agilizar tus compras de insumos</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {valueProps.map((vp) => (
              <div
                key={vp.title}
                className="bg-white border border-gray-100 rounded-2xl p-8 card-premium group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-[#2ECAD5]/10 to-[#2ECAD5]/5 rounded-2xl flex items-center justify-center text-3xl mb-5 group-hover:from-[#2ECAD5] group-hover:to-[#22a8b2] group-hover:scale-110 transition-all duration-300">
                  {vp.emoji}
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
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0D1F3C] mb-3">Como funciona? 🤔</h2>
            <p className="text-gray-500 text-lg">Simple y rapido en 3 pasos</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', emoji: '📝', title: 'Registrate gratis', desc: 'Crea tu perfil como comprador o proveedor en menos de 2 minutos.' },
              { step: '2', emoji: '📦', title: 'Publica o recibe', desc: 'Compradores publican sus necesidades y proveedores responden con ofertas.' },
              { step: '3', emoji: '🤝', title: 'Cierra el trato', desc: 'Compara precios, elige la mejor oferta y coordina la entrega.' },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2ECAD5]/20 to-transparent rounded-2xl rotate-6 group-hover:rotate-12 transition-transform" />
                  <div className="relative w-20 h-20 bg-[#0D1F3C] rounded-2xl flex items-center justify-center text-3xl">
                    {item.emoji}
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center text-[#0D1F3C] font-bold text-xs shadow-lg">
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
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0D1F3C] mb-3">Proveedores destacados 🌟</h2>
            <p className="text-gray-500 text-lg">Empresas verificadas listas para atenderte</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredSuppliers.map((s) => (
              <div
                key={s.name}
                className="border border-gray-100 rounded-2xl p-6 card-premium group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0D1F3C] to-[#1a3260] rounded-xl flex items-center justify-center text-2xl">
                    {s.emoji}
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
                  📍 {s.city}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-3 py-1 rounded-full border border-emerald-100">
                    ✅ RUT verificado
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

        {/* Floating emojis in CTA */}
        <div className="absolute top-8 left-[15%] text-3xl animate-float opacity-15 select-none pointer-events-none" style={{ animationDelay: '0.5s' }}>🍊</div>
        <div className="absolute bottom-8 right-[15%] text-3xl animate-float opacity-15 select-none pointer-events-none" style={{ animationDelay: '1s' }}>🫐</div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">🚀 Listo para empezar?</h2>
          <p className="text-gray-400 mb-10 text-lg leading-relaxed">
            Unete a cientos de empresas gastronomicas chilenas que ya usan Zentra.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/registro-proveedor"
              className="bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-[1.02] shadow-xl shadow-emerald-400/20"
            >
              🏪 Registrar mi empresa
            </Link>
            <Link
              to="/marketplace"
              className="glass hover:bg-white/10 font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-[1.02]"
            >
              🔍 Buscar proveedores
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
