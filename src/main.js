import './style.css';
import './style-v2.css';
import './style-v3.css';
import './style-v4.css';
import { icon, logo, logoMark } from './ui/icons.js';
import { sceneSVG } from './render/scene.js';
import { avatarSVG, miniAvatarSVG } from './render/avatar.js';
import { createLife, tpl, jobTitle, salary, career, partnerOf, lienNom, childrenOf, g } from './engine/core.js';
import { randomConfig } from './engine/random.js';
import { euros, pick } from './engine/rng.js';
import { fmtDate, fmtHeure, tod, saison } from './engine/time.js';
import {
  ageUp, choose, choicesView, continueResult, doActivity, applyJob, enroll, relActions, relAction, housingOptions, moveTo,
  continueAsChild, currentScene, outfitOf, busy, inPrison, canDo, yearlyCosts, yearlyIncome, presentNext, ACTIVITIES, CAREERS,
} from './engine/flow.js';
import { canApply, DIPLOME_NOM } from './data/careers.js';
import { impot, legalIncome, fiscalite, TRAIN, trainDeVie } from './engine/flow.js';
import { ROLES } from './data/world.js';
import { HOUSING, SCENE_NOM, originScene } from './data/housing.js';
import { ORIGINES, VILLES, MILIEUX, TRAITS, TALENTS, STATUTS } from './data/identity.js';
import { SKINS, HAIR_COLORS, EYES, HAIRSTYLES, BEARDS, BUILDS, STYLES, ACCS, FOULARDS } from './data/look.js';
import { save, load, clearSave } from './engine/save.js';
import { migrate, buyAsset, sellAsset, createBusiness, businessAction, networkAction, travel, flee, roulette, slots, moveCity, readAll, bestCar, patrimoine, ASSETS , bourseAction } from './engine/economy.js';
import { checkAchievements, achievementsSummary } from './engine/achievements.js';
import { guideHTML, guideSteps, positionGuide, hasSeenGuide, markGuideDone, achievementsModalHTML } from './ui/guide.js';
import { phoneHTML, pcHTML, casinoHTML, travelHTML, biensHTML, crimeHubHTML } from './ui/overlays.js';
import { answer, writeTo, nextPlan, quand } from './engine/messages.js';
import { TAB_AGE, UNLOCKS, energieMax } from './data/unlocks.js';
import { instaComment } from './engine/life2.js';
import { VERSION, CHANGELOG } from './data/changelog.js';
import { nameFor } from './data/identity.js';
import { randomLook } from './data/look.js';
import { introHTML, healthHTML, footHTML, expatHTML, destinLabel } from './ui/overlays3.js';
import { migrate3, giveParentJobs, instaPost, sendMessage, bjStart, bjHit, bjStand, expatriate } from './engine/life2.js';
import { carSVG } from './render/scene.js';
import { advanceTime } from './engine/flow.js';
import { SKINS as SK } from './data/look.js';

const app = document.getElementById('app');
let S = null; // vie en cours
let screen = 'title';
let tab = null;
let openRel = null;
let C = null; // personnage en création
let cTab = 'identite';
let OV = null; // fenêtre ouverte : téléphone, casino, voyage, PC…
let lastSheet = null, lastOvKey = '', lastModal = '';
const dev = location.search.includes('dev');

// ---------- Monde (décor + perso) ----------
const VB = '0 0 1000 560';
function worldHTML(sceneKey, env, av, uid = 'pl', fade = true) {
  return `<svg class="world" data-a="closeall" viewBox="${VB}" preserveAspectRatio="xMidYMax slice" role="img" aria-label="${SCENE_NOM[sceneKey] || 'Scène'}">
    <g id="bg" class="${fade ? 'fade-in' : ''}">${sceneSVG(sceneKey, env)}</g>
    </svg><div class="rainfx ${env.meteo === 'pluie' ? 'on' : ''}" id="rain"></div>
    <svg class="world fg" data-a="closeall" viewBox="${VB}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <g id="props"></g>
    <g id="pl" transform="translate(500 506)">${av ? avatarSVG(av, uid) : ''}</g>
    </svg>`;
}
let lastBg = '', lastAv = '', lastProps = '';
const INDOOR = ['casino', 'bureau', 'studio', 'prison'];
const GUARD = { peau: SK[5], coiffure: 'rase', cheveuxC: '#0e0907', yeux: '#3b2414', barbe: 'trois', corpulence: 'costaud', style: 'chic', acc: ['lunettes'] };
const OUT = ['rue', 'cite', 'appart', 'maison', 'villa', 'pays', 'commissariat', 'hopital', 'ecole', 'chantier', 'caserne', 'bidonville', 'stade', 'studio'];
function propsSVG(sc) {
  if (!S.vivant || inPrison(S)) return { key: 'none', svg: '' };
  let svg = '';
  const car = bestCar(S);
  const home = !S.voyage && !S.cavale;
  if (car && home && OUT.includes(sc) && sc !== 'studio') svg += carSVG(800, 500, ASSETS[car.id].car.c, 0.95, ASSETS[car.id].car.type);
  if (S.securite && ['villa', 'maison', 'appart'].includes(sc) && home)
    (S.avec.length ? [140, 950] : [250, 690]).slice(0, Math.min(2, S.securite)).forEach((x, i) => (svg += `<g transform="translate(${x} 506) scale(.93)">${avatarSVG({ look: GUARD, genre: 'h', age: 35, outfit: 'garde' }, 'gd' + i)}</g>`));
  const pos = [[365, 0.97], [640, 0.97], [290, 0.95]];
  const avec = S.avec.length ? S.avec : S.age < 4 ? S.relations.filter((r) => r.vivant && (r.lien === 'mere' || r.lien === 'pere')).map((r) => r.id) : [];
  avec.map((id) => S.relations.find((r) => r.id === id && r.vivant)).filter((r) => r && r.look).slice(0, 3).forEach((r, i) => {
    svg += `<g transform="translate(${pos[i][0]} 506) scale(${pos[i][1]})">${avatarSVG({ look: r.look, genre: r.genre, age: r.age, outfit: r.age < 3 ? 'bebe' : sc === 'plage' ? 'plage' : r.look.style || 'casual' }, 'av' + r.id)}</g>`;
  });
  return { key: `${sc}|${car?.id}|${S.securite}|${avec.join(',')}|${S.age}|${home}|${tod(S.t)}`, svg };
}
function updateWorld() {
  const sc = currentScene(S);
  const env = { tod: tod(S.t), meteo: S.meteo.type };
  const mx = Math.max(...Object.values(S.addic || { a: 0 }));
  const etat = { cernes: S.stats.sante < 45 || S.stats.bonheur < 28 || mx > 45 ? 1 : 0, pale: S.stats.sante < 30 || mx > 65, blesse: S.blessure === S.age, muscle: S.stats.forme >= 70, ventre: S.stats.forme < 25 && S.age >= 30 };
  const av = { look: S.look, genre: S.id.genre, age: S.age, outfit: outfitOf(S), etat };
  const bgKey = `${sc}|${env.tod}|${env.meteo}`;
  const avKey = JSON.stringify([av.look, av.genre, Math.min(av.age, 80), av.outfit, av.age >= 56, av.age >= 72, etat]);
  const bg = document.getElementById('bg');
  if (!bg) return;
  if (bgKey !== lastBg) {
    bg.classList.remove('fade-in');
    void bg.getBoundingClientRect();
    bg.innerHTML = sceneSVG(sc, env);
    bg.classList.add('fade-in');
    document.getElementById('rain').classList.toggle('on', env.meteo === 'pluie' && !INDOOR.includes(sc));
    lastBg = bgKey;
  }
  const pr = propsSVG(sc);
  if (pr.key !== lastProps) {
    document.getElementById('props').innerHTML = pr.svg;
    lastProps = pr.key;
  }
  if (avKey !== lastAv) {
    document.getElementById('pl').innerHTML = avatarSVG(av, 'pl');
    lastAv = avKey;
  }
}

const miniAv = (look, genre, id) =>
  look ? `<svg viewBox="-56 -62 112 112" width="38" height="38">${miniAvatarSVG({ look, genre, age: 30 }, 'm' + id)}</svg>` : '';

// ---------- Utilitaires UI ----------
function toast(txt, kind = '') {
  const box = document.getElementById('toasts');
  if (!box || !txt) return;
  const el = document.createElement('div');
  el.className = `toast glass ${kind}`;
  el.textContent = txt;
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => el.remove(), 3300);
}
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const bar = (label, v, color) => `<div class="bar-s"><div class="t">${label}<span>${Math.round(v)}</span></div><div class="tr"><i style="width:${Math.max(2, v)}%;background:${color}"></i></div></div>`;
const gF = (s, h, f) => (s.id.genre === 'f' ? f : h);

