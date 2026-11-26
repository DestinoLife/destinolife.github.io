// Interfaces V2 : téléphone, PC business, casino, voyages / cavale, biens, réseau.
import { icon } from './icons.js';
import { euros } from '../engine/rng.js';
import { fmtHeure } from '../engine/time.js';
import { ASSETS, BUSINESS, ROLES, MISSIONS, destsFor, patrimoine, contactsOf, eco, ECO, bizValue, MODELES } from '../engine/economy.js';
import { SECTEURS, PRIX } from '../engine/sectors.js';
import { lienNom } from '../engine/core.js';
import { relActions, impot, legalIncome } from '../engine/flow.js';
import { messagesHTML, instaHTML, actusHTML, blackjackHTML, destinLabel } from './overlays3.js';

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const pct = (v) => `${v >= 0 ? '+' : ''}${Math.round(v * 100)} %`;

// Petite courbe SVG pour les stats business.
export function spark(values, color = '#5ff5d0', w = 220, h = 54) {
  if (!values.length) return '';
  const min = Math.min(...values, 0), max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${((i / Math.max(1, values.length - 1)) * w).toFixed(1)},${(h - ((v - min) / (max - min || 1)) * h).toFixed(1)}`).join(' ');
  const zero = h - ((0 - min) / (max - min || 1)) * h;
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none"><line x1="0" x2="${w}" y1="${zero}" y2="${zero}" stroke="rgba(255,255,255,.12)"/><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linejoin="round"/></svg>`;
}

// ---------- Téléphone ----------
const APPS = [
  ['messages', 'Messages', 'mail', '#34c759'],
  ['insta', 'Instapic', 'camera', 'linear-gradient(45deg,#feda75,#d62976,#4f5bd5)'],
  ['contacts', 'Contacts', 'users', '#8e8e93'],
  ['actus', 'Actus', 'globe', '#5856d6'],
];
export function phoneHTML(S, o) {
  const app = o.app;
  const bar = `<div class="ph-status"><b>${fmtHeure(S.t)}</b><span>${icon('zap', 12)} 5G ▮▮▮ 87 %</span></div>`;
  let body = '';
  const back = (t, right = '') => `<div class="ph-head"><button data-a="phone" data-v="${o.conv || o.compose ? 'messages' : 'home'}">${icon('chevron', 16, 'flip')} Retour</button><b>${t}</b><span class="ph-right">${right}</span></div>`;
  if (!app || app === 'home') {
    body = `<div class="ph-home"><div class="ph-clock">${fmtHeure(S.t)}</div>${S.phone.unread ? `<button class="ph-notif" data-a="phone" data-v="messages">${icon('mail', 16)} ${S.phone.unread} message${S.phone.unread > 1 ? 's' : ''} attend${S.phone.unread > 1 ? 'ent' : ''} ta réponse</button>` : '<p class="ph-calm">Aucun message en attente.</p>'}<div class="ph-grid">${APPS.filter(([k]) => k !== 'reseau' || S.reseau).map(([k, n, i, c]) => `<button class="ph-app" data-a="phone" data-v="${k}"><span style="background:${c}">${icon(i, 26)}${k === 'messages' && S.phone.unread ? `<em>${S.phone.unread}</em>` : ''}</span>${n}</button>`).join('')}</div></div>`;
  } else if (app === 'messages') {
    body = messagesHTML(S, o, back);
  } else if (app === 'insta') {
    body = instaHTML(S, o, back);
  } else if (app === 'actus') {
    body = actusHTML(S, back);
  } else if (app === 'contacts') {
    const people = S.relations.filter((r) => r.vivant && r.lien !== 'candidat');
    const pro = people.filter((r) => r.lien === 'contact');
    const perso = people.filter((r) => r.lien !== 'contact');
    const row = (r) => {
      const open = o.rel === r.id;
      const acts = open ? relActions(S, r) : [];
      return `<div><button class="ph-row" data-a="phonerel" data-v="${r.id}"><span class="ph-av">${esc(r.prenom[0])}</span><span class="grow"><b>${esc(r.prenom)} ${esc(r.nom)}</b><small>${r.lien === 'contact' ? `${ROLES[r.role]?.nom || 'Contact'} · tarif ${r.tarif < 0.9 ? 'avantageux' : r.tarif > 1.1 ? 'élevé' : 'normal'} (×${r.tarif})` : `${lienNom(r)} ${destinLabel(r)}`} · confiance ${Math.round(r.conf ?? 50)}</small></span></button>${open ? `<div class="rel-acts ph">${acts.map((a) => `<button class="btn sm ${a.ok ? '' : 'off'}" data-a="relact" data-v="${r.id}" data-x="${a.a}" ${a.ok ? '' : 'disabled'}>${a.t}</button>`).join('')}</div>` : ''}</div>`;
    };
    body = back('Contacts') + `<div class="ph-list"><p class="ph-sec">Pro</p>${pro.map(row).join('') || '<p class="ph-empty">Aucun contact pro. Va dans Crime : « Chercher un contact ».</p>'}<p class="ph-sec">Proches</p>${perso.map(row).join('')}</div>`;
  } else if (app === 'banque') {
    const p = patrimoine(S);
    body = back('Banque') + `<div class="ph-pad"><div class="ph-card"><small>${S.age < 18 ? 'Argent de poche' : 'Compte courant'}</small><b>${euros(S.money)}</b></div>
      <dl class="kv"><dt>Biens et entreprises</dt><dd>${euros(p)}</dd><dt>Patrimoine total</dt><dd>${euros(p + S.money)}</dd><dt>Argent à blanchir</dt><dd style="color:${S.sale > 0 ? 'var(--warn)' : 'inherit'}">${euros(S.sale)}</dd><dt>Casino (gagné / perdu)</dt><dd>${euros(S.casino.gagne)} / ${euros(S.casino.perdu)}</dd></dl>
      <p class="ph-sec">Dernières opérations</p><div class="ph-ops">${S.log.filter((l) => /€/.test(l.txt)).slice(-8).reverse().map((l) => `<div><span>${esc(l.txt)}</span><small>${l.age} ans</small></div>`).join('')}</div></div>`;
  } else if (app === 'business') {
    body = back('Business') + `<div class="ph-pad">${S.business.length ? S.business.map((b) => bizCard(b, true)).join('') : '<p class="ph-empty">Aucune entreprise. Ouvre ton premier business dans l’onglet Biens.</p>'}</div>`;
  } else if (app === 'reseau') {
    body = back('Réseau') + `<div class="ph-pad">${S.reseau ? reseauStats(S) : ''}</div>`;
  } else if (app === 'journal') {
    body = back('Notes') + `<div class="ph-pad journal">${S.log.slice(-40).reverse().map((l) => `<div><b>${l.age} ans</b><span>${esc(l.txt)}</span></div>`).join('')}</div>`;
  }
  return `<div class="phone-wrap" data-a="phoneclose"><div class="phone" data-stop="1"><div class="ph-notch"></div>${bar}<div class="ph-screen">${body}</div><button class="ph-home-bar" data-a="phone" data-v="home" aria-label="Accueil"></button></div></div>`;
}

