import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
  FileText,
  MessageCircle,
  Network,
  Package,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
  Users,
} from 'lucide-react';
import AuthChoiceModal from '../components/AuthChoiceModal';
import SupplyNetworkHeroVisual from '../components/SupplyNetworkHeroVisual';
import { useAuth } from '../context/AuthContext';

const stats = [
  { value: '180+', label: 'Proveedores activos', Icon: Users },
  { value: '500+', label: 'Compradores', Icon: ShoppingCart },
  { value: '24 hrs', label: 'Respuesta promedio', Icon: Clock3 },
  { value: '98%', label: 'Satisfaccion operativa', Icon: Star },
];

const steps = [
  { step: '01', title: 'Publica tu necesidad', desc: 'Carga productos, volumen y fecha de entrega para recibir cotizaciones comparables.', Icon: FileText },
  { step: '02', title: 'Compara y elige', desc: 'Revisa precio, proveedor, condiciones y reputacion desde una vista centralizada.', Icon: MessageCircle },
  { step: '03', title: 'Compra y recibe', desc: 'Coordina entrega con proveedores verificados y deja trazabilidad de la operacion.', Icon: Package },
];

const valueProps = [
  { title: 'Transparencia total', description: 'Precios visibles, condiciones claras y menos conversaciones dispersas.', Icon: ShieldCheck },
  { title: 'Proveedores verificados', description: 'Perfiles comerciales con RUT, categorias, reputacion y estado de revision.', Icon: CheckCircle2 },
  { title: 'Cotizacion rapida', description: 'Una solicitud puede activar multiples respuestas comparables en minutos.', Icon: Clock3 },
  { title: 'Conexion directa', description: 'Compradores y proveedores conversan sin intermediarios innecesarios.', Icon: Network },
];

const categories = [
  { name: 'Frutas y verduras', detail: 'Frescos y congelados', Icon: Boxes },
  { name: 'Carnes y pollo', detail: 'Vacuno, cerdo y aves', Icon: Package },
  { name: 'Abarrotes', detail: 'Secos y estables', Icon: Store },
  { name: 'Congelados', detail: 'IQF y horeca', Icon: Truck },
  { name: 'Mas categorias', detail: 'Aceites, lacteos y mas', Icon: Search },
];

