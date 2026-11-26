# Destino : feuille de route v0.9 → v1.0

Backlog issu du blueprint « DestinoLife Dev Blueprint » (25 novembre 2026), après audit du dépôt en v0.9.4.
Légende : **présent** (fonctionne, à préserver), **partiel** (existe mais superficiel), **absent**.

## Audit par axe

| Axe | État en v0.9.4 | Constat dans le code |
|---|---|---|
| B · PNJ autonomes | partiel | `relations[]` : prénom, âge, affection, confiance, `destin` à 21 ans pour les amis. Les PNJ vieillissent et meurent, mais ne changent jamais de vie seuls et n'ont aucune mémoire. Aucun lien entre PNJ. |
| G · Dynasties | partiel | `continueAsChild` transmet argent (80 %), biens et entreprises. Le parent décédé devient `mem.parent` : l'histoire des générations précédentes est perdue. Pas de grands-parents, oncles, cousins ni petits-enfants. |
| H · Ambitions | absent | Seuls les 24 succès persistants existent. Aucun objectif propre à une vie. |
| A · Banque, immobilier | partiel | Bourse, biens avec valeur, loyers, impôts, journal financier (v0.9.4). Pas de crédit, d'épargne, d'assurance ni de locataires. |
| E · Compétences | absent | 11 statistiques générales uniquement. |
| Carrières, études | partiel | 30 métiers en échelles de niveaux ; diplômes du brevet au doctorat, sans filières, stages ni employeurs. |
| C · Entreprises | partiel | 7 types de commerces avec charges, employés et concurrence, mais des décisions communes à tous les secteurs. |
| D · Réputation | partiel | `reputation`, `karma`, `notoriete` globaux. |
| F · Époques | absent | Toutes les vies commencent en 2026. |
| Téléphone | présent | Messages, Contacts, Instapic, Actus. Aucune application métier. |
| Living Stories | partiel | Plus de 400 événements écrits, avec anti-répétition et tentations par métier. Peu de causalité entre années. |
| Stabilité | partiel | Sauvegarde locale signée, aucun export ni import. |

## Phases

Chaque phase est une version jouable, testée (simulation de 300 vies, anti-triche) et publiée.

| Version | Contenu | Dépendances |
|---|---|---|
| **v0.10** Relations & Dynasties ✅ | PNJ autonomes (traits, métier, couple, enfants, fortune), mémoire bornée, sentiments (admiration, rancune, jalousie), liens entre PNJ, initiatives des proches (offre d'emploi, prêt, mariage, réconciliation) ; famille élargie, arbre familial, archives de dynastie, prestige du nom ; ambitions de vie. | aucune |
| **v0.11** Banque & Immobilier ✅ | Compte et épargne, crédits immobilier, auto et pro avec échéancier, découvert, assurances, locataires et vacance locative, patrimoine net ; export et import de la sauvegarde. | journal financier (v0.9.4) |
| **v0.12** Compétences & Carrières ✅ | Catalogue de compétences (XP, niveaux, plafonds), filières d'études, stages, employeurs et collègues persistants, voies expert, manager ou indépendant. | v0.10 (collègues = PNJ) |
| v0.13 Business Tycoon | Décisions propres à chaque secteur, nouveaux secteurs (hôtel, agence, boîte de nuit, club). | v0.11 (crédit pro) |
| v0.14 Réputation & Entertainment | Réputations contextuelles ; contrats, agents, compétitions, reconversion des artistes et sportifs. | v0.12 |
| v0.15 Digital Life | Applications Banque, Immo, Emploi, Rencontres, Mail et Santé, branchées sur les services existants. | v0.11, v0.12 |
| v0.16 Historical Life | Année de naissance au choix (1950 à 2025), catalogues datés, téléphone selon l'époque. | toutes les données datées |
| v0.17 Living Stories & Lifestyle | Événements procéduraux causaux, logements, véhicules, loisirs. | v0.10 |
| **v1.0** | Polish, équilibrage, stabilité. | — |

## Règles appliquées à chaque phase

- Rien de ce qui existe n'est réécrit : on étend les objets du moteur et l'on migre les sauvegardes de façon idempotente.
- Toute écriture d'état passe par le moteur, donc par le coffre-fort Hitman ; aucun solde ou contrat dupliqué.
- Une fonctionnalité n'est annoncée que si elle est accessible depuis une nouvelle vie.
- La simulation de 300 vies vérifie la cohérence : identifiants uniques, âges, aucun mort qui écrit.
