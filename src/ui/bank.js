// v0.11 : interface de la banque (onglet Biens) et de l'offre de crédit. Lecture seule.
import { icon } from './icons.js';
import { euros } from '../engine/rng.js';
import { scoreBancaire, decouvertMax, patrimoineNet, dette, annuites, primes, locatifs, loyerDe, nomCourt, LIVRET_PLAFOND, CREDITS } from '../engine/bank.js';
import { simuler } from '../engine/credit.js';
import { ASSETS } from '../data/world.js';

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const pct = (x) => `${(x * 100).toFixed(1).replace('.', ',')} %`;
const noteCouleur = (n) => (n >= 70 ? 'var(--good)' : n >= 45 ? 'var(--warn)' : 'var(--bad)');

export function banqueHTML(S) {
  if (S.age < 18) return '';
  const b = S.banque || { epargne: 0, prets: [], fiche: 0, assur: {}, enfants: {} };
  const sc = scoreBancaire(S);
  const pr = primes(S);
  const fem = S.id.genre === 'f';
  const enfants = S.relations.filter((r) => r.vivant && r.lien === 'enfant' && r.age < 18);
  const prets = b.prets.map((p) => `<div class="li"><div class="grow"><b>${esc(p.nom)}</b><small>${CREDITS[p.type]?.nom || 'Crédit'} · ${(p.taux * 100).toFixed(2).replace('.', ',')} % · encore ${p.ans} an${p.ans > 1 ? 's' : ''}${p.retards ? ` · <span style="color:var(--bad)">${p.retards} impayé${p.retards > 1 ? 's' : ''}</span>` : ''}</small><small>Reste dû ${euros(p.reste)} · ${euros(Math.round(p.annuite / 12))}/mois</small></div><button class="btn sm" data-a="anticipe" data-v="${p.uid}" title="Indemnités de remboursement anticipé incluses">Solder</button></div>`).join('');
  const locs = locatifs(S).map((x) => {
    const L = x.loc || {};
    const etat = L.etat ?? 85;
    return `<div class="li"><div class="grow"><b>${esc(ASSETS[x.id].nom)}</b><small>${L.loc ? `Loué à ${esc(L.loc)}` : '<span style="color:var(--warn)">Vacant</span>'} · loyer ${euros(loyerDe(x))}/an · état ${etat} %${L.impaye ? ` · impayés ${euros(L.impaye)}` : ''}</small>${L.dernier ? `<small>L’an dernier : ${euros(L.dernier.recu)} perçus, ${euros(L.dernier.charges)} de charges</small>` : ''}</div>${etat < 90 ? `<button class="btn sm" data-a="travaux" data-v="${x.uid}">Travaux ${euros(Math.round(x.valeur * 0.04))}</button>` : ''}</div>`;
  }).join('');
  const an = b.an;
  const bilan = an && (an.echeances || an.primes || an.loyers || an.interets || an.agios || an.sinistres)
    ? `<dl class="kv">${[['Échéances de crédit', an.echeances, 'bad'], ['Assurances', an.primes, 'bad'], ['Sinistres et amendes', an.sinistres, 'bad'], ['Agios et frais', an.agios, 'bad'], ['Loyers perçus', an.loyers, 'good'], ['Charges des locations', an.charges, 'bad'], ['Intérêts du livret', an.interets, 'good']].filter((x) => x[1]).map(([k, v, c]) => `<dt>${k}</dt><dd style="color:var(--${c})">${c === 'bad' ? '−' : '+'}${euros(v)}</dd>`).join('')}</dl>` : '';
  return `<div class="sec bank"><h3>Banque</h3>
    <div class="bank-grid">
      <div><small>Compte courant</small><b style="${S.money < 0 ? 'color:var(--bad)' : ''}">${euros(S.money)}</b><span>Découvert autorisé ${euros(decouvertMax(S))}</span></div>
      <div><small>Livret (3 %)</small><b>${euros(b.epargne)}</b><span>Plafond ${euros(LIVRET_PLAFOND)}</span></div>
      <div><small>Patrimoine net</small><b>${euros(patrimoineNet(S))}</b><span>${dette(S) ? `Dettes ${euros(dette(S))}` : 'Aucune dette'}</span></div>
      <div><small>Note bancaire</small><b style="color:${noteCouleur(sc)}">${sc}/100</b><span>${b.fiche ? `Fiché${fem ? 'e' : ''} encore ${b.fiche} an${b.fiche > 1 ? 's' : ''}` : sc >= 70 ? 'Excellent dossier' : sc >= 45 ? 'Dossier correct' : 'Dossier fragile'}</span></div>
    </div>
    ${b.fiche ? `<div class="note warn">Inscrit${fem ? 'e' : ''} au fichier des incidents de crédit : aucune banque ne te prêtera avant ${b.fiche} an${b.fiche > 1 ? 's' : ''}.</div>` : ''}
    <div class="chips bank-chips"><button class="chip" data-a="livret" data-v="1000">+1 000 € au livret</button><button class="chip" data-a="livret" data-v="max">Tout placer</button><button class="chip" data-a="livret" data-v="-1000">Retirer 1 000 €</button><button class="chip" data-a="livret" data-v="-max">Tout retirer</button></div>
    ${enfants.length ? `<div class="sub-h">Livrets de tes enfants (remis à leurs 18 ans)</div><div class="list">${enfants.map((k) => `<div class="li"><div class="grow"><b>${esc(k.prenom)}</b><small>${k.age} ans · ${euros(b.enfants?.[k.id] || 0)} de côté</small></div><button class="btn sm" data-a="livretk" data-v="${k.id}">+500 €</button></div>`).join('')}</div>` : ''}
    <div class="sub-h">Crédits en cours${b.prets.length ? ` · ${euros(Math.round(annuites(S) / 12))}/mois` : ''}</div>
    ${prets ? `<div class="list">${prets}</div>` : '<div class="note">Aucun crédit. Tu peux acheter à crédit une voiture, un logement, un bien locatif ou un business : bouton « À crédit ».</div>'}
    <div class="sub-h">Assurances</div>
    <div class="list">
      <div class="li"><div class="grow"><b>Habitation</b><small>${b.assur?.hab ? `${euros(pr.hab)}/an · couvre ton logement et tes locations (franchise 300 €)` : 'Non assuré : un dégât des eaux ou un cambriolage est pour toi'}</small></div><button class="btn sm ${b.assur?.hab ? 'on' : ''}" data-a="assur" data-v="hab">${b.assur?.hab ? 'Résilier' : 'Souscrire'}</button></div>
      <div class="li"><div class="grow"><b>Auto</b><small>${b.assur?.auto ? `${euros(pr.auto)}/an · accidents couverts (franchise 500 €)` : 'Obligatoire pour rouler : amende de 750 € au contrôle'}</small></div><button class="btn sm ${b.assur?.auto ? 'on' : ''}" data-a="assur" data-v="auto">${b.assur?.auto ? 'Résilier' : 'Souscrire'}</button></div>
    </div>
    ${locs ? `<div class="sub-h">Mes locations</div><div class="list">${locs}</div>` : ''}
    ${bilan ? `<div class="sub-h">Banque l’an dernier</div>${bilan}` : ''}
  </div>`;
}

