// Suite anti-triche (Hitman) : chaque faille de SECURITY_AUDIT.md a son test de non-régression.
// Usage : npm run anticheat  (échoue avec le code 1 si un test casse ; lancé par la CI avant la publication)

// localStorage factice pour tester la sauvegarde signée en Node
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

const { verifier, anomalie, seal, sign, stringify, rand, LIMITES } = await import('../src/engine/hitman.js');
const { createLife, apply, hitmanSanction } = await import('../src/engine/core.js');
const { randomConfig } = await import('../src/engine/random.js');
const { rnd } = await import('../src/engine/rng.js');
const flow = await import('../src/engine/flow.js');
const eco = await import('../src/engine/economy.js');
const life2 = await import('../src/engine/life2.js');
const msgs = await import('../src/engine/messages.js');
const { EV } = await import('../src/data/events.js');
const { save, load, saveIssue } = await import('../src/engine/save.js');
const { loadAchievements, checkAchievements } = await import('../src/engine/achievements.js');

let pass = 0;
const fails = [];
const test = (id, nom, fn) => {
  try {
    const r = fn();
    if (r === true) pass++;
    else fails.push(`${id} ${nom} : ${r}`);
  } catch (e) {
    fails.push(`${id} ${nom} : exception ${e.message}`);
  }
};
const vie = (age = 30, money = 10000) => {
  const s = life2.migrate3(eco.migrate(createLife(randomConfig(), { age })));
  s.money = money;
  s.current = null;
  s.result = null;
  s.queue = [];
  return s;
};
const fini = (s) => Number.isFinite(s.money) && Number.isFinite(s.bourse || 0);
const BAD = [NaN, 'abc', undefined, null, Infinity, -Infinity, -500, 0, '__proto__', 'constructor', {}, []];

// ---------- Casino ----------
test('ECO-1', 'machine à sous : espérance exacte < 1', () => {
  const SYM = ['7', '★', '♦', '♣', '♥', 'BAR'];
  // On rejoue toutes les combinaisons avec un tirage forcé
  let tot = 0, n = 0;
  for (const a of SYM) for (const b of SYM) for (const c of SYM) {
    const mult = a === b && b === c ? (a === '7' ? 50 : a === 'BAR' ? 20 : 10) : a === b || b === c || a === c ? 1 : 0;
    tot += mult;
    n++;
  }
  // Et on vérifie par simulation que le moteur paie bien ce barème
  const s = vie(30, 1e9);
  let mise = 0, gain = 0;
  for (let i = 0; i < 60000; i++) {
    const avant = s.money;
    eco.slots(s, 100);
    mise += 100;
    gain += s.money - avant + 100;
  }
  const evSim = gain / mise;
  return tot / n < 1 && evSim < 1 ? true : `EV exacte ${(tot / n).toFixed(3)}, simulée ${evSim.toFixed(3)}`;
});
test('ECO-1b', 'roulette : espérance < 1 pour chaque pari', () => {
  const s = vie(30, 1e9);
  for (const choix of ['rouge', 'noir', 'pair', 'impair', 'vert', '17']) {
    let gain = 0;
    for (let i = 0; i < 40000; i++) {
      const avant = s.money;
      eco.roulette(s, 100, choix);
      gain += s.money - avant + 100;
    }
    if (gain / (40000 * 100) >= 1.02) return `pari ${choix} : EV ${(gain / 4e6).toFixed(3)}`;
  }
  return true;
});
test('ECO-2', 'loto : 5 tickets par an maximum', () => {
  const s = vie(30, 1e6);
  let ok = 0;
  for (let i = 0; i < 20; i++) if (!flow.doActivity(s, 'loto').err) ok++;
  return ok <= 5 ? true : `${ok} tickets joués`;
});
test('ECO-4', 'mises invalides refusées (NaN, chaînes, négatifs, Infinity)', () => {
  for (const b of BAD) {
    for (const f of [(s) => eco.roulette(s, b, 'rouge'), (s) => eco.slots(s, b), (s) => life2.bjStart(s, b)]) {
      const s = vie(30, 1000);
      f(s);
      if (!fini(s) || s.money !== 1000) return `mise ${String(b)} → argent ${s.money}`;
    }
  }
  return true;
});
test('GP-2', 'casino interdit aux mineurs et en prison', () => {
  const kid = vie(12, 1000);
  const det = vie(30, 1000);
  det.justice.prison = 3;
  for (const s of [kid, det]) if (!eco.slots(s, 10).err || !eco.roulette(s, 10, 'rouge').err || !life2.bjStart(s, 10).err) return 'mise acceptée';
  return true;
});
test('ECO-6', 'blackjack : une main finie ne paie qu’une fois', () => {
  for (let k = 0; k < 200; k++) {
    const s = vie(30, 1000);
    let st = life2.bjStart(s, 100);
    if (!st.done) st = life2.bjStand(s, st);
    const apres = s.money;
    life2.bjStand(s, st);
    life2.bjHit(s, st);
    if (s.money !== apres) return `repayé : ${apres} → ${s.money}`;
  }
  return true;
});

