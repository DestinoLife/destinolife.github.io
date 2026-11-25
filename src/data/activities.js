// Actions disponibles dans le menu du bas. tab : act (Activités), crime (Crime), pro (Carrière), prison.
// run(s) renvoie { fx, r, queue }. days : durée en jours (temps adaptatif), hour : plage horaire, lieu : scène affichée.
import { rnd, pick, chance, euros } from '../engine/rng.js';
import { COTIERES } from './identity.js';
import { CAREERS } from './careers.js';
import { startNetwork, comeBack } from '../engine/economy.js';
import { PLAGE_PROCHE } from './world2.js';
import { diagnose } from '../engine/life2.js';

const coast = (s) => COTIERES.includes(s.id.ville) || s.id.statut === 'au_pays';
const single = (s) => !s.relations.some((r) => r.vivant && (r.lien === 'partenaire' || r.lien === 'conjoint'));
const jobCat = (s) => (s.carriere ? CAREERS[s.carriere.id].cat : null);

// Fabrique d'actions criminelles : succès selon le savoir-faire, sinon arrestation possible.
function crime({ id, nom, desc, icon, age, p, gain, motif, peine, rech = 0.35, cond, days = [1, 3], hour = [21, 23], karma = -4, extra }) {
  return {
    id, tab: 'crime', nom, desc, icon, age, cond, days, hour, risk: p,
    run: (s) => {
      const bonus = (s.traits.includes('malin') ? 0.06 : 0) + (s.traits.includes('impulsif') ? -0.05 : 0);
      if (chance(Math.min(0.95, p(s) + bonus))) {
        const g = rnd(gain[0], gain[1]);
        const boost = s.relations.some((r) => r.vivant && (r.role === 'receleur' || r.role === 'ferrailleur')) ? 1.3 : 1;
        const g2 = Math.round(g * boost);
        const fx = { money: g2, sale: g2, crime: rnd(2, 4), karma, reputation: rnd(1, 3) };
        if (chance(rech)) Object.assign(fx, { recherche: 1, motif });
        if (extra) Object.assign(fx, extra);
        return { fx, r: g ? `${nom} : réussi. +${euros(g2)}${boost > 1 ? " (ton receleur paie mieux)" : ""}.` : `${nom} : réussi.`, good: true };
      }
      if (chance(0.55)) return { fx: { arrest: { motif, peine } }, r: `${nom} : raté. Pris{e} sur le fait.` };
      return { fx: { recherche: 1, motif, karma: -2 }, r: `${nom} : raté, mais tu t’enfuis.` };
    },
  };
}

