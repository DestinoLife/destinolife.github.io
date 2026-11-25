import { rnd, pick, chance, clamp, weighted, euros } from './rng.js';
import { DAY, HOUR, birthdayAt, setHour, rollMeteo, pickHour, hourOf, isWeekday } from './time.js';
import {
  apply, tpl, addLog, die, arrest, career, salary, jobTitle, changeLevel, setCareer, giveDiploma, partnerOf,
  parentsOf, childrenOf, ensureFriend, newPerson, createLife, partnerGenre, g,
} from './core.js';
import { EVENTS, EV } from '../data/events.js';
import { ACTIVITIES, ACT } from '../data/activities.js';
import { CAREERS, canApply, dipRank } from '../data/careers.js';
import { HOUSING, originScene } from '../data/housing.js';
import { MILIEUX, TRAITS, TALENTS } from '../data/identity.js';
import { randomLook } from '../data/look.js';
import { worldTick, migrate, patrimoine, eco } from './economy.js';
import { life2Tick, migrate3, DISEASES, friendService } from './life2.js';
import { messagesTick, runPlan } from './messages.js';
import { energieMax } from '../data/unlocks.js';
const DISEASE_NOM = new Proxy({}, { get: (_, k) => DISEASES[k]?.nom || 'Maladie' });

export const busy = (s) => !!(s.current || s.result);
export const inPrison = (s) => s.justice.prison > 0;

// ---------- Temps ----------
export function advanceTime(s, days, hourRange) {
  const limit = birthdayAt(s.birthT, s.age + 1) - 2 * HOUR;
  const prev = s.t;
  let t = setHour(prev + days * DAY, pickHour(hourRange));
  if (t <= prev) t = prev + rnd(1, 4) * HOUR;
  s.t = Math.min(t, limit);
  s.meteo = rollMeteo(s.t, s.id.ville);
}

// ---------- Scène courante ----------
export function currentScene(s) {
  if (!s.vivant) return 'rue';
  if (inPrison(s)) return 'prison';
  if (s.lieu) return s.lieu === 'pays' ? originScene(s.id.origine) : s.lieu;
  if (s.voyage) return s.voyage.scene === 'pays' ? originScene(s.id.origine) : s.voyage.scene;
  if (s.cavale) return s.cavale.scene;
  if (s.expat && s.logement !== 'villa' && hourOf(s.t) >= 18) return s.expat.scene;
  const h = hourOf(s.t);
  const work = isWeekday(s.t) && h >= 9 && h < 18;
  if (work && s.carriere && s.age >= 16) return career(s).scene;
  if (work && s.age >= 3 && s.etudes.cursus && s.id.statut !== 'au_pays') return 'ecole';
  const sc = HOUSING[s.logement]?.scene || 'rue';
  return sc === 'pays' ? originScene(s.id.origine) : sc;
}

export function outfitOf(s) {
  if (s.age < 3) return 'bebe';
  if (inPrison(s)) return 'prison';
  if (!s.chezParents && s.logement === 'rue') return 'sdf';
  if (currentScene(s) === 'plage') return 'plage';
  const c = career(s);
  const sc = currentScene(s);
  if (c && s.age >= 16 && sc === c.scene) return c.outfit;
  if (c && ['rap', 'police', 'militaire'].includes(c.outfit) && sc !== 'plage') return c.outfit;
  if (s.money > 600000 && s.look.style === 'chic') return 'luxe';
  return s.look.style || 'casual';
}

// ---------- Événements ----------
function eligible(s, e) {
  if (e.chain || e.forced) return false;
  if (e.once && s.seen[e.id]) return false;
  if (e.where === 'prison' ? !inPrison(s) : inPrison(s) && e.where !== 'any') return false;
  if (e.age && (s.age < e.age[0] || s.age > e.age[1])) return false;
  try {
    return !e.cond || !!e.cond(s);
  } catch (err) {
    console.warn('cond', e.id, err);
    return false;
  }
}

function pickYearEvents(s) {
  const pool = EVENTS.filter((e) => eligible(s, e));
  let n = s.age < 3 ? (chance(0.5) ? 1 : 0) : 1 + (chance(0.55) ? 1 : 0) + (chance(0.2) ? 1 : 0);
  while (n-- > 0 && pool.length) {
    const e = weighted(pool, (x) => {
      const w = typeof x.w === 'function' ? x.w(s) : x.w ?? 1;
      const recent = s.lastSeen[x.id] != null && s.age - s.lastSeen[x.id] < 4;
      return recent ? w * 0.12 : w;
    });
    if (!e) break;
    pool.splice(pool.indexOf(e), 1);
    s.queue.push(e.id);
  }
}

function baseTmp(s) {
  const p = partnerOf(s);
  return { ami: s.age >= 5 ? ensureFriend(s).prenom : 'ton voisin', partenaire: p?.prenom || '', pays: s.id.pays };
}

