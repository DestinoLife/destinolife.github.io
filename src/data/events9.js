// Événements v0.12 « Compétences & Carrières » : la vie au travail avec des collègues persistants,
// les choix de carrière (voie, chasseur de têtes, plan social) et l'embauche après un stage.
import { euros } from '../engine/rng.js';
import { niveau, estSalarie } from '../engine/skills.js';
import { VOIES } from './skills.js';
import { CAREERS, canApply } from './careers.js';

const libre = (s) => s.justice.prison === 0 && !s.cavale;
const collegues = (s, chef) => s.relations.filter((r) => r.vivant && r.lien === 'collegue' && (chef == null || !!r.chef === chef));
// Relie l'événement à un collègue : mêmes variables que les initiatives des proches ({pnj}, {pil}, {pe}…)
const cible = (chef) => (s) => {
  const r = collegues(s, chef)[0] || collegues(s)[0];
  if (!r) return;
  const f = r.genre === 'f';
  Object.assign(s.tmp, { pnjId: r.id, pnj: r.prenom, pil: f ? 'elle' : 'il', Pil: f ? 'Elle' : 'Il', pe: f ? 'e' : '', plui: f ? 'elle' : 'lui', emp: s.carriere?.emp?.nom || 'ta boîte' });
  s.avec = [r.id];
};
const auTravail = (chef) => (s) => libre(s) && estSalarie(s) && !!s.carriere.emp && collegues(s, chef).length > 0;
const reussite = (k, base) => (s) => base + niveau(s, k) * 0.1;