export const ACTIVITIES = [
  // ---------- Loisirs & santé ----------
  { id: 'jouer', tab: 'act', nom: 'Jouer dehors', desc: 'Bonheur, forme', icon: 'ball', age: [2, 11], days: [1, 3], hour: [15, 18],
    run: () => ({ fx: { bonheur: rnd(3, 6), forme: rnd(1, 3) }, r: pick(['Après-midi au parc. Genoux écorchés, sourire jusqu’aux oreilles.', 'Partie de foot épique en bas de l’immeuble.']) }) },
  { id: 'sport', tab: 'act', nom: 'Salle de sport', desc: 'Forme, santé, apparence', icon: 'dumbbell', age: [13, 95], cost: 25, days: [2, 6], hour: [7, 21],
    run: () => ({ fx: { forme: rnd(3, 6), sante: rnd(1, 3), apparence: rnd(0, 2), bonheur: 1 }, r: pick(['Grosse séance jambes. Tu marches bizarrement.', 'Nouveau record au développé couché.', 'Cardio intense. Tu sues tout ton stress.']) }) },
  { id: 'courir', tab: 'act', nom: 'Footing', desc: 'Forme, santé', icon: 'run', age: [10, 85], days: [1, 3], hour: [6, 9], lieu: (s) => (coast(s) ? 'plage' : null),
    run: () => ({ fx: { forme: rnd(2, 4), sante: rnd(1, 3) }, r: 'Tu cours au lever du soleil. Tête vidée.' }) },
  { id: 'etudier', tab: 'act', nom: 'Étudier', desc: 'Intelligence', icon: 'book', age: [6, 95], days: [3, 10], hour: [14, 22],
    run: () => ({ fx: { intel: rnd(3, 6), bonheur: -1 }, r: pick(['Des heures à la bibliothèque. Ça rentre.', 'Tu enchaînes les documentaires et les bouquins.']) }) },
  { id: 'musique', tab: 'act', nom: 'Musique / écriture', desc: 'Talent artistique', icon: 'mic', age: [8, 90], days: [2, 6], hour: [16, 23], lieu: (s) => (s.age >= 15 ? 'studio' : null), cost: (s) => (s.age >= 16 ? 40 : 0),
    run: () => ({ fx: { art: rnd(3, 6), bonheur: 2 }, r: pick(['Tu poses un couplet dont tu es fier{|e}.', 'Session studio jusqu’à l’aube.']) }) },
  { id: 'dessin', tab: 'act', nom: 'Dessiner', desc: 'Talent artistique', icon: 'brush', age: [4, 95], days: [1, 4],
    run: () => ({ fx: { art: rnd(2, 5), bonheur: 2 }, r: 'Ton carnet se remplit de personnages.' }) },
  { id: 'plage', tab: 'act', nom: 'Journée à la plage', desc: 'Bonheur', icon: 'sun', age: [2, 100], days: [1, 2], hour: [11, 18], cost: (s) => (coast(s) || s.chezParents ? 0 : 120),
    run: (s) => {
      if (coast(s)) return { fx: { bonheur: rnd(6, 10), sante: 1, lieu: 'plage' }, r: pick(['Sable chaud, eau turquoise. La vie est belle.', 'Baignade, glace, sieste. Journée parfaite.']) };
      const dest = PLAGE_PROCHE[s.id.ville] || 'la côte';
      s.voyage = { ville: dest, pays: 'France', scene: 'plage', id: 'jour' };
      return { fx: { bonheur: rnd(6, 10), sante: 1 }, r: `Deux heures de route jusqu’à ${dest}. Ça valait le coup.` };
    } },
  { id: 'soiree', tab: 'act', nom: 'Sortir en boîte', desc: 'Bonheur, rencontres', icon: 'music', age: [18, 60], cost: 80, days: [2, 5], hour: [0, 4], lieu: 'appart',
    run: (s) => {
      const q = single(s) && chance(0.3) ? 'rencontre' : chance(0.12) ? 'bagarre_boite' : null;
      return { fx: { bonheur: rnd(5, 10), sante: -rnd(1, 3), charisme: 1 }, r: 'Soirée jusqu’au bout de la nuit.', queue: q };
    } },
  { id: 'amis', tab: 'act', nom: 'Se faire des amis', desc: 'Des amis qui t’aideront plus tard', icon: 'users', age: [5, 90], days: [2, 6], hour: [14, 20],
    run: (s) => ({ fx: { addRel: { lien: 'ami', age: s.age + rnd(-1, 2), rel: rnd(55, 75) }, charisme: 1, bonheur: 3 }, r: 'Une nouvelle amitié commence.' }) },
  { id: 'boire', tab: 'act', nom: 'Boire un verre', desc: 'Bonheur, risque d’addiction', icon: 'music', age: [16, 99], cost: 25, days: [1, 2], hour: [19, 23],
    run: () => ({ fx: { use: 'alcool', bonheur: rnd(3, 6), sante: -1 }, r: 'Un verre, puis deux, puis trois…' }) },
  { id: 'fumer', tab: 'act', nom: 'Fumer', desc: 'Calme, mais addictif', icon: 'leaf', age: [12, 99], cost: 12, days: [0, 1],
    run: () => ({ fx: { use: 'tabac', bonheur: 2, sante: -1 }, r: 'Une cigarette pour souffler.' }) },
  { id: 'joint', tab: 'crime', nom: 'Fumer un joint', desc: 'Planer, addiction', icon: 'leaf', age: [13, 99], cost: 20, days: [0, 1], hour: [18, 23],
    run: () => ({ fx: { use: 'cannabis', bonheur: rnd(4, 7), intel: -1 }, r: 'Tu ris pour rien pendant une heure.' }) },
  { id: 'coke', tab: 'crime', nom: 'Prendre de la cocaïne', desc: 'Euphorie, très addictif', icon: 'sparkle', age: [18, 99], cost: 90, days: [0, 1], hour: [0, 4],
    run: (s) => (Math.random() < s.addic.coke / 900 ? { fx: { mort: 'Overdose' }, r: 'Ton cœur lâche.' } : { fx: { use: 'coke', bonheur: rnd(8, 12), sante: -rnd(3, 6) }, r: 'Tu te sens invincible. Pour quelques heures.' }) },
  { id: 'paris', tab: 'act', nom: 'Paris sportifs', desc: 'Petit gain, grosse addiction', icon: 'ticket', age: [18, 99], days: [0, 1], cond: (s) => s.money >= 20 || 'Il te faut 20 €.',
    run: (s) => { const b = Math.max(20, Math.round(s.money * 0.05)); return Math.random() < 0.42 ? { fx: { use: 'jeu', money: b }, r: `Pari gagné : +${euros(b)}.`, good: true } : { fx: { use: 'jeu', money: -b }, r: `Pari perdu : −${euros(b)}.` }; } },
  { id: 'cure', tab: 'act', nom: 'Cure de désintoxication', desc: 'Un mois pour s’en sortir', icon: 'cross', age: [14, 99], cost: 4000, days: [25, 35], lieu: 'hopital',
    cond: (s) => Math.max(...Object.values(s.addic || {})) >= 20 || 'Tu n’as pas d’addiction.',
    run: () => ({ fx: { cure: 'lourde', bonheur: -4, sante: 6 }, r: 'Un mois sans rien. Le plus dur reste de tenir dehors.' }) },
  { id: 'groupe', tab: 'act', nom: 'Groupe de parole', desc: 'Gratuit, aide à décrocher', icon: 'hand', age: [14, 99], days: [1, 3],
    cond: (s) => Math.max(...Object.values(s.addic || {})) >= 10 || 'Tu n’as pas d’addiction.',
    run: () => ({ fx: { cure: 'legere', bonheur: 2 }, r: '« Bonjour, je m’appelle… » Ça fait du bien de parler.' }) },
  { id: 'dating', tab: 'act', nom: 'Faire des rencontres', desc: 'Amour', icon: 'heart', age: [13, 85], days: [3, 10], hour: [19, 22], cond: (s) => single(s) || 'Tu es déjà en couple.',
    run: () => ({ r: 'Tu swipes, tu discutes, tu sors.', queue: 'rencontre' }) },
  { id: 'voyage', tab: 'act', ui: 'voyage', nom: 'Voyager', desc: '11 destinations dans le monde', icon: 'plane', age: [16, 95], days: [7, 15], hour: [12, 19],
    cond: (s) => (s.id.statut === 'sans_papiers' ? 'Impossible de voyager sans papiers.' : true),
    run: (s) => {
      const d = s.id.origine !== 'france' && s.id.statut !== 'au_pays' && chance(0.5) ? 'pays' : 'plage';
      return { fx: { bonheur: rnd(12, 18), sante: 2, lieu: d }, r: d === 'pays' ? 'Vacances au {pays}, en famille.' : 'Deux semaines au soleil. Tu reviens bronzé{e}.' };
    } },
  { id: 'medecin', tab: 'act', nom: 'Aller chez le médecin', desc: 'Santé', icon: 'cross', age: [0, 110], cost: 25, days: [1, 2], hour: [9, 17], lieu: 'hopital',
    run: (s) => {
      const found = diagnose(s);
      return { fx: { sante: rnd(4, 10) }, r: found.length ? `Diagnostic : ${found.join(', ').toLowerCase()}. Traitement lancé.` : 'Bilan complet : rien d’alarmant.' };
    } },
  { id: 'chirurgie', tab: 'act', nom: 'Chirurgie esthétique', desc: 'Apparence ▲▲, risque', icon: 'sparkle', age: [18, 75], cost: 6000, days: [5, 15], lieu: 'hopital',
    run: () => (chance(0.08) ? { fx: { sante: -18, apparence: -8, bonheur: -10 }, r: 'Complications. Le résultat est raté.' } : { fx: { apparence: rnd(8, 14), bonheur: 6 }, r: 'Résultat bluffant. Tu te reconnais à peine.' }) },
  { id: 'meditation', tab: 'act', nom: 'Méditer', desc: 'Bonheur, karma', icon: 'leaf', age: [10, 110], days: [1, 2],
    run: () => ({ fx: { bonheur: rnd(3, 5), karma: 1, sante: 1 }, r: 'Respiration, silence. Ça fait du bien.' }) },
  { id: 'benevolat', tab: 'act', nom: 'Bénévolat', desc: 'Karma, charisme', icon: 'hand', age: [12, 95], days: [2, 6], hour: [9, 18],
    run: () => ({ fx: { karma: rnd(4, 7), bonheur: 3, charisme: 1 }, r: 'Distribution de repas aux Restos. Les sourires valent tout.' }) },
  { id: 'casino', tab: 'act', ui: 'casino', nom: 'Casino', desc: 'Roulette et machines à sous', icon: 'dice', age: [18, 100], days: [0, 1], hour: [22, 23], lieu: 'casino', cond: (s) => (s.flags.interdit_casino ? 'Tu es interdit de casino.' : s.money >= 50 || 'Il te faut au moins 50 €.'),
    run: () => ({ r: 'Lumières tamisées, tapis verts. Faites vos jeux.' }) },
  { id: 'loto', tab: 'act', nom: 'Jouer au loto', desc: '1 chance sur… beaucoup', icon: 'ticket', age: [18, 110], cost: 3, free: true, days: [0, 1],
    run: () => {
      if (chance(1 / 20000)) return { fx: { money: 4000000, bonheur: 40 }, r: 'JACKPOT ! 4 000 000 € ! Ta vie bascule.', good: true };
      if (chance(1 / 40)) return { fx: { money: 60 }, r: 'Trois numéros : +60 €.', good: true };
      return { r: 'Perdu. Comme d’habitude.' };
    } },

  // ---------- Carrière & talents ----------
  { id: 'bosser', tab: 'pro', nom: 'Travailler dur', desc: 'Performance ▲', icon: 'briefcase', age: [14, 90], days: [5, 20], hour: [9, 18],
    cond: (s) => (!s.carriere ? 'Tu n’as pas de travail.' : CAREERS[s.carriere.id].cat === 'crime' ? 'Dans le milieu, ça se passe dans l’onglet Crime.' : true), lieu: (s) => CAREERS[s.carriere.id].scene,
    run: (s) => ({ fx: { perf: rnd(8, 14), bonheur: -2, sante: -1, ...(CAREERS[s.carriere.id].fame ? { notoriete: rnd(2, 5) } : {}), ...(CAREERS[s.carriere.id].stat === 'forme' ? { forme: rnd(1, 3) } : {}) }, r: 'Tu donnes tout. Ça se remarque.' }) },
  { id: 'augmentation', tab: 'pro', nom: 'Demander une promotion', desc: 'Selon perf. et charisme', icon: 'trend', age: [16, 90], days: [1, 5], hour: [10, 17],
    cond: (s) => (s.carriere && !CAREERS[s.carriere.id].fame && !['crime', 'politique'].includes(CAREERS[s.carriere.id].cat) ? true : 'Indisponible pour ce métier.'),
    run: (s) => (chance(0.12 + s.carriere.perf / 300 + s.stats.charisme / 400) ? { fx: { jobLvl: 1, bonheur: 6 }, r: 'Accordé ! Nouveau poste.', good: true } : { fx: { perf: -6, bonheur: -3 }, r: 'Refusé. « On en reparle l’an prochain. »' }) },
  { id: 'demission', tab: 'pro', nom: 'Démissionner', desc: 'Quitter ton poste', icon: 'door', age: [14, 99], free: true, days: [0, 1], cond: (s) => (!s.carriere ? 'Tu n’as pas de travail.' : CAREERS[s.carriere.id].cat === 'crime' ? 'On ne démissionne pas du milieu…' : true),
    run: () => ({ fx: { job: null, bonheur: 3 }, r: 'Lettre posée sur le bureau. Libre.' }) },
  { id: 'essais_pro', tab: 'pro', nom: 'Tenter les essais pro', desc: 'Foot, basket ou boxe', icon: 'trophy', age: [15, 27], days: [3, 10], lieu: 'stade',
    cond: (s) => (s.carriere ? 'Quitte d’abord ton métier.' : s.stats.forme < 55 ? 'Forme 55 requise.' : true),
    run: (s) => {
      const sp = ['football', 'basket', 'boxe'].includes(s.talent) ? { football: 'foot', basket: 'basket', boxe: 'boxe' }[s.talent] : pick(['foot', 'basket', 'boxe']);
      // Très peu de jeunes passent pro : il faut une forme d’athlète, et le talent aide beaucoup
      const p = 0.02 + Math.max(0, s.stats.forme - 60) / 300 + (['football', 'basket', 'boxe'].includes(s.talent) ? 0.07 : 0);
      return chance(p) ? { fx: { job: sp, notoriete: 6, bonheur: 12 }, r: 'Les recruteurs sont convaincus. Contrat signé !', good: true } : { fx: { bonheur: -6 }, r: 'Pas retenu{e}. Il faudra plus de travail.' };
    } },
  { id: 'son', tab: 'pro', nom: 'Sortir un son', desc: 'Notoriété', icon: 'mic', age: [13, 70], days: [5, 20], hour: [20, 23], lieu: 'studio', cost: 150,
    cond: (s) => (s.carriere && !['rappeur', 'artiste'].includes(s.carriere.id) ? 'Tu as déjà un métier.' : s.stats.art < 30 ? 'Talent artistique 30 requis.' : true),
    run: (s) => {
      // Chaque son est un pari : la plupart passent inaperçus, quelques-uns explosent. Sortir trop de sons lasse le public.
      s.annee.sons = (s.annee.sons || 0) + 1;
      const lasse = [1, 0.55, 0.3, 0.15][Math.min(3, s.annee.sons - 1)];
      const hit = chance(0.04 + s.stats.art / 2500);
      const flop = !hit && chance(0.4);
      const n = Math.round((flop ? rnd(-3, 0) : rnd(0, 4) + Math.round(s.stats.art / 30)) * lasse + (hit ? rnd(10, 16) : 0));
      const fx = { notoriete: n, art: 1 };
      if (!s.carriere) fx.job = 'rappeur';
      return { fx, r: hit ? 'Ton son explose sur les plateformes !' : flop ? 'Flop. Les commentaires sont durs, les écoutes ne décollent pas.' : lasse < 1 ? 'Ton public sature un peu : trop de sorties cette année.' : 'Ton son sort. Quelques milliers d’écoutes.', good: hit, err: flop };
    } },
  { id: 'video', tab: 'pro', nom: 'Poster des vidéos', desc: 'Notoriété en ligne', icon: 'camera', age: [13, 70], days: [3, 10],
    cond: (s) => (s.carriere && !['influenceur', 'acteur'].includes(s.carriere.id) ? 'Tu as déjà un métier.' : true),
    run: (s) => {
      const n = rnd(0, 5) + Math.round((s.stats.charisme + s.stats.apparence) / 40) + (chance(0.06) ? 18 : 0);
      const fx = { notoriete: n };
      if (!s.carriere && s.stats.notoriete + n >= 8) fx.job = 'influenceur';
      return { fx, r: n > 14 ? 'Vidéo virale ! Des milliers d’abonnés en une nuit.' : 'Quelques likes. Il faut persévérer.', good: n > 14 };
    } },
  { id: 'secher', tab: 'pro', nom: 'Sécher les cours', desc: 'Bonheur ▲, notes ▼', icon: 'door', age: [11, 19], days: [1, 3], hour: [10, 16],
    cond: (s) => ['ecole', 'lycee', 'cap', 'fac', 'bts'].includes(s.etudes.cursus) || 'Tu n’es pas scolarisé.',
    run: (s) => (Math.random() < 0.3 ? { fx: { intel: -2, rel: { lien: 'parents', d: -8 } }, r: 'Convocation chez le CPE. Tes parents sont furieux.' } : { fx: { bonheur: 5, intel: -2, reputation: 2 }, r: 'Après-midi au centre commercial avec les potes.' }) },
  { id: 'fuguer', tab: 'pro', nom: 'Fuguer', desc: 'Décision majeure', icon: 'run', age: [11, 17], days: [0, 1], hour: [1, 3],
    cond: (s) => s.chezParents || 'Tu ne vis plus chez tes parents.', run: () => ({ r: 'Tu attends que tout le monde dorme.', queue: 'fugue_action' }) },
  { id: 'decrocher', tab: 'pro', nom: 'Arrêter l’école', desc: 'Possible à partir de 16 ans', icon: 'door', age: [16, 30], free: true, days: [0, 1],
    cond: (s) => ['lycee', 'cap', 'fac', 'bts', 'master', 'medecine', 'droit'].includes(s.etudes.cursus) || 'Tu n’es pas scolarisé.',
    run: () => ({ fx: { etudes: { cursus: null, reste: null }, bonheur: 4 }, r: 'Tu quittes les études. Place à la vraie vie.' }) },
  { id: 'politique', tab: 'pro', nom: 'Se lancer en politique', desc: 'Municipales · décision majeure', icon: 'flag', age: [18, 75], days: [0, 1],
    cond: (s) => (jobCat(s) === 'politique' ? 'Tu fais déjà de la politique.' : !['ne_france', 'naturalise'].includes(s.id.statut) ? 'Il faut la nationalité française.' : s.stats.charisme < 40 && s.stats.notoriete < 40 ? 'Charisme ou notoriété de 40 requis.' : true),
    run: () => ({ r: 'Tu déposes ta candidature à la mairie.', queue: 'municipales' }) },
  { id: 'regul', tab: 'pro', nom: 'Démarches à la préfecture', desc: 'Régularisation', icon: 'file', age: [18, 99], days: [1, 3], hour: [8, 12],
    cond: (s) => (s.id.statut === 'sans_papiers' ? true : 'Réservé aux personnes sans papiers.'),
    run: () => ({ r: 'File d’attente dès 5 h du matin devant la préfecture.', queue: 'regularisation' }) },
  { id: 'natu', tab: 'pro', nom: 'Demander la nationalité', desc: 'Naturalisation', icon: 'flag', age: [18, 99], days: [1, 3], hour: [8, 12],
    cond: (s) => (s.id.statut !== 'titre' ? 'Il faut un titre de séjour.' : s.justice.casier.length ? 'Casier judiciaire non vierge.' : true),
    run: () => ({ r: 'Dossier épais comme un annuaire.', queue: 'naturalisation' }) },

  // ---------- Crime (PEGI 18) ----------
  crime({ id: 'vol_etalage', nom: 'Vol à l’étalage', desc: 'Petit gain, petit risque', icon: 'bag', age: [10, 90], p: (s) => 0.7 + s.stats.crime / 300, gain: [20, 160], motif: 'Vol à l’étalage', peine: [0, 0], rech: 0.1, days: [1, 2], hour: [10, 19], karma: -2 }),
  crime({ id: 'pickpocket', nom: 'Pickpocket', desc: 'Dans le métro', icon: 'hand', age: [12, 80], p: (s) => 0.55 + s.stats.crime / 260, gain: [40, 450], motif: 'Vol à la tire', peine: [0, 1], rech: 0.2, days: [1, 3], hour: [8, 19] }),
  crime({ id: 'tag', nom: 'Graffer un train', desc: 'Art ▲, réputation ▲', icon: 'brush', age: [12, 60], p: (s) => 0.6 + s.stats.art / 300, gain: [0, 0], motif: 'Dégradation', peine: [0, 0], rech: 0.15, days: [1, 2], hour: [1, 4], karma: -1, extra: { art: 3, notoriete: 1 } }),
  crime({ id: 'cambriolage', nom: 'Cambrioler une maison', desc: 'Gain moyen, risque réel', icon: 'home', age: [16, 75], p: (s) => 0.45 + s.stats.crime / 220, gain: [600, 9000], motif: 'Cambriolage', peine: [1, 3], days: [2, 6], hour: [1, 4] }),
  crime({ id: 'vol_voiture', nom: 'Voler une voiture', desc: 'Revente en pièces', icon: 'car', age: [16, 70], p: (s) => 0.4 + s.stats.crime / 220, gain: [2000, 14000], motif: 'Vol de véhicule', peine: [1, 3], days: [2, 5], hour: [1, 4] }),
  crime({ id: 'arnaque', nom: 'Arnaque en ligne', desc: 'Intelligence 40', icon: 'laptop', age: [16, 90], p: (s) => 0.4 + s.stats.intel / 300 + s.stats.crime / 400, gain: [800, 25000], motif: 'Escroquerie', peine: [1, 2], rech: 0.3, days: [5, 15], hour: [20, 23],
    cond: (s) => s.stats.intel >= 40 || 'Intelligence 40 requise.' }),
  { id: 'deal', tab: 'crime', nom: 'Faire des heures au point', desc: 'Réseau : argent rapide', icon: 'cash', age: [13, 70], days: [3, 10], hour: [14, 23], lieu: 'cite',
    cond: (s) => (s.carriere?.id === 'reseau' || s.reseau ? true : 'Il faut faire partie d’un réseau.'),
    run: (s) => {
      const g = rnd(400, 1800) * ((s.carriere?.niveau ?? 3) + 1);
      const fx = { money: g, sale: g, crime: 2, karma: -3, perf: 10, reputation: 2 };
      if (chance(0.3)) Object.assign(fx, { recherche: 1, motif: 'Trafic de stupéfiants' });
      return { fx, r: `Grosse journée. +${euros(g)}.`, good: true };
    } },
  { id: 'reseau', tab: 'crime', nom: 'Rejoindre le réseau du quartier', desc: 'Entrer dans le trafic', icon: 'users', age: [13, 50], days: [1, 5], hour: [18, 23], lieu: 'cite',
    cond: (s) => (s.carriere?.id === 'reseau' ? 'Tu en fais déjà partie.' : s.carriere && !['classique'].includes(jobCat(s)) ? 'Quitte d’abord ton métier.' : true),
    run: (s) => (chance(0.45 + s.stats.reputation / 150 + s.stats.crime / 200) ? { fx: { job: 'reseau', crime: 4, karma: -6, reputation: 6 }, r: 'Le grand frère du quartier te fait confiance. Tu es dedans.', good: true } : { fx: { reputation: -2 }, r: '« T’es pas prêt{e}, reviens plus tard. »' }) },
  { id: 'braquage', tab: 'crime', nom: 'Monter un braquage', desc: 'Décision majeure · 3 jours', icon: 'mask', age: [18, 65], days: [0, 1], hour: [18, 22],
    cond: (s) => (s.carriere?.id === 'police' ? 'Tu es flic.' : s.stats.crime < 15 ? 'Savoir-faire criminel 15 requis.' : true),
    run: () => ({ r: 'Le plan se met en place avec {ami}.', queue: 'braquage_j1' }) },

  { id: 'fuite', tab: 'crime', ui: 'cavale', nom: 'Fuir à l’étranger', desc: 'Choisis ta planque selon la sécurité', icon: 'plane', age: [16, 90], free: true,
    cond: (s) => (s.cavale ? 'Tu es déjà en cavale.' : s.justice.recherche < 1 ? 'Personne ne te recherche.' : true), run: () => ({}) },
  { id: 'revenir', tab: 'crime', nom: 'Rentrer en France', desc: 'Fin de cavale, risque d’arrestation', icon: 'home', age: [16, 99], days: [1, 2], cond: (s) => !!s.cavale || 'Tu n’es pas en cavale.',
    run: (s) => ({ r: comeBack(s).r }) },
  { id: 'contact', tab: 'crime', nom: 'Chercher un contact', desc: 'Receleur, fournisseur, faussaire…', icon: 'users', age: [16, 90], days: [2, 6], hour: [19, 23],
    run: () => ({ fx: { contact: true }, r: 'Un pote te file un numéro. Regarde ton téléphone.' }) },
  { id: 'monter_reseau', tab: 'crime', nom: 'Monter ton propre réseau', desc: '15 000 € de mise · tu deviens le boss', icon: 'cash', age: [18, 70], days: [3, 10],
    cond: (s) => (s.reseau ? 'Ton réseau tourne déjà.' : s.carriere?.id === 'police' ? 'Tu es flic.' : true), run: (s) => { const r = startNetwork(s); return { r: r.r, good: r.good }; } },
  { id: 'clip', tab: 'pro', nom: 'Tourner un clip', desc: 'Choisis le lieu et le budget', icon: 'camera', age: [14, 70], days: [0, 1], cond: (s) => s.carriere?.id === 'rappeur' || 'Il faut être rappeur.',
    run: () => ({ r: 'Ton réalisateur attend tes consignes.', queue: 'clip' }) },
  { id: 'manche', tab: 'act', nom: 'Faire la manche', desc: 'Quelques pièces pour survivre', icon: 'hand', age: [10, 99], days: [1, 3], hour: [9, 19], cond: (s) => (s.logement === 'rue' && !s.chezParents) || 'Seulement si tu vis dans la rue.',
    run: (s) => ({ fx: { money: rnd(10, 45) + Math.round(s.stats.charisme / 3), bonheur: -2 }, r: 'Une journée sur le trottoir. Quelques pièces, beaucoup d’indifférence.' }) },

  // ---------- Prison ----------
  { id: 'muscu_prison', tab: 'prison', prison: true, nom: 'Muscu en cellule', desc: 'Forme', icon: 'dumbbell', days: [10, 30],
    run: () => ({ fx: { forme: rnd(3, 6), bonheur: 1 }, r: 'Pompes, tractions, gainage. Tous les jours.' }) },
  { id: 'lire_prison', tab: 'prison', prison: true, nom: 'Bibliothèque', desc: 'Intelligence', icon: 'book', days: [10, 30],
    run: () => ({ fx: { intel: rnd(3, 6), karma: 1 }, r: 'Tu lis tout ce qui te tombe sous la main.' }) },
  { id: 'atelier_prison', tab: 'prison', prison: true, nom: 'Travailler à l’atelier', desc: 'Un peu d’argent', icon: 'briefcase', days: [15, 40],
    run: () => ({ fx: { money: rnd(200, 450), karma: 2 }, r: 'Quelques euros pour cantiner.' }) },
  { id: 'bagarre_prison', tab: 'prison', prison: true, nom: 'Provoquer une bagarre', desc: 'Réputation ▲, risque', icon: 'fist', days: [3, 10],
    run: (s) => (chance(0.4 + s.stats.forme / 220) ? { fx: { reputation: rnd(6, 12), crime: 2 }, r: 'Tu gagnes. Tout le bâtiment le sait.' } : { fx: { sante: -15, prisonAdd: chance(0.4) ? 1 : 0 }, r: 'Tu finis à l’infirmerie, puis au mitard.' }) },
  { id: 'cantiner', tab: 'prison', prison: true, nom: 'Cantiner', desc: 'Améliorer le quotidien', icon: 'bag', cost: 150, days: [5, 15],
    run: () => ({ fx: { bonheur: rnd(4, 8), sante: 1 }, r: 'Chocolat, café, une vraie poêle. Le luxe.' }) },
  { id: 'trafic_prison', tab: 'prison', prison: true, nom: 'Trafiquer en détention', desc: 'Argent ▲, risque de rallonge', icon: 'cash', days: [10, 30],
    run: (s) => (chance(0.6 + s.stats.crime / 300) ? { fx: { money: rnd(800, 3000), crime: 3, reputation: 4 }, r: 'Cigarettes et téléphones. Ça rapporte.' } : { fx: { prisonAdd: 1 }, r: 'Surpris par un surveillant. Un an de plus.' }) },
  { id: 'foot_prison', tab: 'prison', prison: true, nom: 'Tournoi de foot', desc: 'Forme, réputation', icon: 'ball', days: [5, 15],
    run: () => ({ fx: { forme: rnd(2, 4), reputation: rnd(1, 4), bonheur: 3 }, r: 'Ton équipe gagne le tournoi du bâtiment.' }) },
  { id: 'lettres', tab: 'prison', prison: true, nom: 'Écrire à tes proches', desc: 'Bonheur, relations', icon: 'file', days: [3, 10],
    run: () => ({ fx: { bonheur: 4, rel: { lien: 'parents', d: 6 }, karma: 2 }, r: 'Tu écris des pages entières. Ça fait du bien.' }) },
  { id: 'demander_amenagement', tab: 'prison', prison: true, nom: 'Demander un aménagement', desc: 'Bracelet électronique ?', icon: 'scale', days: [5, 20], cond: (s) => s.justice.prison >= 2 || 'Peine trop courte.',
    run: () => ({ r: 'Ton avocat dépose la demande.', queue: 'prison_amenagement' }) },
  { id: 'tel_prison', tab: 'prison', prison: true, nom: 'Acheter un téléphone', desc: 'Interdit, 400 € au marché noir', icon: 'phone', cost: 400, days: [2, 8], cond: (s) => !s.flags.tel_prison || 'Tu as déjà un téléphone.',
    run: () => (Math.random() < 0.8 ? { fx: { telPrison: true, bonheur: 6 }, r: 'Un vieux smartphone caché dans une chaussette. Contact avec l’extérieur.' } : { fx: { prisonAdd: 1 }, r: 'Fouille. Téléphone confisqué et un an de plus.' }) },
  { id: 'evasion', tab: 'prison', prison: true, nom: 'Préparer une évasion', desc: 'Décision majeure', icon: 'key', days: [1, 3], hour: [22, 23],
    run: () => ({ r: 'Ton codétenu te glisse un plan à l’oreille.', queue: 'evasion_j1' }) },
];

export const ACT = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a]));
