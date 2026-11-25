// Ce qui se débloque en grandissant : onglets du menu, téléphone, énergie (nombre d'actions par an).
export const TAB_AGE = { vie: 0, rel: 0, act: 3, pro: 3, crime: 12, biens: 16, phone: 11 };

export const energieMax = (age) => (age < 3 ? 0 : age < 6 ? 1 : age < 12 ? 2 : age < 16 ? 3 : age < 65 ? 4 : age < 80 ? 3 : 2);

export const UNLOCKS = [
  { age: 3, key: 'act', txt: 'Activités débloquées : joue, bouge, découvre le monde (1 action par an).' },
  { age: 3, key: 'pro', txt: 'Onglet École : suis ta scolarité.' },
  { age: 6, txt: '+1 énergie : 2 actions par an.' },
  { age: 11, key: 'phone', txt: 'Ton premier téléphone ! Messages, contacts et actus.' },
  { age: 12, key: 'crime', txt: 'Onglet Crime débloqué… à tes risques.' },
  { age: 12, txt: '+1 énergie, argent de poche et Instapic.' },
  { age: 16, key: 'pro', txt: 'Carrière : tu peux chercher un petit boulot ou une formation.' },
  { age: 16, key: 'biens', txt: 'Onglet Biens : budget, achats et entreprises.' },
  { age: 16, txt: '+1 énergie : 4 actions par an.' },
  { age: 18, txt: 'Majorité : appartement, prêts, business, impôts.' },
  { age: 65, txt: 'L’âge se fait sentir : 3 actions par an.' },
  { age: 80, txt: 'Grand âge : 2 actions par an.' },
];
