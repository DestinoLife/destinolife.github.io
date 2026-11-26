// v0.10 « Relations & Dynasties » : les proches vivent leur vie sans toi (métier, couple, enfants, fortune),
// se souviennent de ce que tu as fait pour eux ou contre eux, et prennent des initiatives.
// Tout passe par l'état de la partie (s.relations), donc par le coffre-fort Hitman : aucune population parallèle.
import { rnd, pick, chance, clamp, euros, weighted } from './rng.js';
import { addLog, apply, newPerson, registerFx, setCareer, jobTitle, childrenOf, tpl } from './core.js';
import { CAREERS, canApply } from '../data/careers.js';
import { nameFor, surnameFor, MILIEUX } from '../data/identity.js';
import { randomLook, childLook } from '../data/look.js';
import { DESTINS } from '../data/world2.js';
import { PNJ_TRAITS, PNJ_JOBS, MILIEU_FORTUNE, AUTONOMES, FORTUNE, FORTUNE_F } from '../data/npc.js';
import { patrimoine } from './economy.js';

const TRAITS_K = Object.keys(PNJ_TRAITS);
const fem = (r) => r.genre === 'f';
const byId = (s, id) => s.relations.find((r) => r.id === id);
const PROCHES = ['mere', 'pere', 'fratrie', 'enfant', 'conjoint', 'partenaire', 'petitenfant'];
export const trait = (r, t) => !!r.tr?.includes(t);
// Multiplicateur cumulé des traits pour une tendance (couple, divorce, riche…)
const tw = (r, k) => (r.tr || []).reduce((m, t) => m * (PNJ_TRAITS[t]?.[k] ?? 1), 1);
export const fortuneNom = (r) => (fem(r) ? FORTUNE_F : FORTUNE)[r.fort ?? 1];
export const sen = (r, k) => r.sen?.[k] || 0;
export const traitNom = (r, t) => PNJ_TRAITS[t]?.nom[fem(r) ? 1 : 0] || t;

// Niveau de vie du joueur sur la même échelle que les PNJ (0 à 4)
export function tierJoueur(s) {
  const w = s.money + patrimoine(s);
  return w > 1e6 ? 4 : w > 2e5 ? 3 : w > 4e4 ? 2 : w > 5e3 ? 1 : 0;
}

// ---------- Mémoire et sentiments ----------
// Un souvenir = ce que le PNJ retient de toi : âge du joueur, texte, poids (+ aide, − blessure). 6 au maximum.
export function souvenir(s, r, txt, w = 0) {
  if (!r) return;
  r.souv ??= [];
  r.souv.push({ a: s.age, t: txt, w });
  if (r.souv.length > 6) {
    let k = 0;
    for (let i = 1; i < r.souv.length - 1; i++) if (Math.abs(r.souv[i].w) < Math.abs(r.souv[k].w)) k = i;
    r.souv.splice(k, 1);
  }
}
export const bilanSouvenirs = (r) => (r.souv || []).reduce((t, m) => t + m.w, 0);
export function ressent(r, k, d) {
  r.sen ??= { adm: 0, ranc: 0, jal: 0 };
  r.sen[k] = clamp((r.sen[k] || 0) + d);
}
// Conflit causé par le joueur : rancune selon la personnalité, date retenue pour une réconciliation future
export function blesse(s, r, d, txt) {
  ressent(r, 'ranc', Math.round(d * (trait(r, 'rancunier') ? 1.5 : trait(r, 'chaleureux') ? 0.6 : 1)));
  r.conflit = s.age;
  if (txt) souvenir(s, r, txt, -Math.max(1, Math.round(d / 10)));
}

