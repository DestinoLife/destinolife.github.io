// Simule des centaines de vies avec des choix au hasard pour détecter les bugs du moteur.
// Usage : npm run sim  (ou node scripts/simulate.mjs 500)
import { createLife } from '../src/engine/core.js';
import { randomConfig } from '../src/engine/random.js';
import { ageUp, choose, choicesView, continueResult, doActivity, applyJob, relActions, relAction, housingOptions, moveTo, enroll, continueAsChild, busy, ACTIVITIES, CAREERS } from '../src/engine/flow.js';
import { pick, chance } from '../src/engine/rng.js';
import { migrate3, giveParentJobs, instaPost, friendService, bjStart, bjHit, bjStand, expatriate, POST_TYPES, EXPAT, sendMessage, REPLIES } from '../src/engine/life2.js';
import { answer, writeTo, topicsFor } from '../src/engine/messages.js';
import { instaComment, instaFeed } from '../src/engine/life2.js';
import { suggestions, adopterAmbition, abandonnerAmbition } from '../src/engine/goals.js';
import { AMBITIONS } from '../src/data/ambitions.js';
import { souscrire, simuler } from '../src/engine/credit.js';
import { livret, livretEnfant, basculerAssurance, travaux, rembourserAnticipe, dette, patrimoineNet, CREDITS } from '../src/engine/bank.js';
import { migrate, buyAsset, sellAsset, createBusiness, businessAction, networkAction, travel, flee, roulette, slots, moveCity, findContact, startNetwork, ASSETS, BUSINESS, DESTS, MISSIONS } from '../src/engine/economy.js';

const N = Number(process.argv[2] || 300);
const warns = [];
const origWarn = console.warn;
console.warn = (...a) => warns.push(a.join(' '));

const stats = { vies: 0, ages: [], causes: {}, metiers: {}, prison: 0, events: {}, maxMoney: 0, gens: 0, unresolved: 0 };

// v0.10 : cohérence des PNJ, de la famille, des ambitions et de la dynastie
const v10 = { mariagesPnj: 0, naissancesPnj: 0, petitsEnfants: 0, ambFinies: 0, ambAbandon: 0, viesAvecAmb: 0, relMax: 0, gensMax: 0 };
// v0.11 : banque et immobilier
const v11 = { credits: 0, refus: 0, defauts: 0, surendettement: 0, faillites: 0, plans: 0, loyers: 0, anticipes: 0, maxDette: 0, enrichi: 0 };
const CIBLES = ['bien:citadine', 'bien:compacte', 'bien:suv', 'bien:studio', 'bien:t2', 'bien:t3', 'bien:immeuble', 'logement:maison', 'logement:villa', 'biz:resto', 'biz:garage', 'biz:vetements'];
function banque(s) {
  if (s.age < 18 || !s.vivant || busy(s)) return;
  const r = Math.random();
  if (r < 0.06) {
    const cible = pick(CIBLES);
    const sim = simuler(s, cible);
    if (!sim) return;
    const avant = s.money;
    const res = souscrire(s, cible, sim.o.apportMin + Math.floor(Math.random() * Math.max(1, s.money - sim.o.apportMin) * 0.5), pick(sim.C.durees));
    if (res.err) v11.refus++;
    else {
      v11.credits++;
      // Garde-fou : hors revente de l'ancien logement, un crédit ne doit jamais laisser plus d'argent qu'avant
      if (!cible.startsWith('logement') && s.money > avant) { v11.enrichi++; warns.push(`Crédit qui enrichit : ${cible} ${avant} → ${s.money}`); }
    }
  } else if (r < 0.12) livret(s, chance(0.6) ? Math.floor(s.money * 0.3) : -Math.floor(Math.random() * 5000));
  else if (r < 0.14) { const k = s.relations.find((x) => x.vivant && x.lien === 'enfant' && x.age < 18); if (k) livretEnfant(s, k.id, 500); }
  else if (r < 0.17) basculerAssurance(s, pick(['hab', 'auto']));
  else if (r < 0.19 && s.biens.length) travaux(s, pick(s.biens).uid);
  else if (r < 0.2 && s.banque?.prets?.length) { if (!rembourserAnticipe(s, pick(s.banque.prets).uid).err) v11.anticipes++; }
}
function coherenceBanque(s) {
  const b = s.banque;
  if (!b) return warns.push('Banque absente');
  for (const p of b.prets) {
    if (!Number.isFinite(p.reste) || p.reste < 0 || !Number.isFinite(p.annuite) || p.annuite <= 0) warns.push(`Crédit incohérent : ${JSON.stringify(p).slice(0, 120)}`);
    if (!CREDITS[p.type]) warns.push('Type de crédit inconnu');
  }
  if (!Number.isFinite(b.epargne) || b.epargne < 0) warns.push('Épargne incohérente');
  if (!Number.isFinite(patrimoineNet(s))) warns.push('Patrimoine net NaN');
  v11.maxDette = Math.max(v11.maxDette, dette(s));
  if (b.an) v11.loyers += b.an.loyers;
}

