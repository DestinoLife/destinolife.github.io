// Sauvegarde locale (localStorage), signée par Hitman. Une base de données pourra remplacer ce module plus tard.
import { sign, stringify, parse, comptaOk } from './hitman.js';
import { ASSETS, BUSINESS } from '../data/world.js';
import { CAREERS, DIPLOMES } from '../data/careers.js';
import { AMBITIONS } from '../data/ambitions.js';
import { SKILLS, FILIERES } from '../data/skills.js';

const KEY = 'destino.save.v1';
const MARK = 'destino.hm'; // présent dès qu'une sauvegarde signée a été écrite sur ce navigateur
const DEAD = 'destino.dead';
const JOURNAUX = 'destino.hm2'; // vies qui ont un journal financier : le supprimer d'une sauvegarde = fraude // empreintes des vies terminées : on ne ressuscite pas en recollant une vieille sauvegarde
const lifeKey = (s) => `${s.birthT}|${s.gen}|${s.id?.prenom}|${s.id?.nom}`;
const listOf = (k) => { try { const d = parse(localStorage.getItem(k) || '[]'); return Array.isArray(d) ? d : []; } catch { return []; } };
const deadList = () => { try { const d = parse(localStorage.getItem(DEAD) || '[]'); return Array.isArray(d) ? d : []; } catch { return []; } };

let issue = null;
/** Raison d'une fraude constatée au dernier chargement (sauvegarde retouchée ou restaurée), sinon null. */
export const saveIssue = () => issue;

export function save(s, json0) {
  try {
    if (!s.vivant) {
      const d = deadList();
      if (!d.includes(lifeKey(s))) localStorage.setItem(DEAD, stringify([...d, lifeKey(s)].slice(-200)));
    } else if (deadList().includes(lifeKey(s))) return; // onglet périmé : cette vie est déjà terminée ailleurs
    const json = json0 || stringify(s);
    // La signature est écrite dans la même entrée (atomique, même avec plusieurs onglets)
    localStorage.setItem(KEY, json.slice(0, -1) + ',"_h":' + stringify(sign(json)) + '}');
    localStorage.setItem(MARK, '1');
    if (s.compta && !listOf(JOURNAUX).includes(lifeKey(s))) localStorage.setItem(JOURNAUX, stringify([...listOf(JOURNAUX), lifeKey(s)].slice(-200)));
  } catch (e) {
    console.warn('Sauvegarde impossible', e);
  }
}

const shapeOk = (s) => s && typeof s === 'object' && s.v === 1 && s.id && typeof s.id === 'object' && s.stats && typeof s.stats === 'object' &&
  Array.isArray(s.relations) && s.justice && typeof s.justice === 'object' && Array.isArray(s.justice.casier) && Array.isArray(s.queue);

export function load() {
  issue = null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = parse(raw);
    if (!shapeOk(s)) return null;
    const h = s._h;
    delete s._h;
    if (h !== undefined) {
      if (h !== sign(stringify(s))) issue = 'Sauvegarde modifiée à la main';
    } else if (localStorage.getItem(MARK)) issue = 'Signature de la sauvegarde supprimée';
    if (!issue && s.vivant && deadList().includes(lifeKey(s))) issue = 'Restauration d’une vie déjà terminée';
    if (!issue && !s.compta && listOf(JOURNAUX).includes(lifeKey(s))) issue = 'Journal financier supprimé';
    if (!issue && !comptaOk(s)) issue = 'Journal financier falsifié (solde réel ≠ solde attendu)';
    return s;
  } catch {
    return null;
  }
}

export const clearSave = () => localStorage.removeItem(KEY);

