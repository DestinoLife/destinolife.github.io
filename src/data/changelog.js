// Notes de mise à jour affichées dans le jeu (même contenu que CHANGELOG.md).
export const VERSION = 'v0.5.1';

export const CHANGELOG = [
  { v: 'v0.5.1', titre: 'Destino en ligne', items: [
    'Le jeu est jouable en ligne : https://samyr13.github.io/Destino/',
    'Bouton « Signaler un bug » (écran titre, onglet Vie, fin de vie) : ouvre un formulaire avec les infos de ta partie déjà remplies',
  ] },
  { v: 'v0.5', titre: 'La mise à jour « Agenda et fisc »', items: [
    'Agenda : ce que tu prévois par message (dîner, soirée, livraison, arrivage, parloir, interview…) a une vraie date',
    'Le bouton « Vieillir » devient « Avancer » : il saute de quelques jours jusqu’au prochain rendez-vous au lieu d’une année',
    'Impôts selon ta situation : revenu avec parts (mariage, enfants), sociétés, taxe foncière, impôt sur la fortune au-delà de 1,3 M€',
    'Détail de tes impôts dans l’onglet Biens, avis d’imposition par message quand la facture change',
    'Conseiller fiscal : optimisation légale, montage offshore (risque de redressement) ou exil fiscal',
    'Instapic : 8 nouveaux types de photos (repas, plage, rando, concert, animal, café, gaming, coucher de soleil)',
    'Correction : l’écran de fin de vie s’affichait mal (après une overdose notamment)',
    'Correction : le téléphone ne se ferme plus quand on touche son bas ou ses coins',
  ] },
  { v: 'v0.4.2', titre: 'Correctif « Notifications » 2', items: [
    'Les messages reçus pendant un choix s’affichent sur la carte du choix, plus par-dessus',
    'Un événement qui arrive par message n’est plus affiché en double',
    'Correction de l’icône de notification qui débordait sur le texte',
  ] },
  { v: 'v0.4.1', titre: 'Correctif « Notifications »', items: [
    'Un nouveau message s’affiche en notification en bas à droite (en haut sur mobile), avec son texte',
    'Cliquer sur la notification ouvre directement la conversation',
    'Une conversation s’ouvre toujours sur le dernier message, plus besoin de descendre',
  ] },
  { v: 'v0.4', titre: 'La mise à jour « Cohérence »', items: [
    'Messages repensés : 2 par an maximum, liés à ta vie, avec 2 réponses opposées et de vraies conséquences',
    'Un rendez-vous fixé par message se passe vraiment (dîner, soirée, repas de famille)',
    'Ignorer un message a un coût : plus d’accumulation de notifications',
    'Le téléphone sert à communiquer : Messages, Instapic, Contacts, Actus',
    'Instapic : 3 posts par an, vraies images, commentaires qui changent tes relations, contrats de marques',
    'L’illégal n’est plus un emploi salarié : gains variables d’argent sale, rang qui monte avec la réputation',
    'Hub « Mon business » dans l’onglet Crime : réseau, fournisseur, missions, blanchiment',
    'Réseau rééquilibré : bien plus rentable que le légal, mais beaucoup plus risqué',
    'Impôt sur le revenu et argent de poche réaliste',
    'Ton ami d’enfance avocat peut te défendre, ton ami flic peut te prévenir d’une descente',
    'Ultimatum de ton couple si tu vis dans l’illégal ou l’addiction',
    'Nouvelles décisions de carrière : formation, mutation, conflit, chasseur de têtes, grève',
    'Les panneaux ne remontent plus en haut à chaque clic, un seul panneau ouvert à la fois',
    'Astuces pour débuter et aide dans chaque onglet',
    'Corrections : créateur en femme, famille « au pays » pour les Français, messages incohérents',
  ] },
  { v: 'v0.3', titre: 'Relations, addictions, politique', items: [
    'Intro animée, confiance avec chaque proche, amis d’enfance qui deviennent quelqu’un',
    'Addictions, maladies avec symptômes, état visible du personnage',
    'Politique jusqu’à président, coup d’État, pays qui évoluent, expatriation',
    'Téléphone dans la barre du bas, Instapic, blackjack, femmes redessinées',
  ] },
  { v: 'v0.2', titre: 'Open world business', items: [
    'Biens qui prennent de la valeur, entreprises, contacts pro, réseau de trafic',
    'Casino, voyages, cavale selon la sécurité, voiture et famille dans la scène, décor animé',
  ] },
  { v: 'v0.1', titre: 'Premier prototype', items: [
    'Création de personnage, temps adaptatif, justice, carrières, héritage, 17 décors',
  ] },
];