export function presentNext(s) {
  if (busy(s) || !s.vivant) return;
  if (!s.queue.length && s.plans?.length && s.plans[0].at <= s.t) runPlan(s);
  while (s.queue.length) {
    const id = s.queue.shift();
    const ev = EV[id];
    if (!ev) {
      console.warn('Événement inconnu', id);
      continue;
    }
    if (!ev.chain && !ev.forced && !eligible(s, ev)) continue;
    s.tmp = ev.chain ? { ...s.tmp, ...baseTmp(s) } : baseTmp(s);
    if (ev.pre) ev.pre(s);
    s.seen[id] = true;
    s.lastSeen[id] = s.age;
    if (ev.avec) s.avec = avecIds(s, ev.avec);
    if (ev.sms) {
      const from = tpl(ev.sms, s);
      apply(s, { sms: { from, txt: typeof ev.txt === 'function' ? ev.txt(s) : ev.txt } });
    }
    s.current = { id, txt: tpl(ev.txt, s), cat: tpl(ev.cat || 'Vie', s), major: ev.major || 0, sms: ev.sms ? tpl(ev.sms, s) : null };
    return;
  }
}

function avecIds(s, k) {
  const alive = s.relations.filter((r) => r.vivant);
  if (k === 'partenaire') return alive.filter((r) => r.lien === 'partenaire' || r.lien === 'conjoint').map((r) => r.id).slice(0, 1);
  if (k === 'enfant') return alive.filter((r) => r.lien === 'enfant').map((r) => r.id).slice(0, 2);
  if (k === 'famille') return alive.filter((r) => ['partenaire', 'conjoint', 'enfant'].includes(r.lien)).map((r) => r.id).slice(0, 3);
  if (k === 'parents') return alive.filter((r) => r.lien === 'mere' || r.lien === 'pere').map((r) => r.id).slice(0, 2);
  if (k === 'ami') return alive.filter((r) => r.lien === 'ami').map((r) => r.id).slice(0, 1);
  return [];
}

export function choicesView(s) {
  if (!s.current) return [];
  const ev = EV[s.current.id];
  return ev.ch
    .map((c, i) => ({ i, t: tpl(c.t, s), h: c.h ? tpl(c.h, s) : '', ok: !c.c || !!c.c(s), hide: c.hide && c.hide(s) }))
    .filter((c) => !c.hide);
}

export function choose(s, i) {
  if (!s.current) return;
  const ev = EV[s.current.id];
  const c = ev.ch[i];
  if (!c || (c.c && !c.c(s))) return;
  apply(s, c.fx);
  let res = c;
  if (c.out && s.vivant) {
    for (let k = 0; k < c.out.length; k++) {
      const o = c.out[k];
      const p = typeof o.p === 'function' ? o.p(s) : o.p;
      if (k === c.out.length - 1 || Math.random() < clamp(p, 0, 1)) {
        res = o;
        break;
      }
    }
    if (res !== c) apply(s, res.fx);
  }
  const r = tpl(res.r ?? (res === c ? '' : c.r) ?? '', s);
  const next = res.next !== undefined ? res.next : c.next;
  const days = res.days ?? c.days ?? 0;
  if (r) addLog(s, r);
  if (days > 0 && s.vivant) advanceTime(s, days, res.hour || c.hour);
  s.current = null;
  if (next && s.vivant) s.queue.unshift(next);
  s.result = r ? { txt: r, cat: tpl(ev.cat || 'Vie', s), dead: !s.vivant } : null;
  if (!s.result) presentNext(s);
}

export function continueResult(s) {
  s.result = null;
  presentNext(s);
}

// ---------- Passage d'une année ----------
export function ageUp(s) {
  if (!s.vivant || busy(s) || s.queue.length) return null;
  if (s.plans?.length) { runPlan(s); presentNext(s); return null; }
  if (s.voyage?.id === 'jour') s.voyage = null;
  const rep = { revenus: 0, depenses: 0 };
  s.age++;
  s.t = setHour(birthdayAt(s.birthT, s.age), rnd(8, 21));
  s.lieu = null;
  s.energie = inPrison(s) ? Math.min(3, energieMax(s.age)) : energieMax(s.age);
  s.relUsed = {};
  s.meteo = rollMeteo(s.t, s.id.ville);
  s.relations.forEach((r) => r.vivant && r.age++);

  if (s.id.arrivee === s.age && s.id.statut === 'au_pays') s.queue.push('arrivee_france');
  school(s);
  careerTick(s);
  finances(s, rep);
  life2Tick(s);
  worldTick(s);
  justiceTick(s);
  health(s);
  family(s);
  if (s.vivant) pickYearEvents(s);
  if (s.vivant && s.logement === 'rue' && !s.chezParents && s.relations.some((r) => r.vivant && r.lien === 'ami' && (r.conf ?? 0) >= 60) && chance(0.5)) s.queue.unshift('ami_heberge');
  messagesTick(s);
  presentNext(s);
  return rep;
}