// ---------- Entreprises ----------
export function bizCard(b, compact) {
  const B = BUSINESS[b.type];
  const hist = b.hist.map((h) => (B.startup ? h.users || 0 : h.benef));
  const stats = B.startup
    ? `<dl class="kv"><dt>Ta part</dt><dd>${Math.round(b.part ?? 100)} %${b.tour ? ` · ${b.tour} levée${b.tour > 1 ? 's' : ''}` : ''}</dd><dt>Croissance</dt><dd style="color:${(b.g || 0) >= 0.2 ? 'var(--good)' : (b.g || 0) < 0.05 ? 'var(--bad)' : 'inherit'}">${b.annees ? `${(b.g || 0) >= 0 ? '+' : ''}${Math.round((b.g || 0) * 100)} %/an` : '—'}</dd><dt>Utilisateurs</dt><dd>${(b.users || 0).toLocaleString('fr-FR')}</dd><dt>Revenu mensuel</dt><dd>${euros(b.mrr || 0)}</dd><dt>Dépenses mensuelles</dt><dd>${euros(b.burn || 0)}</dd><dt>Trésorerie</dt><dd style="color:${b.cash < 50000 ? 'var(--bad)' : 'inherit'}">${euros(b.cash || 0)}</dd><dt>Autonomie</dt><dd>${b.burn > b.mrr ? `${Math.max(0, Math.floor((b.cash || 0) / (b.burn - b.mrr)))} mois` : 'Rentable'}</dd><dt>Valorisation</dt><dd>${euros(b.valo)}</dd></dl>`
    : `<dl class="kv"><dt>Chiffre d’affaires</dt><dd>${euros(b.ca)}</dd><dt>Bénéfice annuel</dt><dd style="color:${b.benef >= 0 ? 'var(--good)' : 'var(--bad)'}">${euros(b.benef)}</dd><dt>Employés</dt><dd>${b.emp}</dd><dt>Réputation</dt><dd>${b.rep}/100</dd><dt>Valeur de revente</dt><dd>${euros(b.valo)}</dd>${b.pertes ? `<dt>Années de pertes</dt><dd style="color:var(--bad)">${b.pertes} · liquidation à 3</dd>` : ''}<dt>Assurance</dt><dd>${b.assure ? 'Oui' : 'Non'}</dd></dl>`;
  const S = SECTEURS[b.type];
  const chip = (x, t, on, titre) => `<button class="chip ${on ? 'on' : ''}" data-a="biz" data-v="${b.uid}" data-x="${x}"${titre ? ` title="${esc(titre)}"` : ''}>${t}</button>`;
  // v0.13 : indicateurs du secteur, compte de résultat détaillé et décisions propres au secteur
  const secteur = compact || !S || !b.sx ? '' : `<dl class="kv sx-kpis">${S.kpis(b).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    ${b.detail ? `<div class="lbl" style="margin:10px 0 4px">Compte de résultat de l’an dernier</div><dl class="kv pnl"><dt>Ventes</dt><dd>${(b.detail.ventes || 0).toLocaleString('fr-FR')} ${S.unite}${b.detail.extra ? ` · ${esc(b.detail.extra)}` : ''}</dd><dt>Chiffre d’affaires</dt><dd>${euros(b.ca)}</dd>${b.detail.lignes.map(([k, v]) => `<dt>${esc(k)}</dt><dd style="color:var(--bad)">−${euros(v)}</dd>`).join('')}<dt><b>Bénéfice</b></dt><dd style="color:${b.benef >= 0 ? 'var(--good)' : 'var(--bad)'}"><b>${euros(b.benef)}</b></dd></dl>` : '<p class="hint">Premier compte de résultat à la fin de l’année.</p>'}
    <div class="lbl" style="margin:10px 0 4px">Décisions</div>
    ${S.noPrix ? '' : `<div class="chips">${Object.entries(PRIX).map(([k, P]) => chip(`prix:${k}`, P.nom, (b.px || 1) === P.k)).join('')}</div>`}
    ${S.decisions(b).map((d) => d.choix ? `<div class="sx-row"><small>${d.nom}</small><div class="chips">${d.choix.map(([k, t]) => chip(`sx:${d.id}:${k}`, t, d.val === k)).join('')}</div></div>` : `<div class="chips">${chip(`sx:${d.id}`, `${d.nom}${d.cout ? ` (${euros(d.cout)})` : ''}`, false, d.off || d.aide)}</div>`).join('')}`;
  const modele = compact || !B.startup ? '' : `<div class="lbl" style="margin:10px 0 4px">Modèle de revenus</div><div class="chips">${Object.entries(MODELES).map(([k, M]) => chip(`modele:${k}`, M.nom, (b.modele || 'freemium') === k)).join('')}</div>`;
  const acts = compact ? '' : `<div class="chips">${[['investir', `Agrandir (${euros(Math.round(B.prix * 0.6 * b.niveau))})`], ['marketing', `Marketing (${euros(8000 * b.niveau)})`], ...(B.lav ? [['blanchir', 'Blanchir']] : []), ...(B.startup ? [['lever', 'Lever des fonds'], ['pc', 'Ouvrir le PC']] : []), ['vendre', `Vendre (~${euros(bizValue(b))})`]].map(([a, t]) => `<button class="chip" data-a="${a === 'pc' ? 'pc' : 'biz'}" data-v="${b.uid}" data-x="${a}">${t}</button>`).join('')}</div>`;
  return `<div class="biz"><div class="biz-h"><b>${esc(b.nom)}</b><small>${B.nom} · niv. ${b.niveau} · ${b.annees} an${b.annees > 1 ? 's' : ''}</small></div>${stats}${hist.length > 1 ? `<div class="lbl" style="margin:8px 0 4px">${B.startup ? 'Croissance des utilisateurs' : 'Bénéfice par année'}</div>${spark(hist, B.startup ? '#5ff5d0' : '#ffd36e')}` : ''}${secteur}${modele}${acts}</div>`;
}

