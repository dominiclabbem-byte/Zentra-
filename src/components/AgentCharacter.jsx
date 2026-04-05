/**
 * AgentCharacter – cute SVG mascots for each AI sales agent.
 *
 * Usage:
 *   <AgentCharacter name="Agente Valentina" size={80} />
 *   <AgentCharacter name="Agente Sofia"     size={60} />
 *   <AgentCharacter name="Agente Carlos"    size={60} />
 */

/* ---------- Valentina (Email – blue) ---------- */
function ValentinaSVG({ size }) {
  return (
    <svg width={size} height={size * (180 / 140)} viewBox="0 0 140 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="70" cy="120" rx="38" ry="42" fill="#BFDBFE" />
      <ellipse cx="70" cy="72" rx="42" ry="44" fill="#BFDBFE" />
      <ellipse cx="28" cy="70" rx="10" ry="13" fill="#BFDBFE" />
      <ellipse cx="112" cy="70" rx="10" ry="13" fill="#BFDBFE" />
      <ellipse cx="55" cy="65" rx="12" ry="14" fill="white" />
      <ellipse cx="85" cy="65" rx="12" ry="14" fill="white" />
      <circle cx="57" cy="67" r="7" fill="#1D4ED8" />
      <circle cx="87" cy="67" r="7" fill="#1D4ED8" />
      <circle cx="59" cy="63" r="3" fill="black" />
      <circle cx="89" cy="63" r="3" fill="black" />
      <circle cx="62" cy="61" r="1.5" fill="white" />
      <circle cx="92" cy="61" r="1.5" fill="white" />
      <ellipse cx="42" cy="80" rx="8" ry="5" fill="#FCA5A5" opacity="0.5" />
      <ellipse cx="98" cy="80" rx="8" ry="5" fill="#FCA5A5" opacity="0.5" />
      <path d="M52 87 Q70 100 88 87" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="63" y="87" width="14" height="9" rx="3" fill="white" stroke="#BFDBFE" strokeWidth="0.5" />
      <rect x="95" y="18" width="34" height="24" rx="4" fill="#2563EB" />
      <path d="M95 22l17 10 17-10" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M108 110 Q118 95 112 28" stroke="#BFDBFE" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M32 108 Q18 125 22 145" stroke="#BFDBFE" strokeWidth="10" strokeLinecap="round" fill="none" />
      <ellipse cx="56" cy="160" rx="10" ry="14" fill="#93C5FD" />
      <ellipse cx="84" cy="160" rx="10" ry="14" fill="#93C5FD" />
    </svg>
  );
}

/* ---------- Sofia (WhatsApp – green) ---------- */
function SofiaSVG({ size }) {
  return (
    <svg width={size} height={size * (180 / 140)} viewBox="0 0 140 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="70" cy="122" rx="36" ry="40" fill="#BBF7D0" />
      <rect x="22" y="28" width="96" height="88" rx="32" fill="#BBF7D0" />
      <rect x="18" y="24" width="104" height="22" rx="11" fill="#16A34A" />
      <rect x="42" y="10" width="56" height="18" rx="9" fill="#16A34A" />
      <rect x="10" y="40" width="28" height="10" rx="5" fill="#15803D" />
      <path d="M46 68 Q55 60 64 68" stroke="#15803D" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M76 68 Q85 60 94 68" stroke="#15803D" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M50 82 Q70 102 90 82" stroke="#15803D" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="70" cy="88" rx="14" ry="9" fill="#15803D" />
      <ellipse cx="70" cy="92" rx="10" ry="5" fill="#F87171" />
      <ellipse cx="38" cy="84" rx="9" ry="6" fill="#86EFAC" opacity="0.6" />
      <ellipse cx="102" cy="84" rx="9" ry="6" fill="#86EFAC" opacity="0.6" />
      <rect x="88" y="12" width="42" height="28" rx="8" fill="#16A34A" />
      <circle cx="98" cy="26" r="3.5" fill="white" />
      <circle cx="109" cy="26" r="3.5" fill="white" />
      <circle cx="120" cy="26" r="3.5" fill="white" />
      <path d="M88 36 L84 44 L96 38" fill="#16A34A" />
      <path d="M32 118 Q14 108 10 90" stroke="#BBF7D0" strokeWidth="11" strokeLinecap="round" fill="none" />
      <path d="M108 118 Q126 108 130 90" stroke="#BBF7D0" strokeWidth="11" strokeLinecap="round" fill="none" />
      <circle cx="10" cy="88" r="8" fill="#86EFAC" />
      <path d="M6 88 Q10 82 14 88" stroke="#16A34A" strokeWidth="1.5" fill="none" />
      <ellipse cx="54" cy="162" rx="12" ry="13" fill="#86EFAC" />
      <ellipse cx="86" cy="162" rx="12" ry="13" fill="#86EFAC" />
    </svg>
  );
}

