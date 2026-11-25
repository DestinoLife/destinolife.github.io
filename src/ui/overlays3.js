// Interfaces V3 : intro animée, Instapic, actus, messages avec réponses, blackjack, santé, foot, expatriation.
import { icon } from './icons.js';
import { euros } from '../engine/rng.js';
import { avatarSVG } from '../render/avatar.js';
import { tpl } from '../engine/core.js';
import { topicsFor } from '../engine/messages.js';
import { POST_TYPES, instaFeed, handValue, ADDICTIONS, DISEASES, symptoms, footClub, EXPAT, SITUATIONS, situation, DESTINS, introLines } from '../engine/life2.js';

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmtN = (n) => Math.round(n).toLocaleString('fr-FR');

// ---------- Intro animée ----------
export function introHTML(S) {
  const lines = introLines(S);
  return `<div class="intro"><div class="intro-in">${lines.map((l, i) => `<p style="animation-delay:${0.4 + i * 0.9}s">${esc(l)}</p>`).join('')}
    <button class="btn primary intro-go" style="animation-delay:${0.6 + lines.length * 0.9}s" data-a="introgo">Commencer ma vie</button></div>
    <button class="intro-skip" data-a="introgo">Passer</button></div>`;
}

// ---------- Messages : conversations, messages à décision (2 réponses), écrire selon le lien ----------
const convKey = (m) => (m.mine ? m.conv : m.from);
export function messagesHTML(S, o, back) {
  const convs = {};
  S.phone.msgs.forEach((m) => (convs[convKey(m)] ||= []).push(m));
  if (o.compose) {
    const people = S.relations.filter((r) => r.vivant && !['candidat'].includes(r.lien) && r.age >= 8);
    return back('Nouveau message') + `<div class="ph-list">${people.map((r) => `<button class="ph-row" data-a="phoneconv" data-v="${esc(r.prenom)}"><span class="ph-av">${esc(r.prenom[0])}</span><span class="grow"><b>${esc(r.prenom)} ${esc(r.nom)}</b><small>${r.lien === 'contact' ? 'Contact pro' : 'Proche'}</small></span></button>`).join('')}</div>`;
  }
  if (o.conv) {
    const list = convs[o.conv] || [];
    const r = S.relations.find((x) => x.vivant && x.prenom === o.conv);
    const topics = topicsFor(r);
    const used = r && S.relUsed[`${r.id}:msg`];
    return back(esc(o.conv)) + `<div class="ph-thread">${list.map((m) => `<div class="bubble ${m.mine ? 'mine' : ''} ${m.ch && !m.answered ? 'ask' : ''}"><span>${esc(m.txt)}</span><small>${m.age} ans${m.answered === 'ignore' ? ' · sans réponse' : ''}</small></div>${m.ch && !m.answered ? `<div class="ans">${m.ch.map((t, i) => `<button class="btn sm ${i ? '' : 'primary'}" data-a="answer" data-v="${m.id}" data-x="${i}">${esc(t)}</button>`).join('')}</div>` : ''}`).join('') || '<p class="ph-empty">Écris le premier message.</p>'}</div>
      ${r ? `<div class="ph-reply">${used ? '<small class="hint">Tu as déjà écrit cette année. Attends sa prochaine nouvelle.</small>' : topics.map(([k, t]) => `<button class="chip" data-a="write" data-v="${k}">${esc(tpl(t, S))}</button>`).join('')}</div>` : ''}`;
  }
  const keys = Object.keys(convs).sort((a, b) => {
    const ua = convs[a].some((m) => m.ch && !m.answered), ub = convs[b].some((m) => m.ch && !m.answered);
    return ub - ua || convs[b].at(-1).t - convs[a].at(-1).t;
  });
  return back('Messages', `<button data-a="compose" aria-label="Nouveau message">${icon('edit', 18)}</button>`) + `<div class="ph-list">${keys.map((k) => { const last = convs[k].at(-1); const un = convs[k].some((m) => m.ch && !m.answered); return `<button class="ph-row" data-a="phoneconv" data-v="${esc(k)}"><span class="ph-av">${esc(k[0])}</span><span class="grow"><b>${esc(k)}${un ? ' <i class="dot-u"></i>' : ''}</b><small>${un ? '<em class="need">Attend ta réponse</em> · ' : last.mine ? 'Toi : ' : ''}${esc(last.txt)}</small></span></button>`; }).join('') || '<p class="ph-empty">Aucun message pour l’instant.</p>'}</div>`;
}

