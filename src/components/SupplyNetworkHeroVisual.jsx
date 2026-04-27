import { useLayoutEffect, useRef, useState } from 'react';
import {
  Beef,
  CheckCircle2,
  Clock3,
  FileText,
  Hotel,
  Leaf,
  Mail,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Snowflake,
  Store,
  Tag,
  Utensils,
  Zap,
} from 'lucide-react';
import mainLogo from '../assets/zentra_main_logo.png';

const buyerNodes = [
  { label: 'Restaurante', Icon: Utensils },
  { label: 'Hotel', Icon: Hotel },
  { label: 'Pasteleria', Icon: Store },
];

const supplierNodes = [
  { label: 'Frutas y verduras', Icon: Leaf },
  { label: 'Carnes', Icon: Beef },
  { label: 'Congelados IQF', Icon: Snowflake },
  { label: 'Abarrotes', Icon: ShoppingBag },
];

const flowSteps = [
  { label: 'Necesidad publicada', Icon: FileText },
  { label: '5 ofertas recibidas', Icon: Mail },
  { label: 'Comparar precio / entrega / confianza', Icon: Scale },
  { label: 'Pedido confirmado', Icon: CheckCircle2 },
];

const trustChips = [
  { label: 'Proveedor verificado', Icon: ShieldCheck },
  { label: '24 hrs respuesta promedio', Icon: Clock3 },
  { label: 'Precio visible y transparente', Icon: Tag },
  { label: 'Respuesta rapida', Icon: Zap },
];

function NetworkNode({ item, align = 'left', nodeRef }) {
  const Icon = item.Icon;

  return (
    <div ref={nodeRef} className={`relative z-10 flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl border border-white/12 bg-white/[0.06] px-2 py-2 text-center shadow-lg shadow-black/20 backdrop-blur-md sm:min-h-0 sm:flex-row sm:justify-start sm:gap-3 sm:px-4 sm:py-3 sm:text-left ${align === 'right' ? 'sm:justify-start' : ''}`}>
      <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg border border-brand-accent/25 bg-brand-accent/10 text-brand-accent sm:h-10 sm:w-10">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <span className="text-[11px] font-bold leading-tight text-white sm:text-sm">{item.label}</span>
    </div>
  );
}

function buildCurve(start, end, direction) {
  const distance = Math.max(Math.abs(end.x - start.x), 60);
  const curve = Math.min(Math.max(distance * 0.48, 44), 120);
  const c1x = start.x + curve * direction;
  const c2x = end.x - curve * direction;

  return `M ${start.x} ${start.y} C ${c1x} ${start.y}, ${c2x} ${end.y}, ${end.x} ${end.y}`;
}

