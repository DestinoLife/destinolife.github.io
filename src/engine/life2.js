// Systèmes V3 : addictions, maladies, confiance et destin des amis, Instapic, monde, foot, politique, blackjack, intro.
import { rnd, pick, chance, clamp, euros, weighted } from './rng.js';
import { addLog, apply, die, newPerson, career, registerFx, tpl, g } from './core.js';
import { ADDICTIONS, DISEASES, DESTINS, PARENT_JOBS, PAYS, SITUATIONS, EXPAT } from '../data/world2.js';
import { ORIGINES, MILIEUX, TALENTS } from '../data/identity.js';
import { HOUSING } from '../data/housing.js';
import { fmtDate } from './time.js';

export function migrate3(s) {
  s.addic ??= { tabac: 0, alcool: 0, cannabis: 0, coke: 0, jeu: 0 };
  s.maladies ??= [];
  s.insta ??= null;
  s.monde ??= newWorld();
  s.foot ??= null;
  s.blessure ??= -9;
  s.annee.use ??= {};
  s.annee.posts ??= 0;
  s.relations.forEach((r) => (r.conf ??= rnd(40, 70)));
  return s;
}

// ---------- Monde ----------
function newWorld() {
  const pays = {};
  for (const p of Object.keys(PAYS)) pays[p] = chance(0.85) ? 'stable' : PAYS[p].fic ? pick(['crise', 'guerre']) : 'crise';
  return { pays, news: [] };
}
export const situation = (s, pays) => s.monde?.pays[pays] || 'stable';
function worldNews(s) {
  const m = s.monde;
  for (const p of Object.keys(m.pays)) {
    const cur = m.pays[p];
    let next = cur;
    const fic = PAYS[p]?.fic;
    if (cur === 'stable' && chance(fic ? 0.15 : 0.03)) next = fic && chance(0.5) ? 'guerre' : 'crise';
    else if (cur === 'crise' && chance(0.3)) next = chance(0.6) ? 'stable' : fic ? 'guerre' : 'emeutes';
    else if (cur === 'emeutes' && chance(0.5)) next = 'crise';
    else if (cur === 'guerre' && chance(0.2)) next = 'crise';
    if (next !== cur) {
      m.pays[p] = next;
      const t = { crise: `Crise économique : le pays (${p}) s’enfonce, la monnaie chute.`, emeutes: `${p} : émeutes dans les grandes villes, couvre-feu instauré.`, guerre: `${p} : la guerre éclate. Les frontières sont fermées.`, stable: `${p} : la situation se stabilise enfin.` }[next];
      m.news.push({ age: s.age, txt: t });
    }
  }
  if (m.news.length > 30) m.news.splice(0, m.news.length - 30);
  // Le pays d'origine en difficulté : la famille appelle à l'aide.
  const o = s.id.pays;
  if (o && o !== 'France' && s.id.origine !== 'france' && !ORIGINES[s.id.origine]?.francais && ['crise', 'emeutes', 'guerre'].includes(m.pays[o]) && s.age >= 18 && chance(0.4)) s.queue.push('pays_crise');
}

// ---------- Addictions ----------
export function useSubstance(s, sub, dose = 1) {
  const k = { tabac: 7, alcool: 6, cannabis: 8, coke: 14, jeu: 5 }[sub] * dose;
  s.addic[sub] = clamp(s.addic[sub] + rnd(Math.round(k * 0.6), k));
  s.annee.use[sub] = (s.annee.use[sub] || 0) + 1;
}
const MAX_ADDIC = (s) => Math.max(...Object.values(s.addic));
export const worstAddiction = (s) => Object.entries(s.addic).sort((a, b) => b[1] - a[1])[0];

