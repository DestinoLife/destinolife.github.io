# Destino

Jeu de simulation de vie en 2D (PEGI 18). Chaque choix fait évoluer le personnage, son décor et son destin.

## Lancer le jeu

```bash
npm install
npm run dev      # http://localhost:5173  (ajoute ?dev pour le compteur de FPS)
npm run build    # version de production dans dist/
npm run sim      # simule 300 vies au hasard pour détecter les bugs
```

## Structure

| Dossier | Rôle |
| --- | --- |
| `src/data/events.js` | **Banque d'événements** (le cœur du jeu). Ajoutez-en ici. |
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

- `major: 3` affiche « Décision majeure · se joue sur 3 jours ». Enchaînez les étapes avec `next: 'id_suivant'` et `days: 1` (temps adaptatif).
- Effets disponibles : toutes les stats (`bonheur`, `sante`, `intel`, `apparence`, `forme`, `art`, `crime`, `charisme`, `reputation`, `karma`, `notoriete`), `money`, `recherche`, `casier`, `arrest`, `job`, `jobLvl`, `logement`, `lieu`, `statut`, `flag`, `rel`, `couple`, `enfant`, `mort`, `queue`…
- Textes : `{prenom}`, `{ami}`, `{partenaire}`, `{pays}`, `{€x}` (montant), `{e}` (accord féminin), `{il|elle}`.

Lancez `npm run sim` après chaque ajout : le script signale les textes non remplacés et les effets inconnus.

## Sauvegarde

Locale (`localStorage`), dans `src/engine/save.js`. C'est le seul fichier à remplacer pour brancher une base de données plus tard.
