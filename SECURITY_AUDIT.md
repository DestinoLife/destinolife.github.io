# Audit de sécurité et anti-triche : Destino

- **v0.9.4, Hitman 2.0** : coffre-fort d'état, journal financier, contrôles de légitimité, obfuscation. Voir la première partie.
- **v0.9.3, Hitman 1** : audit complet du code (30 failles) et premières protections. Voir la seconde partie.

---

# Partie 1 : Hitman 2.0 (v0.9.4)

## Pourquoi on pouvait encore modifier `money` en v0.9.3

| Faille restante | Comment | Conséquence |
|---|---|---|
| **Point d'arrêt pendant une action** | Le sceau n'était vérifié qu'*entre* deux actions. On met l'exécution en pause dans les outils de développement (par exemple dans `bourseAction`), on tape `s.money = 5e8`, puis on reprend. | L'action se termine, et le sceau valide l'état truqué comme s'il était légitime. |
| **Contrôle par plafond seulement** | En dehors du sceau, seule une somme supérieure à 1 milliard déclenchait Hitman. | Toute somme injectée sous ce plafond passait inaperçue. |
| **Code lisible** | La clé de signature, la recette du hachage et le nom des entrées localStorage étaient en clair dans le bundle. | On pouvait recopier `sign()`, modifier la sauvegarde puis la re-signer. |
| **Aucune justification** | Rien ne rattachait un gain à sa cause. | Une sauvegarde re-signée avec 50 M€ était indiscernable d'une vraie fortune. |
| **Cache hors ligne** | Le service worker pouvait servir l'ancien bundle (avec `?dev`) hors connexion. | Le nom du cache passe à `v07`, ce qui purge l'ancienne version. |

## Architecture de Hitman 2.0 ([src/engine/hitman.js](src/engine/hitman.js))

Ce sont des couches **indépendantes** : contourner l'une ne suffit pas.