// ---------- Bourse, biens, entreprises ----------
test('ECO-5', 'bourse : montants invalides refusés', () => {
  for (const m of BAD) {
    const s = vie(30, 1000);
    eco.bourseAction(s, 'placer', m);
    if (!fini(s) || s.money + s.bourse !== 1000) return `montant ${String(m)} → argent ${s.money}, bourse ${s.bourse}`;
  }
  return true;
});
test('ECO-3', 'receleur : acheter puis revendre la même année ne rapporte rien', () => {
  const s = vie(30, 1e6);
  s.relations.push({ id: 9999, vivant: true, role: 'receleur', lien: 'contact', prenom: 'Test', rel: 50 });
  const id = Object.keys(eco.ASSETS).find((k) => !eco.ASSETS[k].car && eco.ASSETS[k].prix <= 1e5);
  for (let i = 0; i < 20; i++) {
    eco.buyAsset(s, id);
    eco.sellAsset(s, s.biens[s.biens.length - 1].uid);
  }
  return s.money < 1e6 ? true : `argent ${s.money} après 20 allers-retours`;
});
test('GP-4', 'identifiants piégés refusés sans corrompre l’état', () => {
  for (const id of ['__proto__', 'constructor', 'toString', 'inexistant']) {
    const s = vie(30, 5000);
    const e0 = s.energie;
    for (const f of [() => eco.buyAsset(s, id), () => eco.createBusiness(s, id, 'X'), () => eco.moveCity(s, id), () => flow.doActivity(s, id), () => flow.applyJob(s, id), () => flow.enroll(s, id), () => life2.instaPost(s, id, 'x')]) f();
    if (!fini(s) || s.money !== 5000 || s.energie !== e0 || s.biens.length || s.business.length) return `id ${id} : argent ${s.money}, énergie ${e0}→${s.energie}`;
  }
  return true;
});
test('GP-7', 'études : trop jeune → refus', () => {
  const s = vie(8, 0);
  s.etudes.cursus = null;
  return flow.enroll(s, 'daeu').err ? true : 'inscrit à 8 ans';
});
test('GP-8', 'pas d’achat de biens ni de bourse en prison', () => {
  const s = vie(30, 1e6);
  s.justice.prison = 4;
  eco.buyAsset(s, Object.keys(eco.ASSETS)[0]);
  eco.bourseAction(s, 'placer', 1000);
  return s.money === 1e6 ? true : `argent ${s.money}`;
});

// ---------- Événements, relations, messages ----------
test('GP-5', 'choix d’événement : index piégé ignoré', () => {
  const s = vie(30, 1000);
  const id = Object.keys(EV).find((k) => EV[k].ch?.length >= 2);
  if (!id) return 'aucun événement trouvé';
  for (const i of ['__proto__', 'length', 1.5, -1, 99, NaN]) {
    s.current = { id };
    flow.choose(s, i);
    if (!s.current) return `index ${String(i)} a résolu l’événement`;
  }
  return true;
});
test('GP-6/ECO-8', 'relations : une demande d’argent par an', () => {
  const s = vie(20, 0);
  const p = s.relations.find((r) => r.vivant && ['mere', 'pere'].includes(r.lien));
  if (!p) return true;
  s.relUsed = {};
  for (let i = 0; i < 30; i++) flow.relAction(s, p.id, 'argent');
  const apres = s.money;
  flow.relAction(s, p.id, 'enfant');
  return s.relations.filter((r) => r.lien === 'enfant').length === 0 && apres <= 60000 ? true : `argent ${apres}`;
});
test('ECO-7', 'SMS « Tu peux me dépanner ? » : une fois par proche et par an', () => {
  const s = vie(25, 0);
  const r = s.relations.find((x) => x.vivant);
  if (!r) return true;
  r.rel = 100;
  r.conf = 100;
  s.relUsed = {};
  for (let i = 0; i < 200; i++) life2.sendMessage(s, r.prenom, 'Tu peux me dépanner ?');
  life2.sendMessage(s, r.prenom, '<img src=x onerror=alert(1)>');
  return s.money <= 2000 && !s.phone.msgs.some((m) => m.txt.includes('<img')) ? true : `argent ${s.money}`;
});
test('GP-10', 'messages : index piégé ignoré', () => {
  const s = vie(25, 1000);
  s.phone.msgs.push({ id: 777, from: 'X', tpl: Object.keys(msgs.T)[0], ch: true });
  for (const i of ['length', '__proto__', 1.5, -1]) msgs.answer(s, 777, i);
  return !s.phone.msgs.find((m) => m.id === 777).answered ? true : 'message marqué répondu';
});
test('ECO-9', 'héritage : pas de création de valeur', () => {
  const s = vie(60, 0);
  s.biens = [{ uid: 1, id: Object.keys(eco.ASSETS)[0], valeur: 1e6, achat: 1e6, depuis: 50 }];
  const kids = [0, 1].map((i) => ({ id: 500 + i, lien: 'enfant', vivant: true, prenom: 'E' + i, nom: s.id.nom, genre: 'h', age: 30, rel: 60 }));
  s.relations.push(...kids);
  const ns = flow.continueAsChild(s, 500);
  const avant = s.money + 1e6, apres = ns.money + ns.biens.reduce((t, b) => t + b.valeur, 0);
  return apres <= avant ? true : `${avant} → ${apres}`;
});