export default function SupplyNetworkHeroVisual() {
  const visualRef = useRef(null);
  const hubRef = useRef(null);
  const buyerRefs = useRef([]);
  const supplierRefs = useRef([]);
  const [connectors, setConnectors] = useState([]);

  useLayoutEffect(() => {
    const visual = visualRef.current;
    const hub = hubRef.current;

    if (!visual || !hub) return undefined;

    const measure = () => {
      const visualBox = visual.getBoundingClientRect();
      const hubBox = hub.getBoundingClientRect();
      const hubLeft = hubBox.left - visualBox.left;
      const hubRight = hubBox.right - visualBox.left;
      const hubCenterY = hubBox.top - visualBox.top + hubBox.height / 2;
      const hubStep = hubBox.height / 5;

      const next = [];

      buyerRefs.current.forEach((node, index) => {
        if (!node) return;
        const box = node.getBoundingClientRect();
        const start = {
          x: box.right - visualBox.left,
          y: box.top - visualBox.top + box.height / 2,
        };
        const end = {
          x: hubLeft,
          y: hubCenterY + (index - 1) * hubStep,
        };
        next.push({ path: buildCurve(start, end, 1), start, end });
      });

      supplierRefs.current.forEach((node, index) => {
        if (!node) return;
        const box = node.getBoundingClientRect();
        const offset = index - (supplierNodes.length - 1) / 2;
        const start = {
          x: box.left - visualBox.left,
          y: box.top - visualBox.top + box.height / 2,
        };
        const end = {
          x: hubRight,
          y: hubCenterY + offset * (hubBox.height / 6),
        };
        next.push({ path: buildCurve(start, end, -1), start, end });
      });

      setConnectors(next);
    };

    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (observer) {
      observer.observe(visual);
      observer.observe(hub);
      buyerRefs.current.forEach((node) => node && observer.observe(node));
      supplierRefs.current.forEach((node) => node && observer.observe(node));
    }
    window.addEventListener('resize', measure);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div ref={visualRef} className="relative mx-auto w-full max-w-3xl" aria-label="Diagrama de red de abastecimiento Zentra">
      <div className="absolute left-1/2 top-16 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-brand-accent/20 blur-[70px] sm:top-8 sm:h-[420px] sm:w-[420px] sm:blur-[90px]" aria-hidden="true" />
      <div className="absolute left-1/2 top-16 h-[300px] w-[300px] -translate-x-1/2 rounded-full border border-brand-accent/15 sm:top-8 sm:h-[420px] sm:w-[420px]" aria-hidden="true" />
      <div className="absolute left-1/2 top-24 h-[230px] w-[230px] -translate-x-1/2 rounded-full border border-brand-accent/15 sm:top-16 sm:h-[330px] sm:w-[330px]" aria-hidden="true" />
      <div className="absolute left-1/2 top-32 h-[160px] w-[160px] -translate-x-1/2 rounded-full border border-brand-accent/15 sm:top-24 sm:h-[240px] sm:w-[240px]" aria-hidden="true" />

      <div className="relative rounded-[24px] border border-white/10 bg-[#071427]/70 p-3 shadow-2xl shadow-black/35 backdrop-blur-xl sm:rounded-[28px] sm:p-6">
        <svg className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible" fill="none" aria-hidden="true">
          <defs>
            <filter id="network-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {connectors.map((connector, index) => (
            <g key={`${connector.start.x}-${connector.start.y}-${index}`}>
              <path d={connector.path} stroke="#2ECAD5" strokeOpacity="0.68" strokeWidth="2" filter="url(#network-glow)" />
              <circle cx={connector.start.x} cy={connector.start.y} r="3" fill="#2ECAD5" opacity="0.9" />
              <circle cx={connector.end.x} cy={connector.end.y} r="3" fill="#2ECAD5" opacity="0.9" />
            </g>
          ))}
        </svg>

        <div className="grid grid-cols-[0.9fr_0.95fr_0.9fr] items-center gap-2 sm:gap-4 md:grid-cols-[1fr_1.2fr_1fr] md:items-center">
          <div className="grid gap-2 sm:gap-3">
            {buyerNodes.map((item, index) => (
              <NetworkNode key={item.label} item={item} nodeRef={(node) => { buyerRefs.current[index] = node; }} />
            ))}
          </div>

          <div className="relative z-10 mx-auto grid min-h-[132px] w-full max-w-[128px] place-items-center sm:min-h-[210px] sm:max-w-[250px] md:translate-y-3">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(46,202,213,0.055)_0%,rgba(46,202,213,0.025)_34%,rgba(46,202,213,0)_68%)]" aria-hidden="true" />
            <div className="absolute inset-8 rounded-full bg-[radial-gradient(circle_at_center,rgba(46,202,213,0.04)_0%,rgba(46,202,213,0.018)_42%,rgba(46,202,213,0)_72%)]" aria-hidden="true" />
            <div className="absolute left-1/2 top-[56%] h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(46,202,213,0.12)_0%,rgba(46,202,213,0.05)_42%,rgba(46,202,213,0)_72%)] blur-2xl sm:h-52 sm:w-52" aria-hidden="true" />
            <div className="absolute left-1/2 top-[58%] h-24 w-28 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(46,202,213,0.045)_0%,rgba(46,202,213,0.018)_46%,rgba(46,202,213,0)_78%)] shadow-[0_0_18px_rgba(46,202,213,0.16)] [transform:translate(-50%,-50%)_rotateX(54deg)] sm:h-36 sm:w-44" aria-hidden="true" />
            <div className="absolute left-1/2 top-[58%] h-32 w-40 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(46,202,213,0.032)_0%,rgba(46,202,213,0.012)_52%,rgba(46,202,213,0)_84%)] shadow-[0_0_16px_rgba(46,202,213,0.1)] [transform:translate(-50%,-50%)_rotateX(54deg)] sm:h-48 sm:w-64" aria-hidden="true" />
            <div className="absolute left-1/2 top-[58%] h-40 w-52 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(46,202,213,0.02)_0%,rgba(46,202,213,0.008)_58%,rgba(46,202,213,0)_88%)] [transform:translate(-50%,-50%)_rotateX(54deg)] sm:h-60 sm:w-96" aria-hidden="true" />
            <div className="absolute left-1/2 top-[58%] h-48 w-64 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(46,202,213,0.014)_0%,rgba(46,202,213,0.004)_62%,rgba(46,202,213,0)_90%)] [transform:translate(-50%,-50%)_rotateX(54deg)] sm:h-72 sm:w-[30rem]" aria-hidden="true" />
            <div className="absolute left-1/2 top-[34%] h-28 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-brand-accent/25 to-transparent sm:top-[31%] sm:h-44" aria-hidden="true" />
            <div className="absolute left-1/2 top-[58%] h-px w-52 bg-gradient-to-r from-transparent via-brand-accent/18 to-transparent [transform:translate(-50%,-50%)_rotateX(54deg)] sm:w-80" aria-hidden="true" />
            <div ref={hubRef} className="relative grid h-24 w-24 place-items-center rounded-2xl border border-brand-accent/35 bg-[#081a30]/95 text-center shadow-[0_0_42px_rgba(46,202,213,0.28)] ring-1 ring-white/5 sm:h-36 sm:w-36 sm:rounded-3xl">
              <img src={mainLogo} alt="" className="h-7 w-auto sm:h-10" aria-hidden="true" />
              <div>
                <div className="text-lg font-black text-white sm:text-2xl">Zentra</div>
                <div className="text-[10px] font-bold text-brand-accent sm:text-xs">Trust Layer</div>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:gap-3">
            {supplierNodes.map((item, index) => (
              <NetworkNode key={item.label} item={item} align="right" nodeRef={(node) => { supplierRefs.current[index] = node; }} />
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.05] p-2 sm:mt-5 sm:p-3">
          <div className="grid grid-cols-4 gap-1 sm:gap-2">
            {flowSteps.map((item, index) => {
              const Icon = item.Icon;
              return (
                <div key={item.label} className="relative flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-center sm:flex-row sm:gap-3 sm:px-2 sm:text-left">
                  <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-brand-accent/10 text-brand-accent sm:h-8 sm:w-8">
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-brand-accent">{String(index + 1).padStart(2, '0')}</div>
                    <div className="text-[10px] font-bold leading-tight text-white sm:text-xs sm:leading-4">{item.label}</div>
                  </div>
                  {index < flowSteps.length - 1 && (
                    <div className="absolute -right-1 top-1/2 hidden h-px w-6 -translate-y-1/2 bg-white/20 sm:block" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-2 sm:mt-4 sm:grid-cols-2 sm:gap-2 sm:p-3 lg:grid-cols-4">
          {trustChips.map((item) => {
            const Icon = item.Icon;
            return (
              <div key={item.label} className="flex items-center gap-2 rounded-xl px-2 py-2 text-[11px] font-semibold leading-tight text-slate-300 sm:text-xs">
                <Icon className="h-3.5 w-3.5 flex-shrink-0 text-brand-accent sm:h-4 sm:w-4" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
