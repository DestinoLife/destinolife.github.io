// v0.10 « Relations & Dynasties » : données des PNJ autonomes.

// Traits de personnalité : ils pondèrent ce que les proches font seuls et comment ils réagissent à toi.
export const PNJ_TRAITS = {
  ambitieux: { nom: ['Ambitieux', 'Ambitieuse'], riche: 2, job: 1.5 },
  fidele: { nom: ['Fidèle', 'Fidèle'], divorce: 0.4, rembourse: 1.6 },
  jaloux: { nom: ['Jaloux', 'Jalouse'], divorce: 1.8, jal: 2.5 },
  genereux: { nom: ['Généreux', 'Généreuse'], aide: 1.6, rembourse: 1.3 },
  rancunier: { nom: ['Rancunier', 'Rancunière'], ranc: 0.3 },
  casanier: { nom: ['Casanier', 'Casanière'], couple: 0.7, bouge: 0.3 },
  aventurier: { nom: ['Aventurier', 'Aventurière'], couple: 1.2, bouge: 3, job: 1.4 },
  fetard: { nom: ['Fêtard', 'Fêtarde'], couple: 1.3, pauvre: 1.6, rembourse: 0.6 },
  serieux: { nom: ['Sérieux', 'Sérieuse'], job: 0.6, pauvre: 0.5, rembourse: 1.4 },
  chaleureux: { nom: ['Chaleureux', 'Chaleureuse'], adm: 1.5, ranc: 1.5 },
};

// Niveau de vie d'un PNJ (0 à 4)
export const FORTUNE = ['Fauché', 'Modeste', 'À l’aise', 'Aisé', 'Riche'];
export const FORTUNE_F = ['Fauchée', 'Modeste', 'À l’aise', 'Aisée', 'Riche'];
export const MILIEU_FORTUNE = { precaire: 0, modeste: 1, moyenne: 2, aisee: 3, riche: 4 };

// Métiers des proches (hors amis, qui ont déjà leur « destin ») : [masculin, féminin, niveau de vie typique]
export const PNJ_JOBS = [
  ['livreur', 'livreuse', 1], ['caissier', 'caissière', 1], ['maçon', 'maçonne', 1], ['serveur', 'serveuse', 1],
  ['aide-soignant', 'aide-soignante', 1], ['chauffeur', 'chauffeuse', 1], ['vendeur', 'vendeuse', 1],
  ['électricien', 'électricienne', 2], ['infirmier', 'infirmière', 2], ['commercial', 'commerciale', 2], ['comptable', 'comptable', 2],
  ['professeur', 'professeure', 2], ['policier', 'policière', 2], ['technicien', 'technicienne', 2], ['boulanger', 'boulangère', 2],
  ['ingénieur', 'ingénieure', 3], ['développeur', 'développeuse', 3], ['pharmacien', 'pharmacienne', 3], ['architecte', 'architecte', 3],
  ['avocat', 'avocate', 3], ['médecin', 'médecin', 4], ['chef d’entreprise', 'cheffe d’entreprise', 4], ['pilote de ligne', 'pilote de ligne', 4],
];

// Liens familiaux élargis (v0.10), en plus de ceux de core.js
export const LIENS_V10 = {
  grandparent: ['Grand-père', 'Grand-mère'], oncle: ['Oncle', 'Tante'], cousin: ['Cousin', 'Cousine'],
  petitenfant: ['Petit-fils', 'Petite-fille'], neveu: ['Neveu', 'Nièce'],
};

// Liens qui ont une vie autonome (couple, enfants, métier)
export const AUTONOMES = ['ami', 'fratrie', 'enfant', 'cousin', 'oncle', 'neveu', 'petitenfant', 'ex'];
// Liens de la famille (pour l'arbre et la réputation familiale)
export const FAMILLE = ['mere', 'pere', 'fratrie', 'enfant', 'grandparent', 'oncle', 'cousin', 'petitenfant', 'neveu', 'conjoint'];