function school(s) {
  const e = s.etudes;
  if (s.id.statut === 'au_pays' && s.age < 16) return;
  if (s.age === 3 && e.cursus === 'ecole') addLog(s, 'Entrée en maternelle.');
  if (s.age === 6 && e.cursus === 'ecole') addLog(s, 'Entrée au CP.');
  if (s.age === 11 && e.cursus === 'ecole') addLog(s, 'Entrée au collège.');
  if (e.cursus === 'ecole') {
    s.stats.intel = clamp(s.stats.intel + rnd(0, 2));
    if (s.age >= 15) s.queue.push('brevet', 'orientation');
    return;
  }
  if (!e.cursus || inPrison(s)) return;
  const fail = ['fac', 'bts', 'medecine', 'droit', 'master'].includes(e.cursus) && chance(clamp(0.32 - s.stats.intel / 260, 0.03, 0.3));
  if (fail) {
    addLog(s, 'Tu redoubles ton année.');
    s.stats.bonheur = clamp(s.stats.bonheur - 5);
    return;
  }
  e.reste--;
  s.stats.intel = clamp(s.stats.intel + rnd(1, 3));
  if (e.reste > 0) return;
  const fin = { lycee: null, cap: 'cap', fac: 'licence', bts: 'bts', medecine: 'doctorat', droit: 'master', master: 'master', daeu: 'bac' }[e.cursus];
  if (e.cursus === 'lycee') s.queue.push('bac');
  else if (fin) {
    giveDiploma(s, fin);
    addLog(s, `Diplôme obtenu : ${fin === 'doctorat' ? 'doctorat de médecine' : fin.toUpperCase()}.`);
    s.stats.bonheur = clamp(s.stats.bonheur + 8);
  }
  e.cursus = null;
  e.reste = null;
}

function careerTick(s) {
  const c = career(s);
  if (!c) return;
  if (inPrison(s)) return;
  const k = s.carriere;
  k.annees++;
  if (c.fame) {
    s.stats.notoriete = clamp(s.stats.notoriete - rnd(1, 5));
    let lvl = 0;
    c.fame.forEach((f, i) => s.stats.notoriete >= f && (lvl = i));
    if (lvl !== k.niveau) changeLevel(s, lvl - k.niveau);
  } else if (k.niveau < c.niveaux.length - 1) {
    const p = (c.promo || 0.15) + (k.perf - 50) / 220 + (c.stat ? s.stats[c.stat] / 450 : 0) + (s.traits.includes('ambitieux') ? 0.06 : 0);
    if (chance(p * (1 - 0.18 * k.niveau))) changeLevel(s, 1);
  }
  k.perf = Math.round(k.perf + (55 - k.perf) * 0.3);
  if (c.retraite && s.age >= rnd(c.retraite[0], c.retraite[1])) s.queue.push('fin_carriere_sport');
  if (['classique', 'police', 'business', 'militaire'].includes(c.cat) && s.age >= 64 && !s.seen.retraite) s.queue.push('retraite');
  if (c.risque) {
    const p = c.risque[k.niveau] * (1 - s.stats.crime / 260) * (s.traits.includes('mefiant') ? 0.75 : 1);
    if (chance(p)) {
      s.justice.recherche = clamp(s.justice.recherche + rnd(1, 2), 0, 5);
      s.justice.motif = c.motif;
    }
    s.stats.crime = clamp(s.stats.crime + 2);
  }
}

export function yearlyCosts(s) {
  if (inPrison(s)) return 0;
  const kids = childrenOf(s).filter((c) => c.vivant && c.age < 18).length * 3000;
  if (s.chezParents) return kids;
  const h = HOUSING[s.logement] || HOUSING.hlm;
  return (h.vie || 7000) + (s.proprio ? h.entretien || 0 : h.loyer || 0) + kids;
}
export const isCrime = (s) => !!s.carriere && career(s).cat === 'crime';
export const isBoss = (s) => !!s.carriere && career(s).cat === 'business';
// Un entrepreneur n'a pas de salaire fixe : revenu « moyen attendu » ici (affichage, impôts), le vrai est tiré chaque année.
export const yearlyIncome = (s) => (inPrison(s) ? 0 : (isCrime(s) ? 0 : isBoss(s) ? Math.round(salary(s) * 12 * 0.55 * eco(s).mult) : salary(s) * 12) + s.pension * 12);

// Impôt sur le revenu (barème simplifié, par part).
export function impot(revenu) {
  const T = [[11300, 0], [28800, 0.11], [82300, 0.3], [177100, 0.41], [Infinity, 0.45]];
  let reste = revenu, prev = 0, tax = 0;
  for (const [lim, taux] of T) {
    const part = Math.max(0, Math.min(reste, lim - prev));
    tax += part * taux;
    reste -= part;
    prev = lim;
    if (reste <= 0) break;
  }
  return Math.round(tax);
}
export const legalIncome = (s) => yearlyIncome(s) + (s.business || []).reduce((t, b) => t + Math.max(0, b.benef || 0), 0);

