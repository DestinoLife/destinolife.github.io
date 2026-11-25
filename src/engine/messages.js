// Messages du téléphone (v0.4) : peu nombreux, cohérents avec la situation, toujours 2 réponses
// opposées qui ont des conséquences. « plan » = un rendez-vous qui se passe vraiment (événement).
// Un message laissé sans réponse expire à l'anniversaire suivant, avec une petite conséquence.
import { rnd, pick, chance, clamp, euros, weighted } from './rng.js';
import { apply, addLog, tpl, career, salary } from './core.js';
import { DAY, HOUR, birthdayAt, setHour, rollMeteo } from './time.js';

// ---------- Agenda : ce qu'on prévoit par message a une vraie date. Le bouton « Avancer » saute jusqu'à là.
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
export function quand(s, at) {
  const n = Math.floor(at / DAY) - Math.floor(s.t / DAY);
  return n <= 0 ? (new Date(at).getUTCHours() >= 18 ? 'ce soir' : 'aujourd’hui') : n === 1 ? 'demain' : n < 7 ? JOURS[new Date(at).getUTCDay()] : `dans ${n} jours`;
}
export function addPlan(s, id, when = {}, label = '', who = null) {
  s.plans ??= [];
  const cur = new Date(s.t).getUTCDay();
  const days = when.dow != null ? ((when.dow - cur + 7) % 7) || 7 : Array.isArray(when.days) ? rnd(when.days[0], when.days[1]) : when.days ?? 1;
  let at = setHour(s.t + days * DAY, when.hour ?? 19, 0);
  if (at <= s.t) at = s.t + 2 * HOUR;
  at = Math.min(at, birthdayAt(s.birthT, s.age + 1) - 3 * HOUR);
  if (s.mem.rdv === undefined || who) s.mem.rdv = who;
  s.plans.push({ id, at, label: tpl(label, s), who });
  s.plans.sort((a, b) => a.at - b.at);
  return quand(s, at);
}
export const nextPlan = (s) => (s.plans || [])[0] || null;
// Avance l'horloge jusqu'au prochain plan et le met dans la file des événements.
export function runPlan(s) {
  s.plans ??= [];
  let p = s.plans.shift();
  while (p && s.justice.prison > 0 && p.id !== 'parloir') p = s.plans.shift();
  if (!p) return null;
  if (p.at > s.t) {
    s.t = p.at;
    s.meteo = rollMeteo(s.t, s.id.ville);
  }
  if (p.who) s.mem.rdv = p.who;
  s.queue.unshift(p.id);
  return p;
}

const one = (s, ...l) => s.relations.filter((r) => r.vivant && l.includes(r.lien)).sort((a, b) => b.rel - a.rel)[0];
const relFx = (r, d, c = 0) => (s) => {
  if (!r) return;
  r.rel = clamp(r.rel + d);
  r.conf = clamp((r.conf ?? 50) + c);
};

