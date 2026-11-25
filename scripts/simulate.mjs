// Simule des centaines de vies avec des choix au hasard pour détecter les bugs du moteur.
// Usage : npm run sim  (ou node scripts/simulate.mjs 500)
import { createLife } from '../src/engine/core.js';
import { randomConfig } from '../src/engine/random.js';
import { ageUp, choose, choicesView, continueResult, doActivity, applyJob, relActions, relAction, housingOptions, moveTo, enroll, continueAsChild, busy, ACTIVITIES, CAREERS } from '../src/engine/flow.js';
import { pick, chance } from '../src/engine/rng.js';
import { migrate3, giveParentJobs, instaPost, friendService, bjStart, bjHit, bjStand, expatriate, POST_TYPES, EXPAT, sendMessage, REPLIES } from '../src/engine/life2.js';
import { answer, writeTo, topicsFor } from '../src/engine/messages.js';
import { instaComment, instaFeed } from '../src/engine/life2.js';
import { migrate, buyAsset, sellAsset, createBusiness, businessAction, networkAction, travel, flee, roulette, slots, moveCity, findContact, startNetwork, ASSETS, BUSINESS, DESTS, MISSIONS } from '../src/engine/economy.js';

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
  let s = migrate3(migrate(createLife(randomConfig())));
  giveParentJobs(s);
  let years = 0;
  while (years++ < 140) {
    resolve(s);
    if (!s.vivant) {
      const kid = s.relations.find((r) => r.lien === 'enfant' && r.vivant);
      stats.ages.push(s.age);
      stats.causes[s.mort.cause] = (stats.causes[s.mort.cause] || 0) + 1;
      if (kid && chance(0.3) && stats.gens < 40) {
        s = migrate3(migrate(continueAsChild(s, kid.id)));
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
      } else if (r < 0.93) enroll(s, pick(['fac', 'bts', 'master', 'daeu', 'cap']));
      else {
        const k = Math.random();
        if (k < 0.15) buyAsset(s, pick(Object.keys(ASSETS)));
        else if (k < 0.22 && s.biens.length) sellAsset(s, pick(s.biens).uid);
        else if (k < 0.35) createBusiness(s, pick(Object.keys(BUSINESS)));
        else if (k < 0.5 && s.business.length) businessAction(s, pick(s.business).uid, pick(['investir', 'marketing', 'blanchir', 'lever', 'vendre']));
        else if (k < 0.6) { if (!s.reseau) startNetwork(s); else networkAction(s, pick(['guetteur', 'vendeur', 'virer', ...MISSIONS.map((m) => m.id)])); }
        else if (k < 0.66) findContact(s);
        else if (k < 0.72 && s.reseau) { const f = s.relations.find((x) => x.role === 'fournisseur'); if (f) networkAction(s, 'fournisseur', f.id); }
        else if (k < 0.8) travel(s, pick(DESTS).id);
        else if (k < 0.85 && s.justice.recherche) flee(s, pick(DESTS).id);
        else if (k < 0.93 && s.money > 0) (chance(0.5) ? roulette(s, Math.ceil(s.money * 0.2), pick(['rouge', 'noir', 'pair', '7'])) : slots(s, Math.ceil(s.money * 0.1)));
        else if (k < 0.95) moveCity(s, pick(['Paris', 'Lyon', 'Nice']));
        else {
          const j = Math.random();
          if (j < 0.3 && s.insta) instaPost(s, pick(Object.keys(POST_TYPES)));
          else if (j < 0.5) { const f = s.relations.find((x) => x.vivant && x.destin); if (f) friendService(s, f); }
          else if (j < 0.7 && s.money > 10) { let st = bjStart(s, Math.ceil(s.money * 0.1)); if (!st.err) { while (!st.done && Math.random() < 0.5) st = bjHit(s, st); if (!st.done) bjStand(s, st); } }
          else if (j < 0.8) expatriate(s, pick(EXPAT).ville);
          else {
            const m = s.phone.msgs.find((x) => x.ch && !x.answered); if (m) answer(s, m.id, chance(0.5) ? 0 : 1);
            const r = pick(s.relations.filter((x) => x.vivant)); if (r && topicsFor(r).length) writeTo(s, r, pick(topicsFor(r))[0]);
            const f = s.insta && instaFeed(s)[0]; if (f) instaComment(s, f.who, pick(['gentil', 'drole', 'mechant']));
          }
        }
      }
      resolve(s);
    }
    if (s.carriere) stats.metiers[s.carriere.id] = (stats.metiers[s.carriere.id] || 0) + 1;
    if (s.justice.prison > 0) stats.prison++;
    stats.maxMoney = Math.max(stats.maxMoney, s.money);
    if (Number.isNaN(s.money) || Object.values(s.stats).some(Number.isNaN) || Number.isNaN(s.sale) || s.business.some((b) => Number.isNaN(b.valo)) || s.biens.some((b) => Number.isNaN(b.valeur))) warns.push('NaN détecté');
    if (s.business.length) stats.biz = (stats.biz || 0) + 1;
    if (s.reseau) stats.res = (stats.res || 0) + 1;
    if (s.cavale) stats.cav = (stats.cav || 0) + 1;
    if (s.carriere?.cat === 'politique') stats.pol = (stats.pol || 0) + 1;
    if (Math.max(...Object.values(s.addic)) > 50) stats.add = (stats.add || 0) + 1;
    if (s.maladies.length) stats.mal = (stats.mal || 0) + 1;
    let g2 = 0;
    while (s.vivant && s.plans?.length && g2++ < 10) { ageUp(s); resolve(s); }
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
console.log(`Années avec business : ${stats.biz || 0} · avec réseau : ${stats.res || 0} · en cavale : ${stats.cav || 0}`);
console.log(`Années en politique : ${stats.pol || 0} · avec addiction forte : ${stats.add || 0} · malade : ${stats.mal || 0}`);
const evs = Object.keys(stats.events).length;
console.log(`Événements différents vus : ${evs}`);
const uniq = [...new Set(warns)];
console.log(`Avertissements : ${warns.length} (${uniq.length} uniques)`);
uniq.slice(0, 25).forEach((w) => console.log('  ⚠', w.slice(0, 220)));
