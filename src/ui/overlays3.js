// Interfaces V3 : intro animée, Instapic, actus, messages avec réponses, blackjack, santé, foot, expatriation.
import { icon } from './icons.js';
import { euros } from '../engine/rng.js';
import { POST_TYPES, instaFeed, handValue, REPLIES, ADDICTIONS, DISEASES, symptoms, footClub, EXPAT, SITUATIONS, situation, DESTINS, introLines } from '../engine/life2.js';

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmtN = (n) => Math.round(n).toLocaleString('fr-FR');

// ---------- Intro animée ----------
export function introHTML(S) {
  const lines = introLines(S);
  return `<div class="intro"><div class="intro-in">${lines.map((l, i) => `<p style="animation-delay:${0.4 + i * 0.9}s">${esc(l)}</p>`).join('')}
    <button class="btn primary intro-go" style="animation-delay:${0.6 + lines.length * 0.9}s" data-a="introgo">Commencer ma vie</button></div>
    <button class="intro-skip" data-a="introgo">Passer</button></div>`;
}

// ---------- Messages : conversations à bulles + réponses ----------
const convKey = (m) => (m.mine ? m.conv : m.from);
export function messagesHTML(S, o, back) {
  const convs = {};
  S.phone.msgs.forEach((m) => (convs[convKey(m)] ||= []).push(m));
  if (o.compose) {
    const people = S.relations.filter((r) => r.vivant && r.lien !== 'candidat' && r.age >= 8);
    return back('Nouveau message') + `<div class="ph-list">${people.map((r) => `<button class="ph-row" data-a="phoneconv" data-v="${esc(r.prenom)}"><span class="ph-av">${esc(r.prenom[0])}</span><span class="grow"><b>${esc(r.prenom)} ${esc(r.nom)}</b><small>${r.lien === 'contact' ? 'Contact pro' : 'Proche'}</small></span></button>`).join('')}</div>`;
  }
  if (o.conv) {
    const list = convs[o.conv] || [];
    const canReply = S.relations.some((r) => r.vivant && r.prenom === o.conv);
    return back(esc(o.conv)) + `<div class="ph-thread">${list.map((m) => `<div class="bubble ${m.mine ? 'mine' : ''}"><span>${esc(m.txt)}</span><small>${m.age} ans</small></div>`).join('') || '<p class="ph-empty">Écris le premier message.</p>'}</div>
      ${canReply ? `<div class="ph-reply">${REPLIES.map((t) => `<button class="chip" data-a="sendmsg" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : '<p class="ph-empty">Ce numéro ne peut pas recevoir de réponse.</p>'}`;
  }
  const keys = Object.keys(convs).sort((a, b) => convs[b].at(-1).t - convs[a].at(-1).t);
  return back('Messages', `<button data-a="compose" aria-label="Nouveau message">${icon('edit', 18)}</button>`) + `<div class="ph-list">${keys.map((k) => { const last = convs[k].at(-1); const un = convs[k].some((m) => !m.read); return `<button class="ph-row" data-a="phoneconv" data-v="${esc(k)}"><span class="ph-av">${esc(k[0])}</span><span class="grow"><b>${esc(k)}${un ? ' <i class="dot-u"></i>' : ''}</b><small>${last.mine ? 'Toi : ' : ''}${esc(last.txt)}</small></span></button>`; }).join('') || '<p class="ph-empty">Aucun message.</p>'}</div>`;
}

// ---------- Instapic ----------
export function instaHTML(S, o, back) {
  const I = S.insta;
  if (!I) return back('Instapic') + '<p class="ph-empty">Instapic est accessible à partir de 12 ans.</p>';
  const types = Object.entries(POST_TYPES).filter(([, t]) => !t.cond || t.cond(S));
  const feed = instaFeed(S);
  const tab = o.itab || 'profil';
  const head = `<div class="ig-tabs">${[['profil', 'Mon profil'], ['feed', 'Fil d’actu']].map(([k, t]) => `<button class="${tab === k ? 'on' : ''}" data-a="itab" data-v="${k}">${t}</button>`).join('')}</div>`;
  if (tab === 'feed') return back('Instapic') + head + `<div class="ph-pad">${feed.map((p) => `<div class="ig-post"><div class="ig-h"><span class="ph-av sm">${esc(p.who[0])}</span><b>${esc(p.who)}</b></div><div class="ig-img"></div><small>❤️ ${fmtN(p.likes)} · ${esc(p.txt)}</small></div>`).join('') || '<p class="ph-empty">Suis des amis pour voir leurs posts.</p>'}</div>`;
  return back('Instapic') + head + `<div class="ph-pad"><div class="ig-prof"><span class="ph-av big">${esc(S.id.prenom[0])}</span><div><b>@${esc((S.id.prenom + S.id.nom).toLowerCase().replace(/[^a-z0-9]/g, ''))}</b><div class="ig-stats"><span><b>${I.posts.length}</b> posts</span><span><b>${fmtN(I.followers)}</b> abonnés</span><span><b>${S.relations.filter((r) => r.vivant && r.age >= 12).length}</b> abonnements</span></div></div></div>
    <p class="ph-sec" style="padding-left:0">Publier (${Math.max(0, 6 - S.annee.posts)} restants cette année)</p><div class="chips">${types.map(([k, t]) => `<button class="chip" data-a="post" data-v="${k}">${t.nom}</button>`).join('')}</div>
    <div class="ig-grid">${I.posts.map((p) => `<div class="ig-tile ${p.viral ? 'viral' : ''}"><span>${esc(POST_TYPES[p.type]?.nom || p.txt)}</span><small>❤️ ${fmtN(p.likes)}</small></div>`).join('')}</div></div>`;
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
