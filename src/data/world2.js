// Données V3 : addictions, maladies, destins des amis, pays et situations, plages proches, métiers des parents.

export const ADDICTIONS = {
  tabac: { nom: 'Tabac', sante: 1 },
  alcool: { nom: 'Alcool', sante: 2 },
  cannabis: { nom: 'Cannabis', sante: 1 },
  coke: { nom: 'Cocaïne', sante: 4 },
  jeu: { nom: 'Jeux d’argent', sante: 0 },
};

// risk(s) : probabilité annuelle de développer la maladie. symp : symptômes visibles avant le diagnostic.
export const DISEASES = {
  poumon: { nom: 'Cancer du poumon', letal: true, symp: ['Toux persistante', 'Essoufflement', 'Crachats de sang'], risk: (s) => (s.age > 35 ? 0.002 + s.addic.tabac / 4000 + s.addic.cannabis / 9000 : 0) },
  cirrhose: { nom: 'Cirrhose du foie', letal: true, symp: ['Fatigue chronique', 'Teint jaunâtre', 'Ventre gonflé'], risk: (s) => (s.age > 30 ? s.addic.alcool / 3500 : 0) },
  coeur: { nom: 'Maladie cardiaque', letal: true, symp: ['Douleurs dans la poitrine', 'Palpitations', 'Malaises'], risk: (s) => (s.age > 40 ? 0.003 + s.addic.coke / 2500 + (s.stats.forme < 25 ? 0.006 : 0) : s.addic.coke / 5000) },
  cancer: { nom: 'Cancer', letal: true, symp: ['Perte de poids inexpliquée', 'Fatigue intense', 'Douleurs persistantes'], risk: (s) => (s.age > 45 ? 0.004 + (s.age - 45) / 6000 : 0.0004) },
  diabete: { nom: 'Diabète', letal: false, symp: ['Soif permanente', 'Vision floue', 'Fatigue'], risk: (s) => (s.age > 30 && s.stats.forme < 35 ? 0.006 : 0.001) },
  depression: { nom: 'Dépression', letal: false, symp: ['Insomnies', 'Perte d’envie', 'Isolement'], risk: (s) => (s.age > 13 && s.stats.bonheur < 30 ? 0.08 : 0.004) },
};

// Ce que deviennent les amis d'enfance : chacun peut rendre un service différent.
export const DESTINS = {
  avocat: { nom: 'avocat', w: 1, service: 'Te défendre et faire baisser les poursuites' },
  flic: { nom: 'policier', w: 1, service: 'Fermer les yeux sur ton dossier' },
  medecin: { nom: 'médecin', w: 1, service: 'Te soigner en priorité' },
  patron: { nom: 'chef d’entreprise', w: 1, service: 'T’embaucher dans sa boîte' },
  dealer: { nom: 'trafiquant', w: 1.2, service: 'Devenir ton fournisseur à prix d’ami' },
  artiste: { nom: 'rappeur', w: 0.8, service: 'Faire un featuring avec toi' },
  journaliste: { nom: 'journaliste', w: 0.7, service: 'Parler de toi dans les médias' },
  politique: { nom: 'élu', w: 0.5, service: 'Te soutenir en politique' },
  prof: { nom: 'professeur', w: 0.9, service: 'T’aider à étudier' },
  galere: { nom: 'dans la galère', w: 1.3, service: 'Rien… c’est plutôt lui qui a besoin de toi' },
};

// Métiers des parents (varie le début de partie).
export const PARENT_JOBS = {
  precaire: [['sans emploi', 'sans emploi'], ['agent d’entretien', 'agente d’entretien'], ['intérimaire', 'intérimaire'], ['vendeur sur les marchés', 'vendeuse sur les marchés']],
  modeste: [['chauffeur de bus', 'chauffeuse de bus'], ['aide-soignant', 'aide-soignante'], ['caissier', 'caissière'], ['maçon', 'femme de ménage'], ['livreur', 'livreuse'], ['cuisinier', 'cuisinière']],
  moyenne: [['professeur', 'professeure'], ['infirmier', 'infirmière'], ['technicien', 'technicienne'], ['policier', 'policière'], ['commercial', 'commerciale'], ['comptable', 'comptable']],
  aisee: [['médecin', 'médecin'], ['avocat', 'avocate'], ['ingénieur', 'ingénieure'], ['pharmacien', 'pharmacienne'], ['architecte', 'architecte'], ['cadre dans une banque', 'cadre dans une banque']],
  riche: [['chef d’entreprise', 'cheffe d’entreprise'], ['chirurgien', 'chirurgienne'], ['héritier d’un groupe hôtelier', 'héritière d’un groupe hôtelier'], ['promoteur immobilier', 'promotrice immobilière'], ['footballeur à la retraite', 'ancienne championne de tennis']],
};

// Plage la plus proche quand la ville n'est pas au bord de la mer.
export const PLAGE_PROCHE = {
  Paris: 'Deauville', Lyon: 'La Grande-Motte', Lille: 'Dunkerque', Toulouse: 'Biarritz', Bordeaux: 'Arcachon',
  Nantes: 'La Baule', Strasbourg: 'Le lac de Gérardmer', Rennes: 'Saint-Malo', Grenoble: 'Le lac d’Annecy',
};

// Pays du monde : la situation évolue chaque année et influence voyages, cavale et événements.
// fic : pays fictif (seuls ceux-ci peuvent basculer en guerre).
export const PAYS = {
  France: {}, Espagne: {}, Maroc: {}, Algérie: {}, Tunisie: {}, Portugal: {}, Grèce: {}, 'Émirats': {}, Indonésie: {}, Thaïlande: {},
  Brésil: {}, 'États-Unis': {}, Japon: {}, Belgique: {}, 'Royaume-Uni': {}, Canada: {}, Turquie: {}, Sénégal: {}, Mali: {},
  'Côte d’Ivoire': {}, Guinée: {}, Cameroun: {}, Congo: {}, 'RD Congo': {}, Gabon: {}, Guadeloupe: {}, Martinique: {},
  Vietnam: {}, Chine: {}, Cambodge: {}, Roumanie: {}, Pologne: {}, Ukraine: {}, Colombie: {}, Pérou: {},
  Zarkovie: { fic: true }, 'Valmorie': { fic: true },
};
export const SITUATIONS = {
  stable: { nom: 'Stable', danger: 0 },
  crise: { nom: 'Crise économique', danger: 0.05 },
  emeutes: { nom: 'Émeutes', danger: 0.15 },
  guerre: { nom: 'En guerre', danger: 0.4 },
};

// Villes où l'on peut s'expatrier.
export const EXPAT = [
  { ville: 'Londres', pays: 'Royaume-Uni', scene: 'appart', prix: 15000 },
  { ville: 'Montréal', pays: 'Canada', scene: 'appart', prix: 12000 },
  { ville: 'Lisbonne', pays: 'Portugal', scene: 'pays_portugal', prix: 6000 },
  { ville: 'Dubaï', pays: 'Émirats', scene: 'villa', prix: 40000 },
  { ville: 'New York', pays: 'États-Unis', scene: 'appart', prix: 30000 },
  { ville: 'Istanbul', pays: 'Turquie', scene: 'pays_turquie', prix: 5000 },
  { ville: 'Dakar', pays: 'Sénégal', scene: 'pays_afrique_ouest', prix: 4000 },
  { ville: 'Novagrad', pays: 'Zarkovie', scene: 'pays_europe_est', prix: 3000 },
];
