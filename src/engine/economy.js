// Systèmes « open world business » : biens, entreprises, contacts, réseau, voyages, cavale, casino, téléphone.
import { rand } from './hitman.js';
import { rnd, pick, chance, clamp, euros } from './rng.js';
import { addLog, apply, newPerson, career, tpl, registerFx } from './core.js';
import { ASSETS, BUSINESS, ROLES, DESTS, MISSIONS } from '../data/world.js';
import { migrateBank, resteSur, solderSur } from './bank.js';
import { SECTEURS, PRIX, decisionSecteur } from './sectors.js';
// Start-up : modèle de revenus (v0.13)
export const MODELES = { freemium: { nom: 'Freemium', mrr: 0.9, g: 0 }, abonnement: { nom: 'Abonnement payant', mrr: 1.6, g: -0.12 }, pub: { nom: 'Gratuit avec publicité', mrr: 0.5, g: 0.1 } };
import { nameFor, surnameFor, ORIGINES, VILLES } from '../data/identity.js';

const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
export const adult = (s) => s.age >= 18;
const inPrison = (s) => s.justice.prison > 0;

// Ajoute les champs V2 aux anciennes sauvegardes.
export function migrate(s) {
  s.biens ??= [];
  s.business ??= [];
  s.reseau ??= null;
  s.phone ??= { msgs: [], unread: 0 };
  s.voyage ??= null;
  s.cavale ??= null;
  s.securite ??= 0;
  s.sale ??= 0;
  s.annee ??= { sport: 0, medecin: 0 };
  s.avec ??= [];
  s.casino ??= { perdu: 0, gagne: 0 };
  migrateBank(s);
  return s;
}

// ---------- Téléphone ----------
export function sms(s, from, txt, role = '') {
  s.phone.msgs.push({ from, role, txt: tpl(txt, s), age: s.age, t: s.t, read: true });
  if (s.phone.msgs.length > 200) s.phone.msgs.splice(0, s.phone.msgs.length - 200);
}
export function readAll(s, from) {
  s.phone.msgs.forEach((m) => (!from || m.from === from) && (m.read = true));
  s.phone.unread = s.phone.msgs.filter((m) => !m.read).length;
}

// Messages d'ambiance de l'année : la famille, les potes, les contacts.
export function flavorSms(s) {
  if (s.age < 11) return;
  const mere = s.relations.find((r) => r.vivant && r.lien === 'mere');
  const ami = s.relations.find((r) => r.vivant && r.lien === 'ami');
  const p = s.relations.find((r) => r.vivant && (r.lien === 'partenaire' || r.lien === 'conjoint'));
  if (mere && chance(0.5)) sms(s, mere.prenom, pick(['T’as mangé ? Appelle ta mère de temps en temps 🙏', 'Bon anniversaire mon cœur ❤️ Je suis fière de toi.', 'Ton cousin s’est marié, t’étais où ??', 'Range ta chambre. Bisous.']), 'Mère');
  if (ami && chance(0.5)) sms(s, ami.prenom, pick(['Wesh t’es où ce soir ?', 'Frérot faut qu’on parle d’un plan…', 'T’as vu ce qui s’est passé au quartier ?', 'Ce week-end on sort, pas de discussion.']), 'Ami');
  if (p && chance(0.5)) sms(s, p.prenom, pick(['Tu rentres à quelle heure ?', 'Je t’aime ❤️', 'On doit parler.', 'J’ai réservé un resto pour ce soir 😏']), 'Couple');
  if (s.reseau && chance(0.6)) sms(s, 'Le petit du bâtiment C', pick(['Ça tourne bien au point, mais y’a des têtes bizarres ce matin.', 'Les keufs ont fait 3 passages aujourd’hui. On ferme ?', 'Le fournisseur a appelé, le prix monte.']), 'Réseau');
  if (s.money > 500000 && chance(0.4)) sms(s, 'Numéro inconnu', pick(['On sait où tu habites. Prépare 50 000 €.', 'Salut beau gosse, on s’est vus au club ? 😘', 'Placement exclusif, rendement 40 %, appelle-moi.']), '');
}