function addictionTick(s) {
  for (const [k, v] of Object.entries(s.addic)) {
    if (v <= 0) continue;
    const used = s.annee.use[k];
    if (!used) s.addic[k] = clamp(v - rnd(6, 12));
    s.stats.sante = clamp(s.stats.sante - Math.round((v / 30) * ADDICTIONS[k].sante));
    if (v >= 45 && !used && s.justice.prison === 0) s.mem.manque = ADDICTIONS[k].nom.toLowerCase();
    if (k === 'coke' && v >= 40) {
      s.money -= rnd(8000, 25000);
      if (chance(v / 2500)) return die(s, 'Overdose de cocaïne');
    }
    if (k === 'jeu' && v >= 50 && s.money > 0) {
      const l = Math.round(s.money * (0.1 + v / 400));
      s.money -= l;
      addLog(s, `Jeux d’argent : tu perds ${euros(l)} cette année.`);
    }
    if (k === 'alcool' && v >= 55 && chance(0.25)) s.queue.push('alcool_derive');
  }
  if (s.mem.manque && chance(0.7)) s.queue.push('manque');
  else delete s.mem.manque;
}
export function cure(s, heavy) {
  const before = MAX_ADDIC(s);
  const p = heavy ? 0.65 : 0.35;
  for (const k of Object.keys(s.addic)) if (chance(p)) s.addic[k] = clamp(s.addic[k] - (heavy ? rnd(35, 60) : rnd(8, 18)));
  return MAX_ADDIC(s) < before;
}

// ---------- Maladies ----------
function diseaseTick(s) {
  for (const [id, d] of Object.entries(DISEASES)) {
    if (s.maladies.some((m) => m.id === id)) continue;
    if (chance(d.risk(s))) s.maladies.push({ id, stade: 1, connue: false, traitee: false });
  }
  for (const m of [...s.maladies]) {
    const d = DISEASES[m.id];
    if (m.traitee) {
      if (chance(0.35 + s.stats.sante / 300)) m.stade--;
      if (m.stade <= 0) {
        s.maladies = s.maladies.filter((x) => x !== m);
        addLog(s, `Guéri{e} : ${d.nom.toLowerCase()}.`);
        continue;
      }
    } else if (chance(0.55)) m.stade++;
    s.stats.sante = clamp(s.stats.sante - m.stade * (d.letal ? 3 : 1));
    if (m.id === 'depression') s.stats.bonheur = clamp(s.stats.bonheur - 8);
    if (!m.connue && m.stade <= 3) {
      s.mem.symptome = d.symp[Math.min(m.stade - 1, d.symp.length - 1)].toLowerCase();
      s.queue.push('symptome');
    }
    if (d.letal && m.stade >= 4) return die(s, d.nom);
    if (!d.letal && m.stade > 3) m.stade = 3;
  }
}
export const symptoms = (s) => s.maladies.map((m) => (m.connue ? `${DISEASES[m.id].nom} (stade ${m.stade})` : DISEASES[m.id].symp[Math.min(m.stade - 1, 2)]));

// Consultation : diagnostique les maladies et lance les traitements.
export function diagnose(s) {
  const found = s.maladies.filter((m) => !m.connue);
  found.forEach((m) => {
    m.connue = true;
    m.traitee = true;
  });
  s.maladies.forEach((m) => (m.traitee = true));
  return found.map((m) => DISEASES[m.id].nom);
}

