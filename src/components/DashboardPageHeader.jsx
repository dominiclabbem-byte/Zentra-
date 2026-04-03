export default function DashboardPageHeader({
  eyebrow,
  title,
  subtitle,
  badges = [],
  action,
  tabs = [],
  accentBlobClass = 'bg-indigo-500/5',
}) {
  return (
    <div className="relative bg-[#0a1628] text-white py-8 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className={`absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[80px] ${accentBlobClass}`} />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#2ECAD5]">{eyebrow}</span>
              {badges.map((badge) => (
                <span
                  key={`${badge.label}-${badge.tone ?? 'default'}`}
                  className={badge.className ?? 'text-[10px] font-bold bg-gradient-to-r from-emerald-400 to-blue-500 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wide'}
                >
                  {badge.label}
                </span>
              ))}
            </div>
            <h1 className="text-2xl font-extrabold">{title}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>
          </div>

          {action ? (
            <button
              onClick={action.onClick}
              className={action.className ?? 'flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-blue-500 text-[#0D1F3C] font-bold px-6 py-3 rounded-xl transition-all whitespace-nowrap hover:scale-[1.02]'}
            >
              {action.icon}
              {action.label}
            </button>
          ) : null}
        </div>

        <div className="flex gap-1 mt-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={tab.onClick}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                tab.active
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge ? (
                <span className={tab.badgeClassName ?? 'text-[10px] font-bold bg-white/10 text-[#2ECAD5] px-2 py-0.5 rounded-full'}>
                  {tab.badge}
                </span>
              ) : null}
              {tab.dot ? (
                <span className={tab.dotClassName ?? 'w-2 h-2 bg-emerald-400 rounded-full animate-pulse'} />
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