// ---------- Offre de crédit ----------
export function creditHTML(S, OV) {
  const sim = simuler(S, OV.cible, OV.apport, OV.duree);
  if (!sim) return '';
  const { c, C, o } = sim;
  const opts = [...new Set([o.apportMin, ...[0.1, 0.2, 0.3, 0.5].map((k) => Math.ceil(c.prix * k))])].filter((a) => a >= o.apportMin && a < c.prix && a <= Math.max(0, S.money)).sort((a, b) => a - b);
  const ok = o.ok === true;
  return `<div class="ach-wrap" data-a="overlay" role="dialog" aria-modal="true" aria-label="Offre de crédit">
    <div class="ach-card glass credit" data-stop="1">
      <div class="sheet-h"><div><h2>${icon('key', 20)} ${C.nom}</h2><div class="sub">${esc(c.nom)} · ${euros(c.prix)}</div></div><button class="close" data-a="overlay" aria-label="Fermer">${icon('x', 18)}</button></div>
      <div class="sheet-b">
        <div class="sub-h">Apport (tu as ${euros(Math.max(0, S.money))})</div>
        <div class="chips">${opts.length ? opts.map((a) => `<button class="chip ${a === o.apport ? 'on' : ''}" data-a="capport" data-v="${a}">${euros(a)}</button>`).join('') : `<span class="hint">Apport minimum ${euros(o.apportMin)} : pas assez sur ton compte.</span>`}</div>
        <div class="sub-h">Durée</div>
        <div class="chips">${C.durees.map((d) => `<button class="chip ${d === o.duree ? 'on' : ''}" data-a="cduree" data-v="${d}">${d} ans</button>`).join('')}</div>
        <div class="offre"><small>Mensualité</small><b>${euros(o.mensualite)}<span>/mois</span></b>
          <dl class="kv">
            <dt>Montant emprunté</dt><dd>${euros(o.montant)}</dd>
            <dt>Taux</dt><dd>${pct(o.taux)}</dd>
            ${o.assur ? `<dt>Assurance emprunteur (décès)</dt><dd>${euros(Math.round(o.assur / 12))}/mois</dd>` : ''}
            <dt>Coût total du crédit</dt><dd>${euros(o.cout)}</dd>
            <dt>Frais de dossier</dt><dd>${euros(o.frais)}</dd>
            <dt>Endettement après signature</dt><dd style="color:${o.endettement > 0.35 ? 'var(--bad)' : 'inherit'}">${Number.isFinite(o.endettement) ? `${Math.round(o.endettement * 100)} %` : '—'}</dd>
            <dt>Reste à vivre</dt><dd>${euros(o.resteAVivre)}/mois</dd>
            <dt>Ta note bancaire</dt><dd style="color:${noteCouleur(o.score)}">${o.score}/100</dd>
          </dl></div>
        ${ok ? '' : `<div class="note warn">Refusé : ${esc(o.ok)}</div>`}
        <button class="btn primary" style="width:100%" data-a="csigne" ${ok ? '' : 'disabled'}>${icon('edit', 16)} Signer l’offre</button>
        <p class="hint" style="margin-top:8px">L’argent va directement au vendeur. Si tu revends, la banque est remboursée en premier. Deux échéances impayées : saisie du bien et fichage pour 5 ans.</p>
      </div>
    </div></div>`;
}