// ---------- Confiance et destin des amis ----------
function friendsTick(s) {
  for (const r of s.relations) {
    if (!r.vivant) continue;
    if (r.lien === 'ami' && r.age >= 21 && !r.destin) {
      r.destin = weighted(Object.keys(DESTINS), (k) => DESTINS[k].w);
      if (r.rel > 50) apply(s, { sms: { from: r.prenom, txt: `Devine quoi : je suis devenu ${DESTINS[r.destin].nom} ! Si un jour t’as besoin, demande.` } });
    }
    r.conf = clamp((r.conf ?? 55) + Math.round((r.rel - 50) / 25));
  }
}
export function friendService(s, r) {
  if (!r.destin) return { r: `${r.prenom} n’a encore rien à t’offrir.`, err: true };
  if ((r.conf ?? 50) < 55) return { r: `${r.prenom} ne te fait pas assez confiance.`, err: true };
  const d = r.destin;
  r.conf = clamp(r.conf - 12);
  if (d === 'avocat') return s.justice.recherche ? (apply(s, { recherche: -1 }), { r: `${r.prenom} a fait jouer ses relations. Tu es moins recherché.`, good: true }) : (apply(s, { intel: 2 }), { r: `${r.prenom} te donne des conseils juridiques.`, good: true });
  if (d === 'flic') return chance(0.65) ? (apply(s, { recherche: -2, karma: -2 }), { r: `${r.prenom} a égaré ton dossier…`, good: true }) : (r.rel = clamp(r.rel - 20), { r: `${r.prenom} refuse : « Je risque ma carrière. »`, err: true });
  if (d === 'medecin') {
    apply(s, { sante: 10 });
    diagnose(s);
    return { r: `${r.prenom} t’examine en urgence et lance un traitement.`, good: true };
  }
  if (d === 'patron') {
    if (s.carriere) return { r: `${r.prenom} : « Quand tu veux, la place est à toi. »`, good: true };
    apply(s, { job: 'commercial' });
    return { r: `${r.prenom} t’embauche dans sa boîte.`, good: true };
  }
  if (d === 'dealer') {
    r.lien = 'contact';
    r.role = 'fournisseur';
    r.tarif = 0.72;
    r.qualite = 1.1;
    r.fiab = 0.9;
    return { r: `${r.prenom} devient ton fournisseur, à prix d’ami.`, good: true };
  }
  if (d === 'artiste') return (apply(s, { notoriete: 8, art: 2 }), { r: `Featuring avec ${r.prenom} : le son tourne bien.`, good: true });
  if (d === 'journaliste') return (apply(s, { notoriete: 6 }), { r: `${r.prenom} publie un portrait de toi.`, good: true });
  if (d === 'politique') return (s.flags.soutien_politique = true, { r: `${r.prenom} te soutiendra aux prochaines élections.`, good: true });
  if (d === 'prof') return (apply(s, { intel: 5 }), { r: `${r.prenom} t’aide à réviser.`, good: true });
  apply(s, { money: -500, karma: 3 });
  return { r: `${r.prenom} est dans la galère. Tu lui prêtes 500 €.`, good: true };
}

