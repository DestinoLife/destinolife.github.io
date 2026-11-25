# Destino

Jeu de simulation de vie en 2D (PEGI 18). Chaque choix fait évoluer le personnage, son décor et son destin.

Version actuelle : **v0.9**. Voir [CHANGELOG.md](CHANGELOG.md). Les versions suivent le format v0.x, comme un vrai jeu en accès anticipé : chaque mise à jour a son tag Git et ses notes dans `src/data/changelog.js`.

## Jouer

**👉 https://destinolife.github.io/** (PC et mobile, sauvegarde dans le navigateur)

Un bug, une idée ? Bouton « Signaler un bug » dans le jeu, ou directement dans les [issues](https://github.com/DestinoLife/destinolife.github.io/issues/new/choose). Les infos de la partie sont jointes automatiquement.

Chaque push sur `main` republie le jeu (GitHub Actions → branche `gh-pages`), après la simulation de 300 vies.

## Lancer le jeu en local

```bash
npm install
npm run dev      # http://localhost:5173  (ajoute ?dev pour le compteur de FPS)
npm run build    # version de production dans dist/
npm run sim      # simule 300 vies au hasard pour détecter les bugs
npm run og       # régénère l’image d’aperçu des liens (public/og.png)
node scripts/eco-audit.mjs 150   # fortune obtenue par des joueurs « optimisés » (business, start-up, réseau)
node scripts/repeat-audit.mjs 120   # répétition des événements dans une vie
node scripts/tax-check.mjs   # montants d’impôts sur des profils types
```

## Structure

| Dossier | Rôle |
| --- | --- |
| `src/data/events.js` | **Banque d'événements** (le cœur du jeu). Ajoutez-en ici. |
| `src/data/events2.js` | Événements V2 : enfance, prison, rue, millionnaire, réseau, voyages, cavale, rap, business, SMS |
| `src/data/world.js` | Biens (voitures, bijoux, art), entreprises, rôles des contacts, destinations, missions du réseau |
| `src/engine/economy.js` | Valeur des biens, business, réseau, voyages, cavale, casino, téléphone, santé (sport obligatoire) |
| `src/data/events3.js` | Événements V3 : petite enfance, école, addictions, symptômes, confiance, monde, foot, politique |
| `src/data/world2.js` | Addictions, maladies, destins des amis d'enfance, pays et situations, expatriation |
| `src/engine/life2.js` | Addictions, maladies, confiance, services des amis, Instapic, actus, foot, blackjack, intro |
| `src/ui/overlays3.js` | Intro animée, messages avec réponses, Instapic, actus, blackjack, santé, foot, expatriation |
| `src/ui/overlays.js` | Téléphone, PC de la start-up, casino, choix de destination, onglet Biens, gestion du réseau |
| `src/data/activities.js` | Actions du menu du bas : activités, crime, carrière, prison |
| `src/data/careers.js` | Métiers, niveaux, salaires, conditions d'embauche |
| `src/data/identity.js` | Origines, prénoms, villes, milieux, traits, talents |
| `src/data/look.js` | Options d'apparence et tenues |
| `src/data/housing.js` | Logements et noms des lieux |
| `src/engine/` | Moteur : temps adaptatif, effets, justice, finances, héritage, sauvegarde |
| `src/render/avatar.js` | Dessin du personnage en SVG |
| `src/render/scene.js` | Les 17 décors (rue, cité, campement, villa, plage, prison…) |
| `src/main.js` | Interface : écran titre, création de perso, HUD, menu du bas |

## Ajouter un événement

```js
{ id: 'mon_event', cat: 'Rue', age: [18, 40], cond: (s) => s.stats.crime > 20,
  txt: '{ami} te propose un plan louche.',
  ch: [
    { t: 'Accepter', h: 'Argent ▲', out: [
      { p: 0.6, fx: { money: 2000, crime: 3 }, r: 'Ça passe.' },
      { p: 1, fx: { arrest: { motif: 'Recel', peine: [1, 2] } }, r: 'Pris{e} sur le fait.' } ] },
    { t: 'Refuser', fx: { karma: 2 }, r: 'Tu rentres chez toi.' },
  ] },
```

- `sms: 'Numéro inconnu'` fait arriver l'événement comme un message sur le téléphone. `avec: 'famille'` (ou `partenaire`, `enfant`, `parents`, `ami`) affiche ces proches à côté du perso.
- `major: 3` affiche « Décision majeure · se joue sur 3 jours ». Enchaînez les étapes avec `next: 'id_suivant'` et `days: 1` (temps adaptatif).
- Effets disponibles : toutes les stats (`bonheur`, `sante`, `intel`, `apparence`, `forme`, `art`, `crime`, `charisme`, `reputation`, `karma`, `notoriete`), `money`, `recherche`, `casier`, `arrest`, `job`, `jobLvl`, `logement`, `lieu`, `statut`, `flag`, `rel`, `couple`, `enfant`, `mort`, `queue`…
- Textes : `{prenom}`, `{ami}`, `{partenaire}`, `{pays}`, `{€x}` (montant), `{e}` (accord féminin), `{il|elle}`.

Lancez `npm run sim` après chaque ajout : le script signale les textes non remplacés et les effets inconnus.

## Sauvegarde

Locale (`localStorage`), dans `src/engine/save.js`. C'est le seul fichier à remplacer pour brancher une base de données plus tard.