// ---------- Écran titre ----------
// Lien « Signaler un bug » pré-rempli avec l'état de la partie (aucune donnée perso).
const REPO = 'https://github.com/DestinoLife/destinolife.github.io';
function bugURL() {
  const lines = [`Version : ${VERSION}`, `Écran : ${innerWidth}×${innerHeight} · ${navigator.userAgent.match(/(Firefox|Edg|OPR|Chrome|Safari)\/[\d.]+/)?.[0] || 'navigateur inconnu'}${/Mobi/.test(navigator.userAgent) ? ' · mobile' : ''}`];
  if (S && screen === 'game') {
    lines.push(`Perso : ${S.age} ans · ${S.id.genre === 'f' ? 'femme' : 'homme'} · ${S.id.origine} · ${S.id.ville} · génération ${S.gen}`,
      `Situation : ${jobTitle(S) || 'sans métier'} · ${euros(S.money)} · logement ${S.logement}${S.chezParents ? ' (chez les parents)' : ''}${inPrison(S) ? ` · prison ${S.justice.prison} an(s)` : ''}${S.vivant ? '' : ` · mort (${S.mort?.cause})`}`,
      `Événement en cours : ${S.current?.id || (S.result ? 'résultat affiché' : 'aucun')} · file : ${(S.queue || []).join(', ') || 'vide'} · agenda : ${(S.plans || []).map((p) => p.id).join(', ') || 'vide'}`,
      `Onglet : ${tab || 'aucun'} · panneau : ${OV ? OV.t + (OV.app ? '/' + OV.app : '') : 'aucun'}`,
      'Derniers événements du journal :', ...S.log.slice(-6).map((l) => `  [${l.age} ans] ${l.txt}`));
  }
  const q = new URLSearchParams({ template: 'bug.yml', title: '[Bug] ', infos: lines.join('\n').slice(0, 1800), appareil: /Mobi/.test(navigator.userAgent) ? 'Téléphone' : 'Ordinateur' });
  return `${REPO}/issues/new?${q}`;
}

function renderTitle() {
  const cfg = randomConfig();
  const saved = load();
  const ach = achievementsSummary();
  const env = { tod: pick(['soir', 'nuit']), meteo: 'soleil' };
  app.innerHTML = `<div class="title">${worldHTML(pick(['rue', 'appart', 'cite']), env, { look: cfg.look, genre: cfg.genre, age: 26, outfit: cfg.look.style }, 'tt')}
    <div class="title-box">${logo(54)}
      <p class="tagline">Une vie. <b>Mille destins.</b><br>Chaque choix te mène quelque part : la villa, la rue, la gloire ou la cellule.</p>
      <div class="menu">
        ${saved && saved.vivant ? `<button class="btn primary" data-a="continue">${icon('play', 18)} Continuer la vie de ${esc(saved.id.prenom)}</button>` : ''}
        <button class="btn ${saved && saved.vivant ? '' : 'primary'}" data-a="new">${icon('user', 18)} Créer mon personnage</button>
        <button class="btn" data-a="random">${icon('dice', 18)} Vie aléatoire</button>
        <button class="btn" data-a="ach">${icon('trophy', 18)} Défis & Succès (${ach.count}/${ach.total})</button>
      </div>
      <div class="badge18"><b>18+</b> Violence, drogue, crime. Contenu destiné aux adultes.</div>
      <button class="ver" data-a="changelog">${VERSION} · Notes de mise à jour</button>
      <button class="ver" data-a="bug">Signaler un bug ou proposer une idée</button>
    </div><div id="overlay"></div></div>`;
  if (OV?.t === 'ach') document.getElementById('overlay').innerHTML = achievementsModalHTML(ach);
}

function showChangelog() {
  const box = document.createElement('div');
  box.className = 'changelog-wrap';
  box.innerHTML = `<div class="changelog glass"><div class="sheet-h"><div><h2>Notes de mise à jour</h2><div class="sub">Version actuelle : ${VERSION}</div></div><button class="close" aria-label="Fermer">${icon('x', 18)}</button></div>
    <div class="sheet-b">${CHANGELOG.map((c) => `<div class="sec"><h3>${c.v} · ${c.titre}</h3><ul>${c.items.map((i) => `<li>${i}</li>`).join('')}</ul></div>`).join('')}</div></div>`;
  box.addEventListener('click', (e) => (e.target === box || e.target.closest('.close')) && box.remove());
  document.body.appendChild(box);
}

