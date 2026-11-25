import { pick, chance } from '../engine/rng.js';
import { ORIGINES } from './identity.js';

export const SKINS = ['#f4d6c2', '#eabf9f', '#d9a782', '#c78e64', '#ab734a', '#8c5836', '#6c4228', '#4a2c1b'];
export const HAIR_COLORS = [
  ['#0e0907', 'Noir'], ['#2b1b11', 'Brun'], ['#5b3a22', 'Châtain'], ['#8c5c33', 'Châtain clair'], ['#c49a62', 'Blond foncé'],
  ['#e3c88a', 'Blond'], ['#a8461f', 'Roux'], ['#b9b9c2', 'Gris'], ['#6d4bd1', 'Violet'], ['#d8467a', 'Rose'],
];
export const EYES = [['#3b2414', 'Marron'], ['#6b4a22', 'Noisette'], ['#2f6b3f', 'Vert'], ['#2f5f9e', 'Bleu'], ['#5f6b75', 'Gris'], ['#140d09', 'Noir']];
export const HAIRSTYLES = [
  ['court', 'Court'], ['fade', 'Dégradé'], ['boucles', 'Bouclé'], ['afro', 'Afro'], ['long', 'Long'], ['queue', 'Queue-de-cheval'],
  ['tresses', 'Tresses'], ['chignon', 'Chignon'], ['rase', 'Rasé'], ['chauve', 'Chauve'], ['foulard', 'Foulard'],
];
export const BEARDS = [['none', 'Aucune'], ['trois', '3 jours'], ['barbe', 'Barbe'], ['moustache', 'Moustache'], ['bouc', 'Bouc']];
export const BUILDS = [['mince', 'Mince', 0.9], ['normal', 'Normal', 1], ['costaud', 'Costaud', 1.14]];
export const STYLES = [['street', 'Street'], ['casual', 'Casual'], ['chic', 'Chic'], ['sport', 'Sport']];
export const ACCS = [['lunettes', 'Lunettes'], ['chaine', 'Chaîne'], ['boucles', "Boucles d'oreilles"], ['casquette', 'Casquette']];
export const FOULARDS = ['#4b3a78', '#1f2a44', '#7a2f45', '#2f5a4f', '#c9b9a6'];

// Tenues : type de haut, couleurs, bas. Choisies selon le style, le métier ou la situation.
export const OUTFITS = {
  street: { type: 'hoodie', top: '#43434f', bas: 'jogging', basC: '#272a36', shoes: '#f2f2f5', accent: '#ff4f7b' },
  casual: { type: 'tshirt', top: '#3e6fc4', bas: 'jean', basC: '#34497d', shoes: '#ececf2' },
  chic: { type: 'blazer', top: '#283049', shirt: '#f3f3f7', tie: '#8e1d3a', bas: 'costume', basC: '#1f2538', shoes: '#16161a' },
  sport: { type: 'tshirt', top: '#e8e8ee', bas: 'jogging', basC: '#1f2230', shoes: '#ff4f7b', accent: '#1f2230' },
  luxe: { type: 'blazer', top: '#ece5d8', shirt: '#151515', tie: null, bas: 'costume', basC: '#ece5d8', shoes: '#7a4e25', gold: true },
  rap: { type: 'hoodie', top: '#141419', bas: 'jogging', basC: '#121216', shoes: '#f4f4f4', accent: '#ffd36e', chain: true },
  police: { type: 'uniforme', top: '#1d2947', shirt: '#9fb8d8', tie: '#111827', bas: 'costume', basC: '#18213b', shoes: '#0d0d10', cap: '#1d2947' },
  militaire: { type: 'uniforme', top: '#56603f', shirt: '#56603f', tie: null, bas: 'costume', basC: '#4a5236', shoes: '#2a2418', beret: '#2c6b3f' },
  prison: { type: 'tshirt', top: '#ef7a2f', bas: 'jogging', basC: '#e06d24', shoes: '#d8d8d8' },
  ouvrier: { type: 'gilet', top: '#5b6b7a', vest: '#ffd21f', bas: 'jean', basC: '#465679', shoes: '#6b4a2a' },
  medical: { type: 'blouse', top: '#f3f6fb', bas: 'costume', basC: '#7fb3c6', shoes: '#f3f3f3' },
  sdf: { type: 'manteau', top: '#5f4b3d', bas: 'jean', basC: '#45454d', shoes: '#3a3028' },
  foot: { type: 'jersey', top: '#d7263d', num: '10', numC: '#ffffff', bas: 'short', basC: '#ffffff', shoes: '#1d1d1d' },
  basket: { type: 'tank', top: '#1f4fd1', num: '23', numC: '#ffffff', bas: 'short', basC: '#1f4fd1', shoes: '#f2f2f2' },
  boxe: { type: 'tank', top: '#b3132f', bas: 'short', basC: '#b3132f', shoes: '#111111' },
  plage: { type: 'tshirt', top: '#ff9f5a', bas: 'short', basC: '#2a7fd0', shoes: '#f2f2f2' },
  garde: { type: 'blazer', top: '#111216', shirt: '#f2f2f2', tie: '#111216', bas: 'costume', basC: '#111216', shoes: '#0a0a0a' },
  bebe: { type: 'tshirt', top: '#8fc7ff', bas: 'jean', basC: '#6d87c9', shoes: '#ffffff' },
};