export function pcHTML(S, uid) {
  const b = S.business.find((x) => x.uid === uid);
  if (!b) return '';
  const users = b.hist.map((h) => h.users || 0);
  const ca = b.hist.map((h) => h.ca);
  return `<div class="pc-wrap" data-a="pcclose"><div class="pc" data-stop="1"><div class="pc-top"><span class="pc-dots"><i></i><i></i><i></i></span><b>${esc(b.nom)} · Dashboard</b><button class="close" data-a="pcclose" aria-label="Fermer">${icon('x', 16)}</button></div>
    <div class="pc-body"><div class="kpis">${[['Utilisateurs', (b.users || 0).toLocaleString('fr-FR')], ['Revenu mensuel', euros(b.mrr || 0)], ['Dépenses mensuelles', euros(b.burn || 0)], ['Trésorerie', euros(b.cash || 0)], ['Valorisation', euros(b.valo)], ['Employés', b.emp]].map(([k, v]) => `<div class="kpi"><small>${k}</small><b>${v}</b></div>`).join('')}</div>
    <div class="pc-charts"><div><div class="lbl">Utilisateurs</div>${spark(users, '#5ff5d0', 400, 120)}</div><div><div class="lbl">Chiffre d’affaires annuel</div>${spark(ca, '#9a7bff', 400, 120)}</div></div>
    <div class="chips">${[['investir', 'Recruter des devs'], ['marketing', 'Campagne d’acquisition'], ['lever', 'Lever des fonds'], ['vendre', 'Revendre la boîte']].map(([a, t]) => `<button class="btn sm" data-a="biz" data-v="${b.uid}" data-x="${a}">${t}</button>`).join('')}</div></div></div></div>`;
}

