import { rand } from './hitman.js';
// Petits utilitaires d'aléatoire et de formatage, sans dépendance au DOM.
export const rnd = (a, b) => Math.floor(rand() * (b - a + 1)) + a;
export const pick = (arr) => arr[Math.floor(rand() * arr.length)];
export const chance = (p) => rand() < p;
export const clamp = (v, a = 0, b = 100) => (Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : a);

export function weighted(items, getW) {
  let tot = 0;
  const ws = items.map((i) => {
    const w = Math.max(0, getW(i) || 0);
    tot += w;
    return w;
  });
  if (!tot) return null;
  let r = rand() * tot;
  for (let i = 0; i < items.length; i++) {
    r -= ws[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

const NF = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
export const euros = (n) => `${n < 0 ? '−' : ''}${NF.format(Math.abs(Math.round(n)))} €`;