// ---------- Conjoncture : l'économie a des cycles (croissance, récession, krach) ----------
// mult : demande des commerces · val : valorisations des start-ups · fund : facilité à lever des fonds
// art : variation des biens de collection · bourse : rendement moyen des actions
export const ECO = {
  boom: { nom: 'Boom économique', mult: 1.12, val: 1.35, fund: 1.4, art: 0.06, bourse: 0.16 },
  croissance: { nom: 'Croissance', mult: 1.05, val: 1.1, fund: 1.15, art: 0.03, bourse: 0.08 },
  stable: { nom: 'Économie stable', mult: 1, val: 1, fund: 1, art: 0, bourse: 0.04 },
  recession: { nom: 'Récession', mult: 0.86, val: 0.7, fund: 0.55, art: -0.06, bourse: -0.1 },
  krach: { nom: 'Krach boursier', mult: 0.74, val: 0.5, fund: 0.3, art: -0.2, bourse: -0.32 },
};
const NEXT = {
  boom: [['boom', 35], ['croissance', 30], ['krach', 20], ['recession', 15]],
  croissance: [['croissance', 45], ['boom', 18], ['stable', 25], ['recession', 12]],
  stable: [['stable', 48], ['croissance', 30], ['recession', 14], ['krach', 8]],
  recession: [['recession', 45], ['stable', 35], ['croissance', 15], ['krach', 5]],
  krach: [['recession', 70], ['stable', 30]],
};
export const eco = (s) => ECO[s.eco?.phase || 'stable'];
function ecoTick(s) {
  s.eco ??= { phase: 'stable', ans: 0, hist: [] };
  const prev = s.eco.phase;
  const opts = NEXT[prev];
  let r = rand() * 100;
  let next = opts[opts.length - 1][0];
  for (const [k, w] of opts) { if ((r -= w) <= 0) { next = k; break; } }
  s.eco.phase = next;
  s.eco.ans = next === prev ? s.eco.ans + 1 : 0;
  s.eco.hist.push({ age: s.age, phase: next });
  if (s.eco.hist.length > 12) s.eco.hist.shift();
  // Bourse
  if (s.bourse > 0) {
    const rend = ECO[next].bourse + gauss() * 0.12;
    const avant = s.bourse;
    s.bourse = Math.max(0, Math.round(s.bourse * (1 + rend)));
    s.bourseRend = Math.round(rend * 1000) / 10;
    addLog(s, `Bourse : ${rend >= 0 ? '+' : ''}${s.bourseRend} % (${euros(s.bourse - avant)}).`);
  }
  if (next === prev || s.age < 18) return;
  const expose = s.business.length || s.bourse > 0 || s.money > 80000 || s.biens.some((b) => ASSETS[b.id].cat !== 'Voiture');
  if (next === 'krach' && expose) s.queue.push('krach_boursier');
  else if (next === 'recession' && s.business.length) s.queue.push('recession_eco');
  else if (next === 'boom') addLog(s, 'L’économie s’emballe : boom économique.');
}
export function bourseAction(s, act, montant) {
  if (!adult(s)) return { r: 'Il faut être majeur pour ouvrir un compte-titres.', err: true };
  s.bourse ||= 0;
  if (act === 'placer') {
    if (inPrison(s)) return { r: 'Impossible en détention.', err: true };
    const m = Math.floor(montant === 'tout' ? Math.max(0, s.money) : Math.min(Number(montant), s.money));
    if (!Number.isFinite(m) || m <= 0) return { r: 'Pas assez d’argent sur ton compte.', err: true };
    s.money -= m;
    s.bourse += m;
    return { r: `${euros(m)} placés en bourse. Ça peut monter… ou chuter.`, good: true };
  }
  if (s.bourse <= 0) return { r: 'Tu n’as rien en bourse.', err: true };
  const m = s.bourse;
  s.money += m;
  s.bourse = 0;
  return { r: `Tu retires ${euros(m)} de la bourse.`, good: true };
}

// ---------- Biens ----------
export function buyAsset(s, id) {
  const a = Object.hasOwn(ASSETS, id) ? ASSETS[id] : null;
  if (!a) return { r: '', err: true };
  if (!adult(s)) return { r: 'Tu es mineur : pas de compte en banque.', err: true };
  if (inPrison(s)) return { r: 'Impossible en détention.', err: true };
  if (s.money < a.prix) return { r: `Il te faut ${euros(a.prix)}.`, err: true };
  s.money -= a.prix;
  const bien = { uid: s.uid++, id, valeur: a.prix, achat: a.prix, depuis: s.age };
  if (a.loc) bien.loc = { loc: null, etat: 85, impaye: 0 };
  s.biens.push(bien);
  addLog(s, `Achat : ${a.nom} (${euros(a.prix)}).`);
  if (ASSETS[id].car) s.avec = [];
  return { r: `${a.nom} acheté${a.cat === 'Voiture' ? 'e' : ''} !`, good: true, uid: bien.uid };
}
export function sellAsset(s, uid) {
  const i = s.biens.findIndex((b) => b.uid === uid);
  if (i < 0) return { r: '', err: true };
  const b = s.biens[i];
  const rec = s.relations.find((r) => r.vivant && r.role === 'receleur');
  // Frais de revente : un marchand prend sa commission (voitures 15 %, art et bijoux 10 %)
  const frais = ASSETS[b.id].car ? 0.85 : ASSETS[b.id].loc ? 0.94 : 0.9;
  const bonus = rec && b.depuis < s.age && !ASSETS[b.id].loc;
  const prix = Math.round(b.valeur * frais * (bonus ? 1.15 : 1));
  // Bien financé à crédit : la banque est remboursée en premier sur le prix de vente
  const du = resteSur(s, 'bien', b.uid);
  if (du && s.money + prix < du) return { r: `La vente (${euros(prix)}) ne couvre pas ton crédit (${euros(du)} restants).`, err: true };
  s.money += prix - (du ? solderSur(s, 'bien', b.uid) : 0);
  s.biens.splice(i, 1);
  addLog(s, `Vente : ${ASSETS[b.id].nom} pour ${euros(prix)}.`);
  return { r: `Vendu ${euros(prix)} (${prix >= b.achat ? '+' : ''}${euros(prix - b.achat)})${bonus ? ' · +15 % grâce à ton receleur' : ' · commission du marchand déduite'}.`, good: prix >= b.achat };
}
export const bestCar = (s) => s.biens.filter((b) => ASSETS[b.id].car).sort((a, b) => b.valeur - a.valeur)[0];
export const bizValue = (b) => (BUSINESS[b.type].startup ? Math.round(b.valo * (b.part ?? 100) / 100) : b.valo);
export const patrimoine = (s) => s.biens.reduce((t, b) => t + b.valeur, 0) + s.business.reduce((t, b) => t + bizValue(b), 0) + (s.bourse || 0) + (s.banque?.epargne || 0);

