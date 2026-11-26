// v0.10 : ambitions de vie. Elles sont propres à une vie (≠ les défis persistants), facultatives,
// et une vie ordinaire peut les réussir : aucune n'exige fortune ou célébrité, sauf celles qui le disent.
import { dipRank } from './careers.js';

const vivants = (s, ...liens) => s.relations.filter((r) => r.vivant && liens.includes(r.lien));
const maxAddic = (s) => Math.max(0, ...Object.values(s.addic || {}));
const depuis = (s, a, k) => (s.cpt?.[k] || 0) - (a.base || 0);

// prop : peut être proposée maintenant · ok : accomplie · prog : texte d'avancement · traits : traits du joueur qui la rendent plus probable
// cible : personne visée (l'ambition devient impossible si elle meurt, sans pénalité)
export const AMBITIONS = {
  proprio: { nom: 'Devenir propriétaire', age: [18, 75], prop: (s) => !s.proprio, ok: (s) => s.proprio, aide: 'Achète un logement depuis l’onglet Biens.', traits: ['ambitieux', 'mefiant'] },
  mariage: { nom: 'Se marier', age: [18, 70], prop: (s) => !vivants(s, 'conjoint').length, ok: (s) => vivants(s, 'conjoint').length > 0, aide: 'Fais des rencontres, puis demande ta moitié en mariage.', traits: ['loyal', 'genereux'] },
  famille: { nom: 'Fonder une famille', age: [20, 48], prop: (s) => !s.relations.some((r) => r.lien === 'enfant'), ok: (s) => vivants(s, 'enfant').length > 0, aide: 'Un enfant, avec la bonne personne.', traits: ['loyal', 'genereux', 'calme'] },
  bac: { nom: 'Décrocher le bac', age: [13, 35], prop: (s) => dipRank(s.etudes.niveau) < dipRank('bac'), ok: (s) => dipRank(s.etudes.niveau) >= dipRank('bac'), aide: 'Va au bout du lycée, ou passe le DAEU à l’âge adulte.', traits: ['malin', 'calme'] },
  diplome: { nom: 'Obtenir un diplôme du supérieur', age: [16, 45], prop: (s) => dipRank(s.etudes.niveau) < dipRank('bts'), ok: (s) => dipRank(s.etudes.niveau) >= dipRank('bts'), aide: 'BTS, licence ou plus : onglet Carrière.', traits: ['malin', 'ambitieux'] },
  carriere: { nom: 'Monter en grade', age: [18, 58], prop: (s) => (s.carriere?.niveau ?? 0) < 2, ok: (s) => (s.carriere?.niveau ?? 0) >= 2, aide: 'Travaille dur : la performance fait monter.', traits: ['ambitieux', 'courageux'] },
  forme: { nom: 'Être en pleine forme', age: [14, 70], prop: (s) => s.stats.forme < 65, ok: (s) => s.stats.forme >= 75, prog: (s) => `Forme ${s.stats.forme}/75`, aide: 'Le sport, chaque année.', traits: ['courageux', 'impulsif'] },
  epargne: { nom: 'Mettre 50 000 € de côté', age: [18, 70], prop: (s) => s.money < 30000, ok: (s) => s.money >= 50000, prog: (s) => `${Math.max(0, Math.round(s.money / 1000))} k€ / 50 k€`, aide: 'Dépense moins que tu ne gagnes.', traits: ['mefiant', 'calme'] },
  entreprise: { nom: 'Créer son entreprise', age: [18, 65], prop: (s) => !s.business.length, ok: (s) => s.business.length > 0, aide: 'Onglet Biens : ouvre un business.', traits: ['ambitieux', 'malin', 'courageux'] },
  voyager: { nom: 'Voir du pays', age: [16, 80], base: (s) => s.cpt?.voyages || 0, prop: () => true, ok: (s, a) => depuis(s, a, 'voyages') >= 3, prog: (s, a) => `${Math.min(3, depuis(s, a, 'voyages'))}/3 voyages`, aide: 'Pars en voyage trois fois.', traits: ['impulsif', 'courageux'] },
  aider: { nom: 'Prendre soin des siens', age: [16, 90], base: (s) => s.cpt?.aide || 0, prop: (s) => vivants(s, 'mere', 'pere', 'fratrie', 'enfant', 'grandparent', 'petitenfant').length > 0, ok: (s, a) => depuis(s, a, 'aide') >= 3, prog: (s, a) => `${Math.min(3, depuis(s, a, 'aide'))}/3 attentions`, aide: 'Offre des cadeaux à ta famille.', traits: ['genereux', 'loyal'] },
  heureux: { nom: 'Être heureux, tout simplement', age: [12, 95], prop: (s) => s.stats.bonheur < 80, ok: (s, a) => (a.n || 0) >= 3, prog: (s, a) => `${a.n || 0}/3 années heureuses d’affilée`, aide: 'Trois anniversaires de suite avec un bonheur d’au moins 75.', traits: ['calme', 'genereux', 'flemmard'] },
  ami: { nom: 'Un ami pour la vie', age: [12, 80], prop: (s) => vivants(s, 'ami').length > 0, ok: (s) => vivants(s, 'ami').some((r) => r.rel >= 85 && s.age - (r.depuis ?? s.age) >= 10), aide: 'Une amitié forte (85+) depuis au moins 10 ans.', traits: ['loyal', 'charismatique'] },
  renouer: {
    nom: (s, a) => `Renouer avec ${s.relations.find((r) => r.id === a.cible)?.prenom || 'un proche'}`, age: [14, 90],
    cible: (s) => vivants(s, 'mere', 'pere', 'fratrie', 'enfant').filter((r) => r.rel < 40).sort((x, y) => x.rel - y.rel)[0] || null,
    prop: () => true, ok: (s, a) => (s.relations.find((r) => r.id === a.cible)?.rel ?? 0) >= 70,
    prog: (s, a) => `Affection ${s.relations.find((r) => r.id === a.cible)?.rel ?? 0}/70`, aide: 'Passe du temps ensemble, excuse-toi si besoin.', traits: ['loyal', 'calme'],
  },
  sobre: { nom: 'Décrocher de mes addictions', age: [14, 90], prop: (s) => maxAddic(s) >= 40, ok: (s) => maxAddic(s) < 15, aide: 'Une cure, puis tenir bon.', traits: ['courageux', 'calme'] },
  rachat: { nom: 'Me racheter une conduite', age: [16, 90], base: (s) => s.justice.casier.length, prop: (s) => s.justice.casier.length > 0, ok: (s, a) => s.justice.casier.length === a.base && s.age - a.deb >= 5 && s.stats.karma >= 55, prog: (s, a) => `${Math.min(5, s.age - a.deb)}/5 ans sans histoire`, aide: 'Cinq ans sans nouvelle condamnation et un bon karma.', traits: ['loyal', 'calme'] },
  celebre: { nom: 'Devenir célèbre', age: [14, 60], prop: (s) => s.stats.notoriete < 40, ok: (s) => s.stats.notoriete >= 60, prog: (s) => `Notoriété ${s.stats.notoriete}/60`, aide: 'Musique, sport, réseaux ou politique.', traits: ['charismatique', 'impulsif'] },
  toit: { nom: 'Retrouver un toit', age: [12, 95], prop: (s) => s.logement === 'rue', ok: (s) => s.logement !== 'rue', aide: 'Un travail, puis un logement.', traits: [] },
  retraite: { nom: 'Une retraite paisible', age: [52, 66], prop: () => true, ok: (s) => s.age >= 65 && s.money >= 20000 && s.stats.sante >= 50 && s.justice.prison === 0, aide: 'Arriver à 65 ans en bonne santé, libre, avec 20 000 € de côté.', traits: ['calme', 'mefiant'] },
  descendance: { nom: 'Connaître mes petits-enfants', age: [42, 90], prop: (s) => vivants(s, 'enfant').some((r) => r.age >= 18) && !s.relations.some((r) => r.lien === 'petitenfant'), ok: (s) => vivants(s, 'petitenfant').length > 0, aide: 'Tes enfants décident… mais une bonne relation aide.', traits: ['loyal', 'genereux'] },
};

// Âges où le jeu te demande ce que tu veux faire de ta vie (tu peux aussi choisir à tout moment dans ta fiche)
export const AGES_AMBITION = [14, 18, 25, 35, 50, 62];
export const MAX_AMBITIONS = 3;