// ---------- Casino ----------
export function casinoHTML(S, o) {
  const game = o.game || 'roulette';
  const bets = [100, 1000, 10000, 100000].filter((b) => b <= S.money);
  const res = o.res;
  let show = '';
  if (game === 'roulette') {
    const n = res?.n;
    show = `<div class="wheel ${res ? 'spin' : ''}" style="--end:${res ? 720 + n * 9.7 : 0}deg"><div class="wheel-in">${res ? `<b class="${res.color}">${n}</b>` : '<b>?</b>'}</div></div>
      <div class="chips">${['rouge', 'noir', 'pair', 'impair'].map((c) => `<button class="chip ${o.pick === c ? 'on' : ''}" data-a="cpick" data-v="${c}">${c[0].toUpperCase() + c.slice(1)} ×2</button>`).join('')}<button class="chip ${/^\d+$/.test(o.pick || '') ? 'on' : ''}" data-a="cpick" data-v="${o.num ?? 17}">N° ${o.num ?? 17} ×36</button></div>`;
  } else if (game === 'blackjack') {
    show = blackjackHTML(S, o);
  } else {
    const reels = res?.reels || ['7', '★', '♦'];
    show = `<div class="reels ${res ? 'roll' : ''}">${reels.map((r) => `<div class="reel"><b>${r}</b></div>`).join('')}</div><p class="hint">3 identiques ×10 · trois 7 ×50 · BAR ×20 · paire ×1,5</p>`;
  }
  return `<div class="casino glass"><div class="sheet-h"><div><h2>Casino</h2><div class="sub">Solde : ${euros(S.money)}</div></div><button class="close" data-a="overlay" aria-label="Quitter">${icon('x', 18)}</button></div>
    <div class="sheet-b"><div class="tabs mini">${[['roulette', 'Roulette'], ['blackjack', 'Blackjack'], ['slots', 'Machine à sous']].map(([k, t]) => `<button class="${game === k ? 'on' : ''}" data-a="cgame" data-v="${k}">${t}</button>`).join('')}</div>
    ${show}
    ${res && game !== 'blackjack' ? `<div class="note ${res.win ? '' : 'warn'}" style="text-align:center;font-size:15px">${res.win ? `Gagné : +${euros(res.delta)}` : `Perdu : ${euros(res.delta)}`}</div>` : ''}
    <div><span class="lbl">Mise</span><div class="chips">${bets.map((b) => `<button class="chip ${o.bet === b ? 'on' : ''}" data-a="cbet" data-v="${b}">${euros(b)}</button>`).join('')}${S.money > 0 ? `<button class="chip ${o.bet === 'moitie' ? 'on' : ''}" data-a="cbet" data-v="moitie">50 %</button><button class="chip ${o.bet === 'tapis' ? 'on' : ''}" data-a="cbet" data-v="tapis">Tapis</button>` : ''}</div></div>
    ${game === 'blackjack' && o.bj && !o.bj.done ? '' : `<button class="btn primary" style="width:100%" data-a="${game === 'blackjack' ? 'bjdeal' : 'cplay'}">${game === 'roulette' ? 'Lancer la bille' : game === 'blackjack' ? 'Distribuer' : 'Tirer le levier'}</button>`}
    <p class="hint">Le jeu peut ruiner une vie. Plus de 200 000 € de pertes peut déclencher une addiction.</p></div></div>`;
}