function assetsTick(s) {
  const E = eco(s);
  for (const b of s.biens) {
    const a = ASSETS[b.id];
    const cycle = a.car && b.id !== 'collection' ? 0 : a.cat === 'Immobilier' ? E.art * 0.4 : E.art;
    b.valeur = Math.max(Math.round(a.prix * 0.05), Math.round(b.valeur * (1 + a.tend + cycle + gauss() * a.vol)));
  }
}

// ---------- Entreprises ----------
// Commerce : CA = base × niveau^0,85 × demande ; bénéfice = CA × marge brute − charges fixes (loyer, salaires).
// Agrandir augmente le CA mais aussi les charges : ça ne rapporte que si la réputation et l'économie suivent.
// Start-up : qualité cachée du produit (la plupart échouent), levées de fonds qui diluent ta part.
export function createBusiness(s, type, nom) {
  const B = Object.hasOwn(BUSINESS, type) ? BUSINESS[type] : null;
  if (!B) return { r: '', err: true };
  if (!adult(s)) return { r: 'Il faut être majeur.', err: true };
  if (s.justice.prison > 0) return { r: 'Impossible depuis la prison.', err: true };
  if (B.cond) {
    const ok = B.cond(s);
    if (ok !== true) return { r: ok, err: true };
  }
  if (s.business.length >= 3) return { r: 'Trois entreprises, c’est déjà beaucoup à gérer seul.', err: true };
  if (s.money < B.prix) return { r: `Il te faut ${euros(B.prix)}.`, err: true };
  s.money -= B.prix;
  const b = { uid: s.uid++, type, nom: nom || `${B.nom} ${s.id.nom}`, niveau: 1, rep: 45 + rnd(0, 10), emp: B.emp, ca: 0, benef: 0, valo: Math.round(B.prix * 0.6), investi: B.prix, annees: 0, hist: [], lave: 0, pertes: 0 };
  SECTEURS[type]?.init(b);
  if (B.startup) {
    const q = Math.min(1, Math.max(0, rand() ** 1.8 + (s.stats.intel - 50) / 400));
    Object.assign(b, { q, users: 1500, mrr: 0, burn: 9000, cash: 110000, valo: 30000, part: 100, tour: 0, g: 0 });
  }
  s.business.push(b);
  addLog(s, `Ouverture : ${b.nom}.`);
  return { uid: b.uid, r: B.startup ? `${b.nom} est lancée, avec 80 000 € de « love money » de tes proches en plus de ta mise. 9 start-ups sur 10 ne passent pas 5 ans…` : `${b.nom} ouvre ses portes ! Les premières années sont les plus dures.`, good: true };
}

