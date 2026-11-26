// v0.12 « Compétences & Carrières » : catalogue data-driven des compétences, filières, employeurs.
// Les 11 statistiques générales restent ; les compétences expliquent pourquoi deux personnages
// de même intelligence n'ont pas les mêmes débouchés.

export const DOMAINES = {
  info: { nom: 'Informatique', skills: ['prog', 'cyber', 'ia'] },
  musique: { nom: 'Musique', skills: ['ecriture', 'interpretation', 'production'] },
  business: { nom: 'Business', skills: ['negociation', 'management', 'marketing'] },
  sport: { nom: 'Sport', skills: ['technique', 'endurance', 'mental'] },
  social: { nom: 'Social', skills: ['persuasion', 'leadership', 'eloquence'] },
  finance: { nom: 'Finance', skills: ['compta', 'invest', 'risque'] },
  metiers: { nom: 'Métiers', skills: ['soin', 'droit', 'manuel', 'pedagogie'] },
};
export const SKILLS = {
  prog: 'Programmation', cyber: 'Cybersécurité', ia: 'Intelligence artificielle',
  ecriture: 'Écriture', interpretation: 'Interprétation', production: 'Production',
  negociation: 'Négociation', management: 'Management', marketing: 'Marketing',
  technique: 'Technique sportive', endurance: 'Endurance', mental: 'Mental',
  persuasion: 'Persuasion', leadership: 'Leadership', eloquence: 'Éloquence',
  compta: 'Comptabilité', invest: 'Investissement', risque: 'Gestion du risque',
  soin: 'Soins', droit: 'Droit', manuel: 'Travail manuel', pedagogie: 'Pédagogie',
};
export const DOMAINE_DE = Object.fromEntries(Object.entries(DOMAINES).flatMap(([d, D]) => D.skills.map((k) => [k, d])));
// Expérience cumulée pour chaque niveau (0 à 5)
export const SEUILS = [0, 100, 250, 450, 700, 1000];
export const NIVEAUX = ['Aucun', 'Notions', 'Compétent', 'Confirmé', 'Expert', 'Maître'];
export const CAP_AN = 160; // expérience maximale par compétence et par an : pas de progression infinie par répétition
export const FORMATION = { prix: 1500, xp: 90 };

// Filières des études supérieures (licence, BTS, master) : ce qu'une année apporte
export const FILIERES = {
  info: { nom: 'Informatique', xp: { prog: 90, cyber: 35, ia: 35 }, metier: 'developpeur' },
  gestion: { nom: 'Finance et comptabilité', xp: { compta: 90, invest: 40, risque: 30 }, metier: 'comptable' },
  commerce: { nom: 'Commerce et marketing', xp: { negociation: 60, marketing: 60, persuasion: 40 }, metier: 'commercial' },
  sante: { nom: 'Santé', xp: { soin: 90 }, metier: 'infirmier' },
  education: { nom: 'Sciences de l’éducation', xp: { pedagogie: 90, eloquence: 30 }, metier: 'professeur' },
  droit: { nom: 'Droit', xp: { droit: 90, eloquence: 35 }, metier: 'avocat' },
  art: { nom: 'Arts et musique', xp: { ecriture: 50, interpretation: 50, production: 50 }, metier: null },
  sport: { nom: 'Sport (STAPS)', xp: { technique: 50, endurance: 50, pedagogie: 30, mental: 30 }, metier: null },
};
// Cursus déjà spécialisés
export const CURSUS_XP = {
  medecine: { soin: 95 }, droit: { droit: 90, eloquence: 40 }, cap: { manuel: 90 }, lycee: { eloquence: 10 }, daeu: { eloquence: 15 },
};

// Ce que chaque métier fait progresser chaque année (et ce qui compte pour y monter)
export const METIER_XP = {
  livreur: { endurance: 25, manuel: 15 }, plonge: { manuel: 35 }, chantier: { manuel: 55, endurance: 20 },
  caissier: { compta: 20, persuasion: 20 }, securite: { endurance: 20, mental: 30 }, aide_soignant: { soin: 55 },
  commercial: { negociation: 50, persuasion: 40, marketing: 20 }, comptable: { compta: 65, risque: 20, invest: 15 },
  developpeur: { prog: 65, cyber: 25, ia: 25 }, infirmier: { soin: 65 }, professeur: { pedagogie: 65, eloquence: 30 },
  avocat: { droit: 65, eloquence: 45, negociation: 25 }, medecin: { soin: 75 }, police: { mental: 35, droit: 25, endurance: 25 },
  legion: { endurance: 45, mental: 45 }, entrepreneur: { management: 50, negociation: 35, marketing: 35, compta: 20 },
  reseau: { negociation: 30, risque: 35, management: 20 }, escroc: { persuasion: 50, cyber: 25, risque: 25 },
  rappeur: { ecriture: 50, interpretation: 40, production: 25 }, acteur: { interpretation: 55, eloquence: 30 },
  artiste: { marketing: 20 }, influenceur: { marketing: 55, eloquence: 30 }, politique: { eloquence: 50, leadership: 50, negociation: 25 },
  dictateur: { leadership: 55, risque: 25 }, foot: { technique: 55, endurance: 45, mental: 35 }, basket: { technique: 55, endurance: 45, mental: 35 },
  boxe: { technique: 55, endurance: 45, mental: 40 },
};
// Compétences exigées à l'embauche (niveau minimum). Chaque exigence s'obtient par une filière, une formation ou l'expérience.
export const METIER_REQUIS = {
  developpeur: { prog: 1 }, comptable: { compta: 1 }, infirmier: { soin: 2 }, professeur: { pedagogie: 1 }, avocat: { droit: 2 }, medecin: { soin: 3 },
};