// who(s) : la personne qui écrit (relation ou nom fixe). ch : [{ t, fx(s, r), rep, plan }]
const TEMPLATES = [
  { id: 'mere_dimanche', w: 1, who: (s) => s.age >= 11 && !s.chezParents && one(s, 'mere'),
    txt: 'Tu viens manger dimanche ? J’ai fait ton plat préféré.', ch: [
      { t: 'J’arrive !', fx: (s, r) => relFx(r, 6, 2)(s), rep: 'Super, je mets une assiette de plus ❤️', plan: 'rdv_famille', when: { dow: 0, hour: 12 }, label: 'Repas chez ta mère' },
      { t: 'Pas ce week-end', fx: (s, r) => relFx(r, -6, -2)(s), rep: 'Comme d’habitude… 😔' }] },
  { id: 'mere_aide', w: 2, who: (s) => s.age >= 18 && s.money < 0 && one(s, 'mere', 'pere'),
    txt: 'Je sais que c’est dur en ce moment. Tu veux que je t’aide un peu ?', ch: [
      { t: 'Oui, merci', fx: (s, r) => { const m = { precaire: 100, modeste: 400, moyenne: 1500, aisee: 5000, riche: 20000 }[s.milieu]; apply(s, { money: m, bonheur: 4 }); relFx(r, 3, 4)(s); }, rep: 'Je t’ai fait un virement. Prends soin de toi.' },
      { t: 'Non, je m’en sors', fx: (s, r) => { apply(s, { karma: 2 }); relFx(r, 2, 6)(s); }, rep: 'Je suis fière de toi. Mais n’hésite pas.' }] },
  { id: 'pere_parler', w: 1, who: (s) => s.age >= 15 && (one(s, 'pere')?.rel ?? 100) < 45 && one(s, 'pere'),
    txt: 'On devrait parler, toi et moi. Ça fait trop longtemps.', ch: [
      { t: 'D’accord, on se voit', fx: (s, r) => relFx(r, 12, 6)(s), rep: 'Merci. Samedi, au café du coin ?', plan: 'rdv_famille', when: { dow: 6, hour: 15 }, label: 'Café avec ton père' },
      { t: 'Y’a rien à dire', fx: (s, r) => relFx(r, -10, -6)(s), rep: '…' }] },
  { id: 'ami_soiree', w: 1.4, who: (s) => s.age >= 13 && s.age <= 35 && one(s, 'ami'),
    txt: (s) => (s.age < 18 ? 'Soirée chez moi samedi, mes parents sont pas là. Tu viens ?' : 'Grosse soirée samedi, tout le monde sera là. Tu viens ?'), ch: [
      { t: 'Grave, j’arrive', fx: (s, r) => relFx(r, 5, 2)(s), rep: 'Trop bien, ramène du monde 🔥', plan: 'rdv_ami', when: { dow: 6, hour: 22 }, label: 'Soirée chez {ami}' },
      { t: 'Je peux pas', fx: (s, r) => relFx(r, -4)(s), rep: 'T’es jamais là en ce moment…' }] },
  { id: 'ami_pret', w: 1.2, who: (s) => s.age >= 18 && s.money > 600 && s.relations.find((r) => r.vivant && r.lien === 'ami' && (r.destin === 'galere' || chance(0.3))),
    txt: 'Je suis vraiment dans la galère… tu peux me prêter 500 € ? Je te rembourse vite, promis.', ch: [
      { t: 'Je t’envoie ça', fx: (s, r) => { apply(s, { money: -500, karma: 3 }); relFx(r, 10, 15)(s); if (chance(0.5)) s.mem.dette = r.prenom; }, rep: 'T’es un vrai. Je l’oublierai pas.' },
      { t: 'Désolé, pas possible', fx: (s, r) => relFx(r, -8, -4)(s), rep: 'Ok… je pensais pouvoir compter sur toi.' }] },
  { id: 'couple_diner', w: 1.4, who: (s) => s.age >= 16 && one(s, 'partenaire', 'conjoint'),
    txt: 'Dîner ce soir, juste nous deux ? J’ai envie de te voir ❤️', ch: [
      { t: 'Avec plaisir', fx: (s, r) => relFx(r, 6, 3)(s), rep: '20 h, je réserve 😍', plan: 'rdv_couple', when: { days: 0, hour: 20 }, label: 'Dîner en amoureux' },
      { t: 'Je suis occupé{|e}', fx: (s, r) => relFx(r, -8, -3)(s), rep: 'T’es toujours occupé{|e}…' }] },
  { id: 'couple_jaloux', w: 1.5, who: (s) => { const p = one(s, 'partenaire', 'conjoint'); return p && (p.conf ?? 50) < 45 && p; },
    txt: 'Tu étais où hier soir ? Ton téléphone était éteint.', ch: [
      { t: 'Avec des potes, appelle-les si tu veux', fx: (s, r) => relFx(r, 2, 10)(s), rep: 'Ok… désolé{|e}, je stresse pour rien.' },
      { t: 'C’est pas tes affaires', fx: (s, r) => relFx(r, -10, -12)(s), rep: 'Très bien. On en reparlera.' }] },
  { id: 'classe_reponses', w: 1, who: (s) => s.age >= 12 && s.age <= 17 && ['ecole', 'lycee', 'cap'].includes(s.etudes.cursus) && 'Groupe de la classe',
    txt: 'Contrôle de maths demain, quelqu’un a les réponses ???', ch: [
      { t: 'Je vous les envoie', fx: (s) => (chance(0.25) ? apply(s, { reputation: 2, rel: { lien: 'parents', d: -8 }, log: 'Le prof a découvert la triche dans le groupe. Convocation.' }) : apply(s, { reputation: 4, karma: -2 })), rep: 'T’ES UN BOSS 🙏' },
      { t: 'Révisez, bande de flemmards', fx: (s) => apply(s, { intel: 2, reputation: -2 }), rep: 'Bouffon 😂' }] },
  { id: 'boss_rush', w: 1.2, who: (s) => s.carriere && career(s).cat === 'classique' && 'Ton boss',
    txt: 'Grosse charge ce week-end. Tu peux venir ? Payé double.', ch: [
      { t: 'Je viens', fx: () => {}, rep: 'Merci, je m’en souviendrai à ton entretien annuel.', plan: 'weekend_boss', when: { dow: 6, hour: 9 }, label: 'Week-end au boulot (payé double)' },
      { t: 'Non, c’est mon week-end', fx: (s) => apply(s, { perf: -6, bonheur: 3 }), rep: 'Dommage. Noté.' }] },
  { id: 'manager_marque', w: 1.3, who: (s) => s.carriere && ['artiste', 'sport'].includes(career(s).cat) && s.carriere.niveau >= 1 && (career(s).cat === 'sport' ? 'Ton agent' : 'Ton manager'),
    txt: (s) => `Une marque veut te sponsoriser : ${euros((s.carriere.niveau + 1) * 20000)}, mais tu portes leurs fringues partout pendant un an.`, ch: [
      { t: 'On signe', fx: (s) => apply(s, { money: (s.carriere.niveau + 1) * 20000, notoriete: 3, karma: -1 }), rep: 'Contrat envoyé. Bien joué 💸' },
      { t: 'Refuse, ça fait vendu', fx: (s) => apply(s, { reputation: 4, karma: 2 }), rep: 'Ok, l’image d’abord. Je respecte.' }] },
  { id: 'agent_transfert', w: 1, who: (s) => s.carriere?.id === 'foot' && s.carriere.niveau >= 1 && s.carriere.niveau < 4 && 'Ton agent',
    txt: 'Un plus gros club te veut, mais tu commencerais remplaçant. On tente ?', ch: [
      { t: 'On tente', fx: (s) => (chance(0.35 + s.stats.forme / 300) ? apply(s, { jobLvl: 1, notoriete: 6, log: 'Transfert réussi : tu gagnes ta place de titulaire.' }) : apply(s, { bonheur: -8, notoriete: -3, log: 'Transfert raté : une saison sur le banc.' })), rep: 'Je lance les négociations.' },
      { t: 'Je reste où je joue', fx: (s) => apply(s, { reputation: 4, bonheur: 2 }), rep: 'Les supporters vont adorer.' }] },
  { id: 'reseau_condes', w: 2, who: (s) => s.reseau && s.justice.prison === 0 && 'Le guetteur du bâtiment C',
    txt: 'Patron, t’es dans le quartier ? Les condés tournent au bâtiment C depuis ce matin.', ch: [
      { t: 'Fermez le point aujourd’hui', fx: (s) => { s.reseau.chaleur = clamp(s.reseau.chaleur - 12); apply(s, { money: -2000 }); }, rep: 'Bien reçu, on ferme. Sage décision.' },
      { t: 'On continue, c’est rien', fx: (s) => { s.reseau.chaleur = clamp(s.reseau.chaleur + 10); apply(s, { money: 6000, sale: 6000 }); if (chance(0.25)) apply(s, { recherche: 1, motif: 'Trafic de stupéfiants', log: 'Un de tes vendeurs se fait serrer. Ton nom circule.' }); }, rep: 'Ok patron, on reste ouverts.' }] },
  { id: 'reseau_livraison', w: 1.5, who: (s) => s.carriere?.id === 'reseau' && !s.reseau && 'Le grand du quartier',
    txt: 'J’ai besoin de toi ce soir pour une livraison. 800 € cash.', ch: [
      { t: 'J’y vais', fx: () => {}, rep: 'Bien. 22 h derrière le Lidl.', plan: 'livraison_soir', when: { days: 0, hour: 22 }, label: 'Livraison derrière le Lidl' },
      { t: 'Pas ce soir', fx: (s) => apply(s, { reputation: -5, perf: -10 }), rep: 'T’es sûr ? Faut pas trop me dire non.' }] },
  { id: 'fournisseur_arrivage', w: 1, who: (s) => s.reseau && s.relations.find((r) => r.vivant && r.id === s.reseau.fournisseur),
    txt: 'Arrivage de qualité. Prix spécial si tu prends le double cette fois.', ch: [
      { t: 'Je prends le double', fx: (s, r) => { apply(s, { money: -20000 }); relFx(r, 6, 5)(s); }, rep: 'Livraison jeudi. Tu vas pas regretter.', plan: 'arrivage', when: { dow: 4, hour: 23 }, label: 'Arrivage de marchandise' },
      { t: 'Pas besoin', fx: (s, r) => relFx(r, -2)(s), rep: 'Comme tu veux.' }] },
  { id: 'insta_marque', w: 1.5, who: (s) => s.insta && s.insta.followers >= 8000 && 'Instapic · Partenariats',
    txt: (s) => `Une marque de sneakers propose ${euros(Math.round(Math.sqrt(s.insta.followers) * 25))} pour un post sponsorisé.`, ch: [
      { t: 'Accepter', fx: (s) => apply(s, { money: Math.round(Math.sqrt(s.insta.followers) * 25) }), rep: 'Super ! Le brief arrive par mail.' },
      { t: 'Refuser, ça fait pub', fx: (s) => (s.insta.followers = Math.round(s.insta.followers * 1.03)), rep: 'Dommage, une prochaine fois peut-être.' }] },
  { id: 'conseiller_interview', w: 1.2, who: (s) => s.carriere && career(s).cat === 'politique' && 'Ton conseiller',
    txt: 'Un grand média demande une interview demain. Ils vont parler de ton passé.', ch: [
      { t: 'Y aller franchement', fx: () => {}, rep: 'Prépare-toi bien, je t’envoie les fiches.', plan: 'interview_media', when: { days: 1, hour: 8 }, label: 'Interview sur un grand média' },
      { t: 'Refuser', fx: (s) => apply(s, { notoriete: -2 }), rep: 'Ok, mais ils vont dire que tu fuis.' }] },
  { id: 'prison_mere', w: 2, who: (s) => s.justice.prison > 0 && s.flags.tel_prison && one(s, 'mere'),
    txt: 'Tiens bon. Je viendrai au parloir samedi. Tu as besoin de quelque chose ?', ch: [
      { t: 'Juste de te voir', fx: (s, r) => relFx(r, 4, 3)(s), rep: 'Je serai là. Je t’aime.', plan: 'parloir', when: { dow: 6, hour: 14 }, label: 'Parloir avec ta mère' },
      { t: 'Envoie de l’argent pour la cantine', fx: (s, r) => { apply(s, { money: 300 }); relFx(r, -2)(s); }, rep: 'Je fais ce que je peux…' }] },
];
const T = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));