// ---------- Création et migration ----------
const DESTIN_FORT = { patron: 4, medecin: 3, avocat: 3, politique: 3, dealer: 2, flic: 2, journaliste: 2, prof: 2, artiste: 2, galere: 0 };
export function initPnj(s, r) {
  if (r.tr) return r;
  const a = pick(TRAITS_K);
  const b = pick(TRAITS_K);
  r.tr = b !== a ? [a, b] : [a];
  const base = MILIEU_FORTUNE[s.milieu] ?? 1;
  r.fort ??= ['mere', 'pere', 'fratrie', 'grandparent', 'oncle', 'cousin', 'enfant', 'petitenfant', 'neveu'].includes(r.lien) ? base : clamp(base + rnd(-1, 1), 0, 4);
  r.sen ??= { adm: 0, ranc: 0, jal: 0 };
  return r;
}
// Idempotente : complète les PNJ des anciennes sauvegardes sans rien retirer.
export function migrateNpc(s) {
  s.relations.forEach((r) => r.lien !== 'candidat' && initPnj(s, r));
  s.liens ??= [];
  s.npcQ ??= [];
  s.cpt ??= { voyages: 0, aide: 0 };
  s.dyn ??= { nom: s.id.nom, gens: [], prestige: 0 };
  s.amb ??= { act: [], fini: [], ab: 0, perdu: 0 };
  return s;
}

export const metierDe = (r) => {
  if (r.retraite) return fem(r) ? 'retraitée' : 'retraité';
  if (r.chomage) return 'sans emploi';
  if (r.lien === 'ami' && r.destin) return DESTINS[r.destin]?.nom || '';
  return r.job || '';
};
function donneMetier(s, r) {
  if (r.lien === 'ami' && r.destin) {
    // Reconversion d'un ami : son « destin » (et donc le service qu'il peut te rendre) change
    const opts = Object.keys(DESTINS).filter((k) => k !== r.destin && k !== 'dealer');
    r.destin = pick(opts);
    r.fortD = null;
    return;
  }
  if (r.lien === 'ami') return;
  const lvl = r.fort ?? 1;
  const opts = PNJ_JOBS.filter((j) => Math.abs(j[2] - lvl) <= 1 && j[fem(r) ? 1 : 0] !== r.job);
  r.job = pick(opts.length ? opts : PNJ_JOBS)[fem(r) ? 1 : 0];
}

// ---------- Famille élargie (début de vie) ----------
export function familleElargie(s) {
  const parents = s.relations.filter((r) => r.lien === 'mere' || r.lien === 'pere');
  for (const par of parents) {
    const nom = par.lien === 'pere' ? s.id.nom : surnameFor(s.id.origine);
    for (const genre of ['h', 'f']) {
      if (!chance(0.8)) continue;
      const age = par.age + rnd(22, 34);
      const gp = newPerson(s, 'grandparent', { genre, age, nom, rel: rnd(55, 90), look: randomLook(genre, s.id.origine) });
      gp.cote = par.lien;
      gp.retraite = age >= 64;
      if (age > 80 + rnd(0, 14)) gp.vivant = false;
      s.relations.push(initPnj(s, gp));
    }
    for (let i = 0, n = pick([0, 1, 1, 2]); i < n; i++) {
      const o = newPerson(s, 'oncle', { age: Math.max(18, par.age + rnd(-8, 8)), nom, rel: rnd(40, 75) });
      o.cote = par.lien;
      initPnj(s, o);
      donneMetier(s, o);
      s.relations.push(o);
      if (o.age >= 24 && chance(0.65)) {
        o.couple = coupleDe(s, o, true);
        const nb = rnd(1, 2);
        o.kids = nb;
        for (let k = 0; k < nb; k++) {
          const age = s.age + rnd(-6, 6);
          if (age < 0 || age > o.age - 18) continue;
          const c = newPerson(s, 'cousin', { age, nom: fem(o) ? surnameFor(s.id.origine) : nom, rel: rnd(40, 75) });
          c.par = o.id;
          s.relations.push(initPnj(s, c));
        }
      }
    }
  }
}

function coupleDe(s, r, marie = false) {
  const g2 = chance(0.92) ? (fem(r) ? 'h' : 'f') : r.genre;
  // Prénom différent de ceux de la famille et des proches (sinon l'arbre devient illisible à la génération suivante)
  const pris = new Set([s.id.prenom, ...s.relations.map((x) => x.prenom), ...s.relations.map((x) => x.couple?.p)]);
  let p = '';
  for (let i = 0; i < 20 && (!p || pris.has(p)); i++) p = nameFor(chance(0.7) ? s.id.origine : pick(['france', 'maghreb', 'portugal', 'afrique_ouest', 'asie']), g2);
  return { p, g: g2, m: marie, d: s.age };
}

