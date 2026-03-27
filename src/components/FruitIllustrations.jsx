export function Strawberry({ className }) {
  return (
    <svg className={className} viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sg1" cx="40%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ff6b8a" />
          <stop offset="100%" stopColor="#d41b3c" />
        </radialGradient>
      </defs>
      {/* Leaves */}
      <ellipse cx="30" cy="14" rx="10" ry="6" fill="#2d9e4f" transform="rotate(-25 30 14)" />
      <ellipse cx="50" cy="14" rx="10" ry="6" fill="#27894a" transform="rotate(25 50 14)" />
      <ellipse cx="40" cy="10" rx="8" ry="12" fill="#33b55c" />
      {/* Body */}
      <path d="M18 28 Q15 55 40 80 Q65 55 62 28 Q50 15 40 18 Q30 15 18 28Z" fill="url(#sg1)" />
      {/* Seeds */}
      <ellipse cx="33" cy="40" rx="2" ry="2.5" fill="#ffecef" opacity="0.9" transform="rotate(-10 33 40)" />
      <ellipse cx="47" cy="38" rx="2" ry="2.5" fill="#ffecef" opacity="0.9" transform="rotate(10 47 38)" />
      <ellipse cx="37" cy="52" rx="2" ry="2.5" fill="#ffecef" opacity="0.9" />
      <ellipse cx="50" cy="52" rx="2" ry="2.5" fill="#ffecef" opacity="0.9" transform="rotate(5 50 52)" />
      <ellipse cx="30" cy="55" rx="2" ry="2.5" fill="#ffecef" opacity="0.9" transform="rotate(-5 30 55)" />
      <ellipse cx="42" cy="65" rx="2" ry="2.5" fill="#ffecef" opacity="0.9" />
      {/* Shine */}
      <ellipse cx="28" cy="34" rx="5" ry="3" fill="white" opacity="0.25" transform="rotate(-30 28 34)" />
    </svg>
  );
}

export function Avocado({ className }) {
  return (
    <svg className={className} viewBox="0 0 70 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ag1" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#4a7c3f" />
          <stop offset="100%" stopColor="#1a3d1a" />
        </radialGradient>
        <radialGradient id="ag2" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#f5e642" />
          <stop offset="60%" stopColor="#c8d44a" />
          <stop offset="100%" stopColor="#7eb83e" />
        </radialGradient>
        <radialGradient id="ag3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c67a3c" />
          <stop offset="100%" stopColor="#7a3e18" />
        </radialGradient>
      </defs>
      {/* Outer skin */}
      <path d="M35 5 Q15 25 12 55 Q12 80 35 85 Q58 80 58 55 Q55 25 35 5Z" fill="url(#ag1)" />
      {/* Inner flesh */}
      <path d="M35 18 Q20 35 18 57 Q18 76 35 80 Q52 76 52 57 Q50 35 35 18Z" fill="url(#ag2)" />
      {/* Pit */}
      <ellipse cx="35" cy="56" rx="12" ry="14" fill="url(#ag3)" />
      <ellipse cx="32" cy="52" rx="4" ry="3" fill="#d4935a" opacity="0.4" />
    </svg>
  );
}

export function Orange({ className }) {
  return (
    <svg className={className} viewBox="0 0 80 85" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="og1" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffa040" />
          <stop offset="100%" stopColor="#e05e00" />
        </radialGradient>
      </defs>
      {/* Leaf & stem */}
      <rect x="37" y="4" width="4" height="8" rx="2" fill="#5a3e28" />
      <ellipse cx="50" cy="10" rx="10" ry="6" fill="#3aad5e" transform="rotate(-20 50 10)" />
      {/* Body */}
      <circle cx="40" cy="48" r="33" fill="url(#og1)" />
      {/* Texture lines */}
      <path d="M40 16 Q55 32 40 80" stroke="#e06800" strokeWidth="1" opacity="0.4" strokeDasharray="2 3" />
      <path d="M40 16 Q25 32 40 80" stroke="#e06800" strokeWidth="1" opacity="0.4" strokeDasharray="2 3" />
      <path d="M8 45 Q32 35 72 51" stroke="#e06800" strokeWidth="1" opacity="0.3" strokeDasharray="2 3" />
      {/* Navel */}
      <circle cx="40" cy="76" r="5" fill="#e06800" opacity="0.5" />
      <circle cx="40" cy="76" r="2.5" fill="#c05000" opacity="0.5" />
      {/* Shine */}
      <ellipse cx="28" cy="30" rx="9" ry="6" fill="white" opacity="0.2" transform="rotate(-30 28 30)" />
    </svg>
  );
}