export function businessAction(s, uid, act) {
  const b = s.business.find((x) => x.uid === uid);
  if (!b) return { r: '', err: true };
  const B = BUSINESS[b.type];
  // v0.13 : décisions propres au secteur, positionnement prix, modèle de revenus d'une start-up
  const [a0, a1, a2] = String(act).split(':');
  if (a0 === 'sx') return decisionSecteur(s, b, a1, a2);
  if (a0 === 'prix' && !B.startup && Object.hasOwn(PRIX, a1)) {
    b.px = PRIX[a1].k;
    return { r: `${PRIX[a1].nom} chez ${b.nom}.`, good: true };
  }
  if (a0 === 'modele' && B.startup && Object.hasOwn(MODELES, a1)) {
    b.modele = a1;
    return { r: `Nouveau modèle : ${MODELES[a1].nom.toLowerCase()}.`, good: true };
  }
  const pay = (c) => {
    if (s.money < c) return false;
    s.money -= c;
    return true;
  };
  switch (act) {
    case 'investir': {
      if (b.investiAn === s.age) return { r: 'Un agrandissement par an : il faut le temps que ça tourne.', err: true };
      const c = Math.round(B.prix * 0.6 * b.niveau);
      if (!pay(c)) return { r: `Il te faut ${euros(c)}.`, err: true };
      b.investiAn = s.age;
      b.niveau++;
      b.investi += c;
      b.emp += Math.ceil(B.emp / 2);
      if (B.startup) { b.cash += c; return { r: `Tu recrutes. Niveau ${b.niveau} : plus de dépenses, plus de vitesse… si le produit plaît.`, good: true }; }
      return { r: `Agrandissement : niveau ${b.niveau}. Plus de clients possibles, mais plus de charges. Rentable seulement si la demande suit.`, good: true };
    }
    case 'marketing': {
      if (b.pubAn === s.age) return { r: 'Tu as déjà lancé une campagne cette année.', err: true };
      const c = 8000 * b.niveau;
      if (!pay(c)) return { r: `Il te faut ${euros(c)}.`, err: true };
      b.pubAn = s.age;
      const gain = Math.round(rnd(4, 12) * (1 - b.rep / 120));
      b.rep = clamp(b.rep + gain);
      if (B.startup) {
        const k = 1 + (0.05 + b.q * 0.35) * (0.6 + rand() * 0.8);
        b.users = Math.round(b.users * k);
        return { r: b.q < 0.25 ? 'Les inscriptions montent… puis repartent. Le produit ne retient pas les gens.' : 'La campagne amène du monde.', good: b.q >= 0.25 };
      }
      return { r: `Campagne lancée : réputation +${gain}.`, good: true };
    }
    case 'blanchir': {
      const cap = B.lav * b.niveau - b.lave;
      const m = Math.min(cap, s.sale);
      if (m <= 0) return { r: cap <= 0 ? 'Capacité de blanchiment atteinte cette année.' : 'Tu n’as pas d’argent sale à blanchir.', err: true };
      s.sale -= m;
      b.lave += m;
      s.flags.compta_creative = true;
      s.justice.recherche = Math.max(0, s.justice.recherche - (m > 30000 ? 1 : 0));
      if (chance(B.startup ? 0.12 : 0.06)) {
        apply(s, { arrest: { motif: 'Blanchiment d’argent', peine: [1, 4] } });
        return { r: B.startup ? 'Tes « investisseurs » n’existent pas. Tracfin a vérifié…' : 'Un contrôle URSSAF tombe pile ce jour-là…', err: true };
      }
      return { r: B.startup ? `${euros(m)} blanchis via de faux investisseurs dans ${b.nom}. Plus risqué qu’un resto.` : `${euros(m)} blanchis via ${b.nom}.`, good: true };
    }
    case 'vendre': {
      const prix = Math.round(bizValue(b) * (0.88 + rand() * 0.14));
      // Prêt professionnel : remboursé sur le prix de cession (s'il ne suffit pas, le reste est dû sur ton compte)
      s.money += prix - solderSur(s, 'biz', b.uid);
      s.business = s.business.filter((x) => x !== b);
      addLog(s, `Revente de ${b.nom} : ${euros(prix)}.`);
      return { r: `${b.nom} vendu ${euros(prix)}${B.startup && b.part < 100 ? ` (tu détenais ${Math.round(b.part)} %)` : ''}.`, good: prix >= b.investi };
    }
    case 'lever': {
      if (!B.startup) return { r: '', err: true };
      if (b.leveAn === s.age) return { r: 'Tu as déjà tenté une levée de fonds cette année.', err: true };
      if (s.energie <= 0) return { r: 'Plus d’énergie cette année.', err: true };
      s.energie--;
      b.leveAn = s.age;
      const p = Math.min(0.8, Math.max(0.04, 0.08 + Math.max(0, b.g) * 0.9 + b.rep / 600 + (s.stats.charisme - 50) / 400) * eco(s).fund);
      if (chance(p)) {
        const m = Math.min(60000000, Math.round(b.valo * (0.18 + rand() * 0.1)));
        b.part = Math.round(b.part * (b.valo / (b.valo + m)) * 10) / 10;
        b.valo += m;
        b.cash += m;
        b.tour++;
        const T = ['d’amorçage', 'de série A', 'de série B', 'de série C', 'de série D'][Math.min(4, b.tour - 1)];
        return { r: `Levée ${T} réussie : ${euros(m)} ! Tu ne détiens plus que ${Math.round(b.part)} % de ta boîte.`, good: true };
      }
      return { r: b.g < 0.1 ? 'Les investisseurs veulent voir de la croissance. Là, ça stagne.' : 'Les investisseurs ne sont pas convaincus. Peut-être l’an prochain.', err: true };
    }
  }
  return { r: '' };
}

