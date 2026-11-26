// Carrières : niveaux [titre, salaire mensuel net]. apply:false = s'obtient via un événement ou une action spéciale.
import { METIER_REQUIS, SEUILS, SKILLS, NIVEAUX } from './skills.js';
export const DIPLOMES = ['aucun', 'brevet', 'cap', 'bac', 'bts', 'licence', 'master', 'doctorat'];
export const DIPLOME_NOM = {
  aucun: 'Aucun diplôme', brevet: 'Brevet', cap: 'CAP', bac: 'Bac', bts: 'BTS', licence: 'Licence', master: 'Master', doctorat: 'Doctorat',
};
export const dipRank = (d) => DIPLOMES.indexOf(d);

export const CAREERS = {
  livreur: { nom: 'Livreur', cat: 'classique', scene: 'rue', outfit: 'street', age: 16, diplome: 'aucun', promo: 0.18,
    niveaux: [['Livreur à vélo', 1100], ['Livreur en scooter', 1450], ["Chef d'équipe logistique", 1950]] },
  plonge: { nom: 'Restauration', cat: 'classique', scene: 'appart', outfit: 'casual', age: 16, diplome: 'aucun', promo: 0.2,
    niveaux: [['Plongeur', 980], ['Commis de cuisine', 1350], ['Cuisinier', 1800], ['Chef de cuisine', 2900]] },
  chantier: { nom: 'BTP', cat: 'classique', scene: 'chantier', outfit: 'ouvrier', age: 16, diplome: 'aucun', promo: 0.18,
    niveaux: [['Manœuvre', 1300], ['Maçon', 1750], ["Chef d'équipe", 2350], ['Conducteur de travaux', 3300]] },
  caissier: { nom: 'Commerce', cat: 'classique', scene: 'rue', outfit: 'casual', age: 16, diplome: 'aucun', papiers: true, promo: 0.15,
    niveaux: [['Employé libre-service', 1380], ['Caissier principal', 1520], ['Chef de rayon', 2050], ['Directeur de magasin', 3500]] },
  securite: { nom: 'Sécurité', cat: 'classique', scene: 'appart', outfit: 'chic', age: 18, diplome: 'aucun', papiers: true, casier: false, forme: 40, promo: 0.15,
    niveaux: [['Agent de sécurité', 1550], ['Chef de poste', 1950], ['Garde du corps', 3300]] },
  aide_soignant: { nom: 'Aide-soignant', cat: 'classique', scene: 'hopital', outfit: 'medical', age: 18, diplome: 'cap', papiers: true, promo: 0.12,
    niveaux: [['Aide-soignant', 1750], ['Aide-soignant référent', 2000]] },
  commercial: { nom: 'Vente', cat: 'classique', scene: 'bureau', outfit: 'chic', age: 18, diplome: 'bac', papiers: true, charisme: 40, promo: 0.18,
    niveaux: [['Commercial junior', 1900], ['Commercial', 2600], ['Directeur commercial', 5400]] },
  comptable: { nom: 'Comptabilité', cat: 'classique', scene: 'bureau', outfit: 'chic', age: 20, diplome: 'bts', papiers: true, promo: 0.14,
    niveaux: [['Assistant comptable', 1850], ['Comptable', 2600], ['Expert-comptable', 5200]] },
  developpeur: { nom: 'Développement', cat: 'classique', scene: 'bureau', outfit: 'casual', age: 20, diplome: 'bts', papiers: true, intel: 55, promo: 0.18,
    niveaux: [['Développeur junior', 2350], ['Développeur', 3300], ['Lead dev', 4700], ['CTO', 8500]] },
  infirmier: { nom: 'Infirmier', cat: 'classique', scene: 'hopital', outfit: 'medical', age: 21, diplome: 'licence', papiers: true, promo: 0.12,
    niveaux: [['Infirmier', 2150], ['Infirmier spécialisé', 2650], ['Cadre de santé', 3400]] },
  professeur: { nom: 'Enseignement', cat: 'classique', scene: 'ecole', outfit: 'casual', age: 23, diplome: 'master', papiers: true, promo: 0.1,
    niveaux: [['Professeur stagiaire', 1950], ['Professeur certifié', 2450], ['Professeur agrégé', 3400]] },
  avocat: { nom: 'Droit', cat: 'classique', scene: 'bureau', outfit: 'chic', age: 23, diplome: 'master', papiers: true, intel: 62, promo: 0.14,
    niveaux: [['Avocat collaborateur', 3100], ['Avocat associé', 8200], ['Ténor du barreau', 21000]] },
  medecin: { nom: 'Médecine', cat: 'classique', scene: 'hopital', outfit: 'medical', age: 26, diplome: 'doctorat', papiers: true, intel: 65, promo: 0.13,
    niveaux: [['Interne', 2300], ['Médecin', 5800], ['Chef de service', 9500]] },
  police: { nom: 'Police nationale', cat: 'police', scene: 'commissariat', outfit: 'police', age: 18, ageMax: 34, diplome: 'bac', nationalite: true, casier: false, forme: 40, promo: 0.16,
    niveaux: [['Gardien de la paix', 1950], ['Brigadier', 2350], ['Major', 2800], ['Lieutenant', 3150], ['Commandant', 3950], ['Commissaire', 5400]] },
  legion: { nom: 'Légion étrangère', cat: 'militaire', scene: 'caserne', outfit: 'militaire', age: 17, ageMax: 39, diplome: 'aucun', forme: 50, promo: 0.2,
    niveaux: [['Légionnaire', 1550], ['Caporal', 1950], ['Sergent', 2450], ['Adjudant', 3100]] },
  entrepreneur: { nom: 'Entrepreneur', cat: 'business', apply: false, scene: 'bureau', outfit: 'chic', promo: 0.05, stat: 'intel',
    niveaux: [['Fondateur de start-up', 1500], ['Patron de PME', 5000], ['Entrepreneur à succès', 14000], ['Fondateur de licorne', 45000]] },
  reseau: { nom: 'Réseau de stups', cat: 'crime', apply: false, scene: 'cite', outfit: 'street', promo: 0.001, stat: 'crime',
    risque: [0.05, 0.08, 0.12, 0.16, 0.2], motif: 'Trafic de stupéfiants',
    niveaux: [['Guetteur', 1500], ['Charbonneur', 3200], ['Gérant de point', 7500], ['Semi-grossiste', 15000], ['Baron', 38000]] },
  escroc: { nom: 'Escroquerie', cat: 'crime', apply: false, scene: 'appart', outfit: 'chic', promo: 0.06, stat: 'intel',
    risque: [0.06, 0.1, 0.14], motif: 'Escroquerie en bande organisée',
    niveaux: [['Arnaqueur au SMS', 1300], ['Escroc aux faux sites', 4500], ['Fraudeur à la TVA', 16000]] },
  rappeur: { nom: 'Rap', cat: 'artiste', apply: false, scene: 'studio', outfit: 'rap', fame: [0, 25, 50, 72, 90],
    niveaux: [['Rappeur underground', 250], ['Révélation de l’année', 2600], ['Disque d’or', 9000], ['Disque de platine', 30000], ['Légende du rap', 90000]] },
  acteur: { nom: 'Cinéma', cat: 'artiste', apply: false, scene: 'studio', outfit: 'chic', fame: [0, 30, 60, 85],
    niveaux: [['Figurant', 700], ['Second rôle', 3600], ['Tête d’affiche', 21000], ['Star de cinéma', 95000]] },
  artiste: { nom: 'Street-art', cat: 'artiste', apply: false, scene: 'cite', outfit: 'casual', fame: [0, 30, 60, 85],
    niveaux: [['Graffeur', 300], ['Street-artiste reconnu', 2600], ['Artiste exposé', 9500], ['Icône de l’art', 42000]] },
  influenceur: { nom: 'Réseaux sociaux', cat: 'artiste', apply: false, scene: 'appart', outfit: 'chic', fame: [0, 30, 60, 85],
    niveaux: [['Micro-influenceur', 450], ['Influenceur', 3200], ['Influenceur star', 19000], ['Créateur culte', 65000]] },
  politique: { nom: 'Politique', cat: 'politique', apply: false, scene: 'palais', outfit: 'chic', promo: 0.001,
    niveaux: [['Conseiller municipal', 1800], ['Maire', 4600], ['Député', 7300], ['Ministre', 10800], ['Premier ministre', 15000], ['Président de la République', 16000]] },
  dictateur: { nom: 'Régime', cat: 'politique', apply: false, scene: 'palais', outfit: 'militaire', promo: 0.001,
    niveaux: [['Chef de la junte', 80000], ['Dictateur', 250000], ['Guide suprême', 600000]] },
  foot: { nom: 'Football', cat: 'sport', apply: false, scene: 'stade', outfit: 'foot', promo: 0.16, stat: 'forme', retraite: [33, 37],
    niveaux: [['Centre de formation', 800], ['Pro en Ligue 2', 9500], ['Titulaire en Ligue 1', 48000], ['Star d’un top club européen', 420000], ['Ballon d’or', 1600000]] },
  basket: { nom: 'Basket', cat: 'sport', apply: false, scene: 'stade', outfit: 'basket', promo: 0.14, stat: 'forme', retraite: [33, 38],
    niveaux: [['Espoir de Pro B', 2600], ['Joueur de Betclic Élite', 12500], ['Joueur d’Euroleague', 62000], ['Joueur NBA', 950000]] },
  boxe: { nom: 'Boxe', cat: 'sport', apply: false, scene: 'stade', outfit: 'boxe', promo: 0.13, stat: 'forme', retraite: [34, 39],
    niveaux: [['Boxeur amateur', 300], ['Boxeur pro', 3200], ['Champion de France', 12500], ['Champion d’Europe', 42000], ['Champion du monde', 320000]] },
};

