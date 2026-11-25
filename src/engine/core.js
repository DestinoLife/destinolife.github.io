import { rnd, pick, chance, clamp, euros } from './rng.js';
import { CAREERS, dipRank } from '../data/careers.js';
import { nameFor, surnameFor, MILIEUX } from '../data/identity.js';
import { randomLook, childLook } from '../data/look.js';

export const STATS = ['bonheur', 'sante', 'intel', 'apparence', 'forme', 'art', 'crime', 'charisme', 'reputation', 'karma', 'notoriete'];
export const isF = (s) => s.id.genre === 'f';
export const g = (s, h, f) => (isF(s) ? f : h);

// ---------- Texte ----------
// {cle} -> valeur de s.tmp / s.mem, {€cle} -> montant formaté, {e} -> accord féminin, {a|b} -> masculin|féminin.
export function tpl(str, s) {
  if (typeof str === 'function') str = str(s);
  if (!str) return '';
  const ctx = { prenom: s.id.prenom, nom: s.id.nom, ville: s.id.ville, pays: s.id.pays, ...s.mem, ...s.tmp };
  str = str.replace(/\{(€?)(\w+)\}/g, (m, eur, k) => {
    if (k === 'e' || !(k in ctx) || ctx[k] == null || typeof ctx[k] === 'object') return m;
    return eur ? euros(ctx[k]) : String(ctx[k]);
  });
  const f = isF(s);
  return str.replace(/\{e\}/g, f ? 'e' : '').replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (m, a, b) => (f ? b : a));
}

export function addLog(s, txt) {
  const t = tpl(txt, s);
  if (!t) return;
  s.log.push({ age: s.age, txt: t });
  if (s.log.length > 500) s.log.splice(0, s.log.length - 500);
}

// ---------- Relations ----------
export const LIENS = {
  mere: ['Mère', 'Mère'], pere: ['Père', 'Père'], fratrie: ['Frère', 'Sœur'], ami: ['Ami', 'Amie'],
  partenaire: ['Copain', 'Copine'], conjoint: ['Mari', 'Femme'], enfant: ['Fils', 'Fille'], ex: ['Ex', 'Ex'],
};
export const lienNom = (r) => (LIENS[r.lien] || ['Proche', 'Proche'])[r.genre === 'f' ? 1 : 0];

function uniqueName(s, origine, genre) {
  const used = new Set([s.id.prenom, ...s.relations.map((r) => r.prenom)]);
  for (let i = 0; i < 25; i++) {
    const n = nameFor(i < 15 ? origine : pick(['france', 'maghreb', 'portugal', 'afrique_ouest', 'asie']), genre);
    if (!used.has(n)) return n;
  }
  return nameFor(origine, genre) + ' ' + String.fromCharCode(65 + rnd(0, 25)) + '.';
}

export function newPerson(s, lien, o = {}) {
  const genre = o.genre || pick(['h', 'f']);
  const origine = o.origine || s.id.origine;
  return {
    id: s.uid++, lien, genre,
    prenom: o.prenom || uniqueName(s, origine, genre),
    nom: o.nom || (['mere', 'pere', 'fratrie', 'enfant'].includes(lien) ? s.id.nom : surnameFor(origine)),
    age: o.age ?? s.age, rel: o.rel ?? rnd(55, 85), conf: o.conf ?? rnd(40, 70), vivant: true, depuis: s.age,
    look: o.look || randomLook(genre, origine),
  };
}
export const partnerOf = (s) => s.relations.find((r) => r.vivant && (r.lien === 'partenaire' || r.lien === 'conjoint'));
export const bestFriend = (s) => s.relations.filter((r) => r.vivant && r.lien === 'ami').sort((a, b) => b.rel - a.rel)[0];
export const childrenOf = (s) => s.relations.filter((r) => r.lien === 'enfant');
export const parentsOf = (s) => s.relations.filter((r) => r.vivant && (r.lien === 'mere' || r.lien === 'pere'));
export const partnerGenre = (s) => (s.id.attirance === 'hf' ? pick(['h', 'f']) : s.id.attirance || (isF(s) ? 'h' : 'f'));

