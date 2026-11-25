// Données « open world business » : biens, entreprises, contacts, destinations, réseau.

// ---------- Biens (la valeur évolue chaque année : tendance + volatilité) ----------
export const ASSETS = {
  citadine: { cat: 'Voiture', nom: 'Citadine d’occasion', prix: 6500, tend: -0.12, vol: 0.03, car: { c: '#c9ccd6', type: 'citadine' } },
  compacte: { cat: 'Voiture', nom: 'Compacte sportive', prix: 34000, tend: -0.1, vol: 0.04, car: { c: '#1f4fd1', type: 'compacte' } },
  suv: { cat: 'Voiture', nom: 'SUV allemand noir', prix: 72000, tend: -0.09, vol: 0.04, car: { c: '#15171d', type: 'suv' } },
  sportive: { cat: 'Voiture', nom: 'Sportive italienne', prix: 260000, tend: -0.02, vol: 0.08, car: { c: '#d7263d', type: 'sport' } },
  collection: { cat: 'Voiture', nom: 'Voiture de collection 1967', prix: 185000, tend: 0.06, vol: 0.1, car: { c: '#e8d9a8', type: 'collection' } },
  chaine: { cat: 'Bijou', nom: 'Chaîne en or massif', prix: 4500, tend: 0.04, vol: 0.05 },
  montre: { cat: 'Bijou', nom: 'Montre suisse de luxe', prix: 48000, tend: 0.05, vol: 0.07 },
  collier: { cat: 'Bijou', nom: 'Collier de diamants', prix: 130000, tend: 0.03, vol: 0.08 },
  graff: { cat: 'Art', nom: 'Toile d’un street-artiste', prix: 9000, tend: 0.07, vol: 0.35 },
  sculpture: { cat: 'Art', nom: 'Sculpture contemporaine', prix: 90000, tend: 0.05, vol: 0.2 },
  tableau: { cat: 'Art', nom: 'Tableau de maître', prix: 650000, tend: 0.05, vol: 0.12 },
  nft: { cat: 'Art', nom: 'Œuvre numérique (NFT)', prix: 20000, tend: -0.06, vol: 0.6 },
};

// ---------- Entreprises ----------
// base : chiffre d'affaires annuel de départ, marge : part qui reste en bénéfice, lav : blanchiment max par an.
export const BUSINESS = {
  resto: { nom: 'Restaurant', prix: 90000, base: 210000, mb: 0.45, fixe: 70000, marge: 0.12, lav: 70000, emp: 6, scene: 'appart', desc: 'Idéal pour blanchir' },
  vetements: { nom: 'Magasin de vêtements', prix: 70000, base: 170000, mb: 0.5, fixe: 60000, marge: 0.16, lav: 50000, emp: 4, scene: 'appart', desc: 'Ta propre marque streetwear' },
  garage: { nom: 'Garage automobile', prix: 60000, base: 150000, mb: 0.5, fixe: 53000, marge: 0.15, lav: 60000, emp: 4, scene: 'chantier', desc: 'Revente de voitures, pièces' },
  salle: { nom: 'Salle de sport', prix: 120000, base: 190000, mb: 0.6, fixe: 84000, marge: 0.2, lav: 40000, emp: 5, scene: 'stade', desc: 'Abonnements récurrents' },
  kebab: { nom: 'Snack / kebab', prix: 35000, base: 110000, mb: 0.5, fixe: 41000, marge: 0.14, lav: 45000, emp: 3, scene: 'rue', desc: 'Cash, beaucoup de cash' },
  label: { nom: 'Label de musique', prix: 150000, base: 140000, mb: 0.62, fixe: 62000, marge: 0.25, lav: 30000, emp: 5, scene: 'studio', desc: 'Signe des artistes', cond: (s) => s.carriere?.id === 'rappeur' || s.stats.notoriete >= 50 || 'Il faut être connu dans la musique.' },
  startup: { nom: 'Start-up tech', prix: 30000, base: 0, marge: 0, lav: 25000, emp: 3, scene: 'bureau', desc: 'Utilisateurs, levées de fonds, licorne ?', startup: true },
};

