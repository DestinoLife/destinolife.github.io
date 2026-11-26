// v0.13 « Business Tycoon » : chaque secteur a son modèle économique et ses décisions propres.
// Socle commun : demande (réputation, qualité, économie, prix), capacité, coûts variables et fixes visibles.
// Les décisions modifient des états persistants (qualité, membres, artistes, division…), jamais un multiplicateur opaque.
import { rand } from './hitman.js';
import { rnd, pick, chance, clamp, euros } from './rng.js';
import { addLog } from './core.js';
import { nameFor } from '../data/identity.js';

export const PRIX = { bas: { nom: 'Prix bas', k: 0.85 }, moyen: { nom: 'Prix du marché', k: 1 }, haut: { nom: 'Prix élevés', k: 1.2 } };
const px = (b) => b.px || 1;
const elast = (b, e) => Math.pow(px(b), -e);
const bruit = () => 0.88 + rand() * 0.24;
// Attractivité commune : réputation, qualité, conjoncture et chocs d'événements
const attrait = (b, E) => (0.45 + b.rep / 125 + (b.qual ?? 50) / 250) * E.mult * (b.choc || 1);
const ligne = (nom, v) => [nom, Math.round(v)];

// Modèle « commerce » partagé : clients potentiels, capacité, panier moyen, coût unitaire
function commerce(b, E, P, m = {}) {
  const n = b.niveau;
  const demande = P.clients * n ** 0.85 * attrait(b, E) * (m.attract || 1) * elast(b, P.e) * bruit();
  const cap = P.cap * n * (m.cap || 1);
  const ventes = Math.round(Math.min(demande, cap, m.stock ?? Infinity));
  const ca = Math.round(ventes * P.panier * px(b) * (m.panier || 1));
  const lignes = [
    ligne(P.lv || 'Coûts variables', ventes * P.cv * (m.cv || 1)),
    ligne('Loyer et charges', P.fixe * 0.45 * n ** 0.9 * (m.loyer || 1)),
    ligne('Salaires', P.fixe * 0.55 * n ** 0.9 * (b.salaires || 1)),
    ...(m.lignes || []),
  ];
  return { ventes, demande: Math.round(demande), cap: Math.round(cap), ca, lignes };
}

// Hygiène (restauration) : se dégrade, un contrôle sanitaire peut fermer l'établissement
function hygiene(s, b, r) {
  const x = b.sx;
  x.hyg = clamp((x.hyg ?? 80) - rnd(8, 14));
  if (x.hyg < 40 && chance(0.3)) {
    r.ca = Math.round(r.ca * 0.83);
    r.lignes.push(ligne('Amende sanitaire', 5000));
    b.rep = clamp(b.rep - 15);
    addLog(s, `Contrôle sanitaire chez ${b.nom} : fermeture administrative de deux mois et 5 000 € d’amende.`);
  }
}
const FOURN = { grossiste: { nom: 'Grossiste discount', cv: 0.85, qual: 30 }, local: { nom: 'Producteurs locaux', cv: 1, qual: 60 }, premium: { nom: 'Produits haut de gamme', cv: 1.15, qual: 85 } };
const versQualite = (b, cible) => (b.qual = clamp(Math.round((b.qual ?? 50) + (cible - (b.qual ?? 50)) * 0.35)));

