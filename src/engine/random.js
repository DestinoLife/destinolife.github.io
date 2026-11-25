import { pick, chance } from './rng.js';
import { ORIGINES, VILLES, MILIEUX, TRAITS, TALENTS, nameFor, surnameFor } from '../data/identity.js';
import { randomLook, baseLook } from '../data/look.js';

// Configuration de personnage aléatoire (utilisée par « Vie aléatoire » et le bouton dé du créateur).
export function randomConfig() {
  const genre = pick(['h', 'f']);
  const origine = pick(Object.keys(ORIGINES));
  const o = ORIGINES[origine];
  const statut = origine === 'france' || o.francais ? 'ne_france' : pick(['ne_france', 'ne_france', 'ne_france', 'titre', 'sans_papiers']);
  return {
    prenom: nameFor(origine, genre),
    nom: surnameFor(origine),
    genre,
    attirance: chance(0.1) ? (genre === 'f' ? 'f' : 'h') : chance(0.05) ? 'hf' : genre === 'f' ? 'h' : 'f',
    origine,
    pays: pick(o.pays),
    statut,
    ville: pick(VILLES),
    milieu: pick(['precaire', 'modeste', 'modeste', 'moyenne', 'moyenne', 'aisee', 'riche']),
    look: randomLook(genre, origine),
    traits: Object.keys(TRAITS).sort(() => Math.random() - 0.5).slice(0, 2),
    talent: pick(Object.keys(TALENTS)),
  };
}

// Personnage vierge : seul le genre est choisi, tout le reste est neutre et se personnalise ensuite
export function baseConfig(genre) {
  return {
    prenom: nameFor('france', genre), nom: surnameFor('france'), genre, attirance: genre === 'f' ? 'h' : 'f',
    origine: 'france', pays: ORIGINES.france.pays[0], statut: 'ne_france', ville: 'Paris', milieu: 'moyenne',
    look: baseLook(genre), traits: [], talent: null,
  };
}

export { MILIEUX };
