# Notes de mise à jour de Destino

Version actuelle : **v0.10**. Ces notes sont aussi visibles dans le jeu (écran titre, « Notes de mise à jour »).

## v0.10 · Relations & Dynasties

Première étape vers la v1.0 (feuille de route : [ROADMAP_V1.md](ROADMAP_V1.md)).

- Tes proches vivent leur vie sans toi : métier, chômage, reconversion, couple, mariage, divorce, enfants, fortune qui monte ou qui chute, déménagement
- Chaque proche a sa personnalité (ambitieux, jaloux, rancunier, généreux, fêtard…) et se souvient de ce que tu as fait pour lui, ou contre lui
- Admiration, rancune et jalousie : un proche peut t’en vouloir des années, t’admirer, ou raconter partout que ta réussite n’est pas propre. Nouvelle action « Présenter des excuses »
- Initiatives des proches : un ancien ami devenu patron t’embauche quand tu es au chômage, un cousin te demande un prêt (et te rembourse… ou pas), invitations aux mariages, réconciliations, demandes de conseils
- Tes amis se rencontrent entre eux : ils deviennent amis, se mettent en couple, se brouillent, et te demandent de choisir ton camp
- Famille élargie : grands-parents, oncles, tantes, cousins, neveux et petits-enfants, avec un arbre familial (onglet Relations)
- Dynasties : en continuant avec un enfant, toute la famille change de place dans l’arbre (tes frères deviennent ses oncles, ses enfants restent les siens, son conjoint te suit). Les générations passées sont archivées et le prestige du nom compte
- Ambitions de vie (onglet Vie) : devenir propriétaire, se marier, renouer avec un parent, voir du pays, être heureux… Trois à la fois, abandon sans pénalité. Une vie ordinaire peut être une vie réussie
- Écran de fin : bilan de ta vie, ambitions accomplies et dynastie
- Correctifs : tests de casino rendus exacts (ils échouaient parfois en ligne), erreur en passant très vite le guide

## v0.9.4 · Hitman 2.0

- Hitman 2.0 : l’état du jeu est enfermé dans un coffre-fort. Toute modification venant de la console, d’un point d’arrêt ou d’un script est bloquée avant d’être appliquée, puis sanctionnée
- Journal financier (onglet Biens) : chaque gain et chaque dépense est rattaché à l’action qui l’a causé. Le solde réel doit toujours égaler le solde attendu
- Contrôles avant et après chaque action : ouvrir un onglet ne peut rien changer d’important, un achat ne peut jamais t’enrichir
- Restauration automatique : en cas de triche, le dernier état valide est restauré avant la sanction
- Sauvegardes encore plus sûres : enregistrées seulement après vérification, journal chaîné et scellé, validation stricte (biens, métiers, diplômes, entreprises, statistiques)
- Code publié obfusqué : les clés de Hitman ne sont plus lisibles, sans aucun ralentissement du jeu
- Les anciennes versions gardées hors ligne sont supprimées du cache

Architecture, tentatives de contournement, performances et limites : [SECURITY_AUDIT.md](SECURITY_AUDIT.md).

## v0.9.3 · Hitman

- Hitman, le nouvel anti-triche : injection dans la console, sauvegarde retouchée ou somme astronomique = « Hitman t’a détecté », saisie de tous tes avoirs et prison à perpétuité
- Le mode développeur (?dev) n’est plus accessible en ligne : il permettait de se donner de l’argent depuis la console
- Sauvegardes et succès signés : impossible de les modifier à la main ou de ressusciter un perso en recollant une vieille sauvegarde
- Une seule partie ouverte à la fois : ouvrir le jeu dans un autre onglet met l’ancien en pause
- Casino rééquilibré : la machine à sous ne fait plus gagner à coup sûr, le blackjack ne paie plus deux fois la même main
- Loto limité à 5 tickets par an (jackpot 2 000 000 €)
- Fini l’argent infini via les proches : une demande d’argent par personne et par an, y compris par SMS
- Receleur : plus de bonus en revendant un bien acheté la même année
- Héritage corrigé : les biens ne sont plus comptés deux fois, et la bourse est transmise
- Divers : études impossibles avant l’âge, aucun achat ni placement en prison, succès « La Grande Évasion » réservé aux vraies évasions

Détails, limites et plan de correction : [SECURITY_AUDIT.md](SECURITY_AUDIT.md).

## v0.9.2 · Création de perso

- Création de perso repensée : tu choisis d’abord Homme ou Femme, puis tu pars d’une base neutre à personnaliser (plus de perso aléatoire imposé)
- Corrigé : en modifiant ton perso, un deuxième personnage s’empilait devant l’ancien (le foulard ou la corpulence semblaient ne pas changer)
- Changer de genre garde ta peau, tes yeux et ta corpulence, et remet une coiffure de base (le foulard n’est plus proposé aux hommes)
- Le talent caché doit être choisi avant de commencer ta vie (le dé reste là pour tout tirer au hasard)

