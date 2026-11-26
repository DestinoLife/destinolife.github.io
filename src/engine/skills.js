// v0.12 « Compétences & Carrières » : expérience par compétence (plafonnée chaque année), employeurs,
// collègues persistants, voies expert / manager / indépendant, stages et formation continue.
import { rnd, pick, chance, clamp, euros } from './rng.js';
import { addLog, registerFx, newPerson, careerHooks, salary, setCareer } from './core.js';
import { CAREERS, canApply } from '../data/careers.js';
import {
  SKILLS, SEUILS, NIVEAUX, CAP_AN, FORMATION, FILIERES, CURSUS_XP, METIER_XP, METIER_REQUIS, ACT_XP, TALENT_XP,
  EMPLOYEURS, TAILLES, CULTURES,
} from '../data/skills.js';

export const xpDe = (s, k) => s.comp?.[k] || 0;
export function niveau(s, k) {
  const x = xpDe(s, k);
  let n = 0;
  for (let i = 1; i < SEUILS.length; i++) if (x >= SEUILS[i]) n = i;
  return n;
}
const XP_MAX = SEUILS.at(-1) + 500;
const SALARIES = ['classique', 'police', 'militaire'];
export const estSalarie = (s) => !!s.carriere && SALARIES.includes(CAREERS[s.carriere.id]?.cat);

// Gain d'expérience : rendements décroissants avec le niveau et plafond annuel par compétence
export function gagner(s, k, xp) {
  if (!Object.hasOwn(SKILLS, k) || !(xp > 0)) return 0;
  s.comp ??= {};
  s.compAn ??= {};
  const lvl = niveau(s, k);
  const eff = Math.round(xp * (1 - lvl * 0.1));
  const g = Math.max(0, Math.min(eff, CAP_AN - (s.compAn[k] || 0), XP_MAX - xpDe(s, k)));
  if (!g) return 0;
  s.comp[k] = xpDe(s, k) + g;
  s.compAn[k] = (s.compAn[k] || 0) + g;
  const n = niveau(s, k);
  if (n > lvl) addLog(s, `Compétence : ${SKILLS[k]}, niveau ${NIVEAUX[n].toLowerCase()}.`);
  return g;
}
export function gagnerTout(s, map, f = 1) {
  let t = 0;
  for (const [k, v] of Object.entries(map || {})) t += gagner(s, k, Math.round(v * f));
  return t;
}
// Compétences clés d'un métier (les deux plus importantes) et leur niveau moyen
export const clesMetier = (id) => Object.entries(METIER_XP[id] || {}).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
export const niveauMetier = (s, id) => {
  const k = clesMetier(id);
  return k.length ? k.reduce((t, x) => t + niveau(s, x), 0) / k.length : 0;
};
export const meilleurNiveau = (s) => Math.max(0, ...Object.keys(s.comp || {}).map((k) => niveau(s, k)));

export function migrateSkills(s) {
  if (!s.comp) {
    s.comp = {};
    for (const [k, v] of Object.entries(TALENT_XP[s.talent] || {})) s.comp[k] = v;
    // Anciennes sauvegardes : l'expérience déjà acquise dans le métier actuel est reconnue
    if (s.carriere && METIER_XP[s.carriere.id]) for (const [k, v] of Object.entries(METIER_XP[s.carriere.id])) s.comp[k] = Math.min(XP_MAX, xpDe(s, k) + v * Math.min(6, s.carriere.annees || 0));
    if (s.carriere) for (const [k, n] of Object.entries(METIER_REQUIS[s.carriere.id] || {})) s.comp[k] = Math.max(xpDe(s, k), SEUILS[n]);
    if (s.etudes?.niveau === 'doctorat') s.comp.soin = Math.max(xpDe(s, 'soin'), SEUILS[3]);
  }
  s.compAn ??= {};
  if (s.carriere) s.carriere.mult ??= 1;
  return s;
}

