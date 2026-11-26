// v0.11 « Banque & Immobilier » : livret, crédits avec échéancier, découvert, fichage, surendettement,
// assurances et gestion locative. Tout passe par s.money et s.banque, donc par le coffre-fort Hitman et son journal.
// Règle d'or : un crédit finance toujours un bien précis (jamais d'argent liquide), et la vente d'un bien
// financé rembourse d'abord la banque. Aucune richesse ne peut naître d'un emprunt.
import { rand } from './hitman.js';
import { rnd, pick, chance, clamp, euros } from './rng.js';
import { addLog, apply, registerFx, salary, career } from './core.js';
import { ASSETS, BUSINESS } from '../data/world.js';
import { HOUSING } from '../data/housing.js';
import { nameFor, surnameFor } from '../data/identity.js';

export const CREDITS = {
  immo: { nom: 'Crédit immobilier', taux: 0.036, durees: [10, 15, 20, 25], apport: 0.1, assur: 0.003 },
  auto: { nom: 'Crédit auto', taux: 0.062, durees: [2, 3, 4, 5, 6], apport: 0, max: 150000, assur: 0 },
  pro: { nom: 'Prêt professionnel', taux: 0.049, durees: [3, 5, 7, 10], apport: 0.2, assur: 0 },
};
export const LIVRET_PLAFOND = 23000;
const ENDETTEMENT_MAX = 0.35;
const VIDE = { epargne: 0, prets: [], fiche: 0, incidents: 0, assur: {}, enfants: {}, an: null };

export function migrateBank(s) {
  s.banque ??= { epargne: 0, prets: [], fiche: 0, incidents: 0, assur: { hab: false, auto: false }, enfants: {}, an: null };
  s.schema = Math.max(s.schema || 0, 11);
  return s;
}
// Lecture seule (affichage) : ne crée rien dans l'état
const bq = (s) => s.banque || VIDE;
const crise = (s) => ['recession', 'krach'].includes(s.eco?.phase);

export const dette = (s) => bq(s).prets.reduce((t, p) => t + p.reste, 0);
export const annuites = (s) => bq(s).prets.reduce((t, p) => t + p.annuite, 0);
const bizVal = (b) => (BUSINESS[b.type]?.startup ? Math.round(b.valo * (b.part ?? 100) / 100) : b.valo);
export const residence = (s) => (s.proprio && HOUSING[s.logement]?.achat) || 0;
export const actifs = (s) => Math.max(0, s.money) + bq(s).epargne + (s.bourse || 0) + s.biens.reduce((t, b) => t + b.valeur, 0) + s.business.reduce((t, b) => t + bizVal(b), 0) + residence(s);
// Patrimoine net : tout ce qu'on possède, moins tout ce qu'on doit (crédits et découvert)
export const patrimoineNet = (s) => actifs(s) - dette(s) + Math.min(0, s.money);
export const loyerDe = (b) => Math.round(((ASSETS[b.id]?.loc || 0) * b.valeur) / ASSETS[b.id].prix);
export const nomCourt = (b) => ASSETS[b.id]?.court || ASSETS[b.id]?.nom.toLowerCase() || 'bien';
const pretsSur = (s, k, id) => bq(s).prets.filter((p) => p.ref?.k === k && p.ref.id === id);

// Revenus retenus par la banque : salaire déclaré, pension, bénéfices, 70 % des loyers. Jamais l'argent sale.
export function revenuBancaire(s) {
  if (s.justice.prison > 0 || s.age < 18) return 0;
  const c = s.carriere ? career(s) : null;
  let r = (s.pension || 0) * 12;
  if (c && c.cat !== 'crime') r += salary(s) * 12 * ({ business: 0.55, artiste: 0.42, sport: 0.9 }[c.cat] ?? 1);
  r += s.business.reduce((t, b) => t + Math.max(0, b.benef || 0), 0);
  r += 0.7 * s.biens.reduce((t, b) => t + (b.loc?.loc ? loyerDe(b) : 0), 0);
  return Math.round(r);
}