// ---------- Simulation annuelle ----------
function note(s, r, txt) {
  if (PROCHES.includes(r.lien) || r.rel >= 45) addLog(s, txt);
}
function sms(s, r, txt) {
  if (r.vivant && r.rel >= 35) apply(s, { sms: { from: r.prenom, txt, rid: r.id } });
}

function naissancePnj(s, r) {
  r.kids = (r.kids || 0) + 1;
  const genre = pick(['h', 'f']);
  const reel = (r.lien === 'enfant' && s.relations.filter((x) => x.lien === 'petitenfant').length < 8) || (r.lien === 'fratrie' && s.relations.filter((x) => x.lien === 'neveu').length < 6);
  if (reel) {
    const lien = r.lien === 'enfant' ? 'petitenfant' : 'neveu';
    const k = newPerson(s, lien, { genre, age: 0, rel: rnd(60, 85), nom: r.nom, look: childLook(r.look, null, genre) });
    k.par = r.id;
    s.relations.push(initPnj(s, k));
    if (lien === 'petitenfant') addLog(s, `Tu es ${s.id.genre === 'f' ? 'grand-mère' : 'grand-père'} : ${r.prenom} a eu ${genre === 'f' ? 'une fille' : 'un fils'}, ${k.prenom}.`);
    else addLog(s, `${r.prenom} a eu ${genre === 'f' ? 'une fille' : 'un fils'}, ${k.prenom}. Tu es ${s.id.genre === 'f' ? 'tata' : 'tonton'} !`);
    sms(s, r, `${genre === 'f' ? 'C’est une fille' : 'C’est un garçon'} ! ${genre === 'f' ? 'Elle' : 'Il'} s’appelle ${k.prenom}. Viens vite ${genre === 'f' ? 'la' : 'le'} voir ❤️`);
  } else if (r.rel >= 55) {
    sms(s, r, `Grande nouvelle : je suis ${fem(r) ? 'maman' : 'papa'} ! ${genre === 'f' ? 'Une petite fille' : 'Un petit garçon'} 👶`);
    note(s, r, `${r.prenom} a eu un enfant.`);
  }
}