export const SECTEURS = {
  resto: {
    unite: 'couverts',
    init: (b) => Object.assign(b, { qual: 55, sx: { fourn: 'local', chef: false, hyg: 85 } }),
    annee(s, b, E) {
      const x = b.sx;
      versQualite(b, FOURN[x.fourn].qual + (x.chef ? 15 : 0));
      const r = commerce(b, E, { clients: 7000, cap: 9000, panier: 30, cv: 16.5, e: 2, fixe: 70000, lv: 'Matières premières' }, { cv: FOURN[x.fourn].cv, lignes: x.chef ? [ligne('Chef de cuisine', 10000)] : [] });
      hygiene(s, b, r);
      if (b.qual >= 80 && chance(0.25)) {
        b.rep = clamp(b.rep + 10);
        addLog(s, `Un critique gastronomique encense ${b.nom}. Les réservations explosent.`);
      }
      return r;
    },
    kpis: (b) => [['Qualité', `${b.qual}/100`], ['Fournisseurs', FOURN[b.sx.fourn].nom], ['Hygiène', `${b.sx.hyg}/100`], ['Chef', b.sx.chef ? 'Oui' : 'Non']],
    decisions: (b) => [
      { id: 'fourn', nom: 'Fournisseurs', choix: Object.entries(FOURN).map(([k, F]) => [k, F.nom]), val: b.sx.fourn },
      { id: 'chef', nom: b.sx.chef ? 'Se séparer du chef' : 'Recruter un vrai chef', cout: b.sx.chef ? 0 : 15000, aide: '15 000 € puis 10 000 €/an · qualité ▲' },
      { id: 'normes', nom: 'Mise aux normes d’hygiène', cout: 6000 * b.niveau, aide: 'Évite la fermeture administrative' },
    ],
  },
  kebab: {
    unite: 'repas',
    init: (b) => Object.assign(b, { qual: 45, sx: { fourn: 'grossiste', empl: 'quartier', livr: false, hyg: 80 } }),
    annee(s, b, E) {
      const x = b.sx;
      versQualite(b, FOURN[x.fourn].qual);
      const EM = { quartier: [1, 1], gare: [1.35, 1.5], centre: [1.2, 1.3] }[x.empl];
      const r = commerce(b, E, { clients: 11000, cap: 16000, panier: 10, cv: 5, e: 2.2, fixe: 41000, lv: 'Matières premières' }, { attract: EM[0] * (x.livr ? 1.3 : 1), loyer: EM[1], cv: FOURN[x.fourn].cv, cap: x.livr ? 1.4 : 1 });
      if (x.livr) r.lignes.push(ligne('Commission des plateformes de livraison', r.ca * 0.3 * 0.25));
      hygiene(s, b, r);
      return r;
    },
    kpis: (b) => [['Emplacement', { quartier: 'Quartier', gare: 'Près de la gare', centre: 'Centre-ville' }[b.sx.empl]], ['Livraison', b.sx.livr ? 'Oui (−25 % sur ces ventes)' : 'Non'], ['Qualité', `${b.qual}/100`], ['Hygiène', `${b.sx.hyg}/100`]],
    decisions: (b) => [
      { id: 'empl', nom: 'Emplacement (déménager : 15 000 €)', choix: [['quartier', 'Quartier'], ['gare', 'Gare'], ['centre', 'Centre']], val: b.sx.empl },
      { id: 'livr', nom: b.sx.livr ? 'Arrêter la livraison' : 'Passer sur les applis de livraison', cout: 0, aide: 'Plus de volume, 25 % de commission' },
      { id: 'fourn', nom: 'Fournisseurs', choix: Object.entries(FOURN).map(([k, F]) => [k, F.nom]), val: b.sx.fourn },
      { id: 'normes', nom: 'Mise aux normes d’hygiène', cout: 4000 * b.niveau },
    ],
  },
  vetements: {
    unite: 'pièces',
    init: (b) => Object.assign(b, { sx: { coll: 'moyenne', style: 'basique', web: false } }),
    annee(s, b, E) {
      const x = b.sx;
      const stock = Math.round(3400 * b.niveau ** 0.85 * { petite: 0.7, moyenne: 1, grosse: 1.4 }[x.coll] * (x.web ? 1.2 : 1));
      const tendance = x.style === 'tendance' ? 0.6 + rand() * 1 : 1;
      if (x.style === 'tendance') b.rep = clamp(b.rep + (tendance > 1.1 ? 6 : -3));
      const r = commerce(b, E, { clients: 3400, cap: 1e9, panier: 50, cv: 0, e: 2, fixe: 55000 }, { attract: tendance * (x.web ? 1.35 : 1), stock });
      const invendus = stock - r.ventes;
      r.lignes[0] = ligne('Achat de la collection', stock * 25);
      if (invendus > 0) r.ca += Math.round(invendus * 25 * 0.3);
      if (x.web) r.lignes.push(ligne('Logistique de la boutique en ligne', r.ventes * 0.3 * 4));
      r.extra = `${invendus} invendus soldés`;
      return r;
    },
    kpis: (b) => [['Collection', { petite: 'Petite', moyenne: 'Moyenne', grosse: 'Grosse' }[b.sx.coll]], ['Style', b.sx.style === 'tendance' ? 'Tendance (risqué)' : 'Basiques (stable)'], ['Boutique en ligne', b.sx.web ? 'Oui' : 'Non']],
    decisions: (b) => [
      { id: 'coll', nom: 'Taille de la collection', choix: [['petite', 'Petite'], ['moyenne', 'Moyenne'], ['grosse', 'Grosse']], val: b.sx.coll },
      { id: 'style', nom: 'Style', choix: [['basique', 'Basiques'], ['tendance', 'Tendance']], val: b.sx.style },
      ...(b.sx.web ? [] : [{ id: 'web', nom: 'Ouvrir une boutique en ligne', cout: 15000, aide: 'Clients ▲, frais d’envoi' }]),
    ],
  },
  garage: {
    unite: 'interventions',
    init: (b) => Object.assign(b, { qual: 50, sx: { devis: 'honnete', lots: 0 } }),
    annee(s, b, E) {
      const x = b.sx;
      const gonfle = x.devis === 'gonfle';
      const r = commerce(b, E, { clients: 500, cap: 700, panier: 300, cv: 150, e: 1.9, fixe: 53000, lv: 'Pièces détachées' }, { panier: gonfle ? 1.25 : 1 });
      if (gonfle) {
        b.rep = clamp(b.rep - 12);
        if (chance(0.35)) {
          r.lignes.push(ligne('Litige client (devis gonflés)', 20000));
          addLog(s, `Un client attaque ${b.nom} pour des devis gonflés : 20 000 € à régler.`);
        }
      } else b.rep = clamp(b.rep + 2);
      if (x.lots) {
        r.lignes.push(ligne('Achat de voitures d’occasion', x.lots * 30000));
        const k = 0.85 + b.rep / 250 + (b.qual - 50) / 400 + rand() * 0.25;
        r.ca += Math.round(x.lots * 30000 * k);
        r.extra = `${x.lots * 6} voitures d’occasion revendues`;
        x.lots = 0;
      }
      b.qual = clamp((b.qual ?? 50) - 3);
      return r;
    },
    kpis: (b) => [['Devis', b.sx.devis === 'gonfle' ? 'Gonflés (risqué)' : 'Honnêtes'], ['Savoir-faire', `${b.qual}/100`], ['Lots d’occasion prévus', String(b.sx.lots)]],
    decisions: (b) => [
      { id: 'devis', nom: 'Politique de devis', choix: [['honnete', 'Honnêtes'], ['gonfle', 'Gonflés']], val: b.sx.devis },
      { id: 'lot', nom: 'Acheter un lot de 6 voitures d’occasion', cout: 0, aide: '30 000 € payés en fin d’année, revendus selon ta réputation', off: b.sx.lots >= 2 ? 'Deux lots par an maximum' : null },
      { id: 'former', nom: 'Former les mécaniciens', cout: 8000, aide: 'Savoir-faire ▲' },
    ],
  },
  salle: {
    unite: 'abonnés',
    init: (b) => Object.assign(b, { qual: 50, sx: { membres: 300, equip: 80, coachs: 0 } }),
    annee(s, b, E) {
      const x = b.sx;
      x.equip = clamp(x.equip - rnd(9, 14));
      const attr = clamp(0.42 - (b.qual - 50) / 400 - x.coachs * 0.05 + (x.equip < 40 ? 0.12 : 0) + (px(b) - 1) * 0.3, 0.12, 0.7);
      const nouveaux = 130 * b.niveau ** 0.85 * attrait(b, E) * elast(b, 1.3) * bruit();
      const cap = 700 * b.niveau;
      x.membres = Math.round(Math.min(cap, x.membres * (1 - attr) + nouveaux));
      const ca = Math.round(x.membres * 396 * px(b));
      b.qual = clamp(Math.round(40 + x.coachs * 10 + x.equip / 5));
      const lignes = [ligne('Entretien et énergie', x.membres * 60), ligne('Loyer et charges', 84000 * 0.45 * b.niveau ** 0.9), ligne('Salaires', 84000 * 0.55 * b.niveau ** 0.9 * (b.salaires || 1))];
      if (x.coachs) lignes.push(ligne(`Coachs (${x.coachs})`, x.coachs * 22000));
      return { ventes: x.membres, cap, ca, lignes, extra: `désabonnement ${Math.round(attr * 100)} %/an` };
    },
    kpis: (b) => [['Abonnés', String(b.sx.membres)], ['Équipement', `${b.sx.equip}/100`], ['Coachs', String(b.sx.coachs)], ['Qualité', `${b.qual}/100`]],
    decisions: (b) => [
      { id: 'equip', nom: 'Renouveler l’équipement', cout: 20000 * b.niveau, aide: 'Sous 40/100, les abonnés partent' },
      { id: 'coach', nom: 'Recruter un coach', cout: 0, aide: '22 000 €/an · fidélise les abonnés', off: b.sx.coachs >= 3 ? 'Trois coachs maximum' : null },
      ...(b.sx.coachs ? [{ id: 'licencier_coach', nom: 'Se séparer d’un coach', cout: 0 }] : []),
    ],
  },
  label: {
    unite: 'sorties',
    noPrix: true,
    init: (b) => Object.assign(b, { sx: { art: [artiste(b), artiste(b)], promo: false } }),
    annee(s, b, E) {
      const x = b.sx;
      let ca = 0;
      const notes = [];
      for (const a of x.art) {
        const hit = chance(a.t * 0.35);
        const rev = Math.round(a.t * a.t * 250000 * (x.promo ? 1.4 : 1) * (hit ? 2.2 : 0.5 + rand() * 0.8) * E.mult);
        ca += rev;
        a.ans++;
        if (hit) notes.push(`${a.nom} cartonne`);
      }
      const lignes = [ligne('Royalties versées aux artistes (20 %)', ca * 0.2), ligne('Production des albums', x.art.length * 15000), ligne('Loyer et salaires', 55000 * b.niveau ** 0.9 * (b.salaires || 1))];
      if (x.promo) lignes.push(ligne('Promotion', x.art.length * 10000));
      for (const a of [...x.art]) if (a.ans >= 4 && a.t < 0.5 && chance(0.5)) {
        x.art = x.art.filter((y) => y !== a);
        addLog(s, `Fin de contrat : ${a.nom} quitte ${b.nom}.`);
      }
      if (notes.length) addLog(s, `${b.nom} : ${notes.join(', ')} !`);
      return { ventes: x.art.length, cap: 2 + b.niveau, ca, lignes };
    },
    kpis: (b) => [['Artistes', b.sx.art.map((a) => `${a.nom} (${Math.round(a.t * 100)})`).join(', ') || 'Aucun'], ['Promotion', b.sx.promo ? 'Oui' : 'Non']],
    decisions: (b) => [
      { id: 'signer', nom: 'Signer un artiste', cout: 25000, aide: 'Avance de 25 000 € · talent inconnu', off: b.sx.art.length >= 2 + b.niveau ? 'Agrandis le label pour signer plus' : null },
      { id: 'promo', nom: b.sx.promo ? 'Couper la promotion' : 'Financer la promotion', cout: 0, aide: '10 000 € par artiste et par an · ventes ×1,4' },
    ],
  },
  hotel: {
    unite: 'nuitées',
    init: (b) => Object.assign(b, { sx: { etat: 85, booking: false } }),
    annee(s, b, E) {
      const x = b.sx;
      x.etat = clamp(x.etat - rnd(7, 12));
      const cotier = ['Nice', 'Marseille', 'Montpellier', 'Bordeaux'].includes(s.id.ville) ? 1.15 : 1;
      const occ = clamp((0.27 + b.rep / 250 + (x.etat - 50) / 400) * E.mult * elast(b, 1.6) * cotier * bruit() + (x.booking ? 0.12 : 0), 0.08, 0.95) ;
      const chambres = 20 * b.niveau;
      const nuits = Math.round(chambres * 365 * occ);
      const ca = Math.round(nuits * 85 * px(b));
      const lignes = [ligne('Ménage, linge, petits-déjeuners', nuits * 30), ligne('Personnel et charges', 170000 * b.niveau ** 0.9 * (b.salaires || 1))];
      if (x.booking) lignes.push(ligne('Commission des plateformes (17 %)', ca * 0.45 * 0.17));
      b.qual = x.etat;
      return { ventes: nuits, cap: chambres * 365, ca, lignes, extra: `occupation ${Math.round(occ * 100)} %` };
    },
    kpis: (b) => [['Chambres', String(20 * b.niveau)], ['État des chambres', `${b.sx.etat}/100`], ['Plateformes de réservation', b.sx.booking ? 'Oui' : 'Non']],
    decisions: (b) => [
      { id: 'renover', nom: 'Rénover les chambres', cout: 40000 * b.niveau, aide: 'Avis et réservations ▲' },
      { id: 'booking', nom: b.sx.booking ? 'Quitter les plateformes' : 'Être sur les plateformes de réservation', cout: 0, aide: 'Occupation ▲, 17 % de commission sur une partie des nuits' },
    ],
  },
  agence: {
    unite: 'ventes',
    init: (b) => Object.assign(b, { qual: 50, sx: { neg: 0, mandats: 0 } }),
    annee(s, b, E) {
      const x = b.sx;
      x.mandats = Math.round(16 * b.niveau ** 0.85 * attrait(b, E) * elast(b, 1.8) * bruit());
      const transfo = clamp(0.55 + x.neg * 0.12 + (b.qual - 50) / 300, 0.3, 0.9);
      const ventes = Math.round(x.mandats * transfo);
      const prixMoyen = 250000 * (E.val ?? 1) ** 0.5;
      const ca = Math.round(ventes * prixMoyen * 0.05 * px(b));
      const lignes = [ligne('Annonces et diffusion', x.mandats * 1500), ligne('Loyer et salaires', 70000 * b.niveau ** 0.9 * (b.salaires || 1))];
      if (x.neg) lignes.push(ligne(`Négociateurs (${x.neg})`, x.neg * 26000));
      return { ventes, cap: x.mandats, ca, lignes, extra: `${x.mandats} mandats, commission ${(5 * px(b)).toFixed(1).replace('.', ',')} %` };
    },
    kpis: (b) => [['Mandats l’an dernier', String(b.sx.mandats)], ['Négociateurs', String(b.sx.neg)], ['Commission', `${(5 * px(b)).toFixed(1).replace('.', ',')} %`]],
    decisions: (b) => [
      { id: 'neg', nom: 'Recruter un négociateur', cout: 0, aide: '26 000 €/an · plus de mandats transformés', off: b.sx.neg >= 2 * b.niveau ? 'Agrandis l’agence d’abord' : null },
      ...(b.sx.neg ? [{ id: 'licencier_neg', nom: 'Se séparer d’un négociateur', cout: 0 }] : []),
    ],
  },
  boite: {
    unite: 'entrées',
    init: (b) => Object.assign(b, { sx: { prog: 'commercial', secu: 1, dj: false } }),
    annee(s, b, E) {
      const x = b.sx;
      const P = { commercial: 1, electro: 0.92, hiphop: 1.12 }[x.prog];
      if (x.prog === 'electro') b.rep = clamp(b.rep + 4);
      const parNuit = Math.min(300 * b.niveau, 105 * b.niveau ** 0.85 * attrait(b, E) * P * (x.dj ? 1.15 : 1) * elast(b, 1.8) * bruit());
      const entrees = Math.round(parNuit * 140);
      let ca = Math.round(entrees * 32 * px(b));
      const lignes = [ligne('Boissons et consommables', entrees * 14), ligne('Licence, son, personnel', 210000 * b.niveau ** 0.9 * (b.salaires || 1)), ligne(`Sécurité (${x.secu} équipe${x.secu > 1 ? 's' : ''})`, x.secu * 24000)];
      if (x.dj) {
        lignes.push(ligne('DJ star (une date)', 30000));
        b.rep = clamp(b.rep + 4);
        x.dj = false;
      }
      if (chance(clamp(0.28 - x.secu * 0.08 + (x.prog === 'hiphop' ? 0.08 : 0), 0.02, 0.45))) {
        ca = Math.round(ca * 0.8);
        lignes.push(ligne('Amende et frais après incident', 10000));
        b.rep = clamp(b.rep - (x.secu ? 10 : 18));
        addLog(s, `Bagarre devant ${b.nom} : fermeture administrative de six semaines.`);
      }
      return { ventes: entrees, cap: 300 * b.niveau * 140, ca, lignes };
    },
    kpis: (b) => [['Programmation', { commercial: 'Généraliste', electro: 'Électro', hiphop: 'Hip-hop' }[b.sx.prog]], ['Sécurité', `${b.sx.secu} équipe${b.sx.secu > 1 ? 's' : ''}`], ['DJ star réservé', b.sx.dj ? 'Oui' : 'Non']],
    decisions: (b) => [
      { id: 'prog', nom: 'Programmation', choix: [['commercial', 'Généraliste'], ['electro', 'Électro'], ['hiphop', 'Hip-hop']], val: b.sx.prog },
      { id: 'secu', nom: 'Équipes de sécurité', choix: [['0', 'Aucune'], ['1', '1'], ['2', '2'], ['3', '3']], val: String(b.sx.secu) },
      { id: 'dj', nom: 'Réserver un DJ star cette année', cout: 0, aide: '30 000 € · affluence et réputation ▲', off: b.sx.dj ? 'Déjà réservé' : null },
    ],
  },
  club: {
    unite: 'matchs',
    init: (b) => Object.assign(b, { sx: { div: 4, eq: 45 + rnd(0, 10), classement: null } }),
    annee(s, b, E) {
      const x = b.sx;
      const R = { 1: 2200000, 2: 650000, 3: 240000, 4: 100000 }[x.div];
      const W = { 1: 2500000, 2: 740000, 3: 250000, 4: 80000 }[x.div];
      // Le public vient voir une équipe : sans effectif, la billetterie s'effondre (vendre ses joueurs n'est pas gratuit)
      const recettes = Math.round(R * Math.sqrt(attrait(b, E)) * (0.4 + x.eq / 85) * px(b) * elast(b, 1.4) * bruit());
      const sponsors = Math.round(R * 0.3 * (b.rep / 50) * E.mult);
      const lignes = [ligne('Masse salariale des joueurs', W * (x.eq / 50) ** 1.5), ligne('Stade et encadrement', 30000 * b.niveau ** 0.9 * (b.salaires || 1))];
      const perf = x.eq + (b.rep - 50) / 5 + rnd(-18, 18);
      x.classement = perf >= 68 ? 'montée' : perf <= 35 ? 'relégation' : 'maintien';
      if (x.classement === 'montée' && x.div > 1) {
        x.div--;
        b.rep = clamp(b.rep + 12);
        s.stats.notoriete = clamp(s.stats.notoriete + 3);
        addLog(s, `${b.nom} monte en division ${x.div} ! Le stade est en fête.`);
      } else if (x.classement === 'relégation' && x.div < 4) {
        x.div++;
        b.rep = clamp(b.rep - 10);
        addLog(s, `${b.nom} est relégué en division ${x.div}.`);
      }
      x.eq = clamp(x.eq - 4);
      return { ventes: 19, cap: 19, ca: recettes + sponsors, lignes, extra: `billetterie ${euros(recettes)}, sponsors ${euros(sponsors)}` };
    },
    kpis: (b) => [['Division', `D${b.sx.div}`], ['Niveau de l’effectif', `${b.sx.eq}/100`], ['Dernière saison', b.sx.classement || '—']],
    decisions: (b) => [
      { id: 'recruter', nom: 'Recruter un joueur', cout: 60000 * (5 - b.sx.div), aide: 'Effectif ▲ mais masse salariale ▲▲' },
      { id: 'vendre_joueur', nom: 'Vendre un joueur', cout: 0, aide: `Effectif ▼ · +${euros(40000 * (5 - b.sx.div))}`, off: b.sx.eq < 25 ? 'Effectif trop faible' : b.sx.venteAn === b.annees ? 'Un transfert sortant par saison' : null },
    ],
  },
};
function artiste(b) {
  const g = pick(['h', 'f']);
  return { nom: `${nameFor(pick(['france', 'maghreb', 'afrique_ouest', 'antilles']), g)}`, t: Math.round(clamp(0.2 + rand() * 0.6 + (b.rep - 50) / 250, 0.1, 0.95) * 100) / 100, ans: 0 };
}