export const EVENTS9 = [
  { id: 'col_mentor', cat: 'Travail', age: [18, 45], w: 0.8, cond: auTravail(true), pre: cible(true),
    txt: '{pnj}, ton supérieur{pe}, te trouve {prometteur|prometteuse} et propose de te prendre sous son aile.', ch: [
      { t: 'Accepter avec plaisir', h: 'Compétences du métier ▲', fx: { compMetier: 70, pnj: { rel: 8, souv: 'Tu as accepté ses conseils avec humilité.', w: 1 } }, r: 'Des semaines de conseils précieux. Tu progresses vite.' },
      { t: 'Tu préfères apprendre seul{e}', fx: { pnj: { rel: -4 } }, r: '{pnj} n’insiste pas.' },
    ] },
  { id: 'col_conflit', cat: 'Travail', age: [18, 66], w: 0.9, cond: auTravail(true), pre: cible(true),
    txt: 'En pleine réunion, {pnj} critique ton travail devant toute l’équipe de {emp}.', ch: [
      { t: 'Répondre, calmement mais fermement', h: 'Éloquence', out: [
        { p: reussite('eloquence', 0.3), fx: { perf: 5, comp: { eloquence: 25 }, pnj: { rel: 3, adm: 10 } }, r: 'Tes arguments font mouche. {pnj} recule, et l’équipe te regarde autrement.' },
        { p: 1, fx: { perf: -8, pnj: { rel: -10, ranc: 10, souv: 'Tu lui as tenu tête en réunion.', w: -1 } }, r: 'Le ton monte. Ça ne joue pas en ta faveur.' },
      ] },
      { t: 'Encaisser sans rien dire', fx: { bonheur: -4, comp: { mental: 15 } }, r: 'Tu ravales ta fierté. Ça laisse un goût amer.' },
      { t: 'Prévenir les ressources humaines', out: [
        { p: 0.45, fx: { pnj: { rel: -15, ranc: 15 }, bonheur: 3 }, r: 'Les RH recadrent {pnj}. L’ambiance est glaciale, mais tu es respecté{e}.' },
        { p: 1, fx: { perf: -5, pnj: { rel: -15, ranc: 15 } }, r: 'Les RH « prennent note ». Rien ne change, sauf que {pnj} le sait.' },
      ] },
    ] },
  { id: 'col_erreur', cat: 'Travail', age: [18, 66], w: 0.8, cond: auTravail(false), pre: cible(false),
    txt: '{pnj}, ton collègue, a fait une grosse erreur. {Pil} te supplie de ne rien dire et de l’aider à la cacher.', ch: [
      { t: 'L’aider à la cacher', h: 'Relation ▲ · risque', out: [
        { p: 0.7, fx: { pnj: { rel: 14, conf: 10, souv: 'Tu l’as couvert{pe} quand {pil} avait fait une erreur.', w: 2 } }, r: 'Personne ne remarque rien. {pnj} te doit une fière chandelle.' },
        { p: 1, fx: { perf: -12, pnj: { rel: 8 } }, r: 'La direction découvre tout. Tu prends ta part du blâme.' },
      ] },
      { t: 'Refuser, mais ne rien dire', fx: { pnj: { rel: -6, ranc: 6 } }, r: '{pnj} se débrouille seul{pe}, vexé{pe}.' },
      { t: 'Prévenir la direction', h: 'Perf ▲ · relation ▼▼', fx: { perf: 6, karma: -1, pnj: { rel: -25, ranc: 25, souv: 'Tu l’as dénoncé{pe} à la direction.', w: -3 } }, r: '{pnj} est recadré{pe}. Tu as gagné des points… et un ennemi.' },
    ] },
  { id: 'col_afterwork', cat: 'Travail', age: [18, 60], w: 1, cond: auTravail(false), pre: cible(false),
    txt: '{pnj} propose un afterwork avec l’équipe de {emp} ce vendredi.', ch: [
      { t: 'Y aller', fx: { bonheur: 4, comp: { persuasion: 20 }, pnj: { rel: 10, souv: 'Vous avez refait le monde à un afterwork.', w: 1 } }, r: 'Soirée mémorable. {pnj} devient bien plus qu’un{pe} collègue.' },
      { t: 'Rentrer chez toi', r: 'Tu préfères garder vie pro et vie perso séparées.' },
    ] },
  { id: 'chef_weekend', cat: 'Travail', age: [18, 66], w: 0.8, cond: auTravail(true), pre: cible(true),
    txt: '{pnj} te demande de venir travailler tout le week-end pour boucler un dossier urgent.', ch: [
      { t: 'Venir', fx: { perf: 9, bonheur: -4, compMetier: 25, pnj: { rel: 6 } }, r: 'Week-end sacrifié, dossier bouclé. {pnj} s’en souviendra.' },
      { t: 'Refuser poliment', fx: { perf: -4, bonheur: 2 }, r: 'Ton week-end, c’est ton week-end.' },
    ] },
  { id: 'voie_carriere', cat: 'Carrière', w: 0, major: 1, cond: (s) => estSalarie(s) && !s.carriere.voie,
    txt: (s) => `Après quelques années comme ${CAREERS[s.carriere.id].niveaux[s.carriere.niveau][0].toLowerCase()}, ta direction te demande dans quelle direction tu veux évoluer.`, ch: [
      { t: 'Devenir expert{|e} de ton métier', h: VOIES.expert.desc, fx: { voie: 'expert' }, r: 'Tu creuses ton sujet. On vient te voir pour les problèmes que personne ne sait résoudre.' },
      { t: 'Encadrer une équipe', h: VOIES.manager.desc, fx: { voie: 'manager', bonheur: -2 }, r: 'Te voilà manager. Moins de technique, plus de réunions… et de responsabilités.' },
      { t: 'Te mettre à ton compte', h: VOIES.freelance.desc, c: (s) => niveau(s, Object.keys(s.comp || {}).sort((a, b) => (s.comp[b] || 0) - (s.comp[a] || 0))[0]) >= 2, fx: { voie: 'freelance' }, r: 'Tu démissionnes pour lancer ton activité. Plus de patron, plus de filet.' },
      { t: 'Rester comme tu es', r: 'Tu es bien là où tu es.' },
    ] },
  { id: 'chasseur_tete', cat: 'Carrière', w: 0, cond: (s) => estSalarie(s) && !!s.carriere.emp && libre(s),
    pre: (s) => (s.tmp.emp = s.carriere.emp.nom),
    txt: 'Un chasseur de têtes t’appelle : une entreprise concurrente veut te recruter, avec 15 % de salaire en plus.', ch: [
      { t: 'Accepter l’offre', h: 'Salaire +15 % · nouveaux collègues', fx: { changeEmployeur: 1, bonheur: 4 }, r: 'Pot de départ chez {emp}, puis nouveau badge, nouveau bureau.' },
      { t: 'T’en servir pour négocier', h: 'Négociation', out: [
        { p: reussite('negociation', 0.35), fx: { salMult: 0.08, comp: { negociation: 25 } }, r: '{emp} s’aligne presque. Tu restes, mieux payé{e}.' },
        { p: 1, fx: { perf: -4 }, r: '« Si tu veux partir, pars. » Tu restes, un peu refroidi{e}.' },
      ] },
      { t: 'Décliner', r: 'Tu es fidèle à {emp}.' },
    ] },
  { id: 'licenciement_eco', cat: 'Carrière', w: 0, major: 1, cond: (s) => estSalarie(s) && !!s.carriere.emp,
    pre: (s) => (s.tmp.emp = s.carriere.emp.nom),
    txt: (s) => `{emp} va mal : plan social. Ton poste est supprimé. Indemnités prévues : ${euros(Math.round((CAREERS[s.carriere.id].niveaux[s.carriere.niveau][1] * (s.carriere.mult || 1)) * Math.max(1, s.carriere.annees / 4)))}.`, ch: [
      { t: 'Accepter le départ', fx: { licenciement: 'accepte', bonheur: -6 }, r: 'Tu rends ton badge. Une page se tourne.' },
      { t: 'Contester aux prud’hommes', h: '40 % de chances de doubler l’indemnité', fx: { licenciement: 'prudhommes', bonheur: -6 }, r: 'Des mois de procédure, puis le jugement tombe.' },
    ] },
  { id: 'offre_stage', cat: 'Carrière', w: 0, cond: (s) => !!s.etudes.stage?.metier && !s.carriere && canApply(s, s.etudes.stage.metier) === true,
    pre: (s) => {
      s.tmp.stage = s.etudes.stage.nom;
      s.tmp.poste = CAREERS[s.etudes.stage.metier].niveaux[0][0].toLowerCase();
    },
    txt: 'Ton diplôme en poche, {stage}, où tu as fait ton stage, te propose un poste de {poste}.', ch: [
      { t: 'Accepter', h: 'Embauche directe', fx: { embaucheStage: 1, bonheur: 6 }, r: 'Tu retrouves une équipe que tu connais déjà. Le premier salaire arrive.' },
      { t: 'Refuser, tu veux voir ailleurs', fx: { finStage: 1 }, r: 'Tu remercies {stage} et tu tentes ta chance ailleurs.' },
    ] },
];