// Note bancaire (0 à 100) : stabilité, épargne, incidents, endettement. Elle fixe le taux et l'acceptation.
export function scoreBancaire(s) {
  const b = bq(s);
  const rev = revenuBancaire(s);
  const c = s.carriere ? career(s) : null;
  let sc = 45;
  if (c && ['classique', 'police', 'militaire'].includes(c.cat)) sc += 12 + Math.min(10, (s.carriere.annees || 0) * 2);
  else if (c && c.cat !== 'crime') sc += 5;
  if (!rev) sc -= 15;
  if (c?.cat === 'crime') sc -= 25;
  sc += Math.min(15, Math.round(Math.log10(1 + b.epargne + Math.max(0, s.money)) * 3));
  sc -= b.incidents * 8;
  if (s.justice.casier.length) sc -= 8;
  if (rev > 0) sc -= Math.round(Math.max(0, annuites(s) / rev - 0.2) * 60);
  if (crise(s)) sc -= 8;
  if (b.fiche > 0) sc = Math.min(sc, 10);
  return clamp(Math.round(sc));
}
export const decouvertMax = (s) => (bq(s).fiche > 0 ? 0 : clamp(Math.round((revenuBancaire(s) / 24) / 100) * 100, 0, 5000));

// ---------- Offre de crédit (affichée avant signature) ----------
export function offre(s, type, prix, apport, duree) {
  const C = CREDITS[type];
  if (!C) return { ok: 'Type de crédit inconnu.' };
  const o = { type, prix: Math.round(prix), apport: Math.round(apport), duree, montant: Math.round(prix - apport) };
  const sc = scoreBancaire(s);
  o.score = sc;
  o.taux = Math.round((C.taux + (crise(s) ? 0.008 : s.eco?.phase === 'boom' ? -0.003 : 0) + (sc >= 75 ? -0.003 : sc < 45 ? 0.008 : 0)) * 10000) / 10000;
  const r = o.taux;
  o.annuiteHA = o.montant > 0 && duree > 0 ? Math.round((o.montant * r) / (1 - Math.pow(1 + r, -duree))) : 0;
  o.assur = Math.round(o.montant * C.assur);
  o.annuite = o.annuiteHA + o.assur;
  o.mensualite = Math.round(o.annuite / 12);
  o.cout = o.annuite * duree - o.montant;
  o.frais = Math.min(1500, Math.round(o.montant * 0.01));
  const rev = revenuBancaire(s);
  o.revenu = rev;
  o.endettement = rev ? (annuites(s) + o.annuite) / rev : Infinity;
  o.resteAVivre = Math.round((rev - annuites(s) - o.annuite) / 12);
  o.apportMin = Math.ceil(o.prix * C.apport);
  o.ok = refus(s, C, o) || true;
  return o;
}
function refus(s, C, o) {
  const b = bq(s);
  if (s.age < 18) return 'Il faut être majeur.';
  if (s.justice.prison > 0) return 'Aucune banque ne prête à un détenu.';
  if (s.id.statut === 'sans_papiers') return 'Sans titre de séjour, pas de crédit.';
  if (b.fiche > 0) return `Tu es fiché${s.id.genre === 'f' ? 'e' : ''} à la Banque de France encore ${b.fiche} an${b.fiche > 1 ? 's' : ''}.`;
  if (!C.durees.includes(o.duree)) return 'Durée non proposée.';
  if (!Number.isFinite(o.montant) || o.montant <= 0) return 'Rien à financer : paie comptant.';
  if (!Number.isFinite(o.apport) || o.apport < 0 || o.apport > Math.max(0, s.money)) return `Apport impossible : tu as ${euros(Math.max(0, s.money))} sur ton compte.`;
  if (o.apport < o.apportMin) return `Apport minimum : ${euros(o.apportMin)} (${Math.round(C.apport * 100)} % du prix).`;
  if (C.max && o.montant > C.max) return `Montant maximum : ${euros(C.max)}.`;
  if (s.age + o.duree > 75) return 'Le crédit doit être remboursé avant tes 75 ans.';
  if (b.prets.length >= 6) return 'Trop de crédits en cours.';
  if (!o.revenu) return 'Aucun revenu déclaré : la banque refuse.';
  if (o.score < 25) return `Dossier trop fragile (note bancaire ${o.score}/100).`;
  if (o.endettement > ENDETTEMENT_MAX) return `Endettement de ${Math.round(o.endettement * 100)} % : les banques s’arrêtent à 35 %.`;
  if (s.money - o.apport - o.frais < -decouvertMax(s)) return `Il te faut aussi ${euros(o.frais)} de frais de dossier.`;
  return null;
}
export function ouvrirPret(s, o, nom, ref) {
  migrateBank(s);
  const p = { uid: s.uid++, type: o.type, nom, ref, capital: o.montant, reste: o.montant, taux: o.taux, duree: o.duree, ans: o.duree, annuite: o.annuite, assur: o.assur, debut: s.age, retards: 0 };
  s.banque.prets.push(p);
  s.money -= o.frais;
  addLog(s, `${CREDITS[o.type].nom} signé : ${euros(o.montant)} sur ${o.duree} ans à ${(o.taux * 100).toFixed(2).replace('.', ',')} % (${euros(o.mensualite)}/mois). Frais de dossier : ${euros(o.frais)}.`);
  return p;
}