// Fiscalité complète : dépend du revenu, de la famille, des entreprises, de la propriété et de la fortune.
export function fiscalite(s) {
  const z = { revenu: 0, societes: 0, fonciere: 0, fortune: 0, parts: 1, total: 0, fortuneNette: 0, regime: 'normal' };
  if (s.age < 18 || inPrison(s)) return z;
  const marie = s.relations.some((r) => r.vivant && r.lien === 'conjoint');
  const kids = childrenOf(s).filter((k) => k.vivant && k.age < 18).length;
  z.parts = 1 + (marie ? 1 : 0) + Math.min(kids, 2) * 0.5 + Math.max(0, kids - 2);
  z.revenu = Math.round(impot(yearlyIncome(s) / z.parts) * z.parts);
  z.societes = Math.round((s.business || []).reduce((t, b) => { const bf = Math.max(0, b.benef || 0); return t + Math.min(bf, 42500) * 0.15 + Math.max(0, bf - 42500) * 0.25; }, 0));
  const h = HOUSING[s.logement];
  const immo = s.proprio && h?.achat ? h.achat : 0;
  z.fonciere = Math.round(immo * 0.005);
  z.fortuneNette = Math.max(0, s.money) + patrimoine(s) + immo;
  if (z.fortuneNette > 1300000) {
    const T = [[800000, 0], [1300000, 0.005], [2570000, 0.007], [5000000, 0.01], [10000000, 0.0125], [Infinity, 0.015]];
    let prev = 0;
    for (const [lim, taux] of T) { z.fortune += Math.max(0, Math.min(z.fortuneNette, lim) - prev) * taux; prev = lim; if (z.fortuneNette <= lim) break; }
    z.fortune = Math.round(z.fortune);
  }
  if (s.flags.exil_fiscal) { z.regime = 'exil'; z.revenu = Math.round(z.revenu * 0.2); z.fortune = 0; z.fonciere = Math.round(z.fonciere * 0.5); }
  else if (s.flags.offshore) { z.regime = 'offshore'; z.revenu = Math.round(z.revenu * 0.4); z.fortune = Math.round(z.fortune * 0.3); z.societes = Math.round(z.societes * 0.4); }
  else if (s.flags.optimisation) { z.regime = 'optimise'; z.revenu = Math.round(z.revenu * 0.8); z.fortune = Math.round(z.fortune * 0.75); z.societes = Math.round(z.societes * 0.85); }
  z.total = z.revenu + z.societes + z.fonciere + z.fortune;
  return z;
}

function finances(s, rep) {
  let inc = yearlyIncome(s);
  const dep = yearlyCosts(s);
  // Entrepreneur : bonnes et mauvaises années, crises, et parfois la faillite
  if (isBoss(s) && !inPrison(s)) {
    const k = (0.05 + Math.random() * 0.95 + (Math.random() - 0.5) * 0.6 + (s.carriere.perf || 0) / 300) * eco(s).mult;
    inc = Math.round(salary(s) * 12 * k) + s.pension * 12;
    if (k < 0.15 && chance(0.35)) s.queue.push('faillite_boite');
  }
  let poche = 0;
  if (s.chezParents && s.age >= 12 && s.age < 18) poche = MILIEUX[s.milieu].poche;
  const fz = fiscalite(s);
  const tax = fz.total;
  rep.impots = tax;
  s.mem.impotsAvant = s.mem.impotsAn || 0;
  s.mem.impotsAn = tax;
  s.mem.fraudeCumul = s.flags.offshore ? (s.mem.fraudeCumul || 0) + Math.round(tax * 1.2) : 0;
  // Avis d'imposition : seulement la 1re fois, ou quand la facture change nettement (pas chaque année)
  if (tax >= 500 && (!s.flags.avis_impot || tax > (s.mem.impotsAvant || 0) * 1.6 || (fz.fortune && !s.flags.avis_ifi))) {
    s.flags.avis_impot = true;
    if (fz.fortune) s.flags.avis_ifi = true;
    const det = [fz.revenu && `revenu ${euros(fz.revenu)}`, fz.societes && `sociétés ${euros(fz.societes)}`, fz.fonciere && `foncière ${euros(fz.fonciere)}`, fz.fortune && `fortune ${euros(fz.fortune)}`].filter(Boolean).join(', ');
    s.phone.msgs.push({ from: 'Impôts.gouv', txt: `Ton avis d’imposition est disponible : ${euros(tax)} à payer cette année (${det}). Détail dans l’onglet Biens.`, age: s.age, t: s.t, read: true });
  }
  // Gains illégaux : variables, selon ton rang et ton activité de l'année (argent sale)
  let sale = 0;
  if (isCrime(s) && !inPrison(s)) {
    sale = Math.round(salary(s) * 12 * (0.25 + Math.random() * 0.5 + Math.min(0.5, s.carriere.perf / 200)));
    s.sale += sale;
  }
  // Un ado dépense son argent de poche (sorties, fringues, jeux)
  const ado = s.age < 18 && s.money > 0 ? Math.round(s.money * 0.35) : 0;
  s.money += inc - dep + poche - tax + sale - ado;
  rep.revenus = inc + poche + sale;
  rep.depenses = dep + tax + ado;
  if (inc || dep || sale) addLog(s, `Bilan : ${euros(inc + poche)} de revenus${sale ? `, ${euros(sale)} d’argent sale` : ''}, ${euros(dep)} de dépenses${tax ? `, ${euros(tax)} d’impôts (${[fz.revenu && `revenu ${euros(fz.revenu)}`, fz.societes && `sociétés ${euros(fz.societes)}`, fz.fonciere && `foncière ${euros(fz.fonciere)}`, fz.fortune && `fortune ${euros(fz.fortune)}`].filter(Boolean).join(', ')})` : ''}.`);
  if (s.money < -4000 && !s.chezParents && !['rue', 'bidonville', 'pays'].includes(s.logement) && !inPrison(s)) s.queue.unshift('expulsion');
}

