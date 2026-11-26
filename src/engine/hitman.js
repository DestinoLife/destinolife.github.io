// Hitman : l'anti-triche de Destino.
// Ce module est importé en premier : il capture les fonctions natives (Math.random, JSON) avant que
// quiconque puisse les remplacer depuis la console, signe les sauvegardes et scelle l'état du jeu entre deux actions.
// Limite assumée : un jeu 100 % navigateur ne peut pas être inviolable (le code et la clé sont livrés au joueur).
// Hitman décourage et détecte la triche ordinaire ; seule une validation serveur la rendra impossible (voir SECURITY_AUDIT.md).

const NATIVE_RANDOM = Math.random;
const NATIVE_STRINGIFY = JSON.stringify;
const NATIVE_PARSE = JSON.parse;
const isNative = (fn) => typeof fn === 'function' && /\[native code\]\s*\}$/.test(Function.prototype.toString.call(fn));

/** Aléatoire natif capturé au chargement : remplacer Math.random dans la console ne change rien au jeu. */
export const rand = () => NATIVE_RANDOM.call(Math);
export const stringify = (v) => NATIVE_STRINGIFY(v);
export const parse = (t) => NATIVE_PARSE(t);

// cyrb53 : hachage 53 bits rapide (≈ 1 ms pour 100 Ko). Pas cryptographique : il détecte les retouches, il ne les empêche pas.
function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
const SEL = [0x44, 0x65, 0x73, 0x74, 0x69, 0x6e, 0x6f, 0x2d, 0x48, 0x69, 0x74, 0x6d, 0x61, 0x6e].map((c) => String.fromCharCode(c)).join('');
export const sign = (json) => cyrb53(json, 0x1d7) + '.' + cyrb53(SEL + json.length + json, 0x2f3);

// ---------- Sceau de l'état en mémoire ----------
// Après chaque action légitime, on mémorise l'empreinte de l'état. Avant l'action suivante, l'état doit être identique :
// sinon, quelqu'un l'a modifié de l'extérieur (console, point d'arrêt, extension).
let sealRef = null, sealH = null;
export function seal(s, json) {
  sealRef = s || null;
  sealH = s ? cyrb53(json || NATIVE_STRINGIFY(s), 7) : null;
}
export const unseal = () => seal(null);

// ---------- Contrôles ----------
// Seuils volontairement larges : un joueur honnête ne doit jamais être condamné (faux positif = pire bug possible).
export const LIMITES = {
  argentMax: 5e9, // 5 milliards : hors de portée d'une vie légitime (voir SECURITY_AUDIT.md, simulations)
  argentMin: -1e8,
};

const finite = (n) => typeof n === 'number' && Number.isFinite(n);
/** Anomalies de l'état lui-même (sommes astronomiques, NaN, types invalides). Renvoie une raison ou null. */
export function anomalie(s) {
  if (!s || typeof s !== 'object') return null;
  if (!finite(s.money)) return 'Solde bancaire invalide (NaN ou infini)';
  if (s.money > LIMITES.argentMax) return `Somme astronomique : ${Math.round(s.money).toLocaleString('fr-FR')} €`;
  if (s.money < LIMITES.argentMin) return 'Dette impossible';
  if (s.sale != null && (!finite(s.sale) || s.sale > LIMITES.argentMax)) return 'Argent sale invalide';
  if (!finite(s.age) || s.age < 0 || s.age > 130) return 'Âge impossible';
  for (const [k, v] of Object.entries(s.stats || {})) if (!finite(v) || v < -1 || v > 101) return `Statistique « ${k} » impossible`;
  return null;
}

/** Vérifie l'environnement (fonctions natives) et le sceau. Renvoie une raison ou null. */
export function verifier(s) {
  // On remet les fonctions natives en place : la triche ne marche pas, et Hitman ne condamne qu'une fois
  if (Math.random !== NATIVE_RANDOM || !isNative(Math.random)) {
    Math.random = NATIVE_RANDOM;
    return 'Générateur aléatoire remplacé';
  }
  if (JSON.stringify !== NATIVE_STRINGIFY || JSON.parse !== NATIVE_PARSE) {
    JSON.stringify = NATIVE_STRINGIFY;
    JSON.parse = NATIVE_PARSE;
    return 'Fonctions du navigateur détournées';
  }
  if (s && s === sealRef && sealH && cyrb53(NATIVE_STRINGIFY(s), 7) !== sealH) return 'État du jeu modifié hors du jeu (injection)';
  return anomalie(s);
}