// ---------- Vente d'un bien financé : la banque est remboursée en premier ----------
// Renvoie le capital restant dû sur ce bien (0 s'il n'y a pas de crédit).
export const resteSur = (s, k, id) => pretsSur(s, k, id).reduce((t, p) => t + p.reste, 0);
export function solderSur(s, k, id) {
  const lst = pretsSur(s, k, id);
  if (!lst.length) return 0;
  const tot = lst.reduce((t, p) => t + p.reste, 0);
  s.banque.prets = s.banque.prets.filter((p) => !lst.includes(p));
  addLog(s, `Crédit soldé avec la vente : ${euros(tot)} remboursés à la banque.`);
  return tot;
}

export function rembourserAnticipe(s, uid) {
  const p = bq(s).prets.find((x) => x.uid === uid);
  if (!p) return { r: '', err: true };
  const ira = p.type === 'immo' ? Math.round(p.reste * 0.02) : Math.round(p.reste * 0.01);
  const total = p.reste + ira;
  if (s.money < total) return { r: `Il te faut ${euros(total)} (dont ${euros(ira)} d’indemnités).`, err: true };
  s.money -= total;
  s.banque.prets = s.banque.prets.filter((x) => x !== p);
  addLog(s, `Remboursement anticipé : ${p.nom} soldé (${euros(total)}, dont ${euros(ira)} d’indemnités).`);
  return { r: `${p.nom} soldé. Plus de mensualités !`, good: true };
}

// ---------- Livrets ----------
export function livret(s, montant) {
  migrateBank(s);
  const b = s.banque;
  montant = Math.trunc(Number(montant));
  if (!Number.isFinite(montant) || !montant) return { r: '', err: true };
  if (s.age < 18) return { r: 'Il faut être majeur.', err: true };
  if (montant > 0) {
    const m = Math.min(montant, Math.max(0, s.money), LIVRET_PLAFOND - b.epargne);
    if (m <= 0) return { r: b.epargne >= LIVRET_PLAFOND ? `Plafond du livret atteint (${euros(LIVRET_PLAFOND)}).` : 'Pas assez d’argent sur ton compte.', err: true };
    s.money -= m;
    b.epargne += m;
    return { r: `${euros(m)} placés sur ton livret.`, good: true };
  }
  const m = Math.min(-montant, b.epargne);
  if (m <= 0) return { r: 'Ton livret est vide.', err: true };
  b.epargne -= m;
  s.money += m;
  return { r: `${euros(m)} retirés de ton livret.`, good: true };
}
export function livretEnfant(s, rid, montant) {
  migrateBank(s);
  const k = s.relations.find((r) => r.id === rid && r.vivant && r.lien === 'enfant' && r.age < 18);
  montant = Math.trunc(Number(montant));
  if (!k || !(montant > 0)) return { r: '', err: true };
  const deja = s.banque.enfants[rid] || 0;
  const m = Math.min(montant, Math.max(0, s.money), LIVRET_PLAFOND - deja);
  if (m <= 0) return { r: 'Impossible pour l’instant.', err: true };
  s.money -= m;
  s.banque.enfants[rid] = deja + m;
  return { r: `${euros(m)} mis de côté pour ${k.prenom}.`, good: true };
}