function justiceTick(s) {
  const j = s.justice;
  if (j.prison > 0) {
    j.prison--;
    s.stats.bonheur = clamp(s.stats.bonheur - rnd(2, 6));
    if (j.prison === 0) {
      s.flags.exdetenu = true;
      s.mem.peine = j.peineTotale;
      s.queue.unshift('sortie_prison');
      if (s.id.statut === 'sans_papiers') s.queue.push('oqtf');
    }
    return;
  }
  if (j.recherche > 0 && !s.cavale) {
    if (chance(j.recherche * 0.11)) s.queue.unshift(s.relations.some((r) => r.vivant && r.destin === 'flic' && (r.conf ?? 50) >= 50) && chance(0.6) ? 'ami_flic_previent' : 'interpellation');
    else if (chance(0.45)) j.recherche--;
  }
}

function health(s) {
  const st = s.stats;
  if (s.age > 40 && chance(0.4)) st.sante -= 1;
  if (s.age > 60) st.sante -= rnd(0, 2);
  if (s.age > 75) st.sante -= rnd(1, 4);
  if (s.age < 55) st.sante += rnd(1, 3);
  else if (s.age < 72) st.sante += rnd(0, 2);
  if (s.flags.fumeur) st.sante -= 1;
  st.sante = clamp(st.sante);
  st.bonheur = clamp(st.bonheur + Math.round((55 - st.bonheur) * 0.12));
  if (s.age > 35) st.forme = clamp(st.forme - rnd(0, 2));
  if (st.sante <= 0) {
    const m = (s.maladies || []).find((x) => x.stade >= 2 && DISEASES[x.id]?.letal);
    const add = Object.entries(s.addic || {}).sort((a, b) => b[1] - a[1])[0];
    return die(s, m ? DISEASE_NOM[m.id] : add && add[1] > 50 ? 'Épuisement dû aux addictions' : s.age > 70 ? 'Corps usé par l’âge' : 'Santé trop dégradée');
  }
  let p = s.age < 50 ? 0.0006 : s.age < 65 ? 0.003 : s.age < 75 ? 0.012 : s.age < 83 ? 0.045 : s.age < 92 ? 0.13 : 0.32;
  if (st.sante < 25) p *= 2.5;
  if (chance(p)) die(s, s.age >= 75 ? 'Mort paisible, de vieillesse' : pick(['Crise cardiaque', 'Accident vasculaire cérébral', 'Maladie foudroyante']));
}

function family(s) {
  for (const r of s.relations) {
    if (!r.vivant) continue;
    const p = r.age < 55 ? 0.002 : r.age < 70 ? 0.012 : r.age < 80 ? 0.05 : r.age < 90 ? 0.14 : 0.35;
    if (!chance(p)) continue;
    r.vivant = false;
    s.mem.deuil = `${r.prenom}`;
    addLog(s, `Décès de ${r.prenom} (${r.age} ans).`);
    s.stats.bonheur = clamp(s.stats.bonheur - (r.rel > 60 ? 15 : 6));
    if (r.lien === 'mere' || r.lien === 'pere') {
      const brut = Math.round(MILIEUX[s.milieu].heritage * (0.6 + Math.random() * 0.8) / Math.max(1, parentsOf(s).length + 1));
      // Droits de succession (ligne directe, simplifiés) : 100 000 € d'abattement, puis 20 % jusqu'à 1,8 M€, 40 % au-delà
      const taxable = Math.max(0, brut - 100000);
      const droits = Math.round(Math.min(taxable, 1700000) * 0.2 + Math.max(0, taxable - 1700000) * 0.4);
      const her = brut - droits;
      if (her > 0 && s.age >= 18) {
        s.money += her;
        addLog(s, `Héritage reçu : ${euros(her)}${droits ? ` (après ${euros(droits)} de droits de succession)` : ''}.`);
      }
      if (s.chezParents && !parentsOf(s).length) s.chezParents = s.age < 18;
    }
    if (r.lien === 'partenaire' || r.lien === 'conjoint') r.lien = 'ex';
    s.queue.push('deuil');
  }
  const p = partnerOf(s);
  if (p) p.rel = clamp(p.rel - rnd(0, 5));
  childrenOf(s).forEach((c) => c.vivant && c.age === 18 && addLog(s, `${c.prenom} fête ses 18 ans.`));
}

// ---------- Actions ----------
export function canDo(s, a) {
  if (!s.vivant) return 'Partie terminée.';
  if (a.prison ? !inPrison(s) : inPrison(s)) return inPrison(s) ? 'Impossible en prison.' : 'Seulement en prison.';
  if (a.age && (s.age < a.age[0] || s.age > a.age[1])) return a.age[0] > s.age ? `À partir de ${a.age[0]} ans.` : 'Plus de ton âge.';
  if (a.cond) {
    const r = a.cond(s);
    if (r !== true) return r || 'Indisponible.';
  }
  const cost = typeof a.cost === 'function' ? a.cost(s) : a.cost || 0;
  if (cost > 0 && s.money < cost) return `Il te faut ${euros(cost)}.`;
  return true;
}

