// Banque d'événements de Destino.
// Format : { id, cat, age:[min,max], cond(s), w (poids), once, major (nb de jours pour une décision majeure),
//   chain (suite d'une chaîne, jamais tiré au hasard), forced (déclenché par le moteur), where:'prison', pre(s), txt,
//   ch: [{ t (libellé), h (indice), c(s) (condition), fx, r (texte du résultat), next, days,
//          out: [{ p (proba ou fonction), fx, r, next, days }] }] }
// Textes : {prenom} {ami} {partenaire} {pays} {€montant} {e} (accord) {masculin|féminin}.
import { rnd, pick, chance } from '../engine/rng.js';
import { CAREERS, DIPLOMES } from './careers.js';
import { MILIEUX } from './identity.js';
import { EVENTS2 } from './events2.js';
import { EVENTS3 } from './events3.js';
import { EVENTS4 } from './events4.js';
import { EVENTS5 } from './events5.js';
import { EVENTS6 } from './events6.js';
import { EVENTS7 } from './events7.js';
import { EVENTS8 } from './events8.js';
import { EVENTS9 } from './events9.js';

const P = (s) => s.justice.prison > 0;
const job = (s, id) => s.carriere?.id === id;
const cat = (s, c) => !!s.carriere && CAREERS[s.carriere.id].cat === c;
const lvl = (s) => s.carriere?.niveau ?? -1;
const single = (s) => !s.relations.some((r) => r.vivant && (r.lien === 'partenaire' || r.lien === 'conjoint'));
const partner = (s) => s.relations.find((r) => r.vivant && (r.lien === 'partenaire' || r.lien === 'conjoint'));
const precaire = (s) => ['rue', 'bidonville', 'foyer', 'hlm'].includes(s.logement);
const sp = (s) => s.id.statut === 'sans_papiers';
const tr = (s, t) => s.traits.includes(t);
const st = (s, k) => s.stats[k];
const dip = (s, d) => DIPLOMES.indexOf(s.etudes.niveau) >= DIPLOMES.indexOf(d);
const gain = (a, b) => (s) => (s.tmp.x = rnd(a, b));
const parentsAlive = (s) => s.relations.some((r) => r.vivant && (r.lien === 'mere' || r.lien === 'pere'));
const newCandidate = (s, minAge = -3, maxAge = 4) => {
  const genre = s.id.attirance === 'hf' ? pick(['h', 'f']) : s.id.attirance || (s.id.genre === 'f' ? 'h' : 'f');
  return { id: s.uid++, lien: 'candidat', genre, prenom: '', nom: '', age: Math.max(16, s.age + rnd(minAge, maxAge)), rel: 70, vivant: true };
};