// ---------- Assurances ----------
export const PRIME_HAB = { hlm: 150, appart: 220, maison: 380, villa: 1800 };
const SINISTRE_HAB = { hlm: 4000, appart: 7000, maison: 18000, villa: 90000 };
const voitures = (s) => s.biens.filter((b) => ASSETS[b.id]?.car);
export const locatifs = (s) => s.biens.filter((b) => ASSETS[b.id]?.loc);
export function primes(s) {
  const a = bq(s).assur || {};
  const logeHab = !s.chezParents && PRIME_HAB[s.logement];
  const hab = a.hab ? (logeHab ? PRIME_HAB[s.logement] : 0) + locatifs(s).length * 120 : 0;
  const v = voitures(s);
  const auto = a.auto && v.length ? 500 * v.length + Math.round(v.reduce((t, b) => t + b.valeur, 0) * 0.015) : 0;
  return { hab, auto, total: hab + auto };
}
export function basculerAssurance(s, k) {
  migrateBank(s);
  if (!['hab', 'auto'].includes(k)) return { r: '', err: true };
  if (s.age < 18) return { r: 'Il faut être majeur.', err: true };
  s.banque.assur[k] = !s.banque.assur[k];
  const nom = k === 'hab' ? 'Assurance habitation' : 'Assurance auto';
  return { r: `${nom} ${s.banque.assur[k] ? 'souscrite' : 'résiliée'}.`, good: s.banque.assur[k] };
}

// ---------- Gestion locative ----------
export function travaux(s, uid) {
  const b = s.biens.find((x) => x.uid === uid && ASSETS[x.id]?.loc);
  if (!b) return { r: '', err: true };
  b.loc ??= { loc: null, etat: 80, impaye: 0 };
  if (b.loc.etat >= 90) return { r: 'Le bien est déjà en très bon état.', err: true };
  const cout = Math.round(b.valeur * 0.04);
  if (s.money < cout) return { r: `Il te faut ${euros(cout)}.`, err: true };
  s.money -= cout;
  b.loc.etat = 100;
  b.valeur = Math.round(b.valeur * 1.02);
  addLog(s, `Travaux dans ton ${nomCourt(b)} : ${euros(cout)}.`);
  return { r: 'Travaux terminés : bien remis à neuf, valeur en hausse.', good: true };
}
function immoTick(s, an) {
  let impayeQueued = false;
  for (const b of locatifs(s)) {
    const L = (b.loc ??= { loc: null, etat: 85, impaye: 0 });
    L.etat = clamp(L.etat - rnd(2, 6));
    const loyer = loyerDe(b);
    let recu = 0;
    if (!L.loc) {
      if (chance((L.etat >= 40 ? 0.75 : 0.25) * (crise(s) ? 0.75 : 1))) {
        L.loc = `${nameFor(pick(['france', 'maghreb', 'portugal', 'afrique_ouest', 'asie']), pick(['h', 'f']))} ${surnameFor(pick(['france', 'maghreb', 'portugal']))}`;
        recu = Math.round(loyer / 2);
        addLog(s, `Nouveau locataire dans ton ${nomCourt(b)} : ${L.loc}.`);
      } else an.vacants++;
    } else if (chance(0.1 + (L.etat < 40 ? 0.3 : 0))) {
      addLog(s, `${L.loc} quitte ton ${nomCourt(b)}${L.etat < 40 ? ' : le logement est en trop mauvais état' : ''}.`);
      L.loc = null;
      recu = Math.round(loyer / 2);
    } else if (!impayeQueued && chance(0.05 * (crise(s) ? 2 : 1))) {
      L.impaye += loyer;
      impayeQueued = true;
      s.banque.cibleLoc = b.uid;
      s.queue.push('loc_impaye');
    } else recu = loyer;
    const charges = Math.round(b.valeur * 0.012);
    let sinistre = 0;
    if (chance(0.03)) {
      const cout = Math.round(b.valeur * (0.02 + rand() * 0.03));
      sinistre = s.banque.assur.hab ? 300 : cout;
      addLog(s, `Dégât des eaux dans ton ${nomCourt(b)} : ${euros(cout)}${s.banque.assur.hab ? ', pris en charge par l’assurance (franchise de 300 €)' : ', sans assurance'}.`);
      L.etat = clamp(L.etat - 15);
    }
    b.loc.dernier = { recu, charges: charges + sinistre };
    an.loyers += recu;
    an.charges += charges + sinistre;
    s.money += recu - charges - sinistre;
  }
}