export const unread = (s) => s.phone.msgs.filter((m) => m.ch && !m.answered).length;
export function refreshUnread(s) {
  s.phone.unread = unread(s);
}

// Fin d'année : expire les messages sans réponse, puis envoie au plus 2 nouveaux messages pertinents.
export function messagesTick(s) {
  if (s.age < 11 || !s.vivant) return;
  for (const m of s.phone.msgs) {
    if (m.ch && !m.answered) {
      m.answered = 'ignore';
      const r = s.relations.find((x) => x.vivant && x.prenom === m.from);
      if (r) {
        r.rel = clamp(r.rel - 4);
        r.conf = clamp((r.conf ?? 50) - 3);
        addLog(s, `Tu n’as jamais répondu à ${r.prenom}.`);
      }
    }
  }
  if (s.justice.prison > 0 && !s.flags.tel_prison) return refreshUnread(s);
  const pool = TEMPLATES.map((t) => ({ t, who: t.who(s) })).filter((x) => x.who && !(s.lastMsg?.[x.t.id] >= s.age - 3));
  const n = Math.min(2, pool.length);
  for (let i = 0; i < n; i++) {
    const x = weighted(pool, (p) => p.t.w);
    if (!x) break;
    pool.splice(pool.indexOf(x), 1);
    const from = typeof x.who === 'string' ? x.who : x.who.prenom;
    s.lastMsg ??= {};
    s.lastMsg[x.t.id] = s.age;
    s.phone.msgs.push({ id: s.uid++, tpl: x.t.id, from, txt: tpl(x.t.txt, s), ch: x.t.ch.map((c) => tpl(c.t, s)), answered: false, age: s.age, t: s.t, read: false });
  }
  if (s.phone.msgs.length > 120) s.phone.msgs.splice(0, s.phone.msgs.length - 120);
  refreshUnread(s);
}