// ---------- Embauche : employeur, salaire selon la taille, collègues ----------
function anciensCollegues(s) {
  for (const r of s.relations) if (r.lien === 'collegue') Object.assign(r, { lien: 'excollegue', chef: false });
  // On ne garde que les anciens collègues qui comptent
  const ex = s.relations.filter((r) => r.lien === 'excollegue');
  if (ex.length > 6) {
    const garder = new Set(ex.sort((a, b) => b.rel - a.rel).slice(0, 6));
    s.relations = s.relations.filter((r) => r.lien !== 'excollegue' || garder.has(r));
  }
}
export function choisirEmployeur(id, sauf) {
  const lst = (EMPLOYEURS[id] || []).map((x) => x.split('|')).filter(([n]) => n !== sauf);
  if (!lst.length) return null;
  const [nom, taille] = pick(lst);
  return { nom, taille, culture: pick(Object.keys(CULTURES)), sante: rnd(55, 85) };
}
function embauche(s, id, emp) {
  anciensCollegues(s);
  if (!id || !s.carriere) return;
  s.carriere.mult = 1;
  const e = emp || (EMPLOYEURS[id] ? choisirEmployeur(id) : null);
  if (!e) return;
  s.carriere.emp = e;
  s.carriere.mult = TAILLES[e.taille].mult;
  const chef = newPerson(s, 'collegue', { age: Math.max(25, s.age + rnd(6, 18)), rel: rnd(40, 60) });
  chef.chef = true;
  const pair = newPerson(s, 'collegue', { age: Math.max(18, s.age + rnd(-6, 8)), rel: rnd(45, 65) });
  s.relations.push(chef, pair);
}
careerHooks.push((s, id) => embauche(s, id, s.tmp?.empForce || null));

// ---------- Tour annuel ----------
export function skillsTick(s) {
  migrateSkills(s);
  s.compAn = {};
  if (s.annee) s.annee.nego = false;
  const e = s.etudes;
  if (e?.cursus && s.justice.prison === 0) {
    const map = ['fac', 'bts', 'master'].includes(e.cursus) ? FILIERES[e.filiere]?.xp : CURSUS_XP[e.cursus];
    gagnerTout(s, map);
  }
  const k = s.carriere;
  if (!k || s.justice.prison > 0) return;
  const f = k.voie === 'expert' || k.voie === 'freelance' ? 1.2 : 1;
  gagnerTout(s, METIER_XP[k.id], f);
  if (k.voie === 'manager') gagnerTout(s, { management: 45, leadership: 30 });
  if (k.emp) {
    const phase = s.eco?.phase;
    k.emp.sante = clamp(k.emp.sante + rnd(-8, 8) + (phase === 'krach' ? -14 : phase === 'recession' ? -7 : phase === 'boom' ? 5 : 0));
    s.stats.bonheur = clamp(s.stats.bonheur + (CULTURES[k.emp.culture]?.bonheur || 0));
    if (k.emp.sante < 20 && chance(0.45 * TAILLES[k.emp.taille].licenc)) s.queue.push('licenciement_eco');
    else if (meilleurNiveau(s) >= 4 && chance(0.12)) s.queue.push('chasseur_tete');
  }
  if (estSalarie(s) && !k.voie && !k.voieVue && k.annees >= 3 && k.niveau >= 1) {
    k.voieVue = true;
    s.queue.push('voie_carriere');
  }
}

// Bonus de promotion et d'embauche venant des compétences
export const bonusPromo = (s) => {
  const k = s.carriere;
  if (!k) return 0;
  const n = k.voie === 'manager' ? (niveau(s, 'management') + niveau(s, 'leadership')) / 2 : niveauMetier(s, k.id);
  return n * 0.03 * (k.emp ? TAILLES[k.emp.taille].promo : 1);
};
export const bonusEmbauche = (s, id) => niveauMetier(s, id) * 0.04;
// Revenu d'un indépendant : variable, tiré vers le haut par les compétences
export const revenuFreelance = (s, alea) => Math.round(salary(s) * 12 * (0.55 + alea * 0.7 + niveauMetier(s, s.carriere.id) * 0.08));

