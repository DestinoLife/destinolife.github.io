// v0.10 : moteur des ambitions de vie (proposer, suivre, accomplir, abandonner sans pénalité).
import { clamp } from './rng.js';
import { addLog, apply, registerFx } from './core.js';
import { AMBITIONS, AGES_AMBITION, MAX_AMBITIONS } from '../data/ambitions.js';

const etat = (s) => (s.amb ??= { act: [], fini: [], ab: 0, perdu: 0 });
export const nomAmbition = (s, a) => {
  const A = AMBITIONS[a.id];
  return !A ? '' : typeof A.nom === 'function' ? A.nom(s, a) : A.nom;
};
export const progAmbition = (s, a) => AMBITIONS[a.id]?.prog?.(s, a) || '';

// Hachage simple : les suggestions restent les mêmes pendant toute une année (pas de tirage à chaque affichage)
const h = (str) => [...str].reduce((x, c) => (x * 31 + c.charCodeAt(0)) >>> 0, 7);

// Lecture seule : appelée pendant l'affichage, elle ne doit jamais modifier l'état (Hitman le vérifie).
const VIDE = { act: [], fini: [] };
export function suggestions(s, n = 3) {
  const st = s.amb || VIDE;
  const pris = new Set([...st.act, ...st.fini].map((a) => a.id));
  const out = [];
  for (const [id, A] of Object.entries(AMBITIONS)) {
    if (pris.has(id) || s.age < A.age[0] || s.age > A.age[1]) continue;
    const cible = A.cible ? A.cible(s) : null;
    if (A.cible && !cible) continue;
    const a = { id, deb: s.age, base: A.base?.(s) ?? 0, cible: cible?.id, n: 0 };
    try {
      if (!A.prop(s) || A.ok(s, a)) continue;
    } catch {
      continue;
    }
    const w = 1 + A.traits.filter((t) => s.traits.includes(t)).length;
    out.push({ a, score: w * ((h(`${id}:${s.age}:${s.gen}:${s.id.prenom}`) % 1000) + 1) });
  }
  return out.sort((x, y) => y.score - x.score).slice(0, n).map((x) => x.a);
}

export function adopterAmbition(s, id) {
  const st = etat(s);
  if (st.act.length >= MAX_AMBITIONS) return { r: `${MAX_AMBITIONS} ambitions à la fois, c’est déjà beaucoup.`, err: true };
  const a = suggestions(s, 99).find((x) => x.id === id);
  if (!a) return { r: 'Cette ambition n’est pas possible pour l’instant.', err: true };
  st.act.push(a);
  addLog(s, `Nouvelle ambition : ${nomAmbition(s, a)}.`);
  return { r: `Nouvelle ambition : ${nomAmbition(s, a)}.`, good: true };
}

export function abandonnerAmbition(s, id) {
  const st = etat(s);
  const i = st.act.findIndex((a) => a.id === id);
  if (i < 0) return { r: '', err: true };
  const [a] = st.act.splice(i, 1);
  st.ab++;
  addLog(s, `Tu renonces à « ${nomAmbition(s, a)} ». Les priorités changent, et c’est normal.`);
  return { r: 'Ambition abandonnée, sans regret.' };
}

// Vérifie les ambitions en cours : accomplies (récompense non financière) ou devenues impossibles (retirées sans pénalité)
export function checkGoals(s) {
  const st = s.amb;
  if (!st?.act?.length) return;
  for (const a of [...st.act]) {
    const A = AMBITIONS[a.id];
    const retire = () => st.act.splice(st.act.indexOf(a), 1);
    if (!A) {
      retire();
      continue;
    }
    if (A.cible && !s.relations.find((r) => r.id === a.cible)?.vivant) {
      retire();
      st.perdu++;
      addLog(s, `Ambition devenue impossible : ${nomAmbition(s, a)}.`);
      continue;
    }
    let ok = false;
    try {
      ok = !!A.ok(s, a);
    } catch {
      ok = false;
    }
    if (!ok) continue;
    retire();
    st.fini.push({ id: a.id, age: s.age, nom: nomAmbition(s, a) });
    s.stats.bonheur = clamp(s.stats.bonheur + 10);
    s.stats.karma = clamp(s.stats.karma + 2);
    addLog(s, `Ambition accomplie : ${nomAmbition(s, a)} !`);
    const fan = s.relations.filter((r) => r.vivant && r.rel >= 70 && r.age >= 10 && r.lien !== 'contact' && r.lien !== 'candidat').sort((x, y) => y.rel - x.rel)[0];
    if (fan) apply(s, { sms: { from: fan.prenom, txt: `J’ai appris pour « ${nomAmbition(s, a)} ». Je suis fier${fan.genre === 'f' ? 'e' : ''} de toi ❤️` } });
  }
}

export function goalsTick(s) {
  const st = etat(s);
  for (const a of st.act) if (a.id === 'heureux') a.n = s.stats.bonheur >= 75 ? (a.n || 0) + 1 : 0;
  checkGoals(s);
  if (AGES_AMBITION.includes(s.age) && st.act.length < MAX_AMBITIONS && suggestions(s).length && s.justice.prison === 0) s.queue.push('ambition_choix');
}

// Choix dans l'événement « ambition_choix » : index parmi les suggestions préparées dans s.tmp.sug
registerFx('ambition', (s, i) => {
  const id = s.tmp.sug?.[i];
  if (id) adopterAmbition(s, id);
});

// Bilan d'une vie pour l'écran de fin : une vie ordinaire peut être réussie
export function bilanVie(s) {
  const n = s.amb?.fini?.length || 0;
  const heureux = s.stats.bonheur >= 70;
  if (n >= 3) return 'Une vie accomplie';
  if (n >= 1 && heureux) return 'Une belle vie';
  if (n >= 1) return 'Une vie avec ses victoires';
  if (heureux) return 'Une vie simple et heureuse';
  return 'Une vie mouvementée';
}
