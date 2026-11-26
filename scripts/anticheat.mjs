// Suite anti-triche (Hitman) : chaque faille de SECURITY_AUDIT.md a son test de non-régression.
// Usage : npm run anticheat  (échoue avec le code 1 si un test casse ; lancé par la CI avant la publication)

// localStorage factice pour tester la sauvegarde signée en Node
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

const { verifier, anomalie, sign, stringify, parse, rand, LIMITES } = await import('../src/engine/hitman.js');
const { createLife, apply, hitmanSanction } = await import('../src/engine/core.js');
const { randomConfig } = await import('../src/engine/random.js');
const { rnd } = await import('../src/engine/rng.js');
const flow = await import('../src/engine/flow.js');
const eco = await import('../src/engine/economy.js');
const life2 = await import('../src/engine/life2.js');
const msgs = await import('../src/engine/messages.js');
const { EV } = await import('../src/data/events.js');
const SAVE = await import('../src/engine/save.js');
const { save, load, saveIssue } = SAVE;
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
  // Et on vérifie que le moteur paie bien ce barème, combinaison par combinaison (déterministe, sans bruit statistique)
  const s = vie(30, 1e9);
  for (let i = 0; i < 60000; i++) {
    const r = eco.slots(s, 100);
    const [a, b, c] = r.reels;
    const attendu = a === b && b === c ? (a === '7' ? 50 : a === 'BAR' ? 20 : 10) : a === b || b === c || a === c ? 1 : 0;
    if (r.mult !== attendu) return `${r.reels.join(' ')} payé ×${r.mult} au lieu de ×${attendu}`;
  }
  return tot / n < 1 ? true : `EV exacte ${(tot / n).toFixed(3)}`;
});
test('ECO-1b', 'roulette : espérance < 1 pour chaque pari (calcul exact sur les 37 cases)', () => {
  // Exact et déterministe : on relève le multiplicateur que le moteur applique à chaque case (0 à 36),
  // puis on fait la moyenne. Une estimation par tirages aléatoires échouait parfois en CI (bruit sur le plein).
  const s = vie(30, 1e9);
  for (const choix of ['rouge', 'noir', 'pair', 'impair', 'vert', '17']) {
    const mult = new Map();
    for (let i = 0; i < 20000 && mult.size < 37; i++) {
      const r = eco.roulette(s, 100, choix);
      if (r.err) return `pari ${choix} refusé : ${r.r}`;
      if (mult.has(r.n) && mult.get(r.n) !== r.mult) return `case ${r.n} : multiplicateur variable`;
      mult.set(r.n, r.mult);
    }
    if (mult.size < 37) return `pari ${choix} : seulement ${mult.size} cases tirées`;
    const ev = [...mult.values()].reduce((a, b) => a + b, 0) / 37;
    if (ev >= 1) return `pari ${choix} : EV ${ev.toFixed(3)}`;
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

// ---------- Hitman 2.0 : coffre-fort, journal, contrôles (tentatives de contournement) ----------
const HM = await import('../src/engine/hitman.js');
const { validerEtat } = await import('../src/engine/save.js');
const { comptaOk, protect, begin, end, restore, takeViolation, journal, __test } = HM;
const foreign = (code) => new Function('p', code); // simule du code tapé dans la console (frame « eval »)
const vault = (age = 30, money = 10000) => {
  const p = protect(vie(age, money));
  takeViolation();
  return p;
};

test('HM-1', 'Math.random remplacé : le jeu l’ignore et Hitman le voit', () => {
  const orig = Math.random;
  Math.random = () => 0;
  const tirages = new Set(Array.from({ length: 50 }, () => rnd(0, 36)));
  const r = verifier(null);
  Math.random = orig;
  return tirages.size > 5 && r ? true : `tirages distincts ${tirages.size}, verdict ${r}`;
});
test('HM-2', 'console hors action : écriture bloquée et signalée', () => {
  const p = vault();
  foreign('p.money = 1e8; p.stats.intel = 100; p.energie = 50; p.etudes.niveau = "doctorat"')(p);
  const r = takeViolation();
  return r && p.money === 10000 && p.energie !== 50 && p.etudes.niveau !== 'doctorat' ? true : `money ${p.money}, verdict ${r}`;
});
test('HM-2b', 'point d’arrêt pendant une action : écriture bloquée, action refusée', () => {
  const p = vault();
  begin('act');
  foreign('p.money += 5e7')(p);
  const r = end();
  takeViolation();
  return r && p.money === 10000 ? true : `money ${p.money}, verdict ${r}`;
});
test('HM-2c', 'objets imbriqués, tableaux, suppression, defineProperty, prototype : tout est gardé', () => {
  const p = vault();
  p.biens.push({ uid: 1, id: Object.keys(eco.ASSETS)[0], valeur: 500, achat: 500, depuis: 30 }); // écriture légitime (code du jeu)
  takeViolation();
  const tries = [
    'p.biens[0].valeur = 9e8', 'p.biens.push({ id: "villa", valeur: 1 })', 'delete p.biens[0]', 'p.business.push({ type: "x", valo: 9e8 })',
    'Object.defineProperty(p, "money", { get: () => 9e8 })', 'Object.setPrototypeOf(p, { money: 9e8 })', 'Object.assign(p, { money: 9e8 })',
    'p.carriere = { id: "pdg", niveau: 9 }', 'p.justice.prison = 0', 'p.stats.charisme = 100', 'p.annee.loto = -100',
  ];
  for (const t of tries) {
    foreign(t)(p);
    if (!takeViolation()) return `non détecté : ${t}`;
  }
  return p.biens.length === 1 && p.biens[0].valeur === 500 && p.money === 10000 ? true : `état altéré : ${stringify(p.biens)} ${p.money}`;
});
test('HM-2d', 'objet brut modifié hors du Proxy → détecté, puis restauré', () => {
  const p = vault();
  __test.raw().money = 77777777;
  const r1 = verifier(p);
  restore();
  const ok1 = r1 && p.money === 10000;
  __test.raw().relations[0].rel = 3; // champ non témoin : l'empreinte complète l'attrape
  const r2 = verifier(p);
  restore();
  takeViolation();
  return ok1 && r2 ? true : `témoins ${r1}, empreinte ${r2}`;
});
test('HM-2e', 'pile falsifiée (stackTraceLimit, prepareStackTrace) → détectée et réparée', () => {
  const p = vault();
  const lim = Error.stackTraceLimit;
  Error.stackTraceLimit = 0;
  foreign('p.money = 9e8')(p);
  const r1 = takeViolation() || verifier(p);
  Error.stackTraceLimit = lim;
  verifier(p);
  const pst = Error.prepareStackTrace;
  Error.prepareStackTrace = () => 'at x (file:///jeu.js:1:1)';
  foreign('p.money = 9e8')(p);
  const r2 = takeViolation() || verifier(p);
  Error.prepareStackTrace = pst;
  takeViolation();
  return r1 && r2 && p.money === 10000 ? true : `limit ${r1}, prepare ${r2}, money ${p.money}`;
});
test('HM-2f', 'clic déclenché par un script ou une extension : la partie reste légitime', () => {
  const p = vault(30, 1000);
  const viaScript = foreign('return p()'); // l'action est lancée depuis du code étranger, mais ce sont les règles du jeu qui écrivent
  const r = viaScript(() => {
    begin('bourse');
    eco.bourseAction(p, 'placer', 100);
    flow.doActivity(p, 'loto');
    return end();
  });
  const v = takeViolation();
  return !r && !v && p.bourse >= 0 && p.money !== 1000 ? true : `faux positif : ${r || v}`;
});
test('HM-3', 'journal : chaque gain est rattaché à son action, solde attendu = solde réel', () => {
  const p = vault(30, 1000);
  begin('bourse');
  eco.bourseAction(p, 'placer', 400);
  const r1 = end();
  begin('cplay');
  eco.roulette(p, 100, 'rouge');
  const r2 = end();
  const j = journal();
  return !r1 && !r2 && j.length === 2 && j[0].a === 'bourse' && j[0].m === -400 && j[0].b === 400 && j[1].solde === p.money && comptaOk(__test.raw()) ? true : `${r1} ${r2} ${stringify(j)}`;
});
test('HM-3b', 'légitimité : une action d’interface ne change rien, un achat n’enrichit pas', () => {
  const p = vault(30, 1000);
  begin('tab');
  p.money += 500; // même venant du code du jeu, c'est illégitime dans cette action
  const r1 = end();
  restore();
  takeViolation();
  begin('buyasset');
  p.money += 1;
  const r2 = end();
  restore();
  takeViolation();
  return r1 && r2 && p.money === 1000 ? true : `${r1} / ${r2} / ${p.money}`;
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
test('HM-4b', 'tricheur qui connaît la clé de signature : le journal le trahit', () => {
  store.clear();
  const p = vault(30, 1000);
  save(p);
  const forge = (fn) => {
    const s = parse(store.get('destino.save.v1'));
    delete s._h;
    fn(s);
    const json = stringify(s);
    store.set('destino.save.v1', json.slice(0, -1) + ',"_h":' + stringify(sign(json)) + '}'); // re-signée correctement
    load();
    return saveIssue();
  };
  const r1 = forge((s) => (s.money = 50000000));
  const r2 = forge((s) => { s.money = 50000000; s.compta.solde = 50000000; });
  const r3 = forge((s) => { s.money = 50000000; delete s.compta; });
  return r1 && r2 && r3 ? true : `argent seul ${r1}, solde aussi ${r2}, journal supprimé ${r3}`;
});
test('HM-4c', 'validation stricte : identifiants inconnus et valeurs impossibles refusés', () => {
  const bad = [
    (s) => s.biens.push({ id: 'jet_prive_magique', valeur: 1 }), (s) => (s.carriere = { id: 'dieu', niveau: 0 }), (s) => (s.etudes.niveau = 'prix_nobel'),
    (s) => (s.stats.intel = 999), (s) => (s.energie = 1e6), (s) => s.business.push({ type: 'banque_centrale', valo: 1 }), (s) => (s.justice.prison = -5),
  ];
  for (const f of bad) {
    const s = vie(30, 1000);
    f(s);
    if (!validerEtat(s)) return `accepté : ${f}`;
  }
  return validerEtat(vie(30, 1000)) === null ? true : `vie saine refusée : ${validerEtat(vie(30, 1000))}`;
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

// ---------- v0.11 Banque : un emprunt ne crée jamais d'argent ----------
const bank = await import('../src/engine/bank.js');
const credit = await import('../src/engine/credit.js');
const salarie = (money = 20000, job = 'commercial') => {
  const s = vie(35, money);
  s.etudes.niveau = 'master';
  flow.applyJob(s, job);
  s.carriere = s.carriere || { id: job, niveau: 1, annees: 4, perf: 60 };
  s.carriere.annees = 4;
  s.justice.casier = [];
  Object.assign(s.id, { statut: 'ne_france', ville: 'Lyon' });
  s.logement = 'appart';
  s.chezParents = false;
  return s;
};
test('BK-1', 'salarié ordinaire : crédit auto accordé avec une offre claire', () => {
  const s = salarie(20000);
  const sm = credit.simuler(s, 'bien:citadine', 0, 4);
  const o = sm.o;
  return o.ok === true && o.mensualite > 0 && o.cout > 0 && o.endettement < 0.35 ? true : `refus : ${o.ok} (endettement ${o.endettement})`;
});
test('BK-2', 'acheter à crédit coûte exactement l’apport et les frais, sans liquidités', () => {
  for (const cible of ['bien:citadine', 'bien:t2', 'biz:garage']) {
    const s = salarie(cible === 'bien:citadine' ? 20000 : 120000, 'developpeur');
    const d = credit.simuler(s, cible).C.durees.at(-1);
    const o = credit.simuler(s, cible, cible === 'bien:citadine' ? 0 : cible === 'biz:garage' ? 20000 : 60000, d).o;
    const avant = s.money;
    const r = credit.souscrire(s, cible, o.apport, d);
    if (r.err) return `${cible} refusé : ${r.r}`;
    if (s.money !== avant - o.apport - o.frais) return `${cible} : ${avant} → ${s.money}`;
  }
  return true;
});
test('BK-3', 'revendre aussitôt un bien financé ne rapporte rien (la banque passe d’abord)', () => {
  const s = salarie(60000, 'developpeur');
  const avant = s.money;
  credit.souscrire(s, 'bien:t2', 40000, 25);
  const b = s.biens.find((x) => x.id === 't2');
  const r = eco.sellAsset(s, b.uid);
  return s.money < avant && (r.err || !s.banque.prets.length) ? true : `avant ${avant}, après ${s.money}, prêts ${s.banque.prets.length}`;
});
test('BK-4', 'deux échéances impayées : saisie, fichage, aucun enrichissement', () => {
  const s = salarie(60000, 'developpeur');
  credit.souscrire(s, 'bien:t2', 40000, 25);
  s.carriere = null;
  s.money = -50000;
  bank.bankTick(s);
  bank.bankTick(s);
  const saisi = !s.biens.some((x) => x.id === 't2');
  return saisi && s.banque.fiche >= 4 && s.money < 0 ? true : `saisi ${saisi}, fiche ${s.banque.fiche}, argent ${s.money}`;
});
test('BK-5', 'rétablissement personnel : tout est vendu, dettes effacées, fiché', () => {
  const s = salarie(60000, 'developpeur');
  credit.souscrire(s, 'bien:t2', 40000, 25);
  s.banque.epargne = 5000;
  apply(s, { surendettement: 'faillite' });
  return !s.biens.length && !s.banque.prets.length && s.banque.epargne === 0 && s.money >= 0 && s.banque.fiche >= 5 ? true : `biens ${s.biens.length}, prêts ${s.banque.prets.length}, argent ${s.money}`;
});
test('BK-6', 'endettement au-delà de 35 % refusé, comme les détenus, mineurs et fichés', () => {
  const s = salarie(400000, 'caissier');
  const o = credit.simuler(s, 'bien:immeuble', 125000, 10).o;
  const p = salarie(50000); p.justice.prison = 3;
  const m = vie(16, 50000);
  const f = salarie(50000); f.banque.fiche = 3;
  const refus = [credit.simuler(p, 'bien:citadine').o.ok, credit.simuler(m, 'bien:citadine').o.ok, credit.simuler(f, 'bien:citadine').o.ok];
  return o.ok !== true && /35 %/.test(o.ok) && refus.every((x) => x !== true) ? true : `immeuble ${o.ok}, autres ${refus}`;
});
test('BK-7', 'livret : plafond respecté, montants invalides refusés', () => {
  const s = salarie(100000);
  bank.livret(s, 50000);
  const ok1 = s.banque.epargne === bank.LIVRET_PLAFOND && s.money === 100000 - bank.LIVRET_PLAFOND;
  for (const b of BAD.filter((x) => !(typeof x === 'number' && Number.isFinite(x)))) bank.livret(s, b);
  return ok1 && s.banque.epargne === bank.LIVRET_PLAFOND && fini(s) ? true : `épargne ${s.banque.epargne}, argent ${s.money}`;
});
test('BK-8', 'succession : assurance emprunteur pour l’immobilier, autres dettes payées avant l’héritage', () => {
  const s = salarie(80000, 'developpeur');
  credit.souscrire(s, 'bien:t2', 40000, 25);
  credit.souscrire(s, 'bien:citadine', 0, 4);
  const dettesAuto = s.banque.prets.filter((p) => p.type === 'auto').reduce((t, p) => t + p.reste, 0);
  const cash = s.money;
  const reg = bank.succession(s);
  return reg.assurance > 0 && reg.dettes === dettesAuto && s.money === Math.max(0, cash - dettesAuto) + reg.vendus - (cash - dettesAuto < 0 ? 0 : 0) && !s.banque.prets.length ? true : `reg ${JSON.stringify(reg)}, argent ${s.money}`;
});
test('BK-9', 'sauvegarde importée retouchée : refusée, partie précédente conservée', () => {
  const sv = vie(30, 1000);
  save(sv);
  const bon = localStorage.getItem('destino.save.v1');
  const { importerSauvegarde } = SAVE;
  const triche = bon.replace('"money":1000', '"money":9999999');
  const r = importerSauvegarde(triche);
  return r && localStorage.getItem('destino.save.v1') === bon && importerSauvegarde(bon) === null ? true : `verdict ${r}`;
});

// ---------- Faux positifs : des vies honnêtes, jouées à travers le coffre-fort, ne déclenchent jamais Hitman ----------
test('HM-7', 'aucun faux positif sur 40 vies (héritages, ventes, casino, bourse, entreprises)', () => {
  const t0 = performance.now();
  let annees = 0, heritages = 0, gros = 0;
  const act = (p, a, fn) => {
    begin(a);
    try { fn(); } finally {
      const r = end();
      if (r) throw new Error(`${a} : ${r}`);
    }
  };
  const pickR = (arr) => arr[Math.floor(rand() * arr.length)];
  for (let v = 0; v < 40; v++) {
    let p = protect(life2.migrate3(eco.migrate(createLife(randomConfig()))));
    act(p, 'init', () => life2.giveParentJobs(p));
    for (let y = 0; y < 120; y++) {
      if (!p.vivant) {
        const kid = p.relations.find((r) => r.lien === 'enfant' && r.vivant);
        if (!kid || heritages > 60) break;
        p.money += 0; // lecture/écriture neutre hors action (code du jeu) : tolérée
        const ns = flow.continueAsChild(p, kid.id);
        life2.migrate3(eco.migrate(ns));
        p = protect(ns);
        heritages++;
      }
      for (let g = 0; g < 40 && flow.busy(p); g++) {
        if (p.current) {
          const ch = flow.choicesView(p).filter((c) => c.ok);
          if (!ch.length) { act(p, 'choose', () => (p.current = null)); break; }
          act(p, 'choose', () => flow.choose(p, pickR(ch).i));
        } else if (p.result) act(p, 'cont', () => flow.continueResult(p));
      }
      const m0 = p.money;
      if (p.age >= 18) {
        const r = rand();
        if (r < 0.15) act(p, 'cplay', () => eco.slots(p, Math.max(1, Math.floor(p.money * 0.1))));
        else if (r < 0.25) act(p, 'cplay', () => eco.roulette(p, Math.max(1, Math.floor(p.money * 0.2)), pickR(['rouge', '17'])));
        else if (r < 0.35) act(p, 'bourse', () => eco.bourseAction(p, pickR(['placer', 'retirer']), Math.floor(p.money / 2)));
        else if (r < 0.45) act(p, 'buyasset', () => eco.buyAsset(p, pickR(Object.keys(eco.ASSETS))));
        else if (r < 0.55 && p.biens.length) act(p, 'sellasset', () => eco.sellAsset(p, p.biens[0].uid));
        else if (r < 0.62) act(p, 'openbiz', () => eco.createBusiness(p, pickR(Object.keys(eco.BUSINESS)), 'Test'));
        else if (r < 0.75) act(p, 'apply', () => flow.applyJob(p, pickR(Object.keys(flow.CAREERS))));
        else if (r < 0.8) { const cb = pickR(['bien:citadine', 'bien:studio', 'bien:t2', 'logement:maison', 'biz:garage']); const sm = credit.simuler(p, cb); if (sm) act(p, 'csigne', () => credit.souscrire(p, cb, sm.o.apportMin, pickR(sm.C.durees))); }
        else if (r < 0.85) act(p, 'livret', () => bank.livret(p, rand() < 0.6 ? Math.floor(p.money * 0.3) : -2000));
        else if (r < 0.87 && p.banque?.prets?.length) act(p, 'anticipe', () => bank.rembourserAnticipe(p, p.banque.prets[0].uid));
      }
      if (rand() < 0.4) act(p, 'act', () => flow.doActivity(p, pickR(flow.ACTIVITIES).id));
      const rel = p.relations.find((x) => x.vivant);
      if (rel && rand() < 0.3) act(p, 'relact', () => flow.relAction(p, rel.id, pickR(['temps', 'argent', 'cadeau'])));
      act(p, 'render', () => checkAchievements(p));
      act(p, 'age', () => flow.ageUp(p));
      if (Math.abs(p.money - m0) > 1e6) gros++;
      const r = verifier(p) || validerEtat(__test.raw());
      if (r) return `vie ${v}, ${p.age} ans : ${r}`;
      if (y % 25 === 0) {
        save(p);
        if (!load() || saveIssue()) return `vie ${v} : sauvegarde légitime refusée (${saveIssue()})`;
      }
      annees++;
    }
  }
  const ms = (performance.now() - t0) / annees;
  console.log(`  HM-7 : ${annees} années jouées à travers le coffre-fort, ${heritages} héritages, ${gros} variations > 1 M€, ${ms.toFixed(2)} ms par année`);
  return true;
});

console.log(`Anti-triche : ${pass} tests réussis, ${fails.length} en échec`);
fails.forEach((f) => console.log('  ✗', f));
process.exit(fails.length ? 1 : 0);
