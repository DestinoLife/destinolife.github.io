// Hitman 2.0 : l'anti-triche de Destino.
// Importé avant tout le reste : il capture les fonctions natives avant que quiconque puisse les remplacer.
//
// Couches indépendantes (une seule suffit à attraper la triche ordinaire) :
//  1. Coffre-fort : l'état du jeu n'est accessible qu'à travers un Proxy. Chaque écriture est vérifiée :
//     elle doit venir du code du jeu (pile d'appels), jamais de la console, d'un point d'arrêt ou d'un script injecté.
//     Une écriture illégitime n'est PAS appliquée.
//  2. Journal financier : chaque variation d'argent est rattachée à l'action du joueur qui l'a causée,
//     et le solde réel doit égaler le solde attendu (solde précédent + variations journalisées).
//  3. Contrôles avant/après chaque action : une action d'interface (ouvrir un onglet…) ne doit rien changer d'important,
//     un achat ne doit jamais enrichir, etc.
//  4. Empreinte et valeurs témoins : entre deux actions, l'état brut doit être identique à l'état validé.
//  5. Fonctions natives intactes (Math.random, JSON, Error…).
// En cas d'anomalie : restauration du dernier état valide, puis sanction (prison à perpétuité).
//
// Limite assumée : un jeu 100 % navigateur ne peut pas être inviolable. Hitman maximise le coût de la triche ;
// seule une validation serveur la rendra impossible (voir SECURITY_AUDIT.md).

// ---------- Fonctions natives capturées au chargement ----------
const NRandom = Math.random;
const NStringify = JSON.stringify;
const NParse = JSON.parse;
const NError = Error;
const STL = Error.stackTraceLimit;
const PST = Error.prepareStackTrace;
const NProxy = Proxy;
const NWeakMap = WeakMap;
const wmGet = WeakMap.prototype.get, wmSet = WeakMap.prototype.set, wmHas = WeakMap.prototype.has;
const NKeys = Object.keys;
const NIsArray = Array.isArray;
const NFinite = Number.isFinite;
const NObjectIs = Object.is;
const RGet = Reflect.get, RSet = Reflect.set, RDel = Reflect.deleteProperty, RDef = Reflect.defineProperty;
const sSplit = String.prototype.split, sIndexOf = String.prototype.indexOf, sSlice = String.prototype.slice;
const reTest = RegExp.prototype.test;
const fnToString = Function.prototype.toString;
const NMicro = typeof queueMicrotask === 'function' ? queueMicrotask : (f) => Promise.resolve().then(f);
const isNative = (fn) => typeof fn === 'function' && reTest.call(/\[native code\]\s*\}$/, fnToString.call(fn));
const has = (o, k) => wmHas.call(o, k);
const get = (o, k) => wmGet.call(o, k);
const put = (o, k, v) => wmSet.call(o, k, v);

/** Aléatoire natif capturé : remplacer Math.random dans la console ne change rien au jeu. */
export const rand = () => NRandom.call(Math);
export const parse = (t) => NParse(t);

// ---------- Empreintes ----------
// cyrb53 : hachage 53 bits rapide (≈ 1 ms pour 100 Ko). Il détecte les retouches ; l'obfuscation du build cache la recette.
// Méthodes sorties de la boucle : une fois obfusqué, chaque accès « .charCodeAt » passerait par le décodeur de chaînes.
const imul = Math.imul;
const charAt = String.prototype.charCodeAt;
function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  const n = str.length;
  for (let i = 0; i < n; i++) {
    const ch = charAt.call(str, i);
    h1 = imul(h1 ^ ch, 2654435761);
    h2 = imul(h2 ^ ch, 1597334677);
  }
  h1 = imul(h1 ^ (h1 >>> 16), 2246822507) ^ imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = imul(h2 ^ (h2 >>> 16), 2246822507) ^ imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
const SEL = [0x44, 0x65, 0x73, 0x74, 0x69, 0x6e, 0x6f, 0x2d, 0x48, 0x69, 0x74, 0x6d, 0x61, 0x6e].map((c) => String.fromCharCode(c)).join('');
export const sign = (json) => cyrb53(json, 0x1d7) + '.' + cyrb53(SEL + json.length + json, 0x2f3);
// Chaîne du journal financier : chaque ligne scelle la précédente (clé distincte de celle des sauvegardes)
const comptaKey = (c) => cyrb53('compta|' + c.h + '|' + c.solde + '|' + SEL, 0x77);
const chainH = (prev, e) => cyrb53(prev + '|' + e.a + '|' + e.age + '|' + e.m + '|' + e.b + '|' + e.s + '|' + e.solde, 0x5ab);