// ---------- Créateur ----------
const creatorScene = () => (C.statut !== 'ne_france' ? originScene(C.origine) : HOUSING[MILIEUX[C.milieu].logement].scene);
function renderCreator() {
  const sc = creatorScene();
  const av = { look: C.look, genre: C.genre, age: 24, outfit: C.look.style };
  app.innerHTML = `<div class="creator">
    <div class="preview">${worldHTML(sc, { tod: 'soir', meteo: 'soleil' }, av, 'cr', false)}<div class="logo-wrap">${logo(34)}</div></div>
    <div class="panel">
      <div class="tabs">${[['identite', 'Identité'], ['origines', 'Origines'], ['apparence', 'Apparence'], ['perso', 'Personnalité']].map(([k, t]) => `<button class="${cTab === k ? 'on' : ''}" data-a="ctab" data-v="${k}">${t}</button>`).join('')}</div>
      <div class="form">${creatorForm()}</div>
      <div class="panel-foot"><button class="btn" data-a="back">Retour</button><button class="btn" data-a="reroll" title="Tout aléatoire">${icon('dice', 18)}</button><button class="btn primary" data-a="start">Commencer ma vie ${icon('chevron', 16)}</button></div>
    </div><div class="toasts" id="toasts"></div></div>`;
}
const chip = (k, v, label, on, off) => `<button class="chip ${on ? 'on' : ''} ${off ? 'off' : ''}" data-a="cset" data-k="${k}" data-v="${esc(v)}" ${off ? 'disabled' : ''}>${label}</button>`;
const sw = (k, color, on, title) => `<button class="sw ${on ? 'on' : ''}" style="background:${color}" data-a="cset" data-k="${k}" data-v="${color}" title="${title || ''}" aria-label="${title || color}"></button>`;
function creatorForm() {
  const f = C.genre === 'f';
  if (cTab === 'identite')
    return `<div class="row2"><div class="field"><label>Prénom</label><input data-k="prenom" value="${esc(C.prenom)}" maxlength="20"></div><div class="field"><label>Nom</label><input data-k="nom" value="${esc(C.nom)}" maxlength="24"></div></div>
    <div><span class="lbl">Genre</span><div class="chips">${chip('genre', 'h', 'Homme', !f)}${chip('genre', 'f', 'Femme', f)}</div></div>
    <div><span class="lbl">Attirance</span><div class="chips">${chip('attirance', 'h', 'Hommes', C.attirance === 'h')}${chip('attirance', 'f', 'Femmes', C.attirance === 'f')}${chip('attirance', 'hf', 'Les deux', C.attirance === 'hf')}</div></div>
    <div class="field"><label>Ville</label><select data-k="ville">${VILLES.map((v) => `<option ${v === C.ville ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
    <div><span class="lbl">Milieu social</span><div class="chips">${Object.entries(MILIEUX).map(([k, m]) => chip('milieu', k, m.nom, C.milieu === k)).join('')}</div><p class="hint">Détermine ton logement de départ, l’argent de poche et l’héritage.</p></div>`;
  if (cTab === 'origines') {
    const o = ORIGINES[C.origine];
    const fr = C.origine === 'france' || o.francais;
    return `<div><span class="lbl">Origine</span><div class="chips">${Object.entries(ORIGINES).map(([k, x]) => chip('origine', k, x.nom, C.origine === k)).join('')}</div></div>
    ${o.pays.length > 1 ? `<div><span class="lbl">Pays d’origine</span><div class="chips">${o.pays.map((p) => chip('pays', p, p, C.pays === p)).join('')}</div></div>` : ''}
    <div><span class="lbl">Statut à la naissance</span><div class="chips">${chip('statut', 'ne_france', gF({ id: { genre: C.genre } }, 'Né en France', 'Née en France'), C.statut === 'ne_france')}${chip('statut', 'titre', 'Arrivée enfant (titre de séjour)', C.statut === 'titre', fr)}${chip('statut', 'sans_papiers', 'Arrivée sans papiers', C.statut === 'sans_papiers', fr)}</div>
    <p class="hint">${C.statut === 'ne_france' ? 'Tu as la nationalité française dès la naissance.' : C.statut === 'titre' ? 'Tu nais au pays et ta famille s’installe en France pendant ton enfance, avec des papiers.' : 'Tu nais au pays et tu arrives en France sans papiers : pas de travail déclaré, peur des contrôles, régularisation possible.'}</p></div>`;
  }
  if (cTab === 'apparence')
    return `<div><span class="lbl">Peau</span><div class="chips">${SKINS.map((c) => sw('look.peau', c, C.look.peau === c)).join('')}</div></div>
    <div><span class="lbl">Coiffure</span><div class="chips">${HAIRSTYLES.map(([k, t]) => chip('look.coiffure', k, t, C.look.coiffure === k)).join('')}</div></div>
    ${C.look.coiffure === 'foulard' ? `<div><span class="lbl">Couleur du foulard</span><div class="chips">${FOULARDS.map((c) => sw('look.foulardC', c, C.look.foulardC === c)).join('')}</div></div>` : `<div><span class="lbl">Couleur des cheveux</span><div class="chips">${HAIR_COLORS.map(([c, t]) => sw('look.cheveuxC', c, C.look.cheveuxC === c, t)).join('')}</div></div>`}
    <div><span class="lbl">Yeux</span><div class="chips">${EYES.map(([c, t]) => sw('look.yeux', c, C.look.yeux === c, t)).join('')}</div></div>
    ${f ? '' : `<div><span class="lbl">Barbe</span><div class="chips">${BEARDS.map(([k, t]) => chip('look.barbe', k, t, C.look.barbe === k)).join('')}</div></div>`}
    <div><span class="lbl">Corpulence</span><div class="chips">${BUILDS.map(([k, t]) => chip('look.corpulence', k, t, C.look.corpulence === k)).join('')}</div></div>
    <div><span class="lbl">Style</span><div class="chips">${STYLES.map(([k, t]) => chip('look.style', k, t, C.look.style === k)).join('')}</div></div>
    <div><span class="lbl">Accessoires</span><div class="chips">${ACCS.map(([k, t]) => chip('acc', k, t, C.look.acc.includes(k))).join('')}</div></div>`;
  return `<div><span class="lbl">Traits de caractère (2 max)</span><div class="chips">${Object.entries(TRAITS).map(([k, t]) => chip('trait', k, f ? t.f : t.nom, C.traits.includes(k))).join('')}</div>
    <p class="hint">${C.traits.map((k) => `${f ? TRAITS[k].f : TRAITS[k].nom} : ${TRAITS[k].desc.toLowerCase()}`).join(' · ') || 'Choisis jusqu’à deux traits.'}</p></div>
    <div><span class="lbl">Talent caché</span><div class="chips">${Object.entries(TALENTS).map(([k, t]) => chip('talent', k, t, C.talent === k)).join('')}</div>
    <p class="hint">Ton talent débloque des événements : centre de formation, freestyle filmé, casting, galerie…</p></div>`;
}
function creatorSet(k, v) {
  if (k === 'acc') {
    const a = C.look.acc;
    C.look.acc = a.includes(v) ? a.filter((x) => x !== v) : [...a, v];
  } else if (k === 'trait') {
    C.traits = C.traits.includes(v) ? C.traits.filter((x) => x !== v) : [...C.traits, v].slice(-2);
  } else if (k.startsWith('look.')) C.look[k.slice(5)] = v;
  else C[k] = v;
  if (k === 'genre') {
    C.prenom = nameFor(C.origine, v);
    C.look = { ...randomLook(v, C.origine), peau: C.look.peau, yeux: C.look.yeux };
    C.attirance = v === 'f' ? 'h' : 'f';
  }
  if (k === 'origine') {
    C.pays = ORIGINES[v].pays[0];
    if (v === 'france' || ORIGINES[v].francais) C.statut = 'ne_france';
  }
  refreshCreator();
}
function refreshCreator() {
  const form = app.querySelector('.form');
  if (!form) return renderCreator();
  const top = form.scrollTop;
  app.querySelector('.preview svg').outerHTML = worldHTML(creatorScene(), { tod: 'soir', meteo: 'soleil' }, { look: C.look, genre: C.genre, age: 24, outfit: C.look.style }, 'cr', false);
  form.innerHTML = creatorForm();
  form.scrollTop = top;
}

// ---------- Jeu ----------
function renderGameShell() {
  app.innerHTML = `<div class="game">
    <div class="stage">${worldHTML('rue', { tod: 'jour', meteo: 'soleil' }, null)}
      <div class="hud-tl glass" id="hudtl"></div><div class="hud-tr" id="hudtr"></div>
      <div id="sheet"></div><div id="modal"></div><div id="overlay"></div><div class="toasts" id="toasts"></div><div class="pnotifs" id="notifs"></div><div id="death"></div>
    </div>
    <nav class="bar">${logo(30)}<div class="dock" id="dock"></div></nav></div>${dev ? '<div id="fps"></div>' : ''}`;
  lastBg = lastAv = '';
  seenMsgs = -1;
  updateGame();
}

// Notification façon iPhone en bas à droite quand un message arrive (clic = ouvre la conversation)
// Pendant un choix (événement ouvert), les messages reçus s'affichent sur la carte du choix au lieu de flotter par-dessus.
let seenMsgs = -1, lastThread = '', held = [];
function notifyNew() {
  const msgs = S.phone.msgs;
  if (seenMsgs < 0 || seenMsgs > msgs.length) seenMsgs = msgs.length;
  const evFrom = S.current?.sms;
  const fresh = msgs.slice(seenMsgs).filter((m) => !m.mine && m.from !== evFrom && !(OV?.t === 'phone' && OV.conv === m.from));
  seenMsgs = msgs.length;
  const box = document.getElementById('notifs');
  if (!box) return;
  const modalOpen = !!(S.current || S.result);
  if (inPrison(S) && !S.flags.tel_prison) return;
  if (modalOpen) { held.push(...fresh); box.innerHTML = ''; return; }
  held = [];
  if (!fresh.length) return;
  fresh.slice(-2).forEach((m) => {
    const el = document.createElement('button');
    el.className = 'pnotif glass';
    el.dataset.a = 'notif';
    el.dataset.v = m.from;
    el.innerHTML = `<span class="pnotif-app">${icon('phone', 13)} Messages<small>maintenant</small></span><span class="pnotif-b"><span class="ph-av sm">${esc(m.from[0])}</span><span><b>${esc(m.from)}</b><span>${esc(m.txt)}</span>${m.ch && !m.answered ? '<em>Attend ta réponse</em>' : ''}</span></span>`;
    box.prepend(el);
    setTimeout(() => el.classList.add('out'), 6000);
    setTimeout(() => el.remove(), 6400);
  });
  while (box.children.length > 2) box.lastChild.remove();
}

function updateGame() {
  if (!S) return;
  updateWorld();
  const sc = currentScene(S);
  const m = S.meteo;
  const wIcon = m.type === 'pluie' ? 'rain' : m.type === 'nuages' ? 'cloud' : tod(S.t) === 'nuit' ? 'moon' : 'sun';
  const wTxt = { soleil: tod(S.t) === 'nuit' ? 'Ciel dégagé' : 'Ensoleillé', nuages: 'Nuageux', pluie: 'Pluie' }[m.type];
  const ville = (S.lieu === 'pays' && S.id.statut !== 'au_pays' ? S.id.pays : null) || S.voyage?.ville || S.cavale?.ville || S.id.ville;
  const where = S.cavale && !S.lieu ? 'Planque' : S.voyage && !S.lieu ? 'En voyage' : SCENE_NOM[sc] || sc;
  document.getElementById('hudtl').innerHTML = `<div class="hud-place">${icon('pin', 15)} ${esc(ville)} · ${where}${S.cavale ? ' · <span style="color:var(--bad)">en cavale</span>' : ''}</div>
    <div class="hud-time"><span class="h">${fmtHeure(S.t)}</span><span class="hud-meteo">${icon(wIcon, 17)} ${m.temp} °C · ${wTxt}</span></div>
    <div class="hud-date">${fmtDate(S.t)} · ${saison(S.t)}</div>`;
  const job = inPrison(S) ? `Détenu${S.id.genre === 'f' ? 'e' : ''} · ${S.justice.prison} an${S.justice.prison > 1 ? 's' : ''} restant${S.justice.prison > 1 ? 's' : ''}` : jobTitle(S) || (S.age < 3 ? 'Bébé' : S.age < 6 ? 'Maternelle' : S.etudes.cursus ? (S.etudes.cursus === 'ecole' ? (S.age < 11 ? 'Élève en primaire' : 'Élève au collège') : S.etudes.cursus === 'lycee' ? 'Lycéen' + (S.id.genre === 'f' ? 'ne' : '') : S.etudes.cursus === 'cap' ? 'En lycée pro' : gF(S, 'Étudiant', 'Étudiante')) : S.age < 16 ? 'Enfant' : 'Sans emploi');
  const stars = S.justice.recherche ? `<span class="pill glass" title="Niveau de recherche"><span class="stars">${[1, 2, 3, 4, 5].map((i) => icon('star', 13, i <= S.justice.recherche ? 'on' : '')).join('')}</span></span>` : '';
  document.getElementById('hudtr').innerHTML = `<div class="id-card glass"><b>${esc(S.id.prenom)} ${esc(S.id.nom)}</b><span>${S.age} an${S.age > 1 ? 's' : ''} · ${esc(job)}</span></div>
    <div class="pills">${stars}<span class="pill glass ${S.money < 0 ? 'neg' : 'money'}" title="${S.age < 18 ? 'Argent de poche' : 'Compte en banque'}">${icon('euro', 15)} ${S.age < 18 ? 'Poche · ' : ''}${euros(S.money)}</span>${energieMax(S.age) ? `<span class="pill glass" title="Énergie : ${S.energie} action${S.energie > 1 ? 's' : ''} restante${S.energie > 1 ? 's' : ''} cette année"><span class="energy">${Array.from({ length: Math.max(energieMax(S.age), S.energie) }, (_, i) => `<i class="${i < S.energie ? 'on' : ''}"></i>`).join('')}</span></span>` : ''}</div>`;
  const tabs = [['vie', 'Vie', 'user'], ['act', 'Activités', 'zap'], ['pro', S.age < 16 ? 'École' : 'Carrière', 'briefcase'], ['crime', 'Crime', 'mask'], ['rel', 'Relations', 'heart'], ['biens', 'Biens', 'home']].filter(([k]) => S.age >= TAB_AGE[k] || inPrison(S));
  if (tab && !tabs.some(([k]) => k === tab)) tab = null;
  const nouv = (k) => (S.newTabs?.[k] ? '<i class="new-dot"></i>' : '');
  const blocked = busy(S) || !S.vivant;
  document.getElementById('dock').innerHTML = tabs.map(([k, t, i]) => `<button class="tab ${tab === k ? 'on' : ''} ${k === 'crime' ? 'crime' : ''}" data-a="tab" data-v="${k}" aria-label="${t}">${icon(i, 22)}${t}${nouv(k)}</button>`).join('') +
    (S.age >= TAB_AGE.phone ? `<button class="tab phone-tab ${OV?.t === 'phone' ? 'on' : ''}" data-a="phone" data-v="home" aria-label="Téléphone">${icon('phone', 22)}Téléphone${S.phone.unread ? `<em>${S.phone.unread}</em>` : nouv('phone')}</button>` : '') +
    (nextPlan(S) ? `<button class="age-btn plan ${blocked ? 'off' : ''}" data-a="age" aria-label="Avancer jusqu’au prochain rendez-vous" title="${esc(S.plans.map((p) => `${quand(S, p.at)} : ${p.label}`).join(' · '))}">${icon('forward', 20)}<span>Avancer<small>${esc(quand(S, nextPlan(S).at))} · ${esc(nextPlan(S).label)}</small></span></button>` : `<button class="age-btn ${blocked ? 'off' : ''}" data-a="age" aria-label="Avancer d’un an">${icon('forward', 20)}<span>Vieillir<small>+1 an · ${S.age} → ${S.age + 1}</small></span></button>`);
  const keep = (sel) => document.querySelector(sel)?.scrollTop || 0;
  const sbTop = keep('#sheet .sheet-b'), phTop = keep('.ph-screen'), ovTop = keep('#overlay .sheet-b');
  const sameSheet = lastSheet === tab, sameOv = lastOvKey === (OV ? `${OV.t}|${OV.app}|${OV.conv}|${OV.itab}` : '');
  document.getElementById('sheet').innerHTML = tab ? `<div class="sheet glass ${sameSheet ? 'still' : ''}">${sheetHTML()}</div>` : '';
  notifyNew();
  document.getElementById('modal').innerHTML = modalHTML();
  const md = document.querySelector('#modal .modal');
  if (md && held.length) md.insertAdjacentHTML('afterbegin', `<div class="m-notifs"><small>${icon('phone', 13)} ${held.length > 1 ? `${held.length} nouveaux messages` : 'Nouveau message'} · à lire dans le téléphone</small>${held.slice(-2).map((m) => `<div class="m-notif"><span class="ph-av sm">${esc(m.from[0])}</span><span><b>${esc(m.from)}</b> · ${esc(m.txt)}${m.ch && !m.answered ? ' <em>Attend ta réponse</em>' : ''}</span></div>`).join('')}</div>`);
  document.getElementById('death').innerHTML = !S.vivant && !busy(S) ? deathHTML() : '';
  document.getElementById('overlay').innerHTML = overlayHTML();
  if (sameOv) document.querySelectorAll('#overlay .phone, #overlay .casino, #overlay .travel, #overlay .pc').forEach((e) => e.classList.add('still'));
  const put = (sel, v) => { const e = document.querySelector(sel); if (e) e.scrollTop = v; };
  if (sameSheet) put('#sheet .sheet-b', sbTop);
  if (sameOv) { put('.ph-screen', phTop); put('#overlay .sheet-b', ovTop); }
  // Conversation : on arrive directement sur le dernier message (et on y reste quand un nouveau arrive)
  const thread = OV?.t === 'phone' && OV.conv ? `${OV.conv}|${S.phone.msgs.length}|${OV.compose ? 1 : 0}` : '';
  if (thread && thread !== lastThread) { const sc = document.querySelector('.ph-screen'); if (sc) sc.scrollTop = sc.scrollHeight; }
  lastThread = thread;
  const mk = S.current ? S.current.id : S.result ? 'r' : '';
  if (mk && mk === lastModal) document.querySelector('#modal .modal')?.classList.add('still');
  lastSheet = tab; lastOvKey = OV ? `${OV.t}|${OV.app}|${OV.conv}|${OV.itab}` : ''; lastModal = mk;
  if (OV?.t === 'guide') requestAnimationFrame(() => positionGuide(S, OV.step));
  const unlocked = checkAchievements(S);
  unlocked.forEach((a) => toast(`🏆 Défi débloqué : ${a.nom} (+${a.pts} pts)`, 'ach'));
  save(S);
}

function overlayHTML() {
  if (OV?.t === 'ach') return achievementsModalHTML(achievementsSummary());
  if (!OV || !S) return '';
  if (OV.t === 'intro') return introHTML(S);
  if (OV.t === 'guide') return guideHTML(S, OV.step || 0);
  if (OV.t === 'tips')
    return `<div class="intro"><div class="tips-card glass"><h2>Comment jouer</h2><ol>
      <li><b>Vieillir</b> fait passer une année. Les grandes décisions, elles, se jouent sur quelques jours.</li>
      <li>Tu as des <b>énergies</b> chaque année (1 petit, jusqu’à 4 adulte) pour les activités, le travail ou les coups. Le menu s’enrichit en grandissant : école, téléphone, crime, biens…</li>
      <li>Le menu du bas gère ta vie : Activités, Carrière, Crime, Relations, Biens.</li>
      <li>Le <b>téléphone</b> sert à parler aux gens : réponds aux messages, sinon tes proches s’éloignent.</li>
    </ol><button class="btn primary" data-a="tipsgo">C’est parti</button></div></div>`;
  if (OV.t === 'phone') return phoneHTML(S, OV);
  if (OV.t === 'casino') return casinoHTML(S, OV);
  if (OV.t === 'voyage' || OV.t === 'cavale') return travelHTML(S, OV.t);
  if (OV.t === 'pc') return pcHTML(S, OV.uid);
  return '';
}

function modalHTML() {
  if (S.current) {
    const c = S.current;
    const tag = c.major ? `<span class="ev-tag major"><span class="dot"></span>Décision majeure · ${c.major === 1 ? 'se joue dans la journée' : `se joue sur ${c.major} jours`}</span>` : `<span class="ev-tag"><span class="dot"></span>${esc(c.cat)}</span>`;
    if (c.sms) return `<div class="modal glass" role="dialog" aria-live="polite"><div class="notif"><span class="notif-app">${icon('mail', 14)}</span><div class="grow"><div class="notif-h"><b>${esc(c.sms)}</b><small>maintenant</small></div><p>${esc(c.txt)}</p></div></div><span class="ev-tag"><span class="dot"></span>${esc(c.cat)} · que réponds-tu ?</span>
      <div class="choices">${choicesView(S).map((x) => `<button class="choice ${x.ok ? '' : 'off'}" data-a="choose" data-v="${x.i}" ${x.ok ? '' : 'disabled'}><span>${esc(x.t)}</span>${x.h ? `<small>${esc(x.h)}</small>` : ''}</button>`).join('')}</div></div>`;
    return `<div class="modal glass" role="dialog" aria-live="polite">${c.major ? `<span class="ev-tag" style="margin-right:10px">${esc(c.cat)}</span>` : ''}${tag}<p class="ev-txt">${esc(c.txt)}</p>
      <div class="choices">${choicesView(S).map((x) => `<button class="choice ${x.ok ? '' : 'off'}" data-a="choose" data-v="${x.i}" ${x.ok ? '' : 'disabled'}><span>${esc(x.t)}</span>${x.h ? `<small>${esc(x.h)}</small>` : ''}</button>`).join('')}</div></div>`;
  }
  if (S.result) return `<div class="modal glass"><span class="ev-tag"><span class="dot"></span>${esc(S.result.cat)}</span><p class="result">${esc(S.result.txt)}</p><button class="btn primary" style="width:100%" data-a="cont">Continuer</button></div>`;
  return '';
}

function deathHTML() {
  const m = S.mort;
  const kids = childrenOf(S).filter((c) => c.vivant);
  const birthY = new Date(S.birthT).getUTCFullYear();
  const deathY = new Date(m.t).getUTCFullYear();
  return `<div class="death"><div class="card glass">${logoMark(44, 'dl')}
    <h1>${esc(S.id.prenom)} ${esc(S.id.nom)}</h1><p class="cause">${birthY} – ${deathY} · ${esc(m.cause)}</p>
    <dl class="kv"><dt>Âge</dt><dd>${m.age} ans</dd><dt>Patrimoine</dt><dd>${euros(S.money + patrimoine(S))}</dd><dt>Dernier métier</dt><dd>${esc(jobTitle(S) || '—')}</dd><dt>Casier</dt><dd>${S.justice.casier.length ? `${S.justice.casier.length} mention${S.justice.casier.length > 1 ? 's' : ''}` : 'Vierge'}</dd><dt>Enfants</dt><dd>${childrenOf(S).length}</dd><dt>Génération</dt><dd>${S.gen}</dd></dl>
    <div class="menu">${kids.map((k) => `<button class="btn primary" data-a="heir" data-v="${k.id}">${icon('play', 16)} Continuer avec ${esc(k.prenom)} (${k.age} ans)</button>`).join('')}
    <button class="btn" data-a="new">${icon('user', 16)} Nouvelle vie</button><button class="btn" data-a="random">${icon('dice', 16)} Vie aléatoire</button></div><button class="ver" data-a="bug">Signaler un bug</button></div></div>`;
}

// ---------- Onglets ----------
const TIPS = {
  vie: 'Ta fiche : santé, addictions, justice et journal. Surveille les symptômes : un médecin peut te sauver.',
  act: 'Chaque activité coûte 1 énergie (plus tu grandis, plus tu en as) et fait avancer le temps. Sans sport, ta santé baisse chaque année.',
  pro: 'Postule, étudie ou lance-toi (sport, musique, politique). Ta performance fait monter ta carrière.',
  crime: 'Tout l’illégal se gère ici. Ça rapporte gros, mais chaque coup fait monter ton niveau de recherche.',
  rel: 'Affection et confiance comptent. Tes amis d’enfance deviendront des contacts utiles.',
  biens: 'Achète, investis, ouvre des business, blanchis ton argent sale. Les impôts tombent chaque année.',
};
function sheetHTML() {
  const head = (t, sub) => `<div class="sheet-h"><div><h2>${t}</h2>${sub ? `<div class="sub">${sub}</div>` : ''}</div><button class="close" data-a="tab" data-v="${tab}" aria-label="Fermer">${icon('x', 18)}</button></div>${TIPS[tab] && !S.tipsOff ? `<div class="tip">${icon('sparkle', 14)}<span>${TIPS[tab]}</span><button data-a="tipsoff" aria-label="Masquer les astuces">${icon('x', 12)}</button></div>` : ''}`;
  const st = S.stats;
  if (tab === 'vie') {
    const o = ORIGINES[S.id.origine];
    return head(`${esc(S.id.prenom)} ${esc(S.id.nom)}`, `${S.age} ans · Génération ${S.gen}`) + `<div class="sheet-b">
      <button class="bug-row" data-a="bug">${icon('alert', 15)}<span><b>Un bug, un truc bizarre ?</b><small>Signale-le en 1 clic : les infos de ta partie sont jointes automatiquement.</small></span>${icon('chevron', 14)}</button>
      <div class="sec"><h3>État</h3><div class="bars">${bar('Bonheur', st.bonheur, '#ffd36e')}${bar('Santé', st.sante, '#4fd18b')}${bar('Intelligence', st.intel, '#6fb4ff')}${bar('Apparence', st.apparence, '#c59bff')}</div></div>
      <div class="sec"><h3>Compétences</h3><div class="bars">${bar('Forme physique', st.forme, '#5ff5d0')}${bar('Talent artistique', st.art, '#ff9f5a')}${bar('Charisme', st.charisme, '#ff6fa1')}${bar('Savoir-faire criminel', st.crime, '#ff5470')}</div></div>
      <div class="sec"><h3>Réputation</h3><div class="bars">${bar('Réputation de rue', st.reputation, '#ff6fa1')}${bar('Karma', st.karma, '#9a7bff')}${bar('Notoriété', st.notoriete, '#ffd36e')}</div></div>
      ${healthHTML(S)}
      <div class="sec"><h3>Justice</h3><dl class="kv"><dt>Niveau de recherche</dt><dd>${S.justice.recherche}/5${S.justice.motif && S.justice.recherche ? ` · ${esc(S.justice.motif)}` : ''}</dd><dt>Casier judiciaire</dt><dd>${S.justice.casier.length ? '' : 'Vierge'}</dd></dl>
        ${S.justice.casier.length ? `<div class="list" style="margin-top:8px">${S.justice.casier.slice(-6).reverse().map((c) => `<div class="li"><div class="grow"><b>${esc(c.motif)}</b><small>${c.age} ans · ${esc(c.peine)}</small></div></div>`).join('')}</div>` : ''}</div>
      <div class="sec"><h3>Identité</h3><dl class="kv"><dt>Origine</dt><dd>${o.nom}${S.id.origine !== 'france' ? ` (${esc(S.id.pays)})` : ''}</dd><dt>Statut</dt><dd>${STATUTS[S.id.statut][S.id.genre === 'f' ? 1 : 0]}</dd><dt>Milieu d’origine</dt><dd>${MILIEUX[S.milieu].nom}</dd><dt>Diplôme</dt><dd>${DIPLOME_NOM[S.etudes.niveau]}</dd><dt>Logement</dt><dd>${S.chezParents ? 'Chez tes parents' : HOUSING[S.logement]?.nom || '—'}</dd><dt>Traits</dt><dd>${S.traits.map((t) => (S.id.genre === 'f' ? TRAITS[t].f : TRAITS[t].nom)).join(', ')}</dd><dt>Talent</dt><dd>${TALENTS[S.talent]}</dd></dl></div>
      <div class="sec"><h3>Journal</h3><div class="journal">${S.log.slice(-60).reverse().map((l) => `<div><b>${l.age} ans</b><span>${esc(l.txt)}</span></div>`).join('')}</div></div>
      <div class="vie-foot"><button class="btn sm" data-a="ach">${icon('trophy', 16)} Défis (${achievementsSummary().count}/${achievementsSummary().total})</button><button class="btn sm" data-a="guideopen">${icon('sparkle', 16)} Revoir le guide</button><button class="btn sm" data-a="quit">${icon('save', 16)} Sauvegarder et quitter</button></div></div>`;
  }
  if (tab === 'act' || tab === 'crime') {
    const list = ACTIVITIES.filter((a) => (inPrison(S) ? a.tab === 'prison' : a.tab === tab));
    const warn = tab === 'crime' && !inPrison(S) ? `<div class="note warn">Chaque délit peut augmenter ton niveau de recherche. Plus il est haut, plus la police risque de frapper à ta porte.</div>` : '';
    return head(inPrison(S) ? 'Vie en détention' : tab === 'act' ? 'Activités' : 'Crime', `Énergie : ${S.energie}/${energieMax(S.age)} · chaque action fait avancer le temps`) + `<div class="sheet-b">${tab === 'crime' && !inPrison(S) ? crimeHubHTML(S) : ''}${warn}${tab === 'crime' && !inPrison(S) && S.justice.recherche ? `<div class="note warn">Recherché${S.id.genre === 'f' ? 'e' : ''} : ${S.justice.recherche}/5 · ${esc(S.justice.motif || '')}</div>` : ''}${actsBlock(list)}</div>`;
  }
  if (tab === 'pro') return head('Carrière et études', DIPLOME_NOM[S.etudes.niveau]) + `<div class="sheet-b">${footHTML(S)}${proHTML()}</div>`;
  if (tab === 'rel') return head('Relations', partnerOf(S) ? `En couple avec ${esc(partnerOf(S).prenom)}` : 'Célibataire') + `<div class="sheet-b">${relHTML()}</div>`;
  if (tab === 'biens') {
    const inc = yearlyIncome(S), dep = yearlyCosts(S);
    const fz = fiscalite(S);
    const taux = inc + fz.fortuneNette > 0 && fz.total ? Math.round((fz.total / Math.max(1, legalIncome(S))) * 100) : 0;
    const REG = { normal: '', optimise: 'Optimisation fiscale légale : −20 % environ', offshore: 'Montage offshore : tu paies peu… tant que le fisc ne regarde pas', exil: 'Exil fiscal : presque plus d’impôts en France' };
    const housing = `<div class="sec"><h3>Budget annuel estimé</h3><dl class="kv"><dt>Revenus</dt><dd style="color:var(--good)">${euros(inc)}</dd><dt>Dépenses (logement, vie, enfants)</dt><dd style="color:var(--bad)">${euros(dep)}</dd><dt>Impôts et cotisations</dt><dd style="color:var(--bad)">${euros(fz.total)}</dd><dt>Train de vie (${TRAIN[S.trainDeVie || 'normal'].nom.toLowerCase()})</dt><dd style="color:var(--bad)">${euros(trainDeVie(S, inc))}</dd><dt>Bilan</dt><dd>${euros(inc - dep - fz.total - trainDeVie(S, inc))}</dd></dl>${S.age >= 18 ? `<div class="chips">${Object.entries(TRAIN).map(([k, t]) => `<button class="chip ${(S.trainDeVie || 'normal') === k ? 'on' : ''}" data-a="train" data-v="${k}" title="${esc(t.desc)}">${t.nom}</button>`).join('')}</div><p class="hint">Plus tu gagnes, plus ton entourage, tes sorties et tes voitures coûtent cher. ${esc(TRAIN[S.trainDeVie || 'normal'].desc)}</p>` : ''}</div>
      <div class="sec"><h3>Tes impôts</h3>${S.age < 18 ? '<div class="note">Pas d’impôts avant 18 ans.</div>' : `<dl class="kv"><dt>Impôt sur le revenu · ${String(fz.parts).replace('.', ',')} part${fz.parts > 1 ? 's' : ''}</dt><dd>${euros(fz.revenu)}</dd>${fz.societes ? `<dt>Impôt sur les sociétés</dt><dd>${euros(fz.societes)}</dd>` : ''}${fz.social ? `<dt>Cotisations sociales (indépendant)</dt><dd>${euros(fz.social)}</dd>` : ''}${fz.fonciere ? `<dt>Taxe foncière</dt><dd>${euros(fz.fonciere)}</dd>` : ''}${fz.fortune ? `<dt>Impôt sur la fortune · ${euros(fz.fortuneNette)} de patrimoine</dt><dd>${euros(fz.fortune)}</dd>` : ''}<dt><b>Total</b>${taux ? ` · ${taux} % de tes revenus légaux` : ''}</dt><dd><b>${euros(fz.total)}</b></dd></dl>${REG[fz.regime] ? `<div class="note warn">${REG[fz.regime]}</div>` : ''}<p class="hint">Se marier et avoir des enfants donne des parts en plus. Au-delà de 1,3 M€ de patrimoine, l’impôt sur la fortune s’applique. L’argent sale n’est pas déclaré… mais un train de vie trop élevé attire le fisc.</p>`}</div>
      <div class="sec"><h3>Logement actuel</h3><div class="note">${S.chezParents ? 'Tu vis chez tes parents (gratuit).' : `${HOUSING[S.logement]?.nom}${S.proprio ? ' · propriétaire' : ''}`}</div></div>
      <div class="sec"><h3>Déménager</h3><div class="list">${housingOptions(S).map((h) => `<div class="li ${h.ok ? '' : 'off'}"><div class="grow"><b>${h.nom}</b><small>${h.ok ? [h.loyer ? `Loyer ${euros(h.loyer)}/an` : h.achat ? '' : 'Gratuit', h.achat ? `Achat ${euros(h.achat)}` : ''].filter(Boolean).join(' · ') : esc(h.why)}</small></div>
        ${h.ok && (h.loyer || !h.achat) ? `<button class="btn sm" data-a="move" data-v="${h.id}">${h.loyer ? 'Louer' : 'Y aller'}</button>` : ''}${h.ok && h.achat ? `<button class="btn sm ${S.money >= h.achat ? '' : 'off'}" data-a="buy" data-v="${h.id}">Acheter</button>` : ''}</div>`).join('')}</div></div>`;
    return head('Biens et argent', `${S.age < 18 ? 'Argent de poche' : 'Compte'} : ${euros(S.money)}`) + `<div class="sheet-b">${biensHTML(S, housing)}${expatHTML(S)}</div>`;
  }
  return '';
}

// Actions qui viennent de se débloquer (ex. « Tourner un clip » en devenant rappeur) : en haut, jusqu'au premier essai
function actsBlock(list) {
  const dispo = list.filter((a) => canDo(S, a) === true);
  S.knownActs ||= {};
  S.wasLocked ||= {};
  // « Nouveau » seulement si on l'a déjà vue verrouillée avant (ex. le clip avant d'être rappeur)
  const nouv = dispo.filter((a) => S.wasLocked[a.id] && !S.knownActs[a.id] && !['demission', 'bosser'].includes(a.id));
  list.forEach((a) => { if (canDo(S, a) !== true) S.wasLocked[a.id] = 1; });
  const reste = list.filter((a) => !nouv.includes(a));
  return (nouv.length ? `<div class="debloque"><div class="lbl">${icon('sparkle', 13)} Débloqué</div><div class="acts">${nouv.map((a) => actCard(a, true)).join('')}</div></div>` : '') + `<div class="acts">${reste.map((a) => actCard(a)).join('')}</div>`;
}
function actCard(a, neuf) {
  const ok = canDo(S, a);
  const cost = typeof a.cost === 'function' ? a.cost(S) : a.cost || 0;
  const risk = a.risk ? Math.round(Math.min(0.95, a.risk(S)) * 100) : null;
  const meta = [cost ? euros(cost) : 'Gratuit', a.days && a.days[1] > 0 ? `${a.days[0]}–${a.days[1]} j` : 'Immédiat', a.free ? 'sans énergie' : ''].filter(Boolean).join(' · ');
  return `<button class="act ${a.tab === 'crime' ? 'crime' : ''} ${ok === true ? '' : 'off'} ${neuf ? 'neuf' : ''}" data-a="act" data-v="${a.id}" title="${ok === true ? '' : esc(ok)}">
    <span class="n">${icon(a.icon, 17)}${esc(a.nom)}${neuf ? '<em class="new-tag">Nouveau</em>' : ''}</span><span class="d">${ok === true ? esc(a.desc) : esc(ok)}</span>
    <span class="m">${meta}${risk != null && ok === true ? ` · <span class="risk" style="color:${risk > 65 ? 'var(--good)' : risk > 45 ? 'var(--warn)' : 'var(--bad)'}">${risk}% de réussite</span>` : ''}</span></button>`;
}

function proHTML() {
  let h = '';
  const c = career(S);
  if (S.carriere) {
    const k = S.carriere;
    h += `<div class="job-card"><span class="lbl" style="margin:0">${esc(c.nom)}</span><b>${esc(jobTitle(S))}</b><dl class="kv">${c.cat === 'crime' ? `<dt>Gains</dt><dd>Variables · argent sale</dd>` : `<dt>Salaire</dt><dd>${euros(salary(S))} / mois</dd>`}<dt>Ancienneté</dt><dd>${k.annees} an${k.annees > 1 ? 's' : ''}</dd><dt>Échelon</dt><dd>${k.niveau + 1} / ${c.niveaux.length}</dd></dl>${c.fame ? bar('Notoriété', S.stats.notoriete, '#ffd36e') : bar('Performance', k.perf, '#6fb4ff')}</div>`;
  } else h += `<div class="note">${inPrison(S) ? 'Tu es en prison.' : S.age < 16 ? 'Trop jeune pour travailler. Concentre-toi sur l’école.' : 'Tu n’as pas de travail pour le moment.'}</div>`;
  const pro = ACTIVITIES.filter((a) => a.tab === 'pro');
  h += `<div class="sec"><h3>Actions</h3>${actsBlock(pro)}</div>`;
  const e = S.etudes;
  const NOMS = { ecole: 'École obligatoire', lycee: 'Lycée général', cap: 'CAP', fac: 'Licence', bts: 'BTS', master: 'Master', medecine: 'Médecine', droit: 'Droit', daeu: 'DAEU' };
  h += `<div class="sec"><h3>Études</h3>${e.cursus ? `<div class="note">En cours : ${NOMS[e.cursus]}${e.reste ? ` · encore ${e.reste} an${e.reste > 1 ? 's' : ''}` : ''}</div>` : ''}`;
  if (!e.cursus && S.age >= 16 && !inPrison(S)) {
    const opts = [['fac', 'Licence (3 ans)', 'bac'], ['bts', 'BTS (2 ans)', 'bac'], ['droit', 'Droit (5 ans)', 'bac'], ['medecine', 'Médecine (9 ans)', 'bac'], ['master', 'Master (2 ans)', 'licence'], ['cap', 'CAP (2 ans)', 'aucun'], ['daeu', 'DAEU, équivalent bac (1 an)', 'aucun']];
    const rank = ['aucun', 'brevet', 'cap', 'bac', 'bts', 'licence', 'master', 'doctorat'];
    h += `<div class="chips">${opts.filter(([k, , need]) => rank.indexOf(S.etudes.niveau) >= rank.indexOf(need) && !(k === 'daeu' && rank.indexOf(S.etudes.niveau) >= 3)).map(([k, t]) => `<button class="chip" data-a="enroll" data-v="${k}">${t}</button>`).join('')}</div>`;
  }
  h += `</div>`;
  if (S.age >= 16 && !inPrison(S)) {
    const jobs = Object.entries(CAREERS).filter(([, x]) => x.apply !== false);
    h += `<div class="sec"><h3>Offres d’emploi</h3><div class="list">${jobs.map(([id, x]) => {
      const ok = canApply(S, id);
      return `<div class="li ${ok === true ? '' : 'off'}"><div class="grow"><b>${x.niveaux[0][0]}</b><small>${ok === true ? `${euros(x.niveaux[0][1])} / mois · ${x.nom}` : esc(ok)}</small></div>${ok === true ? `<button class="btn sm" data-a="apply" data-v="${id}">Postuler</button>` : ''}</div>`;
    }).join('')}</div></div>`;
  }
  return h;
}

function relHTML() {
  const order = ['conjoint', 'partenaire', 'enfant', 'mere', 'pere', 'fratrie', 'ami', 'ex'];
  const rels = [...S.relations].filter((r) => r.lien !== 'candidat' && r.lien !== 'contact').sort((a, b) => order.indexOf(a.lien) - order.indexOf(b.lien) || b.vivant - a.vivant);
  const dating = ACTIVITIES.find((a) => a.id === 'dating');
  let h = canDo(S, dating) === true ? `<button class="btn sm" data-a="act" data-v="dating">${icon('heart', 16)} Faire des rencontres</button>` : '';
  h += `<div class="list">${rels.map((r) => {
    const open = openRel === r.id;
    const acts = open ? relActions(S, r) : [];
    return `<div><div class="li ${r.vivant ? '' : 'dead'}" data-a="openrel" data-v="${r.id}" style="cursor:pointer"><div class="av">${miniAv(r.look, r.genre, r.id)}</div><div class="grow"><b>${esc(r.prenom)} ${esc(r.nom)}</b><small>${lienNom(r)} · ${r.vivant ? `${r.age} ans` : 'Décédé' + (r.genre === 'f' ? 'e' : '')}${r.destin ? ` · ${esc(destinLabel(r))}` : ''}${r.job ? ` · ${esc(r.job)}` : ''}</small>${r.vivant ? `<div class="duo"><span>Affection</span><div class="mini-bar"><i style="width:${r.rel}%;background:${r.rel > 60 ? 'var(--good)' : r.rel > 30 ? 'var(--warn)' : 'var(--bad)'}"></i></div><span>Confiance</span><div class="mini-bar"><i style="width:${r.conf ?? 50}%;background:#6fb4ff"></i></div></div>` : ''}</div>${r.vivant ? icon('chevron', 16) : ''}</div>
      ${open && acts.length ? `<div class="rel-acts">${acts.map((a) => `<button class="btn sm ${a.ok ? '' : 'off'}" data-a="relact" data-v="${r.id}" data-x="${a.a}" ${a.ok ? '' : 'disabled'}>${a.t}</button>`).join('')}</div>` : ''}</div>`;
  }).join('') || '<div class="note">Personne pour l’instant.</div>'}</div>`;
  const pros = S.relations.filter((r) => r.lien === 'contact' && r.vivant);
  h += `<div class="sec"><h3>Contacts pro (${pros.length})</h3><div class="list">${pros.map((r) => `<div><div class="li" data-a="openrel" data-v="${r.id}" style="cursor:pointer"><div class="av">${miniAv(r.look, r.genre, r.id)}</div><div class="grow"><b>${esc(r.prenom)} ${esc(r.nom)}</b><small>${ROLES[r.role].nom} · tarif ×${r.tarif} · ${ROLES[r.role].desc}</small></div>${icon('chevron', 16)}</div>${openRel === r.id ? `<div class="rel-acts">${relActions(S, r).map((a) => `<button class="btn sm ${a.ok ? '' : 'off'}" data-a="relact" data-v="${r.id}" data-x="${a.a}" ${a.ok ? '' : 'disabled'}>${a.t}</button>`).join('')}</div>` : ''}</div>`).join('') || '<div class="note">Aucun contact pro. Onglet Crime : « Chercher un contact ».</div>'}</div></div>`;
  return h;
}

// ---------- Actions ----------
function startLife(cfg) {
  S = migrate3(migrate(createLife(cfg)));
  giveParentJobs(S);
  OV = { t: 'intro' };
  tab = null;
  screen = 'game';
  renderGameShell();
  toast(`Bienvenue au monde, ${cfg.prenom}.`, 'good');
}

function handle(a, v, el) {
  if (S && busy(S) && ['act', 'apply', 'enroll', 'move', 'buy', 'relact', 'travel', 'flee', 'buyasset', 'openbiz', 'biz', 'net', 'city', 'cplay'].includes(a)) return toast('Réponds d’abord à l’événement en cours.', 'err');
  switch (a) {
    case 'new':
      C = randomConfig();
      cTab = 'identite';
      screen = 'creator';
      return renderCreator();
    case 'random':
      return startLife(randomConfig());
    case 'continue':
      S = migrate3(migrate(load()));
      screen = 'game';
      tab = null;
      return renderGameShell();
    case 'back':
      screen = 'title';
      return renderTitle();
    case 'ctab':
      cTab = v;
      return renderCreator();
    case 'cset':
      return creatorSet(el.dataset.k, v);
    case 'reroll':
      C = randomConfig();
      return renderCreator();
    case 'start':
      if (!C.prenom.trim() || !C.nom.trim()) {
        cTab = 'identite';
        renderCreator();
        return toast('Donne un prénom et un nom à ton personnage.', 'err');
      }
      return startLife({ ...C, prenom: C.prenom.trim(), nom: C.nom.trim() });
    case 'closeall':
      if (OV?.t === 'intro' || OV?.t === 'tips' || OV?.t === 'guide') return;
      if (!tab && !OV) return;
      tab = null;
      OV = null;
      return updateGame();
    case 'tipsoff':
      S.tipsOff = true;
      return updateGame();
    case 'train':
      S.trainDeVie = v;
      toast(`Train de vie : ${TRAIN[v].nom}. ${TRAIN[v].desc}`, 'good');
      return updateGame();
    case 'bourse': {
      const r = bourseAction(S, v, el.dataset.x);
      toast(r.r, r.err ? 'err' : 'good');
      return updateGame();
    }
    case 'changelog':
      return showChangelog();
    case 'bug':
      return void window.open(bugURL(), '_blank', 'noopener');
    case 'answer': {
      const r = answer(S, Number(v), Number(el.dataset.x));
      if (r?.plan) toast(r.r, 'good');
      return updateGame();
    }
    case 'write': {
      const rel = S.relations.find((x) => x.vivant && x.prenom === OV.conv);
      if (!rel) return;
      const r = writeTo(S, rel, v);
      if (r.err) toast(r.r, 'err');
      if (r.plan) toast(`Prévu avec ${rel.prenom}. Appuie sur « Avancer » pour y aller.`, 'good');
      return updateGame();
    }
    case 'comment': {
      const r = instaComment(S, v, el.dataset.x);
      if (r.r) toast(r.r, r.err ? 'err' : 'good');
      return updateGame();
    }
    case 'tipsgo':
      OV = null;
      return updateGame();
    case 'tab':
      if (S.newTabs) delete S.newTabs[v];
      if (OV && OV.t !== 'intro') OV = null;
      tab = tab === v ? null : v;
      openRel = null;
      return updateGame();
    case 'age': {
      if (busy(S) || !S.vivant) return;
      const rep = ageUp(S);
      if (rep) UNLOCKS.filter((u) => u.age === S.age).forEach((u) => { if (u.key) (S.newTabs ||= {})[u.key] = 1; toast(`Nouveau · ${u.txt}`, 'good'); });
      if (rep) toast(`${S.age} ans${rep.revenus || rep.depenses ? ` · ${euros(rep.revenus - rep.depenses)} sur l’année` : ''}${rep.impots ? ` · dont ${euros(rep.impots)} d’impôts` : ''}`, rep.revenus - rep.depenses >= 0 ? 'good' : 'err');
      return updateGame();
    }
    case 'choose':
      choose(S, Number(v));
      return updateGame();
    case 'cont':
      continueResult(S);
      return updateGame();
    case 'act': {
      const A = ACTIVITIES.find((x) => x.id === v);
      (S.knownActs ||= {})[v] = 1;
      if (A?.ui === 'voyage' || A?.ui === 'cavale') {
        const ok = canDo(S, A);
        if (ok !== true) return toast(ok, 'err');
        OV = { t: A.ui };
        tab = null;
        return updateGame();
      }
      const r = doActivity(S, v);
      if (A?.ui === 'casino' && !r.err) {
        OV = { t: 'casino', game: 'roulette', bet: 100, pick: 'rouge' };
        tab = null;
      }
      toast(r.r, r.err ? 'err' : r.good ? 'good' : '');
      return updateGame();
    }
    case 'apply': {
      const r = applyJob(S, v);
      toast(r.r, r.err ? 'err' : 'good');
      return updateGame();
    }
    case 'enroll': {
      const r = enroll(S, v);
      toast(r.r, r.err ? 'err' : 'good');
      return updateGame();
    }
    case 'move':
    case 'buy': {
      const r = moveTo(S, v, a === 'buy');
      toast(r.r, r.err ? 'err' : 'good');
      return updateGame();
    }
    case 'openrel':
      openRel = openRel === Number(v) ? null : Number(v);
      return updateGame();
    case 'relact': {
      const r = relAction(S, Number(v), el.dataset.x);
      toast(r.r);
      return updateGame();
    }
    case 'heir': {
      const ns = continueAsChild(S, Number(v));
      if (ns) {
        migrate3(migrate(ns));
        S = ns;
        tab = null;
        renderGameShell();
        toast(`Tu continues avec ${S.id.prenom}.`, 'good');
      }
      return;
    }
    case 'phone':
      if (OV?.t === 'phone' && el?.closest('.dock')) { OV = null; return updateGame(); }
      if (S.newTabs) delete S.newTabs.phone;
      if (inPrison(S) && !S.flags.tel_prison) return toast('Pas de téléphone en détention. Il faut en acheter un au marché noir.', 'err');
      if (!S.vivant) return;
      tab = null;
      OV = { t: 'phone', app: v, itab: OV?.itab };
      if (v === 'messages') OV.conv = null;
      return updateGame();
    case 'notif':
      el.remove();
      if (!S.vivant) return;
      tab = null;
      OV = { t: 'phone', app: 'messages', conv: v, itab: OV?.itab };
      readAll(S, v);
      return updateGame();
    case 'compose':
      OV.compose = true;
      return updateGame();
    case 'sendmsg':
      sendMessage(S, OV.conv, v);
      return updateGame();
    case 'itab':
      OV.itab = v;
      return updateGame();
    case 'post': {
      const r = instaPost(S, v);
      toast(r.r, r.err ? 'err' : 'good');
      return updateGame();
    }
    case 'introgo':
      OV = hasSeenGuide() ? null : { t: 'guide', step: 0 };
      return updateGame();
    case 'guidenext': {
      const next = Number(v);
      if (next >= guideSteps(S).length) {
        markGuideDone();
        OV = null;
      } else OV = { t: 'guide', step: next };
      return updateGame();
    }
    case 'guideskip':
      markGuideDone();
      OV = null;
      return updateGame();
    case 'guideopen':
      tab = null;
      OV = { t: 'guide', step: 0 };
      return updateGame();
    case 'ach':
      tab = null;
      OV = { t: 'ach' };
      return screen === 'title' ? renderTitle() : updateGame();
    case 'expat': {
      const r = expatriate(S, v);
      toast(r.r, r.err ? 'err' : 'good');
      presentNext(S);
      return updateGame();
    }
    case 'bjdeal': {
      const bet = OV.bet === 'tapis' ? S.money : OV.bet === 'moitie' ? Math.floor(S.money / 2) : Number(OV.bet || 0);
      const st = bjStart(S, bet);
      if (st.err) return toast(st.r, 'err');
      OV.bj = st;
      if (st.done) presentNext(S);
      return updateGame();
    }
    case 'bjhit':
      OV.bj = bjHit(S, OV.bj);
      if (OV.bj.done) presentNext(S);
      return updateGame();
    case 'bjstand':
      OV.bj = bjStand(S, OV.bj);
      presentNext(S);
      return updateGame();
    case 'phoneconv':
      OV.compose = false;
      OV.conv = v;
      readAll(S, v);
      return updateGame();
    case 'phonerel':
      OV.rel = OV.rel === Number(v) ? null : Number(v);
      return updateGame();
    case 'phoneclose':
    case 'pcclose':
    case 'overlay':
      OV = null;
      return screen === 'title' ? renderTitle() : updateGame();
    case 'cgame':
      OV.game = v;
      OV.res = null;
      return updateGame();
    case 'cpick':
      OV.pick = v;
      if (/^\d+$/.test(v)) OV.num = Number(v);
      return updateGame();
    case 'cbet':
      OV.bet = /^\d+$/.test(v) ? Number(v) : v;
      return updateGame();
    case 'cplay': {
      const bet = OV.bet === 'tapis' ? S.money : OV.bet === 'moitie' ? Math.floor(S.money / 2) : Number(OV.bet || 0);
      const res = OV.game === 'slots' ? slots(S, bet) : roulette(S, bet, OV.pick || 'rouge');
      if (res.err) return toast(res.r, 'err');
      OV.res = res;
      presentNext(S);
      return updateGame();
    }
    case 'travel':
    case 'flee': {
      const r = a === 'travel' ? travel(S, v) : flee(S, v);
      if (!r.err) {
        OV = null;
        if (r.days) advanceTime(S, r.days, [11, 19]);
        presentNext(S);
      }
      toast(r.r, r.err ? 'err' : 'good');
      return updateGame();
    }
    case 'buyasset':
    case 'sell':
    case 'openbiz':
    case 'biz':
    case 'guard':
    case 'city':
    case 'net': {
      let r;
      if (a === 'buyasset') r = buyAsset(S, v);
      if (a === 'sell') r = sellAsset(S, Number(v));
      if (a === 'openbiz') r = createBusiness(S, v);
      if (a === 'biz') r = businessAction(S, Number(v), el.dataset.x);
      if (a === 'city') r = moveCity(S, v);
      if (a === 'net') r = networkAction(S, v, el.dataset.x);
      if (a === 'guard') {
        const d = Number(v);
        if (S.age < 18) r = { r: 'Il faut être majeur.', err: true };
        else if (d > 0 && S.money < 42000) r = { r: 'Il te faut 42 000 € pour la première année.', err: true };
        else if (d > 0 && S.securite >= 4) r = { r: 'Quatre gardes, c’est le maximum.', err: true };
        else {
          if (d > 0) S.money -= 42000;
          S.securite = Math.max(0, S.securite + d);
          r = { r: d > 0 ? 'Un garde du corps rejoint ton équipe.' : 'Tu renvoies un garde.', good: true };
        }
      }
      if (r?.r) toast(tpl(r.r, S), r.err ? 'err' : 'good');
      presentNext(S);
      return updateGame();
    }
    case 'pc':
      OV = { t: 'pc', uid: Number(v) };
      return updateGame();
    case 'quit':
      save(S);
      screen = 'title';
      return renderTitle();
  }
}

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]');
  if (!el || el.disabled) return;
  const stop = e.target.closest('[data-stop]');
  if (stop && el.contains(stop)) return;
  // Le téléphone ne se ferme que si on clique franchement à côté (pas dans ses coins arrondis ou juste sous lui)
  if (el.dataset.a === 'phoneclose') {
    const r = el.querySelector('.phone')?.getBoundingClientRect(), m = 40;
    if (r && e.clientX > r.left - m && e.clientX < r.right + m && e.clientY > r.top - m && e.clientY < r.bottom + m) return;
  }
  handle(el.dataset.a, el.dataset.v, el);
});
app.addEventListener('input', (e) => {
  if (screen === 'creator' && e.target.dataset.k && e.target.tagName === 'INPUT') C[e.target.dataset.k] = e.target.value;
});
app.addEventListener('change', (e) => {
  if (screen === 'creator' && e.target.tagName === 'SELECT') creatorSet(e.target.dataset.k, e.target.value);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && OV?.t === 'ach') {
    OV = null;
    return screen === 'title' ? renderTitle() : updateGame();
  }
  if (screen !== 'game' || !S) return;
  if (e.key === 'Escape' && OV) {
    if (OV.t === 'intro') return;
    if (OV.t === 'guide') markGuideDone();
    OV = null;
    return updateGame();
  }
  if (e.key === 'Escape' && tab) {
    tab = null;
    updateGame();
  }
  if (e.key === ' ' && e.target === document.body && !busy(S) && !OV) {
    e.preventDefault();
    handle('age');
  }
});
window.addEventListener('resize', () => {
  if (OV?.t === 'guide' && S) positionGuide(S, OV.step || 0);
});
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// Compteur de FPS en mode développement (?dev)
if (dev) {
  let f = 0, t0 = performance.now();
  const loop = (n) => {
    f++;
    if (n - t0 >= 1000) {
      const el = document.getElementById('fps');
      if (el) el.textContent = `${f} FPS`;
      f = 0;
      t0 = n;
    }
    if (!document.hidden) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', () => !document.hidden && requestAnimationFrame(loop));
}

if (dev) window.destino = { get S() { return S; }, refresh: () => updateGame() };
document.addEventListener('visibilitychange', () => document.body.classList.toggle('paused', document.hidden));
renderTitle();
export { tpl, g, presentNext };
