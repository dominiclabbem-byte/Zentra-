export function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export const ui = {
  page: 'min-h-screen bg-brand-canvas bg-grid',
  pagePadded: 'min-h-screen bg-brand-canvas bg-grid px-4 py-10',
  content: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  card: 'bg-white rounded-2xl border border-gray-100 shadow-sm',
  cardInteractive: 'bg-white rounded-2xl border border-gray-100 card-premium text-left hover:border-brand-accent/40 hover:shadow-md transition-all',
  panel: 'rounded-2xl bg-brand-canvas',
  panelSoft: 'rounded-2xl bg-brand-panel border border-brand-panelBorder',
  title: 'font-extrabold text-brand-ink',
  sectionTitle: 'text-xl font-extrabold text-brand-ink',
  subtitle: 'text-sm text-gray-500',
  eyebrow: 'text-xs font-semibold uppercase tracking-[0.35em] text-brand-accent',
  iconTile: 'bg-gradient-to-br from-brand-ink to-brand-inkLight rounded-xl flex items-center justify-center text-brand-accent',
  input: 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all',
  select: 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-accent bg-white transition-all',
  textarea: 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 resize-none transition-all',
  primaryButton: 'bg-gradient-to-r from-brand-ink to-brand-inkLight text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed',
  secondaryButton: 'border border-brand-accent/30 text-brand-accent font-semibold rounded-xl hover:bg-brand-accent/5 transition-all',
  chip: 'text-[10px] font-semibold bg-brand-panel text-brand-ink border border-brand-panelBorder px-2 py-0.5 rounded-full',
};