export function ensureFriend(s) {
  let f = bestFriend(s);
  if (!f) {
    f = newPerson(s, 'ami', { genre: chance(0.7) ? s.id.genre : undefined, age: s.age + rnd(-1, 2) });
    s.relations.push(f);
  }
  return f;
}

function relDelta(s, lien, d) {
  let list;
  if (lien === 'ami') list = [bestFriend(s)];
  else if (lien === 'partenaire') list = [partnerOf(s)];
  else if (lien === 'parents') list = parentsOf(s);
  else list = s.relations.filter((r) => r.vivant && r.lien === lien);
  list.filter(Boolean).forEach((r) => (r.rel = clamp(r.rel + d)));
}

function birth(s) {
  const p = partnerOf(s);
  const genre = pick(['h', 'f']);
  const look = childLook(s.look, p?.look, genre);
  const kid = newPerson(s, 'enfant', { genre, age: 0, rel: 90, look, nom: s.id.nom });
  s.relations.push(kid);
  s.tmp.bebe = kid.prenom;
  addLog(s, `Naissance de ${g(s, 'ton', 'ton')} ${genre === 'f' ? 'fille' : 'fils'}, ${kid.prenom}.`);
}

// ---------- Carrière ----------
export const career = (s) => (s.carriere ? CAREERS[s.carriere.id] : null);
export const jobTitle = (s) => (s.carriere ? career(s).niveaux[s.carriere.niveau][0] : null);
export const salary = (s) => (s.carriere ? career(s).niveaux[s.carriere.niveau][1] : 0);

export function setCareer(s, id) {
  if (!id) {
    if (s.carriere) addLog(s, `Tu quittes ton poste de ${jobTitle(s)}.`);
    s.carriere = null;
    return;
  }
  if (!CAREERS[id]) return console.warn('Carrière inconnue', id);
  s.carriere = { id, niveau: 0, annees: 0, perf: 55 };
  addLog(s, `Nouveau départ : ${jobTitle(s)}.`);
}

export function changeLevel(s, d) {
  if (!s.carriere) return;
  const max = career(s).niveaux.length - 1;
  const n = clamp(s.carriere.niveau + d, 0, max);
  if (n === s.carriere.niveau) return;
  s.carriere.niveau = n;
  if (career(s).fame) s.stats.notoriete = Math.max(s.stats.notoriete, career(s).fame[n]);
  addLog(s, d > 0 ? `Promotion : ${jobTitle(s)}.` : `Rétrogradation : ${jobTitle(s)}.`);
}

export function giveDiploma(s, d) {
  if (dipRank(d) > dipRank(s.etudes.niveau)) s.etudes.niveau = d;
}

// ---------- Justice ----------
export function arrest(s, { motif, peine }) {
  if (!s.vivant) return;
  if (peine[1] <= 0) {
    s.justice.casier.push({ age: s.age, motif, peine: 'Amende' });
    s.money -= 300;
    s.justice.recherche = Math.max(0, s.justice.recherche - 1);
    addLog(s, `Garde à vue pour ${motif.toLowerCase()}. Amende de 300 €.`);
    return;
  }
  s.justice.pending = { motif, peine };
  if (!s.queue.includes('proces')) s.queue.unshift('proces');
  addLog(s, `Arrêté{e} pour ${motif.toLowerCase()}.`);
}

