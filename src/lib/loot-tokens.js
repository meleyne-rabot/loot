// loot-tokens.js — Design tokens de la refonte Loot (source de vérité : README + Loot Système.dc.html)
export const C = {
  canvas: '#F6F2EC', surface: '#FFFFFF', ink: '#1C1B3A',
  muted1: '#6B6980', muted2: '#8A879B', muted3: '#9C99AB', muted4: '#B7AE9E',
  border: '#E3DCD0', divider: '#F0EBE3',
  coral: '#F03C64', coralPressed: '#C22A50', coralTint: '#FFF0F2', coralBorder: '#F0B6C4',
  green: '#2FA96A', greenDark: '#1E8A57', greenTint: '#DDF1E6', greenSoft: '#EDF7F1', greenSoftBorder: '#C9E9D6',
  amber: '#E0912F', amberText: '#B0651B', amberTint: '#FBEAD1', amberSoft: '#FBEFE0',
  violet: '#A56BE0', violetText: '#8B4FC9', violetTint: '#F0E7FA',
  vinted: '#0B7A73', vintedTint: '#DEF3F1', vintedBorder: '#9FD9D3',
  photoStripe: 'repeating-linear-gradient(135deg,#F1ECE4,#F1ECE4 6px,#E9E1D5 6px,#E9E1D5 12px)',
};
export const F = {
  title: "'Bricolage Grotesque', system-ui, sans-serif",
  body: "'Hanken Grotesk', system-ui, sans-serif",
};
export const SHADOW = {
  card: '0 2px 10px rgba(28,27,58,.05)',
  cardHi: '0 4px 14px rgba(28,27,58,.08)',
  coral: '0 8px 20px rgba(240,60,100,.28)',
  fab: '0 10px 24px rgba(240,60,100,.44)',
  fabNavy: '0 10px 24px rgba(28,27,58,.4)',
  nav: '0 8px 26px rgba(28,27,58,.13)',
};
// Label de section réutilisable
export const sectionLabel = {
  font: `700 11px ${F.body}`, letterSpacing: '.06em', color: C.muted2,
  textTransform: 'uppercase', margin: '0 0 8px',
};