// ---------- Instapic : vraies images, commentaires ----------
const POST_BG = { selfie: ['#ff9a8b', '#ff6a88'], sport: ['#43cea2', '#185a9d'], soiree: ['#7b2ff7', '#f107a3'], voyage: ['#56ccf2', '#f2c94c'], voiture: ['#232526', '#d7263d'], clip: ['#0f0c29', '#ff00cc'], business: ['#1d2b64', '#f8cdda'], luxe: ['#3a2f0b', '#f5d76e'] };
export function postArt(type, look, genre, uid) {
  const [a, b] = POST_BG[type] || POST_BG.selfie;
  const g = `pg${uid}`;
  const bg = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="120" height="120" fill="url(#${g})"/>`;
  const face = look ? `<g transform="translate(60 128) scale(.42)">${avatarSVG({ look, genre, age: 25, outfit: look.style || 'casual' }, `pa${uid}`)}</g>` : '';
  const deco = {
    selfie: face,
    sport: `<rect x="20" y="56" width="80" height="8" rx="3" fill="#fff" opacity=".9"/><rect x="14" y="44" width="12" height="32" rx="3" fill="#fff"/><rect x="94" y="44" width="12" height="32" rx="3" fill="#fff"/>`,
    soiree: `${[20, 50, 80, 100].map((x, i) => `<circle cx="${x}" cy="${20 + i * 7}" r="${6 + i}" fill="#fff" opacity=".5"/>`).join('')}${face}`,
    voyage: `<circle cx="86" cy="30" r="14" fill="#fff6c2"/><path d="M0 80 Q30 70 60 80 T120 78 V120 H0Z" fill="#1a8fb5"/><path d="M0 98 Q60 88 120 98 V120 H0Z" fill="#f4dca6"/>`,
    voiture: `<g transform="translate(60 92) scale(.5)"><path d="M-100 -12 Q-100 -30 -80 -34 L-40 -54 Q-20 -62 20 -60 Q56 -58 84 -38 L102 -32 Q110 -28 108 -12 L-100 -12Z" fill="#d7263d"/><circle cx="-60" cy="-8" r="15" fill="#111"/><circle cx="64" cy="-8" r="15" fill="#111"/></g>`,
    clip: `<rect x="52" y="22" width="16" height="34" rx="8" fill="#fff"/><path d="M60 56 V80 M46 84 H74" stroke="#fff" stroke-width="4"/><path d="M10 100 H110" stroke="#ff00cc" stroke-width="3"/>`,
    business: `<rect x="24" y="40" width="72" height="56" rx="4" fill="#fff" opacity=".9"/><path d="M32 86 L50 66 L64 76 L88 50" stroke="#1d2b64" stroke-width="4" fill="none"/>`,
    luxe: `<circle cx="60" cy="58" r="24" fill="#f5d76e" stroke="#fff" stroke-width="4"/><path d="M60 58 V42 M60 58 L72 64" stroke="#3a2f0b" stroke-width="3"/>`,
  }[type] || face;
  return `<svg viewBox="0 0 120 120" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">${bg}${deco}</svg>`;
}
export function instaHTML(S, o, back) {
  const I = S.insta;
  if (!I) return back('Instapic') + '<p class="ph-empty">Instapic est accessible à partir de 12 ans.</p>';
  const types = Object.entries(POST_TYPES).filter(([, t]) => !t.cond || t.cond(S));
  const feed = instaFeed(S);
  const tab = o.itab || 'feed';
  const head = `<div class="ig-tabs">${[['feed', 'Fil d’actu'], ['profil', 'Mon profil']].map(([k, t]) => `<button class="${tab === k ? 'on' : ''}" data-a="itab" data-v="${k}">${t}</button>`).join('')}</div>`;
  if (tab === 'feed')
    return back('Instapic') + head + `<div class="ph-pad">${feed.map((p, i) => { const done = S.relUsed[`${S.relations.find((r) => r.prenom === p.who)?.id}:com`]; return `<div class="ig-post"><div class="ig-h"><span class="ph-av sm">${esc(p.who[0])}</span><b>${esc(p.who)}</b></div><div class="ig-img">${postArt(p.type, p.look, p.genre, 'f' + i)}</div><small>❤️ ${fmtN(p.likes)} · ${esc(p.txt)}</small>${done ? '<small class="hint">Tu as commenté.</small>' : `<div class="chips">${[['gentil', 'Commentaire sympa'], ['drole', 'Vanne'], ['mechant', 'Commentaire méchant']].map(([k, t]) => `<button class="chip" data-a="comment" data-v="${esc(p.who)}" data-x="${k}">${t}</button>`).join('')}</div>`}</div>`; }).join('') || '<p class="ph-empty">Fais-toi des amis pour voir leurs posts.</p>'}</div>`;
  return back('Instapic') + head + `<div class="ph-pad"><div class="ig-prof"><span class="ph-av big">${esc(S.id.prenom[0])}</span><div><b>@${esc((S.id.prenom + S.id.nom).toLowerCase().replace(/[^a-z0-9]/g, ''))}</b><div class="ig-stats"><span><b>${I.posts.length}</b> posts</span><span><b>${fmtN(I.followers)}</b> abonnés</span></div></div></div>
    <p class="ph-sec" style="padding-left:0">Publier · ${Math.max(0, 3 - S.annee.posts)} restant${3 - S.annee.posts > 1 ? 's' : ''} cette année</p>
    <p class="hint" style="margin:-4px 0 6px">Poster plus souvent ne sert à rien. Tes abonnés viennent de ton apparence, ton charisme et ta notoriété.</p>
    <div class="chips">${types.map(([k, t]) => `<button class="chip ${S.annee.posts >= 3 ? 'off' : ''}" data-a="post" data-v="${k}">${t.nom}</button>`).join('')}</div>
    <div class="ig-grid">${I.posts.map((p, i) => `<div class="ig-tile ${p.viral ? 'viral' : ''}">${postArt(p.type, S.look, S.id.genre, 'm' + i)}<small>❤️ ${fmtN(p.likes)}</small></div>`).join('')}</div></div>`;
}