// ---------- Voyages / cavale ----------
export function travelHTML(S, mode) {
  const cav = mode === 'cavale';
  const faux = contactsOf(S, 'faussaire').length > 0;
  const list = destsFor(S).filter((d) => !(cav && d.id === 'bruxelles' && false));
  return `<div class="travel glass"><div class="sheet-h"><div><h2>${cav ? 'Fuir à l’étranger' : 'Voyager'}</h2><div class="sub">${cav ? (faux ? 'Ton faussaire te prépare un passeport.' : 'Sans faussaire, 25 % de risque d’être arrêté à l’aéroport.') : `Solde : ${euros(S.money)}`}</div></div><button class="close" data-a="overlay" aria-label="Fermer">${icon('x', 18)}</button></div>
    <div class="sheet-b"><div class="dests">${list.map((d) => {
      const prix = cav ? d.prix * 4 + 5000 : d.prix;
      const ok = S.money >= prix;
      const safe = Math.round((1 - d.secu) * 100);
      return `<button class="dest ${ok ? '' : 'off'}" data-a="${cav ? 'flee' : 'travel'}" data-v="${d.id}" ${ok ? '' : 'disabled'}><span class="dest-scene sc-${d.scene}"></span><span class="dest-b"><b>${esc(d.ville)}</b><small>${esc(d.pays)} · ${esc(d.vibe)}</small>
        ${cav ? `<span class="bar-s"><span class="t">Sécurité<span>${safe} %</span></span><span class="tr"><i style="width:${safe}%;background:${safe > 80 ? 'var(--good)' : safe > 55 ? 'var(--warn)' : 'var(--bad)'}"></i></span></span>` : ''}
        <em>${euros(prix)}</em></span></button>`;
    }).join('')}</div></div></div>`;
}