function vieAutonome(s, r, crise, boom, inits) {
  const actif = r.age >= 20 && r.age < 64;
  // Un collègue travaille avec toi : son métier, c'est ton entreprise (il en change quand il devient « ancien collègue »)
  if (actif && r.lien !== 'ami' && r.lien !== 'collegue' && !r.job && !r.chomage && r.lien !== 'grandparent') donneMetier(s, r);
  if (r.lien === 'ami' && r.destin && r.fortD !== r.destin) {
    r.fort = clamp((DESTIN_FORT[r.destin] ?? 2) + rnd(-1, 0), 0, 4);
    r.fortD = r.destin;
  }
  if (r.age >= 64 && !r.retraite && (r.job || r.destin)) {
    r.retraite = true;
    r.chomage = false;
    note(s, r, `${r.prenom} part à la retraite.`);
  }
  // Emploi : licenciement (plus fréquent en crise), retour à l'emploi, reconversion
  if (actif && !r.retraite && (r.job || r.destin)) {
    if (!r.chomage && chance(0.025 * crise * (trait(r, 'serieux') ? 0.6 : 1))) {
      r.chomage = true;
      r.fort = Math.max(0, (r.fort ?? 1) - 1);
      note(s, r, `${r.prenom} a perdu son emploi.`);
      if (r.rel >= 55 && !['mere', 'pere', 'conjoint', 'partenaire'].includes(r.lien)) inits.push({ e: 'pnj_chomage', r: r.id, w: 1.2 });
    } else if (r.chomage && chance(crise > 1 ? 0.22 : 0.38)) {
      r.chomage = false;
      donneMetier(s, r);
      note(s, r, `${r.prenom} a retrouvé du travail : ${metierDe(r)}.`);
    } else if (!r.chomage && chance(0.035 * tw(r, 'job'))) {
      const avant = metierDe(r);
      donneMetier(s, r);
      if (avant && avant !== metierDe(r)) note(s, r, `${r.prenom} change de voie : ${avant} → ${metierDe(r)}.`);
    }
  }
  // Fortune
  if (!r.chomage && (r.fort ?? 1) < 4 && chance(0.045 * tw(r, 'riche') * boom)) {
    r.fort = (r.fort ?? 1) + 1;
    if (r.fort === 4) note(s, r, `${r.prenom} a fait fortune.`);
  } else if ((r.fort ?? 1) > 0 && chance(0.03 * tw(r, 'pauvre') * crise)) {
    r.fort = (r.fort ?? 1) - 1;
    if (r.fort === 0) note(s, r, `${r.prenom} traverse une mauvaise passe financière.`);
  }
  // Déménagement loin de toi
  if (!r.loin && r.age >= 20 && r.age <= 60 && chance(0.012 * tw(r, 'bouge'))) {
    r.loin = true;
    r.rel = clamp(r.rel - 6);
    note(s, r, `${r.prenom} part s’installer loin d’ici.`);
  }
  // Vie de couple (les parents et grands-parents forment déjà un couple implicite)
  if (!AUTONOMES.includes(r.lien) || r.age > 75) return;
  const duo = r.couple?.id ? byId(s, r.couple.id) : null;
  if (r.couple?.id && (!duo || !duo.vivant)) {
    note(s, r, `${r.prenom} est seul${fem(r) ? 'e' : ''} depuis la mort de ${r.couple.p}.`);
    r.couple = null;
    return;
  }
  if (duo && r.id > duo.id) return; // un couple de deux PNJ n'est simulé qu'une fois
  if (!r.couple) {
    if (r.age <= 65 && chance(0.09 * tw(r, 'couple'))) {
      r.couple = coupleDe(s, r);
      note(s, r, `${r.prenom} est en couple avec ${r.couple.p}.`);
      if (r.lien === 'ex') ressent(r, 'ranc', -15);
    }
    return;
  }
  if (!r.couple.m && s.age - r.couple.d >= 2 && chance(0.18)) {
    r.couple.m = true;
    if (duo) duo.couple.m = true;
    note(s, r, `${r.prenom} épouse ${r.couple.p}.`);
    if (r.rel >= 55 && r.lien !== 'ex' && s.age >= 10) inits.push({ e: 'pnj_mariage', r: r.id, w: 1.4 });
  } else if (chance((r.couple.m ? 0.022 : 0.09) * tw(r, 'divorce') * (duo ? tw(duo, 'divorce') : 1))) {
    note(s, r, `${r.prenom} et ${r.couple.p} se séparent.`);
    if (duo) {
      duo.couple = null;
      const l = s.liens.find((x) => (x.a === r.id && x.b === duo.id) || (x.a === duo.id && x.b === r.id));
      if (l) Object.assign(l, { t: 'brouille', d: s.age });
    }
    r.couple = null;
    return;
  }
  if (r.age >= 21 && r.age <= 43 && (r.kids || 0) < 4 && chance(0.11)) {
    naissancePnj(s, r);
    if (duo) duo.kids = (duo.kids || 0) + 1;
  }
}

function sentiments(s, r, tierJ, inits) {
  r.sen ??= { adm: 0, ranc: 0, jal: 0 };
  const succes = s.stats.notoriete >= 40 || tierJ >= 3 || (s.carriere?.niveau ?? 0) >= 3;
  if (trait(r, 'jaloux') && r.lien !== 'enfant' && r.lien !== 'petitenfant' && (tierJ >= (r.fort ?? 1) + 2 || s.stats.notoriete >= 50)) ressent(r, 'jal', rnd(5, 12));
  else ressent(r, 'jal', -4);
  if (succes && r.rel >= 50 && sen(r, 'jal') < 40) ressent(r, 'adm', Math.round(rnd(3, 7) * tw(r, 'adm')));
  else ressent(r, 'adm', -2);
  if (s.stats.karma < 25 && r.rel >= 40) ressent(r, 'adm', -4);
  ressent(r, 'ranc', -Math.max(1, Math.round(4 * tw(r, 'ranc'))));
  if (sen(r, 'ranc') >= 50) r.rel = clamp(r.rel - 2);
  if (sen(r, 'adm') >= 60) r.rel = clamp(r.rel + 1);
  if (r.age < 14 || r.lien === 'contact') return;
  if (sen(r, 'jal') >= 60 && !r.jalouxDit) inits.push({ e: 'pnj_jaloux', r: r.id, w: 1 });
  if (sen(r, 'adm') >= 70 && r.age >= 16 && r.age <= s.age + 10 && !r.mentor && s.age >= 25) inits.push({ e: 'pnj_mentor', r: r.id, w: 0.8 });
  if (sen(r, 'ranc') >= 20 && r.rel < 55 && s.age - (r.conflit ?? 0) >= 2 && chance(0.5)) inits.push({ e: 'pnj_reconcil', r: r.id, w: 1.1 });
}