// ---------- Actus du monde ----------
export function actusHTML(S, back) {
  const m = S.monde;
  const hot = Object.entries(m.pays).filter(([, v]) => v !== 'stable');
  return back('Actus') + `<div class="ph-pad"><p class="ph-sec" style="padding-left:0">Situation dans le monde</p>${hot.map(([p, v]) => `<div class="li"><div class="grow"><b>${esc(p)}</b><small>${SITUATIONS[v].nom}</small></div><span class="sit sit-${v}"></span></div>`).join('') || '<div class="note">Le monde est calme… pour l’instant.</div>'}
    <p class="ph-sec" style="padding-left:0">Dernières nouvelles</p>${m.news.slice().reverse().map((n) => `<div class="news"><small>${n.age} ans</small>${esc(n.txt)}</div>`).join('') || '<div class="note">Aucune actu.</div>'}</div>`;
}

// ---------- Blackjack ----------
const cardHTML = (c, hide) => `<span class="card ${hide ? 'back' : ['♥', '♦'].includes(c.s) ? 'red' : ''}">${hide ? '' : `${c.v}<i>${c.s}</i>`}</span>`;
export function blackjackHTML(S, o) {
  const b = o.bj;
  if (!b) return `<p class="hint">Approche-toi le plus possible de 21 sans dépasser. Le croupier tire jusqu’à 17. Blackjack ×2,5.</p>`;
  return `<div class="bj"><div><span class="lbl">Croupier ${b.done ? `· ${handValue(b.d)}` : ''}</span><div class="hand">${b.d.map((c, i) => cardHTML(c, !b.done && i === 1)).join('')}</div></div>
    <div><span class="lbl">Toi · ${handValue(b.p)}</span><div class="hand">${b.p.map((c) => cardHTML(c)).join('')}</div></div>
    ${b.done ? `<div class="note ${b.delta > 0 ? '' : 'warn'}" style="text-align:center;font-size:15px">${b.res} ${b.delta > 0 ? `+${euros(b.delta)}` : b.delta < 0 ? euros(b.delta) : ''}</div>` : `<div class="chips" style="justify-content:center"><button class="btn sm" data-a="bjhit">Carte</button><button class="btn sm" data-a="bjstand">Rester</button></div>`}</div>`;
}