function coherence(s) {
  coherenceBanque(s);
  const ids = s.relations.map((r) => r.id);
  if (new Set(ids).size !== ids.length) warns.push(`Identifiants de PNJ en double (gén. ${s.gen})`);
  if (ids.some((id) => id >= s.uid)) warns.push('Identifiant de PNJ ≥ uid');
  for (const r of s.relations) {
    if (!r.vivant) continue;
    if (['mere', 'pere'].includes(r.lien) && r.age < s.age + 14) warns.push(`Parent trop jeune : ${r.lien} ${r.age} ans pour ${s.age} ans`);
    if (r.lien === 'grandparent' && r.age < s.age + 28) warns.push(`Grand-parent trop jeune : ${r.age} ans pour ${s.age} ans`);
    if (r.lien === 'enfant' && r.age > s.age - 14) warns.push(`Enfant trop âgé : ${r.age} ans pour ${s.age} ans`);
    if (r.lien === 'petitenfant' && r.age > s.age - 28) warns.push(`Petit-enfant trop âgé : ${r.age} ans pour ${s.age} ans`);
    if (r.couple?.id != null) {
      const o = s.relations.find((x) => x.id === r.couple.id);
      if (o?.vivant && o.couple?.id !== r.id) warns.push('Couple de PNJ asymétrique');
    }
    if (r.sen && Object.values(r.sen).some((v) => !Number.isFinite(v))) warns.push('Sentiment NaN');
    if ((r.souv?.length || 0) > 6) warns.push('Mémoire de PNJ non bornée');
  }
  for (const l of s.liens || []) if (!ids.includes(l.a) || !ids.includes(l.b)) warns.push('Lien entre PNJ orphelin');
  // Aucun mort ne doit écrire après son décès
  const year = (t) => new Date(t).getUTCFullYear();
  for (const r of s.relations) {
    if (r.vivant || !r.dec || s.relations.some((x) => x.vivant && x.prenom === r.prenom)) continue;
    const homo = s.relations.filter((x) => x.prenom === r.prenom); if (homo.some((x) => !x.dec)) continue; const fin = Math.max(...homo.map((x) => x.dec)); const bad = s.phone.msgs.find((m) => m.from === r.prenom && !m.mine && !m.role && year(m.t) > fin); if (bad) warns.push(`Message d’un PNJ décédé : ${r.lien} | ${bad.txt.slice(0, 70)}`);
  }
  const act = s.amb?.act || [];
  if (act.length > 3 || new Set(act.map((a) => a.id)).size !== act.length || act.some((a) => !AMBITIONS[a.id])) warns.push('Ambitions incohérentes');
  if (s.dyn && s.dyn.gens.length !== Math.min(12, s.gen - 1)) warns.push(`Dynastie : ${s.dyn.gens.length} archives pour la génération ${s.gen}`);
  v10.relMax = Math.max(v10.relMax, s.relations.length);
  v10.gensMax = Math.max(v10.gensMax, s.gen);
}

function resolve(s) {
  let guard = 0;
  while (busy(s) && guard++ < 50) {
    if (s.current) {
      stats.events[s.current.id] = (stats.events[s.current.id] || 0) + 1;
      if (/\{[^}]*\}/.test(s.current.txt)) warns.push(`Texte non remplacé dans ${s.current.id}: ${s.current.txt}`);
      const ch = choicesView(s).filter((c) => c.ok);
      for (const x of ch) if (/{[^}]*}/.test(x.t + x.h)) warns.push(`Choix non remplacé dans ${s.current.id}: ${x.t} ${x.h}`);
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
      v10.ambFinies += s.amb?.fini?.length || 0;
      v10.ambAbandon += s.amb?.ab || 0;
      if (s.amb?.fini?.length) v10.viesAvecAmb++;
      v10.mariagesPnj += s.relations.filter((r) => r.couple?.m).length;
      v10.petitsEnfants += s.relations.filter((r) => r.lien === 'petitenfant').length;
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
    if (chance(0.15)) { const sg = suggestions(s); if (sg.length) adopterAmbition(s, pick(sg).id); }
    if (chance(0.02) && s.amb?.act?.length) abandonnerAmbition(s, pick(s.amb.act).id);
    coherence(s);
    banque(s);
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
    if (s.carriere && CAREERS[s.carriere.id]?.cat === 'politique') stats.pol = (stats.pol || 0) + 1;
    if (Math.max(...Object.values(s.addic)) > 50) stats.add = (stats.add || 0) + 1;
    if (s.maladies.length) stats.mal = (stats.mal || 0) + 1;
    let g2 = 0;
    while (s.vivant && s.plans?.length && g2++ < 10) { ageUp(s); resolve(s); }
    ageUp(s);
  }
  stats.vies++;
}

console.warn = origWarn;
const evb = (k) => stats.events[k] || 0;
console.log(`v0.11 · crédits signés : ${v11.credits}, refusés : ${v11.refus}, remboursés par anticipation : ${v11.anticipes}, dette max : ${Math.round(v11.maxDette)} €, loyers perçus : ${Math.round(v11.loyers)} €`);
console.log(`v0.11 · surendettement : ${evb('surendettement')}, impayés de locataires : ${evb('loc_impaye')}, crédits qui enrichissent : ${v11.enrichi}`);
const ev = (k) => stats.events[k] || 0;
console.log(`v0.10 · ambitions accomplies : ${v10.ambFinies} (${v10.viesAvecAmb} vies sur ${stats.vies + stats.gens} en ont au moins une), abandonnées : ${v10.ambAbandon}`);
console.log(`v0.10 · PNJ mariés à la mort du joueur : ${v10.mariagesPnj} · petits-enfants : ${v10.petitsEnfants} · relations max : ${v10.relMax} · génération max : ${v10.gensMax}`);
console.log(`v0.10 · initiatives : emploi ${ev('pnj_emploi')}, prêt ${ev('pnj_pret')}, retour ${ev('pnj_retour')}, mariage ${ev('pnj_mariage')}, chômage ${ev('pnj_chomage')}, réconciliation ${ev('pnj_reconcil')}, jalousie ${ev('pnj_jaloux')}, mentor ${ev('pnj_mentor')}, brouille ${ev('pnj_brouille')}, choix d’ambition ${ev('ambition_choix')}`);
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