// Initiatives qui dépendent de ta situation et de votre histoire commune (Living Stories)
function opportunites(s, r, inits) {
  if (r.age < 18 || r.lien === 'grandparent') return;
  const libre = s.justice.prison === 0 && !s.cavale;
  if (libre && s.age >= 18 && s.age <= 62 && !s.carriere && r.rel >= 45 && !r.chomage && !r.retraite && ((r.fort ?? 1) >= 3 || r.destin === 'patron') && posteOffert(s)) {
    inits.push({ e: 'pnj_emploi', r: r.id, w: 2 + bilanSouvenirs(r) / 3 });
  }
  if (libre && s.age >= 16 && !r.dette && ((r.fort ?? 1) === 0 || r.chomage) && r.rel >= 55 && s.money >= 3000) {
    inits.push({ e: 'pnj_pret', r: r.id, w: 0.45, x: Math.min(Math.round(s.money * 0.15 / 100) * 100, pick([500, 1000, 2000, 5000])) });
  }
  if (!r.retour && (r.fort ?? 1) >= 3 && bilanSouvenirs(r) >= 3 && s.age >= 18) inits.push({ e: 'pnj_retour', r: r.id, w: 1.6 });
}

// Poste qu'un proche bien placé peut te proposer : le mieux payé auquel tu peux prétendre (sinon livreur ou vente)
export function posteOffert(s) {
  const classiques = Object.keys(CAREERS).filter((id) => CAREERS[id].cat === 'classique');
  const ok = classiques.filter((id) => canApply(s, id) === true).sort((a, b) => CAREERS[b].niveaux[0][1] - CAREERS[a].niveaux[0][1]);
  return ok[0] || null;
}

function liensEntrePnj(s, inits) {
  s.liens = (s.liens || []).filter((l) => byId(s, l.a)?.vivant && byId(s, l.b)?.vivant);
  const amis = s.relations.filter((r) => r.vivant && r.lien === 'ami' && r.age >= 16);
  if (amis.length < 2 || !chance(0.22)) return;
  const a = pick(amis);
  const b = pick(amis.filter((x) => x !== a));
  const l = s.liens.find((x) => (x.a === a.id && x.b === b.id) || (x.a === b.id && x.b === a.id));
  if (!l) {
    if (!a.couple && !b.couple && a.age >= 18 && b.age >= 18 && a.genre !== b.genre && Math.abs(a.age - b.age) <= 8 && chance(0.3)) {
      s.liens.push({ a: a.id, b: b.id, t: 'couple', d: s.age });
      a.couple = { p: b.prenom, id: b.id, g: b.genre, m: false, d: s.age };
      b.couple = { p: a.prenom, id: a.id, g: a.genre, m: false, d: s.age };
      addLog(s, `${a.prenom} et ${b.prenom}, deux de tes amis, sont en couple.`);
      sms(s, a, `Faut que je te dise un truc… ${b.prenom} et moi, on est ensemble 😳`);
    } else {
      s.liens.push({ a: a.id, b: b.id, t: 'amis', d: s.age });
      a.rel = clamp(a.rel + 2);
      b.rel = clamp(b.rel + 2);
      note(s, a, `${a.prenom} et ${b.prenom} sont devenus amis grâce à toi.`);
    }
  } else if ((l.t === 'amis' || l.t === 'couple') && s.age - l.d >= 2 && chance(0.25)) {
    if (l.t === 'couple') {
      a.couple = null;
      b.couple = null;
    }
    Object.assign(l, { t: 'brouille', d: s.age });
    inits.push({ e: 'pnj_brouille', r: a.id, r2: b.id, w: 1 });
  } else if (l.t === 'brouille' && s.age - l.d >= 2 && chance(0.3)) {
    Object.assign(l, { t: 'amis', d: s.age });
    note(s, a, `${a.prenom} et ${b.prenom} se sont réconciliés.`);
  }
  if (s.liens.length > 12) s.liens.splice(0, s.liens.length - 12);
}