export function condamne(s, factor) {
  const p = s.justice.pending;
  if (!p) return;
  const y = Math.max(0, Math.round(rnd(p.peine[0], p.peine[1]) * factor));
  s.justice.pending = null;
  s.justice.recherche = 0;
  s.justice.motif = null;
  delete s.flags.cavale;
  s.justice.casier.push({ age: s.age, motif: p.motif, peine: y > 0 ? `${y} an${y > 1 ? 's' : ''} ferme` : 'Sursis' });
  if (y <= 0) {
    s.tmp.verdict = 'Condamné{e} avec sursis. Tu ressors libre, mais ton casier est marqué.';
    addLog(s, `Condamné{e} avec sursis pour ${p.motif.toLowerCase()}.`);
    return;
  }
  s.justice.prison = y;
  s.justice.peineTotale = y;
  s.lieu = null;
  if (s.carriere && career(s).cat !== 'crime') setCareer(s, null);
  if (partnerOf(s) && chance(0.35)) {
    partnerOf(s).lien = 'ex';
    addLog(s, 'Ton couple ne survit pas à la condamnation.');
  }
  s.tmp.verdict = `Condamné{e} à ${y} an${y > 1 ? 's' : ''} de prison ferme.`;
  addLog(s, `Condamné{e} à ${y} an${y > 1 ? 's' : ''} de prison pour ${p.motif.toLowerCase()}.`);
}

function acquitte(s) {
  s.justice.pending = null;
  s.justice.recherche = 0;
  s.justice.motif = null;
  s.tmp.verdict = 'Relaxé{e} ! Tu sors du tribunal libre.';
  addLog(s, 'Relaxé{e} par le tribunal.');
}

export function die(s, cause) {
  if (!s.vivant) return;
  s.vivant = false;
  s.mort = { age: s.age, cause: tpl(cause, s), t: s.t };
  s.queue = [];
  addLog(s, `Décès à ${s.age} ans : ${cause}.`);
}

// ---------- Effets ----------
const FX = {
  money: (s, v) => (s.money += Math.round(v)),
  log: (s, v) => addLog(s, v),
  recherche: (s, v) => (s.justice.recherche = clamp(s.justice.recherche + v, 0, 5)),
  motif: (s, v) => (s.justice.motif = v),
  casier: (s, v) => v && s.justice.casier.push({ age: s.age, motif: v, peine: 'Mention' }),
  arrest: (s, v) => arrest(s, v),
  condamne: (s, v) => condamne(s, v),
  acquitte: (s) => acquitte(s),
  prisonAdd: (s, v) => {
    s.justice.prison += v;
    s.justice.peineTotale = (s.justice.peineTotale || 0) + v;
  },
  evade: (s) => {
    s.justice.prison = 0;
    s.justice.recherche = 5;
    s.justice.motif = 'Évasion';
    s.flags.cavale = true;
    s.lieu = 'rue';
    addLog(s, 'Évadé{e} de prison. Tu es en cavale.');
  },
  flag: (s, v) => [].concat(v).forEach((f) => (s.flags[f] = true)),
  unflag: (s, v) => [].concat(v).forEach((f) => delete s.flags[f]),
  job: (s, v) => setCareer(s, v),
  jobLvl: (s, v) => changeLevel(s, v),
  perf: (s, v) => s.carriere && (s.carriere.perf = clamp(s.carriere.perf + v)),
  logement: (s, v) => {
    s.logement = v;
    s.chezParents = false;
    s.proprio = false;
  },
  chezParents: (s, v) => {
    s.chezParents = v;
    if (v) {
      s.logement = s.logementFamille;
      s.proprio = false;
    }
  },
  lieu: (s, v) => (s.lieu = v),
  statut: (s, v) => {
    s.id.statut = v;
    addLog(s, { titre: 'Tu obtiens un titre de séjour.', naturalise: 'Tu obtiens la nationalité française.', sans_papiers: 'Tu es désormais sans papiers.' }[v] || '');
  },
  diplome: (s, v) => giveDiploma(s, v),
  etudes: (s, v) => {
    s.etudes.cursus = v.cursus;
    s.etudes.reste = v.reste;
  },
  rel: (s, v) => relDelta(s, v.lien, v.d),
  addRel: (s, v) => s.relations.push(newPerson(s, v.lien, v)),
  couple: (s) => {
    const c = s.tmp.candidat;
    if (!c) return;
    c.lien = 'partenaire';
    c.depuis = s.age;
    c.rel = rnd(65, 85);
    s.relations.push(c);
    addLog(s, `Tu es en couple avec ${c.prenom}.`);
  },
  marier: (s) => {
    const p = partnerOf(s);
    if (!p) return;
    p.lien = 'conjoint';
    p.rel = clamp(p.rel + 15);
    addLog(s, `Mariage avec ${p.prenom}.`);
  },
  enfant: (s) => birth(s),
  rupture: (s) => {
    const p = partnerOf(s);
    if (!p) return;
    addLog(s, `Séparation avec ${p.prenom}.`);
    p.lien = 'ex';
    p.rel = 20;
  },
  mort: (s, v) => die(s, v),
  queue: (s, v) => s.queue.unshift(...[].concat(v)),
  energie: (s, v) => (s.energie = Math.max(0, s.energie + v)),
  expulse: (s) => {
    s.id.ville = s.id.pays;
    s.id.statut = 'au_pays';
    s.logement = 'pays';
    s.chezParents = false;
    s.justice.recherche = 0;
    if (s.carriere && career(s).cat !== 'sport') setCareer(s, null);
    addLog(s, 'Retour au pays : {pays}.');
  },
  sms: (s, v) => {
    s.phone.msgs.push({ from: tpl(v.from, s), role: v.role || '', txt: tpl(v.txt, s), age: s.age, t: s.t, read: false });
    s.phone.unread = s.phone.msgs.filter((m) => !m.read).length;
  },
  sale: (s, v) => (s.sale = Math.max(0, s.sale + v)),
  avec: (s, v) => (s.avec = [].concat(v)),
  securite: (s, v) => (s.securite = Math.max(0, s.securite + v)),
  cavaleFin: (s) => {
    s.cavale = null;
    delete s.flags.cavale;
  },
  revenir: (s, v) => {
    s.id.ville = s.id.villeCible;
    s.id.statut = v;
    s.logement = 'bidonville';
    s.chezParents = false;
    addLog(s, 'Tu reviens en France, à {ville}.');
  },
};