// ---------- Défaut de paiement ----------
function recalcule(p) {
  const r = p.taux;
  p.annuite = Math.max(1, Math.round(r > 0 ? (p.reste * r) / (1 - Math.pow(1 + r, -Math.max(1, p.ans))) : p.reste / Math.max(1, p.ans)) + (p.assur || 0));
}
function defaut(s, p) {
  const b = s.banque;
  b.fiche = Math.max(b.fiche, 5);
  let recup = 0;
  let quoi = '';
  if (p.ref?.k === 'bien') {
    const i = s.biens.findIndex((x) => x.uid === p.ref.id);
    if (i >= 0) {
      recup = Math.round(s.biens[i].valeur * 0.75);
      quoi = ASSETS[s.biens[i].id].nom;
      s.biens.splice(i, 1);
    }
  } else if (p.ref?.k === 'logement' && s.proprio && s.logement === p.ref.id) {
    recup = Math.round(HOUSING[s.logement].achat * 0.75);
    quoi = HOUSING[s.logement].nom;
    s.proprio = false;
    s.logement = s.id.statut === 'sans_papiers' ? 'foyer' : 'hlm';
    s.chezParents = false;
  }
  if (quoi) addLog(s, `Saisie : ${quoi} vendu${quoi.endsWith('e') ? 'e' : ''} aux enchères (${euros(recup)}) pour rembourser la banque.`);
  p.reste -= recup;
  if (p.reste <= 0) {
    s.money += -p.reste;
    b.prets = b.prets.filter((x) => x !== p);
  } else {
    p.retards = 0;
    recalcule(p);
  }
  s.stats.bonheur = clamp(s.stats.bonheur - 10);
  apply(s, { sms: { from: 'Ta banque', role: 'Banque', txt: `Après deux échéances impayées, ton dossier passe au contentieux. Tu es inscrit${s.id.genre === 'f' ? 'e' : ''} au fichier des incidents de crédit pour 5 ans.` } });
}

