// Événements v0.9 « Tentations » : chaque métier a ses tentations illégales (argent facile, gros risques),
// et de nouveaux événements du quotidien pour que deux vies se ressemblent moins.
import { rnd, chance } from '../engine/rng.js';
import { CAREERS } from './careers.js';

const cat = (s) => (s.carriere ? CAREERS[s.carriere.id].cat : null);
const job = (s, ...ids) => !!s.carriere && ids.includes(s.carriere.id);
const libre = (s) => s.justice.prison === 0 && !s.cavale;
const adulte = (s) => s.age >= 18 && libre(s);

export const EVENTS6 = [
  // ================= Tentations selon le métier =================
  { id: 'label_louche', cat: 'Musique', age: [17, 45], once: 1, w: 1.4, cond: (s) => cat(s) === 'artiste' && s.stats.notoriete >= 20 && libre(s),
    txt: 'Un label sorti de nulle part t’offre 150 000 € d’avance. Tout le monde sait qui finance : des gros du trafic qui veulent blanchir.', ch: [
    { t: 'Signer', h: 'Argent ▲▲ · risque', fx: { money: 150000, crime: 4, flag: 'label_louche', notoriete: 4 }, r: 'Studio de luxe, clips à Dubaï. Tu ne poses pas de questions.' },
    { t: 'Refuser poliment', fx: { karma: 3 }, r: 'Tu restes indépendant{e}. Moins d’argent, plus de sommeil.' },
  ] },
  { id: 'label_saisie', cat: 'Justice', w: 1.5, cond: (s) => s.flags.label_louche && libre(s) && chance(0.5),
    txt: 'Coup de filet chez ton label : les patrons sont mis en examen pour blanchiment. Les enquêteurs veulent t’entendre.', ch: [
    { t: 'Coopérer avec la justice', fx: { money: -80000, unflag: 'label_louche', notoriete: -8 }, r: 'Tu rends une partie de l’avance. Ton nom est sali, mais tu restes libre.' },
    { t: 'Te taire', out: [{ p: 0.5, fx: { unflag: 'label_louche', reputation: 10 }, r: 'Faute de preuves, tu n’es pas inquiété{e}.' }, { p: 1, fx: { unflag: 'label_louche', arrest: { motif: 'Blanchiment d’argent', peine: [1, 4] } }, r: 'Les virements parlent pour toi.' }] },
  ] },
  { id: 'feat_caid', cat: 'Musique', age: [16, 45], w: 1, cond: (s) => job(s, 'rappeur') && libre(s),
    txt: 'Le caïd le plus connu de ta ville veut un feat avec toi. Il paie bien et son nom fait vendre.', ch: [
    { t: 'Faire le feat', h: 'Notoriété ▲ · police', fx: { notoriete: 8, reputation: 10, money: 20000, sale: 20000 }, out: [{ p: 0.7, r: 'Le son cartonne dans les quartiers.' }, { p: 1, fx: { recherche: 1, motif: 'Association de malfaiteurs' }, r: 'Les stups écoutent le son… et regardent qui est dans le clip.' }] },
    { t: 'Refuser', out: [{ p: 0.7, fx: { reputation: -4 }, r: 'Il le prend mal, mais il laisse tomber.' }, { p: 1, fx: { sante: -15 }, r: 'Ses gars te le font payer à la sortie du studio.' }] },
  ] },
  { id: 'clip_armes', cat: 'Musique', age: [16, 40], w: 0.9, cond: (s) => job(s, 'rappeur') && libre(s),
    txt: 'Ton réalisateur veut de vraies armes dans le clip. « Ça fait plus vrai, frère. »', ch: [
    { t: 'Vraies armes', h: 'Buzz ▲ · risque', out: [{ p: 0.6, fx: { notoriete: 7 }, r: 'Le clip choque, et donc il buzze.' }, { p: 1, fx: { notoriete: 4, arrest: { motif: 'Détention d’armes', peine: [0, 2] } }, r: 'La police débarque sur le tournage.' }] },
    { t: 'Répliques en plastique', fx: { notoriete: 2 }, r: 'Personne ne voit la différence, sauf toi.' },
  ] },
  { id: 'paris_truques', cat: 'Sport', age: [17, 38], w: 1.3, cond: (s) => cat(s) === 'sport' && libre(s),
    txt: 'Un parieur te propose 200 000 € en liquide pour « rater » un match bien précis.', ch: [
    { t: 'Accepter', h: 'Argent ▲▲ · carrière en jeu', fx: { money: 200000, sale: 200000, karma: -8, crime: 4 }, out: [{ p: 0.7, r: 'Le match se passe comme prévu. Personne ne remarque rien.' }, { p: 1, fx: { job: null, arrest: { motif: 'Corruption sportive', peine: [1, 3] }, notoriete: -20 }, r: 'Les paris suspects ont été repérés. Suspendu à vie.' }] },
    { t: 'Refuser', fx: { karma: 3 }, r: 'Tu joues pour gagner. Point.' },
    { t: 'Le dénoncer à ta fédération', fx: { karma: 6, notoriete: 4, reputation: -6 }, r: 'Tu es salué publiquement. Dans le milieu, on te traite de balance.' },
  ] },
  { id: 'dopage', cat: 'Sport', age: [17, 38], w: 1, cond: (s) => cat(s) === 'sport' && libre(s),
    txt: 'Ton préparateur physique a un produit « indétectable ». Les autres en prennent tous, dit-il.', ch: [
    { t: 'Essayer', h: 'Performance ▲ · contrôle', fx: { forme: 10, perf: 15, sante: -5 }, out: [{ p: 0.65, r: 'Tu voles sur le terrain. Ton corps paiera plus tard.' }, { p: 1, fx: { jobLvl: -1, notoriete: -15, bonheur: -15 }, r: 'Contrôle positif. Deux ans de suspension, et ton nom dans tous les journaux.' }] },
    { t: 'Rester clean', fx: { karma: 2 }, r: 'Tu restes propre. Plus lent, peut-être. Fier, sûrement.' },
  ] },
  { id: 'caisse_detournee', cat: 'Travail', age: [16, 64], w: 0.9, cond: (s) => cat(s) === 'classique' && libre(s),
    txt: 'Tu as compris comment la caisse et les stocks sont mal contrôlés. Personne ne verrait si quelques billets disparaissaient.', ch: [
    { t: 'Te servir', h: 'Argent ▲ · licenciement', fx: (s) => ({ money: rnd(2000, 9000), karma: -5, crime: 3 }), out: [{ p: 0.75, r: 'Personne ne remarque rien. Pour l’instant.' }, { p: 1, fx: { job: null, arrest: { motif: 'Abus de confiance', peine: [0, 1] } }, r: 'Les caméras t’ont filmé{e}. Licenciement et plainte.' }] },
    { t: 'Ne rien faire', fx: { karma: 2 }, r: 'Ce n’est pas ton genre.' },
    { t: 'Prévenir ton chef', fx: { perf: 10, karma: 2 }, r: 'Ton chef apprécie. Ça comptera pour ta promotion.' },
  ] },
  { id: 'deal_entourage', cat: 'Rue', age: [15, 35], w: 1, cond: (s) => !s.reseau && cat(s) !== 'crime' && libre(s) && s.money < 15000,
    txt: '{ami} revend un peu de shit à la fac et au taf. « Tu prends 30 %, c’est sans risque. »', ch: [
    { t: 'Essayer', h: 'Argent ▲ · premier pas', fx: { money: 2500, sale: 2500, crime: 6, flag: 'petit_dealer' }, out: [{ p: 0.8, r: 'Facile. Trop facile.' }, { p: 1, fx: { arrest: { motif: 'Usage et revente de stupéfiants', peine: [0, 1] } }, r: 'Contrôle de police avec les sachets sur toi.' }] },
    { t: 'Non merci', r: 'Tu laisses {ami} à ses affaires.' },
  ] },
  { id: 'grossiste_propose', cat: 'Rue', age: [16, 40], once: 1, w: 1.6, cond: (s) => s.flags.petit_dealer && !s.reseau && cat(s) !== 'crime' && libre(s),
    txt: 'Un grossiste a entendu parler de toi. Il te propose de gérer un point de deal entier. « Tu vas gagner en un mois ce que tu gagnes en un an. »', ch: [
    { t: 'Entrer dans le réseau', h: 'Vie illégale', fx: { job: 'reseau', crime: 8, reputation: 6 }, r: 'Tu changes de monde. Les règles ne sont plus les mêmes.' },
    { t: 'Arrêter là', fx: { unflag: 'petit_dealer', karma: 3 }, r: 'Tu coupes les ponts. Il vaut mieux.' },
  ] },
  { id: 'corruption_flic', cat: 'Police', age: [20, 64], w: 1.3, cond: (s) => job(s, 'police') && libre(s),
    txt: 'Un caïd te glisse une enveloppe : 5 000 € par mois si ta brigade « oublie » son quartier.', ch: [
    { t: 'Accepter', h: 'Argent ▲▲ · IGPN', fx: { money: 60000, sale: 60000, karma: -8, crime: 6 }, out: [{ p: 0.65, r: 'Tu fermes les yeux. Ton compte se remplit.' }, { p: 1, fx: { job: null, arrest: { motif: 'Corruption passive', peine: [2, 5] } }, r: 'L’IGPN avait des écoutes. Tu es révoqué{e} et poursuivi{e}.' }] },
    { t: 'Refuser', fx: { karma: 2 }, r: 'Tu rends l’enveloppe sans un mot.' },
    { t: 'Le piéger et l’arrêter', out: [{ p: 0.6, fx: { perf: 25, notoriete: 5 }, r: 'Flagrant délit de corruption. Belle affaire pour ta carrière.' }, { p: 1, fx: { perf: 10, sante: -20 }, r: 'Tu l’arrêtes, mais ses hommes te retrouvent un soir.' }] },
  ] },
  { id: 'ordonnances', cat: 'Médecine', age: [26, 70], w: 1, cond: (s) => job(s, 'medecin', 'infirmier') && libre(s),
    txt: 'Un « patient » te propose 500 € par fausse ordonnance d’opioïdes. Il en veut beaucoup.', ch: [
    { t: 'Accepter', h: 'Argent ▲ · radiation', fx: { money: 40000, sale: 40000, karma: -10, crime: 5 }, out: [{ p: 0.65, r: 'L’argent tombe. Ta conscience, moins.' }, { p: 1, fx: { job: null, arrest: { motif: 'Trafic de médicaments', peine: [1, 4] } }, r: 'La Sécu repère tes prescriptions. Radiation et procès.' }] },
    { t: 'Refuser et le signaler', fx: { karma: 4 }, r: 'Tu préviens l’ordre des médecins.' },
  ] },
  { id: 'avocat_telephones', cat: 'Justice', age: [25, 70], w: 1, cond: (s) => job(s, 'avocat') && libre(s),
    txt: 'Un client détenu te propose 20 000 € pour faire entrer deux téléphones au parloir.', ch: [
    { t: 'Accepter', fx: { money: 20000, sale: 20000, crime: 4, karma: -5 }, out: [{ p: 0.75, r: 'Personne ne fouille un avocat. Pour cette fois.' }, { p: 1, fx: { job: null, arrest: { motif: 'Remise d’objets illicites à un détenu', peine: [0, 2] } }, r: 'Fouille surprise. Radié{e} du barreau.' }] },
    { t: 'Refuser', fx: { karma: 2 }, r: 'Tu es avocat, pas coursier.' },
  ] },
  { id: 'fraude_tva', cat: 'Business', age: [22, 70], w: 1.1, cond: (s) => (cat(s) === 'business' || s.business.length > 0) && libre(s) && !s.flags.fraude_tva,
    txt: 'Un « consultant » te propose un carrousel de TVA : des sociétés écrans, des factures bidon, et 250 000 € de bénéfice.', ch: [
    { t: 'Monter le carrousel', h: 'Argent ▲▲ · fraude', fx: { money: 250000, sale: 250000, crime: 8, karma: -8, flag: 'fraude_tva' }, out: [{ p: 0.6, r: 'Les sociétés écrans disparaissent avant le contrôle. Parfait.' }, { p: 1, fx: { arrest: { motif: 'Fraude fiscale en bande organisée', peine: [2, 6] } }, r: 'Tracfin avait repéré les flux depuis le début.' }] },
    { t: 'Refuser', fx: { karma: 3 }, r: 'Tu préfères gagner moins, mais légalement.' },
  ] },
  { id: 'braquage_propose', cat: 'Rue', age: [18, 45], w: 0.8, cond: (s) => adulte(s) && s.money < 3000 && s.stats.crime >= 10,
    txt: 'Ton cousin prépare l’attaque d’un fourgon blindé. Il lui manque un chauffeur. Ta part : 120 000 €.', ch: [
    { t: 'Faire le chauffeur', h: 'Très risqué', fx: { crime: 10 }, out: [
      { p: 0.4, fx: { money: 120000, sale: 120000, reputation: 15 }, r: 'Ça passe. Tu n’as jamais eu autant d’argent entre les mains.' },
      { p: 0.85, fx: { arrest: { motif: 'Vol à main armée en bande organisée', peine: [6, 14] } }, r: 'Le GIGN attendait au bout de la route.' },
      { p: 1, fx: { sante: -40, recherche: 3, motif: 'Vol à main armée' }, r: 'Échange de tirs. Tu t’enfuis, blessé{e}.' } ] },
    { t: 'Refuser', r: 'Trois semaines plus tard, ton cousin est arrêté. Tu as bien fait.' },
  ] },
  { id: 'colis_louche', cat: 'Travail', age: [16, 60], w: 1, cond: (s) => job(s, 'livreur') && libre(s),
    txt: 'Un client te propose 300 € par trajet pour livrer des colis « sans poser de questions ».', ch: [
    { t: 'Accepter', fx: { money: 2400, sale: 2400, crime: 4 }, out: [{ p: 0.8, r: 'Quelques allers-retours bien payés.' }, { p: 1, fx: { arrest: { motif: 'Transport de stupéfiants', peine: [1, 3] } }, r: 'Contrôle routier. Le chien renifle le colis.' }] },
    { t: 'Refuser', r: 'Tu livres des burgers, pas autre chose.' },
  ] },
  { id: 'faux_projet_crypto', cat: 'Argent', age: [18, 45], once: 1, w: 0.9, cond: (s) => adulte(s) && s.stats.charisme >= 55 && cat(s) !== 'crime',
    txt: 'Avec ton charisme, {ami} pense que tu pourrais vendre n’importe quoi. Son idée : lancer une fausse crypto et partir avec la caisse.', ch: [
    { t: 'Se lancer dans l’arnaque', h: 'Vie d’escroc', fx: { job: 'escroc', crime: 8, karma: -6 }, r: 'Site, influenceurs, promesses. Les premiers « investisseurs » arrivent.' },
    { t: 'Refuser', fx: { karma: 2 }, r: 'Tu préfères dormir tranquille.' },
  ] },

  // ================= Vie quotidienne : plus de variété =================
  { id: 'degat_des_eaux', cat: 'Logement', age: [18, 95], w: 0.8, cond: (s) => !s.chezParents && libre(s) && !['rue', 'bidonville'].includes(s.logement),
    txt: 'Le voisin du dessus a laissé couler sa baignoire. Ton plafond s’effondre sur ton salon.', ch: [
    { t: 'Passer par l’assurance', fx: { bonheur: -4, money: -300 }, r: 'Trois mois de paperasse, mais tout est remboursé.' },
    { t: 'Aller régler ça avec lui', out: [{ p: 0.6, fx: { money: 1500 }, r: 'Il s’excuse et paie de sa poche.' }, { p: 1, fx: { bonheur: -6, money: -2500 }, r: 'Ça tourne à l’embrouille. Tu paies les réparations.' }] },
  ] },
  { id: 'usurpation', cat: 'Argent', age: [18, 90], w: 0.7, cond: adulte,
    txt: 'Ta banque t’appelle : quelqu’un a ouvert trois crédits à ton nom.', ch: [
    { t: 'Porter plainte et tout bloquer', fx: { bonheur: -5, money: -500 }, r: 'Des semaines de démarches, mais ton nom est blanchi.' },
    { t: 'Laisser la banque gérer', out: [{ p: 0.5, r: 'La banque rembourse tout.' }, { p: 1, fx: { money: -6000 }, r: 'Faute de plainte, une partie reste à ta charge.' }] },
  ] },
  { id: 'faux_conseiller', cat: 'Argent', age: [25, 95], w: 0.7, cond: (s) => adulte(s) && s.money > 5000,
    txt: 'Un « conseiller de ta banque » t’appelle, paniqué : ton compte serait piraté, il faut valider un virement de sécurité.', ch: [
    { t: 'Suivre ses instructions', out: [{ p: 0.2, r: 'Tu raccroches au dernier moment, pris{e} d’un doute.' }, { p: 1, fx: (s) => ({ money: -Math.min(s.money, rnd(3000, 15000)), bonheur: -8 }), r: 'C’était une arnaque. L’argent est parti à l’étranger.' }] },
    { t: 'Raccrocher et appeler ta vraie banque', fx: { intel: 1 }, r: 'Ta banque confirme : c’était une arnaque.' },
  ] },
  { id: 'chien_trouve', cat: 'Vie', age: [10, 85], once: 1, w: 0.8, cond: libre,
    txt: 'Un chien errant te suit jusqu’en bas de chez toi. Il a l’air d’avoir faim.', ch: [
    { t: 'L’adopter', fx: { bonheur: 10, money: -900, forme: 2 }, r: 'Il s’appelle désormais Biscotte. Il ne te quitte plus.' },
    { t: 'L’amener à la SPA', fx: { karma: 2 }, r: 'Il trouvera une famille.' },
  ] },
  { id: 'burnout', cat: 'Santé', age: [22, 64], w: 0.8, cond: (s) => s.carriere && s.carriere.perf > 70 && libre(s),
    txt: 'Tu dors mal, tu oublies tout, tu pleures dans ta voiture. Ton médecin parle de burn-out.', ch: [
    { t: 'Arrêt maladie de trois mois', fx: { sante: 8, bonheur: 6, perf: -20 }, r: 'Tu te reposes. Ta carrière attendra.', days: 30 },
    { t: 'Serrer les dents', fx: { sante: -12, bonheur: -10 }, r: 'Tu tiens… mais à quel prix.' },
  ] },
  { id: 'jure_assises', cat: 'Justice', age: [23, 75], once: 1, w: 0.5, cond: adulte,
    txt: 'Tu es tiré{e} au sort pour être juré{e} à la cour d’assises. L’affaire : un meurtre dans ta ville.', ch: [
    { t: 'Juger en conscience', fx: { intel: 2, karma: 2 }, r: 'Trois semaines éprouvantes. Tu ne verras plus la justice pareil.' },
    { t: 'Chercher une excuse pour te faire dispenser', fx: { karma: -1 }, r: 'Ton médecin te fait un certificat. On en tire un autre.' },
  ] },
  { id: 'frere_dette', cat: 'Famille', age: [18, 80], w: 0.8, cond: (s) => adulte(s) && s.relations.some((r) => r.vivant && r.lien === 'fratrie') && s.money > 3000,
    pre: (s) => (s.tmp.frere = s.relations.find((r) => r.vivant && r.lien === 'fratrie').prenom),
    txt: '{frere} a des dettes de jeu. Des gens pas très sympathiques l’attendent devant chez lui. Il te supplie de l’aider.', ch: [
    { t: 'Payer sa dette (8 000 €)', c: (s) => s.money >= 8000, fx: { money: -8000, rel: { lien: 'fratrie', d: 12 } }, r: 'Il te jure que c’est la dernière fois.' },
    { t: 'Refuser', out: [{ p: 0.6, fx: { rel: { lien: 'fratrie', d: -15 } }, r: 'Il s’en sort seul, mais ne te parle plus.' }, { p: 1, fx: { rel: { lien: 'fratrie', d: -5 }, bonheur: -10 }, r: 'Il finit à l’hôpital. Tu culpabilises.' }] },
    { t: 'Aller voir ses créanciers', c: (s) => s.stats.reputation >= 30, fx: { reputation: 5 }, r: 'Ta réputation suffit. Ils effacent la dette.' },
  ] },
  { id: 'reunion_anciens', cat: 'Amis', age: [28, 70], once: 1, w: 0.6, cond: libre,
    txt: 'Soirée des anciens du lycée, vingt ans après. Certains ont réussi, d’autres pas du tout.', ch: [
    { t: 'Y aller et frimer', fx: { bonheur: 3, reputation: 2 }, r: 'Tu racontes ta vie en l’arrangeant un peu.' },
    { t: 'Y aller et être honnête', fx: { bonheur: 6, charisme: 1 }, r: 'Les vraies conversations sont les meilleures.' },
    { t: 'Ne pas y aller', r: 'Tu regardes les photos le lendemain.' },
  ] },
  { id: 'licenciement_eco', cat: 'Travail', age: [20, 63], w: 0.7, cond: (s) => cat(s) === 'classique' && libre(s) && (s.eco?.phase === 'recession' || s.eco?.phase === 'krach' || chance(0.3)),
    txt: 'Ton entreprise annonce un plan social. Ton poste est sur la liste.', ch: [
    { t: 'Accepter le départ avec indemnités', fx: (s) => ({ job: null, money: Math.round((s.carriere?.annees || 1) * 1800), bonheur: -8 }), r: 'Tu touches tes indemnités. Il faut retrouver du travail.' },
    { t: 'Te battre avec les syndicats', out: [{ p: 0.45, fx: { bonheur: 3 }, r: 'Ton poste est sauvé.' }, { p: 1, fx: (s) => ({ job: null, money: Math.round((s.carriere?.annees || 1) * 2500), bonheur: -10 }), r: 'Licencié{e} quand même, mais avec de meilleures indemnités.' }] },
  ] },
  { id: 'heritage_oncle', cat: 'Famille', age: [25, 85], once: 1, w: 0.35, cond: adulte,
    txt: 'Un notaire t’appelle : un grand-oncle que tu n’as jamais connu t’a laissé quelque chose.', ch: [
    { t: 'Accepter la succession', out: [{ p: 0.45, fx: (s) => ({ money: rnd(5000, 40000) }), r: 'Une petite somme, et un vieux service en porcelaine.' }, { p: 0.85, fx: (s) => ({ money: -rnd(3000, 12000) }), r: 'Surprise : il laisse surtout des dettes. Et tu les as acceptées.' }, { p: 1, fx: { money: 150000 }, r: 'Une maison en Bretagne, que tu revends aussitôt.' }] },
    { t: 'Refuser par prudence', r: 'Tu ne sauras jamais.' },
  ] },
  { id: 'accident_voiture', cat: 'Route', age: [18, 85], w: 0.7, cond: (s) => adulte(s) && s.biens.some((b) => ['citadine', 'compacte', 'suv', 'sportive', 'collection'].includes(b.id)),
    txt: 'Accrochage à un rond-point. L’autre conducteur hurle que c’est ta faute.', ch: [
    { t: 'Faire un constat', fx: { money: -800, bonheur: -2 }, r: 'Franchise de 800 €. Ton assurance augmente.' },
    { t: 'Partir sans rien dire', out: [{ p: 0.6, r: 'Personne n’a relevé ta plaque.' }, { p: 1, fx: { arrest: { motif: 'Délit de fuite', peine: [0, 0] }, money: -3000 }, r: 'Une caméra t’a filmé{e}. Amende et retrait de points.' }] },
  ] },
  { id: 'cambriolage_maison', cat: 'Logement', age: [18, 95], w: 0.6, cond: (s) => adulte(s) && !s.chezParents && (s.money > 30000 || s.biens.length > 0) && s.securite === 0,
    txt: 'En rentrant, la porte est fracturée. Ton appartement a été retourné.', ch: [
    { t: 'Porter plainte', fx: (s) => { const b = s.biens.find((x) => !['citadine', 'compacte', 'suv', 'sportive', 'collection'].includes(x.id)); if (b) s.biens = s.biens.filter((x) => x !== b); return { bonheur: -8, money: -1500 }; }, r: 'Bijoux et objets de valeur envolés. L’assurance rembourse peu.' },
    { t: 'Installer une alarme (2 500 €)', fx: { money: -2500, bonheur: -4 }, r: 'Plus jamais ça.' },
  ] },
];