export function doActivity(s, id) {
  const a = ACT[id];
  if (!a || busy(s)) return { r: '' };
  const ok = canDo(s, a);
  if (ok !== true) return { r: ok, err: true };
  if (!a.free && s.energie <= 0) return { r: 'Plus d’énergie cette année. Passe à l’année suivante.', err: true };
  if (!a.free) s.energie--;
  s.avec = [];
  if (['sport', 'courir', 'muscu_prison', 'foot_prison', 'jouer'].includes(a.id)) s.annee.sport++;
  if (a.id === 'medecin') s.annee.medecin++;
  const cost = typeof a.cost === 'function' ? a.cost(s) : a.cost || 0;
  s.money -= cost;
  s.tmp = baseTmp(s);
  const out = a.run(s) || {};
  apply(s, out.fx);
  if (s.vivant) {
    if (a.days) advanceTime(s, rnd(a.days[0], a.days[1]), a.hour);
    const lieu = typeof a.lieu === 'function' ? a.lieu(s) : a.lieu;
    if (lieu !== undefined) s.lieu = lieu;
    if (s.lieu === 'plage' && a.id !== 'courir') s.meteo = { type: 'soleil', temp: rnd(25, 32) };
  }
  if (out.queue) s.queue.push(...[].concat(out.queue));
  const r = tpl(out.r || '', s);
  if (r) addLog(s, r);
  presentNext(s);
  return { r, good: out.good };
}

export function applyJob(s, id) {
  const ok = canApply(s, id);
  if (ok !== true) return { r: ok, err: true };
  if (s.energie <= 0) return { r: 'Plus d’énergie cette année.', err: true };
  s.energie--;
  advanceTime(s, rnd(3, 14));
  const c = CAREERS[id];
  let p = 0.5 + s.stats.intel / 300 + s.stats.charisme / 300 - (c.diplome === 'aucun' ? -0.15 : 0);
  if (s.justice.casier.length) p -= 0.15;
  if (chance(clamp(p, 0.1, 0.95))) {
    setCareer(s, id);
    if (s.etudes.cursus === 'ecole' || s.etudes.cursus === 'lycee') s.etudes.cursus = null;
    return { r: tpl(`Embauché{e} : ${jobTitle(s)} (${euros(salary(s))}/mois).`, s), good: true };
  }
  if (s.id.origine !== 'france' && s.id.origine !== 'europe_est' && chance(0.3) && !s.seen.discrimination) s.queue.push('discrimination');
  presentNext(s);
  return { r: 'Candidature refusée. Réessaie ou améliore ton profil.', err: true };
}

export function enroll(s, cursus) {
  const R = {
    fac: { need: 'bac', reste: 3, nom: 'Licence à la fac' },
    bts: { need: 'bac', reste: 2, nom: 'BTS' },
    master: { need: 'licence', reste: 2, nom: 'Master' },
    medecine: { need: 'bac', reste: 9, nom: 'Études de médecine', intel: 65 },
    droit: { need: 'bac', reste: 5, nom: 'Droit (jusqu’au master)' },
    daeu: { need: 'aucun', reste: 1, nom: 'DAEU (équivalent du bac)' },
    cap: { need: 'aucun', reste: 2, nom: 'CAP' },
  }[cursus];
  if (!R) return { r: '', err: true };
  if (s.etudes.cursus) return { r: 'Tu es déjà en études.', err: true };
  if (inPrison(s)) return { r: 'Impossible en prison.', err: true };
  if (dipRank(s.etudes.niveau) < dipRank(R.need)) return { r: `Diplôme requis : ${R.need.toUpperCase()}.`, err: true };
  if (R.intel && s.stats.intel < R.intel) return { r: `Intelligence ${R.intel} requise.`, err: true };
  s.etudes.cursus = cursus;
  s.etudes.reste = R.reste;
  if (s.carriere && !['crime', 'artiste', 'sport'].includes(career(s).cat) && R.reste > 1) setCareer(s, null);
  addLog(s, `Inscription : ${R.nom}.`);
  return { r: tpl(`Inscrit{e} : ${R.nom}.`, s), good: true };
}

// ---------- Logement ----------
export function housingOptions(s) {
  const inc = salary(s) + s.pension;
  return Object.entries(HOUSING)
    .filter(([k]) => !['pays'].includes(k) || s.id.statut === 'au_pays')
    .map(([k, h]) => {
      let why = true;
      if (s.age < 16) why = 'Trop jeune.';
      else if (inPrison(s)) why = 'Impossible en prison.';
      else if (s.logement === k && !s.chezParents) why = 'Tu y vis déjà.';
      else if (k === 'foyer' && !['rue', 'bidonville'].includes(s.logement)) why = 'Réservé aux personnes sans logement.';
      else if (k === 'pays' && s.id.statut !== 'au_pays') why = 'Indisponible.';
      else if (s.id.statut === 'au_pays' && !['pays', 'rue'].includes(k)) why = 'Tu vis au pays.';
      else if (h.revenu && inc < h.revenu && !(h.achat && s.money >= h.achat)) why = `Revenus de ${euros(h.revenu)}/mois requis.`;
      else if (k === 'villa' && s.money < h.achat) why = `Prix : ${euros(h.achat)}.`;
      else if (k === 'hlm' && s.id.statut === 'sans_papiers') why = 'Dossier HLM impossible sans papiers.';
      return { id: k, ...h, ok: why === true, why };
    });
}