// Permet à d'autres modules (économie) d'ajouter des effets sans import circulaire.
const EXTRA_FX = {};
export const registerFx = (k, fn) => (EXTRA_FX[k] = fn);

export function apply(s, fx) {
  if (!fx) return;
  if (typeof fx === 'function') {
    const r = fx(s);
    if (r && typeof r === 'object') apply(s, r);
    return;
  }
  for (const [k, v] of Object.entries(fx)) {
    if (!s.vivant && k !== 'log') break;
    if (FX[k]) FX[k](s, v);
    else if (STATS.includes(k)) {
      s.stats[k] = clamp(s.stats[k] + v);
      if (k === 'sante' && v <= -10) s.blessure = s.age;
    }
    else if (EXTRA_FX[k]) EXTRA_FX[k](s, v);
    else console.warn('Effet inconnu :', k);
  }
}

// ---------- Création d'une vie ----------
export function createLife(cfg, opts = {}) {
  const startAge = opts.age || 0;
  const now = opts.t || Date.UTC(2026, rnd(0, 11), rnd(1, 28), rnd(0, 23), rnd(0, 59));
  const birthT = startAge ? now - Math.round(startAge * 365.25) * 86400000 : now;
  const immigrant = cfg.statut !== 'ne_france' && !startAge;
  const trait = (t) => cfg.traits.includes(t);
  const talentBoost = (list) => (list.includes(cfg.talent) ? rnd(12, 20) : 0);
  const s = {
    v: 1, gen: opts.gen || 1, uid: 1,
    id: {
      prenom: cfg.prenom, nom: cfg.nom, genre: cfg.genre, attirance: cfg.attirance, origine: cfg.origine, pays: cfg.pays,
      ville: immigrant ? cfg.pays : cfg.ville, villeCible: cfg.ville,
      statut: immigrant ? 'au_pays' : cfg.statut, statutCible: cfg.statut,
      arrivee: immigrant ? (cfg.statut === 'sans_papiers' ? rnd(8, 15) : rnd(3, 12)) : null,
    },
    look: cfg.look, traits: cfg.traits, talent: cfg.talent, milieu: cfg.milieu,
    birthT, t: now, age: startAge,
    stats: {
      bonheur: rnd(62, 82), sante: rnd(78, 95),
      intel: clamp(rnd(30, 65) + (trait('malin') ? 10 : 0) + (cfg.talent === 'tech' || cfg.talent === 'business' ? 8 : 0)),
      apparence: rnd(35, 75), forme: clamp(rnd(15, 35) + talentBoost(['football', 'basket', 'boxe'])),
      art: clamp(rnd(5, 25) + talentBoost(['musique', 'dessin', 'comedie'])), crime: 0,
      charisme: clamp(rnd(25, 55) + (trait('charismatique') ? 18 : 0) + (cfg.talent === 'comedie' ? 8 : 0)),
      reputation: 0, karma: 50, notoriete: 0,
    },
    money: 0, chezParents: startAge < 18, logement: immigrant ? 'pays' : MILIEUX[cfg.milieu].logement, logementFamille: MILIEUX[cfg.milieu].logement,
    proprio: false, lieu: null,
    etudes: { niveau: 'aucun', cursus: startAge < 15 ? 'ecole' : null, reste: null },
    carriere: null, pension: 0,
    justice: { recherche: 0, casier: [], prison: 0, peineTotale: 0, pending: null, motif: null },
    relations: [], flags: {}, seen: {}, lastSeen: {}, relUsed: {}, mem: {}, log: [], queue: [], current: null, result: null, tmp: {},
    energie: 4, meteo: { type: 'soleil', temp: 20 }, vivant: true, mort: null,
    biens: [], business: [], reseau: null, phone: { msgs: [], unread: 0 }, voyage: null, cavale: null, securite: 0, sale: 0,
    annee: { sport: 0, medecin: 0 }, avec: [], casino: { perdu: 0, gagne: 0 },
  };
  if (immigrant) s.logementFamille = cfg.milieu === 'riche' || cfg.milieu === 'aisee' ? s.logementFamille : 'pays';
  if (cfg.milieu === 'precaire' && cfg.statut === 'sans_papiers') s.logementFamille = 'pays';
  if (startAge >= 15 && startAge < 18) Object.assign(s.etudes, { niveau: 'brevet', cursus: 'lycee', reste: 18 - startAge });
  if (startAge >= 18) s.etudes.niveau = chance(0.75) ? 'bac' : 'brevet';
  if (startAge >= 22 && chance(0.4)) s.etudes.niveau = 'licence';

  if (!opts.noFamily) {
    const mere = newPerson(s, 'mere', { genre: 'f', age: startAge + rnd(22, 36), rel: rnd(65, 90) });
    s.relations.push(mere);
    if (!chance(0.14)) s.relations.push(newPerson(s, 'pere', { genre: 'h', age: mere.age + rnd(-2, 6), rel: rnd(55, 85) }));
    else s.flags.pere_absent = true;
    for (let i = 0; i < pick([0, 1, 1, 2, 2, 3]); i++) s.relations.push(newPerson(s, 'fratrie', { age: Math.max(0, startAge + rnd(-6, 8)), rel: rnd(50, 85) }));
  }
  if (cfg.milieu === 'riche') s.flags.heritier = true;
  const lieuNaiss = immigrant ? `${cfg.pays}` : cfg.ville;
  addLog(s, startAge ? `Tu reprends le flambeau à ${startAge} an${startAge > 1 ? 's' : ''}.` : `Naissance à ${lieuNaiss}. Bienvenue au monde, ${cfg.prenom}.`);
  if (s.flags.pere_absent && !startAge) addLog(s, 'Ton père n’est pas là. Ta mère t’élève seule.');
  return s;
}