export default function Landing() {
  const [authRole, setAuthRole] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleRoleClick = (role) => {
    if (currentUser) {
      if (role === 'proveedor') navigate('/dashboard-proveedor');
      else navigate('/dashboard-comprador', { state: { activeTab: 'dashboard' } });
    } else {
      setAuthRole(role);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-[#051022] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_63%_36%,rgba(46,202,213,0.2),transparent_34%),linear-gradient(180deg,#061126_0%,#051022_62%,#07172b_100%)]" aria-hidden="true" />
        <div className="hero-perspective-grid absolute inset-x-[-10%] bottom-[-18%] h-[70%] opacity-60" aria-hidden="true" />
        <div className="absolute right-[12%] top-16 h-[520px] w-[520px] rounded-full border border-brand-accent/10" aria-hidden="true" />
        <div className="absolute right-[18%] top-28 h-[360px] w-[360px] rounded-full border border-brand-accent/15" aria-hidden="true" />
        <div className="absolute right-[25%] top-44 h-44 w-44 rounded-full bg-brand-accent/20 blur-[80px]" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-accent/40 to-transparent" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(560px,1fr)] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-accent/20 bg-brand-accent/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-brand-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                PLATAFORMA B2B FOOD SERVICE
              </div>

              <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
                Gestiona, conecta y compra mejor en un solo{' '}
                <span className="text-brand-accent">ecosistema</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                Conectamos a restaurantes, pastelerias y hoteles de Chile con proveedores verificados de insumos alimentarios, carnes, harinas y mas.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleRoleClick('comprador')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-blue-500 px-6 py-3.5 text-sm font-extrabold text-brand-ink shadow-xl shadow-emerald-400/20 transition hover:scale-[1.02]"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Soy comprador
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleClick('proveedor')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  <Store className="h-4 w-4" />
                  Soy proveedor
                </button>
                <Link
                  to="/marketplace"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  <Search className="h-4 w-4" />
                  Explorar marketplace
                </Link>
              </div>
            </div>

            <div className="relative">
              <SupplyNetworkHeroVisual />
            </div>
          </div>

          <div className="mt-12 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur-md sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="flex items-center gap-3 border-white/10 px-3 py-2 lg:border-r last:border-r-0">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-accent/10 text-brand-accent">
                  <item.Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xl font-black">{item.value}</div>
                  <div className="text-xs text-slate-400">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {authRole && <AuthChoiceModal role={authRole} onClose={() => setAuthRole(null)} />}

      <section className="bg-white px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-2xl font-black text-brand-ink sm:text-3xl">Como funciona Zentra?</h2>
            <p className="mt-2 text-sm text-slate-500">En 3 pasos simples y rapidos</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((item) => (
              <div key={item.step} className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="absolute -top-3 left-6 grid h-7 w-7 place-items-center rounded-full bg-brand-accent text-xs font-black text-brand-ink">{item.step}</div>
                <div className="grid h-14 w-14 place-items-center rounded-xl bg-brand-ink text-brand-accent">
                  <item.Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-base font-black text-brand-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-brand-canvas px-4 py-12">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="text-xl font-black text-brand-ink">Explora categorias</h2>
            <p className="mt-1 text-sm text-slate-500">Encuentra lo que tu negocio necesita</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {categories.map((item) => (
                <Link key={item.name} to="/marketplace" className="rounded-xl border border-slate-100 bg-white p-4 transition hover:border-brand-accent/30 hover:shadow-md">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-accent/10 text-brand-accent">
                    <item.Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-sm font-black text-brand-ink">{item.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.detail}</div>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black text-brand-ink">Por que elegir Zentra?</h2>
            <p className="mt-1 text-sm text-slate-500">Una plataforma diseñada para hacer crecer tu negocio</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {valueProps.map((item) => (
                <div key={item.title} className="rounded-xl bg-white p-4">
                  <item.Icon className="h-6 w-6 text-brand-accent" />
                  <div className="mt-3 text-sm font-black text-brand-ink">{item.title}</div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-14">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-brand-inkDark text-white">
          <div className="grid gap-8 p-8 lg:grid-cols-[0.9fr_1fr] lg:p-10">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.28em] text-brand-accent">Unete a Zentra</div>
              <h2 className="mt-4 text-3xl font-black leading-tight">Miles de negocios ya compran mejor con Zentra</h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
                Crea tu cuenta gratis y empieza a recibir mejores cotizaciones desde proveedores verificados.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link to="/registro-comprador" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-blue-500 px-5 py-3 text-sm font-black text-brand-ink">
                  Crear cuenta gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button type="button" onClick={() => handleRoleClick('proveedor')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white">
                  <Store className="h-4 w-4" />
                  Publicar como proveedor
                </button>
              </div>
            </div>
            <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="absolute right-[-80px] top-[-80px] h-72 w-72 rounded-full border border-brand-accent/20" />
              <div className="absolute right-[-40px] top-[-40px] h-52 w-52 rounded-full border border-brand-accent/20" />
              <div className="relative z-10 max-w-sm">
                <div className="text-sm font-bold">Lo que dicen nuestros usuarios</div>
                <p className="mt-5 text-lg font-semibold leading-8 text-slate-200">
                  Zentra nos permitio ahorrar tiempo y comparar mejores precios con trazabilidad.
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-brand-accent text-sm font-black text-brand-ink">MJ</div>
                  <div>
                    <div className="text-sm font-bold">Maria Jose R.</div>
                    <div className="text-xs text-slate-500">Gerente de Compras</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
