// Systèmes « open world business » : biens, entreprises, contacts, réseau, voyages, cavale, casino, téléphone.
import { rnd, pick, chance, clamp, euros } from './rng.js';
import { addLog, apply, newPerson, career, tpl, registerFx } from './core.js';
import { ASSETS, BUSINESS, ROLES, DESTS, MISSIONS } from '../data/world.js';
import { nameFor, surnameFor, ORIGINES } from '../data/identity.js';

const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
export const adult = (s) => s.age >= 18;

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
  return s;
}

// ---------- Téléphone ----------
export function sms(s, from, txt, role = '') {
  s.phone.msgs.push({ from, role, txt: tpl(txt, s), age: s.age, t: s.t, read: false });
  if (s.phone.msgs.length > 200) s.phone.msgs.splice(0, s.phone.msgs.length - 200);
  s.phone.unread = s.phone.msgs.filter((m) => !m.read).length;
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

// ---------- Biens ----------
export function buyAsset(s, id) {
  const a = ASSETS[id];
  if (!adult(s)) return { r: 'Tu es mineur : pas de compte en banque.', err: true };
  if (s.money < a.prix) return { r: `Il te faut ${euros(a.prix)}.`, err: true };
  s.money -= a.prix;
  s.biens.push({ uid: s.uid++, id, valeur: a.prix, achat: a.prix, depuis: s.age });
  addLog(s, `Achat : ${a.nom} (${euros(a.prix)}).`);
  if (ASSETS[id].car) s.avec = [];
  return { r: `${a.nom} acheté${a.cat === 'Voiture' ? 'e' : ''} !`, good: true };
}
export function sellAsset(s, uid) {
  const i = s.biens.findIndex((b) => b.uid === uid);
  if (i < 0) return { r: '', err: true };
  const b = s.biens[i];
  const rec = s.relations.find((r) => r.vivant && r.role === 'receleur');
  s.money += b.valeur;
  s.biens.splice(i, 1);
  addLog(s, `Vente : ${ASSETS[b.id].nom} pour ${euros(b.valeur)}.`);
  return { r: `Vendu ${euros(b.valeur)} (${b.valeur >= b.achat ? '+' : ''}${euros(b.valeur - b.achat)}).${rec ? '' : ''}`, good: b.valeur >= b.achat };
}
export const bestCar = (s) => s.biens.filter((b) => ASSETS[b.id].car).sort((a, b) => b.valeur - a.valeur)[0];
export const patrimoine = (s) => s.biens.reduce((t, b) => t + b.valeur, 0) + s.business.reduce((t, b) => t + b.valo, 0);

function assetsTick(s) {
  for (const b of s.biens) {
    const a = ASSETS[b.id];
    b.valeur = Math.max(Math.round(a.prix * 0.05), Math.round(b.valeur * (1 + a.tend + gauss() * a.vol)));
  }
}

// ---------- Entreprises ----------
export function createBusiness(s, type, nom) {
  const B = BUSINESS[type];
  if (!adult(s)) return { r: 'Il faut être majeur.', err: true };
  if (s.justice.prison > 0) return { r: 'Impossible depuis la prison.', err: true };
  if (B.cond) {
    const ok = B.cond(s);
    if (ok !== true) return { r: ok, err: true };
  }
  if (s.money < B.prix) return { r: `Il te faut ${euros(B.prix)}.`, err: true };
  s.money -= B.prix;
  const b = { uid: s.uid++, type, nom: nom || `${B.nom} ${s.id.nom}`, niveau: 1, rep: 50, emp: B.emp, ca: B.base, benef: 0, valo: B.prix, annees: 0, hist: [], lave: 0 };
  if (B.startup) Object.assign(b, { users: 500, mrr: 3000, burn: 6100, cash: 120000, valo: 300000 });
  s.business.push(b);
  addLog(s, `Ouverture : ${b.nom}.`);
  return { r: B.startup ? `${b.nom} est lancée, avec 90 000 € de love money en plus de ta mise.` : `${b.nom} ouvre ses portes !`, good: true };
}

export function businessAction(s, uid, act) {
  const b = s.business.find((x) => x.uid === uid);
  if (!b) return { r: '', err: true };
  const B = BUSINESS[b.type];
  const pay = (c) => {
    if (s.money < c) return false;
    s.money -= c;
    return true;
  };
  switch (act) {
    case 'investir': {
      const c = Math.round(B.prix * 0.6 * b.niveau);
      if (!pay(c)) return { r: `Il te faut ${euros(c)}.`, err: true };
      b.niveau++;
      b.emp += Math.ceil(B.emp / 2);
      if (B.startup) b.cash += c;
      return { r: `Agrandissement : niveau ${b.niveau}.`, good: true };
    }
    case 'marketing': {
      const c = 8000 * b.niveau;
      if (!pay(c)) return { r: `Il te faut ${euros(c)}.`, err: true };
      b.rep = clamp(b.rep + rnd(6, 14));
      if (B.startup) b.users = Math.round(b.users * (1.2 + Math.random() * 0.4));
      return { r: 'Campagne lancée. Ça fait parler.', good: true };
    }
    case 'blanchir': {
      const cap = B.lav * b.niveau - b.lave;
      const m = Math.min(cap, s.sale);
      if (m <= 0) return { r: cap <= 0 ? 'Capacité de blanchiment atteinte cette année.' : 'Tu n’as pas d’argent sale à blanchir.', err: true };
      s.sale -= m;
      b.lave += m;
      s.justice.recherche = Math.max(0, s.justice.recherche - (m > 30000 ? 1 : 0));
      if (chance(0.06)) {
        apply(s, { arrest: { motif: 'Blanchiment d’argent', peine: [1, 4] } });
        return { r: 'Un contrôle URSSAF tombe pile ce jour-là…', err: true };
      }
      return { r: `${euros(m)} blanchis via ${b.nom}.`, good: true };
    }
    case 'vendre': {
      s.money += b.valo;
      s.business = s.business.filter((x) => x !== b);
      addLog(s, `Revente de ${b.nom} : ${euros(b.valo)}.`);
      return { r: `${b.nom} vendu ${euros(b.valo)}.`, good: true };
    }
    case 'lever': {
      if (!B.startup) return { r: '', err: true };
      if (chance(0.25 + b.users / 400000)) {
        const m = Math.round(b.valo * (0.15 + Math.random() * 0.1));
        b.cash += m;
        b.valo = Math.round(b.valo * 1.4);
        return { r: `Levée de fonds réussie : ${euros(m)} !`, good: true };
      }
      return { r: 'Les investisseurs ne sont pas convaincus.', err: true };
    }
  }
  return { r: '' };
}

function businessTick(s) {
  for (const b of [...s.business]) {
    const B = BUSINESS[b.type];
    b.annees++;
    b.lave = 0;
    if (B.startup) {
      const growth = 1.3 + gauss() * 0.5 + b.rep / 200 + (s.stats.intel - 50) / 200;
      b.users = Math.max(50, Math.round(b.users * growth));
      b.mrr = Math.round(b.users * 6);
      b.burn = Math.round(2500 * b.niveau + b.emp * 1200);
      b.cash += (b.mrr - b.burn) * 12;
      b.valo = Math.max(50000, Math.round(b.mrr * 12 * (8 + b.rep / 10)));
      b.ca = b.mrr * 12;
      b.benef = (b.mrr - b.burn) * 12;
      if (b.cash < 0) {
        s.business = s.business.filter((x) => x !== b);
        addLog(s, `${b.nom} fait faillite : plus de trésorerie.`);
        sms(s, 'Ton associé', `C’est fini pour ${b.nom}. On a cramé toute la tréso. Désolé.`, 'Business');
        continue;
      }
    } else {
      b.ca = Math.round(B.base * (0.6 + 0.4 * b.niveau) * (0.6 + b.rep / 100) * (0.8 + Math.random() * 0.45));
      b.benef = Math.round(b.ca * B.marge * (0.6 + Math.random() * 0.8) - (chance(0.08) ? b.ca * 0.15 : 0));
      b.valo = Math.round(B.prix * 0.8 * b.niveau + Math.max(0, b.benef) * 3);
      b.rep = clamp(b.rep + rnd(-6, 4));
      if (s.justice.prison === 0) s.money += b.benef;
    }
    b.hist.push({ age: s.age, ca: b.ca, benef: b.benef, users: b.users });
    if (b.hist.length > 12) b.hist.shift();
  }
}

// ---------- Contacts ----------
export function findContact(s, role) {
  role ||= pick(Object.keys(ROLES).filter((r) => !ROLES[r].crime || s.stats.crime >= 10 || s.stats.reputation >= 20));
  const o = pick(Object.keys(ORIGINES));
  const genre = chance(0.75) ? 'h' : 'f';
  const c = newPerson(s, 'contact', { genre, origine: o, prenom: nameFor(o, genre), nom: surnameFor(o), age: s.age + rnd(-8, 15), rel: rnd(35, 60) });
  c.role = role;
  c.tarif = Math.round((0.7 + Math.random() * 0.6) * 100) / 100; // 0.7 = très avantageux
  c.qualite = Math.round((0.75 + Math.random() * 0.55) * 100) / 100;
  c.fiab = Math.round((0.6 + Math.random() * 0.4) * 100) / 100;
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
    const g = rnd(60000, 140000);
    s.money += g;
    s.sale += g;
  }
  return { r: `Mission réussie : ${m.nom.toLowerCase()}.`, good: true };
}