// ---------- Onglet Biens ----------
const ECO_TXT = {
  boom: 'Tout monte : ventes, valorisations, bourse. Attention, les booms finissent souvent en krach.',
  croissance: 'Bonne période pour développer ton business et lever des fonds.',
  stable: 'Rien de particulier. Les bons gestionnaires font la différence.',
  recession: 'Les clients dépensent moins, les investisseurs ferment le robinet. Prudence.',
  krach: 'Les marchés s’effondrent. Les prix sont bas… pour ceux qui ont du cash.',
};
function ecoBlock(S) {
  const ph = S.eco?.phase || 'stable';
  const E = ECO[ph];
  const col = { boom: 'var(--good)', croissance: 'var(--good)', stable: 'var(--muted)', recession: 'var(--warn)', krach: 'var(--bad)' }[ph];
  const b = S.bourse || 0;
  const amounts = [1000, 10000, 100000].filter((m) => m <= S.money);
  return `<div class="sec"><h3>Économie et bourse</h3>
    <div class="note"><b style="color:${col}">${E.nom}</b> · ${ECO_TXT[ph]}</div>
    <div class="li"><div class="grow"><b>Compte-titres</b><small>${b ? `${euros(b)} placés${S.bourseRend != null ? ` · l’an dernier ${S.bourseRend >= 0 ? '+' : ''}${S.bourseRend} %` : ''}` : 'Rien de placé. En moyenne ça rapporte, mais un krach peut te coûter 30 % en une année.'}</small></div>${b ? '<button class="btn sm" data-a="bourse" data-v="retirer">Tout retirer</button>' : ''}</div>
    ${amounts.length ? `<div class="chips">${amounts.map((m) => `<button class="chip" data-a="bourse" data-v="placer" data-x="${m}">Placer ${euros(m)}</button>`).join('')}</div>` : ''}</div>`;
}
export function biensHTML(S, housingBlock) {
  if (S.age < 18) return `<div class="note">Tu es mineur : pas de compte en banque, seulement ${euros(S.money)} d’argent de poche. Les achats et les business, ce sera à 18 ans.</div>${housingBlock}`;
  const p = patrimoine(S);
  const own = S.biens.map((b) => {
    const a = ASSETS[b.id];
    const d = (b.valeur - b.achat) / b.achat;
    return `<div class="li"><div class="grow"><b>${a.nom}</b><small>${a.cat} · acheté ${euros(b.achat)} · <span style="color:${d >= 0 ? 'var(--good)' : 'var(--bad)'}">${pct(d)}</span></small></div><b>${euros(b.valeur)}</b><button class="btn sm" data-a="sell" data-v="${b.uid}">Vendre</button></div>`;
  }).join('');
  const shop = Object.entries(ASSETS).map(([id, a]) => { const cred = a.car || a.loc; return `<div class="li ${S.money >= a.prix || cred ? '' : 'off'}"><div class="grow"><b>${a.nom}</b><small>${a.cat} · tendance ${a.tend >= 0 ? '▲' : '▼'} ${pct(a.tend)}/an${a.loc ? ` · loyer ${euros(a.loc)}/an` : ''}${a.vol > 0.2 ? ' · très volatil' : ''}</small></div><button class="btn sm ${S.money >= a.prix ? '' : 'off'}" data-a="buyasset" data-v="${id}">${euros(a.prix)}</button>${cred ? `<button class="btn sm" data-a="credit" data-v="bien:${id}">À crédit</button>` : ''}</div>`; }).join('');
  const biz = S.business.map((b) => bizCard(b)).join('');
  const open = Object.entries(BUSINESS).map(([id, B]) => `<div class="li"><div class="grow"><b>${B.nom}</b><small>${B.desc}${B.lav ? ` · blanchit ${euros(B.lav)}/an` : ''}</small></div><button class="btn sm ${S.money >= B.prix ? '' : 'off'}" data-a="openbiz" data-v="${id}">${euros(B.prix)}</button><button class="btn sm" data-a="credit" data-v="biz:${id}">À crédit</button></div>`).join('');
  const villes = ['Paris', 'Marseille', 'Lyon', 'Nice', 'Bordeaux', 'Lille', 'Toulouse', 'Montpellier', 'Nantes', 'Strasbourg'].filter((v) => v !== S.id.ville);
  return `<div class="ph-card wide"><small>Patrimoine total</small><b>${euros(p + S.money)}</b><span>Compte ${euros(S.money)} · biens et business ${euros(p)}${S.sale ? ` · à blanchir ${euros(S.sale)}` : ''}</span></div>
    ${ecoBlock(S)}
    <div class="sec"><h3>Mes biens</h3><div class="list">${own || '<div class="note">Aucun bien pour l’instant.</div>'}</div></div>
    <div class="sec"><h3>Mes entreprises</h3>${biz || '<div class="note">Aucune entreprise. Un restaurant ou un snack permet aussi de blanchir l’argent sale.</div>'}</div>
    <div class="sec"><h3>Ouvrir un business</h3><div class="list">${open}</div></div>
    <div class="sec"><h3>Acheter (voitures, immobilier locatif, bijoux, art)</h3><div class="list">${shop}</div></div>
    <div class="sec"><h3>Sécurité</h3><div class="li"><div class="grow"><b>Gardes du corps : ${S.securite}</b><small>42 000 € par an et par garde · protège des menaces et cambriolages</small></div><button class="btn sm" data-a="guard" data-v="1">Engager</button>${S.securite ? '<button class="btn sm" data-a="guard" data-v="-1">Renvoyer</button>' : ''}</div></div>
    <div class="sec"><h3>Changer de ville</h3><p class="hint" style="margin-bottom:8px">Nouveau départ, nouvelles rencontres. 3 000 € de déménagement.</p><div class="chips">${villes.map((v) => `<button class="chip" data-a="city" data-v="${v}">${v}</button>`).join('')}</div></div>
    ${housingBlock}`;
}