// ---------- Contacts (relations « pro ») ----------
export const ROLES = {
  fournisseur: { nom: 'Fournisseur', desc: 'Approvisionne ton réseau', crime: true },
  receleur: { nom: 'Receleur', desc: 'Rachète ce que tu voles' },
  ferrailleur: { nom: 'Ferrailleur', desc: 'Revend les voitures en pièces' },
  avocat: { nom: 'Avocat pénaliste', desc: 'Te défend au tribunal' },
  faussaire: { nom: 'Faussaire', desc: 'Faux papiers, faux passeports', crime: true },
  garde: { nom: 'Garde du corps', desc: 'Ta sécurité personnelle' },
  producteur: { nom: 'Producteur', desc: 'Beats, clips, plans médias' },
  banquier: { nom: 'Banquier offshore', desc: 'Blanchiment à grande échelle', crime: true },
};

// ---------- Destinations (voyages et cavale) ----------
// secu : risque d'extradition par an en cavale (bas = sûr). scene : décor affiché.
export const DESTS = [
  { id: 'pays', ville: null, scene: 'pays', prix: 700, secu: 0.12, vibe: 'Famille, soleil, souvenirs' },
  { id: 'barcelone', ville: 'Barcelone', pays: 'Espagne', scene: 'appart', prix: 600, secu: 0.55, vibe: 'Tapas, plage, fête' },
  { id: 'marrakech', ville: 'Marrakech', pays: 'Maroc', scene: 'pays', prix: 900, secu: 0.15, vibe: 'Riads, souks, piscine' },
  { id: 'mykonos', ville: 'Mykonos', pays: 'Grèce', scene: 'plage', prix: 3200, secu: 0.45, vibe: 'Beach clubs, yachts' },
  { id: 'dubai', ville: 'Dubaï', pays: 'Émirats', scene: 'villa', prix: 4800, secu: 0.05, vibe: 'Luxe, tours, pas d’extradition facile' },
  { id: 'bali', ville: 'Bali', pays: 'Indonésie', scene: 'plage', prix: 2800, secu: 0.14, vibe: 'Surf, temples, villas' },
  { id: 'phuket', ville: 'Phuket', pays: 'Thaïlande', scene: 'plage', prix: 2300, secu: 0.18, vibe: 'Îles, fêtes, vie pas chère' },
  { id: 'rio', ville: 'Rio de Janeiro', pays: 'Brésil', scene: 'plage', prix: 2600, secu: 0.12, vibe: 'Copacabana, favelas, samba' },
  { id: 'newyork', ville: 'New York', pays: 'États-Unis', scene: 'appart', prix: 3600, secu: 0.4, vibe: 'Times Square, rooftops' },
  { id: 'tokyo', ville: 'Tokyo', pays: 'Japon', scene: 'appart', prix: 4200, secu: 0.35, vibe: 'Néons, ramen, mangas' },
  { id: 'bruxelles', ville: 'Bruxelles', pays: 'Belgique', scene: 'appart', prix: 250, secu: 0.65, vibe: 'Tout près, trop près' },
];

// ---------- Réseau (trafic géré comme un business) ----------
export const MISSIONS = [
  { id: 'point', nom: 'Ouvrir un nouveau point', desc: 'Plus de vente, beaucoup plus de chaleur', cout: 25000, p: 0.6 },
  { id: 'dette', nom: 'Récupérer une dette', desc: 'Un client doit 8 000 €', cout: 0, p: 0.6 },
  { id: 'rival', nom: 'Intimider un réseau rival', desc: 'Récupérer leur territoire', cout: 5000, p: 0.45 },
  { id: 'flic', nom: 'Corrompre un policier', desc: 'Baisse la chaleur', cout: 20000, p: 0.55 },
  { id: 'go_fast', nom: 'Organiser un go-fast', desc: 'Gros stock depuis l’Espagne · prison si ça rate', cout: 30000, p: 0.5 },
];