function faillite(s, b, txt) {
  s.business = s.business.filter((x) => x !== b);
  addLog(s, txt);
  if (resteSur(s, 'biz', b.uid)) addLog(s, `Tu t’étais porté{e} caution : le prêt professionnel de ${b.nom} reste à rembourser.`);
  s.stats.bonheur = clamp(s.stats.bonheur - 12);
  sms(s, 'Le mandataire judiciaire', `Liquidation judiciaire de ${b.nom}. Les actifs sont vendus pour payer les créanciers.`, 'Business');
}

const BIZ_EVENTS = ['biz_assurance', 'biz_concurrent', 'biz_bad_buzz', 'biz_vol_gerant', 'biz_prudhommes', 'biz_greve', 'biz_compta', 'biz_incendie', 'biz_rachat', 'biz_controle', 'biz_hygiene', 'biz_fournisseur'];
const SU_EVENTS = ['su_pivot', 'su_faille', 'su_cto', 'su_rachat'];
export function businessTick(s) {
  const E = eco(s);
  for (const b of [...s.business]) {
    const B = BUSINESS[b.type];
    // Anciennes sauvegardes (avant v0.8)
    b.investi ??= Math.round(B.prix * (1 + 0.3 * b.niveau * (b.niveau - 1)));
    b.pertes ??= 0;
    if (B.startup) { b.q ??= 0.35; b.part ??= 100; b.tour ??= 0; }
    b.annees++;
    b.lave = 0;
    if (B.startup) {
      const pot = 40000 + b.q * b.q * 2500000;
      b.g = Math.round(((-0.15 + (MODELES[b.modele]?.g || 0) + b.q * 1.45 + (b.rep - 50) / 300 + (s.stats.intel - 50) / 400 + gauss() * 0.3) * (0.7 + 0.3 * E.mult)) * 100) / 100;
      b.users = Math.max(50, Math.round(b.users * (1 + b.g * Math.max(0, 1 - b.users / pot))));
      b.mrr = Math.round(b.users * (MODELES[b.modele]?.mrr ?? 0.9));
      b.burn = Math.round(6000 + b.emp * 3800 + b.users * 0.12);
      b.cash += (b.mrr - b.burn) * 12;
      b.ca = b.mrr * 12;
      b.benef = (b.mrr - b.burn) * 12;
      const mult = Math.min(16, Math.max(1.5, 4 + b.g * 12));
      b.valo = Math.max(Math.round(b.cash * 0.3), 20000, Math.round(b.ca * mult * E.val));
      b.rep = clamp(b.rep + rnd(-5, 4));
      if (b.cash < 0) { faillite(s, b, `${b.nom} fait faillite : plus de trésorerie.`); continue; }
    } else {
      const S = SECTEURS[b.type];
      if (S) {
        // Modèle sectoriel : ventes, capacité et chaque coût sont visibles dans le compte de résultat
        if (!b.sx) S.init(b);
        const r = S.annee(s, b, E);
        if (b.assure) r.lignes.push(['Assurance multirisque', Math.round(b.investi * 0.015)]);
        b.ca = Math.round(r.ca);
        b.benef = b.ca - r.lignes.reduce((t, l) => t + l[1], 0);
        b.detail = { ventes: r.ventes, cap: r.cap, lignes: r.lignes, extra: r.extra || '' };
        // Rapport qualité-prix : des prix au-dessus de la qualité offerte abîment la réputation, l'inverse la renforce
        if (!S.noPrix) b.rep = clamp(Math.round(b.rep + ((b.qual ?? 50) - 50 * (b.px || 1)) / 4));
      } else {
        const demande = (0.6 + b.rep / 125) * E.mult * (0.85 + rand() * 0.3) * (b.choc || 1);
        b.ca = Math.round(B.base * b.niveau ** 0.8 * demande);
        b.benef = Math.round(b.ca * B.mb - B.fixe * b.niveau ** 0.95 * (b.salaires || 1) - (b.assure ? b.investi * 0.015 : 0));
      }
      b.choc = 1;
      const moy = [...b.hist.slice(-2).map((h) => h.benef), b.benef].reduce((t, v) => t + v, 0) / (Math.min(2, b.hist.length) + 1);
      b.valo = Math.max(0, Math.round(b.investi * 0.3 + Math.max(0, moy) * 3.5 * E.val ** 0.5));
      b.rep = clamp(Math.round(b.rep + (50 - b.rep) * 0.12 + rnd(-4, 3)));
      if (s.justice.prison === 0) s.money += b.benef;
      else b.benef = Math.round(b.benef * 0.5) - 10000;
      b.pertes = b.benef < 0 ? b.pertes + 1 : 0;
      if (b.pertes >= 3 || (b.pertes >= 2 && s.money < 0)) { faillite(s, b, `${b.nom} est en liquidation après ${b.pertes} années de pertes.`); continue; }
    }
    b.hist.push({ age: s.age, ca: b.ca, benef: b.benef, users: b.users });
    if (b.hist.length > 12) b.hist.shift();
  }
  // Un imprévu par an pour un patron (pas systématique)
  const actifs = s.business.filter((x) => x.annees >= 1);
  if (actifs.length && s.justice.prison === 0 && chance(0.6)) {
    const b = pick(actifs);
    s.mem.biz = b.uid;
    s.queue.push(pick(BUSINESS[b.type].startup ? SU_EVENTS : BIZ_EVENTS));
  }
}

