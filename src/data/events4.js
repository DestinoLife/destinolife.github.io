// Événements v0.4 : rendez-vous issus des messages, décisions de carrière, vie dans l'illégal,
// relations qui pèsent sur les choix (ami avocat, ami flic, ultimatum du couple).
import { rnd, pick } from '../engine/rng.js';
import { CAREERS } from './careers.js';

const st = (s, k) => s.stats[k];
const cat = (s) => (s.carriere ? CAREERS[s.carriere.id].cat : null);
const partner = (s) => s.relations.find((r) => r.vivant && (r.lien === 'partenaire' || r.lien === 'conjoint'));
const amiDestin = (s, d) => s.relations.find((r) => r.vivant && r.destin === d && (r.conf ?? 50) >= 50);
const who = (s) => s.relations.find((r) => r.vivant && r.prenom === s.mem.rdv);

export const EVENTS4 = [
  // ================= Rendez-vous fixés par message (ils se passent vraiment) =================
  { id: 'rdv_famille', forced: 1, cat: 'Rendez-vous', avec: 'parents', pre: (s) => (s.tmp.p = s.mem.rdv), txt: 'Repas de famille chez {p}. L’odeur du plat t’accueille dès la porte.', ch: [
    { t: 'Profiter et parler de tout', fx: (s) => { const r = who(s); if (r) { r.rel = Math.min(100, r.rel + 8); r.conf = Math.min(100, (r.conf ?? 50) + 5); } return { bonheur: 7 }; }, r: 'Une soirée simple et précieuse.', days: 1, hour: [12, 14] },
    { t: 'Annoncer une grande nouvelle', fx: { bonheur: 4, charisme: 1 }, out: [{ p: 0.6, fx: { rel: { lien: 'parents', d: 6 } }, r: 'Tout le monde t’applaudit. Fierté.' }, { p: 1, fx: { rel: { lien: 'parents', d: -8 } }, r: 'Le repas tourne au débat houleux.' }], days: 1 },
    { t: 'Repartir avec un Tupperware', fx: { bonheur: 3, sante: 1 }, r: 'Trois jours de bons repas.', days: 1 },
  ] },
  { id: 'rdv_ami', forced: 1, cat: 'Rendez-vous', avec: 'ami', pre: (s) => (s.tmp.p = s.mem.rdv), txt: 'Soirée avec {p} comme prévu. L’ambiance monte vite.', ch: [
    { t: 'Faire la fête jusqu’au bout', fx: (s) => { const r = who(s); if (r) r.rel = Math.min(100, r.rel + 8); return { bonheur: 8, sante: -2 }; }, out: [{ p: 0.85, r: 'Grosse soirée. Vous en parlerez encore dans dix ans.' }, { p: 1, fx: { arrest: { motif: 'Tapage et ivresse', peine: [0, 0] } }, r: 'La police débarque à 3 h du matin.' }], days: 1, hour: [22, 23] },
    { t: 'Discuter de vos projets', fx: (s) => { const r = who(s); if (r) r.conf = Math.min(100, (r.conf ?? 50) + 10); return { bonheur: 5, intel: 1 }; }, r: 'Vous refaites le monde. {p} te confie ses rêves.', days: 1, hour: [20, 22] },
    { t: 'Repartir tôt', fx: { sante: 1 }, r: '{p} est un peu déçu, mais tu es en forme demain.', days: 1 },
  ] },
  { id: 'rdv_couple', forced: 1, cat: 'Rendez-vous', avec: 'partenaire', pre: (s) => (s.tmp.p = s.mem.rdv), txt: 'Dîner en tête-à-tête avec {p}. Bougies, regards complices.', ch: [
    { t: 'Sortir le grand jeu (300 €)', c: (s) => s.money >= 300, fx: (s) => { const r = who(s); if (r) { r.rel = Math.min(100, r.rel + 12); r.conf = Math.min(100, (r.conf ?? 50) + 6); } return { money: -300, bonheur: 10 }; }, r: 'Soirée parfaite. {p} te regarde avec des étoiles dans les yeux.', days: 1, hour: [21, 23] },
    { t: 'Parler de l’avenir', fx: (s) => { const r = who(s); if (r) r.conf = Math.min(100, (r.conf ?? 50) + 10); return { bonheur: 5 }; }, out: [{ p: 0.7, r: 'Vous voulez la même chose. Rassurant.' }, { p: 1, fx: { rel: { lien: 'partenaire', d: -8 } }, r: 'Vous ne voyez pas l’avenir pareil… malaise.' }], days: 1 },
    { t: 'Regarder ton téléphone', fx: { rel: { lien: 'partenaire', d: -10 }, confiance: { lien: 'partenaire', d: -5 } }, r: '« Tu m’écoutes au moins ? » Soirée gâchée.', days: 1 },
  ] },

  // ================= Décisions de carrière (légal) =================
  { id: 'formation', cat: 'Carrière', cond: (s) => cat(s) === 'classique' && s.carriere.annees >= 2, txt: 'Ton entreprise propose une formation diplômante le soir, pendant un an. Épuisant, mais ça ouvre des portes.', ch: [
    { t: 'S’inscrire', fx: { intel: 5, perf: 12, bonheur: -5, sante: -2 }, r: 'Une année dure, mais ton chef a remarqué tes efforts.' },
    { t: 'Garder tes soirées', fx: { bonheur: 3 }, r: 'Tu privilégies ta vie perso.' },
  ] },
  { id: 'mutation', cat: 'Carrière', cond: (s) => ['classique', 'police'].includes(cat(s)) && s.carriere.niveau >= 1, pre: (s) => (s.tmp.v = pick(['Lyon', 'Paris', 'Marseille', 'Bordeaux', 'Lille', 'Nantes'].filter((v) => v !== s.id.ville))), txt: 'On te propose une promotion… à condition de partir à {v}.', ch: [
    { t: 'Accepter et déménager', fx: (s) => { s.id.ville = s.tmp.v; return { jobLvl: 1, bonheur: -4, addRel: { lien: 'ami' } }; }, r: 'Nouvelle ville, nouveau poste, nouvelles têtes.', days: 20 },
    { t: 'Refuser, ta vie est ici', fx: { perf: -6, rel: { lien: 'parents', d: 4 } }, r: 'Tu restes près des tiens.' },
  ] },
  { id: 'collegue_conflit', cat: 'Carrière', cond: (s) => ['classique', 'business', 'police'].includes(cat(s)), txt: 'Un collègue s’attribue ton travail devant la direction. Encore.', ch: [
    { t: 'Le recadrer en réunion', out: [{ p: (s) => 0.4 + st(s, 'charisme') / 200, fx: { perf: 10, reputation: 3 }, r: 'Tout le monde a compris qui bosse vraiment.' }, { p: 1, fx: { perf: -8 }, r: 'Ça passe pour de l’agressivité. Mauvaise image.' }] },
    { t: 'En parler aux RH', fx: { perf: 3 }, r: 'Procédure lente, mais il se calme.' },
    { t: 'Laisser couler', fx: { bonheur: -5 }, r: 'Tu rumines tous les soirs.' },
  ] },
  { id: 'chasseur_tete', cat: 'Carrière', cond: (s) => cat(s) === 'classique' && s.carriere.perf >= 55, txt: 'Un concurrent te propose 25 % de salaire en plus pour le même poste.', ch: [
    { t: 'Partir', fx: { jobLvl: 1, bonheur: 4 }, out: [{ p: 0.75, r: 'Meilleur salaire, meilleure ambiance.' }, { p: 1, fx: { bonheur: -8 }, r: 'L’ambiance est toxique. Tu regrettes un peu.' }] },
    { t: 'Négocier avec ton patron actuel', out: [{ p: (s) => 0.35 + s.carriere.perf / 250, fx: { jobLvl: 1 }, r: 'Il s’aligne. Tu restes, augmenté{|e}.' }, { p: 1, fx: { perf: -10 }, r: 'Il le prend mal. Ambiance glaciale.' }] },
    { t: 'Rester fidèle', fx: { perf: 5, karma: 2 }, r: 'Ta loyauté est notée.' },
  ] },
  { id: 'greve', cat: 'Carrière', cond: (s) => cat(s) === 'classique', w: 0.6, txt: 'Tes collègues lancent une grève pour les salaires. On attend de voir de quel côté tu es.', ch: [
    { t: 'Faire grève', fx: { reputation: 5, money: -400, perf: -4 }, out: [{ p: 0.5, fx: { money: 1200 }, r: 'Victoire : augmentation générale.' }, { p: 1, r: 'Le mouvement s’essouffle sans rien obtenir.' }] },
    { t: 'Continuer à travailler', fx: { perf: 6, reputation: -6 }, r: 'Ta direction apprécie. Tes collègues beaucoup moins.' },
  ] },

  // ================= Vie dans l'illégal (pas un salarié !) =================
  { id: 'monter_en_grade', cat: 'Rue', cond: (s) => s.carriere?.id === 'reseau' && !s.reseau && s.carriere.niveau < 2 && st(s, 'reputation') >= 30 + s.carriere.niveau * 15, txt: 'Les grands ont vu que tu tenais la route. On te propose de passer au rang supérieur : plus d’argent, plus de risques.', ch: [
    { t: 'Accepter', fx: { jobLvl: 1, reputation: 6, recherche: 1, motif: 'Trafic de stupéfiants' }, r: 'Tu gagnes le respect du quartier. Et l’attention de la police.' },
    { t: 'Rester discret', fx: { karma: 1 }, r: 'Moins d’argent, moins d’ennuis.' },
  ] },
  { id: 'reprendre_point', cat: 'Rue', once: 1, cond: (s) => s.carriere?.id === 'reseau' && s.carriere.niveau >= 2 && !s.reseau && s.money >= 10000, txt: 'Le patron du point s’est fait arrêter. La place est libre… si tu oses la prendre.', ch: [
    { t: 'Prendre le point (10 000 €)', fx: (s) => { s.reseau = { points: 1, guetteurs: 2, vendeurs: 3, fournisseur: null, chaleur: 25, hist: [] }; return { money: -10000, reputation: 12, job: null, log: 'Tu deviens patron de ton propre point.' }; }, r: 'Tu es le patron maintenant. Il te faut un fournisseur (onglet Crime).' },
    { t: 'Laisser la place', r: 'Un autre la prendra.' },
  ] },
  { id: 'sortir_milieu', cat: 'Rue', cond: (s) => (cat(s) === 'crime' || s.reseau) && st(s, 'karma') >= 45 && s.age >= 22, w: 0.5, txt: 'Tu repenses à ta vie. Tu pourrais tout arrêter et repartir de zéro… mais on ne quitte pas le milieu facilement.', ch: [
    { t: 'Tout arrêter', fx: { karma: 8 }, out: [{ p: 0.6, fx: (s) => { s.reseau = null; return { job: null, bonheur: 8, log: 'Tu quittes le milieu.' }; }, r: 'Les anciens te laissent partir. Nouveau départ.' }, { p: 1, fx: (s) => { s.reseau = null; return { job: null, sante: -25, log: 'Tu quittes le milieu, mais ça te coûte cher.' }; }, r: 'Ils te font payer ton départ. Mais tu es libre.' }] },
    { t: 'Continuer', fx: { crime: 2 }, r: 'L’argent facile, c’est dur à lâcher.' },
  ] },

  // ================= Relations qui pèsent sur les choix =================
  { id: 'ami_flic_previent', forced: 1, cat: 'Police', pre: (s) => (s.tmp.f = amiDestin(s, 'flic')?.prenom || 'Un ami'), sms: '{f}', txt: 'Je devrais pas te dire ça… mais il y a une descente chez toi demain matin. Fais ce que tu as à faire.', ch: [
    { t: 'Faire le ménage et disparaître quelques jours', fx: { recherche: -1, money: -1500 }, r: 'Quand ils arrivent, l’appartement est vide. Merci {f}.', days: 4 },
    { t: 'Remercier et ne rien faire', fx: { confiance: { lien: 'ami', d: 5 } }, out: [{ p: 0.5, r: 'Ils ne trouvent rien de grave.' }, { p: 1, fx: (s) => ({ arrest: { motif: s.justice.motif || 'Affaires en cours', peine: [1, 3] } }), r: 'Tu aurais dû l’écouter.' }] },
  ] },
  { id: 'ultimatum', cat: 'Amour', cond: (s) => partner(s) && (cat(s) === 'crime' || s.reseau || s.addic && Math.max(...Object.values(s.addic)) > 50) && (partner(s).conf ?? 50) < 55, avec: 'partenaire',
    txt: '{partenaire} pose un ultimatum : « C’est moi ou cette vie-là. Choisis. »', ch: [
    { t: 'Choisir {partenaire}', fx: (s) => { s.reseau = null; const o = { confiance: { lien: 'partenaire', d: 25 }, rel: { lien: 'partenaire', d: 15 }, karma: 6 }; if (cat(s) === 'crime') o.job = null; return o; }, r: 'Tu tournes la page. {partenaire} te serre fort.' },
    { t: 'Promettre… sans changer', fx: { confiance: { lien: 'partenaire', d: -20 } }, r: '{partenaire} ne te croit qu’à moitié.' },
    { t: 'Choisir cette vie', fx: { rupture: true, bonheur: -10 }, r: 'Les cartons sont faits le soir même.' },
  ] },
  { id: 'ami_heberge', forced: 1, cat: 'Amitié', pre: (s) => (s.tmp.f = s.relations.filter((r) => r.vivant && r.lien === 'ami').sort((a, b) => (b.conf ?? 0) - (a.conf ?? 0))[0]?.prenom), txt: '{f} a appris que tu dormais dehors. Il débarque : « Tu viens chez moi. Pas de discussion. »', ch: [
    { t: 'Accepter', fx: { logement: 'hlm', bonheur: 12, confiance: { lien: 'ami', d: 10 } }, r: 'Un canapé, un toit, un ami. Tu te relèves.' },
    { t: 'Refuser par fierté', fx: { bonheur: -3 }, r: '« La porte reste ouverte. »' },
  ] },
];