// ---------- Instapic ----------
export const POST_TYPES = {
  selfie: { nom: 'Selfie', base: 1 },
  sport: { nom: 'Photo à la salle', base: 1.1, cond: (s) => s.stats.forme >= 50 },
  soiree: { nom: 'Soirée entre potes', base: 1.2 },
  voyage: { nom: 'Photo de voyage', base: 1.6, cond: (s) => !!s.voyage },
  voiture: { nom: 'Ta voiture', base: 1.5, cond: (s) => s.biens.some((b) => ['citadine', 'compacte', 'suv', 'sportive', 'collection'].includes(b.id)) },
  clip: { nom: 'Extrait de ton clip', base: 2, cond: (s) => s.carriere?.id === 'rappeur' },
  business: { nom: 'Ton business', base: 1.3, cond: (s) => s.business.length > 0 },
  luxe: { nom: 'Montre et billets', base: 1.4, cond: (s) => s.money > 200000 },
};
export function instaPost(s, type, legende) {
  if (!s.insta) return { r: 'Il faut avoir 12 ans.', err: true };
  if (s.annee.posts >= 3) return { r: 'Tu as déjà posté 3 fois cette année. Poster plus ne sert à rien : l’algorithme te pénalise.', err: true };
  const T = POST_TYPES[type];
  s.annee.posts++;
  const base = 20 + Math.sqrt(s.insta.followers) * 6;
  const mult = T.base * (0.5 + s.stats.apparence / 100 + s.stats.notoriete / 60 + s.stats.charisme / 200) * (s.carriere?.id === 'influenceur' ? 2.5 : 1);
  const viral = chance(0.05 + s.stats.charisme / 2000);
  const fatigue = 1 / (1 + (s.annee.posts - 1) * 0.8);
  const gain = Math.min(2000000, Math.round(base * mult * fatigue * (0.5 + Math.random() * 0.8) * (viral ? 6 : 1)));
  const likes = Math.round((s.insta.followers + gain) * (0.08 + Math.random() * 0.12) * (viral ? 6 : 1));
  s.insta.followers += gain;
  s.insta.posts.unshift({ age: s.age, type, txt: legende || T.nom, likes, viral });
  if (s.insta.posts.length > 30) s.insta.posts.pop();
  if (s.insta.followers > 10000) s.stats.notoriete = clamp(Math.max(s.stats.notoriete, Math.round(Math.log10(s.insta.followers) * 14 - 40)));
  return { r: viral ? `Ton post devient viral ! +${gain.toLocaleString('fr-FR')} abonnés.` : `+${gain.toLocaleString('fr-FR')} abonnés, ${likes.toLocaleString('fr-FR')} likes.`, good: true };
}
// Commenter le post d'un proche : change la relation.
export function instaComment(s, who, kind) {
  const r = s.relations.find((x) => x.vivant && x.prenom === who);
  if (!r) return { r: '' };
  const k = `${r.id}:com`;
  if (s.relUsed[k]) return { r: 'Tu as déjà commenté ce post.', err: true };
  s.relUsed[k] = true;
  if (kind === 'gentil') { r.rel = clamp(r.rel + rnd(3, 6)); r.conf = clamp((r.conf ?? 50) + 2); return { r: `${r.prenom} a liké ton commentaire ❤️`, good: true }; }
  if (kind === 'drole') { r.rel = clamp(r.rel + (r.rel > 50 ? 3 : -3)); return { r: r.rel > 50 ? `${r.prenom} : « 😂😂 t’es grave »` : `${r.prenom} n’a pas trouvé ça drôle.` }; }
  r.rel = clamp(r.rel - rnd(8, 14));
  r.conf = clamp((r.conf ?? 50) - 6);
  s.stats.reputation = clamp(s.stats.reputation + 2);
  return { r: `Ton commentaire méchant fait le buzz. ${r.prenom} est vexé{e2}.`.replace('{e2}', r.genre === 'f' ? 'e' : '') };
}

export function instaFeed(s) {
  const people = s.relations.filter((r) => r.vivant && ['ami', 'fratrie', 'partenaire', 'conjoint', 'contact', 'ex'].includes(r.lien) && r.age >= 12).slice(0, 10);
  const seed = s.age * 7;
  return people.map((r, i) => {
    const t = r.destin === 'artiste' ? 'Nouveau son dispo, lien en bio 🔥' : r.destin === 'dealer' ? 'Nouvelle montre 💸' : r.destin === 'medecin' ? 'Garde de nuit terminée 😴' : r.lien === 'ex' ? 'Nouveau départ ✨' : ['Vacances 🌴', 'Soirée de folie', 'Dimanche en famille', 'Leg day 💪', 'Nouvelle coupe', 'Concert hier soir 🎶'][(seed + i) % 6];
    const type = r.destin === 'artiste' ? 'clip' : r.destin === 'dealer' ? 'luxe' : r.destin === 'medecin' ? 'selfie' : ['voyage', 'soiree', 'selfie', 'sport', 'voyage', 'soiree'][(seed + i) % 6];
    return { who: r.prenom, txt: t, type, likes: 20 + ((seed * (i + 3)) % 400), look: r.look, genre: r.genre };
  });
}

// ---------- Foot ----------
const CLUBS = ['Centre de formation', 'Club de Ligue 2', 'Club de Ligue 1', 'Top club européen', 'Top club européen'];
function footTick(s) {
  if (s.carriere?.id !== 'foot') return;
  s.foot ??= { matchs: 0, buts: 0, selections: 0, saisons: [] };
  const lvl = s.carriere.niveau;
  const m = lvl === 0 ? rnd(5, 15) : rnd(18, 38);
  const b = Math.round(m * (0.05 + s.stats.forme / 300 + lvl * 0.04) * (0.5 + Math.random()));
  s.foot.matchs += m;
  s.foot.buts += b;
  s.foot.saisons.push({ age: s.age, club: CLUBS[lvl], m, b });
  if (s.foot.saisons.length > 20) s.foot.saisons.shift();
  s.stats.notoriete = clamp(s.stats.notoriete + Math.round(b / 4));
  addLog(s, `Saison : ${m} matchs, ${b} buts (${CLUBS[lvl]}).`);
  if (lvl >= 2 && s.stats.forme >= 70 && chance(0.4)) s.queue.push('selection_nationale');
}
export const footClub = (s) => CLUBS[s.carriere?.niveau ?? 0];