// v0.11 : export et import. Le fichier exporté est la sauvegarde signée telle quelle ; à l'import elle passe
// par les mêmes contrôles qu'au chargement (signature, vie terminée, journal financier). En cas d'échec,
// la partie précédente est remise en place.
export const exporterSauvegarde = () => localStorage.getItem(KEY);
export function importerSauvegarde(txt) {
  let d;
  try {
    d = parse(String(txt));
  } catch {
    return 'Fichier illisible.';
  }
  if (!d || typeof d !== 'object' || d._h === undefined) return 'Ce fichier n’est pas une sauvegarde Destino signée.';
  const avant = localStorage.getItem(KEY);
  localStorage.setItem(KEY, String(txt));
  const s = load();
  const why = !s ? 'Sauvegarde invalide.' : issue;
  if (why) {
    if (avant) localStorage.setItem(KEY, avant);
    else localStorage.removeItem(KEY);
    issue = null;
    return why;
  }
  if (avant) localStorage.setItem(KEY + '.bak', avant);
  return null;
}

// Validation stricte d'un état chargé (après migration) : types, bornes et identifiants connus.
// Marges volontaires : seules les valeurs impossibles en jeu sont refusées.
const num = (v, a, b) => typeof v === 'number' && Number.isFinite(v) && v >= a && v <= b;
const own = (o, k) => typeof k === 'string' && Object.hasOwn(o, k);
export function validerEtat(s) {
  if (!num(s.money, -1e8, 1e9)) return 'argent';
  if (s.bourse != null && !num(s.bourse, 0, 1e9)) return 'bourse';
  if (s.sale != null && !num(s.sale, -1e8, 1e9)) return 'argent sale';
  if (!num(s.age, 0, 130)) return 'âge';
  if (s.energie != null && !num(s.energie, -1, 60)) return 'énergie';
  for (const k of Object.keys(s.stats)) if (!num(s.stats[k], -1, 101)) return `statistique ${k}`;
  if (s.etudes?.niveau != null && !DIPLOMES.includes(s.etudes.niveau)) return 'diplôme';
  if (s.carriere && !own(CAREERS, s.carriere.id)) return 'métier';
  for (const b of s.biens || []) if (!b || !own(ASSETS, b.id) || !num(b.valeur, 0, 1e9)) return 'patrimoine';
  for (const b of s.business || []) if (!b || !own(BUSINESS, b.type) || (b.valo != null && !num(b.valo, -1e9, 1e9)) || (b.px != null && !num(b.px, 0.8, 1.25))) return 'entreprise';
  if (!num(s.justice.prison, 0, 1000)) return 'peine de prison';
  // v0.10 : ambitions connues et en nombre limité, dettes des proches bornées
  if (s.amb && (!Array.isArray(s.amb.act) || s.amb.act.length > 3 || s.amb.act.some((a) => !own(AMBITIONS, a?.id)))) return 'ambition';
  for (const r of s.relations || []) if (r?.dette != null && !num(r.dette, 0, 1e7)) return 'dette d’un proche';
  // v0.12 : compétences connues et bornées, contrat de travail cohérent
  for (const [k, x] of Object.entries(s.comp || {})) if (!own(SKILLS, k) || !num(x, 0, 1500)) return 'compétence';
  if (s.carriere?.mult != null && !num(s.carriere.mult, 0.5, 1.8)) return 'salaire';
  if (s.etudes?.filiere != null && !own(FILIERES, s.etudes.filiere)) return 'filière';
  // v0.11 : banque (épargne plafonnée, crédits bornés)
  const b = s.banque;
  if (b) {
    if (!num(b.epargne, 0, 1e7) || !num(b.fiche, 0, 10) || !Array.isArray(b.prets) || b.prets.length > 8) return 'banque';
    for (const p of b.prets) if (!p || !num(p.reste, 0, 1e10) || !num(p.annuite, 0, 1e9) || !num(p.taux, 0, 0.5) || !num(p.ans, 0, 60)) return 'crédit';
    for (const m of Object.values(b.enfants || {})) if (!num(m, 0, 1e6)) return 'livret enfant';
  }
  return null;
}
