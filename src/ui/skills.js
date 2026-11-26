// v0.12 : interface des compétences, de l'employeur et des filières (onglet Carrière). Lecture seule.
import { euros } from '../engine/rng.js';
import { niveau, xpDe } from '../engine/skills.js';
import { DOMAINES, SKILLS, SEUILS, NIVEAUX, FILIERES, TAILLES, CULTURES, VOIES, FORMATION, METIER_REQUIS } from '../data/skills.js';
import { CAREERS, DIPLOME_NOM } from '../data/careers.js';

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function emploiHTML(S) {
  const k = S.carriere;
  if (!k) return '';
  const e = k.emp;
  const col = S.relations.filter((r) => r.vivant && r.lien === 'collegue');
  const rows = [];
  if (e) rows.push(['Employeur', `${esc(e.nom)} · ${TAILLES[e.taille]?.nom || ''}`], ['Ambiance', `${CULTURES[e.culture]?.nom || ''} · santé ${e.sante < 30 ? '<span style="color:var(--bad)">fragile</span>' : e.sante < 55 ? 'moyenne' : 'bonne'}`]);
  if (k.voie) rows.push(['Voie', VOIES[k.voie].nom]);
  if ((k.mult || 1) !== 1) rows.push(['Contrat', `${k.mult > 1 ? '+' : ''}${Math.round((k.mult - 1) * 100)} % sur la grille`]);
  if (col.length) rows.push(['Collègues', col.map((r) => `${esc(r.prenom)}${r.chef ? ' (supérieur' + (r.genre === 'f' ? 'e' : '') + ')' : ''}`).join(', ')]);
  return rows.length ? `<dl class="kv job-extra">${rows.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>` : '';
}

export function competencesHTML(S) {
  const acquises = Object.keys(SKILLS).filter((k) => xpDe(S, k) > 0).sort((a, b) => xpDe(S, b) - xpDe(S, a));
  const ligne = (k) => {
    const n = niveau(S, k);
    const x = xpDe(S, k);
    const bas = SEUILS[n], haut = SEUILS[n + 1];
    const p = haut ? Math.round(((x - bas) / (haut - bas)) * 100) : 100;
    return `<div class="skill"><div class="t"><span>${SKILLS[k]}</span><b>${NIVEAUX[n]}</b></div><div class="tr"><i style="width:${Math.max(3, p)}%"></i></div></div>`;
  };
  const requis = S.carriere ? '' : Object.entries(METIER_REQUIS).map(([id, r]) => `${CAREERS[id].niveaux[0][0]} : ${Object.entries(r).map(([k, n]) => `${SKILLS[k].toLowerCase()} « ${NIVEAUX[n].toLowerCase()} »`).join(', ')}`).join(' · ');
  const former = S.age >= 18 ? `<div class="sub-h">Formation continue · ${euros(FORMATION.prix)} et 1 énergie</div>${Object.values(DOMAINES).map((D) => `<div class="dom"><small>${D.nom}</small><div class="chips">${D.skills.map((k) => `<button class="chip" data-a="former" data-v="${k}">${SKILLS[k]}</button>`).join('')}</div></div>`).join('')}` : '';
  return `<div class="sec skills"><h3>Compétences</h3>
    ${acquises.length ? `<div class="skill-list">${acquises.map(ligne).join('')}</div>` : '<div class="note">Aucune compétence pour l’instant : études, activités et travail te feront progresser.</div>'}
    <p class="hint">Chaque compétence progresse au plus de 160 points par an. Les métiers qualifiés en exigent : ${esc(requis || 'regarde les offres d’emploi')}.</p>
    ${former}</div>`;
}

// Choix de filière pour la licence, le BTS et le master
export function filieresHTML(choix) {
  return `<div class="sub-h">Filière (licence, BTS, master)</div><div class="chips">${Object.entries(FILIERES).map(([k, F]) => `<button class="chip ${choix === k ? 'on' : ''}" data-a="filiere" data-v="${k}">${F.nom}</button>`).join('')}</div>`;
}
export function diplomesHTML(S) {
  const d = S.etudes?.diplomes || [];
  return d.length ? `<div class="note">Diplômes : ${d.map((x) => `${DIPLOME_NOM[x.d]}${FILIERES[x.f] ? ` en ${FILIERES[x.f].nom.toLowerCase()}` : x.f === 'medecine' ? ' de médecine' : x.f === 'droit' ? ' de droit' : ''} (${x.age} ans)`).join(' · ')}</div>` : '';
}