// ---------- Coffre-fort (Proxy) ----------
const RAW = new NWeakMap(); // proxy → objet brut
const PROX = new NWeakMap(); // objet brut → proxy
let root = null; // état brut de la vie protégée
let rootProxy = null;
let depth = 0; // actions en cours (permis d'écrire)
let action = null;
let dirty = false; // écriture légitime hors action depuis la dernière validation
let committedH = null, lastGood = null;
let watch = null; // valeurs témoins (copie hors de l'état)
let begin0 = null; // état au début de l'action
let pending = null; // variations d'argent de l'action en cours
let violation = null;
let onViolation = null;

const unwrap = (v) => (v && typeof v === 'object' && has(RAW, v) ? get(RAW, v) : v);
export const rawOf = unwrap;

/** Sérialise l'état brut (rapide : sans passer par le Proxy). */
export const stringify = (v) => NStringify(unwrap(v));

// Origine d'une écriture : toute la chaîne d'appels doit venir des scripts du jeu (même origine) ou du navigateur.
// Une frame de la console, d'un extrait DevTools, d'un eval ou d'une extension = écriture étrangère.
const ORIGIN = typeof location !== 'undefined' && /^https?:/.test(String(location.origin)) ? String(location.origin) : 'file://';
const NATIVE_FRAME = /\[native code\]|\(<anonymous>\)\s*$|\(native\)\s*$|\(?node:[a-z_]|^\s*at (?:async )?[\w$.<> ]+ \(<anonymous>\)$/;
const FOREIGN_FRAME = /<anonymous>:\d|eval at|debugger eval|VM\d+|snippet:|chrome-extension:|moz-extension:|safari-web-extension:|^\s*(?:global|eval) code/;
function stackLines() {
  const st = new NError().stack;
  if (typeof st !== 'string') return null;
  const raw = sSplit.call(st, '\n');
  const out = [];
  for (let i = 0; i < raw.length; i++) if (raw[i] && !(i === 0 && sIndexOf.call(raw[i], 'Error') === 0)) out[out.length] = raw[i];
  return out;
}
// Appelants de l'action en cours (écouteur de clic, clavier…) : ce qui est SOUS le point d'entrée n'est pas jugé
// (un clic déclenché par une extension d'accessibilité reste légitime) ; seul ce qui écrit pendant l'action l'est.
let tail = null;
function foreignWriter() {
  if (NError.stackTraceLimit !== STL || NError.prepareStackTrace !== PST) return true; // pile falsifiée
  const lines = stackLines();
  if (!lines) return false; // moteur sans pile : on ne peut pas juger, on ne condamne pas
  let n = lines.length;
  // On retire la partie de la pile qui correspond aux appelants du point d'entrée (éventuellement tronquée en bas :
  // les navigateurs ne gardent qu'une dizaine de frames).
  if (depth > 0 && tail && tail.length) {
    for (let i = 1; i < n; i++) {
      if (lines[i] !== tail[0]) continue;
      let same = true;
      for (let j = 1; i + j < n && j < tail.length && same; j++) same = lines[i + j] === tail[j];
      if (same) {
        n = i;
        break;
      }
    }
  }
  let frames = 0;
  for (let i = 0; i < n; i++) {
    const l = lines[i];
    frames++;
    if (reTest.call(FOREIGN_FRAME, l)) return true;
    if (reTest.call(NATIVE_FRAME, l)) continue;
    if (sIndexOf.call(l, ORIGIN) < 0) return true; // ni le jeu, ni le navigateur
  }
  return frames === 0; // pile vidée : suspect
}

function flag(raison) {
  if (violation) return;
  violation = raison;
  if (onViolation) NMicro(() => onViolation());
}

const SENSIBLES = ['money', 'sale', 'bourse'];
// Pendant une action, seules les écritures sur les données sensibles passent le contrôle de pile (coûteux) ;
// hors action, TOUTE écriture est contrôlée (c'est là qu'agit la console).
const LIBRES = new Set(['relations', 'phone', 'log', 'mem', 'seen', 'tmp', 'knownActs', 'wasLocked', 'plans', 'newTabs', 'lastMsg', 'avec', 'liens', 'npcQ']);
const TOP = new NWeakMap(); // objet brut → clé de premier niveau qui le contient
const topOf = (t, k) => (t === root ? k : get(TOP, t));
function guardWrite(t, k, why) {
  if (!root) return true;
  if (depth > 0 && LIBRES.has(topOf(t, k))) return true;
  if (foreignWriter()) {
    if (globalThis.__hmDebug) console.warn('[Hitman]', why, String(k), depth, new NError().stack);
    flag(why);
    return false;
  }
  if (depth === 0) dirty = true;
  return true;
}

const handler = {
  get(t, k, r) {
    const v = RGet(t, k, r);
    if (v && typeof v === 'object') {
      if (has(RAW, v)) return v;
      let p = get(PROX, v);
      if (!p) {
        p = new NProxy(v, handler);
        put(PROX, v, p);
        put(RAW, p, v);
      }
      if (!has(TOP, v)) put(TOP, v, t === root ? k : get(TOP, t));
      return p;
    }
    return v;
  },
  set(t, k, v, r) {
    if (!guardWrite(t, k, 'Modification directe de l’état du jeu (console ou point d’arrêt)')) return true; // écriture ignorée
    v = unwrap(v);
    if (t === root && pending && typeof k === 'string' && SENSIBLES.includes(k)) {
      const old = t[k] || 0;
      pending[k] = (pending[k] || 0) + ((NFinite(v) ? v : 0) - (NFinite(old) ? old : 0));
    }
    return RSet(t, k, v);
  },
  deleteProperty(t, k) {
    if (!guardWrite(t, k, 'Suppression illégitime dans l’état du jeu')) return true;
    return RDel(t, k);
  },
  defineProperty(t, k, d) {
    if (!guardWrite(t, k, 'Redéfinition illégitime de l’état du jeu')) return true;
    if (d && 'value' in d) d = { ...d, value: unwrap(d.value) };
    return RDef(t, k, d);
  },
  setPrototypeOf() {
    flag('Prototype de l’état modifié');
    return true;
  },
};

// Retire les Proxy éventuellement copiés dans un état brut (ex. héritage construit depuis la vie précédente)
function deepUnwrap(o, seen = new NWeakMap()) {
  if (!o || typeof o !== 'object' || has(seen, o)) return;
  put(seen, o, 1);
  for (const k of NKeys(o)) {
    const v = o[k];
    if (v && typeof v === 'object') {
      if (has(RAW, v)) o[k] = get(RAW, v);
      deepUnwrap(o[k], seen);
    }
  }
}

// Valeurs témoins : copie indépendante des champs sensibles, comparée à l'état brut entre deux actions
function fingerprint(s) {
  const w = { m: s.money, sa: s.sale, b: s.bourse, e: s.energie, a: s.age, p: s.justice?.prison, n: s.etudes?.niveau, c: s.carriere?.id };
  for (const k of NKeys(s.stats || {})) w['st.' + k] = s.stats[k];
  w.biens = (s.biens || []).length + ':' + (s.biens || []).reduce((t, b) => t + (b.valeur || 0), 0);
  w.biz = (s.business || []).length + ':' + (s.business || []).reduce((t, b) => t + (b.valo || 0), 0);
  return w;
}
const sameWatch = (a, b) => {
  const ka = NKeys(a);
  if (ka.length !== NKeys(b).length) return false;
  for (const k of ka) if (!NObjectIs(a[k], b[k])) return false;
  return true;
};

let onCommit = null;
/** Appelé après chaque validation de l'état (sauvegarde) : on ne sauvegarde jamais un état non vérifié. */
export const setCommitHandler = (fn) => (onCommit = fn);
function commit() {
  if (!root) return;
  if (root.compta && typeof root.compta === 'object') {
    root.compta.solde = root.money;
    root.compta.k = comptaKey(root.compta);
  }
  lastGood = NStringify(root);
  committedH = cyrb53(lastGood, 7);
  watch = fingerprint(root);
  dirty = false;
  if (onCommit) onCommit(rootProxy, lastGood);
}

/** Place une vie sous la protection de Hitman. Renvoie le Proxy à utiliser partout dans le jeu. */
export function protect(s) {
  s = unwrap(s);
  if (!s || typeof s !== 'object') return s;
  deepUnwrap(s);
  root = s;
  rootProxy = get(PROX, s) || new NProxy(s, handler);
  put(PROX, s, rootProxy);
  put(RAW, rootProxy, s);
  depth = 0;
  violation = null;
  pending = null;
  initCompta(s);
  commit();
  return rootProxy;
}
export function unprotect() {
  root = rootProxy = null;
  lastGood = committedH = watch = null;
  depth = 0;
  violation = null;
}
export const setViolationHandler = (fn) => (onViolation = fn);
/** Raison de la première violation détectée par le coffre-fort (et l'efface), sinon null. */
export function takeViolation() {
  const v = violation;
  violation = null;
  return v;
}

// ---------- Journal financier ----------
function initCompta(s) {
  if (!s.compta || typeof s.compta !== 'object' || !NIsArray(s.compta.j)) s.compta = { j: [], h: 'init', solde: s.money };
}
function journalise(a, d) {
  const c = root.compta;
  const e = { a, age: root.age, m: Math.round(d.money || 0), b: Math.round(d.bourse || 0), s: Math.round(d.sale || 0), solde: root.money };
  e.h = chainH(c.h, e);
  c.h = e.h;
  c.solde = root.money;
  c.j.push(e);
  if (c.j.length > 150) c.j.splice(0, c.j.length - 150);
}
/** Le journal financier d'une sauvegarde est-il intact (chaîne, solde attendu = solde réel) ? */
export function comptaOk(s) {
  const c = s && s.compta;
  if (!c) return true; // sauvegarde d'avant Hitman 2.0
  if (typeof c !== 'object' || !NIsArray(c.j)) return false;
  for (let i = 1; i < c.j.length; i++) if (chainH(c.j[i - 1].h, c.j[i]) !== c.j[i].h) return false;
  if (c.j.length && c.j[c.j.length - 1].h !== c.h) return false;
  return c.solde === s.money && c.k === comptaKey(c);
}
/** Les dernières lignes du journal financier (pour l'affichage). */
export const journal = () => (root?.compta?.j || []).slice();

// Actions d'interface pures : elles ne doivent rien changer d'important
const UI_ONLY = new Set(['tab', 'ctab', 'closeall', 'itab', 'compose', 'phoneconv', 'pc', 'ach', 'changelog', 'bug', 'hitmanok', 'tipsoff', 'phoneclose', 'guide', 'guidenext', 'guideskip', 'cbet', 'cgame', 'cpick', 'arbre']);
// Achats : ils ne doivent jamais enrichir
const DEPENSES = new Set(['buyasset', 'openbiz', 'city']);

/** Début d'une action du joueur : ouvre le permis d'écrire et mémorise l'état de départ. */
export function begin(a) {
  if (!root) return;
  if (depth++ === 0) {
    const l = stackLines();
    tail = null;
    if (l && l.length > 3) {
      tail = [];
      for (let i = 3; i < l.length; i++) tail[tail.length] = l[i]; // [stackLines, begin, appelant] puis ceux qui ont déclenché l'action
    }
    action = a || 'action';
    begin0 = { w: fingerprint(root), money: root.money };
    pending = {};
  }
}

/** Fin d'une action : contrôles de cohérence, journal, validation. Renvoie une raison d'anomalie ou null. */
export function end() {
  if (!root || depth === 0) return null;
  if (--depth > 0) return null;
  let raison = violation;
  const after = fingerprint(root);
  if (!raison && begin0) {
    // Solde réel = solde de départ + variations passées par le coffre-fort
    const attendu = (begin0.money || 0) + (pending.money || 0);
    if (NFinite(root.money) && NFinite(attendu) && Math.abs(root.money - attendu) > 0.5) raison = 'Solde réel différent du solde attendu';
    else if (UI_ONLY.has(action) && !sameWatch(begin0.w, after)) raison = 'Une action d’interface a modifié l’état du jeu';
    else if (DEPENSES.has(action) && root.money > begin0.money) raison = 'Un achat a enrichi le joueur';
  }
  if (!raison && pending && (pending.money || pending.bourse || pending.sale)) journalise(action, pending);
  pending = null;
  begin0 = null;
  action = null;
  tail = null;
  if (raison) {
    violation = raison;
    return raison;
  }
  commit();
  return null;
}

/** Restaure en place le dernier état validé (le Proxy du jeu reste le même). */
export function restore() {
  if (!root || !lastGood) return false;
  const good = NParse(lastGood);
  for (const k of NKeys(root)) if (!(k in good)) delete root[k];
  for (const k of NKeys(good)) root[k] = good[k];
  depth = 0;
  pending = null;
  begin0 = null;
  commit();
  return true;
}
/** Valide l'état actuel comme référence (après une sanction, par exemple). */
export const accept = () => commit();

// ---------- Contrôles ----------
// Seuils volontairement larges : un joueur honnête ne doit jamais être condamné (faux positif = pire bug possible).
export const LIMITES = {
  argentMax: 1e9, // 1 milliard : 50 × la fortune légitime maximale observée en simulation (21 M€)
  argentMin: -1e8,
};

const finite = (n) => typeof n === 'number' && NFinite(n);
/** Anomalies de l'état lui-même (sommes astronomiques, NaN, types invalides). Renvoie une raison ou null. */
export function anomalie(s) {
  s = unwrap(s);
  if (!s || typeof s !== 'object') return null;
  if (!finite(s.money)) return 'Solde bancaire invalide (NaN ou infini)';
  const fortune = s.money + (finite(s.bourse) ? s.bourse : 0) + (finite(s.sale) ? s.sale : 0);
  if (fortune > LIMITES.argentMax) return `Somme astronomique : ${Math.round(fortune).toLocaleString('fr-FR')} €`;
  if (s.money < LIMITES.argentMin) return 'Dette impossible';
  if (s.sale != null && !finite(s.sale)) return 'Argent sale invalide';
  if (s.bourse != null && !finite(s.bourse)) return 'Portefeuille boursier invalide';
  if (!finite(s.age) || s.age < 0 || s.age > 130) return 'Âge impossible';
  if (s.energie != null && (!finite(s.energie) || s.energie < -1 || s.energie > 60)) return 'Énergie impossible';
  for (const k of NKeys(s.stats || {})) if (!finite(s.stats[k]) || s.stats[k] < -1 || s.stats[k] > 101) return `Statistique « ${k} » impossible`;
  for (const b of s.biens || []) if (!finite(b.valeur) || b.valeur < 0 || b.valeur > LIMITES.argentMax) return 'Patrimoine impossible';
  for (const b of s.business || []) if (b.valo != null && (!finite(b.valo) || b.valo > LIMITES.argentMax)) return 'Entreprise impossible';
  return null;
}

/** Vérifie l'environnement, le coffre-fort et l'état. Renvoie une raison ou null. */
export function verifier(s) {
  // On remet les fonctions natives en place : la triche ne marche pas, et Hitman ne condamne qu'une fois
  if (Math.random !== NRandom || !isNative(Math.random)) {
    Math.random = NRandom;
    return 'Générateur aléatoire remplacé';
  }
  if (JSON.stringify !== NStringify || JSON.parse !== NParse) {
    JSON.stringify = NStringify;
    JSON.parse = NParse;
    return 'Fonctions du navigateur détournées';
  }
  if (NError.stackTraceLimit !== STL || NError.prepareStackTrace !== PST) {
    NError.stackTraceLimit = STL;
    NError.prepareStackTrace = PST;
    return 'Piles d’appels falsifiées';
  }
  if (violation) return violation;
  const raw = unwrap(s);
  if (raw && raw === root && depth === 0 && lastGood) {
    // Valeurs témoins puis empreinte complète : l'état brut ne bouge pas entre deux actions
    if (!sameWatch(watch, fingerprint(root))) return 'Valeurs sensibles modifiées hors du jeu';
    if (dirty) commit();
    else if (cyrb53(NStringify(root), 7) !== committedH) return 'État du jeu modifié hors du jeu (injection)';
  }
  return anomalie(raw);
}

// Hooks de test (Node uniquement, jamais dans le navigateur)
export const __test = typeof process !== 'undefined' && process.versions?.node ? { raw: () => root, cyrb53, chainH } : undefined;