function remboursements(s) {
  for (const r of s.relations) {
    if (!r.vivant || !(r.dette > 0) || r.chomage || (r.fort ?? 0) < 1) continue;
    if (!chance(0.3 * tw(r, 'rembourse'))) continue;
    const m = r.dette;
    s.money += m;
    r.dette = 0;
    r.rel = clamp(r.rel + 4);
    addLog(s, `${r.prenom} te rembourse les ${euros(m)} que tu lui avais prêtés.`);
    sms(s, r, `Je t’ai fait un virement de ${euros(m)}. Merci encore de m’avoir aidé${fem(r) ? 'e' : ''} quand ça n’allait pas.`);
  }
}

export function npcTick(s) {
  migrateNpc(s);
  const phase = s.eco?.phase || 'stable';
  const crise = phase === 'recession' || phase === 'krach' ? 2 : phase === 'boom' ? 0.6 : 1;
  const boom = phase === 'boom' || phase === 'croissance' ? 1.4 : phase === 'krach' ? 0.5 : 1;
  const tierJ = tierJoueur(s);
  const inits = [];
  for (const r of s.relations) {
    if (!r.vivant || r.lien === 'candidat' || r.lien === 'contact') continue;
    initPnj(s, r);
    sentiments(s, r, tierJ, inits);
    if (r.age < 18) continue;
    vieAutonome(s, r, crise, boom, inits);
    opportunites(s, r, inits);
  }
  liensEntrePnj(s, inits);
  remboursements(s);
  // Une seule initiative à décision par an : les proches ne doivent pas saturer l'année du joueur.
  s.npcQ = (s.npcQ || []).filter((q) => s.queue.includes(q.e));
  if (inits.length && s.age >= 10 && s.justice.prison === 0 && chance(0.6)) {
    const it = weighted(inits, (x) => x.w);
    if (it) {
      s.npcQ.push(it);
      s.queue.push(it.e);
    }
  }
}

// ---------- Événements à décision : cible et effets ----------
// pre() d'un événement PNJ : relie l'événement à sa cible (prénom, accords, avatar dans la scène)
export function cibleEvenement(s, id) {
  const i = (s.npcQ || []).findIndex((q) => q.e === id);
  if (i < 0) return null;
  const q = s.npcQ[i];
  const r = byId(s, q.r);
  if (!r || !r.vivant) return null;
  return { q, i, r, r2: q.r2 != null ? byId(s, q.r2) : null };
}
export function preparerEvenement(s, id) {
  const c = cibleEvenement(s, id);
  if (!c) return;
  s.npcQ.splice(c.i, 1);
  const { r, r2, q } = c;
  Object.assign(s.tmp, {
    pnjId: r.id, pnj: r.prenom, plien: lienNomBas(r), pil: fem(r) ? 'elle' : 'il', Pil: fem(r) ? 'Elle' : 'Il', pe: fem(r) ? 'e' : '', plui: fem(r) ? 'elle' : 'lui',
    pmet: metierDe(r), pconj: r.couple?.p || '', somme: q.x || 0,
  });
  if (r2) Object.assign(s.tmp, { pnj2Id: r2.id, pnj2: r2.prenom });
  if (id === 'pnj_retour') s.tmp.somme = (r.fort ?? 3) >= 4 ? 15000 : 5000;
  if (id === 'pnj_emploi') {
    const job = posteOffert(s);
    s.tmp.posteJob = job;
    s.tmp.poste = job ? CAREERS[job].niveaux[0][0] : '';
  }
  s.avec = r2 ? [r.id, r2.id] : [r.id];
}
const LIEN_BAS = {
  mere: 'ta mère', pere: 'ton père', fratrie: ['ton frère', 'ta sœur'], ami: ['ton ami', 'ton amie'], enfant: ['ton fils', 'ta fille'],
  cousin: ['ton cousin', 'ta cousine'], oncle: ['ton oncle', 'ta tante'], neveu: ['ton neveu', 'ta nièce'], petitenfant: ['ton petit-fils', 'ta petite-fille'],
  collegue: ['ton collègue', 'ta collègue'], excollegue: ['ton ancien collègue', 'ton ancienne collègue'],
  ex: ['ton ex', 'ton ex'], grandparent: ['ton grand-père', 'ta grand-mère'], conjoint: ['ton mari', 'ta femme'], partenaire: ['ton copain', 'ta copine'],
};
export const lienNomBas = (r) => {
  const v = LIEN_BAS[r.lien];
  return !v ? 'un proche' : typeof v === 'string' ? v : v[fem(r) ? 1 : 0];
};

