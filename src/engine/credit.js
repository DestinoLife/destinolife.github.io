// v0.11 : achat à crédit. Le prêt et l'achat forment une seule opération : les fonds vont directement au vendeur,
// donc le joueur ne touche jamais l'argent emprunté. Le bien acheté est la garantie de la banque.
import { euros } from './rng.js';
import { offre, ouvrirPret, CREDITS } from './bank.js';
import { buyAsset, createBusiness } from './economy.js';
import { moveTo } from './flow.js';
import { ASSETS, BUSINESS } from '../data/world.js';
import { HOUSING } from '../data/housing.js';

// Cible d'un crédit : « bien:t2 », « logement:maison », « biz:resto »
export function cibleCredit(cible) {
  const [k, id] = String(cible).split(':');
  if (k === 'bien' && Object.hasOwn(ASSETS, id) && (ASSETS[id].car || ASSETS[id].loc)) return { k, id, type: ASSETS[id].car ? 'auto' : 'immo', prix: ASSETS[id].prix, nom: ASSETS[id].nom };
  if (k === 'logement' && Object.hasOwn(HOUSING, id) && HOUSING[id].achat) return { k, id, type: 'immo', prix: HOUSING[id].achat, nom: HOUSING[id].nom };
  if (k === 'biz' && Object.hasOwn(BUSINESS, id)) return { k, id, type: 'pro', prix: BUSINESS[id].prix, nom: BUSINESS[id].nom };
  return null;
}

// Offre affichée (lecture seule) : apport et durée par défaut si non précisés
export function simuler(s, cible, apport, duree) {
  const c = cibleCredit(cible);
  if (!c) return null;
  const C = CREDITS[c.type];
  const a = Number.isFinite(apport) ? apport : Math.min(Math.max(0, s.money), Math.ceil(c.prix * Math.max(C.apport, 0.1)));
  const d = C.durees.includes(duree) ? duree : C.durees[Math.floor(C.durees.length / 2)];
  return { c, C, o: offre(s, c.type, c.prix, a, d) };
}

export function souscrire(s, cible, apport, duree) {
  const c = cibleCredit(cible);
  if (!c) return { r: '', err: true };
  const o = offre(s, c.type, c.prix, Math.trunc(Number(apport)), Math.trunc(Number(duree)));
  if (o.ok !== true) return { r: o.ok, err: true };
  const avant = s.money;
  s.money += o.montant; // versé au vendeur : l'achat ci-dessous le dépense aussitôt
  let r;
  let ref;
  if (c.k === 'bien') {
    r = buyAsset(s, c.id);
    ref = { k: 'bien', id: r?.uid };
  } else if (c.k === 'logement') {
    r = moveTo(s, c.id, true, true);
    ref = { k: 'logement', id: c.id };
  } else {
    r = createBusiness(s, c.id);
    ref = { k: 'biz', id: r?.uid };
  }
  if (!r || r.err) {
    s.money = avant;
    return r?.err ? r : { r: 'Achat impossible.', err: true };
  }
  ouvrirPret(s, o, c.nom, ref);
  return { r: `${r.r} Financé à crédit : ${euros(o.mensualite)} par mois pendant ${o.duree} ans.`, good: true };
}