// ---------- Réseau ----------
export function reseauStats(S) {
  const n = S.reseau;
  const f = S.relations.find((r) => r.id === n.fournisseur && r.vivant);
  return `<div class="job-card"><span class="lbl" style="margin:0">Ton réseau</span><dl class="kv"><dt>Points de deal</dt><dd>${n.points}</dd><dt>Guetteurs / vendeurs</dt><dd>${n.guetteurs} / ${n.vendeurs}</dd><dt>Fournisseur</dt><dd>${f ? `${esc(f.prenom)} (×${f.tarif})` : '<span style="color:var(--bad)">Aucun</span>'}</dd><dt>Dernière année</dt><dd>${n.hist.length ? euros(n.hist.at(-1).net) : '—'}</dd></dl>
    <div class="bar-s"><div class="t">Chaleur (attention de la police)<span>${n.chaleur}</span></div><div class="tr"><i style="width:${n.chaleur}%;background:${n.chaleur > 60 ? 'var(--bad)' : 'var(--warn)'}"></i></div></div>${n.hist.length > 1 ? spark(n.hist.map((h) => h.net), '#ff6b8b') : ''}</div>`;
}
export function crimeHubHTML(S) {
  const c = S.carriere && ['reseau', 'escroc'].includes(S.carriere.id) ? S.carriere : null;
  const rang = S.reseau ? 'Patron de ton réseau' : c ? (S.carriere.id === 'reseau' ? ['Guetteur', 'Charbonneur', 'Gérant de point', 'Semi-grossiste', 'Baron'] : ['Arnaqueur', 'Escroc', 'Fraudeur'])[c.niveau] : 'Indépendant';
  const next = c && !S.reseau && c.niveau < 2 ? `Réputation ${30 + c.niveau * 15} pour monter en grade (tu as ${S.stats.reputation}).` : '';
  return `<div class="hub"><div class="hub-h"><div><span class="lbl" style="margin:0">Mon business illégal</span><b>${rang}</b></div><span class="hub-sale" title="Argent sale à blanchir">${icon('cash', 15)} ${euros(S.sale)} sale</span></div>
    <div class="hub-grid"><div><small>Recherché</small><b>${S.justice.recherche}/5</b></div><div><small>Réputation de rue</small><b>${S.stats.reputation}</b></div><div><small>Savoir-faire</small><b>${S.stats.crime}</b></div></div>
    ${next ? `<p class="hint">${next}</p>` : ''}${S.sale > 0 ? '<p class="hint">Blanchis ton argent sale avec un business (onglet Biens) pour éviter le fisc.</p>' : ''}</div>${reseauHTML(S)}`;
}

export function reseauHTML(S) {
  if (!S.reseau) return '';
  const fours = contactsOf(S, 'fournisseur');
  return `<div class="sec"><h3>Gérer ton réseau</h3>${reseauStats(S)}
    <div class="lbl" style="margin-top:12px">Choisir un fournisseur (dans tes contacts)</div><div class="list">${fours.map((c) => `<div class="li"><div class="grow"><b>${esc(c.prenom)} ${esc(c.nom)}</b><small>Tarif ×${c.tarif} · qualité ×${c.qualite} · fiabilité ${Math.round(c.fiab * 100)} %</small></div>${S.reseau.fournisseur === c.id ? '<small style="color:var(--good)">Actuel</small>' : `<button class="btn sm" data-a="net" data-v="fournisseur" data-x="${c.id}">Choisir</button>`}</div>`).join('') || '<div class="note">Aucun fournisseur dans tes contacts. Utilise « Chercher un contact ».</div>'}</div>
    <div class="chips" style="margin-top:10px"><button class="chip" data-a="net" data-v="guetteur">+ Guetteur (9 000 €/an)</button><button class="chip" data-a="net" data-v="vendeur">+ Vendeur (14 000 €/an)</button><button class="chip" data-a="net" data-v="virer">Réduire l’équipe</button><button class="chip" data-a="net" data-v="fermer">Fermer le réseau</button></div>
    <div class="lbl" style="margin-top:14px">Missions (1 énergie)</div><div class="acts">${MISSIONS.map((m) => `<button class="act crime" data-a="net" data-v="${m.id}"><span class="n">${icon('users', 16)}${m.nom}</span><span class="d">${m.desc}</span><span class="m">${m.cout ? euros(m.cout) : 'Gratuit'} · ${Math.round(m.p * 100)} % de base</span></button>`).join('')}</div></div>`;
}