export function moveTo(s, id, buy) {
  const o = housingOptions(s).find((h) => h.id === id);
  if (!o || !o.ok) return { r: o?.why || '', err: true };
  if (buy && !o.achat) return { r: 'Ce logement se loue uniquement.', err: true };
  if (!buy && !o.loyer && o.achat && o.id === 'villa') return { r: 'La villa s’achète uniquement.', err: true };
  const saleVal = s.proprio && HOUSING[s.logement]?.achat ? Math.round(HOUSING[s.logement].achat * 0.9) : 0;
  if (buy && s.money + saleVal < o.achat) return { r: `Il te faut ${euros(o.achat)}.`, err: true };
  if (saleVal > 0) {
    s.money += saleVal;
    addLog(s, `Tu revends ton logement : ${euros(saleVal)}.`);
  }
  if (buy) s.money -= o.achat;
  s.logement = id;
  s.chezParents = false;
  s.proprio = !!buy;
  s.lieu = null;
  advanceTime(s, rnd(5, 20));
  addLog(s, `${buy ? 'Achat' : 'Emménagement'} : ${o.nom}.`);
  return { r: `Bienvenue chez toi : ${o.nom}.`, good: true };
}

// ---------- Relations ----------
export function relActions(s, r) {
  if (!r.vivant) return [];
  if (r.lien === 'contact') return [['temps', 'Boire un verre'], ['negocier', 'Négocier le tarif'], ['supprimer', 'Supprimer le contact']].map(([a, t]) => ({ a, t, ok: !s.relUsed[`${r.id}:${a}`] && !inPrison(s) }));
  const used = (a) => s.relUsed[`${r.id}:${a}`];
  const list = [['temps', 'Passer du temps']];
  if (s.age >= 8) list.push(['confier', 'Se confier']);
  if (r.destin && r.age >= 21) list.push(['service', 'Demander un service']);
  if (['mere', 'pere'].includes(r.lien)) list.push(['argent', 'Demander de l’argent']);
  if (['partenaire', 'conjoint', 'ami', 'fratrie', 'mere', 'pere', 'enfant'].includes(r.lien) && s.age >= 12) list.push(['cadeau', 'Offrir un cadeau (150 €)']);
  if (r.lien === 'partenaire' && s.age >= 18) list.push(['mariage', 'Demander en mariage']);
  if (['partenaire', 'conjoint'].includes(r.lien) && s.age >= 18 && s.age <= 50) list.push(['enfant', 'Avoir un enfant']);
  if (['partenaire', 'conjoint'].includes(r.lien)) list.push(['rompre', g(s, 'Rompre', 'Rompre')]);
  list.push(['dispute', 'Se disputer']);
  return list.map(([a, t]) => ({ a, t, ok: !used(a) && !inPrison(s) && !(a === 'cadeau' && s.money < 150) }));
}