## v0.9.1 · Corrections visuelles

- La pluie tombe derrière les personnages au lieu de passer devant eux
- Les voitures qui passent roulent sur la chaussée au lieu de flotter, et l’ombre des voitures est sous les roues
- Coiffures recalées sur la tête : moins de volume au-dessus du front, racine des cheveux plus naturelle (fini le gros crâne avec le chignon, la queue et les tresses)

## v0.9 · La mise à jour « Tentations »

- Devenir millionnaire est beaucoup plus dur : un artiste talentueux n’y arrive plus à coup sûr (30 % à 55 ans au lieu de 100 %), un footballeur doué non plus (34 % au lieu de 91 %)
- Musique : chaque son est un pari (flop, succès moyen ou tube), le public se lasse si tu sors trop de sons, et la célébrité s’use vite si tu ne produis plus
- Artistes : revenus variables selon tes succès, le label et le manager prennent leur part, cotisations sociales d’indépendant
- Sport : passer pro est rare, chaque palier est bien plus dur que le précédent (pyramide), blessures fréquentes qui peuvent te faire perdre ta place
- Train de vie (onglet Biens) : modeste, normal ou flambeur. Plus tu gagnes, plus ton entourage et tes dépenses grimpent
- Tentations selon ton métier : label financé par le trafic, feat avec un caïd, matchs truqués, dopage, flic corrompu, fausses ordonnances, carrousel de TVA, braquage de fourgon, premier deal qui mène au réseau…
- Nouveaux événements du quotidien : dégât des eaux, usurpation d’identité, faux conseiller bancaire, burn-out, licenciement économique, juré d’assises, cambriolage, accident, frère endetté, héritage surprise…
- Moins de répétition : un événement déjà vécu devient plus rare et ne revient pas plus de 3 fois par vie
- Section « Débloqué » : une action qui vient de se débloquer (ex. tourner un clip) apparaît en haut de son onglet avec l’étiquette Nouveau

## v0.8 · La mise à jour « Économie réelle »

- Audit complet de l’économie : devenir riche est possible, mais plus garanti (fini les 500 millions en 4 parties)
- Cycles économiques : croissance, boom, récession et krach boursier touchent tes ventes, tes biens et tes levées de fonds
- Bourse : place ton argent dans l’onglet Biens. En moyenne ça rapporte, mais un krach peut coûter 30 % en un an
- Commerces réalistes : charges fixes (loyer, salaires), années de pertes, liquidation après 3 ans dans le rouge. Agrandir ne rapporte que si la réputation et l’économie suivent
- Plus de 15 imprévus pour les patrons : concurrent, bad buzz, gérant qui vole, prud’hommes, grève, incendie, contrôle fiscal, hygiène, offre de rachat, assurance…
- Start-ups : la plupart échouent. Chaque levée de fonds dilue ta part, possibilité de pivoter, faille de sécurité, CTO qui veut des parts, offre de rachat par un géant
- Métier Entrepreneur : revenus variables selon les années et la conjoncture, faillite possible (fini le salaire fixe de 1,5 M€ par an)
- Côté illégal : guerres de territoire, enquête des stups (OFAST), indic dans l’équipe, go-fast qui finit en prison, saisie des avoirs criminels en cas de condamnation
- Héritage soumis aux droits de succession, crypto perdante en moyenne, commission du marchand à la revente des biens

## v0.7 · La mise à jour « Grandir »

- Le menu grandit avec toi : Vie et Relations à la naissance, Activités et École à 3 ans, téléphone à 11 ans, Crime à 12 ans, Carrière et Biens à 16 ans
- L’énergie augmente avec l’âge : 1 action par an petit, jusqu’à 4 adulte, puis moins en vieillissant
- Chaque déblocage est annoncé, avec une pastille « Nouveau » sur l’onglet
- Version mobile jouable : « Vieillir » en grand au-dessus du menu, tous les onglets visibles, haut d’écran compact, panneaux lisibles
- Le bouton Téléphone ouvre et referme le téléphone
- On peut blanchir avec une start-up (via de faux investisseurs, plus risqué qu’un restaurant)
- Correction : dans « Fuir à l’étranger », la barre de sécurité ne recouvre plus le prix

## v0.6 · La mise à jour « Renaissance & PWA »

