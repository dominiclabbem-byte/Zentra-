export default function BodegaLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Crate body */}
      <rect x="4" y="14" width="24" height="14" rx="3" fill="#0D1F3C"/>
      {/* Crate lid */}
      <rect x="3" y="11.5" width="26" height="4" rx="2" fill="#2ECAD5"/>
      {/* Orange fruit */}
      <circle cx="16" cy="8" r="5.5" fill="#f97316"/>
      {/* Fruit highlight */}
      <circle cx="13.5" cy="6" r="2" fill="#fb923c" opacity="0.5"/>
      {/* Leaf */}
      <path d="M16.5 2.5c2-0.5 4 0.5 4 2s-2 2.5-3.5 2c-0.5-0.2-0.5-0.8-0.5-1.2V2.5z" fill="#22c55e"/>
      {/* Crate divider */}
      <line x1="6" y1="21.5" x2="26" y2="21.5" stroke="#2ECAD5" strokeWidth="0.7" opacity="0.25"/>
      {/* Digital indicator dots */}
      <circle cx="11" cy="24.5" r="1" fill="#2ECAD5" opacity="0.5"/>
      <circle cx="16" cy="24.5" r="1.2" fill="#2ECAD5" opacity="0.9"/>
      <circle cx="21" cy="24.5" r="1" fill="#2ECAD5" opacity="0.5"/>
    </svg>
  );
}