// ---------- Blackjack ----------
const CARDS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'V', 'D', 'R'];
const card = () => ({ v: pick(CARDS), s: pick(['♠', '♥', '♦', '♣']) });
export function handValue(h) {
  let t = 0, a = 0;
  for (const c of h) {
    if (c.v === 'A') { a++; t += 11; } else t += ['V', 'D', 'R', '10'].includes(c.v) ? 10 : Number(c.v);
  }
  while (t > 21 && a--) t -= 10;
  return t;
}
export function bjStart(s, bet) {
  bet = Math.round(bet);
  if (bet <= 0 || bet > s.money) return { err: true, r: 'Mise invalide.' };
  if (bet > 500000) return { err: true, r: 'Limite de la table : 500 000 € par mise.' };
  s.money -= bet;
  useSubstance(s, 'jeu', 0.5);
  const st = { bet, p: [card(), card()], d: [card(), card()], done: false };
  if (handValue(st.p) === 21) return bjEnd(s, st);
  return st;
}
export function bjHit(s, st) {
  st.p.push(card());
  if (handValue(st.p) > 21) return bjEnd(s, st);
  return st;
}
export function bjStand(s, st) {
  while (handValue(st.d) < 17) st.d.push(card());
  return bjEnd(s, st);
}
function bjEnd(s, st) {
  const p = handValue(st.p), d = handValue(st.d);
  let mult = 0;
  if (p > 21) mult = 0;
  else if (p === 21 && st.p.length === 2) mult = 2.5;
  else if (d > 21 || p > d) mult = 2;
  else if (p === d) mult = 1;
  const win = Math.round(st.bet * mult);
  s.money += win;
  const delta = win - st.bet;
  if (delta >= 0) s.casino.gagne += delta;
  else s.casino.perdu -= delta;
  st.done = true;
  st.delta = delta;
  st.res = p > 21 ? 'Tu dépasses 21.' : mult === 2.5 ? 'Blackjack !' : mult === 2 ? 'Gagné !' : mult === 1 ? 'Égalité.' : 'Le croupier gagne.';
  if (s.casino.perdu > 200000 && !s.flags.accro_jeu) {
    s.flags.accro_jeu = true;
    s.queue.push('accro_casino');
  }
  return st;
}

// ---------- Messages selon la vie du perso ----------
export function contextSms(s) {
  const c = s.carriere ? career(s) : null;
  const msgs = [];
  if (s.age >= 11 && s.age <= 17) msgs.push(['Le groupe de la classe', pick(['Qui a fait l’exo 4 ??', 'Soirée chez Inès samedi 🔥', 'Le prof de maths est absent demain !!!', 'Vous avez vu la vidéo de Rayan 😂'])]);
  if (c?.cat === 'artiste') msgs.push(['Ton manager', pick(['On a une date à Lyon, je bloque ?', 'Le label veut un nouveau single avant l’été.', 'Interview radio demain 9 h, sois à l’heure.'])]);
  if (c?.cat === 'sport') msgs.push(['Ton agent', pick(['Un club anglais se renseigne sur toi 👀', 'Contrat de sponsoring avec une marque de chaussures, ça te dit ?', 'Le coach veut te voir après l’entraînement.'])]);
  if (c?.cat === 'classique' || c?.cat === 'business') msgs.push(['Ton boss', pick(['Réunion avancée à 8 h demain.', 'Bon boulot sur le dossier.', 'Tu peux passer dans mon bureau ?'])]);
  if (c?.cat === 'police') msgs.push(['Commissariat', pick(['Renfort demandé ce soir, quartier nord.', 'Débrief à 7 h.'])]);
  if (c?.cat === 'politique') msgs.push(['Ton conseiller', pick(['Les sondages remontent 📈', 'Un journaliste prépare un papier sur toi, attention.', 'Discours demain, j’ai les éléments de langage.'])]);
  if (s.insta && s.insta.followers > 5000) msgs.push(['Instapic', `Tu as ${s.insta.followers.toLocaleString('fr-FR')} abonnés. Une marque veut te contacter.`]);
  if (s.addic.coke >= 40) msgs.push(['Ton dealer', 'J’ai de la bonne cette semaine. Tu passes ?']);
  if (s.maladies.some((m) => m.connue)) msgs.push(['Centre hospitalier', 'Rappel : rendez-vous de suivi la semaine prochaine.']);
  msgs.slice(0, 2).forEach(([from, txt]) => apply(s, { sms: { from, txt } }));
}