export function Blueberries({ className }) {
  return (
    <svg className={className} viewBox="0 0 80 75" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg1" cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#8b7fc7" />
          <stop offset="100%" stopColor="#3d2d8a" />
        </radialGradient>
        <radialGradient id="bg2" cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#6d60b0" />
          <stop offset="100%" stopColor="#2e1f72" />
        </radialGradient>
      </defs>
      {/* Stems */}
      <path d="M25 30 Q20 18 28 12" stroke="#3a7a30" strokeWidth="1.5" fill="none" />
      <path d="M40 22 Q40 12 43 8" stroke="#3a7a30" strokeWidth="1.5" fill="none" />
      <path d="M55 30 Q58 18 52 12" stroke="#3a7a30" strokeWidth="1.5" fill="none" />
      {/* Berries */}
      <circle cx="20" cy="50" r="16" fill="url(#bg1)" />
      <circle cx="46" cy="44" r="18" fill="url(#bg2)" />
      <circle cx="62" cy="52" r="14" fill="url(#bg1)" />
      {/* Crown details */}
      <path d="M13 42 Q20 38 27 42" stroke="#5a4aaa" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M38 36 Q46 31 54 36" stroke="#4a3a9a" strokeWidth="1.5" fill="none" opacity="0.6" />
      <path d="M56 44 Q62 40 68 44" stroke="#5a4aaa" strokeWidth="1.5" fill="none" opacity="0.6" />
      {/* Shines */}
      <ellipse cx="15" cy="44" rx="4" ry="3" fill="white" opacity="0.2" transform="rotate(-20 15 44)" />
      <ellipse cx="41" cy="37" rx="5" ry="3" fill="white" opacity="0.2" transform="rotate(-20 41 37)" />
    </svg>
  );
}

export function Lemon({ className }) {
  return (
    <svg className={className} viewBox="0 0 85 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="lg1" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fff176" />
          <stop offset="100%" stopColor="#c8a800" />
        </radialGradient>
      </defs>
      {/* Leaf */}
      <ellipse cx="62" cy="15" rx="14" ry="7" fill="#3aad5e" transform="rotate(25 62 15)" />
      <path d="M55 20 Q62 12 70 10" stroke="#2d8a4a" strokeWidth="1" fill="none" />
      {/* Body */}
      <ellipse cx="40" cy="38" rx="33" ry="25" fill="url(#lg1)" />
      {/* Tips */}
      <ellipse cx="8" cy="38" rx="6" ry="4" fill="#e0c000" />
      <ellipse cx="72" cy="38" rx="6" ry="4" fill="#e0c000" />
      {/* Texture dots */}
      <circle cx="28" cy="30" r="1.5" fill="#c8a800" opacity="0.4" />
      <circle cx="42" cy="26" r="1.5" fill="#c8a800" opacity="0.4" />
      <circle cx="54" cy="32" r="1.5" fill="#c8a800" opacity="0.4" />
      <circle cx="35" cy="44" r="1.5" fill="#c8a800" opacity="0.4" />
      <circle cx="50" cy="46" r="1.5" fill="#c8a800" opacity="0.4" />
      {/* Shine */}
      <ellipse cx="24" cy="28" rx="8" ry="5" fill="white" opacity="0.3" transform="rotate(-25 24 28)" />
    </svg>
  );
}