// Effets ciblés : { rel, conf, adm, ranc, jal, souv, w, dette, chomage, fort, mentor, retour, jalouxDit }
function effetPnj(s, r, v) {
  if (!r || !r.vivant || !v) return;
  if (v.rel) r.rel = clamp(r.rel + v.rel);
  if (v.conf) r.conf = clamp((r.conf ?? 50) + v.conf);
  for (const k of ['adm', 'jal']) if (v[k]) ressent(r, k, v[k]);
  if (v.ranc) (v.ranc > 0 ? blesse(s, r, v.ranc) : ressent(r, 'ranc', v.ranc));
  if (v.rancZero) ressent(r, 'ranc', -100);
  if (v.souv) souvenir(s, r, tpl(v.souv, s), v.w || 0);
  if (v.dette) r.dette = (r.dette || 0) + s.tmp.somme;
  if (v.emploi) {
    r.chomage = false;
    donneMetier(s, r);
  }
  if (v.job && r.lien !== 'ami') r.job = tpl(v.job, s);
  if (v.fort) r.fort = clamp((r.fort ?? 1) + v.fort, 0, 4);
  for (const k of ['mentor', 'retour', 'jalouxDit']) if (v[k]) r[k] = true;
}
registerFx('pnj', (s, v) => effetPnj(s, byId(s, s.tmp.pnjId), v));
registerFx('pnj2', (s, v) => effetPnj(s, byId(s, s.tmp.pnj2Id), v));
registerFx('pnjLien', (s, v) => {
  const l = s.liens?.find((x) => (x.a === s.tmp.pnjId && x.b === s.tmp.pnj2Id) || (x.b === s.tmp.pnjId && x.a === s.tmp.pnj2Id));
  if (l && ['amis', 'brouille'].includes(v)) Object.assign(l, { t: v, d: s.age });
});
registerFx('pnjSomme', (s, v) => {
  const m = Math.round((s.tmp.somme || 0) * v);
  if (Number.isFinite(m) && m) s.money += m;
});
registerFx('pnjEmbauche', (s) => {
  const job = s.tmp.posteJob;
  if (!job || s.carriere) return;
  setCareer(s, job);
  if (s.carriere) s.carriere.perf = 65;
});

// ---------- Dynastie ----------
const annee = (t) => new Date(t).getUTCFullYear();
function faitMarquant(s) {
  const fortune = s.money + patrimoine(s);
  const cat = s.carriere ? CAREERS[s.carriere.id]?.cat : null;
  if (cat === 'politique' && s.carriere.niveau >= 3) return 'Au sommet de l’État';
  if (s.stats.notoriete >= 80) return 'Célébrité nationale';
  if (fortune >= 1e7) return 'Multimillionnaire';
  if (s.flags.perpetuite) return 'Condamné à perpétuité';
  if (fortune >= 1e6) return 'Millionnaire';
  if ((s.amb?.fini?.length || 0) >= 3) return 'Une vie accomplie';
  if ((s.justice.peineTotale || 0) >= 5) return 'Des années derrière les barreaux';
  if (s.etudes.niveau === 'doctorat') return 'Docteur';
  if (childrenOf(s).length >= 4) return 'Une grande famille';
  return '';
}
function prestigeVie(s) {
  const fortune = s.money + patrimoine(s);
  return Math.round(clamp(s.stats.notoriete / 4 + (fortune > 1e6 ? 10 : fortune > 2e5 ? 5 : 0) + (s.stats.karma - 50) / 5 - s.justice.casier.length * 3 - (s.flags.perpetuite ? 20 : 0) + (s.amb?.fini?.length || 0) * 2, -30, 40));
}
export function archiveVie(s) {
  return {
    g: s.gen, p: s.id.prenom, n: s.id.nom, ge: s.id.genre, nai: annee(s.birthT), dec: annee(s.mort?.t ?? s.t), age: s.age,
    c: s.mort?.cause || '', j: jobTitle(s) || '', f: Math.round(s.money + patrimoine(s)), e: childrenOf(s).length,
    a: s.amb?.fini?.length || 0, fait: faitMarquant(s), pr: prestigeVie(s),
  };
}
// Prestige du nom : chaque génération compte, les plus anciennes pèsent moins.
export const prestigeDynastie = (gens) => Math.round(clamp(gens.reduceRight((t, x, i) => t + x.pr * Math.pow(0.6, gens.length - 1 - i), 0), -100, 100));