// ---------- Santé et addictions (onglet Vie) ----------
export function healthHTML(S) {
  const sy = symptoms(S);
  const add = Object.entries(S.addic).filter(([, v]) => v > 0);
  const etat = [];
  if (S.stats.sante < 35) etat.push('Mine fatiguée, cernes');
  if (S.blessure === S.age) etat.push('Blessé·e récemment');
  if (S.stats.forme >= 70) etat.push('Physique athlétique');
  if (S.stats.forme < 25 && S.age >= 30) etat.push('Hors de forme');
  return `<div class="sec"><h3>Santé</h3>${sy.length ? `<div class="list">${sy.map((t) => `<div class="li"><div class="grow"><b>${esc(t)}</b><small>${/stade/.test(t) ? 'Sous traitement' : 'Symptôme non diagnostiqué : va voir un médecin'}</small></div></div>`).join('')}</div>` : '<div class="note">Aucun symptôme.</div>'}
    ${etat.length ? `<p class="hint" style="margin-top:8px">${etat.join(' · ')}</p>` : ''}</div>
    ${add.length ? `<div class="sec"><h3>Addictions</h3><div class="bars">${add.map(([k, v]) => `<div class="bar-s"><div class="t">${ADDICTIONS[k].nom}<span>${Math.round(v)}</span></div><div class="tr"><i style="width:${v}%;background:${v > 60 ? 'var(--bad)' : v > 30 ? 'var(--warn)' : '#9a7bff'}"></i></div></div>`).join('')}</div></div>` : ''}`;
}

// ---------- Foot ----------
export function footHTML(S) {
  if (S.carriere?.id !== 'foot' || !S.foot) return '';
  const f = S.foot;
  return `<div class="sec"><h3>Carrière de footballeur</h3><div class="kpis">${[['Club', footClub(S)], ['Matchs', f.matchs], ['Buts', f.buts], ['Sélections', f.selections], ['Ratio', f.matchs ? (f.buts / f.matchs).toFixed(2) : '0']].map(([k, v]) => `<div class="kpi"><small>${k}</small><b>${v}</b></div>`).join('')}</div>
    <div class="list" style="margin-top:8px">${f.saisons.slice(-5).reverse().map((x) => `<div class="li"><div class="grow"><b>${x.age} ans · ${esc(x.club)}</b><small>${x.m} matchs · ${x.b} buts</small></div></div>`).join('')}</div></div>`;
}

// ---------- Expatriation (onglet Biens) ----------
export function expatHTML(S) {
  if (S.age < 18) return '';
  return `<div class="sec"><h3>S’installer à l’étranger</h3><div class="list">${EXPAT.map((d) => { const sit = situation(S, d.pays); return `<div class="li ${S.money >= d.prix && sit !== 'guerre' ? '' : 'off'}"><div class="grow"><b>${d.ville}</b><small>${d.pays} · ${SITUATIONS[sit].nom}</small></div><button class="btn sm" data-a="expat" data-v="${d.ville}">${euros(d.prix)}</button></div>`; }).join('')}</div></div>`;
}

export const destinLabel = (r) => (r.destin ? `devenu ${DESTINS[r.destin].nom}` : '');
export const destinService = (r) => (r.destin ? DESTINS[r.destin].service : '');