export const EVENTS = [
  // ================= ENFANCE =================
  { id: 'premier_mot', cat: 'Enfance', age: [1, 2], once: 1, txt: 'Toute la famille est penchée sur toi. Tu es sur le point de dire ton premier mot.', ch: [
    { t: '« Maman »', fx: { bonheur: 4, rel: { lien: 'mere', d: 12 } }, r: 'Ta mère a les larmes aux yeux.' },
    { t: '« Papa »', fx: { bonheur: 4, rel: { lien: 'pere', d: 12 } }, r: 'Ton père le raconte à tout l’immeuble.' },
    { t: 'Un gros mot entendu à la télé', fx: { bonheur: 6, charisme: 3 }, r: 'Silence gêné, puis fou rire général.' },
  ] },
  { id: 'bebe_fievre', cat: 'Santé', age: [0, 4], txt: 'Tu as une forte fièvre en pleine nuit.', ch: [
    { t: 'Pleurer jusqu’à ce qu’on t’emmène aux urgences', out: [{ p: 0.85, fx: { sante: 2 }, r: 'Simple virus. Tu t’en remets vite.' }, { p: 1, fx: { sante: -12 }, r: 'Une vilaine infection. Quelques jours à l’hôpital.' }] },
    { t: 'Te rendormir', out: [{ p: 0.7, r: 'Au matin, la fièvre est tombée.' }, { p: 1, fx: { sante: -8 }, r: 'Ça s’aggrave. Tu finis quand même aux urgences.' }] },
  ] },
  { id: 'dessin_classe', cat: 'École', age: [4, 10], txt: 'La maîtresse affiche les dessins de la classe. Le tien représente…', ch: [
    { t: 'Ta famille au complet', fx: { art: 3, bonheur: 3 }, r: 'Tout le monde trouve ça touchant.' },
    { t: 'Un monstre qui dévore l’école', fx: { art: 5, charisme: 2 }, r: 'Tes parents sont convoqués. Ton dessin est pourtant génial.' },
    { t: 'Rien, tu refuses de dessiner', fx: { art: -2, reputation: 1 }, r: 'Tu passes la récré au coin.' },
  ] },
  { id: 'cour_bagarre', cat: 'École', age: [6, 14], txt: 'Dans la cour, un grand te pousse et prend ton goûter devant tout le monde.', ch: [
    { t: 'Lui mettre une droite', out: [{ p: (s) => 0.35 + st(s, 'forme') / 200, fx: { reputation: 8, bonheur: 4, flag: 'bagarreur' }, r: 'Il tombe. Plus personne ne t’embête.' }, { p: 1, fx: { sante: -6, bonheur: -6 }, r: 'Il est plus fort. Tu rentres avec un œil au beurre noir.' }] },
    { t: 'Aller voir la maîtresse', fx: { karma: 3, reputation: -4 }, r: 'Il est puni, mais on te traite de balance.' },
    { t: 'Laisser tomber', fx: { bonheur: -4 }, r: 'Tu rumines toute la journée.' },
  ] },
  { id: 'club_sport', cat: 'Enfance', age: [6, 11], once: 1, txt: 'Tes parents veulent t’inscrire à une activité. Tu choisis…', ch: [
    { t: 'Le club de foot', fx: { forme: 6, flag: 'club_foot' }, r: 'Tu deviens vite le chouchou de l’entraîneur.' },
    { t: 'La boxe', fx: { forme: 6, flag: 'club_boxe' }, r: 'Tu apprends la discipline et à encaisser.' },
    { t: 'Le basket', fx: { forme: 6, flag: 'club_basket' }, r: 'Tu passes tes soirées au playground.' },
    { t: 'Le conservatoire de musique', fx: { art: 7, intel: 2, flag: 'conservatoire' }, r: 'Le solfège, c’est dur. Mais tu as l’oreille.' },
    { t: 'Rien, la console c’est mieux', fx: { bonheur: 5, forme: -3 }, r: 'Tu deviens imbattable en ligne.' },
  ] },
  { id: 'parents_dispute', cat: 'Famille', age: [4, 16], once: 1, cond: (s) => s.relations.filter((r) => r.vivant && (r.lien === 'mere' || r.lien === 'pere')).length === 2,
    txt: 'Tes parents se disputent de plus en plus fort le soir. Ce soir, ça hurle.', ch: [
    { t: 'Mettre ton casque et monter le son', fx: { bonheur: -4 }, r: 'Tu fais comme si de rien n’était.' },
    { t: 'Aller les voir pour que ça s’arrête', out: [{ p: 0.5, fx: { bonheur: 2, rel: { lien: 'parents', d: 5 } }, r: 'Ils se calment en te voyant.' }, { p: 1, fx: { bonheur: -8, flag: 'parents_divorces' }, r: 'Quelques semaines plus tard, ils annoncent leur divorce.' }] },
    { t: 'Dormir chez {ami}', fx: { bonheur: -2, reputation: 2, rel: { lien: 'ami', d: 8 } }, r: 'Tout le monde te cherche jusqu’à minuit.' },
  ] },
  { id: 'harcelement', cat: 'École', age: [8, 15], once: 1, txt: 'Un groupe se moque de toi tous les jours : ton nom, tes habits, ta tête. Ça dure depuis des semaines.', ch: [
    { t: 'En parler à un adulte', out: [{ p: 0.6, fx: { bonheur: 4, karma: 2 }, r: 'Le CPE intervient. Ça se calme.' }, { p: 1, fx: { bonheur: -5 }, r: 'Personne ne fait rien. Tu te sens seul{e}.' }] },
    { t: 'Les affronter', out: [{ p: (s) => 0.3 + st(s, 'forme') / 200 + st(s, 'charisme') / 300, fx: { reputation: 8, bonheur: 5 }, r: 'Ils ne s’y attendaient pas. Ils te laissent tranquille.' }, { p: 1, fx: { sante: -5, bonheur: -6 }, r: 'Ça tourne à la bagarre générale. Tu es exclu{e} trois jours.' }] },
    { t: 'Encaisser en silence', fx: { bonheur: -10, intel: 3 }, r: 'Tu te réfugies dans les livres.' },
  ] },
  { id: 'boulangerie', cat: 'Rue', age: [7, 12], txt: '{ami} te met au défi de piquer des bonbons à la boulangerie.', ch: [
    { t: 'Relever le défi', out: [{ p: 0.7, fx: { crime: 3, reputation: 4, karma: -3 }, r: 'Personne n’a rien vu. Ton cœur bat à 200.' }, { p: 1, fx: { karma: -3, bonheur: -5, rel: { lien: 'parents', d: -8 } }, r: 'La boulangère t’attrape et appelle tes parents.' }] },
    { t: 'Refuser', fx: { karma: 2, reputation: -2 }, r: '{ami} te traite de {trouillard|trouillarde}.' },
  ] },
  { id: 'anniv_cadeau', cat: 'Famille', age: [5, 12], cond: (s) => s.milieu !== 'precaire', txt: 'Pour ton anniversaire, tu peux demander un seul cadeau.', ch: [
    { t: 'Une console', fx: { bonheur: 7, intel: -1 }, r: 'Tu ne la lâches plus.' },
    { t: 'Des livres et un microscope', fx: { intel: 6 }, r: 'Tu dévores tout.' },
    { t: 'Un ballon et des crampons', fx: { forme: 5 }, r: 'Tu joues jusqu’à la nuit.' },
    { t: 'Un micro et une enceinte', fx: { art: 6 }, r: 'Les voisins s’en souviendront.' },
  ] },
  { id: 'anniv_precaire', cat: 'Famille', age: [5, 12], cond: (s) => s.milieu === 'precaire', txt: 'Cette année encore, il n’y a pas d’argent pour ton anniversaire. Ta mère s’excuse.', ch: [
    { t: 'Lui dire que ce n’est pas grave', fx: { karma: 4, rel: { lien: 'mere', d: 10 } }, r: 'Elle te serre fort dans ses bras.' },
    { t: 'Faire une crise', fx: { bonheur: -4, rel: { lien: 'mere', d: -8 } }, r: 'Tu le regrettes le soir même.' },
    { t: 'Te débrouiller pour gagner un peu d’argent', fx: { money: 40, charisme: 2, crime: 1 }, r: 'Tu revends des bonbons à la récré.' },
  ] },
  { id: 'redoublement', cat: 'École', age: [8, 16], once: 1, cond: (s) => st(s, 'intel') < 35, txt: 'Le conseil de classe hésite à te faire redoubler.', ch: [
    { t: 'Promettre de bosser', out: [{ p: 0.5, fx: { intel: 4 }, r: 'Tu passes de justesse.' }, { p: 1, fx: { bonheur: -6, flag: 'redoublant' }, r: 'Tu redoubles.' }] },
    { t: 'Dire que tu t’en fiches', fx: { bonheur: -3, reputation: 3, flag: 'redoublant' }, r: 'Tu redoubles. Tes potes trouvent ça stylé.' },
  ] },
  { id: 'prof_croit', cat: 'École', age: [9, 17], once: 1, txt: 'Une prof te prend à part : « Tu as un vrai potentiel, mais tu le gâches. »', ch: [
    { t: 'L’écouter et bosser', fx: { intel: 8, karma: 2 }, r: 'Tes notes remontent en flèche.' },
    { t: 'Hausser les épaules', fx: { reputation: 2 }, r: 'Elle soupire.' },
  ] },

  // ================= ADOLESCENCE =================
  { id: 'premiere_clope', cat: 'Rue', age: [12, 17], once: 1, txt: 'Derrière le gymnase, on te tend une cigarette.', ch: [
    { t: 'Essayer', fx: { sante: -3, reputation: 3, flag: 'fumeur' }, r: 'Tu tousses à mort mais tu fais genre.' },
    { t: 'Non merci', fx: { sante: 1 }, r: 'Personne n’insiste.' },
  ] },
  { id: 'guetteur', cat: 'Rue', age: [13, 17], once: 1, cond: (s) => precaire(s) && !s.carriere,
    txt: 'Un grand du quartier te propose 50 € par jour pour faire le guet en bas du bâtiment. « C’est rien, tu cries juste quand les keufs arrivent. »', ch: [
    { t: 'Accepter', h: 'Argent ▲ · Karma ▼', fx: { job: 'reseau', crime: 6, reputation: 8, karma: -6, money: 600 }, r: 'Premier billet. Tu fais désormais partie du réseau.' },
    { t: 'Refuser poliment', fx: { karma: 3 }, r: 'Il hausse les épaules. « La porte est ouverte. »' },
    { t: 'En parler à tes parents', fx: { karma: 4, reputation: -6, rel: { lien: 'parents', d: 6 } }, r: 'Ta famille te surveille de près maintenant.' },
  ] },
  { id: 'detection_foot', cat: 'Sport', age: [12, 17], once: 1, cond: (s) => (s.talent === 'football' || s.flags.club_foot) && st(s, 'forme') >= 45 && !s.carriere,
    txt: 'Un recruteur d’un centre de formation pro t’a repéré{e} pendant un match. Il te propose des essais.', ch: [
    { t: 'Tout donner aux essais', out: [{ p: (s) => 0.25 + st(s, 'forme') / 180 + (s.talent === 'football' ? 0.2 : 0), fx: { job: 'foot', bonheur: 15, forme: 5, notoriete: 5 }, r: 'Tu es pris{e} au centre de formation !' }, { p: 1, fx: { bonheur: -10 }, r: 'Recalé{e}. « Pas assez physique. » Ça fait mal.' }] },
    { t: 'Refuser, l’école d’abord', fx: { intel: 3, rel: { lien: 'parents', d: 5 } }, r: 'Tes parents sont soulagés. Toi, un peu moins.' },
  ] },
  { id: 'detection_basket', cat: 'Sport', age: [14, 19], once: 1, cond: (s) => (s.talent === 'basket' || s.flags.club_basket) && st(s, 'forme') >= 45 && !s.carriere,
    txt: 'Un coach de Pro B t’a vu{e} dunker au playground. Il t’invite à un stage de détection.', ch: [
    { t: 'Y aller', out: [{ p: (s) => 0.25 + st(s, 'forme') / 180 + (s.talent === 'basket' ? 0.2 : 0), fx: { job: 'basket', bonheur: 14, notoriete: 5 }, r: 'Contrat espoir signé !' }, { p: 1, fx: { bonheur: -8 }, r: 'Pas retenu{e} cette fois.' }] },
    { t: 'Rester au playground', fx: { forme: 2 }, r: 'Tu continues pour le plaisir.' },
  ] },
  { id: 'boxe_gala', cat: 'Sport', age: [14, 22], once: 1, cond: (s) => (s.talent === 'boxe' || s.flags.club_boxe) && !s.carriere, txt: 'Ton coach t’inscrit à ton premier gala de boxe. En face, ton adversaire a l’air solide.', ch: [
    { t: 'Monter sur le ring', out: [{ p: (s) => 0.3 + st(s, 'forme') / 150, fx: { job: 'boxe', reputation: 8, notoriete: 4, bonheur: 8 }, r: 'Victoire par KO au 2e round ! Tu prends ta licence.' }, { p: 1, fx: { sante: -8, bonheur: -4 }, r: 'Défaite aux points. Tu as quand même tenu.' }] },
    { t: 'Te désister', fx: { bonheur: -4 }, r: 'Ton coach est déçu.' },
  ] },
  { id: 'freestyle', cat: 'Musique', age: [13, 26], once: 1, cond: (s) => (s.talent === 'musique' || s.flags.conservatoire || st(s, 'art') >= 45) && !s.carriere,
    txt: '{ami} filme ton freestyle en bas du bâtiment. Il veut le poster.', ch: [
    { t: 'Poster la vidéo', out: [{ p: (s) => 0.25 + st(s, 'art') / 200 + st(s, 'charisme') / 300, fx: { notoriete: 18, job: 'rappeur', bonheur: 10 }, r: '500 000 vues en une semaine. Les labels t’écrivent.' }, { p: 1, fx: { notoriete: 3, bonheur: -3 }, r: '200 vues et des commentaires méchants. Il faut bosser.' }] },
    { t: 'Garder ça pour toi', fx: { art: 3 }, r: 'Tu continues à écrire dans ton coin.' },
  ] },
  { id: 'premier_amour', cat: 'Amour', age: [13, 17], once: 1, pre: (s) => (s.tmp.crush = pick(['Sam', 'Inès', 'Noah', 'Lina', 'Rayan', 'Jade', 'Adam', 'Sofia'])),
    txt: '{crush}, de ta classe, te regarde souvent. Tes potes disent que c’est réciproque.', ch: [
    { t: 'Lui écrire', out: [{ p: (s) => 0.35 + st(s, 'apparence') / 200 + st(s, 'charisme') / 250, fx: { bonheur: 12, flag: 'premier_amour' }, r: '{crush} dit oui. Premier amour.' }, { p: 1, fx: { bonheur: -8 }, r: 'Vu. Pas de réponse. Aïe.' }] },
    { t: 'Ne rien faire', fx: { bonheur: -2 }, r: 'Tu y penseras longtemps.' },
  ] },
  { id: 'soiree_ado', cat: 'Fête', age: [15, 17], txt: 'Grosse soirée chez {ami} : ses parents sont partis. Il y a de l’alcool partout.', ch: [
    { t: 'Boire avec tout le monde', out: [{ p: 0.75, fx: { bonheur: 8, reputation: 4, sante: -2 }, r: 'Meilleure soirée de l’année.' }, { p: 1, fx: { sante: -8, rel: { lien: 'parents', d: -10 } }, r: 'Coma éthylique. Tes parents te récupèrent aux urgences.' }] },
    { t: 'Faire la fête sans boire', fx: { bonheur: 5 }, r: 'Tu ramènes tout le monde à 4 h du matin.' },
    { t: 'Rester chez toi', fx: { intel: 2, bonheur: -2 }, r: 'Tu vois les stories toute la nuit.' },
  ] },
  { id: 'controle', cat: 'Police', age: [14, 40], cond: (s) => !P(s) && s.id.statut !== 'au_pays', txt: 'Contrôle d’identité en bas de chez toi. Les policiers sont tendus.', ch: [
    { t: 'Rester calme et coopérer', out: [{ p: (s) => (sp(s) ? 0.45 : 0.9), r: 'Ils te laissent repartir.' }, { p: 1, fx: (s) => (sp(s) ? { queue: 'oqtf' } : { bonheur: -5 }), r: (s) => (sp(s) ? 'Pas de papiers. Direction le centre de rétention.' : 'Fouille humiliante devant tout le quartier.') }] },
    { t: 'Leur répondre sèchement', out: [{ p: 0.5, fx: { reputation: 5, bonheur: -3 }, r: 'Ils te plaquent contre le mur, puis te lâchent.' }, { p: 1, fx: { casier: 'Outrage à agent', reputation: 6 }, r: 'Garde à vue pour outrage. C’est inscrit au casier.' }] },
    { t: 'Partir en courant', out: [{ p: (s) => 0.3 + st(s, 'forme') / 150, fx: { reputation: 8, recherche: 1, motif: 'Refus d’obtempérer' }, r: 'Tu les sèmes dans les escaliers.' }, { p: 1, fx: { casier: 'Refus d’obtempérer', sante: -5 }, r: 'Ils te rattrapent. Plaquage et garde à vue.' }] },
  ] },
  { id: 'fugue', cat: 'Famille', age: [12, 17], once: 1, cond: (s) => st(s, 'bonheur') < 40 && s.chezParents, txt: 'Tu n’en peux plus de l’ambiance à la maison. Tu as un sac prêt sous le lit.', ch: [
    { t: 'Fuguer', out: [{ p: 0.6, fx: { bonheur: 3, reputation: 5, rel: { lien: 'parents', d: -15 } }, r: 'Trois jours chez un pote. La police te ramène.', days: 3 }, { p: 1, fx: { sante: -10, bonheur: -8 }, r: 'Tu dors dehors. Ça se passe mal.', days: 4 }] },
    { t: 'Appeler le 119', fx: { bonheur: 6, karma: 2 }, r: 'Une éducatrice te suit désormais. Ça aide.' },
    { t: 'Serrer les dents', fx: { bonheur: -5 }, r: 'Plus que quelques années.' },
  ] },
  { id: 'stage_3e', cat: 'École', age: [13, 15], once: 1, cond: (s) => s.etudes.cursus === 'ecole', txt: 'Tu dois trouver un stage de 3e.', ch: [
    { t: 'Au commissariat', fx: { flag: 'stage_police', karma: 2 }, r: 'Tu découvres l’envers du décor.' },
    { t: 'Dans un studio d’enregistrement', fx: { art: 4 }, r: 'Tu apprends à mixer.' },
    { t: 'Dans une banque', fx: { intel: 3 }, r: 'Costume obligatoire. Ennui mortel.' },
    { t: 'Au kebab du coin', fx: { bonheur: 4, charisme: 2 }, r: 'Tu manges gratis toute la semaine.' },
  ] },
  { id: 'mis_dehors', cat: 'Famille', age: [16, 25], once: 1, cond: (s) => s.chezParents && s.relations.some((r) => r.vivant && ['mere', 'pere'].includes(r.lien) && r.rel < 22),
    txt: 'Après une énième dispute, on te met à la porte avec un sac. « Ne reviens pas. »', ch: [
    { t: 'Dormir chez {ami}', out: [{ p: 0.6, fx: { chezParents: false, logement: 'hlm', rel: { lien: 'ami', d: 10 } }, r: '{ami} te fait une place sur son canapé, puis t’aide à trouver un studio.' }, { p: 1, fx: { logement: 'rue', bonheur: -12 }, r: 'Au bout d’une semaine, tu te retrouves à la rue.' }] },
    { t: 'Aller au foyer', fx: { logement: 'foyer', bonheur: -6 }, r: 'Une chambre partagée, un éducateur, des règles.' },
    { t: 'Supplier pour revenir', out: [{ p: 0.4, fx: { rel: { lien: 'parents', d: 15 } }, r: 'On te laisse revenir. Dernière chance.' }, { p: 1, fx: { logement: 'rue', bonheur: -15 }, r: 'La porte reste fermée. Première nuit dehors.' }] },
  ] },

  // ================= ÉCOLE (déclenchés par le moteur) =================
  { id: 'brevet', forced: 1, cat: 'Collège', txt: 'Les résultats du brevet sont affichés.', ch: [
    { t: 'Chercher ton nom', out: [{ p: (s) => 0.35 + st(s, 'intel') / 110, fx: { diplome: 'brevet', bonheur: 5 }, r: 'Tu as ton brevet !' }, { p: 1, fx: { bonheur: -6 }, r: 'Pas de brevet. Pas grave, la vie continue.' }] },
  ] },
  { id: 'orientation', forced: 1, cat: 'Orientation', txt: 'Fin de la 3e. Le conseil de classe te demande ton choix d’orientation.', ch: [
    { t: 'Lycée général', h: 'Vers le bac', c: (s) => st(s, 'intel') >= 30, fx: { etudes: { cursus: 'lycee', reste: 3 } }, r: 'Direction la seconde générale.' },
    { t: 'Lycée pro (CAP)', h: 'Métier en 2 ans', fx: { etudes: { cursus: 'cap', reste: 2 } }, r: 'Tu apprends un métier concret.' },
    { t: 'Arrêter l’école à 16 ans', h: 'Liberté ▲', fx: { etudes: { cursus: null, reste: null }, bonheur: 4 }, r: 'Fini les cours. Place à la vraie vie.' },
  ] },
  { id: 'bac', forced: 1, cat: 'Bac', txt: 'Jour des résultats du bac. Tout le lycée est devant les panneaux.', ch: [
    { t: 'Chercher ton nom', out: [{ p: (s) => 0.32 + st(s, 'intel') / 105, fx: { diplome: 'bac', bonheur: 10, queue: 'apres_bac' }, r: 'Bac en poche !' }, { p: 1, fx: { bonheur: -6, queue: 'rattrapage' }, r: 'Tu es au rattrapage.' }] },
  ] },
  { id: 'rattrapage', chain: 1, major: 2, cat: 'Bac · Rattrapage', txt: 'Oral de rattrapage dans deux jours. Ton avenir se joue maintenant.', ch: [
    { t: 'Réviser jour et nuit', out: [{ p: (s) => 0.45 + st(s, 'intel') / 300, fx: { diplome: 'bac', queue: 'apres_bac' }, r: 'Repêché{e} ! Le bac est à toi.', days: 2 }, { p: 1, fx: { bonheur: -10 }, r: 'Raté. Pas de bac cette année.', days: 2 }] },
    { t: 'Y aller au talent', out: [{ p: (s) => 0.25 + st(s, 'charisme') / 200, fx: { diplome: 'bac', queue: 'apres_bac' }, r: 'Ton aisance a fait la différence.', days: 2 }, { p: 1, fx: { bonheur: -10 }, r: 'Le jury n’a pas été convaincu.', days: 2 }] },
  ] },
  { id: 'apres_bac', chain: 1, cat: 'Orientation', txt: 'Bac en poche. Parcoursup te demande de choisir ta voie.', ch: [
    { t: 'Licence à la fac', h: '3 ans', fx: { etudes: { cursus: 'fac', reste: 3 } }, r: 'Amphis bondés et liberté totale.' },
    { t: 'BTS', h: '2 ans', fx: { etudes: { cursus: 'bts', reste: 2 } }, r: 'Une formation courte et concrète.' },
    { t: 'Médecine', h: '9 ans · Intelligence 65', c: (s) => st(s, 'intel') >= 65, fx: { etudes: { cursus: 'medecine', reste: 9 } }, r: 'Neuf ans de travail acharné t’attendent.' },
    { t: 'Droit', h: '5 ans', fx: { etudes: { cursus: 'droit', reste: 5 } }, r: 'Codes, plaidoiries et nuits blanches.' },
    { t: 'École de police', h: 'Nationalité française', c: (s) => (s.id.statut === 'ne_france' || s.id.statut === 'naturalise') && !s.justice.casier.length, fx: { job: 'police' }, r: 'Tu intègres l’école de police.' },
    { t: 'Entrer dans la vie active', fx: { bonheur: 3 }, r: 'Les études, c’est fini pour toi.' },
  ] },

  // ================= IMMIGRATION & ADMINISTRATION =================
  { id: 'arrivee_france', forced: 1, cat: 'Nouvelle vie', pre: (s) => (s.tmp.villeC = s.id.villeCible),
    txt: (s) => (s.id.statutCible === 'sans_papiers'
      ? 'Après un long voyage épuisant, ta famille arrive à {villeC}, sans papiers. Tout est nouveau : la langue, le froid, la peur des contrôles.'
      : 'Ta famille s’installe à {villeC} avec un titre de séjour. Tout est nouveau : la langue, l’école, le climat.'), ch: [
    { t: 'Apprendre le français à fond', fx: (s) => arrive(s, { intel: 6, charisme: 2 }), r: 'En six mois, tu parles mieux que tes parents.' },
    { t: 'Te faire des potes vite', fx: (s) => arrive(s, { charisme: 5, reputation: 3 }), r: 'La cour de récré devient ton terrain.' },
    { t: 'Rester dans ta bulle', fx: (s) => arrive(s, { bonheur: -6, art: 3 }), r: 'Tu dessines le pays dans tes cahiers.' },
  ] },
  { id: 'regularisation', cat: 'Administration', age: [18, 70], w: 1.3, cond: (s) => sp(s), major: 30,
    txt: 'Une association propose de t’aider à monter un dossier de régularisation à la préfecture. Ça peut prendre des semaines.', ch: [
    { t: 'Déposer le dossier', out: [{ p: (s) => 0.25 + (s.carriere ? 0.25 : 0) + Math.min(0.2, (s.age - (s.id.arrivee || s.age)) / 50), fx: { statut: 'titre', bonheur: 18 }, r: 'Après des semaines d’attente : titre de séjour accordé !', days: 45 }, { p: 0.5, fx: { bonheur: -8 }, r: 'Refusé. Il faudra retenter.', days: 45 }, { p: 1, fx: { queue: 'oqtf' }, r: 'Refusé. Et la préfecture t’envoie une OQTF.', days: 45 }] },
    { t: 'Acheter de faux papiers (2 000 €)', c: (s) => s.money >= 2000, fx: { money: -2000 }, out: [{ p: 0.4, fx: { statut: 'titre', flag: 'faux_papiers', crime: 3 }, r: 'Les papiers passent. Pour l’instant.' }, { p: 1, fx: { arrest: { motif: 'Faux et usage de faux', peine: [0, 1] } }, r: 'Le contact était un escroc… et la police l’attendait.' }] },
    { t: 'Attendre encore', fx: { bonheur: -3 }, r: 'Tu continues à vivre dans l’ombre.' },
  ] },
  { id: 'naturalisation', cat: 'Administration', age: [18, 90], cond: (s) => s.id.statut === 'titre' && !s.justice.casier.length, txt: 'Tu remplis les conditions pour demander la nationalité française.', ch: [
    { t: 'Déposer la demande', out: [{ p: (s) => 0.45 + st(s, 'intel') / 250, fx: { statut: 'naturalise', bonheur: 12 }, r: 'Cérémonie à la préfecture : tu es {français|française} !', days: 60 }, { p: 1, fx: { bonheur: -4 }, r: 'Dossier ajourné. Réessaie plus tard.', days: 60 }] },
    { t: 'Pas besoin', r: 'Ton titre de séjour te suffit.' },
  ] },
  { id: 'oqtf', forced: 1, major: 30, cat: 'Administration', txt: 'Tu reçois une OQTF : obligation de quitter le territoire français sous 30 jours.', ch: [
    { t: 'Faire un recours avec une avocate (1 500 €)', c: (s) => s.money >= 1500, fx: { money: -1500 }, out: [{ p: 0.4, fx: { bonheur: 6 }, r: 'Le tribunal annule l’OQTF. Tu respires.', days: 25 }, { p: 1, fx: { recherche: 1, motif: 'Séjour irrégulier' }, r: 'Recours rejeté. Tu restes en situation irrégulière.', days: 25 }] },
    { t: 'Te cacher et continuer ta vie', fx: { recherche: 1, motif: 'Séjour irrégulier', bonheur: -8, flag: 'clandestin' }, r: 'Tu vis avec la peur au ventre.' },
    { t: 'Rentrer au pays', fx: { expulse: true, bonheur: -6 }, r: 'Tu rentres au {pays}. Un nouveau départ.', days: 30 },
  ] },
  { id: 'retour_france', cat: 'Exil', age: [18, 45], cond: (s) => s.id.statut === 'au_pays' && !!s.id.villeCible && s.id.arrivee != null, w: 0.7,
    txt: 'Au {pays}, l’avenir semble bouché. Un passeur propose de te faire repasser en Europe pour 4 000 €.', ch: [
    { t: 'Tenter la traversée', c: (s) => s.money >= 4000, fx: { money: -4000 }, out: [{ p: 0.75, fx: { revenir: 'sans_papiers', bonheur: 5 }, r: 'Après des semaines d’enfer, tu es de retour en France.', days: 40 }, { p: 0.7, fx: { sante: -30, bonheur: -15 }, r: 'Tu es refoulé{e} à la frontière, blessé{e}.', days: 20 }, { p: 1, fx: { mort: 'Disparu{e} en mer pendant la traversée' }, r: 'Le bateau n’est jamais arrivé.' }] },
    { t: 'Demander un visa étudiant', c: (s) => st(s, 'intel') >= 55 && dip(s, 'bac'), out: [{ p: 0.5, fx: { revenir: 'titre', bonheur: 12 }, r: 'Visa accordé. Retour en France par la grande porte.', days: 60 }, { p: 1, fx: { bonheur: -5 }, r: 'Visa refusé.', days: 60 }] },
    { t: 'Construire ta vie ici', fx: { bonheur: 4, karma: 2 }, r: 'Tu décides de rester au {pays}.' },
  ] },
  { id: 'discrimination', forced: 1, cat: 'Travail', txt: 'Encore un refus. {ami}, même CV mais un autre nom, a été rappelé deux fois cette semaine.', ch: [
    { t: 'Envoyer des CV anonymes', out: [{ p: 0.5, fx: { bonheur: 4, intel: 1 }, r: 'Tu décroches enfin des entretiens.' }, { p: 1, fx: { bonheur: -4 }, r: 'Toujours rien. Le marché est dur.' }] },
    { t: 'Saisir le Défenseur des droits', fx: { karma: 4, intel: 2, charisme: 2 }, r: 'Ton dossier fait partie d’une enquête nationale.' },
    { t: 'Lâcher l’affaire', fx: { bonheur: -8 }, r: 'Tu te sens invisible.' },
  ] },
  { id: 'bled_famille', cat: 'Famille', age: [6, 80], w: 0.5, cond: (s) => s.id.origine !== 'france' && s.id.statut !== 'sans_papiers' && s.id.statut !== 'au_pays' && s.money >= 0,
    txt: 'La famille au {pays} appelle : un cousin se marie cet été. Tout le monde compte sur toi.', ch: [
    { t: 'Y aller et participer aux frais', c: (s) => s.money >= 1200 || s.chezParents, fx: (s) => ({ money: s.chezParents ? 0 : -1200, bonheur: 14, lieu: 'pays' }), r: 'Trois semaines de fête, de soleil et de famille.', days: 21 },
    { t: 'Envoyer de l’argent', c: (s) => s.money >= 400, fx: { money: -400, karma: 3 }, r: 'La famille te remercie chaleureusement.' },
    { t: 'Ne pas répondre', fx: { bonheur: -3 }, r: 'On parle un peu de toi dans ton dos.' },
  ] },

  // ================= VIE ADULTE =================
  { id: 'quitter_parents', cat: 'Famille', age: [19, 28], once: 1, cond: (s) => s.chezParents && !P(s), txt: 'Tes parents te font comprendre qu’il serait temps de prendre ton envol.', ch: [
    { t: 'Chercher un HLM', c: (s) => s.id.statut !== 'sans_papiers', fx: { logement: 'hlm', bonheur: 5 }, r: 'Ton premier chez-toi. Petit, mais à toi.' },
    { t: 'Louer en centre-ville', c: (s) => (s.carriere && CAREERS[s.carriere.id].niveaux[s.carriere.niveau][1] >= 2300) || s.money > 15000, fx: { logement: 'appart', bonheur: 8 }, r: 'Parquet, moulures et voisins bruyants.' },
    { t: 'Rester encore un peu', fx: { rel: { lien: 'parents', d: -6 } }, r: 'L’ambiance est tendue au dîner.' },
  ] },
  { id: 'expulsion', forced: 1, major: 15, cat: 'Logement', txt: 'Tes dettes s’accumulent. Huissier, lettre recommandée : tu es expulsé{e} de ton logement.', ch: [
    { t: 'Retourner chez tes parents', c: (s) => s.relations.some((r) => r.vivant && ['mere', 'pere'].includes(r.lien) && r.rel > 30), fx: { chezParents: true, bonheur: -6, money: 2000 }, r: 'Ta famille t’accueille et éponge une partie de tes dettes.', days: 10 },
    { t: 'Demander une place en foyer', fx: { logement: 'foyer', bonheur: -10 }, r: 'Une chambre minuscule et un nouveau départ.', days: 14 },
    { t: 'Te retrouver à la rue', fx: { logement: 'rue', bonheur: -18 }, r: 'Ton premier soir dehors, avec un sac et un duvet.', days: 15 },
  ] },
  { id: 'heritage_oncle', cat: 'Argent', age: [18, 90], w: 0.25, once: 1, pre: gain(5000, 80000), txt: 'Un oncle éloigné que tu n’as jamais vu est décédé. Le notaire t’appelle : tu hérites de {€x}.', ch: [
    { t: 'Accepter l’héritage', fx: (s) => ({ money: s.tmp.x, bonheur: 8 }), r: 'Ton compte n’a jamais été aussi rempli.' },
    { t: 'Partager avec la famille', fx: (s) => ({ money: Math.round(s.tmp.x / 2), karma: 8, rel: { lien: 'parents', d: 8 } }), r: 'Toute la famille te remercie.' },
  ] },
  { id: 'ami_pret', cat: 'Argent', age: [18, 75], cond: (s) => s.money > 2500, pre: gain(500, 3000), txt: '{ami} est dans la galère et te demande de lui prêter {€x}.', ch: [
    { t: 'Prêter', fx: (s) => ({ money: -s.tmp.x, karma: 4, rel: { lien: 'ami', d: 10 } }), out: [{ p: 0.5, fx: (s) => ({ money: s.tmp.x }), r: '{ami} te rembourse six mois plus tard.' }, { p: 1, r: 'Tu ne reverras jamais cet argent.' }] },
    { t: 'Refuser', fx: { rel: { lien: 'ami', d: -12 } }, r: '{ami} le prend très mal.' },
  ] },
  { id: 'rencontre', cat: 'Amour', age: [16, 70], cond: (s) => single(s) && !P(s), pre: (s) => {
      const c = newCandidate(s);
      c.prenom = pick(c.genre === 'f' ? ['Inès', 'Clara', 'Nour', 'Léa', 'Aminata', 'Elif', 'Camila', 'Maeva', 'Ioana', 'Mei'] : ['Adam', 'Hugo', 'Rayan', 'Diego', 'Moussa', 'Emre', 'Tiago', 'Lucas', 'Kévin', 'Minh']);
      c.nom = pick(['Martin', 'Haddad', 'Diallo', 'Costa', 'Nguyen', 'Kaya', 'Rodríguez', 'Désir', 'Popescu']);
      c.look = null;
      s.tmp.candidat = c;
      s.tmp.cand = c.prenom;
      s.tmp.candAge = c.age;
    }, txt: 'Tu rencontres {cand}, {candAge} ans, à une soirée chez des amis. Le courant passe vraiment.', ch: [
    { t: 'Proposer un rendez-vous', out: [{ p: (s) => 0.35 + st(s, 'apparence') / 250 + st(s, 'charisme') / 250, fx: { couple: true, bonheur: 10 }, r: 'Premier date parfait. Vous êtes ensemble.' }, { p: 1, fx: { bonheur: -5 }, r: 'Râteau poli. Ça pique.' }] },
    { t: 'Rester amis', fx: { charisme: 1 }, r: 'Vous échangez vos numéros.' },
  ] },
  { id: 'demande_mariage', cat: 'Amour', age: [20, 75], cond: (s) => partner(s)?.lien === 'partenaire' && partner(s).rel > 70 && s.age - partner(s).depuis >= 2, txt: '{partenaire} et toi êtes ensemble depuis un moment. Le sujet du mariage revient souvent.', ch: [
    { t: 'Faire ta demande', out: [{ p: 0.8, fx: { marier: true, bonheur: 15, money: -7000 }, r: 'Oui ! Grand mariage, toute la famille est là.' }, { p: 1, fx: { rel: { lien: 'partenaire', d: -10 }, bonheur: -8 }, r: '{partenaire} hésite… Gros malaise.' }] },
    { t: 'Pas maintenant', fx: { rel: { lien: 'partenaire', d: -8 } }, r: '{partenaire} encaisse mal.' },
  ] },
  { id: 'bebe', cat: 'Famille', age: [21, 44], cond: (s) => !!partner(s) && s.relations.filter((r) => r.lien === 'enfant').length < 4, txt: '{partenaire} te parle d’avoir un enfant.', ch: [
    { t: 'Fonder une famille', fx: { enfant: true, bonheur: 12, money: -2500 }, r: 'Bienvenue à {bebe} ! Ta vie change pour toujours.' },
    { t: 'Pas encore', fx: { rel: { lien: 'partenaire', d: -6 } }, r: 'Le sujet reviendra.' },
  ] },
  { id: 'rupture', cat: 'Amour', cond: (s) => !!partner(s) && partner(s).rel < 35, txt: '{partenaire} t’annonce que ça ne va plus entre vous.', ch: [
    { t: 'Te battre pour votre couple', out: [{ p: 0.4, fx: { rel: { lien: 'partenaire', d: 25 } }, r: 'Une thérapie de couple plus tard, ça repart.' }, { p: 1, fx: { rupture: true, bonheur: -12 }, r: 'C’est fini. Les cartons sont faits.' }] },
    { t: 'Accepter la rupture', fx: { rupture: true, bonheur: -8 }, r: 'Une page se tourne.' },
  ] },
  { id: 'tentation', cat: 'Amour', age: [18, 65], cond: (s) => !!partner(s), w: 0.6, txt: 'Quelqu’un du boulot te fait clairement du rentre-dedans pendant un afterwork.', ch: [
    { t: 'Céder', out: [{ p: 0.55, fx: { bonheur: 6, karma: -6 }, r: 'Personne n’en saura rien… pour l’instant.' }, { p: 1, fx: { rupture: true, bonheur: -12, karma: -6 }, r: '{partenaire} a tout découvert. C’est terminé.' }] },
    { t: 'Rester fidèle', fx: { karma: 4, rel: { lien: 'partenaire', d: 5 } }, r: 'Tu rentres retrouver {partenaire}.' },
  ] },
  { id: 'accident_route', cat: 'Santé', age: [16, 90], w: 0.12, txt: 'Un chauffard grille un feu rouge et te percute.', ch: [
    { t: 'Appeler les secours', out: [{ p: 0.75, fx: { sante: -6, money: 3000 }, r: 'Fractures, mais l’assurance du chauffard paie.' }, { p: 0.9, fx: { sante: -18 }, r: 'Trois semaines d’hôpital. Rééducation difficile.' }, { p: 1, fx: { mort: 'Accident de la route' }, r: 'Les secours arrivent trop tard.' }] },
    { t: 'Le poursuivre toi-même', fx: { reputation: 4 }, out: [{ p: 0.5, fx: { sante: -8, money: 800 }, r: 'Tu le rattrapes. Il te paie cash pour éviter la police.' }, { p: 1, fx: { sante: -15, casier: 'Violences' }, r: 'Ça dégénère en bagarre. Tout le monde finit au poste.' }] },
  ] },
  { id: 'maladie', cat: 'Santé', age: [35, 100], w: (s) => (st(s, 'sante') < 40 ? 0.6 : 0.15) * (s.age > 60 ? 2 : 1), pre: (s) => (s.tmp.mal = pick(['une tumeur', 'une grave maladie cardiaque', 'un diabète sévère', 'une maladie auto-immune'])),
    txt: 'Ton médecin a le visage grave : on t’a diagnostiqué {mal}.', ch: [
    { t: 'Suivre le traitement lourd', out: [{ p: (s) => 0.5 + st(s, 'sante') / 200, fx: { sante: 4, bonheur: -5 }, r: 'Le traitement fonctionne. Tu tiens bon.' }, { p: 1, fx: { sante: -16 }, r: 'La maladie progresse malgré tout.' }] },
    { t: 'Clinique privée en Suisse (60 000 €)', c: (s) => s.money >= 60000, fx: { money: -60000, sante: 12 }, r: 'Les meilleurs spécialistes. Ça vaut chaque euro.' },
    { t: 'Médecines alternatives', out: [{ p: 0.15, fx: { sante: 5 }, r: 'Contre toute attente, tu vas mieux.' }, { p: 1, fx: { sante: -25 }, r: 'Tu as perdu un temps précieux.' }] },
  ] },
  { id: 'crypto', cat: 'Argent', age: [18, 65], cond: (s) => s.money >= 3000, w: 0.6, txt: '{ami} jure qu’une nouvelle crypto va faire x100. « Faut investir maintenant, frère. »', ch: [
    { t: 'Mettre la moitié de ton argent', fx: (s) => ((s.tmp.x = Math.round(s.money / 2)), {}), out: [{ p: 0.04, fx: (s) => ({ money: s.tmp.x * 3 }), r: 'Jackpot ! x4. Tu encaisses au bon moment.' }, { p: 0.25, fx: (s) => ({ money: Math.round(s.tmp.x * 0.3) }), r: 'Petit gain. Tu sors à temps.' }, { p: 1, fx: (s) => ({ money: -Math.round(s.tmp.x * 0.9), bonheur: -8 }), r: 'Rug pull. La crypto ne vaut presque plus rien.' }] },
    { t: 'Passer ton tour', r: 'Six mois plus tard, {ami} ne parle plus de crypto.' },
  ] },
  { id: 'startup', cat: 'Business', age: [20, 55], once: 1, cond: (s) => (st(s, 'intel') >= 58 || s.talent === 'business' || s.talent === 'tech') && !job(s, 'entrepreneur') && !cat(s, 'crime') && !P(s),
    txt: 'Une idée d’appli te trotte dans la tête depuis des mois. Tu pourrais tout quitter pour la lancer.', ch: [
    { t: 'Tout plaquer et te lancer', c: (s) => s.money >= 3000, fx: { job: 'entrepreneur', money: -3000, bonheur: 6 }, r: 'Ta start-up est née. Les nuits seront courtes.' },
    { t: 'Garder ton job', fx: { bonheur: -2 }, r: 'Un jour, peut-être.' },
  ] },
  { id: 'promotion_offerte', cat: 'Travail', cond: (s) => s.carriere && CAREERS[s.carriere.id].cat === 'classique' && s.carriere.perf >= 60,
    txt: 'Ta direction te propose de monter en grade, mais avec beaucoup plus d’heures et de pression.', ch: [
    { t: 'Accepter', fx: { jobLvl: 1, sante: -4, bonheur: -2 }, r: 'Nouveau titre, nouveau salaire, nouvelles cernes.' },
    { t: 'Refuser', fx: { bonheur: 3, perf: -5 }, r: 'Tu préserves ton équilibre.' },
  ] },
  { id: 'burnout', cat: 'Santé', cond: (s) => !!s.carriere && st(s, 'bonheur') < 35 && ['classique', 'business', 'police'].includes(CAREERS[s.carriere.id].cat), txt: 'Tu n’arrives plus à te lever le matin. Ton corps dit stop.', ch: [
    { t: 'Prendre un arrêt maladie', fx: { sante: 5, bonheur: 6, perf: -10 }, r: 'Trois mois pour te reconstruire.', days: 30 },
    { t: 'Démissionner', fx: { job: null, bonheur: 10 }, r: 'Tu respires enfin.' },
    { t: 'Continuer coûte que coûte', fx: { sante: -12, perf: 5 }, r: 'Tu tiens… pour l’instant.' },
  ] },
  { id: 'licenciement', cat: 'Travail', w: 0.35, cond: (s) => s.carriere && CAREERS[s.carriere.id].cat === 'classique', pre: gain(2000, 12000), txt: 'Ton entreprise annonce un plan social. Ton poste est supprimé.', ch: [
    { t: 'Négocier ton départ', out: [{ p: (s) => 0.4 + st(s, 'charisme') / 200, fx: (s) => ({ job: null, money: s.tmp.x * 2 }), r: 'Belle indemnité négociée.' }, { p: 1, fx: (s) => ({ job: null, money: s.tmp.x }), r: 'Indemnité légale, rien de plus.' }] },
    { t: 'Aller aux prud’hommes', fx: { job: null }, out: [{ p: 0.5, fx: (s) => ({ money: s.tmp.x * 3 }), r: 'Tu gagnes ! Dommages et intérêts.', days: 90 }, { p: 1, r: 'Tu perds. Retour à la case départ.', days: 90 }] },
  ] },
  { id: 'chantier_accident', cat: 'Travail', cond: (s) => job(s, 'chantier'), txt: 'Un échafaudage mal fixé vacille pendant que tu travailles.', ch: [
    { t: 'Sauter', out: [{ p: 0.6, fx: { sante: -6 }, r: 'Entorse. Rien de grave.' }, { p: 1, fx: { sante: -25 }, r: 'Mauvaise chute. Arrêt de six mois.' }] },
    { t: 'Rattraper un collègue', fx: { karma: 6 }, out: [{ p: 0.7, fx: { perf: 10 }, r: 'Tu lui sauves la vie. Tout le chantier t’applaudit.' }, { p: 1, fx: { sante: -20 }, r: 'Vous tombez tous les deux. Hôpital.' }] },
  ] },
  { id: 'nuit_garde', cat: 'Travail', cond: (s) => ['infirmier', 'medecin', 'aide_soignant'].includes(s.carriere?.id), txt: 'Nuit de garde aux urgences. Un patient arrive dans un état critique et tu es seul{e}.', ch: [
    { t: 'Prendre les choses en main', out: [{ p: (s) => 0.5 + st(s, 'intel') / 200, fx: { perf: 15, karma: 8, bonheur: 8 }, r: 'Tu le sauves. Ta cheffe est impressionnée.' }, { p: 1, fx: { bonheur: -10 }, r: 'Malgré tes efforts, il ne s’en sort pas.' }] },
    { t: 'Appeler le médecin de garde', fx: { perf: 2 }, r: 'Procédure respectée.' },
  ] },
  { id: 'crise_quarantaine', cat: 'Vie', age: [40, 52], once: 1, txt: 'Tu te réveilles un matin en te demandant ce que tu as fait de ta vie.', ch: [
    { t: 'Acheter une moto (15 000 €)', c: (s) => s.money >= 15000, fx: { money: -15000, bonheur: 12, apparence: 2 }, r: 'Le vent dans les cheveux. Ça fait du bien.' },
    { t: 'Partir faire le tour du monde', c: (s) => s.money >= 8000, fx: { money: -8000, bonheur: 18, lieu: 'plage' }, r: 'Six mois de voyage. Tu reviens transformé{e}.', days: 60 },
    { t: 'Te mettre au sport', fx: { forme: 8, sante: 5 }, r: 'Marathon dans un an. Objectif fixé.' },
  ] },
  { id: 'retraite', forced: 1, cat: 'Travail', txt: 'Tu as atteint l’âge de la retraite. Ton patron te propose de rester encore un peu.', ch: [
    { t: 'Partir en retraite', fx: (s) => { s.pension = Math.round((s.carriere ? CAREERS[s.carriere.id].niveaux[s.carriere.niveau][1] : 1000) * 0.55); return { job: null, bonheur: 12 }; }, r: 'Pot de départ, discours, et enfin le repos.' },
    { t: 'Rester encore deux ans', fx: { perf: 5, sante: -3 }, r: 'Tu n’es pas prêt{e} à décrocher.' },
  ] },
  { id: 'deuil', forced: 1, cat: 'Deuil', txt: 'Le décès de {deuil} te laisse un vide immense.', ch: [
    { t: 'Te réfugier dans le travail', fx: { bonheur: -4, perf: 8 }, r: 'Tu avances, un jour après l’autre.' },
    { t: 'Prendre du temps pour toi', fx: { bonheur: 3 }, r: 'Tu fais ton deuil, entouré{e}.', days: 14 },
    { t: 'Noyer ton chagrin', fx: { sante: -6, bonheur: -2 }, r: 'Les soirées s’enchaînent. Ça ne règle rien.' },
  ] },
  { id: 'enfant_ennuis', cat: 'Famille', cond: (s) => s.relations.some((r) => r.lien === 'enfant' && r.vivant && r.age >= 13 && r.age <= 18), pre: (s) => (s.tmp.kid = s.relations.find((r) => r.lien === 'enfant' && r.vivant && r.age >= 13 && r.age <= 18).prenom),
    txt: 'Le lycée t’appelle : {kid} s’est fait prendre avec du shit dans son sac.', ch: [
    { t: 'Le punir sévèrement', fx: { bonheur: -3 }, r: 'Ambiance glaciale à la maison.' },
    { t: 'Avoir une vraie discussion', fx: { karma: 3, bonheur: 2 }, r: '{kid} s’ouvre enfin à toi.' },
    { t: 'Laisser couler', fx: { karma: -2 }, r: 'Tu espères que ça passera.' },
  ] },
  { id: 'voisin_bruyant', cat: 'Logement', cond: (s) => ['hlm', 'appart'].includes(s.logement) && !s.chezParents, txt: 'Ton voisin du dessus met de la musique à fond tous les soirs jusqu’à 3 h.', ch: [
    { t: 'Aller lui parler', out: [{ p: (s) => 0.5 + st(s, 'charisme') / 200, fx: { bonheur: 4 }, r: 'Il baisse le son. Mieux, il t’invite à sa prochaine soirée.' }, { p: 1, fx: { bonheur: -4 }, r: 'Il te claque la porte au nez.' }] },
    { t: 'Appeler la police', fx: { reputation: -3, bonheur: 2 }, r: 'Le calme revient. Mais il te regarde de travers.' },
    { t: 'Taper au plafond avec un balai', fx: { bonheur: -2 }, r: 'Guerre froide dans l’immeuble.' },
  ] },
  { id: 'villa_cambriolee', cat: 'Logement', cond: (s) => s.logement === 'villa' && !s.chezParents && s.age >= 18, w: (s) => (s.securite ? 0.2 : 1), pre: gain(20000, 120000), txt: 'Ta villa a été cambriolée pendant tes vacances. Montres, bijoux, tableaux : {€x} envolés.', ch: [
    { t: 'Porter plainte et compter sur l’assurance', fx: (s) => ({ money: -Math.round(s.tmp.x * 0.3) }), r: 'L’assurance rembourse en grande partie.' },
    { t: 'Faire appel à « tes contacts »', c: (s) => st(s, 'crime') >= 25, fx: { reputation: 6, crime: 2 }, r: 'Une semaine plus tard, tout est revenu. Personne ne pose de questions.' },
  ] },
  { id: 'fisc', cat: 'Justice', cond: (s) => s.money > 250000 && (cat(s, 'crime') || s.flags.braqueur), w: 1.2, txt: 'Un contrôle fiscal tombe. Le fisc veut savoir d’où vient ton argent.', ch: [
    { t: 'Payer un avocat fiscaliste (40 000 €)', fx: { money: -40000 }, out: [{ p: 0.7, r: 'Montages en règle. Le fisc repart bredouille.' }, { p: 1, fx: { arrest: { motif: 'Blanchiment d’argent', peine: [2, 6] } }, r: 'Les montages n’ont pas tenu.' }] },
    { t: 'Ouvrir un restaurant pour blanchir', fx: (s) => ({ money: -Math.round(s.money * 0.2), crime: 3 }), r: 'Le resto tourne, l’argent devient propre.' },
    { t: 'Fuir à Dubaï', fx: (s) => ({ money: -Math.round(s.money * 0.15), recherche: 2, motif: 'Fraude fiscale', bonheur: 5, lieu: 'villa' }), r: 'Tu vis désormais entre deux avions.', days: 20 },
  ] },
  { id: 'bagarre_boite', cat: 'Fête', age: [18, 45], w: 0.4, cond: (s) => !P(s), txt: 'En boîte, un type renverse son verre sur toi et te provoque.', ch: [
    { t: 'Lui en coller une', out: [{ p: (s) => 0.4 + st(s, 'forme') / 200, fx: { reputation: 6 }, r: 'Il ne se relève pas. Les videurs te sortent.' }, { p: 0.6, fx: { sante: -10 }, r: 'Il était avec quatre potes. Mauvaise idée.' }, { p: 1, fx: { arrest: { motif: 'Violences volontaires', peine: [0, 1] } }, r: 'La police est déjà devant la boîte.' }] },
    { t: 'Laisser couler', fx: { karma: 2 }, r: 'Tu finis la soirée tranquille.' },
  ] },

  // ================= RUE & CRIME =================
  { id: 'proposition_braquage', cat: 'Rue', age: [18, 55], major: 3, cond: (s) => !P(s) && (st(s, 'crime') >= 22 || st(s, 'reputation') >= 40 || cat(s, 'crime')) && !job(s, 'police'), w: 0.8,
    txt: '{ami} te propose un « plan facile » : braquer la bijouterie du centre-ville. Selon lui, c’est 20 000 € chacun.', ch: [
    { t: 'Accepter le coup', h: 'Recherche ▲ · Gros gain', r: 'Rendez-vous demain à la planque.', next: 'braquage_j1' },
    { t: 'Refuser', h: 'Réputation ▼', fx: { reputation: -5, karma: 2 }, r: '{ami} te traite de petit joueur.' },
    { t: 'Le balancer à la police', h: 'Karma ▲ · Danger', fx: { karma: 8, reputation: -20, flag: 'balance' }, out: [{ p: 0.7, r: '{ami} tombe. Mais dans le quartier, ça se sait.' }, { p: 1, fx: { sante: -25 }, r: 'Ses potes t’attendent en bas de chez toi. Passage à tabac.' }] },
  ] },
  { id: 'braquage_j1', chain: 1, major: 3, cat: 'Braquage · Jour 1', txt: 'Jour 1. Préparation. {ami} étale le plan de la bijouterie sur la table. Il manque encore un détail.', ch: [
    { t: 'Faire du repérage toute la journée', fx: (s) => ((s.tmp.prep = 0.15), { intel: 1 }), r: 'Tu notes les horaires du vigile et l’angle mort des caméras.', next: 'braquage_j2', days: 1, hour: [9, 10] },
    { t: 'Acheter du matériel au marché noir (1 500 €)', c: (s) => s.money >= 1500, fx: (s) => ((s.tmp.prep = 0.2), { money: -1500, crime: 2 }), r: 'Cagoules, gants, scooter volé. Vous êtes équipés.', next: 'braquage_j2', days: 1, hour: [9, 10] },
    { t: 'Te rétracter', fx: { reputation: -8, rel: { lien: 'ami', d: -15 } }, r: '{ami} te regarde avec mépris. « Tu m’as lâché. »' },
  ] },
  { id: 'braquage_j2', chain: 1, major: 3, cat: 'Braquage · Jour 2', txt: 'Jour 2, 10 h 02. Vous entrez dans la bijouterie. Le vendeur lève les mains. Une cliente hurle.', ch: [
    { t: 'Garder ton sang-froid et vider les vitrines', out: [
      { p: (s) => 0.35 + (s.tmp.prep || 0) + st(s, 'crime') / 250 + (tr(s, 'calme') ? 0.1 : 0) - (tr(s, 'impulsif') ? 0.08 : 0), fx: (s) => ((s.tmp.butin = rnd(18000, 48000)), { crime: 6, recherche: 2, motif: 'Vol à main armée', karma: -10, flag: 'braqueur' }), r: 'Les sacs sont pleins. Vous filez en scooter.', next: 'braquage_j3', days: 1 },
      { p: 1, fx: { recherche: 3, motif: 'Vol à main armée' }, r: 'L’alarme se déclenche plus tôt que prévu. Les sirènes approchent…', next: 'braquage_fuite' }] },
    { t: 'Paniquer et t’enfuir à pied', fx: { recherche: 2, motif: 'Tentative de vol à main armée', reputation: -10 }, out: [{ p: 0.5, r: 'Tu cours sans te retourner. Tu as eu chaud.' }, { p: 1, fx: { arrest: { motif: 'Tentative de vol à main armée', peine: [2, 6] } }, r: 'Un passant te ceinture. La police arrive.' }] },
  ] },
  { id: 'braquage_fuite', chain: 1, major: 3, cat: 'Braquage · Fuite', txt: 'Les gyrophares se rapprochent. {ami} hurle de prendre l’autoroute.', ch: [
    { t: 'Foncer sur l’autoroute', out: [{ p: (s) => 0.3 + st(s, 'crime') / 300, fx: (s) => ((s.tmp.butin = rnd(8000, 20000)), {}), r: 'Tu les sèmes au péage.', next: 'braquage_j3', days: 1 }, { p: 0.6, fx: { arrest: { motif: 'Vol à main armée', peine: [5, 10] } }, r: 'Herse. Pneus crevés. C’est fini.' }, { p: 1, fx: { mort: 'Accident pendant une course-poursuite' }, r: 'La voiture part en tonneaux.' }] },
    { t: 'Abandonner la voiture et te fondre dans la foule', out: [{ p: 0.5, fx: (s) => ((s.tmp.butin = rnd(3000, 9000)), {}), r: 'Tu t’en sors avec ce que tu as dans les poches.', next: 'braquage_j3', days: 1 }, { p: 1, fx: { arrest: { motif: 'Vol à main armée', peine: [5, 10] } }, r: 'Repéré{e} par les caméras de la gare.' }] },
    { t: 'Te rendre', fx: { arrest: { motif: 'Vol à main armée', peine: [3, 6] } }, r: 'Tu lèves les mains. Coopérer réduira peut-être ta peine.' },
  ] },
  { id: 'braquage_j3', chain: 1, major: 3, cat: 'Braquage · Jour 3', txt: 'Jour 3. Planque. Le butin est estimé à {€butin}. {ami} propose de tout partager… mais tu le vois passer des coups de fil en douce.', ch: [
    { t: 'Partager à parts égales', fx: (s) => ({ money: Math.round(s.tmp.butin / 2), reputation: 10 }), out: [{ p: 0.75, r: 'Parole tenue. Vous ne vous revoyez plus.' }, { p: 1, fx: { arrest: { motif: 'Vol à main armée', peine: [4, 9] } }, r: 'Trois semaines plus tard, {ami} se fait serrer… et te balance.' }] },
    { t: 'Partir avec tout le butin', fx: (s) => ({ money: s.tmp.butin, karma: -10, rel: { lien: 'ami', d: -100 }, flag: 'traitre' }), r: 'Tu disparais avec les sacs. {ami} te le fera payer un jour.' },
    { t: 'Blanchir l’argent via un garage', fx: (s) => ({ money: Math.round(s.tmp.butin * 0.35), recherche: -1, crime: 3 }), r: 'Tu perds une partie, mais l’argent est propre.' },
  ] },
  { id: 'vengeance', cat: 'Rue', w: 1.5, once: 1, cond: (s) => s.flags.traitre && !P(s), txt: 'Ton ancien complice est sorti de prison. Il sait où tu habites.', ch: [
    { t: 'Lui rendre sa part', c: (s) => s.money >= 15000, fx: { money: -15000, unflag: 'traitre' }, r: 'Il prend l’argent. Dette réglée.' },
    { t: 'Quitter la ville', fx: { lieu: 'plage', bonheur: -6, money: -3000 }, r: 'Nouvelle ville, nouveau numéro.', days: 20 },
    { t: 'L’affronter', out: [{ p: (s) => 0.35 + st(s, 'forme') / 200, fx: { reputation: 15, unflag: 'traitre' }, r: 'Il repart humilié. Il ne reviendra pas.' }, { p: 0.6, fx: { sante: -40 }, r: 'Coup de couteau. Tu survis de justesse.' }, { p: 1, fx: { mort: 'Règlement de comptes' }, r: 'Tu n’aurais pas dû y aller seul{e}.' }] },
  ] },
  { id: 'reseau_promo', cat: 'Réseau', cond: (s) => job(s, 'reseau') && lvl(s) < 4, txt: 'Le boss du réseau te convoque : il veut te faire monter en grade.', ch: [
    { t: 'Accepter', h: 'Revenus ▲ · Risque ▲', fx: { jobLvl: 1, recherche: 1, motif: 'Trafic de stupéfiants', reputation: 8 }, r: 'Tu montes. Les billets aussi.' },
    { t: 'Rester à ton poste', fx: { karma: 1 }, r: 'Profil bas.' },
    { t: 'Quitter le réseau', out: [{ p: 0.6, fx: { job: null, karma: 6 }, r: 'Le boss te laisse partir. « T’as rien vu, rien entendu. »' }, { p: 1, fx: { job: null, sante: -20 }, r: 'On te fait comprendre qu’on ne part pas comme ça.' }] },
  ] },
  { id: 'descente', cat: 'Police', major: 1, cond: (s) => job(s, 'reseau'), txt: '5 h 50 du matin. Descente de police dans la cité. Ça tape à toutes les portes.', ch: [
    { t: 'Jeter la marchandise par la fenêtre', out: [{ p: 0.6, fx: { money: -3000 }, r: 'Rien trouvé chez toi. Mais la marchandise est perdue.' }, { p: 1, fx: { arrest: { motif: 'Trafic de stupéfiants', peine: [2, 5] } }, r: 'Un policier attendait en bas. Raté.' }] },
    { t: 'Fuir par les toits', out: [{ p: (s) => 0.35 + st(s, 'forme') / 200, fx: { recherche: 2, motif: 'Trafic de stupéfiants', reputation: 8 }, r: 'Tu disparais dans la nuit.' }, { p: 1, fx: { arrest: { motif: 'Trafic de stupéfiants', peine: [3, 6] } }, r: 'Tu glisses. Menotté{e} sur le toit.' }] },
    { t: 'Ouvrir et tout nier', out: [{ p: 0.45, r: 'Ils ne trouvent rien. Coup de chance.' }, { p: 1, fx: { arrest: { motif: 'Trafic de stupéfiants', peine: [2, 4] } }, r: 'Le chien trouve la cache.' }] },
  ] },
  { id: 'rivaux', cat: 'Réseau', cond: (s) => job(s, 'reseau') && lvl(s) >= 2, txt: 'Un réseau rival veut récupérer ton point de deal. Ils t’ont envoyé un message très clair.', ch: [
    { t: 'Négocier', out: [{ p: (s) => 0.4 + st(s, 'charisme') / 200, fx: { reputation: 5 }, r: 'Accord trouvé. Chacun son territoire.' }, { p: 1, fx: { jobLvl: -1 }, r: 'Ils prennent ta place.' }] },
    { t: 'Riposter', out: [{ p: 0.45, fx: { reputation: 15, crime: 5, recherche: 1 }, r: 'Ils reculent. Ton nom fait peur.' }, { p: 0.65, fx: { sante: -40 }, r: 'Tu prends une balle dans la jambe.' }, { p: 1, fx: { mort: 'Règlement de comptes' }, r: 'Une moto, deux silhouettes. Tout s’arrête.' }] },
    { t: 'Abandonner le point', fx: { jobLvl: -1, reputation: -10 }, r: 'Tu recules. On s’en souviendra.' },
  ] },
  { id: 'indic', cat: 'Police', once: 1, cond: (s) => cat(s, 'crime') && s.justice.casier.length > 0, txt: 'Un policier de la BRI te propose un deal : devenir indic contre l’abandon des poursuites.', ch: [
    { t: 'Accepter', fx: { recherche: -3, karma: -2, flag: 'indic' }, r: 'Tu joues désormais un double jeu dangereux.' },
    { t: 'Refuser', fx: { reputation: 6 }, r: '« Tu le regretteras. »' },
  ] },
  { id: 'escroc_offre', cat: 'Rue', age: [17, 50], once: 1, cond: (s) => st(s, 'intel') >= 45 && !s.carriere && !P(s), txt: 'Un ancien du lycée te propose de rejoindre son « business » : de faux sites de vente en ligne. Facile et très rentable.', ch: [
    { t: 'Rejoindre l’équipe', fx: { job: 'escroc', karma: -6, crime: 4 }, r: 'Ordinateurs, VPN et faux profils. Bienvenue dans l’arnaque.' },
    { t: 'Décliner', fx: { karma: 2 }, r: 'Il te traite de naïf. Tant pis.' },
  ] },

  // ================= JUSTICE =================
  { id: 'interpellation', forced: 1, major: 1, cat: 'Police', txt: '6 h du matin. On frappe à ta porte : « Police ! Ouvrez ! » Tu es recherché{e}.', ch: [
    { t: 'Ouvrir et te rendre', fx: (s) => ({ arrest: { motif: s.justice.motif || 'Affaires en cours', peine: [1, 4] }, karma: 2 }), r: 'On te passe les menottes sans résistance.' },
    { t: 'Fuir par la fenêtre', out: [{ p: (s) => 0.25 + st(s, 'forme') / 200, fx: { flag: 'cavale', reputation: 6 }, r: 'Tu t’échappes par les toits. La cavale continue.' }, { p: 1, fx: (s) => ({ arrest: { motif: s.justice.motif || 'Rébellion', peine: [2, 5] } }), r: 'Tu te tords la cheville en sautant. Fin de la course.' }] },
    { t: 'Te barricader', out: [{ p: 0.12, fx: { reputation: 10 }, r: 'Ils finissent par repartir. Incroyable.' }, { p: 0.8, fx: (s) => ({ arrest: { motif: (s.justice.motif || 'Rébellion') + ' et rébellion', peine: [3, 7] } }), r: 'Le RAID défonce la porte.' }, { p: 1, fx: { mort: 'Abattu{e} pendant l’assaut' }, r: 'L’assaut tourne mal.' }] },
  ] },
  { id: 'proces', chain: 1, major: 2, cat: 'Tribunal', pre: (s) => { const p = s.justice.pending || { motif: 'Affaires en cours', peine: [1, 3] }; s.tmp.motifP = p.motif.toLowerCase(); s.tmp.peineMax = p.peine[1]; s.tmp.avocat = s.relations.find((r) => r.vivant && r.destin === 'avocat' && (r.conf ?? 50) >= 50)?.prenom; },
    txt: 'Audience au tribunal correctionnel. Tu es jugé{e} pour {motifP}. Tu risques jusqu’à {peineMax} ans de prison.', ch: [
    { t: 'Appeler {avocat}, ton ami d’enfance avocat', h: 'Gratuit · grosse chance', c: (s) => !!s.tmp.avocat, out: [{ p: 0.6, fx: { acquitte: true }, r: '{avocat} démonte le dossier. {verdict}', days: 2 }, { p: 1, fx: { condamne: 0.45 }, r: '{avocat} obtient une peine très réduite. {verdict}', days: 2 }] },
    { t: 'Avocat commis d’office', out: [{ p: (s) => 0.12 + st(s, 'charisme') / 400, fx: { acquitte: true }, r: '{verdict}', days: 2 }, { p: 1, fx: { condamne: 1 }, r: '{verdict}', days: 2 }] },
    { t: 'Payer un ténor du barreau (25 000 €)', c: (s) => s.money >= 25000, fx: { money: -25000 }, out: [{ p: 0.45, fx: { acquitte: true }, r: '{verdict}', days: 2 }, { p: 1, fx: { condamne: 0.6 }, r: '{verdict}', days: 2 }] },
    { t: 'Plaider coupable', fx: { condamne: 0.5, karma: 3 }, r: '{verdict}', days: 1 },
    { t: 'Fuir avant l’audience', out: [{ p: 0.35, fx: (s) => { s.justice.motif = s.justice.pending?.motif; s.justice.pending = null; return { recherche: 5, flag: 'cavale' }; }, r: 'Tu ne te présentes pas. Mandat d’arrêt lancé contre toi.' }, { p: 1, fx: { condamne: 1.5 }, r: 'Arrêté{e} à la gare. {verdict}' }] },
  ] },

  // ================= PRISON =================
  { id: 'prison_caid', cat: 'Prison', where: 'prison', once: 1, txt: 'Le caïd de ta coursive te propose sa protection… en échange de « services ».', ch: [
    { t: 'Accepter', fx: { crime: 6, reputation: 8, karma: -4, flag: 'protege' }, r: 'Personne ne te touche. Mais tu lui dois tout.' },
    { t: 'Refuser', out: [{ p: 0.5, fx: { reputation: 5 }, r: 'Il te respecte pour ça.' }, { p: 1, fx: { sante: -15 }, r: 'Ses hommes te coincent aux douches.' }] },
    { t: 'Le défier devant tout le monde', out: [{ p: (s) => 0.25 + st(s, 'forme') / 200, fx: { reputation: 20 }, r: 'Tu prends sa place dans la hiérarchie.' }, { p: 1, fx: { sante: -30, prisonAdd: 1 }, r: 'Bagarre générale. Mitard et un an de plus.' }] },
  ] },
  { id: 'prison_bagarre', cat: 'Prison', where: 'prison', txt: 'À la promenade, un détenu te bouscule exprès devant tout le monde.', ch: [
    { t: 'Riposter', out: [{ p: (s) => 0.45 + st(s, 'forme') / 200, fx: { reputation: 8 }, r: 'Il ne recommencera pas.' }, { p: 1, fx: { sante: -12, prisonAdd: 1 }, r: 'Les surveillants te voient en premier. Un an de plus.' }] },
    { t: 'Ignorer', fx: { reputation: -4 }, r: 'Tu gardes la tête basse.' },
    { t: 'Prévenir un surveillant', fx: { reputation: -10, karma: 2 }, r: 'On te colle l’étiquette de balance.' },
  ] },
  { id: 'prison_cours', cat: 'Prison', where: 'prison', once: 1, cond: (s) => !dip(s, 'bac'), txt: 'Le centre scolaire de la prison propose de préparer le bac (DAEU).', ch: [
    { t: 'S’inscrire', out: [{ p: (s) => 0.4 + st(s, 'intel') / 150, fx: { diplome: 'bac', intel: 6, karma: 4 }, r: 'Diplôme obtenu derrière les barreaux. Fierté immense.' }, { p: 1, fx: { intel: 4 }, r: 'Échec à l’examen, mais tu as appris plein de choses.' }] },
    { t: 'Pas intéressé{e}', r: 'Tu passes ton temps à la muscu.' },
  ] },
  { id: 'prison_parloir', cat: 'Prison', where: 'prison', cond: (s) => s.relations.some((r) => r.vivant && r.rel > 50 && ['mere', 'pere', 'conjoint', 'partenaire', 'fratrie'].includes(r.lien)),
    pre: (s) => (s.tmp.proche = s.relations.filter((r) => r.vivant && r.rel > 50 && ['mere', 'pere', 'conjoint', 'partenaire', 'fratrie'].includes(r.lien))[0].prenom), txt: 'Parloir. {proche} est là, de l’autre côté de la vitre, les yeux rougis.', ch: [
    { t: 'Promettre de changer', fx: { karma: 5, bonheur: 6 }, r: '{proche} te serre la main à travers la vitre.' },
    { t: 'Lui demander de faire entrer un téléphone', out: [{ p: 0.6, fx: { bonheur: 4, crime: 2 }, r: 'Le téléphone passe. Contact avec l’extérieur.' }, { p: 1, fx: { prisonAdd: 1 }, r: 'Fouille. Le téléphone est trouvé. Un an de plus.' }] },
  ] },
  { id: 'evasion_j1', chain: 1, major: 3, cat: 'Évasion · Jour 1', txt: 'Jour 1. Ton codétenu a un plan : des draps tressés, une lame de scie et le changement de garde de 3 h.', ch: [
    { t: 'Préparer la corde', r: 'Deux nuits à tresser en silence.', next: 'evasion_j2', days: 2, hour: [2, 3] },
    { t: 'Abandonner', fx: { karma: 2 }, r: 'Trop risqué. Tu attends ta sortie.' },
  ] },
  { id: 'evasion_j2', chain: 1, major: 3, cat: 'Évasion · Nuit 3', txt: 'Nuit 3, 3 h 04. Tu es sur le toit. Le mur d’enceinte est à six mètres.', ch: [
    { t: 'Sauter', out: [{ p: (s) => 0.25 + st(s, 'forme') / 200, fx: { evade: true }, r: 'Tu touches le sol et tu cours. Libre… et recherché{e}.', days: 1 }, { p: 0.65, fx: { prisonAdd: 3, sante: -15 }, r: 'Un projecteur. Les surveillants te plaquent. Trois ans de plus.' }, { p: 1, fx: { mort: 'Chute pendant une évasion' }, r: 'La chute est fatale.' }] },
    { t: 'Redescendre discrètement', r: 'Personne n’a rien vu. Ouf.' },
  ] },
  { id: 'sortie_prison', forced: 1, cat: 'Liberté', txt: 'Les portes s’ouvrent. Après {peine} ans, tu es libre.', ch: [
    { t: 'Repartir à zéro', fx: { karma: 6, bonheur: 10 }, r: 'Tu respires l’air libre. Nouvelle vie.' },
    { t: 'Retrouver tes anciens contacts', fx: { reputation: 6, crime: 3, bonheur: 6 }, r: 'Le quartier t’accueille en héros.' },
  ] },

  // ================= POLICE =================
  { id: 'police_intervention', cat: 'Police', major: 1, cond: (s) => job(s, 'police'), txt: 'Appel radio : braquage en cours dans une supérette. Tu es la patrouille la plus proche.', ch: [
    { t: 'Intervenir immédiatement', out: [{ p: (s) => 0.5 + st(s, 'forme') / 200, fx: { perf: 15, reputation: 3, karma: 5, bonheur: 8 }, r: 'Suspect maîtrisé sans blessé. Ton chef te félicite.' }, { p: 0.85, fx: { sante: -20 }, r: 'Coup de couteau au bras. Tu t’en sors.' }, { p: 1, fx: { mort: 'Tué{e} en service' }, r: 'Le suspect était armé.' }] },
    { t: 'Attendre les renforts', fx: { perf: -4 }, r: 'Les braqueurs ont filé. Rapport mitigé.' },
  ] },
  { id: 'police_pot_de_vin', cat: 'Police', cond: (s) => job(s, 'police'), txt: 'Un dealer te tend une enveloppe épaisse pour que ta patrouille regarde ailleurs.', ch: [
    { t: 'Prendre l’enveloppe', out: [{ p: 0.7, fx: { money: 10000, karma: -10, flag: 'ripou' }, r: '10 000 € en liquide. Tu dors mal.' }, { p: 1, fx: { job: null, arrest: { motif: 'Corruption', peine: [2, 5] } }, r: 'C’était un piège de l’IGPN.' }] },
    { t: 'Refuser et l’interpeller', fx: { perf: 10, karma: 5 }, r: 'Belle affaire. Ton capitaine note ton nom.' },
    { t: 'Refuser sans rien dire', r: 'Tu fais comme si tu n’avais rien vu.' },
  ] },
  { id: 'police_bavure', cat: 'Police', cond: (s) => job(s, 'police'), txt: 'Pendant une interpellation, ton collègue frappe un jeune déjà menotté. Personne d’autre n’a vu.', ch: [
    { t: 'Le signaler à l’IGPN', fx: { karma: 10, perf: -8, bonheur: -3 }, r: 'Le collègue est suspendu. Le service te bat froid.' },
    { t: 'Couvrir ton collègue', fx: { karma: -10 }, out: [{ p: 0.75, r: 'L’affaire est étouffée.' }, { p: 1, fx: { job: null, casier: 'Complicité de violences' }, r: 'Une vidéo sort sur les réseaux. Révocation.' }] },
    { t: 'Le recadrer toi-même', fx: { charisme: 3, karma: 3 }, r: 'Il ne recommencera pas devant toi.' },
  ] },
  { id: 'police_infiltration', cat: 'Police', major: 4, cond: (s) => job(s, 'police') && lvl(s) >= 1, once: 1, txt: 'Ta hiérarchie te propose une mission d’infiltration dans un gros réseau. Quatre jours sous couverture.', ch: [
    { t: 'Accepter la mission', r: 'Tu deviens quelqu’un d’autre.', next: 'infiltration_j3', days: 2 },
    { t: 'Refuser', fx: { perf: -5 }, r: 'Un autre ira à ta place.' },
  ] },
  { id: 'infiltration_j3', chain: 1, major: 4, cat: 'Infiltration · Jour 3', txt: 'Jour 3. Le chef du réseau te soupçonne. Il pose une arme sur la table : « Prouve-moi que t’es pas un keuf. »', ch: [
    { t: 'Bluffer', out: [{ p: (s) => 0.4 + st(s, 'charisme') / 200 + (tr(s, 'calme') ? 0.1 : 0), fx: { perf: 25, jobLvl: 1, notoriete: 5 }, r: 'Il te croit. Le lendemain, coup de filet géant. Promotion !', days: 1 }, { p: 1, fx: { sante: -40 }, r: 'Couverture grillée. Les renforts arrivent juste à temps.', days: 1 }] },
    { t: 'Déclencher l’intervention maintenant', fx: { perf: 10 }, r: 'Arrestations partielles. Mission à moitié réussie.', days: 1 },
  ] },

  // ================= ARTISTES =================
  { id: 'label_rap', cat: 'Musique', cond: (s) => job(s, 'rappeur') && lvl(s) >= 1, once: 1, txt: 'Une major te propose un contrat : 150 000 € d’avance, mais un contrat 360° qui prend 70 % de tout.', ch: [
    { t: 'Signer', fx: { money: 150000, notoriete: 12, flag: 'major' }, r: 'Clip à Los Angeles, featurings, plateau télé.' },
    { t: 'Rester indépendant{e}', fx: { notoriete: 5, karma: 3, art: 4 }, r: 'Ton public respecte ton indépendance.' },
    { t: 'Négocier', out: [{ p: (s) => 0.3 + st(s, 'charisme') / 200, fx: { money: 220000, notoriete: 12 }, r: 'Meilleur contrat, meilleur pourcentage. Chapeau.' }, { p: 1, r: 'Ils retirent l’offre.' }] },
  ] },
  { id: 'clash', cat: 'Musique', cond: (s) => job(s, 'rappeur'), txt: 'Un rappeur connu te clashe dans son dernier son.', ch: [
    { t: 'Répondre avec un diss track', out: [{ p: (s) => 0.3 + st(s, 'art') / 150, fx: { notoriete: 15 }, r: 'Ton diss fait 5 millions de vues. Tu as gagné.' }, { p: 1, fx: { notoriete: -6, bonheur: -6 }, r: 'Ta réponse est jugée faible. Les memes pleuvent.' }] },
    { t: 'L’ignorer', fx: { karma: 2 }, r: 'Le silence, ça aussi c’est une réponse.' },
    { t: 'Régler ça en vrai', fx: { reputation: 10 }, out: [{ p: 0.5, fx: { notoriete: 8 }, r: 'La vidéo de l’embrouille fait le buzz.' }, { p: 1, fx: { arrest: { motif: 'Violences en réunion', peine: [0, 2] } }, r: 'La police intervient devant la salle de concert.' }] },
  ] },
  { id: 'concert', cat: 'Musique', major: 1, cond: (s) => job(s, 'rappeur') && lvl(s) >= 2, txt: 'Ton manager t’annonce une date dans la plus grande salle de Paris. Complet en 4 minutes.', ch: [
    { t: 'Tout donner sur scène', fx: { notoriete: 10, money: 90000, bonheur: 15 }, r: '20 000 personnes chantent tes paroles. Inoubliable.', days: 1, hour: [20, 23] },
    { t: 'Faire venir des invités surprises', fx: { notoriete: 14, money: 60000 }, r: 'Le concert de l’année.', days: 1, hour: [20, 23] },
  ] },
  { id: 'casting', cat: 'Cinéma', age: [16, 55], once: 1, cond: (s) => (s.talent === 'comedie' || st(s, 'charisme') >= 62) && !s.carriere && !P(s), txt: 'Une directrice de casting te repère dans la rue pour un rôle dans une série.', ch: [
    { t: 'Passer l’audition', out: [{ p: (s) => 0.3 + st(s, 'charisme') / 200 + (s.talent === 'comedie' ? 0.15 : 0), fx: { job: 'acteur', notoriete: 20, bonheur: 10 }, r: 'Tu décroches le rôle !' }, { p: 1, fx: { bonheur: -4 }, r: '« On vous rappellera. » Personne ne rappelle.' }] },
    { t: 'Refuser', r: 'Ce n’est pas pour toi.' },
  ] },
  { id: 'expo', cat: 'Art', age: [16, 60], once: 1, cond: (s) => (s.talent === 'dessin' || st(s, 'art') >= 55) && !s.carriere && !P(s), txt: 'Une galerie veut exposer tes graffs.', ch: [
    { t: 'Accepter', fx: { job: 'artiste', notoriete: 20, bonheur: 10 }, r: 'Vernissage plein à craquer. Tu vends trois toiles.' },
    { t: 'Rester dans la rue', fx: { art: 4, reputation: 5 }, r: 'L’art doit rester libre.' },
  ] },
  { id: 'fresque', cat: 'Art', cond: (s) => job(s, 'artiste'), txt: 'Tu as une idée de fresque géante… sur un pont SNCF.', ch: [
    { t: 'La peindre de nuit', out: [{ p: 0.6, fx: { notoriete: 14, art: 3 }, r: 'Au matin, toute la ville en parle.' }, { p: 1, fx: { casier: 'Dégradation de bien public', money: -1500 }, r: 'La police ferroviaire t’attendait.' }] },
    { t: 'Demander une autorisation', fx: { notoriete: 5 }, r: 'Trois mois de paperasse, mais une fresque légale.' },
  ] },
  { id: 'buzz', cat: 'Réseaux', age: [13, 40], once: 1, cond: (s) => (st(s, 'apparence') >= 55 || st(s, 'charisme') >= 55) && !s.carriere && !P(s), txt: 'Une de tes vidéos commence à tourner sur les réseaux.', ch: [
    { t: 'Enchaîner les vidéos', out: [{ p: (s) => 0.35 + st(s, 'charisme') / 200, fx: { notoriete: 18, job: 'influenceur', bonheur: 8 }, r: 'Tu deviens {influenceur|influenceuse}. Les marques t’écrivent.' }, { p: 1, fx: { notoriete: 4 }, r: 'Le buzz retombe aussi vite qu’il est venu.' }] },
    { t: 'Rester discret{|e}', r: 'Tu préfères ta tranquillité.' },
  ] },
  { id: 'placement', cat: 'Réseaux', cond: (s) => job(s, 'influenceur'), txt: 'Une marque douteuse de compléments alimentaires te propose 20 000 € pour une story.', ch: [
    { t: 'Accepter', fx: { money: 20000, karma: -5 }, out: [{ p: 0.7, r: 'Ni vu ni connu.' }, { p: 1, fx: { notoriete: -15 }, r: 'Bad buzz. Un média révèle l’arnaque.' }] },
    { t: 'Refuser', fx: { karma: 4, notoriete: 2 }, r: 'Ta communauté apprécie ton intégrité.' },
  ] },

  // ================= SPORT =================
  { id: 'foot_transfert', cat: 'Football', cond: (s) => job(s, 'foot') && lvl(s) >= 1 && lvl(s) < 4, txt: 'Ton agent a deux offres : un club anglais ambitieux, et un club saoudien qui triple ton salaire.', ch: [
    { t: 'Partir en Angleterre', out: [{ p: (s) => 0.4 + st(s, 'forme') / 200, fx: { jobLvl: 1, notoriete: 15 }, r: 'Saison incroyable : tu deviens titulaire indiscutable.' }, { p: 1, fx: { bonheur: -6 }, r: 'Tu cires le banc toute la saison.' }] },
    { t: 'Prendre le chèque saoudien', fx: (s) => ({ money: CAREERS.foot.niveaux[s.carriere.niveau][1] * 24, notoriete: -8, lieu: 'villa' }), r: 'Deux ans de salaire en prime. Ta carrière internationale, elle, ralentit.' },
    { t: 'Rester fidèle à ton club', fx: { reputation: 10, karma: 3, notoriete: 4 }, r: 'Les supporters chantent ton nom.' },
  ] },
  { id: 'match_decisif', cat: 'Sport', major: 1, cond: (s) => ['foot', 'basket'].includes(s.carriere?.id), txt: 'Dernière minute de la finale. Le ballon arrive dans tes pieds… ou dans tes mains.', ch: [
    { t: 'Tenter le geste décisif', out: [{ p: (s) => 0.35 + st(s, 'forme') / 200, fx: { notoriete: 15, perf: 15, bonheur: 12 }, r: 'BUT ! Le stade explose. Tu es le héros de la soirée.' }, { p: 1, fx: { notoriete: -5, bonheur: -8 }, r: 'Raté. Tu entends les sifflets.' }] },
    { t: 'Faire la passe', fx: { karma: 3, perf: 5 }, r: 'Ton coéquipier marque. Tu as fait le bon choix.' },
  ] },
  { id: 'blessure', cat: 'Sport', cond: (s) => cat(s, 'sport'), w: 0.6, txt: 'Rupture des ligaments croisés à l’entraînement.', ch: [
    { t: 'Rééducation sérieuse', fx: { forme: -10, bonheur: -8 }, days: 60, out: [{ p: 0.6, r: 'Neuf mois d’absence, mais tu reviens plus fort{e}.' }, { p: 1, fx: { jobLvl: -1, bonheur: -6 }, r: 'Pendant ton absence, un autre a pris ta place. Tu redescends d’un niveau.' }] },
    { t: 'Revenir trop vite', out: [{ p: 0.4, fx: { forme: -4 }, r: 'Ça tient. Ouf.' }, { p: 1, fx: { forme: -25, job: null }, r: 'Rechute. Ta carrière est finie.' }] },
  ] },
  { id: 'dopage', cat: 'Sport', once: 1, cond: (s) => cat(s, 'sport'), txt: 'Un préparateur te propose un « protocole » indétectable pour passer un cap.', ch: [
    { t: 'Accepter', out: [{ p: 0.6, fx: { forme: 12, jobLvl: 1, karma: -8 }, r: 'Tes performances explosent.' }, { p: 1, fx: { job: null, notoriete: -30, casier: 'Dopage', bonheur: -20 }, r: 'Contrôle positif. Suspendu{e} quatre ans.' }] },
    { t: 'Refuser', fx: { karma: 5 }, r: 'Tu restes propre.' },
  ] },
  { id: 'combat_titre', cat: 'Boxe', major: 2, cond: (s) => job(s, 'boxe') && lvl(s) >= 1 && lvl(s) < 4, txt: 'Pesée officielle demain. Combat pour la ceinture dans deux jours.', ch: [
    { t: 'Couper du poids à l’extrême', fx: (s) => ((s.tmp.bonus = 0.1), { sante: -5 }), r: 'Tu passes la pesée de justesse.', next: 'combat_titre_j2', days: 1 },
    { t: 'Rester serein', fx: (s) => ((s.tmp.bonus = 0), {}), r: 'Tu dors bien. Le jour J arrive.', next: 'combat_titre_j2', days: 1 },
  ] },
  { id: 'combat_titre_j2', chain: 1, major: 2, cat: 'Boxe · Soir du combat', txt: 'Round 10. Ton adversaire est épuisé… toi aussi.', ch: [
    { t: 'Tout lâcher pour le KO', out: [{ p: (s) => 0.35 + st(s, 'forme') / 220 + (s.tmp.bonus || 0), fx: { jobLvl: 1, notoriete: 15, money: 40000, bonheur: 15 }, r: 'KO ! La ceinture est à toi !', days: 1, hour: [22, 23] }, { p: 0.7, fx: { sante: -25, bonheur: -8 }, r: 'Contre au menton. C’est toi qui tombes.', days: 1 }, { p: 1, fx: { mort: 'Hémorragie cérébrale après un combat' }, r: 'Tu ne te relèves pas.' }] },
    { t: 'Tenir jusqu’à la cloche', out: [{ p: 0.5, fx: { jobLvl: 1, notoriete: 10, money: 25000 }, r: 'Victoire aux points. Champion{|ne} !', days: 1 }, { p: 1, fx: { bonheur: -6 }, r: 'Défaite aux points. Décision contestée.', days: 1 }] },
  ] },
  { id: 'fin_carriere_sport', forced: 1, cat: 'Sport', txt: 'Ton corps ne suit plus. Il est temps d’arrêter ta carrière.', ch: [
    { t: 'Devenir consultant{|e} télé', fx: { job: null, notoriete: 5, money: 60000 }, r: 'Tu commentes les matchs le dimanche soir.' },
    { t: 'Ouvrir une salle de sport', c: (s) => s.money >= 20000, fx: { job: 'entrepreneur', money: -20000 }, r: 'Ta salle porte ton nom.' },
    { t: 'Raccrocher et profiter', fx: { job: null, bonheur: 10 }, r: 'Une page se tourne.' },
  ] },

  // ================= SANS-ABRI & BIDONVILLE =================
  { id: 'sdf_nuit', cat: 'Rue', cond: (s) => s.logement === 'rue' && !s.chezParents, txt: 'L’hiver est là. Cette nuit, il fait −3 °C.', ch: [
    { t: 'Appeler le 115', out: [{ p: 0.5, fx: { sante: 2 }, r: 'Une place se libère dans un centre d’hébergement.' }, { p: 1, fx: { sante: -8 }, r: 'Pas de place ce soir. Nuit glaciale.' }] },
    { t: 'Dormir dans le métro', out: [{ p: 0.7, fx: { sante: -3 }, r: 'Tu tiens jusqu’au matin.' }, { p: 1, fx: { sante: -6, money: -50 }, r: 'On te vole ton sac pendant ton sommeil.' }] },
    { t: 'Squatter un immeuble vide', out: [{ p: 0.6, fx: { sante: 2, crime: 2 }, r: 'Un toit, enfin.' }, { p: 1, fx: { casier: 'Violation de domicile' }, r: 'Expulsé{e} par la police au petit matin.' }] },
  ] },
  { id: 'sdf_manche', cat: 'Rue', cond: (s) => s.logement === 'rue' && !s.chezParents, txt: 'Tu fais la manche devant une boulangerie. Les gens détournent le regard.', ch: [
    { t: 'Continuer, avec un sourire', fx: (s) => ({ money: rnd(15, 60) + st(s, 'charisme'), bonheur: -2 }), r: 'Quelques pièces, un café offert.' },
    { t: 'Jouer de la musique', c: (s) => st(s, 'art') >= 30, fx: (s) => ({ money: rnd(30, 120) + st(s, 'art'), art: 2 }), r: 'Les passants s’arrêtent. Certains filment.' },
    { t: 'Voler un sac à l’arrachée', out: [{ p: 0.55, fx: { money: 180, crime: 3, karma: -6 }, r: 'Tu cours. 180 € dans le portefeuille.' }, { p: 1, fx: { arrest: { motif: 'Vol avec violence', peine: [1, 3] } }, r: 'Un passant te plaque au sol.' }] },
  ] },
  { id: 'sdf_asso', cat: 'Rue', w: 1.3, cond: (s) => ['rue', 'bidonville'].includes(s.logement) && !s.chezParents, txt: 'Une association de réinsertion te propose un hébergement et un contrat aidé en cuisine.', ch: [
    { t: 'Accepter', fx: (s) => (s.id.statut === 'sans_papiers' ? { logement: 'foyer', bonheur: 10 } : { logement: 'foyer', job: 'plonge', bonheur: 10 }), r: 'Un lit, un travail. Le début de la remontée.' },
    { t: 'Refuser', fx: { bonheur: -3 }, r: 'Tu n’es pas prêt{e}.' },
  ] },
  { id: 'sdf_agression', cat: 'Rue', cond: (s) => s.logement === 'rue' && !s.chezParents, txt: 'Trois types s’approchent de ton coin pendant la nuit.', ch: [
    { t: 'Te défendre', out: [{ p: (s) => 0.3 + st(s, 'forme') / 200, fx: { reputation: 6 }, r: 'Ils repartent. On ne viendra plus t’embêter.' }, { p: 1, fx: { sante: -20 }, r: 'Ils te laissent par terre.' }] },
    { t: 'Leur laisser tes affaires', fx: { money: -40, bonheur: -6 }, r: 'Tout ce que tu avais.' },
  ] },
  { id: 'bidonville_incendie', cat: 'Campement', cond: (s) => s.logement === 'bidonville', txt: 'Un incendie se déclare dans le campement en pleine nuit.', ch: [
    { t: 'Aider à sortir les enfants', out: [{ p: 0.75, fx: { karma: 12, reputation: 8 }, r: 'Tu sauves deux enfants. Le campement te doit beaucoup.' }, { p: 1, fx: { sante: -25, karma: 12 }, r: 'Brûlures graves, mais tout le monde est sauf.' }] },
    { t: 'Sauver tes affaires', fx: { money: 100 }, r: 'Tu gardes l’essentiel.' },
    { t: 'Fuir', fx: { bonheur: -6 }, r: 'Tu regardes ta baraque partir en fumée.' },
  ] },
  { id: 'bidonville_evacuation', cat: 'Campement', major: 2, cond: (s) => s.logement === 'bidonville', txt: 'La préfecture annonce l’évacuation du campement dans 48 heures.', ch: [
    { t: 'Accepter l’hébergement d’urgence', fx: { logement: 'foyer' }, r: 'Un hôtel social à 40 km. Mais un toit.', days: 2 },
    { t: 'Résister avec les autres', out: [{ p: 0.5, fx: { reputation: 8 }, r: 'L’évacuation est repoussée.', days: 2 }, { p: 1, fx: { casier: 'Rébellion', logement: 'rue' }, r: 'Les CRS évacuent tout. Garde à vue.', days: 2 }] },
    { t: 'Partir ailleurs', fx: { logement: 'rue', bonheur: -8 }, r: 'Tu reprends la route avec ton sac.', days: 2 },
  ] },
];

// Arrivée en France d'un perso né à l'étranger.
function arrive(s, extra) {
  s.id.ville = s.id.villeCible;
  s.id.statut = s.id.statutCible;
  const m = MILIEUX[s.milieu];
  const home = s.id.statut === 'sans_papiers' && ['precaire', 'modeste'].includes(s.milieu) ? 'bidonville' : m.logement;
  s.logement = home;
  s.logementFamille = home;
  s.etudes.cursus = s.age < 16 ? 'ecole' : null;
  return extra;
}

EVENTS.push(...EVENTS2, ...EVENTS3, ...EVENTS4, ...EVENTS5, ...EVENTS6, ...EVENTS7, ...EVENTS8, ...EVENTS9);
export const EV = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