// Reprise par un enfant : la famille garde ses identifiants, chacun change de place dans l'arbre.
export function transmettreFamille(s, ns, heir) {
  ns.dyn = { nom: s.dyn?.nom || s.id.nom, gens: [...(s.dyn?.gens || []), archiveVie(s)].slice(-12) };
  ns.dyn.prestige = prestigeDynastie(ns.dyn.gens);
  const ajoute = (r, o) => ns.relations.push({ ...r, ...o });
  // Le joueur défunt devient le parent décédé de l'héritier
  ajoute({ id: 0, genre: s.id.genre, prenom: s.id.prenom, nom: s.id.nom, age: s.age, rel: heir.rel, conf: 70, look: s.look, tr: [], fort: 2 }, { lien: s.id.genre === 'f' ? 'mere' : 'pere', vivant: false, depuis: 0 });
  for (const r of s.relations) {
    if (!r.vivant && r.lien !== 'mere' && r.lien !== 'pere') continue;
    if (r.lien === 'mere' || r.lien === 'pere') {
      if (r.vivant) ajoute(r, { lien: 'grandparent', cote: s.id.genre === 'f' ? 'mere' : 'pere', rel: rnd(55, 85) });
    } else if (r.lien === 'fratrie') ajoute(r, { lien: 'oncle', cote: s.id.genre === 'f' ? 'mere' : 'pere', rel: rnd(40, 75) });
    else if (r.lien === 'neveu') ajoute(r, { lien: 'cousin', rel: rnd(40, 75) });
    else if (r.lien === 'petitenfant') ajoute(r, r.par === heir.id ? { lien: 'enfant', rel: rnd(70, 90) } : { lien: 'neveu', rel: rnd(45, 75) });
  }
  let uid = Math.max(0, ...ns.relations.map((r) => r.id)) + 1;
  for (const r of ns.relations) if (r.id === 0) r.id = uid++;
  ns.uid = uid;
  // Ce que les proches retenaient du parent ne concerne pas l'héritier
  for (const r of ns.relations) Object.assign(r, { souv: [], sen: { adm: 0, ranc: 0, jal: 0 }, conflit: null, dette: 0, mentor: false, retour: false, jalouxDit: false });
  if (heir.couple && !heir.couple.id && ns.age >= 18) {
    const c = newPerson(ns, heir.couple.m ? 'conjoint' : 'partenaire', { prenom: heir.couple.p, genre: heir.couple.g, age: Math.max(18, ns.age + rnd(-3, 3)), rel: rnd(60, 85) });
    c.depuis = Math.max(18, ns.age - (s.age - heir.couple.d));
    ns.relations.push(initPnj(ns, c));
  }
  ns.relations.forEach((r) => r.lien !== 'candidat' && initPnj(ns, r));
  // Le nom de famille ouvre des portes… ou en ferme
  if (ns.dyn.prestige >= 30) {
    ns.stats.notoriete = clamp(ns.stats.notoriete + 5);
    ns.stats.charisme = clamp(ns.stats.charisme + 3);
    addLog(ns, `Le nom ${ns.dyn.nom} inspire le respect : on te reçoit partout avec égards.`);
  } else if (ns.dyn.prestige <= -20) {
    ns.stats.reputation = clamp(ns.stats.reputation + 5);
    ns.stats.karma = clamp(ns.stats.karma - 3);
    addLog(ns, `Le nom ${ns.dyn.nom} traîne une sale réputation. Dans la rue, on te respecte ; ailleurs, on se méfie.`);
  }
}

// ---------- Héritage des grands-parents ----------
export function legsGrandParent(s, r) {
  if (s.age < 18) return 0;
  const parentVivant = s.relations.some((x) => x.vivant && x.lien === r.cote);
  const brut = Math.round(MILIEUX[s.milieu].heritage * (parentVivant ? 0.05 : 0.4) * (0.6 + rnd(0, 80) / 100));
  return Math.max(0, brut);
}
