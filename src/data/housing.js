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
  ecole: 'École', stade: 'Stade', studio: 'Studio', prison: 'Centre pénitentiaire', pays: 'Quartier familial',
  pays_maghreb: 'Médina familiale', pays_afrique_ouest: 'Quartier natal', pays_afrique_centrale: 'Collines natales',
  pays_antilles: 'Cases créoles', pays_portugal: 'Quartier de Lisbonne', pays_turquie: 'Rives du Bosphore',
  pays_asie: 'Ruelle aux lanternes', pays_europe_est: 'Vieille ville', pays_amerique_latine: 'Quartier coloré',
  caserne: 'Caserne', casino: 'Casino', palais: 'Palais',
};

export const originScene = (origine) => ({
  maghreb: 'pays_maghreb',
  afrique_ouest: 'pays_afrique_ouest',
  afrique_centrale: 'pays_afrique_centrale',
  antilles: 'pays_antilles',
  portugal: 'pays_portugal',
  turquie: 'pays_turquie',
  asie: 'pays_asie',
  europe_est: 'pays_europe_est',
  amerique_latine: 'pays_amerique_latine',
}[origine] || 'pays_maghreb');