// ---------- Contacts ----------
export function findContact(s, role) {
  role ||= pick(Object.keys(ROLES).filter((r) => !ROLES[r].crime || s.stats.crime >= 10 || s.stats.reputation >= 20));
  const o = pick(Object.keys(ORIGINES));
  const genre = chance(0.75) ? 'h' : 'f';
  const c = newPerson(s, 'contact', { genre, origine: o, prenom: nameFor(o, genre), nom: surnameFor(o), age: s.age + rnd(-8, 15), rel: rnd(35, 60) });
  c.role = role;
  c.tarif = Math.round((0.7 + rand() * 0.6) * 100) / 100; // 0.7 = très avantageux
  c.qualite = Math.round((0.75 + rand() * 0.55) * 100) / 100;
  c.fiab = Math.round((0.6 + rand() * 0.4) * 100) / 100;
  s.relations.push(c);
  sms(s, c.prenom, pick(['On m’a parlé de toi. On peut faire affaire.', 'Salut, c’est le contact de ton pote. Je suis dispo.', 'Enregistre mon numéro. Discrétion avant tout.']), ROLES[role].nom);
  return c;
}
export const contactsOf = (s, role) => s.relations.filter((r) => r.vivant && r.lien === 'contact' && (!role || r.role === role));

// ---------- Réseau ----------
export function startNetwork(s) {
  if (s.reseau) return { r: 'Tu as déjà ton réseau.', err: true };
  if (s.stats.crime < 30 && s.carriere?.id !== 'reseau') return { r: 'Savoir-faire criminel 30 requis.', err: true };
  if (s.money < 15000) return { r: 'Il te faut 15 000 € de mise de départ.', err: true };
  s.money -= 15000;
  s.reseau = { points: 1, guetteurs: 2, vendeurs: 2, fournisseur: null, chaleur: 15, hist: [] };
  addLog(s, 'Tu montes ton propre réseau.');
  return { r: 'Ton point est ouvert. Il te faut maintenant un fournisseur.', good: true };
}
export function networkAction(s, act, arg) {
  const n = s.reseau;
  if (!n) return { r: '', err: true };
  if (act === 'fournisseur') {
    n.fournisseur = Number(arg);
    const c = s.relations.find((r) => r.id === n.fournisseur);
    sms(s, c.prenom, `Deal. Prix ${c.tarif < 0.9 ? 'd’ami' : c.tarif > 1.1 ? 'salé, mais la qualité suit' : 'correct'}. Livraison jeudi.`, 'Fournisseur');
    return { r: `${c.prenom} devient ton fournisseur.`, good: true };
  }
  if (act === 'guetteur' || act === 'vendeur') {
    n[act + 's']++;
    return { r: `Un ${act} de plus dans l’équipe.`, good: true };
  }
  if (act === 'virer') {
    if (n.vendeurs > 1) n.vendeurs--;
    else if (n.guetteurs > 0) n.guetteurs--;
    return { r: 'Tu réduis l’équipe.', good: true };
  }
  if (act === 'fermer') {
    s.reseau = null;
    addLog(s, 'Tu fermes ton réseau.');
    return { r: 'Réseau fermé. Tu redeviens discret.', good: true };
  }
  const m = MISSIONS.find((x) => x.id === act);
  if (!m) return { r: '', err: true };
  if (s.energie <= 0) return { r: 'Plus d’énergie cette année.', err: true };
  if (s.money < m.cout) return { r: `Il te faut ${euros(m.cout)}.`, err: true };
  s.energie--;
  s.money -= m.cout;
  const ok = chance(m.p + s.stats.crime / 400 + s.stats.reputation / 500);
  n.chaleur = clamp(n.chaleur + rnd(3, 10));
  if (!ok) {
    if (m.id === 'go_fast' && chance(0.5)) {
      apply(s, { arrest: { motif: 'Importation de stupéfiants', peine: [4, 10] } });
      return { r: 'Go-fast intercepté par les douanes sur l’A7. La voiture était pleine.', err: true };
    }
    if (chance(0.35)) apply(s, { recherche: 1, motif: 'Trafic de stupéfiants' });
    if (m.id === 'rival' && chance(0.3)) apply(s, { sante: -25 });
    return { r: `Mission ratée : ${m.nom.toLowerCase()}.`, err: true };
  }
  if (m.id === 'point') n.points++;
  if (m.id === 'dette') {
    s.money += 8000;
    s.sale += 8000;
  }
  if (m.id === 'rival') {
    n.points++;
    s.stats.reputation = clamp(s.stats.reputation + 10);
  }
  if (m.id === 'flic') n.chaleur = clamp(n.chaleur - 30);
  if (m.id === 'go_fast') {
    const g = rnd(35000, 90000);
    s.money += g;
    s.sale += g;
  }
  return { r: `Mission réussie : ${m.nom.toLowerCase()}.`, good: true };
}