// Activités : ce qu'elles font progresser
export const ACT_XP = {
  etudier: { eloquence: 10, compta: 8 }, musique: { ecriture: 30, interpretation: 25 }, groupe: { interpretation: 30, ecriture: 10 },
  son: { production: 35, ecriture: 25 }, clip: { production: 25, marketing: 20 }, video: { marketing: 35, eloquence: 15 },
  sport: { endurance: 25, technique: 10 }, courir: { endurance: 25, mental: 10 }, meditation: { mental: 35 }, jouer: { technique: 10 },
  soiree: { persuasion: 15 }, amis: { persuasion: 10, eloquence: 10 }, benevolat: { soin: 20, pedagogie: 15, leadership: 15 },
  casino: { risque: 20 }, paris: { risque: 15 }, politique: { eloquence: 35, leadership: 25 }, essais_pro: { technique: 30, mental: 15 },
  deal: { negociation: 20, risque: 15 }, negocier: { negociation: 30 }, braquage: { risque: 30 }, bosser: { management: 10 },
  lire_prison: { droit: 25 }, atelier_prison: { manuel: 35 }, muscu_prison: { endurance: 25 }, foot_prison: { technique: 20 },
};
export const TALENT_XP = {
  musique: { ecriture: 80, interpretation: 60 }, football: { technique: 80 }, basket: { technique: 80 }, boxe: { technique: 70, mental: 30 },
  comedie: { interpretation: 80, eloquence: 30 }, tech: { prog: 90 }, business: { negociation: 80, marketing: 30 },
};

// Employeurs (nom|taille). Tailles : pme, groupe, startup, public
export const EMPLOYEURS = {
  livreur: ['Rapido Express|pme', 'Colis Flash|groupe', 'Pizzeria Bella|pme'],
  plonge: ['Brasserie du Port|pme', 'Le Petit Zinc|pme', 'Grill Gourmet|groupe'],
  chantier: ['Bâti Sud|pme', 'Constructions Morel|groupe', 'Rénov Habitat|pme'],
  caissier: ['Supermarché Primo|groupe', 'Hyper Azur|groupe', 'Épicerie du Marché|pme'],
  securite: ['Garde Plus|pme', 'Vigilis|groupe', 'Protecta|pme'],
  aide_soignant: ['EHPAD Les Glycines|pme', 'Clinique Saint-Roch|groupe', 'Hôpital public|public'],
  commercial: ['Distri Plus|groupe', 'Optima Télécom|groupe', 'Maison Verdier|pme', 'Vendr (start-up)|startup'],
  comptable: ['Cabinet Martin & Associés|pme', 'Groupe Lumen|groupe', 'Expertise Sud|pme'],
  developpeur: ['Nébula Soft|pme', 'Pixel Forge|startup', 'DSI de la Banque Hexa|groupe', 'Kodo|startup'],
  infirmier: ['CHU de la ville|public', 'Clinique Saint-Roch|groupe', 'Cabinet libéral partagé|pme'],
  professeur: ['Collège Jean-Moulin|public', 'Lycée Victor-Hugo|public', 'Lycée professionnel Curie|public'],
  avocat: ['Cabinet Delmas|pme', 'Lefort Avocats|groupe', 'Collaboration au barreau|pme'],
  medecin: ['CHU de la ville|public', 'Clinique des Lilas|groupe', 'Cabinet de quartier|pme'],
  police: ['Commissariat central|public'],
  legion: ['2e régiment étranger|public'],
};
export const TAILLES = {
  pme: { nom: 'PME', mult: 1, promo: 1, licenc: 1 },
  groupe: { nom: 'Grand groupe', mult: 1.08, promo: 0.85, licenc: 0.7 },
  startup: { nom: 'Start-up', mult: 0.92, promo: 1.3, licenc: 1.7 },
  public: { nom: 'Secteur public', mult: 0.97, promo: 0.8, licenc: 0.1 },
};
export const CULTURES = {
  exigeante: { nom: 'Culture exigeante', perf: 1.15, bonheur: -1 },
  detendue: { nom: 'Ambiance détendue', perf: 0.9, bonheur: 1 },
  familiale: { nom: 'Esprit familial', perf: 1, bonheur: 1 },
};
export const VOIES = {
  expert: { nom: 'Expert', desc: 'Tu deviens la référence technique. Salaire +6 %, promotions selon tes compétences.' },
  manager: { nom: 'Manager', desc: 'Tu encadres une équipe. Salaire +12 %, plus de stress, le management compte.' },
  freelance: { nom: 'Indépendant', desc: 'À ton compte : revenus variables selon tes compétences, plus de patron.' },
};