- Vrai bébé à 0–1 an : berceau, tétine, visage rond et tapis d’éveil, puis croissance naturelle
- 9 paysages dédiés selon le pays de naissance (Maghreb, Afrique de l’Ouest/Centrale, Antilles, Portugal, Turquie, Asie, Europe de l’Est, Amérique latine)
- Guide interactif façon Clash Royale : ta mère t’accueille et t’explique l’interface étape par étape avec spotlight
- 24 Défis & Succès persistants entre tes vies, avec points et bannière de déblocage
- Storytelling petite enfance enrichi (premier mot, berceuse au pays, fête familiale, doudou)
- Équilibrage réaliste : espérance de vie ~75–80 ans, start-ups encadrées, héritage complet des biens et entreprises
- Application PWA installable sur PC et iPhone (écran d’accueil propre, sans zoom ni swipe accidentel)
- Corrections majeures : exploits immobiliers/start-up, carrière politique, rendez-vous en prison, Côte d’Ivoire, performances Relations

## v0.5.3 · Partage du lien

- Joli aperçu quand on partage le lien (Discord, WhatsApp, X…) : image, titre et description
- Meilleur référencement sur Google (description, sitemap, données structurées)
- Icône propre quand on ajoute le jeu à l’écran d’accueil de l’iPhone

## v0.5.2 · Nouvelle adresse

- Nouvelle adresse du jeu : https://destinolife.github.io/ (organisation DestinoLife)
- Le bouton « Signaler un bug » envoie vers le nouveau dépôt

## v0.5.1 · Destino en ligne

- Le jeu est jouable en ligne : https://destinolife.github.io/
- Bouton « Signaler un bug » (écran titre, onglet Vie, fin de vie) : ouvre un formulaire avec les infos de ta partie déjà remplies

## v0.5 · La mise à jour « Agenda et fisc »

- Agenda : ce que tu prévois par message (dîner, soirée, livraison, arrivage, parloir, interview…) a une vraie date
- Le bouton « Vieillir » devient « Avancer » : il saute de quelques jours jusqu’au prochain rendez-vous au lieu d’une année
- Impôts selon ta situation : revenu avec parts (mariage, enfants), sociétés, taxe foncière, impôt sur la fortune au-delà de 1,3 M€
- Détail de tes impôts dans l’onglet Biens, avis d’imposition par message quand la facture change
- Conseiller fiscal : optimisation légale, montage offshore (risque de redressement) ou exil fiscal
- Instapic : 8 nouveaux types de photos (repas, plage, rando, concert, animal, café, gaming, coucher de soleil)
- Correction : l’écran de fin de vie s’affichait mal (après une overdose notamment)
- Correction : le téléphone ne se ferme plus quand on touche son bas ou ses coins

## v0.4.2 · Correctif « Notifications » 2

- Les messages reçus pendant un choix s’affichent sur la carte du choix, plus par-dessus
- Un événement qui arrive par message n’est plus affiché en double
- Correction de l’icône de notification qui débordait sur le texte

## v0.4.1 · Correctif « Notifications »

- Un nouveau message s’affiche en notification en bas à droite (en haut sur mobile), avec son texte
- Cliquer sur la notification ouvre directement la conversation
- Une conversation s’ouvre toujours sur le dernier message, plus besoin de descendre

## v0.4 · La mise à jour « Cohérence »

- Messages repensés : 2 par an maximum, liés à ta vie, avec 2 réponses opposées et de vraies conséquences
- Un rendez-vous fixé par message se passe vraiment (dîner, soirée, repas de famille)
- Ignorer un message a un coût : plus d’accumulation de notifications
- Le téléphone sert à communiquer : Messages, Instapic, Contacts, Actus
- Instapic : 3 posts par an, vraies images, commentaires qui changent tes relations, contrats de marques
- L’illégal n’est plus un emploi salarié : gains variables d’argent sale, rang qui monte avec la réputation
- Hub « Mon business » dans l’onglet Crime : réseau, fournisseur, missions, blanchiment
- Réseau rééquilibré : bien plus rentable que le légal, mais beaucoup plus risqué
- Impôt sur le revenu et argent de poche réaliste
- Ton ami d’enfance avocat peut te défendre, ton ami flic peut te prévenir d’une descente
- Ultimatum de ton couple si tu vis dans l’illégal ou l’addiction
- Nouvelles décisions de carrière : formation, mutation, conflit, chasseur de têtes, grève
- Les panneaux ne remontent plus en haut à chaque clic, un seul panneau ouvert à la fois
- Astuces pour débuter et aide dans chaque onglet
- Corrections : créateur en femme, famille « au pays » pour les Français, messages incohérents

## v0.3 · Relations, addictions, politique

- Intro animée, confiance avec chaque proche, amis d’enfance qui deviennent quelqu’un
- Addictions, maladies avec symptômes, état visible du personnage
- Politique jusqu’à président, coup d’État, pays qui évoluent, expatriation
- Téléphone dans la barre du bas, Instapic, blackjack, femmes redessinées

## v0.2 · Open world business

- Biens qui prennent de la valeur, entreprises, contacts pro, réseau de trafic
- Casino, voyages, cavale selon la sécurité, voiture et famille dans la scène, décor animé

## v0.1 · Premier prototype

- Création de personnage, temps adaptatif, justice, carrières, héritage, 17 décors