function networkTick(s) {
  const n = s.reseau;
  if (!n || s.justice.prison > 0) return;
  const f = s.relations.find((r) => r.id === n.fournisseur && r.vivant);
  const vente = f ? Math.min(n.vendeurs, n.points * 3) * 26000 * f.qualite : n.vendeurs * 4000;
  const achat = f ? vente * 0.35 * f.tarif : 0;
  const salaires = n.guetteurs * 9000 + n.vendeurs * 14000;
  const net = Math.round(vente - achat - salaires);
  s.money += net;
  s.sale += Math.max(0, net);
  n.chaleur = clamp(n.chaleur + n.points * 6 - n.guetteurs * 3 + rnd(-5, 5));
  n.hist.push({ age: s.age, net });
  if (n.hist.length > 10) n.hist.shift();
  addLog(s, `Réseau : ${net >= 0 ? '+' : ''}${euros(net)} sur l’année.`);
  if (chance(n.chaleur / 260)) s.queue.unshift('descente_reseau');
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
  if (!adult(s)) return { r: 'Il faut être majeur.', err: true };
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
export function roulette(s, bet, choice) {
  bet = Math.round(bet);
  if (bet <= 0 || bet > s.money) return { r: 'Mise invalide.', err: true };
  const n = rnd(0, 36);
  const color = n === 0 ? 'vert' : ROUGE.includes(n) ? 'rouge' : 'noir';
  let mult = 0;
  if (choice === color) mult = 2;
  else if (choice === 'pair' && n && n % 2 === 0) mult = 2;
  else if (choice === 'impair' && n % 2 === 1) mult = 2;
  else if (String(n) === String(choice)) mult = 36;
  return settle(s, bet, mult, { n, color });
}
const SYM = ['7', '★', '♦', '♣', '♥', 'BAR'];
export function slots(s, bet) {
  bet = Math.round(bet);
  if (bet <= 0 || bet > s.money) return { r: 'Mise invalide.', err: true };
  const r = [0, 1, 2].map(() => pick(SYM));
  let mult = 0;
  if (r[0] === r[1] && r[1] === r[2]) mult = r[0] === '7' ? 50 : r[0] === 'BAR' ? 20 : 10;
  else if (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) mult = 1.5;
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
  if (s.age >= 14) {
    if (!s.annee.sport) {
      s.stats.forme = clamp(s.stats.forme - rnd(2, 5));
      s.stats.sante = clamp(s.stats.sante - (s.age > 35 ? rnd(1, 3) : 1));
    } else s.stats.sante = clamp(s.stats.sante + Math.min(3, s.annee.sport));
    if (s.age > 45 && !s.annee.medecin) s.stats.sante = clamp(s.stats.sante - rnd(1, 3));
  }
  s.annee = { sport: 0, medecin: 0 };
}

function cavaleTick(s) {
  if (!s.cavale) return;
  if (chance(s.cavale.secu * (s.justice.recherche >= 3 ? 1.3 : 0.8))) s.queue.unshift('extradition');
}

// Appelé une fois par an par le moteur.
export function worldTick(s) {
  assetsTick(s);
  businessTick(s);
  networkTick(s);
  healthTick(s);
  cavaleTick(s);
  s.voyage = null;
  s.avec = [];
  if (s.securite > 0 && s.justice.prison === 0) s.money -= s.securite * 42000;
  flavorSms(s);
}

registerFx('contact', (s, role) => findContact(s, role === true ? null : role));

export { ASSETS, BUSINESS, ROLES, DESTS, MISSIONS };