// Répondre à un message : applique la conséquence, ajoute la réponse, lance le rendez-vous s'il y en a un.
export function answer(s, msgId, i) {
  const m = s.phone.msgs.find((x) => x.id === msgId);
  if (!m || m.answered) return null;
  const c = T[m.tpl]?.ch[i];
  if (!c) return null;
  const r = s.relations.find((x) => x.vivant && x.prenom === m.from);
  m.answered = i + 1;
  s.phone.msgs.push({ from: 'Moi', conv: m.from, mine: true, txt: tpl(c.t, s), age: s.age, t: s.t, read: true });
  c.fx(s, r);
  if (c.rep) s.phone.msgs.push({ from: m.from, txt: tpl(c.rep, s), age: s.age, t: s.t, read: true });
  refreshUnread(s);
  if (c.plan && s.vivant) {
    s.tmp = { ...(s.tmp || {}), ami: m.from };
    const q = addPlan(s, c.plan, c.when, c.label || `Rendez-vous avec ${m.from}`, m.from);
    return { plan: true, r: `Prévu ${q} : ${tpl(c.label || 'rendez-vous avec ' + m.from, s)}. Appuie sur « Avancer » pour y aller.` };
  }
  return { r: '' };
}

// Écrire soi-même : les sujets dépendent du lien avec la personne.
export function topicsFor(r) {
  if (!r) return [];
  if (r.lien === 'mere' || r.lien === 'pere') return [['visite', 'Je passe vous voir ?'], ['argent', 'Tu peux m’aider financièrement ?'], ['amour', 'Je t’aime ❤️']];
  if (r.lien === 'partenaire' || r.lien === 'conjoint') return [['diner', 'Dîner ce soir ?'], ['parler', 'On doit parler…'], ['amour', 'Je t’aime ❤️']];
  if (r.lien === 'contact') return [['affaire', 'On fait affaire ?'], ['prix', 'Tu peux baisser ton prix ?']];
  if (r.lien === 'enfant') return [['visite', 'Je passe te voir ?'], ['amour', 'Je suis fier{|e} de toi ❤️']];
  return [['sortie', 'On se voit cette semaine ?'], ['argent', 'Tu peux me dépanner ?'], ['service', 'J’ai besoin d’un service']];
}
export function writeTo(s, r, topic) {
  const key = `${r.id}:msg`;
  if (s.relUsed[key]) return { r: `Tu as déjà écrit à ${r.prenom} récemment.`, err: true };
  s.relUsed[key] = true;
  const label = (topicsFor(r).find((t) => t[0] === topic) || [, ''])[1];
  s.phone.msgs.push({ from: 'Moi', conv: r.prenom, mine: true, txt: tpl(label, s), age: s.age, t: s.t, read: true });
  const ok = r.rel > 45 && (r.conf ?? 50) > 40;
  let rep = '';
  let plan = null;
  if (topic === 'visite' || topic === 'sortie' || topic === 'diner') {
    if (ok || chance(0.4)) {
      rep = pick(['Grave ! Ce soir ?', 'Avec plaisir, je t’attends.', 'Enfin ! On se cale ça.']);
      plan = topic === 'diner' ? 'rdv_couple' : topic === 'visite' ? 'rdv_famille' : 'rdv_ami';
    } else rep = pick(['Pas dispo en ce moment, désolé.', 'Une autre fois peut-être.']);
  } else if (topic === 'argent') {
    const good = ok && chance(0.6);
    const m = good ? Math.round((r.lien === 'mere' || r.lien === 'pere' ? { precaire: 60, modeste: 250, moyenne: 900, aisee: 3000, riche: 12000 }[s.milieu] : rnd(100, 500)) * (0.6 + Math.random() * 0.8)) : 0;
    if (good) s.money += m;
    r.conf = clamp((r.conf ?? 50) - 5);
    rep = good ? `Je t’envoie ${euros(m)}. Fais-en bon usage.` : 'Désolé, je ne peux pas en ce moment.';
  } else if (topic === 'amour') {
    r.rel = clamp(r.rel + rnd(3, 6));
    rep = r.rel > 50 ? pick(['Moi aussi ❤️', 'Ça me touche énormément.', '🥹❤️']) : 'Euh… merci ?';
  } else if (topic === 'parler') {
    const g = chance(0.5 + (r.conf ?? 50) / 200);
    r.conf = clamp((r.conf ?? 50) + (g ? 8 : -6));
    r.rel = clamp(r.rel + (g ? 4 : -8));
    rep = g ? 'Tu as raison, parlons-en calmement ce soir.' : 'Encore ? J’en peux plus de ces discussions.';
  } else if (topic === 'affaire') {
    rep = r.role === 'fournisseur' && s.reseau ? 'Je peux te fournir. Choisis-moi comme fournisseur dans ton business.' : 'Je te tiens au courant si j’ai un plan.';
    r.rel = clamp(r.rel + 3);
  } else if (topic === 'prix') {
    const g = chance(0.35 + s.stats.charisme / 250 + r.rel / 300);
    if (g) r.tarif = Math.max(0.55, Math.round(((r.tarif || 1) - 0.08) * 100) / 100);
    rep = g ? `Ok, ok… ×${r.tarif}, c’est mon dernier prix.` : 'C’est déjà un prix d’ami, frère.';
  } else if (topic === 'service') {
    rep = r.destin ? 'Dis-moi ce dont tu as besoin, je vois ce que je peux faire. (Demande-le-moi depuis tes relations.)' : 'Je peux pas grand-chose pour toi pour l’instant.';
  }
  s.phone.msgs.push({ from: r.prenom, txt: rep, age: s.age, t: s.t, read: true });
  let q = '';
  if (plan) q = addPlan(s, plan, { days: [1, 4], hour: topic === 'diner' ? 20 : 19 }, plan === 'rdv_couple' ? `Dîner avec ${r.prenom}` : plan === 'rdv_famille' ? `Visite chez ${r.prenom}` : `Sortie avec ${r.prenom}`, r.prenom);
  return { r: plan ? `${rep} (prévu ${q})` : rep, plan: !!plan };
}
