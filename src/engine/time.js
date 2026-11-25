import { rnd, pick, weighted } from './rng.js';
import { COTIERES } from '../data/identity.js';

// Le temps est stocké en millisecondes UTC (s.t). Une année passe d'anniversaire en anniversaire,
// mais une grosse décision peut ne faire avancer que de quelques jours (temps adaptatif).
export const HOUR = 3600000;
export const DAY = 24 * HOUR;

export function birthdayAt(birthT, age) {
  const b = new Date(birthT);
  return Date.UTC(b.getUTCFullYear() + age, b.getUTCMonth(), Math.min(b.getUTCDate(), 28), 0, 0);
}

export function setHour(t, h, m = rnd(0, 59)) {
  const d = new Date(t);
  d.setUTCHours(h % 24, m, 0, 0);
  return d.getTime();
}

const F_DATE = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const fmtDate = (t) => {
  const s = F_DATE.format(t);
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const fmtHeure = (t) => {
  const d = new Date(t);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};
export const hourOf = (t) => new Date(t).getUTCHours();
export const isWeekday = (t) => {
  const d = new Date(t).getUTCDay();
  return d >= 1 && d <= 5;
};

export function tod(t) {
  const h = hourOf(t);
  if (h < 6 || h >= 22) return 'nuit';
  if (h < 9) return 'aube';
  if (h < 18) return 'jour';
  return 'soir';
}

export function saison(t) {
  const m = new Date(t).getUTCMonth();
  if (m === 11 || m <= 1) return 'Hiver';
  if (m <= 4) return 'Printemps';
  if (m <= 7) return 'Été';
  return 'Automne';
}

const CLIMAT = {
  Hiver: { t: [1, 11], w: { soleil: 3, nuages: 4, pluie: 4 } },
  Printemps: { t: [10, 21], w: { soleil: 5, nuages: 3, pluie: 2 } },
  Été: { t: [21, 33], w: { soleil: 8, nuages: 2, pluie: 1 } },
  Automne: { t: [9, 19], w: { soleil: 3, nuages: 4, pluie: 4 } },
};

export function rollMeteo(t, ville) {
  const c = CLIMAT[saison(t)];
  const type = weighted(Object.keys(c.w), (k) => c.w[k]);
  let temp = rnd(...c.t);
  if (COTIERES.includes(ville)) temp += 3;
  if (['Lille', 'Strasbourg'].includes(ville)) temp -= 3;
  if (!COTIERES.includes(ville) && !['Paris', 'Lyon', 'Lille', 'Toulouse', 'Bordeaux', 'Nantes', 'Strasbourg'].includes(ville)) temp += 6; // au pays
  if (type === 'pluie') temp -= 2;
  return { type, temp };
}

export const pickHour = (range) => (range ? rnd(range[0], range[1]) : pick([8, 9, 11, 13, 15, 17, 19, 20, 21]));