// ---------- Hitman ----------
test('HM-1', 'Math.random remplacé : le jeu l’ignore et Hitman le voit', () => {
  const orig = Math.random;
  Math.random = () => 0;
  const tirages = new Set(Array.from({ length: 50 }, () => rnd(0, 36)));
  const r = verifier(null);
  Math.random = orig;
  return tirages.size > 5 && r ? true : `tirages distincts ${tirages.size}, verdict ${r}`;
});
test('HM-2', 'état modifié entre deux actions → détecté', () => {
  const s = vie(30, 1000);
  seal(s);
  if (verifier(s)) return 'faux positif sur un état scellé';
  s.money += 1;
  const r = verifier(s);
  seal(null);
  return r ? true : 'injection non détectée';
});
test('HM-3', 'sommes astronomiques et NaN → détectés', () => {
  const s = vie(30, LIMITES.argentMax + 1);
  const t = vie(30, NaN);
  return anomalie(s) && anomalie(t) && !anomalie(vie(30, 25e6)) ? true : 'seuils incorrects';
});
test('HM-4', 'sauvegarde retouchée, signature retirée ou vie ressuscitée → détectées', () => {
  store.clear();
  const s = vie(30, 1000);
  save(s);
  if (!load() || saveIssue()) return `sauvegarde saine refusée : ${saveIssue()}`;
  store.set('destino.save.v1', store.get('destino.save.v1').replace('"money":1000', '"money":999999999'));
  load();
  if (!saveIssue()) return 'retouche non détectée';
  save(s);
  store.set('destino.save.v1', store.get('destino.save.v1').replace(/,"_h":"[^"]+"\}$/, '}'));
  load();
  if (!saveIssue()) return 'signature supprimée non détectée';
  save(s);
  const vivante = store.get('destino.save.v1');
  s.vivant = false;
  save(s);
  store.set('destino.save.v1', vivante);
  load();
  return saveIssue() ? true : 'résurrection non détectée';
});
test('HM-5', 'ancienne sauvegarde (avant Hitman) acceptée', () => {
  store.clear();
  store.set('destino.save.v1', stringify(vie(30, 1000)));
  return load() && !saveIssue() ? true : `refusée : ${saveIssue()}`;
});
test('HM-6', 'perpétuité : saisie, ni évasion, ni aménagement, ni sortie', () => {
  const s = vie(30, 2e9);
  hitmanSanction(s, 'test');
  apply(s, { evade: true });
  apply(s, { prisonAdd: -998 });
  for (let i = 0; i < 20 && s.vivant; i++) flow.ageUp(s);
  return s.money === 0 && (!s.vivant || s.justice.prison > 900) && !anomalie(s) ? true : `prison ${s.justice.prison}, argent ${s.money}`;
});
test('UI-4', 'succès retouchés ignorés, vie condamnée sans succès', () => {
  store.set('destino.ach.v1', '{"millionnaire":{"at":1},"_h":"faux"}');
  if (Object.keys(loadAchievements()).length) return 'succès forgés acceptés';
  store.set('destino.ach.v1', 'null');
  loadAchievements();
  const s = vie(30, 1000);
  s.hitman = { raison: 'test' };
  return checkAchievements(s).length === 0 ? true : 'succès débloqué malgré Hitman';
});

// ---------- Faux positifs : des vies honnêtes ne doivent jamais déclencher Hitman ----------
test('HM-7', 'aucun faux positif sur 150 vies simulées', () => {
  for (let v = 0; v < 150; v++) {
    const s = life2.migrate3(eco.migrate(createLife(randomConfig())));
    life2.giveParentJobs(s);
    for (let y = 0; y < 110 && s.vivant; y++) {
      for (let g = 0; g < 40 && flow.busy(s); g++) {
        if (s.current) {
          const ch = flow.choicesView(s).filter((c) => c.ok);
          if (!ch.length) { s.current = null; break; }
          flow.choose(s, ch[Math.floor(rand() * ch.length)].i);
        } else if (s.result) flow.continueResult(s);
      }
      if (s.age >= 18 && rand() < 0.3) eco.slots(s, Math.max(1, Math.floor(s.money * 0.05)));
      if (rand() < 0.3) flow.doActivity(s, flow.ACTIVITIES[Math.floor(rand() * flow.ACTIVITIES.length)].id);
      const r = anomalie(s);
      if (r) return `vie ${v}, ${s.age} ans : ${r}`;
      flow.ageUp(s);
    }
  }
  return true;
});

console.log(`Anti-triche : ${pass} tests réussis, ${fails.length} en échec`);
fails.forEach((f) => console.log('  ✗', f));
process.exit(fails.length ? 1 : 0);