// ---------- Tour de banque annuel (après les revenus et dépenses de l'année) ----------
export function bankTick(s, rep = {}) {
  migrateBank(s);
  const b = s.banque;
  const an = { interets: 0, echeances: 0, primes: 0, sinistres: 0, agios: 0, loyers: 0, charges: 0, vacants: 0 };
  b.fiche = Math.max(0, b.fiche - 1);
  b.incidents = Math.max(0, b.incidents - 1);
  if (s.age < 18) return (b.an = an);
  const taux = crise(s) ? 0.02 : 0.03;
  an.interets = Math.round(b.epargne * taux);
  b.epargne += an.interets;
  for (const id of Object.keys(b.enfants)) {
    const k = s.relations.find((r) => r.id === Number(id));
    const m = b.enfants[id];
    if (!k || !k.vivant) {
      s.money += m;
      delete b.enfants[id];
    } else if (k.age >= 18) {
      delete b.enfants[id];
      k.rel = clamp(k.rel + 6);
      addLog(s, `${k.prenom} a 18 ans et récupère le livret que tu lui as constitué : ${euros(m)}.`);
    } else b.enfants[id] = m + Math.round(m * taux);
  }
  immoTick(s, an);
  // Échéances : chacune n'est prélevée qu'une fois par an
  for (const p of [...b.prets]) {
    if (s.money - p.annuite >= -decouvertMax(s)) {
      s.money -= p.annuite;
      an.echeances += p.annuite;
      const interets = Math.round(p.reste * p.taux);
      p.reste = Math.max(0, p.reste - (p.annuite - (p.assur || 0) - interets));
      p.ans--;
      if (p.ans <= 0 || p.reste < 1) {
        b.prets = b.prets.filter((x) => x !== p);
        addLog(s, `Dernière échéance : ${p.nom} entièrement remboursé.`);
      }
    } else {
      p.retards++;
      b.incidents++;
      p.reste += Math.round(p.reste * p.taux + p.annuite * 0.05);
      p.ans++;
      recalcule(p);
      addLog(s, `Échéance impayée : ${p.nom} (${euros(p.annuite)}).`);
      if (p.retards >= 2) defaut(s, p);
      else apply(s, { sms: { from: 'Ta banque', role: 'Banque', txt: `Ton échéance de ${euros(p.annuite)} pour ${p.nom} n’a pas pu être prélevée. Régularise avant l’an prochain pour éviter le contentieux.` } });
    }
  }
  // Assurances : primes et sinistres
  const pr = primes(s);
  if (pr.total) {
    s.money -= pr.total;
    an.primes = pr.total;
  }
  const loge = !s.chezParents && SINISTRE_HAB[s.logement];
  if (loge && chance(0.04)) {
    const cout = Math.round(SINISTRE_HAB[s.logement] * (0.5 + rand()));
    const paye = b.assur.hab ? 300 : cout;
    s.money -= paye;
    an.sinistres += paye;
    addLog(s, `${pick(['Dégât des eaux', 'Cambriolage', 'Début d’incendie'])} chez toi : ${euros(cout)} de dégâts${b.assur.hab ? ', remboursés par ton assurance (franchise 300 €)' : '. Sans assurance, tout est pour toi'}.`);
  }
  const v = voitures(s);
  if (v.length && chance(0.06 * (s.traits?.includes('impulsif') ? 1.5 : 1))) {
    const car = pick(v);
    const cout = Math.round(car.valeur * (0.2 + rand() * 0.5));
    const paye = b.assur.auto ? 500 : cout;
    s.money -= paye;
    an.sinistres += paye;
    addLog(s, `Accident avec ta ${ASSETS[car.id].nom.toLowerCase()} : ${euros(cout)} de réparations${b.assur.auto ? ', couvertes par l’assurance (franchise 500 €)' : ', à tes frais'}.`);
  } else if (v.length && !b.assur.auto && chance(0.05)) {
    s.money -= 750;
    an.sinistres += 750;
    addLog(s, 'Contrôle routier : défaut d’assurance, 750 € d’amende.');
  }
  // Découvert : agios, incidents, fichage
  if (s.money < 0) {
    an.agios = Math.round(-s.money * 0.12);
    s.money -= an.agios;
    if (s.money < -decouvertMax(s)) {
      b.incidents++;
      s.money -= 150;
      an.agios += 150;
    }
  }
  if (b.incidents >= 3 && !b.fiche) {
    b.fiche = 2;
    addLog(s, 'Trop d’incidents de paiement : tu es fiché{e} à la Banque de France pour 2 ans.');
  }
  // Surendettement : proposé quand les dettes deviennent ingérables
  const rev = revenuBancaire(s);
  const ingerable = b.prets.some((p) => p.retards > 0) || (dette(s) > 0 && annuites(s) > rev * 0.6 && s.money < annuites(s));
  if (ingerable && s.age - (b.surAn ?? -99) >= 4) {
    b.surAn = s.age;
    s.queue.push('surendettement');
  }
  b.an = an;
  rep.revenus = (rep.revenus || 0) + an.interets + an.loyers;
  rep.depenses = (rep.depenses || 0) + an.echeances + an.primes + an.sinistres + an.agios + an.charges;
  const parts = [an.echeances && `crédits ${euros(an.echeances)}`, an.primes && `assurances ${euros(an.primes)}`, an.loyers && `loyers perçus ${euros(an.loyers)}`, an.interets && `intérêts du livret ${euros(an.interets)}`, an.agios && `agios ${euros(an.agios)}`].filter(Boolean);
  if (parts.length) addLog(s, `Banque : ${parts.join(', ')}.`);
  return an;
}

