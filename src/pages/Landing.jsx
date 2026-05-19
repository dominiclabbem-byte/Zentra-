import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Beef,
  Boxes,
  CheckCircle2,
  Clock3,
  FileText,
  Leaf,
  MessageCircle,
  Package,
  Scale,
  Search,
  ShieldCheck,
  ShoppingCart,
  Snowflake,
  Store,
  Truck,
} from 'lucide-react';
import AuthChoiceModal from '../components/AuthChoiceModal';
import SupplyNetworkHeroVisual from '../components/SupplyNetworkHeroVisual';
import { useAuth } from '../context/AuthContext';

const operationalMetrics = [
  { value: '5', label: 'cotizaciones comparables por solicitud demo', Icon: MessageCircle },
  { value: '24 h', label: 'respuesta objetivo para compradores activos', Icon: Clock3 },
  { value: 'RUT', label: 'y categoria visibles antes de contactar', Icon: ShieldCheck },
  { value: '1 vista', label: 'para precio, entrega y proveedor', Icon: Scale },
];

const quoteRows = [
  { supplier: 'Valle Frio SpA', price: '$41.200', eta: 'manana 09:00', status: 'Verificado' },
  { supplier: 'Molino Sur', price: '$42.050', eta: '48 h', status: 'RUT visible' },
  { supplier: 'Central Horeca', price: '$43.600', eta: 'retiro hoy', status: 'Categoria validada' },
];

const processStages = [
  {
    step: '01',
    title: 'Solicitud con datos utiles',
    description: 'Producto, formato, volumen, comuna y fecha quedan ordenados desde el inicio.',
    status: 'RFQ publicada',
    Icon: FileText,
  },
  {
    step: '02',
    title: 'Ofertas comparables',
    description: 'Cada respuesta se lee con precio, entrega, proveedor y condicion comercial.',
    status: '3 ofertas activas',
    Icon: Scale,
  },
  {
    step: '03',
    title: 'Pedido trazable',
    description: 'El comprador confirma con contexto y el proveedor mantiene la conversacion centralizada.',
    status: 'Pedido coordinado',
    Icon: Package,
  },
];

const categories = [
  { name: 'Frutas y verduras', detail: 'Frescos, congelados y cuarta gama', Icon: Leaf },
  { name: 'Carnes y pollo', detail: 'Vacuno, cerdo, aves y porcionados', Icon: Beef },
  { name: 'Abarrotes', detail: 'Secos, harinas, aceites y bases', Icon: Boxes },
  { name: 'Congelados', detail: 'IQF, horeca y reposicion semanal', Icon: Snowflake },
  { name: 'Despacho food service', detail: 'Rutas, ventanas y retiro coordinado', Icon: Truck },
];

const comparisonRows = [
  ['Precio visible', 'Valor neto, unidad y formato'],
  ['Entrega', 'Fecha, comuna, retiro o despacho'],
  ['Confianza', 'RUT, rubro, revision y actividad'],
  ['Conversacion', 'Historial asociado a la solicitud'],
];

const trustSignals = [
  'Perfiles con razon social, RUT y rubro declarado.',
  'Categorias revisables antes de enviar una solicitud.',
  'Cotizaciones guardadas con precio, entrega y estado.',
];