// Décision sectorielle : modifie un état persistant, paie un investissement immédiat si besoin
export function decisionSecteur(s, b, id, v) {
  const S = SECTEURS[b.type];
  if (!S) return { r: '', err: true };
  b.sx ?? S.init(b);
  const d = S.decisions(b).find((x) => x.id === id);
  if (!d) return { r: '', err: true };
  if (d.off) return { r: d.off, err: true };
  if (d.choix && !d.choix.some(([k]) => k === v)) return { r: '', err: true };
  const cout = (id === 'empl' && v !== b.sx.empl ? 15000 : 0) + (d.cout || 0);
  if (d.choix && v === d.val) return { r: 'C’est déjà le cas.', err: true };
  if (s.money < cout) return { r: `Il te faut ${euros(cout)}.`, err: true };
  s.money -= cout;
  b.investi += cout;
  const x = b.sx;
  const res = (r) => ({ r, good: true });
  switch (id) {
    case 'fourn': x.fourn = v; return res(`Nouveaux fournisseurs : ${FOURN[v].nom.toLowerCase()}.`);
    case 'chef': x.chef = !x.chef; return res(x.chef ? 'Un chef talentueux prend les fourneaux.' : 'Le chef s’en va. La cuisine se simplifie.');
    case 'normes': x.hyg = 100; return res('Cuisine aux normes : l’inspecteur peut venir.');
    case 'empl': x.empl = v; return res('Déménagement terminé : nouvelle adresse, nouveaux clients.');
    case 'livr': x.livr = !x.livr; return res(x.livr ? 'Tu es sur les applis : les commandes affluent.' : 'Fini la livraison.');
    case 'coll': x.coll = v; return res('La taille de la prochaine collection est fixée.');
    case 'style': x.style = v; return res(v === 'tendance' ? 'Pari sur la tendance : ça passe ou ça casse.' : 'Retour aux basiques qui se vendent toujours.');
    case 'web': x.web = true; return res('La boutique en ligne est ouverte.');
    case 'devis': x.devis = v; return res(v === 'gonfle' ? 'Les factures grimpent… la réputation baissera.' : 'Devis honnêtes : la confiance revient doucement.');
    case 'lot': x.lots++; return res('Lot commandé : 30 000 € à régler en fin d’année, revente selon ta réputation.');
    case 'former': b.qual = clamp((b.qual ?? 50) + 15); return res('Tes mécaniciens montent en compétence.');
    case 'equip': x.equip = 100; return res('Machines neuves : les abonnés adorent.');
    case 'coach': x.coachs++; return res('Un coach rejoint l’équipe.');
    case 'licencier_coach': x.coachs = Math.max(0, x.coachs - 1); return res('Un coach s’en va.');
    case 'signer': { const a = artiste(b); x.art.push(a); return res(`${a.nom} signe chez ${b.nom}.`); }
    case 'promo': x.promo = !x.promo; return res(x.promo ? 'Campagnes de promotion lancées.' : 'Promotion coupée.');
    case 'renover': x.etat = 100; return res('Chambres rénovées : les avis s’envolent.');
    case 'booking': x.booking = !x.booking; return res(x.booking ? 'Hôtel visible sur les plateformes.' : 'Tu reprends la main sur tes réservations.');
    case 'neg': x.neg++; return res('Un négociateur rejoint l’agence.');
    case 'licencier_neg': x.neg = Math.max(0, x.neg - 1); return res('Un négociateur s’en va.');
    case 'prog': x.prog = v; return res('Nouvelle programmation annoncée.');
    case 'secu': x.secu = Number(v); return res('Sécurité ajustée.');
    case 'dj': x.dj = true; return res('Un DJ star est réservé pour cette saison.');
    case 'recruter': x.eq = clamp(x.eq + 6); return res('Nouvelle recrue : l’effectif progresse.');
    case 'vendre_joueur': {
      const m = 40000 * (5 - x.div);
      x.eq = clamp(x.eq - 6);
      x.venteAn = b.annees;
      s.money += m;
      b.investi = Math.max(0, b.investi - m);
      return res(`Joueur vendu ${euros(m)}.`);
    }
  }
  return { r: '', err: true };
}