export const hasPapers = (s) => s.id.statut !== 'sans_papiers';
export const isFrench = (s) => s.id.statut === 'ne_france' || s.id.statut === 'naturalise';

// Renvoie true ou une raison (texte) expliquant pourquoi on ne peut pas postuler.
export function canApply(s, id) {
  const c = CAREERS[id];
  if (!c || c.apply === false) return 'Ce métier ne se trouve pas par candidature.';
  if (s.justice.prison > 0) return 'Impossible depuis la prison.';
  if (s.carriere?.id === id) return 'C’est déjà ton métier.';
  if (s.age < (c.age || 16)) return `Âge minimum : ${c.age} ans.`;
  if (c.ageMax && s.age > c.ageMax) return `Âge maximum : ${c.ageMax} ans.`;
  if (dipRank(s.etudes.niveau) < dipRank(c.diplome || 'aucun')) return `Diplôme requis : ${DIPLOME_NOM[c.diplome]}.`;
  if (c.papiers && !hasPapers(s)) return 'Il faut des papiers en règle.';
  if (c.nationalite && !isFrench(s)) return 'Réservé aux personnes de nationalité française.';
  if (c.casier === false && s.justice.casier.length) return 'Casier judiciaire non vierge.';
  if (c.forme && s.stats.forme < c.forme) return `Forme physique insuffisante (${c.forme} requis).`;
  if (c.intel && s.stats.intel < c.intel) return `Intelligence insuffisante (${c.intel} requis).`;
  if (c.charisme && s.stats.charisme < c.charisme) return `Charisme insuffisant (${c.charisme} requis).`;
  // v0.12 : compétences exigées (filière, formation continue ou expérience)
  for (const [k, n] of Object.entries(METIER_REQUIS[id] || {})) if ((s.comp?.[k] || 0) < SEUILS[n]) return `Compétence requise : ${SKILLS[k]} niveau « ${NIVEAUX[n].toLowerCase()} » (filière, formation ou expérience).`;
  if (['fac', 'bts', 'medecine', 'droit', 'master', 'lycee'].includes(s.etudes.cursus) && c.diplome !== 'aucun') return 'Termine d’abord tes études.';
  return true;
}