function networkTick(s) {
  const n = s.reseau;
  if (!n || s.justice.prison > 0) return;
  const f = s.relations.find((r) => r.id === n.fournisseur && r.vivant);
  // Plus tu as de points, plus la concurrence et la pression policière rognent chaque point
  const vente = f ? Math.min(n.vendeurs, n.points * 3) * 44000 * f.qualite * (n.boost || 1) * (1 / (1 + 0.15 * (n.points - 1))) : n.vendeurs * 3000;
  const achat = f ? vente * 0.3 * f.tarif : 0;
  const salaires = n.guetteurs * 6000 + n.vendeurs * 9000;
  n.boost = 1;
  const net = Math.round(vente - achat - salaires);
  s.money += net;
  s.sale += Math.max(0, net);
  n.chaleur = clamp(n.chaleur + n.points * 8 - n.guetteurs * 2 + rnd(-4, 8));
  n.hist.push({ age: s.age, net });
  if (n.hist.length > 10) n.hist.shift();
  addLog(s, `Réseau : ${net >= 0 ? '+' : ''}${euros(net)} sur l’année.`);
  if (chance(n.chaleur / 150)) s.queue.unshift('descente_reseau');
  if (chance(n.chaleur / 500)) s.queue.push('rivaux');
  if (n.points >= 2 && chance(0.08 * n.points)) s.queue.push('guerre_gangs');
  if (n.chaleur >= 45 && chance(0.25)) s.queue.push(chance(0.5) ? 'enquete_ofast' : 'indic_equipe');
  if (f && chance((1 - f.fiab) * 0.5)) s.queue.push('fournisseur_trahit');
}

// ---------- Voyages & cavale ----------
export function destsFor(s) {
  return DESTS.map((d) => (d.id === 'pays' ? { ...d, ville: s.id.pays, pays: s.id.pays, hide: s.id.origine === 'france' } : d)).filter((d) => !d.hide);
}
export function travel(s, id) {
  const d = destsFor(s).find((x) => x.id === id);
  if (!d) return { r: '', err: true };
  if (s.id.statut === 'sans_papiers') return { r: 'Impossible de voyager sans papiers.', err: true };
  if (s.money < d.prix) return { r: `Il te faut ${euros(d.prix)}.`, err: true };
  if (s.energie <= 0) return { r: 'Plus d’énergie cette année.', err: true };
  s.energie--;
  s.money -= d.prix;
  s.voyage = { ville: d.ville, pays: d.pays, scene: d.scene, id: d.id };
  s.cpt = s.cpt || { voyages: 0, aide: 0 };
  s.cpt.voyages = (s.cpt.voyages || 0) + 1;
  s.lieu = null;
  s.stats.bonheur = clamp(s.stats.bonheur + rnd(10, 18));
  s.stats.sante = clamp(s.stats.sante + 2);
  addLog(s, `Voyage : ${d.ville}.`);
  sms(s, 'Air France', `Bon vol vers ${d.ville} ✈️ Embarquement porte 32.`, '');
  s.queue.push(pick(['voyage_rencontre', 'voyage_galere', 'voyage_fete', 'voyage_coup']));
  return { r: `Bienvenue à ${d.ville} !`, good: true, days: rnd(5, 14) };
}
export function flee(s, id) {
  const d = destsFor(s).find((x) => x.id === id);
  if (!d) return { r: '', err: true };
  const cost = d.prix * 4 + 5000;
  if (s.money < cost) return { r: `Il te faut ${euros(cost)} (billet, faux passeport, planque).`, err: true };
  s.money -= cost;
  const faux = s.relations.some((r) => r.vivant && r.role === 'faussaire');
  if (!faux && chance(0.25)) {
    apply(s, { arrest: { motif: (s.justice.motif || 'Fuite') + ' et tentative de fuite', peine: [2, 6] } });
    return { r: 'Contrôle à l’aéroport. Ton nom sort sur l’écran…', err: true };
  }
  s.cavale = { ville: d.ville, pays: d.pays, scene: d.scene, secu: d.secu, depuis: s.age };
  s.voyage = null;
  s.flags.cavale = true;
  if (s.carriere && !['crime', 'artiste'].includes(career(s).cat)) apply(s, { job: null });
  addLog(s, `Cavale : tu fuis à ${d.ville}.`);
  sms(s, 'Numéro masqué', 'Bien arrivé ? Change de puce. Personne doit savoir où t’es.', '');
  return { r: `Tu atterris à ${d.ville}${faux ? ' avec un faux passeport' : ''}. Nouvelle vie, sous un faux nom.`, good: true };
}
export function comeBack(s) {
  if (!s.cavale) return { r: '', err: true };
  const w = s.justice.recherche;
  s.cavale = null;
  delete s.flags.cavale;
  if (w > 0 && chance(0.3 + w * 0.1)) {
    apply(s, { arrest: { motif: s.justice.motif || 'Mandat d’arrêt', peine: [2, 6] } });
    return { r: 'Arrêté{e} à la descente de l’avion.', err: true };
  }
  return { r: 'Retour en France. Profil bas.', good: true };
}

