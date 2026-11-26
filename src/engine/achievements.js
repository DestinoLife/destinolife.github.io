// Suivi persistant des défis & succès (localStorage).
import { ACHIEVEMENTS } from '../data/achievements.js';
import { sign, stringify, parse } from './hitman.js';

const KEY = 'destino.ach.v1';

export function loadAchievements() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const m = parse(raw);
    if (!m || typeof m !== 'object' || Array.isArray(m)) return {};
    const h = m._h;
    delete m._h;
    // Signature absente (ancienne version) acceptée ; signature fausse = fichier retouché, on l'ignore
    if (h !== undefined && h !== sign(stringify(m))) return {};
    const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
    return Object.fromEntries(Object.entries(m).filter(([k, v]) => ids.has(k) && v && typeof v === 'object'));
  } catch {
    return {};
  }
}

function saveAchievements(map) {
  try {
    const json = stringify(map);
    localStorage.setItem(KEY, json.length > 2 ? json.slice(0, -1) + ',"_h":' + stringify(sign(json)) + '}' : '{"_h":' + stringify(sign(json)) + '}');
  } catch {
    // ignore storage quota errors
  }
}

export function checkAchievements(s) {
  if (!s || s.hitman) return []; // vie condamnée par Hitman : plus aucun succès
  if (s.logement === 'rue' && !s.chezParents) s.flags.vecu_rue = true;
  const unlocked = loadAchievements();
  const newly = [];
  for (const a of ACHIEVEMENTS) {
    if (unlocked[a.id]) continue;
    try {
      if (a.test(s)) {
        unlocked[a.id] = { at: Date.now(), who: `${s.id.prenom} ${s.id.nom}`, age: s.age };
        newly.push(a);
      }
    } catch {
      // ignore safe check error
    }
  }
  if (newly.length) saveAchievements(unlocked);
  return newly;
}

export function achievementsSummary() {
  const unlocked = loadAchievements();
  const list = ACHIEVEMENTS.map((a) => ({ ...a, done: !!unlocked[a.id], meta: unlocked[a.id] || null }));
  const count = list.filter((x) => x.done).length;
  const pts = list.filter((x) => x.done).reduce((t, x) => t + x.pts, 0);
  const maxPts = list.reduce((t, x) => t + x.pts, 0);
  return { list, count, total: list.length, pts, maxPts };
}
