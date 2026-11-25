// Logements : loyer annuel, prix d'achat, revenu mensuel minimum pour louer, scène affichée.
export const HOUSING = {
  rue: { nom: 'La rue', scene: 'rue', loyer: 0, vie: 1200 },
  bidonville: { nom: 'Campement', scene: 'bidonville', loyer: 0, vie: 2500 },
  foyer: { nom: "Foyer d'hébergement", scene: 'cite', loyer: 600, vie: 4000 },
  pays: { nom: 'Chez la famille au pays', scene: 'pays', loyer: 0, vie: 2500 },
  hlm: { nom: 'HLM en cité', scene: 'cite', loyer: 5200, vie: 7000, revenu: 0 },
  appart: { nom: 'Appartement en centre-ville', scene: 'appart', loyer: 11400, vie: 8500, revenu: 2300 },
  maison: { nom: 'Maison avec jardin', scene: 'maison', loyer: 17500, achat: 290000, entretien: 3500, vie: 9500, revenu: 3800 },
  villa: { nom: 'Villa avec piscine', scene: 'villa', achat: 1650000, entretien: 42000, vie: 25000 },
};

export const SCENE_NOM = {
  rue: 'Rue', cite: 'Cité des Rosiers', bidonville: 'Campement', appart: 'Centre-ville', maison: 'Quartier pavillonnaire',
  villa: 'Villa', plage: 'Plage', bureau: 'Bureau', chantier: 'Chantier', commissariat: 'Commissariat', hopital: 'Hôpital',
  ecole: 'École', stade: 'Stade', studio: 'Studio', prison: 'Centre pénitentiaire', pays: 'Quartier familial', caserne: 'Caserne',
};