// ---------- Formation continue (reconversion) ----------
export function seFormer(s, k) {
  if (!Object.hasOwn(SKILLS, k)) return { r: '', err: true };
  if (s.age < 18) return { r: 'La formation continue, c’est à partir de 18 ans.', err: true };
  if (s.justice.prison > 0) return { r: 'Impossible depuis la prison.', err: true };
  if (s.energie <= 0) return { r: 'Plus d’énergie cette année.', err: true };
  if (s.money < FORMATION.prix) return { r: `Une formation coûte ${euros(FORMATION.prix)}.`, err: true };
  if ((s.compAn?.[k] || 0) >= CAP_AN) return { r: `Tu as déjà beaucoup progressé en ${SKILLS[k].toLowerCase()} cette année.`, err: true };
  s.money -= FORMATION.prix;
  s.energie--;
  const g = gagner(s, k, FORMATION.xp);
  addLog(s, `Formation en ${SKILLS[k].toLowerCase()} (${euros(FORMATION.prix)}).`);
  return { r: `Formation terminée : ${SKILLS[k]} +${g} d’expérience.`, good: true };
}

// ---------- Effets utilisés par les événements et les activités ----------
registerFx('comp', (s, v) => gagnerTout(s, v));
registerFx('compMetier', (s, xp) => s.carriere && clesMetier(s.carriere.id).forEach((k) => gagner(s, k, xp)));
registerFx('salMult', (s, v) => s.carriere && (s.carriere.mult = Math.round(clamp((s.carriere.mult || 1) + v, 0.5, 1.8) * 100) / 100));
registerFx('voie', (s, v) => {
  const k = s.carriere;
  if (!k || !['expert', 'manager', 'freelance'].includes(v)) return;
  k.voie = v;
  if (v === 'manager') k.mult = Math.min(1.8, (k.mult || 1) + 0.12);
  if (v === 'expert') k.mult = Math.min(1.8, (k.mult || 1) + 0.06);
  if (v === 'freelance') {
    k.emp = null;
    anciensCollegues(s);
    addLog(s, 'Tu te mets à ton compte.');
  }
});
registerFx('changeEmployeur', (s) => {
  const k = s.carriere;
  if (!k?.emp) return;
  const e = choisirEmployeur(k.id, k.emp.nom);
  if (!e) return;
  const mult = Math.min(1.8, (k.mult || 1) * 1.15);
  embauche(s, k.id, e);
  k.mult = mult;
  addLog(s, `Nouveau poste chez ${e.nom}, mieux payé.`);
});
registerFx('licenciement', (s, mode) => {
  const k = s.carriere;
  if (!k) return;
  const indem = Math.round(salary(s) * Math.max(1, k.annees / 4));
  const nom = k.emp?.nom || 'ton employeur';
  if (mode === 'prudhommes') {
    if (chance(0.4)) {
      s.money += indem * 2;
      addLog(s, `Prud’hommes gagnés contre ${nom} : ${euros(indem * 2)} d’indemnités.`);
    } else {
      s.money += indem - 2000;
      addLog(s, `Prud’hommes perdus : ${euros(indem)} d’indemnités, moins ${euros(2000)} d’avocat.`);
    }
  } else {
    s.money += indem;
    addLog(s, `Licenciement économique : ${euros(indem)} d’indemnités.`);
  }
  setCareer(s, null);
});
registerFx('stage', (s) => {
  const e = s.etudes;
  const metier = { droit: 'avocat', medecine: 'medecin' }[e.cursus] || FILIERES[e.filiere]?.metier || null;
  const emp = metier ? choisirEmployeur(metier) : null;
  e.stage = { nom: emp?.nom || 'une petite entreprise', metier, emp };
  const map = ['fac', 'bts', 'master'].includes(e.cursus) ? FILIERES[e.filiere]?.xp : CURSUS_XP[e.cursus];
  gagnerTout(s, map, 0.6);
  s.tmp.stage = e.stage.nom;
});
registerFx('embaucheStage', (s) => {
  const st = s.etudes.stage;
  s.etudes.stage = null;
  if (!st?.metier || s.carriere || canApply(s, st.metier) !== true) return;
  s.tmp.empForce = st.emp;
  setCareer(s, st.metier);
  s.tmp.empForce = null;
  if (s.carriere) s.carriere.mult = Math.min(1.8, (s.carriere.mult || 1) + 0.03);
});
registerFx('finStage', (s) => (s.etudes.stage = null));
