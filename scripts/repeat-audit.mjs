// Mesure la répétition : combien d'événements différents dans une vie, et lesquels reviennent trop souvent.
// Lancer : node scripts/repeat-audit.mjs [nombre de vies]
import { createLife } from '../src/engine/core.js';
import { randomConfig } from '../src/engine/random.js';
import { ageUp, choose, choicesView, continueResult, busy, presentNext, doActivity, migrate, migrate3, ACTIVITIES } from '../src/engine/flow.js';
import { pick } from '../src/engine/rng.js';

const N = Number(process.argv[2]) || 150;
const out = console.log;
console.log = () => {};
console.warn = () => {};
const per = [];
const rep = {};
const presence = {};
for (let i = 0; i < N; i++) {
  const s = createLife(randomConfig(), {});
  migrate(s); migrate3(s);
  const seen = {};
  let y = 0;
  const play = () => {
    let g = 0;
    while (busy(s) && g++ < 60) {
      if (s.current) {
        seen[s.current.id] = (seen[s.current.id] || 0) + 1;
        const ch = choicesView(s).filter((c) => c.ok);
        if (!ch.length) { s.current = null; break; }
        choose(s, pick(ch).i);
      } else if (s.result) continueResult(s);
    }
  };
  while (s.vivant && y++ < 95) {
    const acts = ACTIVITIES.filter((a) => !a.prison && (!a.age || (s.age >= a.age[0] && s.age <= a.age[1])));
    for (let k = 0; k < 2 && acts.length; k++) { doActivity(s, pick(acts).id); presentNext(s); play(); }
    ageUp(s); play();
    let g = 0;
    while (s.plans?.length && g++ < 5) { ageUp(s); play(); }
  }
  const tot = Object.values(seen).reduce((a, b) => a + b, 0);
  per.push({ distinct: Object.keys(seen).length, tot, age: s.age });
  for (const [id, n] of Object.entries(seen)) { rep[id] = (rep[id] || 0) + n; presence[id] = (presence[id] || 0) + 1; }
}
const avg = (k) => Math.round(per.reduce((a, p) => a + p[k], 0) / per.length);
out(`${N} vies · âge moyen à la mort ${avg('age')} · ${avg('tot')} événements par vie dont ${avg('distinct')} différents (${Math.round((avg('distinct') / avg('tot')) * 100)} % de nouveauté)`);
const top = Object.entries(rep).map(([id, n]) => [id, n / presence[id], presence[id] / N]).filter((x) => x[1] >= 2.2).sort((a, b) => b[1] - a[1]).slice(0, 25);
out('Événements qui reviennent le plus dans une même vie (fois par vie quand il apparaît · % des vies) :');
for (const [id, n, p] of top) out(`  ${id.padEnd(24)} ${n.toFixed(1)} fois · ${Math.round(p * 100)} % des vies`);
