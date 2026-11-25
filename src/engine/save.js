// Sauvegarde locale (localStorage). Une base de données pourra remplacer ce module plus tard.
const KEY = 'destino.save.v1';

export function save(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) {
    console.warn('Sauvegarde impossible', e);
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && s.v === 1 ? s : null;
  } catch {
    return null;
  }
}

export const clearSave = () => localStorage.removeItem(KEY);
