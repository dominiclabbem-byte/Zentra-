export function Strawberry({ className }) {
  return (
    <svg className={className} viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sg1" cx="40%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ff6b8a" />
          <stop offset="100%" stopColor="#d41b3c" />
        </radialGradient>
      </defs>
      <ellipse cx="30" cy="14" rx="10" ry="6" fill="#2d9e4f" transform="rotate(-25 30 14)" />
      <ellipse cx="50" cy="14" rx="10" ry="6" fill="#27894a" transform="rotate(25 50 14)" />
      <ellipse cx="40" cy="10" rx="8" ry="12" fill="#33b55c" />
      <path d="M18 28 Q15 55 40 80 Q65 55 62 28 Q50 15 40 18 Q30 15 18 28Z" fill="url(#sg1)" />
      <ellipse cx="33" cy="40" rx="2" ry="2.5" fill="#ffecef" opacity="0.9" transform="rotate(-10 33 40)" />
      <ellipse cx="47" cy="38" rx="2" ry="2.5" fill="#ffecef" opacity="0.9" transform="rotate(10 47 38)" />
      <ellipse cx="37" cy="52" rx="2" ry="2.5" fill="#ffecef" opacity="0.9" />
      <ellipse cx="50" cy="52" rx="2" ry="2.5" fill="#ffecef" opacity="0.9" transform="rotate(5 50 52)" />
      <ellipse cx="30" cy="55" rx="2" ry="2.5" fill="#ffecef" opacity="0.9" transform="rotate(-5 30 55)" />
      <ellipse cx="42" cy="65" rx="2" ry="2.5" fill="#ffecef" opacity="0.9" />
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
      <path d="M35 5 Q15 25 12 55 Q12 80 35 85 Q58 80 58 55 Q55 25 35 5Z" fill="url(#ag1)" />
      <path d="M35 18 Q20 35 18 57 Q18 76 35 80 Q52 76 52 57 Q50 35 35 18Z" fill="url(#ag2)" />
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
      <rect x="37" y="4" width="4" height="8" rx="2" fill="#5a3e28" />
      <ellipse cx="50" cy="10" rx="10" ry="6" fill="#3aad5e" transform="rotate(-20 50 10)" />
      <circle cx="40" cy="48" r="33" fill="url(#og1)" />
      <path d="M40 16 Q55 32 40 80" stroke="#e06800" strokeWidth="1" opacity="0.4" strokeDasharray="2 3" />
      <path d="M40 16 Q25 32 40 80" stroke="#e06800" strokeWidth="1" opacity="0.4" strokeDasharray="2 3" />
      <path d="M8 45 Q32 35 72 51" stroke="#e06800" strokeWidth="1" opacity="0.3" strokeDasharray="2 3" />
      <circle cx="40" cy="76" r="5" fill="#e06800" opacity="0.5" />
      <circle cx="40" cy="76" r="2.5" fill="#c05000" opacity="0.5" />
      <ellipse cx="28" cy="30" rx="9" ry="6" fill="white" opacity="0.2" transform="rotate(-30 28 30)" />
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
      <path d="M37 5 Q37 16 37 20" stroke="#5a3e18" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M37 8 Q50 2 55 12 Q48 20 37 15 Q26 20 19 12 Q24 2 37 8Z" fill="#3aad5e" />
      <path d="M37 8 L37 15" stroke="#2d8a4a" strokeWidth="1" />
      <circle cx="37" cy="35" r="11" fill="url(#gr1)" />
      <circle cx="22" cy="47" r="11" fill="url(#gr1)" />
      <circle cx="52" cy="47" r="11" fill="url(#gr1)" />
      <circle cx="37" cy="59" r="11" fill="url(#gr1)" />
      <circle cx="22" cy="70" r="11" fill="url(#gr1)" />
      <circle cx="52" cy="70" r="11" fill="url(#gr1)" />
      <circle cx="37" cy="81" r="9" fill="url(#gr1)" />
      <ellipse cx="31" cy="29" rx="4" ry="3" fill="white" opacity="0.25" transform="rotate(-20 31 29)" />
      <ellipse cx="17" cy="41" rx="4" ry="3" fill="white" opacity="0.25" transform="rotate(-20 17 41)" />
      <ellipse cx="46" cy="41" rx="4" ry="3" fill="white" opacity="0.25" transform="rotate(-20 46 41)" />
    </svg>
  );
}