// Réponses rapides et réactions des proches.
export const REPLIES = ['Ça va et toi ?', 'J’arrive 🏃', 'Pas maintenant', 'Je t’aime ❤️', 'Désolé…', 'On se voit ce soir ?', 'Tu peux me dépanner ?', 'Laisse-moi tranquille'];
export function sendMessage(s, to, txt) {
  s.phone.msgs.push({ from: 'Moi', conv: to, mine: true, txt, age: s.age, t: s.t, read: true });
  const r = s.relations.find((x) => x.vivant && x.prenom === to);
  let reply = null;
  if (r) {
    const bad = txt === 'Laisse-moi tranquille' || txt === 'Pas maintenant';
    const ask = txt === 'Tu peux me dépanner ?';
    if (bad) {
      r.rel = clamp(r.rel - 6);
      r.conf = clamp(r.conf - 4);
    } else if (!ask) {
      r.rel = clamp(r.rel + rnd(1, 4));
      r.conf = clamp(r.conf + 1);
    }
    if (ask) {
      const ok = r.rel > 55 && r.conf > 50 && chance(0.6);
      const m = ok ? rnd(50, 400) * (r.destin === 'patron' || r.destin === 'avocat' ? 5 : 1) : 0;
      if (ok) s.money += m;
      r.conf = clamp(r.conf - 5);
      reply = ok ? `Ok je t’envoie ${euros(m)}, mais c’est la dernière fois 😅` : 'Désolé, je suis à sec en ce moment.';
    } else if (txt === 'Je t’aime ❤️') reply = ['partenaire', 'conjoint'].includes(r.lien) ? 'Moi aussi ❤️' : r.lien === 'mere' ? 'Moi aussi mon cœur ❤️' : 'Euh… ok 😅';
    else reply = bad ? pick(['Ok…', 'Comme tu veux.', '😒']) : pick(['Tranquille !', 'Grave, on se capte.', 'Ça marche 👍', 'Haha toujours le même 😂', 'J’attendais ton message !']);
    s.phone.msgs.push({ from: to, txt: reply, age: s.age, t: s.t, read: true });
  }
  return reply;
}

