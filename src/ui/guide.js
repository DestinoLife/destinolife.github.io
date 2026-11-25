// Guide interactif façon Clash Royale : un proche du jeu (ta mère au départ) t'explique l'interface avec spotlight.
import { miniAvatarSVG } from '../render/avatar.js';
import { icon } from './icons.js';

const GUIDE_KEY = 'destino.guide.v1';
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export const hasSeenGuide = () => {
  try {
    return !!localStorage.getItem(GUIDE_KEY);
  } catch {
    return false;
  }
};
export const markGuideDone = () => {
  try {
    localStorage.setItem(GUIDE_KEY, '1');
  } catch {
    // ignore
  }
};

function coachFor(s) {
  const mere = s.relations.find((r) => r.vivant && r.lien === 'mere');
  const pere = s.relations.find((r) => r.vivant && r.lien === 'pere');
  const ami = s.relations.find((r) => r.vivant && r.lien === 'ami');
  const r = mere || pere || ami;
  if (r) {
    const role = r.lien === 'mere' ? 'Ta mère' : r.lien === 'pere' ? 'Ton père' : 'Ton ami';
    return { nom: r.prenom, role, look: r.look, genre: r.genre, age: r.age };
  }
  return { nom: 'Le Destin', role: 'Guide', look: s.look, genre: s.id.genre, age: 32 };
}

export function guideSteps(s) {
  const c = coachFor(s);
  const paysInfo = s.id.statut === 'au_pays' ? `à ${s.id.pays}` : `à ${s.id.ville}`;
  return [
    {
      target: null,
      title: `Bienvenue au monde, ${s.id.prenom} !`,
      txt: `Je suis ${c.nom} (${c.role.toLowerCase()}). Tu démarres ta vie ${paysInfo}. Laisse-moi te montrer les bases en 4 étapes rapides.`,
      cta: 'C’est parti →',
    },
    {
      target: '#hudtr',
      title: 'Ton identité, ton argent et ton énergie',
      txt: 'En haut à droite, suis ton âge, ton compte en banque et tes 4 éclairs d’énergie par an. Chaque activité, démarche ou coup en utilise un.',
      cta: 'Compris →',
    },
    {
      target: '#hudtl',
      title: 'Ton décor évolue avec ta vie',
      txt: 'En haut à gauche : ton pays ou ta ville, la météo et l’heure. Ton personnage grandit vraiment de bébé à adulte, et le paysage change selon tes choix.',
      cta: 'Suivant →',
    },
    {
      target: '#dock',
      title: 'Gère toute ta vie depuis le menu',
      txt: 'Activités, Carrière, Crime, Relations, Biens… et ton Téléphone pour répondre à tes proches. Pense aussi aux Défis dans l’onglet Vie !',
      cta: 'Dernière étape →',
    },
    {
      target: '.age-btn',
      title: 'Fais avancer ton destin',
      txt: 'Clique sur « Vieillir » (ou appuie sur Espace sur PC) pour passer à l’année suivante — ou « Avancer » dès que tu as un rendez-vous prévu.',
      cta: 'Jouer maintenant !',
    },
  ];
}

export function guideHTML(s, stepIdx = 0) {
  const steps = guideSteps(s);
  const idx = Math.max(0, Math.min(steps.length - 1, stepIdx));
  const st = steps[idx];
  const c = coachFor(s);
  const av = `<svg viewBox="-56 -62 112 112" width="64" height="64">${miniAvatarSVG({ look: c.look, genre: c.genre, age: c.age }, 'gdcoach')}</svg>`;
  return `<div class="guide-wrap" data-stop="1" role="dialog" aria-modal="true" aria-label="Guide interactif">
    <div class="guide-spot" id="guideSpot"></div>
    <div class="guide-card glass">
      <div class="guide-av">${av}</div>
      <div class="guide-body">
        <div class="guide-who"><b>${esc(c.nom)}</b><span>${esc(c.role)} · ${idx + 1}/${steps.length}</span></div>
        <h3>${esc(st.title)}</h3>
        <p>${esc(st.txt)}</p>
        <div class="guide-acts">
          <button class="btn sm" data-a="guideskip">Passer</button>
          <button class="btn primary sm" data-a="guidenext" data-v="${idx + 1}">${esc(st.cta)}</button>
        </div>
      </div>
    </div>
  </div>`;
}

// Positionne le spotlight sur l'élément ciblé après rendu DOM.
export function positionGuide(s, stepIdx = 0) {
  const spot = document.getElementById('guideSpot');
  if (!spot) return;
  const steps = guideSteps(s);
  const st = steps[Math.max(0, Math.min(steps.length - 1, stepIdx))];
  const el = st?.target ? document.querySelector(st.target) : null;
  if (!el) {
    spot.style.display = 'none';
    return;
  }
  const r = el.getBoundingClientRect();
  const pad = 8;
  spot.style.display = 'block';
  spot.style.left = `${Math.max(4, r.left - pad)}px`;
  spot.style.top = `${Math.max(4, r.top - pad)}px`;
  spot.style.width = `${r.width + pad * 2}px`;
  spot.style.height = `${r.height + pad * 2}px`;
}

// Modale des Défis / Succès (accessible depuis l'écran titre et l'onglet Vie).
export function achievementsModalHTML(summary) {
  const cats = [...new Set(summary.list.map((a) => a.cat))];
  return `<div class="ach-wrap" data-a="overlay" role="dialog" aria-modal="true" aria-label="Défis et succès">
    <div class="ach-card glass" data-stop="1">
      <div class="sheet-h">
        <div>
          <h2>${icon('trophy', 20)} Défis & Succès</h2>
          <div class="sub">${summary.count} / ${summary.total} débloqués · ${summary.pts} / ${summary.maxPts} pts</div>
        </div>
        <button class="close" data-a="overlay" aria-label="Fermer">${icon('x', 18)}</button>
      </div>
      <div class="sheet-b">
        <div class="ach-prog"><div class="tr"><i style="width:${Math.round((summary.count / Math.max(1, summary.total)) * 100)}%"></i></div></div>
        ${cats.map((cat) => `<div class="sec"><h3>${esc(cat)}</h3><div class="ach-grid">${summary.list.filter((a) => a.cat === cat).map((a) => `
          <div class="ach-item ${a.done ? 'done' : ''}">
            <div class="ach-ic">${icon(a.done ? 'trophy' : 'star', 18)}</div>
            <div class="grow">
              <b>${esc(a.nom)} <small>+${a.pts} pts</small></b>
              <p>${esc(a.desc)}</p>
              ${a.done && a.meta ? `<em>Débloqué avec ${esc(a.meta.who)} (${a.meta.age} ans)</em>` : ''}
            </div>
          </div>`).join('')}</div></div>`).join('')}
      </div>
    </div>
  </div>`;
}
