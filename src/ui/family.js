// v0.10 : interface des proches (fiche détaillée), de l'arbre familial, de la dynastie et des ambitions.
// Lecture seule : rien ici ne modifie l'état de la partie.
import { icon } from './icons.js';
import { euros } from '../engine/rng.js';
import { lienNom } from '../engine/core.js';
import { metierDe, fortuneNom, sen, traitNom } from '../engine/npc.js';
import { suggestions, nomAmbition, progAmbition, bilanVie } from '../engine/goals.js';
import { AMBITIONS } from '../data/ambitions.js';

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fem = (r) => r.genre === 'f';
const accord = (r, m) => m + (fem(r) ? 'e' : '');

// ---------- Fiche d'un proche ----------
function situation(r) {
  if (['conjoint', 'partenaire', 'mere', 'pere', 'grandparent'].includes(r.lien) || r.age < 16) return '';
  if (!r.couple) return r.kids ? 'Célibataire' : '';
  return r.couple.m ? `${accord(r, 'Marié')} à ${esc(r.couple.p)}` : `En couple avec ${esc(r.couple.p)}`;
}
export function ligneProche(r) {
  const met = r.lien === 'ami' && r.destin ? '' : metierDe(r);
  return (r.chef && r.lien === 'collegue' ? ` · ton supérieur${fem(r) ? 'e' : ''}` : '') + (met ? ` · ${esc(met)}` : '');
}
export function pnjDetailHTML(S, r) {
  if (r.lien === 'contact' || r.lien === 'candidat') return '';
  const chips = [...(r.tr || []).map((t) => traitNom(r, t))];
  if (r.age >= 18 && r.fort != null) chips.push(fortuneNom(r));
  if (r.loin) chips.push('Vit loin');
  const kv = [];
  const sit = situation(r);
  if (sit) kv.push(['Situation', sit]);
  if (r.kids) kv.push(['Enfants', String(r.kids)]);
  if (r.dette > 0) kv.push(['Te doit', euros(r.dette)]);
  const ressentis = [];
  if (sen(r, 'adm') >= 40) ressentis.push(['good', 'T’admire']);
  if (sen(r, 'ranc') >= 25) ressentis.push(['bad', 'T’en veut']);
  if (sen(r, 'jal') >= 40) ressentis.push(['warn', fem(r) ? 'Jalouse de toi' : 'Jaloux de toi']);
  const liens = (S.liens || []).filter((l) => l.a === r.id || l.b === r.id).map((l) => {
    const o = S.relations.find((x) => x.id === (l.a === r.id ? l.b : l.a));
    if (!o) return '';
    return l.t === 'couple' ? `En couple avec ${esc(o.prenom)}` : l.t === 'amis' ? `${accord(r, 'Ami')} de ${esc(o.prenom)}` : `En froid avec ${esc(o.prenom)}`;
  }).filter(Boolean);
  const souv = (r.souv || []).slice(-3).reverse();
  if (!chips.length && !kv.length && !ressentis.length && !liens.length && !souv.length) return '';
  return `<div class="pnj">
    ${chips.length ? `<div class="pnj-tags">${chips.map((c) => `<span>${esc(c)}</span>`).join('')}</div>` : ''}
    ${kv.length ? `<dl class="kv">${kv.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>` : ''}
    ${ressentis.length || liens.length ? `<div class="pnj-tags">${ressentis.map(([c, t]) => `<span class="${c}">${t}</span>`).join('')}${liens.map((t) => `<span class="link">${t}</span>`).join('')}</div>` : ''}
    ${souv.length ? `<div class="pnj-souv"><small>Ce dont ${fem(r) ? 'elle' : 'il'} se souvient</small>${souv.map((m) => `<div class="${m.w > 0 ? 'good' : m.w < 0 ? 'bad' : ''}"><b>${m.a} ans</b><span>${esc(m.t)}</span></div>`).join('')}</div>` : ''}
  </div>`;
}

// ---------- Arbre familial ----------
function noeud(r, miniAv, opts = {}) {
  const dead = !r.vivant;
  const sub = opts.sub ?? (dead ? (r.dec ? `† ${r.dec}` : `${accord(r, 'Décédé')}`) : `${r.age} ans`);
  return `<div class="tn ${dead ? 'dead' : ''} ${opts.me ? 'me' : ''}"><div class="av">${miniAv(r.look, r.genre, r.id ?? 'me')}</div><b>${esc(r.prenom)}</b><small>${esc(opts.lien ?? lienNom(r))}</small><small>${sub}</small></div>`;
}
function rang(titre, nodes) {
  return nodes.length ? `<div class="tr-row"><div class="tr-h">${titre}</div><div class="tr-n">${nodes.join('')}</div></div>` : '';
}
export function arbreHTML(S, miniAv) {
  const R = S.relations.filter((r) => r.lien !== 'contact' && r.lien !== 'candidat');
  const de = (...liens) => R.filter((r) => liens.includes(r.lien)).sort((a, b) => b.vivant - a.vivant || b.age - a.age);
  const moi = { prenom: S.id.prenom, genre: S.id.genre, look: S.look, vivant: S.vivant, age: S.age, id: 'me' };
  const gens = S.dyn?.gens || [];
  const prestige = S.dyn?.prestige || 0;
  const pr = prestige >= 30 ? 'nom respecté' : prestige >= 10 ? 'bonne réputation' : prestige <= -20 ? 'nom sulfureux' : prestige < 0 ? 'réputation fragile' : 'nom discret';
  const ancetres = gens.length ? `<div class="sec"><h3>Dynastie ${esc(S.dyn.nom)} · ${gens.length + 1} génération${gens.length ? 's' : ''}</h3><div class="list">${gens.slice().reverse().map((x) => `<div class="li"><div class="grow"><b>Génération ${x.g} · ${esc(x.p)} ${esc(x.n)}</b><small>${x.nai}–${x.dec} · ${x.age} ans${x.j ? ` · ${esc(x.j)}` : ''} · ${euros(x.f)}${x.fait ? ` · ${esc(x.fait)}` : ''}</small></div></div>`).join('')}</div><div class="note" style="margin-top:8px">Prestige du nom : ${prestige > 0 ? '+' : ''}${prestige} (${pr}). Il compte quand un enfant reprend le flambeau.</div></div>` : '';
  const arbre = [
    rang('Grands-parents', de('grandparent').map((r) => noeud(r, miniAv, { lien: r.cote ? `${lienNom(r)} · côté ${r.cote === 'mere' ? 'maternel' : 'paternel'}` : lienNom(r) }))),
    rang('Parents, oncles et tantes', [...de('mere', 'pere'), ...de('oncle')].map((r) => noeud(r, miniAv))),
    rang('Ta génération', [noeud(moi, miniAv, { me: true, lien: 'Toi' }), ...de('conjoint', 'partenaire').map((r) => noeud(r, miniAv)), ...de('fratrie', 'cousin').map((r) => noeud(r, miniAv))]),
    rang('Enfants, neveux et nièces', de('enfant', 'neveu').map((r) => noeud(r, miniAv))),
    rang('Petits-enfants', de('petitenfant').map((r) => noeud(r, miniAv))),
  ].join('');
  return `<div class="ach-wrap" data-a="overlay" role="dialog" aria-modal="true" aria-label="Arbre familial">
    <div class="ach-card glass" data-stop="1">
      <div class="sheet-h"><div><h2>${icon('users', 20)} Arbre familial</h2><div class="sub">Famille ${esc(S.id.nom)} · génération ${S.gen}</div></div><button class="close" data-a="overlay" aria-label="Fermer">${icon('x', 18)}</button></div>
      <div class="sheet-b"><div class="tree">${arbre}</div>${ancetres}</div>
    </div></div>`;
}

// ---------- Ambitions (onglet Vie) ----------
export function ambitionsHTML(S) {
  const st = S.amb || { act: [], fini: [] };
  const sug = st.act.length < 3 ? suggestions(S, 4) : [];
  const act = st.act.map((a) => {
    const p = progAmbition(S, a) || AMBITIONS[a.id]?.aide || '';
    return `<div class="li amb"><span class="amb-ico">${icon('sparkle', 16)}</span><div class="grow"><b>${esc(nomAmbition(S, a))}</b><small>${esc(p)}</small></div><button class="btn sm" data-a="ambdrop" data-v="${a.id}">Abandonner</button></div>`;
  }).join('');
  const fini = st.fini.slice().reverse().map((a) => `<div class="amb-done">${icon('star', 14)}<span>${esc(a.nom)}</span><small>${a.age} ans</small></div>`).join('');
  return `<div class="sec"><h3>Ambitions de vie${st.fini.length ? ` · ${st.fini.length} accomplie${st.fini.length > 1 ? 's' : ''}` : ''}</h3>
    ${act ? `<div class="list">${act}</div>` : `<div class="note">Aucune ambition en cours. Une vie réussie ne se mesure pas qu’en euros : choisis ce qui compte pour toi.</div>`}
    ${sug.length ? `<div class="amb-sug"><small>Te fixer un objectif (3 au maximum) :</small><div class="chips">${sug.map((a) => `<button class="chip" data-a="ambpick" data-v="${a.id}">+ ${esc(nomAmbition(S, a))}</button>`).join('')}</div></div>` : ''}
    ${fini ? `<div class="amb-fini">${fini}</div>` : ''}
  </div>`;
}

// ---------- Écran de fin ----------
export function bilanHTML(S) {
  const n = S.amb?.fini?.length || 0;
  const gens = (S.dyn?.gens?.length || 0) + 1;
  return `<dt>Bilan</dt><dd>${bilanVie(S)}</dd><dt>Ambitions</dt><dd>${n ? `${n} accomplie${n > 1 ? 's' : ''}` : 'Aucune'}</dd>${gens > 1 ? `<dt>Dynastie ${esc(S.dyn.nom)}</dt><dd>${gens} générations</dd>` : ''}`;
}