// ---------- Surendettement : plan ou rétablissement personnel ----------
registerFx('surendettement', (s, mode) => {
  const b = s.banque;
  if (!b) return;
  if (mode === 'plan') {
    for (const p of b.prets) {
      p.taux = 0;
      p.ans = Math.max(p.ans, 7);
      p.assur = 0;
      p.retards = 0;
      recalcule(p);
    }
    b.fiche = Math.max(b.fiche, 7);
    s.trainDeVie = 'modeste';
    addLog(s, 'Plan de surendettement : intérêts supprimés, échéances étalées sur 7 ans au moins, train de vie modeste imposé.');
  } else if (mode === 'faillite') {
    // Liquidation : tout ce qui a de la valeur est vendu, le reste des dettes est effacé
    let total = Math.max(0, s.money) + b.epargne + (s.bourse || 0);
    total += s.biens.reduce((t, x) => t + Math.round(x.valeur * 0.75), 0) + s.business.reduce((t, x) => t + Math.round(bizVal(x) * 0.5), 0) + Math.round(residence(s) * 0.75);
    const du = dette(s) + Math.max(0, -s.money);
    const efface = Math.max(0, du - total);
    s.money = Math.max(0, total - du);
    b.epargne = 0;
    s.bourse = 0;
    s.biens = [];
    s.business = [];
    if (s.proprio) {
      s.proprio = false;
      s.logement = s.id.statut === 'sans_papiers' ? 'foyer' : 'hlm';
    }
    b.prets = [];
    b.fiche = Math.max(b.fiche, 5);
    s.stats.bonheur = clamp(s.stats.bonheur - 10);
    addLog(s, `Rétablissement personnel : tes biens sont vendus, ${euros(efface)} de dettes effacés. Fiché{e} 5 ans.`);
  }
});

// Impayé d'un locataire
registerFx('locImpaye', (s, mode) => {
  const b = s.biens.find((x) => x.uid === s.banque?.cibleLoc);
  if (!b?.loc) return;
  const du = b.loc.impaye || 0;
  if (mode === 'procedure') {
    s.money -= 1500;
    if (chance(0.6)) {
      s.money += Math.round(du * 0.5);
      addLog(s, `Procédure gagnée : ${b.loc.loc} est expulsé et rembourse ${euros(Math.round(du * 0.5))}.`);
    } else addLog(s, `Procédure : ${b.loc.loc} part sans payer. Les impayés sont perdus.`);
    b.loc.loc = null;
    b.loc.impaye = 0;
  } else if (mode === 'arrangement') {
    s.money += Math.round(du * 0.4);
    b.loc.impaye = 0;
    addLog(s, `Arrangement avec ${b.loc.loc} : ${euros(Math.round(du * 0.4))} récupérés, il reste dans les lieux.`);
  }
});

// ---------- Succession : les dettes sont réglées avant l'héritage ----------
// Crédits immobiliers : soldés par l'assurance emprunteur. Autres dettes : payées sur l'épargne et le compte,
// puis par la vente des biens. Si l'actif ne suffit pas, le reste est éteint (succession à concurrence de l'actif).
export function succession(s) {
  migrateBank(s);
  const b = s.banque;
  const res = { assurance: 0, dettes: 0, vendus: 0, eteint: 0 };
  s.money += b.epargne;
  b.epargne = 0;
  for (const p of b.prets) if (p.type === 'immo') res.assurance += p.reste;
  let du = b.prets.filter((p) => p.type !== 'immo').reduce((t, p) => t + p.reste, 0);
  b.prets = [];
  res.dettes = du;
  s.money -= du;
  while (s.money < 0 && s.biens.length) {
    const x = s.biens.sort((a, c) => c.valeur - a.valeur).shift();
    const v = Math.round(x.valeur * 0.9);
    s.money += v;
    res.vendus += v;
  }
  if (s.money < 0) {
    res.eteint = -s.money;
    s.money = 0;
  }
  return res;
}
