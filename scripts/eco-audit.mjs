// Audit de l'économie : fait jouer des stratégies « optimisées » (comme un joueur qui cherche à devenir riche)
// et mesure la fortune obtenue. Lancer : node scripts/eco-audit.mjs [nombre de vies par stratégie]
import { createLife } from '../src/engine/core.js';
import { randomConfig } from '../src/engine/random.js';
import { ageUp, choose, choicesView, continueResult, applyJob, busy, presentNext, doActivity, migrate, migrate3, CAREERS } from '../src/engine/flow.js';
import { createBusiness, businessAction, startNetwork, networkAction, findContact, patrimoine, BUSINESS, MISSIONS } from '../src/engine/economy.js';
import { pick } from '../src/engine/rng.js';

const N = Number(process.argv[2]) || 150;
const origLog = console.log;
console.warn = () => {};

function resolve(s) {
  let g = 0;
  while (busy(s) && g++ < 60) {
    if (s.current) {
      const ch = choicesView(s).filter((c) => c.ok);
      if (!ch.length) { s.current = null; break; }
      choose(s, pick(ch).i);
    } else if (s.result) continueResult(s);
  }
}
const fortune = (s) => s.money + patrimoine(s);

const STRATS = {
  // Référence : simple salarié, ne fait rien de spécial
  salarie() {},
  // Ouvre des commerces, réinvestit tout, revend à 55 ans
  commerce(s) {
    if (s.age < 18 || s.justice.prison > 0) return;
    const types = ['resto', 'kebab', 'garage', 'vetements', 'salle'];
    const t = types.find((k) => s.money > BUSINESS[k].prix + 20000);
    if (t && s.business.length < 4) createBusiness(s, t);
    for (const b of s.business) {
      for (let k = 0; k < 3; k++) if (businessAction(s, b.uid, 'investir').err) break;
      businessAction(s, b.uid, 'marketing');
    }
    if (s.age === 55) for (const b of [...s.business]) businessAction(s, b.uid, 'vendre');
  },
  // Start-up : marketing, levées de fonds chaque année, revente à 50 ans
  startup(s) {
    if (s.age < 18 || s.justice.prison > 0) return;
    if (!s.business.length && s.money > 32000) createBusiness(s, 'startup');
    for (const b of s.business) {
      businessAction(s, b.uid, 'investir');
      businessAction(s, b.uid, 'marketing');
      businessAction(s, b.uid, 'lever');
    }
    if (s.age === 50) for (const b of [...s.business]) businessAction(s, b.uid, 'vendre');
  },
  // Réseau de stups : missions, points, vendeurs
  reseau(s) {
    if (s.age < 18 || s.justice.prison > 0) return;
    s.stats.crime = Math.max(s.stats.crime, 35);
    if (!s.reseau && s.money > 16000) startNetwork(s);
    const n = s.reseau;
    if (!n) return;
    if (!n.fournisseur) { const c = findContact(s, 'fournisseur'); networkAction(s, 'fournisseur', c.id); }
    if (n.vendeurs < n.points * 3) networkAction(s, 'vendeur');
    if (n.guetteurs < n.points * 2) networkAction(s, 'guetteur');
    // Joueur raisonnable : corrompt quand ça chauffe, go-fast seulement quand c’est calme
    if (n.chaleur > 55) networkAction(s, 'flic');
    else if (n.chaleur < 30 && s.money > 40000) networkAction(s, 'go_fast');
    else if (n.points < 3 && s.money > 30000) networkAction(s, 'point');
  },
};

function run(name) {
  const at = { 30: [], 40: [], 55: [], 70: [] }, deaths = [], prison = [], stuck = [];
  for (let i = 0; i < N; i++) {
    const s = createLife(randomConfig(), { age: 16 });
    migrate(s); migrate3(s);
    s.money = 2000;
    applyJob(s, 'caissier');
    let yrs = 0;
    while (s.vivant && s.age < 71 && yrs++ < 80) {
      if (s.age === 18 && !s.carriere) for (const id of ['caissier', 'livreur', 'plonge', 'chantier']) if (!applyJob(s, id).err) break;
      if (s.justice.prison === 0) doActivity(s, 'footing');
      STRATS[name](s);
      presentNext(s);
      resolve(s);
      let g = 0;
      while (s.vivant && s.plans?.length && g++ < 10) { ageUp(s); resolve(s); }
      ageUp(s);
      resolve(s);
      if (at[s.age] && at[s.age].last !== i) { at[s.age].push(fortune(s)); at[s.age].last = i; }
      if (s.justice.prison > 0) prison.push(s.age);
    }
    if (!s.vivant) deaths.push(s.age + ':' + (s.mort?.cause || '?'));
    else if (s.age < 71) stuck.push(s.age + ":" + (s.current?.id || s.queue[0] || "?"));
  }
  const pct = (a, p) => { const x = [...a].sort((m, n) => m - n); return x.length ? x[Math.floor((x.length - 1) * p)] : 0; };
  const f = (v) => (Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1) + ' M' : Math.round(v / 1000) + ' k');
  origLog(`\n== ${name} (${N} vies) · morts avant 71 ans : ${deaths.length} · années en prison : ${prison.length} · vies bloquées : ${stuck.length} ${stuck.slice(0, 6).join(' ')}`);
  const causes = {};
  deaths.forEach((d) => { const k = d.split(':').slice(1).join(':'); causes[k] = (causes[k] || 0) + 1; });
  origLog('  causes de décès :', Object.entries(causes).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${v}`).join(' · '));
  for (const [age, a] of Object.entries(at)) {
    if (!a.length) continue;
    const share = (t) => Math.round((a.filter((v) => v >= t).length / a.length) * 100) + ' %';
    origLog(`  ${age} ans (${a.length}) · médiane ${f(pct(a, 0.5))} · 75 % ${f(pct(a, 0.75))} · 95 % ${f(pct(a, 0.95))} · max ${f(pct(a, 1))} · ≥1 M ${share(1e6)} · ≥10 M ${share(1e7)} · ≥100 M ${share(1e8)}`);
  }
}
console.log = () => {};
for (const k of process.argv[3] ? [process.argv[3]] : Object.keys(STRATS)) run(k);