// ---------- Introduction animée ----------
export function introLines(s) {
  const mere = s.relations.find((r) => r.lien === 'mere');
  const pere = s.relations.find((r) => r.lien === 'pere');
  const fr = s.relations.filter((r) => r.lien === 'fratrie');
  const lieu = s.id.statut === 'au_pays' ? `${s.id.pays}` : s.id.ville;
  const lines = [
    `Tu es ${s.id.prenom} ${s.id.nom}.`,
    `Tu nais le ${fmtDate(s.t).replace(/^\w+ /, '').toLowerCase()} à ${lieu}.`,
    mere ? `Ta mère, ${mere.prenom}, a ${mere.age} ans. Elle est ${mere.job || 'à la maison'}.` : '',
    pere ? `Ton père, ${pere.prenom}, est ${pere.job || 'souvent absent'}.` : 'Ton père n’est pas là. Ta mère t’élève seule.',
    fr.length ? `Tu as ${fr.length} ${fr.length > 1 ? 'frères et sœurs' : fr[0].genre === 'f' ? 'sœur' : 'frère'} : ${fr.map((x) => x.prenom).join(', ')}.` : 'Tu es enfant unique.',
    `Famille ${MILIEUX[s.milieu].nom.toLowerCase()}. ${s.id.statut === 'au_pays' ? `Un jour, ta famille partira pour ${s.id.villeCible}.` : `Vous vivez : ${HOUSING[s.logementFamille]?.nom.toLowerCase() || 'chez la famille'}.`}`,
    `Personne ne le sait encore, mais tu as un talent : ${TALENTS[s.talent].toLowerCase()}.`,
    'Ta vie commence maintenant. Chaque choix comptera.',
  ];
  return lines.filter(Boolean);
}
// Métiers des parents à la création.
export function giveParentJobs(s) {
  s.relations.filter((r) => r.lien === 'mere' || r.lien === 'pere').forEach((r) => (r.job = pick(PARENT_JOBS[s.milieu])[r.genre === 'f' ? 1 : 0]));
}

// ---------- Expatriation ----------
export function expatriate(s, ville) {
  const d = EXPAT.find((x) => x.ville === ville);
  if (!d) return { r: '', err: true };
  if (s.age < 18) return { r: 'Il faut être majeur.', err: true };
  if (s.id.statut === 'sans_papiers') return { r: 'Impossible sans papiers.', err: true };
  if (s.money < d.prix) return { r: `Il te faut ${euros(d.prix)}.`, err: true };
  if (situation(s, d.pays) === 'guerre') return { r: `${d.pays} est en guerre. Les frontières sont fermées.`, err: true };
  s.money -= d.prix;
  s.id.ville = ville;
  s.expat = { pays: d.pays, scene: d.scene };
  s.chezParents = false;
  if (!s.logement || s.logement === 'pays') s.logement = 'appart';
  if (s.carriere && !['artiste', 'sport', 'crime', 'business'].includes(career(s).cat)) apply(s, { job: null });
  addLog(s, `Expatriation : nouvelle vie à ${ville} (${d.pays}).`);
  s.queue.push('nouvelle_ville');
  return { r: `Bienvenue à ${ville} !`, good: true };
}

// Appelé chaque année.
export function life2Tick(s) {
  if (!s.vivant) return;
  addictionTick(s);
  if (!s.vivant) return;
  diseaseTick(s);
  if (!s.vivant) return;
  friendsTick(s);
  footTick(s);
  worldNews(s);
  if (s.age >= 12 && !s.insta) {
    s.insta = { followers: rnd(20, 80), posts: [] };
  }
  if (s.insta && s.carriere?.id === 'influenceur') s.insta.followers = Math.min(300000000, Math.round(s.insta.followers * (1.02 + Math.random() * 0.1)));
  if (s.justice.prison === 0) delete s.flags.tel_prison;
  s.annee.use = {};
  s.annee.posts = 0;
}

registerFx('use', (s, v) => useSubstance(s, v));
registerFx('blesse', (s) => (s.blessure = s.age));
registerFx('confiance', (s, v) => {
  const list = v.lien === 'partenaire' ? s.relations.filter((r) => r.vivant && ['partenaire', 'conjoint'].includes(r.lien)) : v.lien === 'ami' ? [s.relations.filter((r) => r.vivant && r.lien === 'ami').sort((a, b) => b.rel - a.rel)[0]] : s.relations.filter((r) => r.vivant && r.lien === v.lien);
  list.filter(Boolean).forEach((r) => (r.conf = clamp((r.conf ?? 50) + v.d)));
});
registerFx('diagnostic', (s) => diagnose(s));
registerFx('telPrison', (s, v) => (v ? (s.flags.tel_prison = true) : delete s.flags.tel_prison));
registerFx('cure', (s, v) => cure(s, v === 'lourde'));

export { ADDICTIONS, DISEASES, DESTINS, EXPAT, SITUATIONS };