// Base neutre : on part de zéro, seul le genre change la coiffure de départ
export const baseHair = (genre) => (genre === 'f' ? 'long' : 'court');
export function baseLook(genre) {
  return { peau: SKINS[2], coiffure: baseHair(genre), cheveuxC: '#2b1b11', foulardC: FOULARDS[0], yeux: '#3b2414', barbe: 'none', corpulence: 'normal', style: 'casual', acc: [] };
}

const FEMALE_HAIR = ['long', 'queue', 'tresses', 'chignon', 'boucles', 'afro', 'court', 'foulard'];
const MALE_HAIR = ['court', 'fade', 'boucles', 'afro', 'rase', 'tresses', 'court', 'fade'];

export function randomLook(genre, origine) {
  const o = ORIGINES[origine] || ORIGINES.france;
  const peau = SKINS[pick(o.peaux)];
  const dark = SKINS.indexOf(peau) >= 4;
  const pool = genre === 'f' ? FEMALE_HAIR : MALE_HAIR;
  let coiffure = pick(pool);
  if (coiffure === 'foulard' && !['maghreb', 'afrique_ouest', 'turquie'].includes(origine)) coiffure = 'long';
  if (coiffure === 'afro' && !dark) coiffure = 'boucles';
  const natural = dark ? ['#0e0907', '#2b1b11'] : ['#0e0907', '#2b1b11', '#5b3a22', '#8c5c33', '#c49a62', '#e3c88a', '#a8461f'];
  return {
    peau,
    coiffure,
    cheveuxC: chance(0.06) ? pick(['#6d4bd1', '#d8467a']) : pick(natural),
    foulardC: pick(FOULARDS),
    yeux: pick(dark ? ['#3b2414', '#140d09', '#6b4a22'] : EYES.map((e) => e[0])),
    barbe: genre === 'f' ? 'none' : pick(['none', 'trois', 'trois', 'barbe', 'moustache', 'bouc']),
    corpulence: pick(['mince', 'normal', 'normal', 'costaud']),
    style: pick(STYLES)[0],
    acc: ACCS.filter(() => chance(0.18)).map((a) => a[0]).filter((a) => !(genre === 'h' && a === 'boucles' && chance(0.5))),
  };
}

// Mélange l'apparence de deux parents pour un enfant.
export function childLook(a, b, genre) {
  const mix = (x, y) => {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const [r1, g1, b1] = p(x);
    const [r2, g2, b2] = p(y);
    const k = Math.random() * 0.6 + 0.2;
    return '#' + [r1 + (r2 - r1) * k, g1 + (g2 - g1) * k, b1 + (b2 - b1) * k].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  };
  const src = b || a;
  return {
    ...randomLook(genre, 'france'),
    peau: mix(a.peau, src.peau),
    cheveuxC: chance(0.5) ? a.cheveuxC : src.cheveuxC,
    yeux: chance(0.5) ? a.yeux : src.yeux,
    coiffure: genre === 'f' ? pick(['long', 'queue', 'boucles', 'chignon']) : pick(['court', 'fade', 'boucles']),
  };
}
