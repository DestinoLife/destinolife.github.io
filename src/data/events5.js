// Événements v0.8 « Économie réelle » : imprévus d'entreprise, vie d'une start-up, conjoncture (krach, récession),
// et côté illégal : guerre de territoire, enquête des stups, indic dans l'équipe.
// Ils sont programmés par le moteur (economy.js), jamais tirés au hasard : w = 0.
import { rand } from '../engine/hitman.js';
import { rnd, chance } from '../engine/rng.js';

const bz = (s) => s.business.find((b) => b.uid === s.mem.biz) || s.business[0];
const setBiz = (s) => {
  const b = bz(s);
  if (!b) return;
  s.mem.biz = b.uid;
  s.tmp.biz = b.nom;
};
const has = (s) => s.age >= 18 && s.business.some((b) => b.uid === s.mem.biz);
const hasSU = (s) => has(s) && bz(s)?.type === 'startup';
const change = (s, fn) => { const b = bz(s); if (b) fn(b); return {}; };

export const EVENTS5 = [
  // ---------- Commerces ----------
  { id: 'biz_concurrent', w: 0, cat: 'Business', cond: has, pre: setBiz, txt: 'Une enseigne concurrente ouvre juste en face de {biz}. Prix cassés, grosse pub, file d’attente dès le premier jour.', ch: [
    { t: 'Baisser tes prix', h: 'Clients gardés · marge ▼', fx: (s) => change(s, (b) => { b.choc = 0.88; b.rep += 4; }), r: 'Tu gardes tes clients, mais tu gagnes moins sur chacun.' },
    { t: 'Miser sur la qualité (15 000 €)', h: 'Argent ▼ · réputation ▲', fx: (s) => (change(s, (b) => { b.rep = Math.min(100, b.rep + 12); }), { money: -15000 }), r: 'Nouveaux produits, déco refaite. Les habitués restent fidèles.' },
    { t: 'Ne rien changer', h: 'Risqué', fx: (s) => change(s, (b) => { b.choc = 0.72; b.rep -= 8; }), r: 'Une partie de ta clientèle traverse la rue.' },
  ] },
  { id: 'biz_bad_buzz', w: 0, cat: 'Business', cond: has, pre: setBiz, txt: 'Une vidéo d’un client mécontent de {biz} fait 2 millions de vues. Les avis 1 étoile pleuvent.', ch: [
    { t: 'Répondre publiquement avec humour', out: [
      { p: (s) => 0.35 + s.stats.charisme / 200, fx: (s) => change(s, (b) => { b.rep = Math.min(100, b.rep + 10); }), r: 'Ta réponse devient virale à son tour. Les gens adorent.' },
      { p: 1, fx: (s) => change(s, (b) => { b.rep -= 20; b.choc = 0.8; }), r: 'Ça empire. Les internautes ne te lâchent plus.' } ] },
    { t: 'Rembourser et s’excuser (5 000 €)', fx: (s) => (change(s, (b) => { b.rep -= 5; }), { money: -5000 }), r: 'L’affaire se calme en quelques jours.' },
    { t: 'Ignorer', fx: (s) => change(s, (b) => { b.rep -= 15; b.choc = 0.85; }), r: 'Les avis restent. Le chiffre d’affaires baisse.' },
  ] },
  { id: 'biz_vol_gerant', w: 0, cat: 'Business', cond: has, pre: (s) => { setBiz(s); s.tmp.vol = Math.round((bz(s)?.ca || 100000) * (0.04 + rand() * 0.06)); }, txt: 'Ton comptable a trouvé un trou de {€vol} dans les caisses de {biz}. Ton gérant se servait depuis des mois.', ch: [
    { t: 'Porter plainte', h: 'Procédure longue', fx: (s) => ({ money: -s.tmp.vol }), out: [{ p: 0.5, fx: (s) => ({ money: Math.round(s.tmp.vol * 0.6) }), r: 'Il est condamné à te rembourser une partie.' }, { p: 1, r: 'Insolvable. Tu ne reverras jamais cet argent.' }] },
    { t: 'Le virer discrètement', fx: (s) => ({ money: -s.tmp.vol }), r: 'Tu perds l’argent, mais pas ton temps.' },
    { t: 'Le faire « rembourser » à ta façon', h: 'Illégal', c: (s) => s.stats.crime >= 25, fx: { crime: 3, reputation: 4 }, r: 'Il a tout rendu. Avec les intérêts.' },
  ] },
  { id: 'biz_prudhommes', w: 0, cat: 'Business', cond: has, pre: setBiz, txt: 'Un ancien salarié de {biz} t’attaque aux prud’hommes pour licenciement abusif.', ch: [
    { t: 'Négocier un accord (12 000 €)', fx: { money: -12000 }, r: 'Accord signé. L’affaire est close.' },
    { t: 'Aller au procès', out: [{ p: 0.5, fx: { money: -4000 }, r: 'Tu gagnes. Seuls les frais d’avocat restent.' }, { p: 1, fx: { money: -38000 }, r: 'Condamné{e} à 38 000 € d’indemnités.' }] },
  ] },
  { id: 'biz_greve', w: 0, cat: 'Business', cond: has, pre: setBiz, txt: 'Les employés de {biz} réclament 10 % d’augmentation. Sinon, grève.', ch: [
    { t: 'Accepter', h: 'Charges ▲ · ambiance ▲', fx: (s) => change(s, (b) => { b.salaires = (b.salaires || 1) * 1.08; b.rep += 4; }), r: 'L’équipe est motivée. Tes charges augmentent pour de bon.' },
    { t: 'Refuser', out: [{ p: 0.5, fx: (s) => change(s, (b) => { b.choc = 0.8; b.rep -= 6; }), r: 'Deux semaines de grève. Le chiffre d’affaires plonge.' }, { p: 1, r: 'Ils râlent, mais reprennent le travail.' }] },
    { t: 'Proposer une prime unique (6 000 €)', fx: { money: -6000 }, r: 'Compromis accepté.' },
  ] },
  { id: 'biz_compta', w: 0, cat: 'Business', cond: (s) => has(s) && !s.flags.compta_creative, pre: setBiz, txt: 'Ton comptable te glisse : « On pourrait ne pas tout déclarer du cash de {biz}. Personne ne vérifie. »', ch: [
    { t: 'Accepter', h: 'Argent ▲ · risque de contrôle', fx: (s) => ({ money: Math.round((bz(s)?.ca || 0) * 0.06), flag: 'compta_creative', karma: -3 }), r: 'Cette année, ton bénéfice « réel » est bien meilleur que celui déclaré.' },
    { t: 'Refuser', fx: { karma: 2 }, r: 'Tu restes dans les clous.' },
  ] },
  { id: 'biz_incendie', w: 0, cat: 'Business', cond: has, pre: (s) => { setBiz(s); s.tmp.travaux = Math.round((bz(s)?.investi || 80000) * 0.45); }, txt: 'Un court-circuit en pleine nuit : {biz} part en fumée. Les travaux sont estimés à {€travaux}.', ch: [
    { t: 'Reconstruire ({€travaux})', c: (s) => s.money >= s.tmp.travaux || bz(s)?.assure, fx: (s) => (bz(s)?.assure ? (change(s, (b) => { b.choc = 0.6; }), { money: -5000 }) : (change(s, (b) => { b.choc = 0.6; }), { money: -s.tmp.travaux })), r: 'Six mois de fermeture, puis la réouverture.' },
    { t: 'Mettre la clé sous la porte', fx: (s) => { const b = bz(s); if (b) { s.business = s.business.filter((x) => x !== b); s.money += b.assure ? Math.round(b.investi * 0.6) : 0; } return { bonheur: -10 }; }, r: 'Tu fermes définitivement. Si tu étais assuré{e}, l’assurance te rembourse une partie.' },
  ] },
  { id: 'biz_rachat', w: 0, cat: 'Business', cond: (s) => has(s) && (bz(s)?.benef || 0) > 0, pre: (s) => { setBiz(s); s.tmp.offre = Math.round(Math.max(bz(s).valo, bz(s).investi * 0.5) * (1.1 + rand() * 0.35)); }, txt: 'Un groupe veut racheter {biz}. Leur offre : {€offre}.', ch: [
    { t: 'Accepter', fx: (s) => { s.business = s.business.filter((x) => x.uid !== s.mem.biz); return { money: s.tmp.offre }; }, r: 'Vendu ! Le virement arrive la semaine suivante.' },
    { t: 'Négocier plus haut', out: [{ p: 0.45, fx: (s) => { s.business = s.business.filter((x) => x.uid !== s.mem.biz); return { money: Math.round(s.tmp.offre * 1.2) }; }, r: 'Ils montent de 20 %. Marché conclu.' }, { p: 1, r: 'Ils se retirent. L’offre n’existe plus.' }] },
    { t: 'Refuser', r: 'Tu gardes ton bébé.' },
  ] },
  { id: 'biz_controle', w: 0, cat: 'Business', cond: has, pre: (s) => { setBiz(s); s.tmp.redress = Math.round((bz(s)?.ca || 100000) * (s.flags.compta_creative ? 0.22 : 0.03)); }, txt: 'Contrôle fiscal chez {biz}. Deux inspecteurs épluchent trois ans de comptes.', ch: [
    { t: 'Ouvrir les livres', fx: (s) => ({ money: -s.tmp.redress, unflag: 'compta_creative' }), r: '{€redress} de redressement.' },
    { t: 'Engager un expert-comptable (9 000 €)', fx: { money: -9000 }, out: [{ p: (s) => (s.flags.compta_creative ? 0.45 : 0.9), r: 'Tout est justifié. Ils repartent.' }, { p: 1, fx: (s) => ({ money: -Math.round(s.tmp.redress * 1.3), unflag: 'compta_creative', reputation: -4 }), r: 'Les fraudes sont trop visibles : redressement et pénalités.' }] },
  ] },
  { id: 'biz_hygiene', w: 0, cat: 'Business', cond: (s) => has(s) && ['resto', 'kebab'].includes(bz(s)?.type), pre: setBiz, txt: 'Inspection d’hygiène surprise chez {biz}. L’inspecteur fronce les sourcils devant la chambre froide.', ch: [
    { t: 'Faire les travaux tout de suite (14 000 €)', fx: { money: -14000 }, r: 'Tout est remis aux normes.' },
    { t: 'Négocier un délai', out: [{ p: 0.55, r: 'Il t’accorde un mois. Ouf.' }, { p: 1, fx: (s) => change(s, (b) => { b.choc = 0.7; b.rep -= 15; }), r: 'Fermeture administrative de trois mois, affichée sur la vitrine.' }] },
  ] },
  { id: 'biz_fournisseur', w: 0, cat: 'Business', cond: has, pre: setBiz, txt: 'Ton principal fournisseur augmente ses prix de 20 %. Ça mange ta marge chez {biz}.', ch: [
    { t: 'Chercher un autre fournisseur', out: [{ p: 0.6, r: 'Tu trouves moins cher, et aussi bien.' }, { p: 1, fx: (s) => change(s, (b) => { b.rep -= 8; b.choc = 0.9; }), r: 'Moins cher… et moins bon. Les clients le sentent.' }] },
    { t: 'Augmenter tes prix', fx: (s) => change(s, (b) => { b.choc = 0.92; }), r: 'Certains clients ne reviennent pas.' },
    { t: 'Absorber la hausse', fx: (s) => ({ money: -Math.round((bz(s)?.ca || 100000) * 0.05) }), r: 'Tu paies la différence de ta poche.' },
  ] },
  { id: 'biz_assurance', w: 0, cat: 'Business', cond: (s) => has(s) && !bz(s)?.assure, pre: setBiz, txt: 'Ton banquier te conseille une assurance multirisque pour {biz} (1,5 % de la valeur investie par an).', ch: [
    { t: 'Souscrire', fx: (s) => change(s, (b) => { b.assure = true; }), r: 'Tu es couvert{e} contre l’incendie et les dégâts.' },
    { t: 'Pas besoin', r: 'Tu économises… en espérant que rien n’arrive.' },
  ] },

  // ---------- Start-up ----------
  { id: 'su_pivot', w: 0, cat: 'Start-up', cond: (s) => hasSU(s) && (bz(s)?.g ?? 0) < 0.15, pre: setBiz, txt: '{biz} stagne depuis des mois. Ton associé propose de pivoter : changer complètement de produit.', ch: [
    { t: 'Pivoter', h: 'Nouveau départ, utilisateurs ÷ 2', fx: (s) => change(s, (b) => { b.q = Math.min(1, rand() ** 1.5 + 0.05); b.users = Math.round(b.users / 2); }), r: 'Nouveau produit, nouvelle chance. Personne ne sait si ça marchera.' },
    { t: 'Persévérer', r: 'Tu crois en ton idée. Tu continues.' },
    { t: 'Arrêter et récupérer la trésorerie', fx: (s) => { const b = bz(s); if (b) { s.business = s.business.filter((x) => x !== b); s.money += Math.round(Math.max(0, b.cash) * b.part / 100); } return { bonheur: -6 }; }, r: 'Tu fermes proprement. Ce qu’il reste en caisse est partagé entre associés.' },
  ] },
  { id: 'su_faille', w: 0, cat: 'Start-up', cond: hasSU, pre: setBiz, txt: 'Faille de sécurité chez {biz} : les données de milliers d’utilisateurs fuitent sur un forum.', ch: [
    { t: 'Tout dire publiquement', fx: (s) => change(s, (b) => { b.users = Math.round(b.users * 0.9); b.rep -= 5; }), r: 'Ça fait mal, mais ta transparence est saluée.' },
    { t: 'Étouffer l’affaire', out: [{ p: 0.5, r: 'Personne ne s’en rend compte.' }, { p: 1, fx: (s) => (change(s, (b) => { b.users = Math.round(b.users * 0.7); b.rep -= 25; }), { money: -60000 }), r: 'Un journaliste sort l’affaire. Amende de la CNIL et exode des utilisateurs.' }] },
  ] },
  { id: 'su_cto', w: 0, cat: 'Start-up', cond: hasSU, pre: setBiz, txt: 'Ton CTO, le génie technique de {biz}, menace de partir chez un concurrent. Il veut 10 % des parts.', ch: [
    { t: 'Lui donner 10 %', fx: (s) => change(s, (b) => { b.part = Math.round(b.part * 0.9 * 10) / 10; b.q = Math.min(1, b.q + 0.05); }), r: 'Il reste, et redouble d’efforts.' },
    { t: 'Le laisser partir', fx: (s) => change(s, (b) => { b.q = Math.max(0, b.q - 0.12); }), r: 'Le produit avance beaucoup moins vite sans lui.' },
  ] },
  { id: 'su_rachat', w: 0, cat: 'Start-up', cond: (s) => hasSU(s) && (bz(s)?.g || 0) >= 0.25 && (bz(s)?.users || 0) > 20000, pre: (s) => { setBiz(s); const b = bz(s); s.tmp.offre = Math.round(b.valo * (0.9 + rand() * 0.5)); s.tmp.pour = Math.round(s.tmp.offre * b.part / 100); }, txt: 'Un géant de la tech veut racheter {biz} pour {€offre}. Avec tes parts, tu toucherais {€pour}.', ch: [
    { t: 'Accepter', fx: (s) => { s.business = s.business.filter((x) => x.uid !== s.mem.biz); return { money: s.tmp.pour, notoriete: 5 }; }, r: 'Exit ! Ta start-up rejoint un géant. Le virement a beaucoup de zéros.' },
    { t: 'Refuser : tu vises plus haut', r: 'Tu refuses. Le marché te donnera-t-il raison ?' },
  ] },

  { id: 'faillite_boite', w: 0, forced: 1, cat: 'Business', txt: 'Mauvaise année : ta boîte n’a plus de trésorerie. Ton banquier refuse un nouveau prêt.', ch: [
    { t: 'Déposer le bilan', h: 'Fin de l’aventure', fx: { job: null, bonheur: -10, reputation: -3 }, r: 'Liquidation. Tu repars de zéro, mais sans dettes personnelles.' },
    { t: 'Remettre ton propre argent', h: 'Argent ▼▼', c: (s) => s.money >= 40000, fx: (s) => ({ money: -Math.max(40000, Math.round(s.money * 0.3)), perf: 5 }), out: [{ p: 0.55, r: 'Ça repart. De justesse.' }, { p: 1, fx: { job: null, bonheur: -15 }, r: 'Ça n’a pas suffi. Tu perds ta boîte et ton argent.' }] },
    { t: 'Licencier la moitié de l’équipe', fx: { karma: -5, perf: -5 }, r: 'Tu sauves la boîte, mais l’ambiance est morte.' },
  ] },

  // ---------- Conjoncture ----------
  { id: 'krach_boursier', w: 0, forced: 1, cat: 'Économie', txt: 'Krach boursier ! Les marchés perdent 30 % en une semaine. Les journaux parlent de « lundi noir ».', ch: [
    { t: 'Tout vendre en panique', c: (s) => s.bourse > 0, fx: (s) => { const m = Math.round(s.bourse * 0.85); s.bourse = 0; return { money: m, bonheur: -4 }; }, r: 'Tu retires tout avant que ça baisse encore… peut-être au pire moment.' },
    { t: 'Tenir bon', fx: { bonheur: -3 }, r: 'Tu serres les dents. Les marchés remontent toujours… un jour.' },
    { t: 'Acheter pendant que c’est bas', c: (s) => s.money >= 20000, fx: (s) => { const m = Math.round(s.money * 0.25); s.money -= m; s.bourse = (s.bourse || 0) + m; return {}; }, r: 'Tu places un quart de ton argent. Pari audacieux.' },
  ] },
  { id: 'recession_eco', w: 0, forced: 1, cat: 'Économie', txt: 'Récession : la consommation chute partout. Tes entreprises tournent au ralenti.', ch: [
    { t: 'Licencier pour tenir', h: 'Charges ▼ · karma ▼', fx: (s) => (s.business.forEach((b) => { b.salaires = (b.salaires || 1) * 0.88; b.rep -= 5; }), { karma: -4 }), r: 'Tu réduis la voilure. Des familles en paient le prix.' },
    { t: 'Garder tout le monde', h: 'Karma ▲', fx: (s) => (s.business.forEach((b) => { b.rep += 4; }), { karma: 4 }), r: 'Tu tiens. Tes équipes ne l’oublieront pas.' },
  ] },

  // ---------- Illégal ----------
  { id: 'guerre_gangs', w: 0, forced: 1, cat: 'Réseau · guerre', txt: 'Un réseau rival veut ton territoire. Cette nuit, une voiture a tiré sur ton point. Un de tes vendeurs est à l’hôpital.', ch: [
    { t: 'Riposter', h: 'Très dangereux', out: [
      { p: (s) => 0.35 + s.stats.reputation / 300, fx: (s) => { if (s.reseau) s.reseau.chaleur = Math.min(100, s.reseau.chaleur + 25); return { reputation: 12, crime: 4 }; }, r: 'Ils reculent. Ton nom fait peur, mais les stups s’intéressent à toi.' },
      { p: 0.75, fx: { sante: -45, recherche: 2, motif: 'Tentative d’homicide' }, r: 'L’échange de tirs tourne mal. Tu es touché{e}.' },
      { p: 1, fx: { mort: 'Règlement de comptes' }, r: 'Ils t’attendaient.' } ] },
    { t: 'Céder un point', fx: (s) => { if (s.reseau) s.reseau.points = Math.max(1, s.reseau.points - 1); return { reputation: -10 }; }, r: 'Tu perds un point, mais la paix revient.' },
    { t: 'Payer des renforts (30 000 €)', c: (s) => s.money >= 30000, fx: { money: -30000, reputation: 5 }, out: [{ p: 0.65, r: 'Avec tes nouveaux gars, plus personne n’ose approcher.' }, { p: 1, fx: { recherche: 1, motif: 'Association de malfaiteurs' }, r: 'Les renforts attirent l’attention de la BAC.' }] },
  ] },
  { id: 'enquete_ofast', w: 0, forced: 1, cat: 'Réseau · enquête', txt: 'Ton avocat est formel : l’OFAST (les stups) enquête sur toi depuis des mois. Écoutes, filatures, balises sous les voitures.', ch: [
    { t: 'Tout mettre en pause un an', h: 'Revenus ▼ · chaleur ▼▼', fx: (s) => { if (s.reseau) { s.reseau.chaleur = 5; s.reseau.boost = 0.2; } return {}; }, r: 'Le point ferme le temps que ça se calme. Ça coûte cher, mais l’enquête s’essouffle.' },
    { t: 'Changer de méthodes (15 000 €)', fx: (s) => { if (s.reseau) s.reseau.chaleur = Math.max(0, s.reseau.chaleur - 25); return { money: -15000 }; }, r: 'Téléphones cryptés, nouvelles planques, nouveaux trajets.' },
    { t: 'Continuer comme si de rien', out: [{ p: 0.4, r: 'Rien ne se passe… pour l’instant.' }, { p: 1, fx: { arrest: { motif: 'Trafic de stupéfiants en bande organisée', peine: [5, 12] } }, r: '6 h du matin, la porte saute. Coup de filet.' }] },
  ] },
  { id: 'indic_equipe', w: 0, forced: 1, cat: 'Réseau', txt: 'Un de tes guetteurs passe beaucoup de temps au commissariat ces temps-ci. Tout le monde pense qu’il balance.', ch: [
    { t: 'L’écarter discrètement', fx: (s) => { if (s.reseau) { s.reseau.guetteurs = Math.max(0, s.reseau.guetteurs - 1); s.reseau.chaleur = Math.max(0, s.reseau.chaleur - 10); } return {}; }, r: 'Il quitte le quartier. Le doute reste.' },
    { t: 'Lui faire passer un message', h: 'Violent', fx: { crime: 5, reputation: 6 }, out: [{ p: 0.6, r: 'Il a compris. Plus personne ne parle.' }, { p: 1, fx: { recherche: 2, motif: 'Violences en bande' }, r: 'Il porte plainte. Ton nom est dans le dossier.' }] },
    { t: 'Ne rien faire', fx: (s) => { if (s.reseau) s.reseau.chaleur = Math.min(100, s.reseau.chaleur + 25); return {}; }, r: 'Les infos continuent de fuiter.' },
  ] },
];