1. **Coffre-fort (encapsulation de l'état).**
   - L'état d'une vie n'est plus un objet libre : le jeu ne manipule qu'un `Proxy`, et l'objet réel reste enfermé dans le module.
   - Chaque écriture (affectation, suppression, `defineProperty`, `setPrototypeOf`, méthodes de tableau) est interceptée.
   - Le Proxy couvre l'argent, la bourse, l'argent sale, l'énergie, l'âge, toutes les statistiques, les diplômes, le métier, les entreprises, les biens, la justice, les compteurs (loto, demandes aux proches…) et l'événement en cours.
2. **Légitimité de chaque écriture.**
   - La pile d'appels de l'écriture doit venir des scripts du jeu (même origine) ou du navigateur.
   - Une frame de la console, d'un point d'arrêt, d'un `eval`, d'un extrait DevTools ou d'une extension rend l'écriture étrangère : **elle n'est pas appliquée**, et Hitman intervient.
   - Ce qui se trouve *sous* le point d'entrée de l'action (l'écouteur de clic et ce qui l'a déclenché) n'est pas jugé. Un clic déclenché par une extension d'accessibilité reste donc légitime.
   - La falsification des piles (`Error.stackTraceLimit`, `Error.prepareStackTrace`) est elle-même détectée.
3. **Gestionnaire central des transactions et journal financier.**
   - Chaque variation d'argent, de bourse et d'argent sale passe par le coffre-fort.
   - Elle est rattachée à l'action du joueur qui l'a causée, puis journalisée : action, âge, montants, solde.
   - Le journal est **chaîné** : chaque ligne scelle la précédente, avec une clé distincte de celle des sauvegardes.
   - Il est visible en jeu, dans l'onglet *Biens → Journal financier*.
4. **Contrôles avant et après chaque action** (`begin`/`end`) :
   - **solde attendu = solde réel** (solde de départ + variations journalisées) ;
   - une action d'interface pure (onglet, téléphone, mise affichée…) ne doit changer **aucune** donnée sensible ;
   - un achat ne doit jamais enrichir.
5. **Contrôles d'intégrité indépendants** (toutes les 1,5 s et avant chaque action) :
   - des valeurs témoins (copie hors de l'état des champs sensibles) ;
   - une empreinte complète de l'objet brut ;
   - les fonctions natives (`Math.random`, `JSON`, `Error`) restent intactes ;
   - des bornes de cohérence.
6. **Restauration automatique.** En cas d'anomalie, le dernier état validé est restauré en place : la triche est annulée. Puis vient la sanction (saisie et perpétuité).
7. **Sauvegardes : signature et validation stricte.** On n'enregistre **que des états validés** : la sauvegarde a lieu après les contrôles de fin d'action. Au chargement, la sauvegarde est refusée dans ces cas :
   - signature fausse ou supprimée ;
   - vie déjà terminée ;
   - journal chaîné cassé, solde du journal différent du solde réel, ou journal supprimé d'une vie qui en avait un ;
   - types ou bornes impossibles ;
   - identifiants inconnus (bien, entreprise, métier, diplôme).
8. **Aléatoire.** Le jeu n'utilise que `rand()`, capturé au chargement. Remplacer `Math.random` est sans effet, détecté, puis réparé.
9. **Obfuscation du build** ([vite.config.js](vite.config.js)). Le code source reste lisible. Dans le bundle publié, Hitman, la sauvegarde et les succès sont obfusqués :
   - chaînes chiffrées (RC4) et découpées ;
   - noms renommés ;
   - clés d'objets transformées.
   
   Dans le bundle, on ne trouve plus `destino.save.v1`, la graine du hachage ni les clés.

## Tentatives de contournement (toutes reproduites dans `npm run anticheat`)

| Test | Tentative | Résultat |
|---|---|---|
| HM-2 | `p.money = 1e8`, stats, énergie, diplôme depuis la console | Bloqué (valeur inchangée) et détecté |
| HM-2b | Écriture pendant une action (simule un point d'arrêt) | Bloquée, action refusée |
| HM-2c | Objets imbriqués, `push`, `delete`, `defineProperty` (getter), `setPrototypeOf`, `Object.assign`, métier, peine, compteurs (11 attaques) | Les 11 sont bloquées et détectées |
| HM-2d | Modifier l'objet brut sans passer par le Proxy | Détecté (témoins, puis empreinte complète) et restauré |
| HM-2e | `Error.stackTraceLimit = 0` ou faux `prepareStackTrace` pour tromper la pile | Détecté et réparé |
| HM-2f | Action déclenchée par un script ou une extension, mais écritures faites par les règles du jeu | **Pas** de faux positif |
| HM-3 / 3b | Gain journalisé et rattaché à l'action ; argent apparu dans une action d'interface ou lors d'un achat | Journal exact ; anomalies détectées |
| HM-4 | Sauvegarde retouchée, signature supprimée, vie ressuscitée | Détecté |
| HM-4b | **Tricheur qui connaît la clé** : modifie l'argent et re-signe ; modifie aussi le solde du journal ; supprime le journal | Les 3 sont détectés (sceau du journal, liste des vies journalisées) |
| HM-4c | Bien, métier, diplôme ou entreprise inventés ; stat 999 ; énergie 1e6 ; peine négative | Refusés |
| HM-7 | 40 vies honnêtes jouées à travers le coffre-fort : environ 3 200 années, une quinzaine d'héritages, une vingtaine de variations de plus de 1 M€ (casino, ventes, bourse, entreprises) | **0 faux positif.** Sauvegarde et rechargement valides tout au long |

Dans le navigateur (build de développement et build obfusqué), ces cas ont été vérifiés :

- environ 1 000 clics de jeu sans aucune détection ni erreur ;
- `destino.S.money = 5e7` depuis la console : écriture bloquée, Hitman immédiat ;
- sauvegarde retouchée et `Math.random` remplacé : détectés.

## Performances

Banc d'essai : 60 clics d'onglet à 12 ans, même machine.

| Build | Médiane par clic |
|---|---|
| v0.9.3 en ligne | 22,7 ms |
| v0.9.4 sans obfuscation | 23,6 ms |
| v0.9.4 obfusqué (réglé) | 23,4 ms |

- **Coût du coffre-fort** : 1,3 ms par action du moteur (mesuré en Node).
- **Pas d'impact sur les 60 FPS** : aucune vérification ne tourne image par image.
- **Ce qu'on a écarté** :
  - L'aplatissement du flux de contrôle et l'obfuscation de tout le jeu triplaient le temps d'un clic (43 ms). Ils sont retirés.
  - Le hachage a été réécrit pour que l'obfuscation n'ajoute rien dans sa boucle.

## Limites (honnêtes)

- **Code modifié avant son exécution** (*Local Overrides* de DevTools, proxy local) : l'attaquant exécute *son* code sous la bonne URL, et aucune protection locale ne peut s'en apercevoir. L'obfuscation rend seulement ce travail long.
- **Variable locale modifiée pendant une pause** (par exemple le multiplicateur d'une machine à sous) : l'écriture finale vient alors du code du jeu. Les règles de légitimité (un achat n'enrichit pas, un onglet ne change rien…) en attrapent une partie, mais pas tout.
- **Objet brut pendant une action** : un attaquant qui pose un point d'arrêt *dans* le Proxy de Hitman y accède. Les modifications faites entre deux actions sont attrapées par les témoins et l'empreinte. Celles faites pendant une action ne le sont que si elles cassent le solde attendu ou une règle.
- **Re-signature complète** d'une sauvegarde (signature, journal et liste des vies) : c'est possible pour qui désobfusque entièrement le bundle.

Seule une validation serveur ferme ces portes (voir « Vers une validation serveur »). Le journal financier chaîné et le découpage `begin(action)` / `end()` en sont déjà la forme : un serveur rejouera chaque action et comparera son journal à celui du client.

---

# Partie 2 : audit et Hitman 1 (v0.9.3)

Audit réalisé le 26/11/2026 sur la v0.9.2, puis corrigé en v0.9.3.
Méthode : trois audits indépendants (économie et casino, sauvegarde et interface, règles de jeu et aléatoire). Chaque faille suspectée a été reproduite en Node dans un environnement isolé avant d'être classée. Les failles non reproduites sont listées comme telles.

## Ce qu'il faut retenir

- **Cause probable de l'argent « injecté » d'un joueur** : en production, ajouter `?dev` à l'adresse exposait tout l'état du jeu dans la console (`window.destino.S.money = 1e12`). C'est corrigé : le mode dev n'existe plus que dans `npm run dev`.
- **Hitman** est le nouvel anti-triche. Il détecte les injections, les sauvegardes retouchées et les sommes astronomiques. Le tricheur voit l'écran « Hitman t'a détecté », perd tous ses avoirs et part en prison à perpétuité, sans évasion ni aménagement de peine.
- **Toutes les failles confirmées sont corrigées et couvertes par un test** : `npm run anticheat` exécute 24 tests, et la CI bloque la publication si l'un d'eux casse.

## Limites assumées (à lire)

Destino tourne entièrement dans le navigateur. Le code, l'état et la clé de signature sont livrés au joueur. **Aucune protection locale ne peut rendre la triche impossible**, elle peut seulement la rendre difficile et visible :

- quelqu'un qui lit le code minifié peut recalculer la signature d'une sauvegarde modifiée ;
- un point d'arrêt posé *au milieu* d'une action, dans les outils de développement, peut modifier l'état avant qu'il soit scellé. Hitman l'attrape alors seulement si la somme devient astronomique (au-delà de 1 milliard) ou invalide ;
- supprimer à la fois la sauvegarde, sa signature et le marqueur `destino.hm` ramène le navigateur à l'état « jamais joué avec Hitman » ;
- une capture d'écran retouchée (inspecteur sur le HUD) ne modifie rien dans le jeu. Aucun code ne peut l'empêcher.

**Seule une validation côté serveur rendra la triche impossible.** Elle sera nécessaire pour le mode en ligne et les classements (voir la dernière section).

## Hitman : fonctionnement

Le module [src/engine/hitman.js](src/engine/hitman.js) est importé avant tout le reste.

| Protection | Détail |
|---|---|
| Aléatoire capturé | `Math.random` natif est capturé au chargement. Tout le jeu utilise `rand()` (40 appels remplacés). Remplacer `Math.random` dans la console n'a donc plus d'effet : Hitman remet la fonction d'origine et condamne. |
| Sceau de l'état | Après chaque action et chaque rendu, une empreinte (cyrb53) de l'état est mémorisée. Avant l'action suivante, et toutes les 2 s, l'état doit être identique. Sinon, il a été modifié de l'extérieur : c'est une injection. L'audit a vérifié qu'**aucun minuteur ne modifie l'état hors des actions**, ce qui écarte les faux positifs. |
| Sauvegarde signée | La signature est écrite **dans la même entrée** localStorage (atomique, même avec plusieurs onglets). Une signature fausse ou supprimée déclenche Hitman au chargement. |
| Vies terminées | Une pierre tombale (`destino.dead`) empêche de ressusciter un perso en recollant une vieille sauvegarde. |
| Sommes astronomiques | Au-delà de 1 milliard d'euros, Hitman condamne. Les sommes NaN ou infinies, l'âge et les stats impossibles aussi. Le seuil est 50 fois la fortune légitime maximale observée (21 M€ sur 60 vies par stratégie). |
| Un seul onglet | Ouvrir la partie dans un autre onglet renvoie l'ancien à l'accueil (BroadcastChannel). Ça évite que deux onglets s'écrasent. |
| Garde des actions | Toute action dont un paramètre est une clé du prototype d'objet (`__proto__`, `constructor`…) est ignorée. |
| Sanction | `hitmanSanction` saisit l'argent, la bourse, les biens et les entreprises. Elle condamne à perpétuité (999 ans), avec le casier « Triche détectée par Hitman ». Évasion, aménagement et réduction de peine sont neutralisés, et les succès sont bloqués pour cette vie. |
| Compatibilité | Les sauvegardes d'avant la v0.9.3 (non signées) sont acceptées puis signées. Elles ne sont refusées que si elles contiennent une somme astronomique. |

## Failles trouvées

Gravité : C = critique, H = haute, M = moyenne, B = basse. Tous les tests cités sont dans [scripts/anticheat.mjs](scripts/anticheat.mjs).

| ID | Grav. | Fichier | Faille (reproduction → impact) | Correction v0.9.3 | Test |
|---|---|---|---|---|---|
| UI-0 | C | main.js | `?dev` en production expose `window.destino.S` : argent illimité depuis la console | Mode dev réservé à `import.meta.env.DEV` | build (absent du bundle) |
| GP-12 | C | rng.js et 40 appels | `Math.random = () => 0` dans la console : 7-7-7 à chaque tour (+24,5 M€ par tour) | `rand()` natif capturé, détection et restauration | HM-1 |
| ECO-1 | C | economy.js `slots` | Machine à sous à espérance **1,134** : on gagne 13 % par tour | La paire rembourse au lieu de payer ×1,5 : espérance **0,926** | ECO-1 |
| ECO-2 | C | activities.js `loto` | Loto gratuit et illimité à +198 € par ticket : 1 M → 16,8 M en 100 000 tickets | 5 tickets par an, jackpot 2 M€ à 1/100 000 | ECO-2 |
| UI-1 / GP-3 / ECO-6 | H | life2.js `bjStand`/`bjHit` | Rejouer « Rester » sur une main finie repaie la mise à chaque clic | Garde `st.done` dans le moteur et dans l'interface | ECO-6 |
| ECO-4 / GP-1 | H | economy.js, life2.js | Mise NaN, `'abc'` ou `undefined` : `money = NaN`, et ensuite tout devient gratuit | `Number.isFinite`, mise entière, majeur, hors prison | ECO-4, GP-2 |
| ECO-5 | M | economy.js `bourseAction` | Montant NaN : argent et bourse passent à NaN | Montant fini, entier, strictement positif ; interdit en prison | ECO-5 |
| ECO-3 | H | economy.js `sellAsset` | Receleur : achat puis revente la même année = +3,5 % par cycle, sans limite | Bonus receleur seulement sur un bien détenu depuis au moins un an | ECO-3 |
| UI-2 / GP-6 / ECO-8 | H | flow.js `relAction` | Limites annuelles vérifiées seulement dans l'interface : « Demander de l'argent » en boucle (+1 M€), enfants avec sa mère… | Le moteur revérifie `relActions(...).ok` | GP-6/ECO-8 |
| ECO-7 | M | life2.js `sendMessage` | SMS « Tu peux me dépanner ? » en boucle (+660 k€) ; texte libre accepté | Liste blanche des réponses, une demande par proche et par an | ECO-7 |
| UI-3 / GP-4 | H | economy.js, flow.js, life2.js, main.js | Identifiants `__proto__` / `constructor` : biens fantômes, NaN, énergie perdue, partie bloquée | `Object.hasOwn` partout et garde centrale dans `handle()` | GP-4 |
| GP-5 | H | flow.js `choose` | Index `'length'` ou `'__proto__'` : événement forcé (procès, expulsion) résolu sans effet | Index entier dans les bornes | GP-5 |
| GP-10 | M | messages.js `answer` | Index piégé : message marqué répondu puis plantage | Index entier positif | GP-10 |
| GP-7 | M | flow.js `enroll` | Études sans âge ni énergie : master à 15 ans | Âge minimum, énergie requise, clé propre | GP-7 |
| GP-8 | M | economy.js | Achats, bourse et déménagement possibles en prison | Gardes `inPrison` | GP-8 |
| ECO-9 | M | flow.js `continueAsChild` | Héritage : biens comptés deux fois (+20 %), bourse perdue | Biens non recomptés, bourse transmise | ECO-9 |
| UI-4 / GP-9 | M | achievements.js | Succès en clair (tout débloquer) ; `null` bloque la partie ; « Évasion » sans s'évader | Succès signés et filtrés, parse sûr, drapeau `evade_prison` | UI-4 |
| UI-5 | M | save.js | Sauvegarde chargée sans validation de forme | Validation de forme, signature, pierre tombale | HM-4, HM-5 |
| UI-6 | M | save.js, main.js | Restauration d'une vieille sauvegarde (annuler une mort) ; deux onglets qui s'écrasent | Pierre tombale, verrou d'onglet | HM-4 |
| GP-11 | B | rng.js, core.js | `clamp(NaN)` = NaN ; `prisonAdd` négatif sans plancher | `clamp` sûr, peine ≥ 0 | HM-6 |
| UI-7 | B | economy.js, main.js | Ville arbitraire via `moveCity` ; prénom sans limite de longueur | Liste blanche `VILLES`, prénom ≤ 20 et nom ≤ 24 caractères | GP-4 |
| UI-8 | B | main.js | Espace maintenu enchaîne les années | `e.repeat` ignoré | — |

### Non reproduites (saines)

- **Injection HTML / XSS : aucune.** Toutes les chaînes du joueur passent par `esc()`.
- **Dépendances : aucune.** `npm audit` : 0 vulnérabilité, aucune dépendance de production.
- **Secrets : aucun dans le dépôt.**
- **Entreprises :** créer et revendre en boucle fait perdre de l'argent (1 M → 702 k sur 200 start-ups).
- **Roulette :** espérance 0,973.
- **Blackjack** (stratégie de base) : −2,7 %.
- **Paris sportifs** et **immobilier** : perdants.
- **Double clic :** aucun effet, `handle()` est synchrone et redessine avant le clic suivant.
- **Aides sociales :** inexistantes dans le moteur.

### Points restants (basse priorité)

- **Bourse :** rendement de +4 à +16 % par an, sans frais ni impôt sur la plus-value. Ce n'est pas un exploit, mais c'est généreux. Piste : flat tax de 30 % au retrait.
- **Succession :** aucun droit de succession sur les biens ni les entreprises.
- **Réseau :** les guetteurs sont gratuits et sans plafond (ils réduisent seulement la chaleur).
- **Conversations :** deux proches avec le même prénom partagent leur conversation (clé = prénom).

## Plan de correction (réalisé)

1. **Phase 1, critique (v0.9.3)** : `?dev`, aléatoire capturé, machine à sous, loto, blackjack, NaN, clés de prototype, Hitman (sceau, signature, sanction).
2. **Phase 2, haute et moyenne (v0.9.3)** : relations, SMS, receleur, choix d'événements et de messages, études, prison, héritage, succès, sauvegarde, onglets.
3. **Phase 3, tests (v0.9.3)** : `npm run anticheat`, branché dans la CI avant la compilation. Les tests ont été validés par mutation : réintroduire la paire ×1,5 ou retirer la garde du blackjack les fait échouer.
4. **Phase 4, à venir** : les points restants ci-dessus, puis la validation serveur.

## Vers une validation serveur (mode en ligne)

Le moteur est déjà sans DOM et déterministe à l'aléatoire près. Il pourra tourner tel quel sur un serveur (Node) :

1. **Le client n'envoie que des intentions**, jamais un état : `{ action: 'buyasset', v: 'montre' }`. C'est déjà la forme de `handle(a, v)`.
2. **Le serveur rejoue l'action** sur l'état qu'il détient, avec un aléatoire **graine côté serveur**. Il renvoie le nouvel état, ou seulement le différentiel.
3. **Les invariants de `anomalie()`** et la suite anti-triche s'exécutent côté serveur à chaque action.
4. **La sauvegarde locale ne sert plus que de cache.** La vérité vit en base de données, avec un numéro de révision pour refuser les requêtes rejouées ou venant d'un vieil onglet.

Les points de branchement sont `handle()` (main.js), `save`/`load` (save.js) et `rand()` (hitman.js), qui deviendra un PRNG à graine fournie par le serveur.