function ProductProofCard() {
  return (
    <aside className="rounded-3xl border border-white/10 bg-[#071427]/90 p-4 shadow-2xl shadow-black/25 ring-1 ring-brand-accent/10 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-accent">Solicitud activa</div>
          <h2 className="mt-2 text-lg font-extrabold leading-tight text-white">Harina fuerza 25 kg</h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">18 sacos para Providencia, entrega antes de las 10:00.</p>
        </div>
        <div className="rounded-2xl bg-brand-accent/10 px-3 py-2 text-right">
          <div className="text-xl font-black text-brand-accent">3</div>
          <div className="text-[10px] font-semibold text-slate-300">ofertas</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {quoteRows.map((quote, index) => (
          <div key={quote.supplier} className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-md bg-brand-accent/10 text-[10px] font-black text-brand-accent">
                  {index + 1}
                </span>
                <span className="truncate text-sm font-bold text-white">{quote.supplier}</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">{quote.eta} · {quote.status}</div>
            </div>
            <div className="text-right text-sm font-black text-white">{quote.price}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-brand-accent/10 px-3 py-2 text-xs font-bold text-brand-accent">
        <span>Estado</span>
        <span className="inline-flex items-center gap-1 text-white">
          <CheckCircle2 className="h-3.5 w-3.5 text-brand-accent" />
          listo para comparar
        </span>
      </div>
    </aside>
  );
}

function MetricsStrip({ compact = false }) {
  const visibleMetrics = compact ? operationalMetrics.slice(0, 2) : operationalMetrics;

  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
      {visibleMetrics.map((item) => (
        <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-xl shadow-black/10">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-accent/10 text-brand-accent">
              <item.Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-black tabular-nums text-white">{item.value}</div>
              <div className="text-xs leading-4 text-slate-400">{item.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

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
      <section className="relative overflow-hidden bg-[#061126] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_24%,rgba(46,202,213,0.18),transparent_30%),linear-gradient(180deg,#061126_0%,#071427_58%,#071a2e_100%)]" aria-hidden="true" />
        <div className="hero-perspective-grid absolute inset-x-[-10%] bottom-[-18%] h-[70%] opacity-55" aria-hidden="true" />
        <div className="absolute right-[8%] top-20 h-[560px] w-[560px] rounded-full border border-brand-accent/10" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-accent/40 to-transparent" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(560px,1fr)] lg:items-center lg:gap-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-accent/25 bg-brand-accent/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-brand-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
                Red B2B food service en Chile
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[0.98] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Cotiza insumos food service con proveedores verificados en Chile
              </h1>

              <p className="mt-5 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
                Zentra ordena solicitudes, ofertas y conversaciones para que restaurantes, hoteles y pastelerias comparen precio, entrega y confianza en una sola vista.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleRoleClick('comprador')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-accent px-6 py-3.5 text-sm font-extrabold text-brand-ink shadow-xl shadow-brand-accent/15 transition hover:-translate-y-0.5 hover:bg-brand-accentLight active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-brand-accent/60 focus:ring-offset-2 focus:ring-offset-[#061126]"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Soy comprador
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleClick('proveedor')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-brand-accent/60 focus:ring-offset-2 focus:ring-offset-[#061126]"
                >
                  <Store className="h-4 w-4" />
                  Soy proveedor
                </button>
                <Link
                  to="/marketplace"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-brand-accent/60 focus:ring-offset-2 focus:ring-offset-[#061126]"
                >
                  <Search className="h-4 w-4" />
                  Explorar marketplace
                </Link>
              </div>

              <div className="mt-6 lg:hidden">
                <MetricsStrip compact />
              </div>

              <div className="mt-6 hidden lg:block">
                <ProductProofCard />
              </div>
            </div>

            <div className="grid gap-5">
              <div className="lg:hidden">
                <ProductProofCard />
              </div>
              <SupplyNetworkHeroVisual />
            </div>
          </div>

          <div className="mt-10 hidden lg:block">
            <MetricsStrip />
          </div>
        </div>
      </section>

      {authRole && <AuthChoiceModal role={authRole} onClose={() => setAuthRole(null)} />}

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-brand-accent">Flujo operativo</div>
            <h2 className="mt-3 text-3xl font-black leading-tight text-brand-ink sm:text-4xl">De solicitud a pedido sin perseguir mensajes</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              La compra queda estructurada por etapas, con datos suficientes para decidir y menos conversaciones sueltas.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {processStages.map((item, index) => (
              <article key={item.step} className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                {index < processStages.length - 1 && (
                  <div className="absolute left-[calc(100%-1rem)] top-10 hidden h-px w-8 bg-brand-accent/30 lg:block" aria-hidden="true" />
                )}
                <div className="flex items-center justify-between gap-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-brand-panel px-3 py-1 text-[11px] font-bold text-brand-ink">
                    <span className="text-brand-accent">{item.step}</span>
                    {item.status}
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-ink text-brand-accent">
                    <item.Icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-8 text-lg font-black text-brand-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-brand-canvas px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-brand-accent">Categorias y condiciones</div>
            <h2 className="mt-3 text-3xl font-black leading-tight text-brand-ink">Compra por categoria, compara por condicion</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Zentra no es solo un catalogo: cada categoria se conecta con informacion comercial que permite comparar proveedores.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {categories.map((item) => (
                <Link key={item.name} to="/marketplace" className="group rounded-2xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-premium focus:outline-none focus:ring-2 focus:ring-brand-accent/40">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-brand-accent/10 text-brand-accent transition group-hover:bg-brand-accent group-hover:text-brand-ink">
                      <item.Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-brand-ink">{item.name}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-premium">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-brand-ink">Comparacion antes de comprar</h3>
                <p className="mt-1 text-sm text-slate-500">Los datos clave quedan junto a cada oferta.</p>
              </div>
              <ShieldCheck className="h-6 w-6 text-brand-accent" />
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
              {comparisonRows.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[0.7fr_1fr] border-b border-slate-100 last:border-b-0">
                  <div className="bg-brand-panel px-4 py-3 text-xs font-black text-brand-ink">{label}</div>
                  <div className="px-4 py-3 text-xs leading-5 text-slate-600">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-brand-ink p-4 text-white">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-brand-accent">Proveedor verificado significa</div>
              <ul className="mt-3 space-y-2">
                {trustSignals.map((signal) => (
                  <li key={signal} className="flex gap-2 text-sm leading-6 text-slate-300">
                    <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-brand-accent" />
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-brand-inkDark text-white shadow-premium-xl">
          <div className="grid gap-8 p-7 lg:grid-cols-[0.9fr_1fr] lg:p-10">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-brand-accent">Empieza con una solicitud</div>
              <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">Compara proveedores antes de cerrar tu proxima compra</h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
                Crea una cuenta gratis, publica una necesidad real y conserva el historial de respuestas en Zentra.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/registro-comprador" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-accent px-5 py-3 text-sm font-black text-brand-ink transition hover:bg-brand-accentLight focus:outline-none focus:ring-2 focus:ring-brand-accent/60 focus:ring-offset-2 focus:ring-offset-brand-inkDark">
                  Crear cuenta gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button type="button" onClick={() => handleRoleClick('proveedor')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-accent/60 focus:ring-offset-2 focus:ring-offset-brand-inkDark">
                  <Store className="h-4 w-4" />
                  Publicar como proveedor
                </button>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="text-sm font-bold">Caso de uso</div>
              <p className="mt-4 text-xl font-semibold leading-8 text-slate-200">
                Una pasteleria puede publicar harina, mantequilla y berries congelados, recibir ofertas separadas y comparar entrega por proveedor.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {['Publicada', 'Ofertas recibidas', 'Pedido coordinado'].map((state) => (
                  <div key={state} className="rounded-2xl bg-white/[0.06] p-3 text-xs font-bold text-slate-300">
                    <CheckCircle2 className="mb-2 h-4 w-4 text-brand-accent" />
                    {state}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