export function moveCity(s, ville) {
  if (!VILLES.includes(ville)) return { r: '', err: true };
  if (!adult(s)) return { r: 'Il faut être majeur.', err: true };
  if (inPrison(s)) return { r: 'Impossible en détention.', err: true };
  if (s.money < 3000) return { r: 'Il te faut 3 000 €.', err: true };
  if (s.id.statut === 'au_pays') return { r: 'Tu vis au pays.', err: true };
  s.money -= 3000;
  s.id.ville = ville;
  s.chezParents = false;
  if (!s.logement || s.logement === 'pays') s.logement = 'hlm';
  addLog(s, `Déménagement à ${ville}.`);
  s.queue.push('nouvelle_ville');
  return { r: `Bienvenue à ${ville} !`, good: true };
}

// ---------- Casino ----------
const ROUGE = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const misePasOk = (s, bet) => !Number.isFinite(bet) || bet <= 0 || bet > s.money || !adult(s) || inPrison(s);
export function roulette(s, bet, choice) {
  bet = Math.floor(bet);
  if (misePasOk(s, bet)) return { r: 'Mise invalide.', err: true };
  if (bet > 500000) return { r: 'Limite de la table : 500 000 € par mise.', err: true };
  const n = rnd(0, 36);
  const color = n === 0 ? 'vert' : ROUGE.includes(n) ? 'rouge' : 'noir';
  let mult = 0;
  if (choice === color) mult = color === 'vert' ? 36 : 2;
  else if (choice === 'pair' && n && n % 2 === 0) mult = 2;
  else if (choice === 'impair' && n % 2 === 1) mult = 2;
  else if (String(n) === String(choice)) mult = 36;
  return settle(s, bet, mult, { n, color });
}
const SYM = ['7', '★', '♦', '♣', '♥', 'BAR'];
export function slots(s, bet) {
  bet = Math.floor(bet);
  if (misePasOk(s, bet)) return { r: 'Mise invalide.', err: true };
  if (bet > 500000) return { r: 'Limite de la table : 500 000 € par mise.', err: true };
  const r = [0, 1, 2].map(() => pick(SYM));
  let mult = 0;
  if (r[0] === r[1] && r[1] === r[2]) mult = r[0] === '7' ? 50 : r[0] === 'BAR' ? 20 : 10;
  else if (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) mult = 1;
  return settle(s, bet, mult, { reels: r });
}
function settle(s, bet, mult, res) {
  const delta = Math.round(bet * mult - bet);
  s.money += delta;
  if (delta >= 0) s.casino.gagne += delta;
  else s.casino.perdu -= delta;
  s.stats.bonheur = clamp(s.stats.bonheur + (delta > 0 ? 2 : -1));
  if (Math.abs(delta) > 100000) addLog(s, `Casino : ${delta > 0 ? 'gain' : 'perte'} de ${euros(Math.abs(delta))}.`);
  if (s.casino.perdu > 200000 && !s.flags.accro_jeu) {
    s.flags.accro_jeu = true;
    s.queue.push('accro_casino');
  }
  return { ...res, delta, mult, win: delta > 0 };
}

// ---------- Santé : le sport et le médecin deviennent essentiels ----------
function healthTick(s) {
  if (s.age >= 16) {
    if (!s.annee.sport) {
      s.stats.forme = clamp(s.stats.forme - rnd(1, 3));
      if (s.age > 35 && s.stats.forme < 30) s.stats.sante = clamp(s.stats.sante - 1);
    } else s.stats.sante = clamp(s.stats.sante + Math.min(3, s.annee.sport));
    if (s.age > 55 && !s.annee.medecin && chance(0.5)) s.stats.sante = clamp(s.stats.sante - rnd(1, 2));
  }
  s.annee = { sport: 0, medecin: 0, use: {}, posts: 0, sons: 0 };
}

function cavaleTick(s) {
  if (!s.cavale) return;
  if (chance(s.cavale.secu * (s.justice.recherche >= 3 ? 1.3 : 0.8))) s.queue.unshift('extradition');
}

// Appelé une fois par an par le moteur.
export function worldTick(s) {
  ecoTick(s);
  assetsTick(s);
  businessTick(s);
  networkTick(s);
  healthTick(s);
  cavaleTick(s);
  s.voyage = null;
  s.avec = [];
  if (s.securite > 0 && s.justice.prison === 0) s.money -= s.securite * 42000;
}

registerFx('contact', (s, role) => findContact(s, role === true ? null : role));

export { ASSETS, BUSINESS, ROLES, DESTS, MISSIONS };
