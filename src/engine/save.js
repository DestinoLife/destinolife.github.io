// Sauvegarde locale (localStorage), signée par Hitman. Une base de données pourra remplacer ce module plus tard.
import { sign, stringify, parse } from './hitman.js';

const KEY = 'destino.save.v1';
const MARK = 'destino.hm'; // présent dès qu'une sauvegarde signée a été écrite sur ce navigateur
const DEAD = 'destino.dead'; // empreintes des vies terminées : on ne ressuscite pas en recollant une vieille sauvegarde
const lifeKey = (s) => `${s.birthT}|${s.gen}|${s.id?.prenom}|${s.id?.nom}`;
const deadList = () => { try { const d = parse(localStorage.getItem(DEAD) || '[]'); return Array.isArray(d) ? d : []; } catch { return []; } };

let issue = null;
/** Raison d'une fraude constatée au dernier chargement (sauvegarde retouchée ou restaurée), sinon null. */
export const saveIssue = () => issue;

export function save(s) {
  try {
    if (!s.vivant) {
      const d = deadList();
      if (!d.includes(lifeKey(s))) localStorage.setItem(DEAD, stringify([...d, lifeKey(s)].slice(-200)));
    } else if (deadList().includes(lifeKey(s))) return; // onglet périmé : cette vie est déjà terminée ailleurs
    const json = stringify(s);
    // La signature est écrite dans la même entrée (atomique, même avec plusieurs onglets)
    localStorage.setItem(KEY, json.slice(0, -1) + ',"_h":' + stringify(sign(json)) + '}');
    localStorage.setItem(MARK, '1');
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
    return s;
  } catch {
    return null;
  }
}

export const clearSave = () => localStorage.removeItem(KEY);
