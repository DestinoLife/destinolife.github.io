// Défis & Succès (persistants entre les vies dans localStorage).
import { patrimoine } from '../engine/economy.js';
import { childrenOf } from '../engine/core.js';

export const ACHIEVEMENTS = [
  // Vie
  { id: 'premiers_pas', cat: 'Vie', pts: 10, nom: 'Premiers pas', desc: 'Atteindre l’âge de 5 ans.', test: (s) => s.age >= 5 },
  { id: 'majeur', cat: 'Vie', pts: 15, nom: 'Majeur et vacciné', desc: 'Fêter tes 18 ans.', test: (s) => s.age >= 18 },
  { id: 'centenaire', cat: 'Vie', pts: 50, nom: 'Centenaire', desc: 'Atteindre 100 ans.', test: (s) => s.age >= 100 },
  { id: 'dynastie', cat: 'Vie', pts: 25, nom: 'Dynastie', desc: 'Continuer la partie avec un enfant (génération 2+).', test: (s) => s.gen >= 2 },
  { id: 'famille_nombreuse', cat: 'Vie', pts: 20, nom: 'Grande famille', desc: 'Avoir au moins 3 enfants.', test: (s) => childrenOf(s).length >= 3 },
  { id: 'globe_trotter', cat: 'Vie', pts: 20, nom: 'Nouveau départ', desc: 'T’expatrier dans un autre pays.', test: (s) => !!s.expat },

  // Carrière & Études
  { id: 'diplome_sup', cat: 'Carrière', pts: 15, nom: 'Tête bien faite', desc: 'Obtenir une Licence, un Master ou un Doctorat.', test: (s) => ['licence', 'master', 'doctorat'].includes(s.etudes?.niveau) },
  { id: 'premier_emploi', cat: 'Carrière', pts: 10, nom: 'Premier salaire', desc: 'Décrocher ton premier travail.', test: (s) => !!s.carriere },
  { id: 'champion', cat: 'Carrière', pts: 40, nom: 'Légende du sport', desc: 'Atteindre le niveau max en foot, basket ou boxe.', test: (s) => ['foot', 'basket', 'boxe'].includes(s.carriere?.id) && s.carriere.niveau >= 4 },
  { id: 'president', cat: 'Carrière', pts: 60, nom: 'À l’Élysée', desc: 'Atteindre le sommet de la carrière politique.', test: (s) => s.carriere?.id === 'politique' && s.carriere.niveau >= 4 },

  // Argent & Business
  { id: 'proprio', cat: 'Argent', pts: 15, nom: 'Chez moi', desc: 'Acheter ton propre logement.', test: (s) => !!s.proprio },
  { id: 'villa', cat: 'Argent', pts: 35, nom: 'La belle vie', desc: 'Acheter une villa avec piscine.', test: (s) => s.proprio && s.logement === 'villa' },
  { id: 'patron', cat: 'Argent', pts: 20, nom: 'Chef d’entreprise', desc: 'Ouvrir ta propre entreprise.', test: (s) => (s.business?.length || 0) > 0 },
  { id: 'millionnaire', cat: 'Argent', pts: 30, nom: 'Millionnaire', desc: 'Dépasser 1 000 000 € de patrimoine.', test: (s) => s.money + patrimoine(s) >= 1000000 },
  { id: 'multimillionnaire', cat: 'Argent', pts: 50, nom: 'Magnat', desc: 'Dépasser 10 000 000 € de patrimoine.', test: (s) => s.money + patrimoine(s) >= 10000000 },
  { id: 'licorne', cat: 'Argent', pts: 45, nom: 'Start-up Nation', desc: 'Valoriser une start-up au-delà de 10 000 000 €.', test: (s) => (s.business || []).some((b) => b.type === 'startup' && b.valo >= 10000000) },

  // Prestige & Réseaux
  { id: 'star', cat: 'Prestige', pts: 30, nom: 'Célébrité', desc: 'Atteindre 80 de notoriété.', test: (s) => s.stats.notoriete >= 80 },
  { id: 'instastar', cat: 'Prestige', pts: 30, nom: 'Star d’Instapic', desc: 'Dépasser 100 000 abonnés sur Instapic.', test: (s) => (s.insta?.followers || 0) >= 100000 },
  { id: 'casier_vierge', cat: 'Prestige', pts: 35, nom: 'Citoyen modèle', desc: 'Atteindre 60 ans avec un casier vierge et 70+ de Karma.', test: (s) => s.age >= 60 && !s.justice.casier.length && s.stats.karma >= 70 },

  // Crime & Extrême
  { id: 'baron', cat: 'Extrême', pts: 40, nom: 'Baron du quartier', desc: 'Diriger un réseau avec au moins 3 points de deal.', test: (s) => (s.reseau?.points || 0) >= 3 },
  { id: 'evasion', cat: 'Extrême', pts: 40, nom: 'La Grande Évasion', desc: 'T’évader de prison et partir en cavale.', test: (s) => !!s.flags?.cavale },
  { id: 'phoenix', cat: 'Extrême', pts: 45, nom: 'Phénix', desc: 'Avoir vécu dans la rue, puis posséder plus de 100 000 €.', test: (s) => !!s.flags?.vecu_rue && s.money + patrimoine(s) >= 100000 },
  { id: 'casino_king', cat: 'Extrême', pts: 35, nom: 'Roi du tapis vert', desc: 'Cumuler plus de 250 000 € de gains au casino.', test: (s) => (s.casino?.gagne || 0) >= 250000 },
  { id: 'exil_dore', cat: 'Extrême', pts: 30, nom: 'Exil doré', desc: 'Choisir l’exil fiscal pour protéger ta fortune.', test: (s) => !!s.flags?.exil_fiscal },
];