export function Kiwi({ className }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="kout" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b6a3e" />
          <stop offset="100%" stopColor="#4a3018" />
        </radialGradient>
        <radialGradient id="kin" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e8f5a0" />
          <stop offset="40%" stopColor="#a0c840" />
          <stop offset="100%" stopColor="#5a8c1e" />
        </radialGradient>
      </defs>
      {/* Outer skin */}
      <ellipse cx="40" cy="40" rx="36" ry="36" fill="url(#kout)" />
      {/* Fuzzy texture */}
      <ellipse cx="40" cy="40" rx="34" ry="34" fill="none" stroke="#6b4e28" strokeWidth="2" strokeDasharray="1 3" opacity="0.5" />
      {/* Inner flesh */}
      <ellipse cx="40" cy="40" rx="28" ry="28" fill="url(#kin)" />
      {/* Center core */}
      <ellipse cx="40" cy="40" rx="6" ry="6" fill="#f5f0c0" />
      {/* Seeds & segments */}
      {[0,40,80,120,160,200,240,280,320].map((angle, i) => (
        <g key={i} transform={`rotate(${angle} 40 40)`}>
          <line x1="40" y1="14" x2="40" y2="34" stroke="#3a6a10" strokeWidth="0.8" opacity="0.6" />
          <ellipse cx="40" cy="13" rx="2.5" ry="3.5" fill="#1a2a08" opacity="0.8" />
        </g>
      ))}
      {/* Shine */}
      <ellipse cx="28" cy="26" rx="7" ry="5" fill="white" opacity="0.2" transform="rotate(-30 28 26)" />
    </svg>
  );
}

export function Grapes({ className }) {
  return (
    <svg className={className} viewBox="0 0 75 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="gr1" cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#b06ec0" />
          <stop offset="100%" stopColor="#5a1a7a" />
        </radialGradient>
      </defs>
      {/* Stem */}
      <path d="M37 5 Q37 16 37 20" stroke="#5a3e18" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Leaf */}
      <path d="M37 8 Q50 2 55 12 Q48 20 37 15 Q26 20 19 12 Q24 2 37 8Z" fill="#3aad5e" />
      <path d="M37 8 L37 15" stroke="#2d8a4a" strokeWidth="1" />
      {/* Grapes cluster */}
      <circle cx="37" cy="35" r="11" fill="url(#gr1)" />
      <circle cx="22" cy="47" r="11" fill="url(#gr1)" />
      <circle cx="52" cy="47" r="11" fill="url(#gr1)" />
      <circle cx="37" cy="59" r="11" fill="url(#gr1)" />
      <circle cx="22" cy="70" r="11" fill="url(#gr1)" />
      <circle cx="52" cy="70" r="11" fill="url(#gr1)" />
      <circle cx="37" cy="81" r="9" fill="url(#gr1)" />
      {/* Shines */}
      <ellipse cx="31" cy="29" rx="4" ry="3" fill="white" opacity="0.25" transform="rotate(-20 31 29)" />
      <ellipse cx="17" cy="41" rx="4" ry="3" fill="white" opacity="0.25" transform="rotate(-20 17 41)" />
      <ellipse cx="46" cy="41" rx="4" ry="3" fill="white" opacity="0.25" transform="rotate(-20 46 41)" />
    </svg>
  );
}

export function Broccoli({ className }) {
  return (
    <svg className={className} viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="br1" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#5ecf6a" />
          <stop offset="100%" stopColor="#1e7a2c" />
        </radialGradient>
      </defs>
      {/* Stem */}
      <rect x="30" y="60" width="20" height="28" rx="8" fill="#4a8c38" />
      <rect x="34" y="56" width="12" height="16" rx="5" fill="#5a9e45" />
      {/* Florets */}
      <circle cx="40" cy="40" r="20" fill="url(#br1)" />
      <circle cx="22" cy="48" r="15" fill="url(#br1)" />
      <circle cx="58" cy="48" r="15" fill="url(#br1)" />
      <circle cx="28" cy="28" r="14" fill="url(#br1)" />
      <circle cx="52" cy="28" r="14" fill="url(#br1)" />
      {/* Top bump details */}
      <circle cx="40" cy="22" r="8" fill="#4ec05a" />
      <circle cx="22" cy="35" r="7" fill="#4ec05a" />
      <circle cx="58" cy="35" r="7" fill="#4ec05a" />
      {/* Shine */}
      <ellipse cx="28" cy="24" rx="5" ry="4" fill="white" opacity="0.2" transform="rotate(-20 28 24)" />
    </svg>
  );
}