/* ---------- Carlos (Llamadas – orange) ---------- */
function CarlosSVG({ size }) {
  return (
    <svg width={size} height={size * (180 / 140)} viewBox="0 0 140 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="70" cy="124" rx="36" ry="38" fill="#FED7AA" />
      <ellipse cx="70" cy="74" rx="44" ry="46" fill="#FED7AA" />
      <path d="M26 68 Q26 28 70 28 Q114 28 114 68" stroke="#EA580C" strokeWidth="7" strokeLinecap="round" fill="none" />
      <rect x="16" y="64" width="18" height="26" rx="9" fill="#EA580C" />
      <rect x="106" y="64" width="18" height="26" rx="9" fill="#EA580C" />
      <path d="M70 108 Q70 118 80 118" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="76" y="116" width="14" height="5" rx="2.5" fill="#EA580C" />
      <ellipse cx="54" cy="68" rx="14" ry="15" fill="white" />
      <ellipse cx="86" cy="68" rx="14" ry="15" fill="white" />
      <line x1="68" y1="68" x2="72" y2="68" stroke="#EA580C" strokeWidth="2" />
      <circle cx="55" cy="70" r="8" fill="#EA580C" />
      <circle cx="87" cy="70" r="8" fill="#EA580C" />
      <circle cx="57" cy="67" r="3.5" fill="black" />
      <circle cx="89" cy="67" r="3.5" fill="black" />
      <circle cx="59" cy="65" r="1.5" fill="white" />
      <circle cx="91" cy="65" r="1.5" fill="white" />
      <path d="M42 52 Q55 46 66 52" stroke="#C2410C" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M74 52 Q85 46 98 52" stroke="#C2410C" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M56 88 Q70 96 84 88" stroke="#C2410C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <ellipse cx="38" cy="80" rx="8" ry="5" fill="#FCA5A5" opacity="0.4" />
      <ellipse cx="102" cy="80" rx="8" ry="5" fill="#FCA5A5" opacity="0.4" />
      <path d="M118 58 Q124 66 118 74" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M124 52 Q134 66 124 80" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M34 120 Q18 128 16 148" stroke="#FED7AA" strokeWidth="11" strokeLinecap="round" fill="none" />
      <path d="M106 120 Q122 128 124 148" stroke="#FED7AA" strokeWidth="11" strokeLinecap="round" fill="none" />
      <ellipse cx="54" cy="162" rx="11" ry="13" fill="#FDBA74" />
      <ellipse cx="86" cy="162" rx="11" ry="13" fill="#FDBA74" />
    </svg>
  );
}

/* ---------- Lookup map ---------- */
const CHARACTER_MAP = {
  'Agente Valentina': ValentinaSVG,
  'Agente Sofia': SofiaSVG,
  'Agente Carlos': CarlosSVG,
  Valentina: ValentinaSVG,
  Sofia: SofiaSVG,
  Carlos: CarlosSVG,
};

/**
 * @param {{ name: string, size?: number, className?: string }} props
 */
export default function AgentCharacter({ name, size = 48, className = '' }) {
  const Component = CHARACTER_MAP[name];
  if (!Component) return null;
  return (
    <span className={className} style={{ display: 'inline-flex', lineHeight: 0 }}>
      <Component size={size} />
    </span>
  );
}