export function relAction(s, rid, a) {
  const r = s.relations.find((x) => x.id === rid);
  if (!r || !r.vivant || busy(s)) return { r: '' };
  s.relUsed[`${r.id}:${a}`] = true;
  s.avec = r.lien === 'contact' ? [] : [r.id];
  let out = '';
  if (a === 'temps') {
    r.rel = clamp(r.rel + rnd(4, 12));
    r.conf = clamp((r.conf ?? 50) + rnd(1, 3));
    s.stats.bonheur = clamp(s.stats.bonheur + rnd(1, 4));
    out = `Bon moment avec ${r.prenom}.`;
  } else if (a === 'argent') {
    const base = { precaire: 50, modeste: 200, moyenne: 800, aisee: 3000, riche: 25000 }[s.milieu];
    if (r.rel > 45 && chance(0.6)) {
      const m = Math.round(base * (0.5 + Math.random()));
      s.money += m;
      r.rel = clamp(r.rel - 4);
      out = `${r.prenom} te donne ${euros(m)}.`;
    } else {
      r.rel = clamp(r.rel - 6);
      out = `${r.prenom} refuse sèchement.`;
    }
  } else if (a === 'cadeau') {
    s.money -= 150;
    r.rel = clamp(r.rel + rnd(8, 15));
    out = `${r.prenom} adore ton cadeau.`;
  } else if (a === 'dispute') {
    r.rel = clamp(r.rel - rnd(10, 22));
    r.conf = clamp((r.conf ?? 50) - rnd(3, 8));
    s.stats.bonheur = clamp(s.stats.bonheur - 3);
    out = `Grosse dispute avec ${r.prenom}.`;
  } else if (a === 'mariage') {
    if (chance(r.rel / 110)) {
      apply(s, { marier: true, bonheur: 15, money: -6000 });
      out = `${r.prenom} a dit oui ! Le mariage coûte 6 000 €.`;
    } else {
      r.rel = clamp(r.rel - 15);
      out = `${r.prenom} n’est pas prêt${r.genre === 'f' ? 'e' : ''}.`;
    }
  } else if (a === 'enfant') {
    if (childrenOf(s).length >= 6) out = 'Vous avez déjà une grande famille.';
    else if (chance(0.65)) {
      apply(s, { enfant: true, bonheur: 10 });
      out = `Bienvenue à ${s.tmp.bebe} !`;
    } else out = 'Pas de bébé cette année.';
  } else if (a === 'confier') {
    if (r.rel > 50 && Math.random() < 0.75) {
      r.conf = clamp((r.conf ?? 50) + rnd(5, 12));
      s.stats.bonheur = clamp(s.stats.bonheur + 3);
      out = `${r.prenom} t’écoute. Vous êtes plus proches.`;
    } else {
      r.conf = clamp((r.conf ?? 50) - 8);
      out = `${r.prenom} a répété ce que tu lui as dit…`;
    }
  } else if (a === 'service') {
    const res = friendService(s, r);
    out = res.r;
  } else if (a === 'negocier') {
    if (chance(0.35 + s.stats.charisme / 250 + r.rel / 300)) {
      r.tarif = Math.max(0.55, Math.round((r.tarif - 0.1) * 100) / 100);
      out = `${r.prenom} baisse son tarif.`;
    } else {
      r.rel = clamp(r.rel - 8);
      out = `${r.prenom} refuse : « C’est déjà un prix d’ami. »`;
    }
  } else if (a === 'supprimer') {
    s.relations = s.relations.filter((x) => x !== r);
    if (s.reseau?.fournisseur === r.id) s.reseau.fournisseur = null;
    out = `${r.prenom} est supprimé de tes contacts.`;
  } else if (a === 'rompre') {
    apply(s, { rupture: true, bonheur: -8 });
    out = `C’est fini avec ${r.prenom}.`;
  }
  addLog(s, out);
  return { r: out };
}

// ---------- Héritage : continuer avec un enfant ----------
export function continueAsChild(s, rid) {
  const c = s.relations.find((x) => x.id === rid);
  if (!c || !c.vivant) return null;
  const heirs = childrenOf(s).filter((x) => x.vivant).length;
  const totalCash = Math.max(0, s.money) + Math.round((s.biens || []).reduce((t, b) => t + b.valeur, 0) * (heirs > 1 ? (heirs - 1) / heirs : 0));
  const part = Math.max(0, Math.round((totalCash * 0.8) / heirs));
  const milieu = part + patrimoine(s) > 1000000 ? 'riche' : part + patrimoine(s) > 150000 ? 'aisee' : part > 30000 ? 'moyenne' : part > 3000 ? 'modeste' : 'precaire';
  const traits = Object.keys(TRAITS).sort(() => Math.random() - 0.5).slice(0, 2);
  const ns = createLife({
    prenom: c.prenom, nom: c.nom, genre: c.genre, attirance: c.genre === 'f' ? 'h' : 'f', origine: s.id.origine, pays: s.id.pays,
    statut: 'ne_france', ville: s.id.statut === 'au_pays' ? s.id.villeCible : s.id.ville, milieu,
    look: c.look || randomLook(c.genre, s.id.origine), traits, talent: pick(Object.keys(TALENTS)),
  }, { age: Math.max(c.age, 1), t: s.t, gen: s.gen + 1, noFamily: true });
  const other = partnerOf(s) || s.relations.find((r) => r.lien === 'ex' && r.vivant);
  if (other) ns.relations.push({ ...other, lien: other.genre === 'f' ? 'mere' : 'pere', rel: rnd(50, 85) });
  childrenOf(s).filter((x) => x.vivant && x.id !== rid).forEach((x) => ns.relations.push({ ...x, lien: 'fratrie', rel: rnd(40, 80) }));
  ns.uid = Math.max(...ns.relations.map((r) => r.id), 0) + 1;
  ns.money = part;
  if (s.biens?.length) ns.biens = s.biens.map((b) => ({ ...b, uid: ns.uid++ }));
  if (s.business?.length) ns.business = s.business.map((b) => ({ ...b, uid: ns.uid++, hist: [...(b.hist || [])] }));
  if (ns.age >= 18 && s.proprio) {
    ns.logement = s.logement;
    ns.proprio = true;
    ns.chezParents = false;
  } else if (ns.age >= 18) {
    ns.chezParents = false;
    ns.logement = milieu === 'precaire' ? 'hlm' : MILIEUX[milieu].logement;
  }
  ns.mem.parent = s.id.prenom;
  addLog(ns, `Génération ${ns.gen}. ${g(s, 'Ton père', 'Ta mère')} ${s.id.prenom} est décédé${s.id.genre === 'f' ? 'e' : ''}. Tu hérites de ${euros(part)}.`);
  return ns;
}

export { ACTIVITIES, CAREERS, migrate, migrate3 };
