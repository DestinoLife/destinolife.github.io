// Simule des centaines de vies avec des choix au hasard pour détecter les bugs du moteur.
// Usage : npm run sim  (ou node scripts/simulate.mjs 500)
import { createLife } from '../src/engine/core.js';
import { randomConfig } from '../src/engine/random.js';
import { ageUp, choose, choicesView, continueResult, doActivity, applyJob, relActions, relAction, housingOptions, moveTo, enroll, continueAsChild, busy, ACTIVITIES, CAREERS } from '../src/engine/flow.js';
import { pick, chance } from '../src/engine/rng.js';

const N = Number(process.argv[2] || 300);
const warns = [];
const origWarn = console.warn;
console.warn = (...a) => warns.push(a.join(' '));

const stats = { vies: 0, ages: [], causes: {}, metiers: {}, prison: 0, events: {}, maxMoney: 0, gens: 0, unresolved: 0 };

function resolve(s) {
  let guard = 0;
  while (busy(s) && guard++ < 50) {
    if (s.current) {
      stats.events[s.current.id] = (stats.events[s.current.id] || 0) + 1;
      if (/\{[^}]*\}/.test(s.current.txt)) warns.push(`Texte non remplacé dans ${s.current.id}: ${s.current.txt}`);
      const ch = choicesView(s).filter((c) => c.ok);
      if (!ch.length) {
        warns.push(`Aucun choix possible : ${s.current.id}`);
        s.current = null;
        break;
      }
      choose(s, pick(ch).i);
    } else if (s.result) {
      if (/\{[^}]*\}/.test(s.result.txt)) warns.push(`Résultat non remplacé : ${s.result.txt}`);
      continueResult(s);
    }
  }
  if (guard >= 50) stats.unresolved++;
}

for (let i = 0; i < N; i++) {
  let s = createLife(randomConfig());
  let years = 0;
  while (years++ < 140) {
    resolve(s);
    if (!s.vivant) {
      const kid = s.relations.find((r) => r.lien === 'enfant' && r.vivant);
      stats.ages.push(s.age);
      stats.causes[s.mort.cause] = (stats.causes[s.mort.cause] || 0) + 1;
      if (kid && chance(0.3) && stats.gens < 40) {
        s = continueAsChild(s, kid.id);
        stats.gens++;
        continue;
      }
      break;
    }
    // quelques actions au hasard
    for (let k = 0; k < 3; k++) {
      if (busy(s)) resolve(s);
      const r = Math.random();
      if (r < 0.55) doActivity(s, pick(ACTIVITIES).id);
      else if (r < 0.7) applyJob(s, pick(Object.keys(CAREERS)));
      else if (r < 0.8) {
        const p = pick(s.relations.filter((x) => x.vivant).concat([null]));
        if (p) {
          const a = relActions(s, p).filter((x) => x.ok);
          if (a.length) relAction(s, p.id, pick(a).a);
        }
      } else if (r < 0.9) {
        const h = housingOptions(s).filter((x) => x.ok);
        if (h.length) moveTo(s, pick(h).id, chance(0.3));
      } else enroll(s, pick(['fac', 'bts', 'master', 'daeu', 'cap']));
      resolve(s);
    }
    if (s.carriere) stats.metiers[s.carriere.id] = (stats.metiers[s.carriere.id] || 0) + 1;
    if (s.justice.prison > 0) stats.prison++;
    stats.maxMoney = Math.max(stats.maxMoney, s.money);
    if (Number.isNaN(s.money) || Object.values(s.stats).some(Number.isNaN)) warns.push('NaN détecté');
    ageUp(s);
  }
  stats.vies++;
}

console.warn = origWarn;
const avg = stats.ages.reduce((a, b) => a + b, 0) / Math.max(1, stats.ages.length);
console.log(`Vies simulées : ${stats.vies} (+${stats.gens} générations) · âge moyen au décès : ${avg.toFixed(1)}`);
console.log('Causes :', Object.entries(stats.causes).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} (${v})`).join(', '));
console.log('Années-métier :', Object.entries(stats.metiers).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' '));
console.log(`Années en prison : ${stats.prison} · fortune max : ${Math.round(stats.maxMoney)} · boucles non résolues : ${stats.unresolved}`);
const evs = Object.keys(stats.events).length;
console.log(`Événements différents vus : ${evs}`);
const uniq = [...new Set(warns)];
console.log(`Avertissements : ${warns.length} (${uniq.length} uniques)`);
uniq.slice(0, 25).forEach((w) => console.log('  ⚠', w.slice(0, 220)));
