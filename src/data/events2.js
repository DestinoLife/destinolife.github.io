// Banque d'événements V2 : enfance, prison, rue, millionnaire, réseau, voyages, cavale, rap, business, téléphone.
// Nouveaux champs : sms (l'événement arrive comme un message sur le téléphone), avec (proches affichés dans la scène).
import { rnd, pick } from '../engine/rng.js';

const P = (s) => s.justice.prison > 0;
const st = (s, k) => s.stats[k];
const rich = (s) => s.money >= 1000000;
const rue = (s) => s.logement === 'rue' && !s.chezParents;
const job = (s, id) => s.carriere?.id === id;
const kids = (s) => s.relations.filter((r) => r.vivant && r.lien === 'enfant');
const partner = (s) => s.relations.find((r) => r.vivant && (r.lien === 'partenaire' || r.lien === 'conjoint'));
const biz = (s, t) => s.business.find((b) => !t || b.type === t);
const gain = (a, b) => (s) => (s.tmp.x = rnd(a, b));

export const EVENTS2 = [
  // ================= ENFANCE =================
  { id: 'perdu_supermarche', cat: 'Enfance', age: [3, 7], once: 1, avec: 'parents', txt: 'Tu as lâché la main de ta mère au supermarché. Tu ne la vois plus nulle part.', ch: [
    { t: 'Pleurer très fort', fx: { bonheur: -3 }, r: 'Une vendeuse t’emmène à l’accueil. « Le petit {prenom} attend ses parents. »' },
    { t: 'La chercher tout{|e} seul{|e}', out: [{ p: 0.6, fx: { intel: 2, charisme: 1 }, r: 'Tu la retrouves au rayon fromage. Fierté.' }, { p: 1, fx: { bonheur: -6 }, r: 'Tu finis sur le parking. Grosse frayeur.' }] },
  ] },
  { id: 'animal', cat: 'Famille', age: [5, 13], once: 1, avec: 'parents', txt: 'Un chaton abandonné te suit jusqu’en bas de chez toi.', ch: [
    { t: 'Supplier tes parents de le garder', out: [{ p: 0.55, fx: { bonheur: 12, karma: 4, flag: 'chat' }, r: 'Ils cèdent. Tu l’appelles Tiger.' }, { p: 1, fx: { bonheur: -5 }, r: '« Non, et c’est non. »' }] },
    { t: 'L’amener à la SPA', fx: { karma: 5 }, r: 'Une famille l’adopte la semaine suivante.' },
  ] },
  { id: 'vitre_cassee', cat: 'Rue', age: [7, 13], txt: 'Ton tir au foot finit dans la vitre du voisin. Bruit de verre. Tout le monde s’enfuit.', ch: [
    { t: 'Aller t’excuser', fx: { karma: 5, money: -50 }, r: 'Il râle, mais il apprécie ton honnêteté.' },
    { t: 'Courir aussi', out: [{ p: 0.6, fx: { reputation: 3 }, r: 'Personne ne sait que c’était toi.' }, { p: 1, fx: { rel: { lien: 'parents', d: -10 } }, r: 'Le voisin a tout vu. Tes parents paient la vitre.' }] },
  ] },
  { id: 'triche_controle', cat: 'École', age: [8, 17], txt: 'Contrôle de maths. Ton voisin a les réponses sur un papier et te le tend.', ch: [
    { t: 'Copier', out: [{ p: 0.7, fx: { intel: -1, karma: -2 }, r: '18/20. Personne ne se doute de rien.' }, { p: 1, fx: { bonheur: -6, rel: { lien: 'parents', d: -6 } }, r: 'Le prof vous voit. Zéro et convocation.' }] },
    { t: 'Refuser', fx: { intel: 2, karma: 2 }, r: 'Tu galères, mais c’est ta note.' },
  ] },
  { id: 'classe_verte', cat: 'École', age: [8, 12], once: 1, txt: 'Classe verte à la montagne. Première fois loin de la maison.', ch: [
    { t: 'Faire le clown toute la semaine', fx: { charisme: 4, reputation: 3 }, r: 'Tu deviens la star de la classe.' },
    { t: 'Rester avec les profs', fx: { intel: 3 }, r: 'Tu apprends plein de trucs sur la nature.' },
    { t: 'Avoir le mal du pays', fx: { bonheur: -5 }, r: 'Tu appelles chez toi tous les soirs.' },
  ] },
  { id: 'velo_vole', cat: 'Rue', age: [8, 15], txt: 'Ton vélo a disparu devant le collège. Tu reconnais un grand du quartier dessus.', ch: [
    { t: 'Aller le récupérer', out: [{ p: (s) => 0.3 + st(s, 'forme') / 200, fx: { reputation: 8 }, r: 'Tu le récupères devant tout le monde. Respect.' }, { p: 1, fx: { sante: -6 }, r: 'Tu repars avec un œil au beurre noir.' }] },
    { t: 'Le dire à ton grand frère', c: (s) => s.relations.some((r) => r.lien === 'fratrie' && r.genre === 'h' && r.vivant), fx: { reputation: 4 }, r: 'Le vélo est devant ta porte le soir même.' },
    { t: 'Laisser tomber', fx: { bonheur: -4 }, r: 'Tu marcheras.' },
  ] },
  { id: 'grand_mere', cat: 'Famille', age: [6, 16], once: 1, txt: 'Ta grand-mère est à l’hôpital. Elle demande à te voir.', ch: [
    { t: 'Y aller chaque semaine', fx: { karma: 6, bonheur: -2 }, r: 'Elle te raconte sa jeunesse. Tu n’oublieras jamais.', days: 7 },
    { t: 'Trouver une excuse', fx: { karma: -3 }, r: 'Tu le regretteras plus tard.' },
  ] },
  { id: 'cantine', cat: 'École', age: [6, 11], txt: 'À la cantine, un plus petit se fait voler son dessert par une bande.', ch: [
    { t: 'Le défendre', out: [{ p: 0.6, fx: { karma: 5, reputation: 4 }, r: 'Ils reculent. Le petit devient ton ombre.' }, { p: 1, fx: { sante: -4, karma: 5 }, r: 'Tu prends pour lui. Mais tu as bien fait.' }] },
    { t: 'Regarder ailleurs', fx: { karma: -2 }, r: 'Ça te reste en travers de la gorge.' },
  ] },
  { id: 'telephone_vole_ado', cat: 'Rue', age: [12, 17], txt: 'On t’arrache ton téléphone à la sortie du métro.', ch: [
    { t: 'Courir après le voleur', out: [{ p: (s) => 0.25 + st(s, 'forme') / 200, fx: { reputation: 5 }, r: 'Tu le rattrapes. Il lâche le téléphone.' }, { p: 1, fx: { bonheur: -5 }, r: 'Disparu dans la foule.' }] },
    { t: 'Porter plainte', fx: { bonheur: -3 }, r: 'Le policier soupire. Tu ne le reverras jamais.' },
  ] },
  { id: 'job_ete', cat: 'Travail', age: [15, 18], once: 1, txt: 'L’été arrive. Un snack du quartier cherche quelqu’un pour deux mois.', ch: [
    { t: 'Accepter', fx: { money: 1800, charisme: 2, bonheur: -2 }, r: 'Premier vrai salaire. Tu sens la friture, mais t’es riche.' },
    { t: 'Profiter de l’été', fx: { bonheur: 8 }, r: 'Plage, potes, soleil.' },
  ] },
  { id: 'scooter', cat: 'Rue', age: [14, 18], once: 1, txt: '{ami} propose de te prêter son scooter, sans casque ni permis.', ch: [
    { t: 'Faire un tour', out: [{ p: 0.7, fx: { bonheur: 6, reputation: 3 }, r: 'Le vent, la vitesse. Grand moment.' }, { p: 0.85, fx: { casier: 'Conduite sans permis' }, r: 'Contrôle de police. Le scooter est saisi.' }, { p: 1, fx: { sante: -20 }, r: 'Chute dans un rond-point. Plâtre au bras.' }] },
    { t: 'Refuser', r: 'Tu le regardes partir.' },
  ] },
  { id: 'cyberharcelement', cat: 'Réseaux', age: [12, 17], once: 1, sms: 'Groupe « 3e B »', txt: 'Une photo truquée de toi tourne dans le groupe de la classe. Tout le monde rigole.', ch: [
    { t: 'Faire une capture et prévenir le CPE', fx: { karma: 3, bonheur: -3 }, r: 'Les responsables sont exclus. Ça calme tout le monde.' },
    { t: 'Répondre plus fort', fx: { reputation: 4, karma: -2 }, r: 'Ça part en guerre dans le groupe.' },
    { t: 'Quitter le groupe', fx: { bonheur: -6 }, r: 'Tu te sens seul{|e} pendant des semaines.' },
  ] },

  // ================= TÉLÉPHONE / MENACES =================
  { id: 'menace_sms', cat: 'Menace', age: [18, 90], w: (s) => (s.money > 300000 || s.reseau ? 1.2 : 0.1), sms: 'Numéro inconnu', pre: gain(20000, 80000),
    txt: 'On sait où tu dors. On sait où vont tes proches. Prépare {€x} en liquide. Pas de police.', avec: 'famille', ch: [
    { t: 'Payer', c: (s) => s.money >= s.tmp.x, fx: (s) => ({ money: -s.tmp.x, bonheur: -6 }), r: 'L’argent disparaît. Les messages aussi… pour l’instant.' },
    { t: 'Prévenir la police', fx: { karma: 3 }, out: [{ p: 0.7, r: 'Les menaces s’arrêtent. Un suspect est interpellé.' }, { p: 1, fx: { sante: -20 }, r: 'Ta voiture brûle la semaine suivante. Ils ont tenu parole.' }] },
    { t: 'Engager des gardes du corps', c: (s) => s.money >= 42000, fx: { securite: 1, money: -42000 }, r: 'Deux armoires à glace te suivent partout désormais.' },
    { t: 'Retrouver qui c’est', c: (s) => st(s, 'crime') >= 30 || s.reseau, out: [{ p: 0.6, fx: { reputation: 12, crime: 3 }, r: 'Tes gars l’ont trouvé. Il ne t’écrira plus jamais.' }, { p: 1, fx: { recherche: 1, motif: 'Violences' }, r: 'Ça finit en bagarre filmée. La police s’en mêle.' }] },
  ] },
  { id: 'ex_sms', cat: 'Amour', age: [18, 60], w: 0.5, cond: (s) => s.relations.some((r) => r.lien === 'ex' && r.vivant), pre: (s) => (s.tmp.ex = s.relations.find((r) => r.lien === 'ex' && r.vivant).prenom), sms: '{ex}',
    txt: 'Tu penses encore à nous ? Moi oui. On pourrait se voir, juste un verre ?', ch: [
    { t: 'Y aller', out: [{ p: 0.4, fx: { bonheur: 8 }, r: 'Les souvenirs remontent. Ça fait du bien.' }, { p: 1, fx: (s) => (partner(s) ? { rupture: true, bonheur: -10 } : { bonheur: -4 }), r: (s) => (partner(s) ? 'Ton couple a tout découvert. C’est fini.' : 'Mauvaise idée. Vous vous disputez comme avant.') }] },
    { t: 'Bloquer le numéro', fx: { bonheur: 2 }, r: 'Page tournée.' },
  ] },

  // ================= PRISON =================
  { id: 'prison_fouille', cat: 'Prison', where: 'prison', txt: 'Fouille surprise des cellules. Ton codétenu a caché un téléphone sous ton matelas.', ch: [
    { t: 'Dire que c’est à lui', out: [{ p: 0.6, fx: { reputation: -8 }, r: 'Il prend pour toi. Mais il ne te le pardonnera pas.' }, { p: 1, fx: { sante: -15 }, r: 'Il t’attend à la promenade.' }] },
    { t: 'Assumer à sa place', fx: { prisonAdd: 1, reputation: 12 }, r: 'Un an de plus. Mais tout le bâtiment te respecte.' },
  ] },
  { id: 'prison_mutinerie', cat: 'Prison', where: 'prison', major: 1, txt: 'Mutinerie dans ton bâtiment. Les détenus refusent de remonter de promenade.', ch: [
    { t: 'Mener la révolte', out: [{ p: 0.4, fx: { reputation: 15 }, r: 'Vous obtenez de meilleures conditions. Ton nom circule.' }, { p: 1, fx: { prisonAdd: 2, sante: -15 }, r: 'Les ERIS interviennent. Deux ans de plus.' }] },
    { t: 'Rester en retrait', fx: { karma: 2 }, r: 'Tu remontes en cellule sans faire de vagues.' },
  ] },
  { id: 'prison_codetenu', cat: 'Prison', where: 'prison', once: 1, txt: 'Ton codétenu ne mange plus et parle d’en finir.', ch: [
    { t: 'Lui parler toute la nuit', fx: { karma: 10, charisme: 3 }, r: 'Il tient le coup. Il te devra la vie.' },
    { t: 'Prévenir un surveillant', fx: { karma: 6, reputation: -3 }, r: 'Il est pris en charge.' },
    { t: 'Ce n’est pas ton problème', fx: { karma: -6 }, r: 'Le lendemain, la cellule est vide.' },
  ] },
  { id: 'prison_lettre', cat: 'Prison', where: 'prison', txt: 'Tu reçois une lettre d’un ancien ami du quartier. Il te propose un « job » à ta sortie.', ch: [
    { t: 'Garder le contact', fx: { crime: 3, contact: 'receleur' }, r: 'Un nouveau contact t’attend dehors.' },
    { t: 'Déchirer la lettre', fx: { karma: 4 }, r: 'Tu veux repartir de zéro.' },
  ] },
  { id: 'prison_amenagement', cat: 'Justice', where: 'prison', cond: (s) => s.justice.prison >= 2, txt: 'Ton avocat pense pouvoir obtenir un aménagement de peine : bracelet électronique.', ch: [
    { t: 'Monter le dossier (3 000 €)', c: (s) => s.money >= 3000, fx: { money: -3000 }, out: [{ p: (s) => 0.3 + st(s, 'karma') / 250, fx: (s) => ({ prisonAdd: -Math.max(1, s.justice.prison - 1) }), r: 'Accordé ! Tu finis ta peine avec un bracelet.' }, { p: 1, r: 'Refusé. Ton comportement ne plaide pas pour toi.' }] },
    { t: 'Faire ta peine', fx: { reputation: 4 }, r: 'Tu ne demandes rien à personne.' },
  ] },
  { id: 'prison_maton', cat: 'Prison', where: 'prison', txt: 'Un surveillant te propose de faire entrer ce que tu veux… contre 500 € par livraison.', ch: [
    { t: 'Monter un petit business en détention', out: [{ p: 0.65, fx: { money: 4000, crime: 4, reputation: 6 }, r: 'Téléphones, shit, cigarettes. Tu deviens le fournisseur du bâtiment.' }, { p: 1, fx: { prisonAdd: 2 }, r: 'L’administration découvre tout. Deux ans de plus.' }] },
    { t: 'Refuser', fx: { karma: 2 }, r: 'Tu restes propre.' },
  ] },
  { id: 'prison_transfert', cat: 'Prison', where: 'prison', w: 0.6, txt: 'On t’annonce un transfert vers une prison à 600 km. Loin de ta famille.', ch: [
    { t: 'Faire une demande de rapprochement', out: [{ p: 0.4, fx: { bonheur: 4 }, r: 'Demande acceptée. Tu restes près des tiens.' }, { p: 1, fx: { bonheur: -8 }, r: 'Refusée. Les parloirs vont se faire rares.' }] },
    { t: 'Faire une grève de la faim', fx: { sante: -15 }, out: [{ p: 0.5, r: 'Le transfert est annulé.' }, { p: 1, fx: { bonheur: -6 }, r: 'Rien n’y fait.' }] },
  ] },
  { id: 'prison_journaliste', cat: 'Prison', where: 'prison', once: 1, cond: (s) => st(s, 'notoriete') >= 30 || s.flags.braqueur, txt: 'Une journaliste veut faire un documentaire sur ton parcours.', ch: [
    { t: 'Tout raconter', fx: { notoriete: 15, karma: 3 }, r: 'Le doc cartonne. Ton histoire touche des millions de gens.' },
    { t: 'Refuser', r: 'Ton histoire t’appartient.' },
  ] },
  { id: 'prison_religion', cat: 'Prison', where: 'prison', once: 1, txt: 'L’aumônier passe dans ta coursive. Beaucoup de détenus trouvent la paix dans la foi.', ch: [
    { t: 'Lui parler', fx: { karma: 6, bonheur: 5 }, r: 'Tu trouves un peu de sérénité.' },
    { t: 'Pas pour toi', r: 'Chacun son chemin.' },
  ] },

  // ================= RUE / SDF =================
  { id: 'sdf_chien', cat: 'Rue', once: 1, cond: rue, txt: 'Un chien errant dort contre toi chaque nuit depuis une semaine.', ch: [
    { t: 'L’adopter', fx: { bonheur: 12, karma: 4, flag: 'chien' }, r: 'Il s’appelle Rocky. Tu n’es plus seul{|e}.' },
    { t: 'Le chasser', fx: { bonheur: -3 }, r: 'Il ne revient pas.' },
  ] },
  { id: 'sdf_maraude', cat: 'Rue', cond: rue, txt: 'La maraude passe. Une bénévole te propose de parler un peu.', ch: [
    { t: 'Accepter', fx: { bonheur: 5, sante: 3 }, r: 'Soupe chaude, sac de couchage neuf, et quelqu’un qui t’écoute.' },
    { t: 'Demander de l’aide pour tes papiers', fx: { intel: 2 }, out: [{ p: 0.5, fx: { logement: 'foyer' }, r: 'Elle t’obtient une place en foyer.' }, { p: 1, r: 'Elle prend ton dossier. Ça prendra du temps.' }] },
  ] },
  { id: 'sdf_boulot', cat: 'Rue', cond: rue, txt: 'Un patron de chantier cherche des bras pour la journée. 60 € au noir.', ch: [
    { t: 'Y aller', fx: { money: 60, forme: 2, sante: -2 }, r: 'Tu portes des sacs de ciment toute la journée.' },
    { t: 'Négocier 100 €', out: [{ p: 0.4, fx: { money: 100 }, r: 'Il accepte. Tu bosses bien.' }, { p: 1, r: 'Il prend quelqu’un d’autre.' }] },
  ] },
  { id: 'sdf_ancien_ami', cat: 'Rue', cond: rue, once: 1, txt: 'Un ancien camarade de classe te reconnaît dans la rue. Il a l’air gêné… puis il s’arrête.', ch: [
    { t: 'Accepter son aide', out: [{ p: 0.5, fx: { logement: 'hlm', bonheur: 15 }, r: 'Il te loge le temps de te refaire. Tu signes un bail trois mois plus tard.' }, { p: 1, fx: { money: 200, bonheur: 5 }, r: 'Il te glisse 200 € et son numéro.' }] },
    { t: 'Ta fierté t’en empêche', fx: { bonheur: -5 }, r: 'Tu détournes le regard.' },
  ] },
  { id: 'sdf_musique', cat: 'Rue', cond: (s) => rue(s) && st(s, 'art') >= 30, txt: 'Un passant filme ta musique dans le métro. La vidéo devient virale.', ch: [
    { t: 'Profiter du buzz', fx: { notoriete: 15, money: 1500, bonheur: 10 }, r: 'Un producteur t’écrit. Tout peut changer.' },
    { t: 'Rester discret{|e}', fx: { money: 300 }, r: 'Les gens te laissent plus de pièces.' },
  ] },

  // ================= MILLIONNAIRE =================
  { id: 'yacht', cat: 'Luxe', cond: rich, txt: 'Invitation sur un yacht à Saint-Tropez. Jet-set, champagne et contacts puissants.', ch: [
    { t: 'Y aller et réseauter', fx: { charisme: 3, notoriete: 4, contact: 'banquier', lieu: 'plage' }, r: 'Tu repars avec le numéro d’un banquier très… discret.', days: 3 },
    { t: 'Louer ton propre yacht (80 000 €)', fx: { money: -80000, bonheur: 15, notoriete: 6, lieu: 'plage' }, r: 'Tout le monde parle de ta soirée.', days: 5 },
    { t: 'Rester chez toi', r: 'Pas ton monde.' },
  ] },
  { id: 'faux_amis', cat: 'Argent', cond: (s) => s.money >= 300000, pre: gain(30000, 150000), txt: 'Depuis que t’as réussi, tout le monde est ton « frère ». Un cousin éloigné te demande {€x} pour « un projet ».', ch: [
    { t: 'Donner', fx: (s) => ({ money: -s.tmp.x, karma: 4 }), out: [{ p: 0.2, fx: (s) => ({ money: s.tmp.x * 2 }), r: 'Incroyable, son projet marche et il te rembourse double.' }, { p: 1, r: 'Tu n’entendras plus jamais parler de lui.' }] },
    { t: 'Refuser', fx: { rel: { lien: 'parents', d: -5 } }, r: 'La famille parle dans ton dos.' },
  ] },
  { id: 'paparazzi', cat: 'Luxe', cond: (s) => st(s, 'notoriete') >= 55, txt: 'Des paparazzi te prennent en photo en sortant d’une boîte, pas dans ton meilleur état.', ch: [
    { t: 'Leur arracher l’appareil', out: [{ p: 0.5, fx: { reputation: 5, notoriete: -3 }, r: 'Les photos ne sortiront pas.' }, { p: 1, fx: { casier: 'Violences', notoriete: -8 }, r: 'Ça finit en Une des journaux.' }] },
    { t: 'Sourire', fx: { notoriete: 4 }, r: 'La photo devient un mème. Ça te fait de la pub.' },
  ] },
  { id: 'jet_prive', cat: 'Luxe', cond: (s) => s.money >= 3000000, once: 1, txt: 'Ton conseiller te propose d’acheter un jet privé. 4 millions.', ch: [
    { t: 'L’acheter', fx: { money: -4000000, bonheur: 20, notoriete: 10, flag: 'jet' }, r: 'Paris–Dubaï en jet perso. La classe.' },
    { t: 'Louer à l’heure', fx: { money: -40000, bonheur: 6 }, r: 'Plus raisonnable.' },
  ] },
  { id: 'gala', cat: 'Luxe', cond: rich, txt: 'Gala de charité. On attend de toi un gros chèque devant les caméras.', ch: [
    { t: 'Donner 100 000 €', fx: { money: -100000, karma: 15, notoriete: 8 }, r: 'Une école portera ton nom.' },
    { t: 'Donner 5 000 € discrètement', fx: { money: -5000, karma: 6 }, r: 'Le geste compte.' },
    { t: 'Ne pas y aller', fx: { notoriete: -3 }, r: 'On te trouve radin{|e}.' },
  ] },
  { id: 'contrat_mariage', cat: 'Amour', cond: (s) => rich(s) && partner(s)?.lien === 'partenaire', avec: 'partenaire', txt: 'Ton avocat insiste : avant de te marier, il te faut un contrat. {partenaire} risque de mal le prendre.', ch: [
    { t: 'Imposer le contrat', fx: { rel: { lien: 'partenaire', d: -20 }, flag: 'contrat_mariage' }, r: 'Ambiance glaciale. Mais ton patrimoine est protégé.' },
    { t: 'Faire confiance', fx: { rel: { lien: 'partenaire', d: 10 } }, r: 'L’amour avant tout.' },
  ] },
  { id: 'placement_foireux', cat: 'Argent', cond: (s) => s.money >= 200000, w: 0.8, sms: 'Conseiller patrimonial', pre: (s) => (s.tmp.x = Math.round(s.money * 0.3)),
    txt: 'Opportunité exceptionnelle : un fonds immobilier à Dubaï, 25 % par an garanti. Il faut placer {€x} cette semaine.', ch: [
    { t: 'Investir', fx: (s) => ({ money: -s.tmp.x }), out: [{ p: 0.3, fx: (s) => ({ money: Math.round(s.tmp.x * 1.8) }), r: 'Ça marche vraiment. Tu doubles presque ta mise.' }, { p: 1, r: 'Le conseiller a disparu. C’était une pyramide de Ponzi.' }] },
    { t: 'Refuser', r: 'Trop beau pour être vrai.' },
  ] },
  { id: 'enfant_gate', cat: 'Famille', cond: (s) => rich(s) && kids(s).some((k) => k.age >= 14 && k.age <= 22), avec: 'enfant', pre: (s) => (s.tmp.kid = kids(s).find((k) => k.age >= 14 && k.age <= 22).prenom),
    txt: '{kid} a encastré la voiture de sport que tu lui as offerte. Et il y a une vidéo.', ch: [
    { t: 'Payer et étouffer l’affaire', fx: { money: -150000, karma: -4 }, r: 'Personne n’en parlera.' },
    { t: 'Le laisser assumer', fx: { karma: 5, notoriete: -4 }, r: 'Une leçon qu’il n’oubliera pas.' },
  ] },
  { id: 'accro_casino', forced: 1, cat: 'Casino', txt: 'Tu as perdu plus de 200 000 € au casino. Tu y penses jour et nuit. Tu caches tes relevés.', ch: [
    { t: 'Te faire interdire de casino', fx: { bonheur: -5, karma: 4, flag: 'interdit_casino' }, r: 'Tu signes l’interdiction volontaire. Dur, mais nécessaire.' },
    { t: 'Te refaire', fx: { flag: 'accro' }, r: 'La prochaine fois, c’est la bonne… n’est-ce pas ?' },
  ] },

  // ================= RÉSEAU =================
  { id: 'descente_reseau', forced: 1, major: 1, cat: 'Réseau', txt: 'Les stups ont démantelé un de tes points. Trois de tes vendeurs sont en garde à vue.', ch: [
    { t: 'Payer leurs avocats', fx: { money: -20000, reputation: 8 }, r: 'Tes gars ne parleront pas. Ils savent que tu tiens parole.' },
    { t: 'Les lâcher', out: [{ p: 0.5, fx: { reputation: -10 }, r: 'Ils se taisent quand même.' }, { p: 1, fx: { recherche: 2, motif: 'Trafic de stupéfiants' }, r: 'L’un d’eux balance ton nom.' }] },
    { t: 'Fermer le point et faire profil bas', fx: (s) => (s.reseau && (s.reseau.points = Math.max(1, s.reseau.points - 1), s.reseau.chaleur = 10), {}), r: 'Tu laisses la tempête passer.' },
  ] },
  { id: 'fournisseur_trahit', forced: 1, cat: 'Réseau', sms: 'Ton fournisseur', txt: 'Le dernier stock était coupé à mort et il manque 2 kilos. Il dit que « c’est pas lui ».', ch: [
    { t: 'Changer de fournisseur', fx: (s) => (s.reseau && (s.reseau.fournisseur = null), {}), r: 'Tu le supprimes de tes contacts. Il te faut quelqu’un d’autre.' },
    { t: 'Aller lui parler en personne', out: [{ p: 0.5, fx: { reputation: 10, money: 15000 }, r: 'Il rembourse. Avec des excuses.' }, { p: 1, fx: { sante: -30 }, r: 'Il t’attendait avec des amis.' }] },
    { t: 'Laisser passer', fx: { reputation: -6 }, r: 'Ça se sait dans le milieu.' },
  ] },
  { id: 'petit_vole', cat: 'Réseau', cond: (s) => !!s.reseau, txt: 'Un de tes vendeurs pique dans la caisse depuis des mois. Tout le monde attend ta réaction.', ch: [
    { t: 'Le virer', fx: { reputation: 3 }, r: 'Il dégage du quartier.' },
    { t: 'Lui laisser une chance', fx: { karma: 4, reputation: -5 }, r: 'Il te doit tout maintenant.' },
    { t: 'Faire un exemple', out: [{ p: 0.6, fx: { reputation: 12, karma: -10 }, r: 'Plus personne n’osera.' }, { p: 1, fx: { recherche: 1, motif: 'Séquestration', karma: -10 }, r: 'Sa mère porte plainte.' }] },
  ] },
  { id: 'mineur_arrete', cat: 'Réseau', cond: (s) => !!s.reseau, txt: 'Un guetteur de 14 ans s’est fait arrêter. Sa mère vient frapper à ta porte, en larmes.', ch: [
    { t: 'Lui donner de l’argent', fx: { money: -5000, karma: 3 }, r: 'Elle prend l’argent sans un mot.' },
    { t: 'Ne plus recruter de mineurs', fx: { karma: 8 }, r: 'Ça te coûte des guetteurs, mais tu dors mieux.' },
    { t: 'Fermer la porte', fx: { karma: -6 }, r: 'Le quartier te regarde différemment.' },
  ] },

  // ================= VOYAGES =================
  { id: 'voyage_rencontre', forced: 1, cat: 'Voyage', txt: 'Au bord de la piscine de l’hôtel, quelqu’un engage la conversation. Il ou elle vit ici depuis des années.', ch: [
    { t: 'Passer la soirée ensemble', fx: { bonheur: 8, charisme: 2 }, out: [{ p: 0.5, fx: { contact: true }, r: 'Une nouvelle connaissance utile.' }, { p: 1, fx: { addRel: { lien: 'ami' } }, r: 'Une amitié est née.' }] },
    { t: 'Rester entre vous', r: 'Tu profites du calme.' },
  ] },
  { id: 'voyage_galere', forced: 1, cat: 'Voyage', txt: 'Ta valise a été perdue et ton hôtel n’a aucune réservation à ton nom.', ch: [
    { t: 'Garder ton calme', fx: { bonheur: -3, intel: 1 }, r: 'Tout s’arrange en deux jours.' },
    { t: 'Prendre une suite de luxe (2 000 €)', c: (s) => s.money >= 2000, fx: { money: -2000, bonheur: 6 }, r: 'Finalement, c’est mieux comme ça.' },
  ] },
  { id: 'voyage_fete', forced: 1, cat: 'Voyage', txt: 'Soirée géante sur un rooftop. Tout le monde danse, les verres s’enchaînent.', ch: [
    { t: 'Faire la fête jusqu’au matin', out: [{ p: 0.75, fx: { bonheur: 10 }, r: 'Soirée de ta vie.' }, { p: 1, fx: { money: -800, sante: -5 }, r: 'Réveil sans portefeuille.' }] },
    { t: 'Rentrer tôt', fx: { sante: 2 }, r: 'Lever de soleil sur la ville le lendemain.' },
  ] },
  { id: 'voyage_coup', forced: 1, cat: 'Voyage', cond: (s) => s.age >= 18, txt: 'Un local te propose de rapporter « un petit colis » en France. 15 000 € à la clé.', ch: [
    { t: 'Accepter', out: [{ p: 0.6, fx: { money: 15000, crime: 5, sale: 15000 }, r: 'Douane passée. Les billets sont dans ta poche.' }, { p: 1, fx: { arrest: { motif: 'Importation de stupéfiants', peine: [3, 8] } }, r: 'Le chien des douanes s’assoit devant ta valise.' }] },
    { t: 'Refuser', fx: { karma: 3 }, r: 'Pas question de finir dans un reportage.' },
  ] },

  // ================= CAVALE =================
  { id: 'extradition', forced: 1, major: 2, cat: 'Cavale', txt: 'Interpol t’a localisé{e}. La police locale encercle ta planque.', ch: [
    { t: 'Te rendre', fx: (s) => ({ cavaleFin: true, arrest: { motif: (s.justice.motif || 'Mandat d’arrêt') + ' (extradé)', peine: [3, 8] } }), r: 'Extradé{e} vers la France, menottes aux poignets.' },
    { t: 'Fuir encore', out: [{ p: 0.45, fx: { money: -10000 }, r: 'Tu passes la frontière en pleine nuit. Encore une fois.' }, { p: 1, fx: (s) => ({ cavaleFin: true, arrest: { motif: (s.justice.motif || 'Mandat d’arrêt') + ' (extradé)', peine: [5, 10] } }), r: 'Plaqué{e} au sol à l’aéroport.' }] },
    { t: 'Payer les bonnes personnes (50 000 €)', c: (s) => s.money >= 50000, fx: { money: -50000 }, out: [{ p: 0.7, r: 'Le dossier disparaît. Tu es tranquille… pour un temps.' }, { p: 1, fx: (s) => ({ cavaleFin: true, arrest: { motif: 'Corruption et ' + (s.justice.motif || 'mandat d’arrêt').toLowerCase(), peine: [5, 10] } }), r: 'Le policier était infiltré.' }] },
  ] },
  { id: 'cavale_reconnu', cat: 'Cavale', cond: (s) => !!s.cavale, txt: 'Un touriste français te fixe au restaurant. Il prend discrètement une photo.', ch: [
    { t: 'Changer de planque immédiatement', fx: { money: -5000, bonheur: -4 }, r: 'Tu dors ailleurs dès ce soir.' },
    { t: 'Aller lui parler', out: [{ p: 0.5, r: 'Fausse alerte, il te prenait pour un acteur.' }, { p: 1, fx: { recherche: 1 }, r: 'Ta photo circule sur les réseaux.' }] },
  ] },
  { id: 'cavale_vie', cat: 'Cavale', cond: (s) => !!s.cavale, txt: 'La vie en exil commence à peser. Ta famille te manque et tu ne peux appeler personne.', avec: 'parents', ch: [
    { t: 'Appeler ta mère avec une puce jetable', out: [{ p: 0.7, fx: { bonheur: 10 }, r: 'Entendre sa voix te fait pleurer.' }, { p: 1, fx: { recherche: 1 }, r: 'La ligne était sur écoute.' }] },
    { t: 'Refaire ta vie ici', fx: { bonheur: 4, addRel: { lien: 'ami' } }, r: 'Tu te fais de nouveaux amis sous ton nouveau nom.' },
  ] },

  // ================= RAP =================
  { id: 'clip', chain: 1, cat: 'Clip', txt: 'Ton nouveau son est prêt. Il faut un clip. Où est-ce que tu tournes ?', ch: [
    { t: 'En bas de la cité avec tout le quartier', h: 'Gratuit', fx: { notoriete: 6, reputation: 8 }, r: 'Authentique. Le quartier est fier de toi.', days: 2 },
    { t: 'Dans le désert marocain', h: '25 000 €', c: (s) => s.money >= 25000, fx: { money: -25000, notoriete: 12 }, r: 'Images de folie. 5 millions de vues.', days: 6 },
    { t: 'À Dubaï, voitures de luxe et rooftop', h: '60 000 €', c: (s) => s.money >= 60000, fx: { money: -60000, notoriete: 16, lieu: 'villa' }, r: 'Le clip le plus vu de l’été.', days: 8 },
    { t: 'À Los Angeles avec un réalisateur américain', h: '150 000 €', c: (s) => s.money >= 150000, fx: { money: -150000, notoriete: 24 }, out: [{ p: 0.8, r: 'Tu passes dans une autre dimension. Les US te découvrent.' }, { p: 1, fx: { notoriete: -10 }, r: 'Clip trop lisse. Ton public te reproche de t’être vendu.' }], days: 10 },
    { t: 'Dans un studio avec un concept artistique', h: '8 000 €', c: (s) => s.money >= 8000, fx: { money: -8000, notoriete: 8, art: 4 }, r: 'Les critiques adorent.', days: 3 },
  ] },
  { id: 'featuring', cat: 'Musique', cond: (s) => job(s, 'rappeur') && s.carriere.niveau >= 1, txt: 'Un rappeur très connu te propose un featuring. Mais il veut 50 % des droits.', ch: [
    { t: 'Accepter', fx: { notoriete: 14 }, r: 'Le son explose. Ton nom est partout.' },
    { t: 'Négocier', out: [{ p: (s) => 0.3 + st(s, 'charisme') / 200, fx: { notoriete: 12, money: 30000 }, r: 'Il accepte 70/30. Respect.' }, { p: 1, r: 'Il se retire.' }] },
    { t: 'Refuser', fx: { reputation: 5 }, r: 'Tu veux réussir seul{|e}.' },
  ] },
  { id: 'album', cat: 'Musique', cond: (s) => job(s, 'rappeur'), w: 0.8, txt: 'Ton premier album est prêt. Comment tu le sors ?', ch: [
    { t: 'Grosse promo, plateaux télé', c: (s) => s.money >= 40000, fx: { money: -40000, notoriete: 15 }, out: [{ p: 0.6, fx: { money: 120000 }, r: 'Disque d’or en trois semaines !' }, { p: 1, r: 'Ventes correctes, sans plus.' }] },
    { t: 'Sortie surprise à minuit', fx: { notoriete: 10 }, out: [{ p: 0.5, fx: { notoriete: 8 }, r: 'Top 1 sur les plateformes au réveil.' }, { p: 1, r: 'Ça passe un peu inaperçu.' }] },
    { t: 'Le repousser, il n’est pas prêt', fx: { art: 4 }, r: 'Tu retournes en studio.' },
  ] },
  { id: 'manager_vole', cat: 'Musique', cond: (s) => job(s, 'rappeur') && s.carriere.niveau >= 2, once: 1, pre: gain(40000, 200000), txt: 'Ton comptable découvre que ton manager a détourné {€x}.', ch: [
    { t: 'Porter plainte', fx: (s) => ({ money: Math.round(s.tmp.x * 0.5) }), r: 'Procès gagné. Tu récupères la moitié.', days: 60 },
    { t: 'Régler ça à l’ancienne', out: [{ p: 0.6, fx: (s) => ({ money: s.tmp.x, reputation: 10 }), r: 'Il rend tout. Avec les intérêts.' }, { p: 1, fx: { arrest: { motif: 'Extorsion', peine: [1, 3] } }, r: 'Il a porté plainte contre toi.' }] },
  ] },
  { id: 'tournee', cat: 'Musique', major: 30, cond: (s) => job(s, 'rappeur') && s.carriere.niveau >= 2, txt: 'Ton tourneur propose 30 dates en France, Belgique, Suisse et au Maghreb.', ch: [
    { t: 'Partir en tournée', fx: { money: 180000, notoriete: 10, sante: -8, bonheur: 6 }, r: 'Salles pleines tous les soirs. Épuisant mais magique.', days: 45 },
    { t: 'Faire seulement les grosses dates', fx: { money: 70000, notoriete: 5 }, r: 'Tu gardes de l’énergie.', days: 15 },
  ] },

  // ================= BUSINESS =================
  { id: 'biz_employe', cat: 'Business', cond: (s) => s.business.some((b) => b.type !== 'startup'), pre: (s) => (s.tmp.biz = biz(s).nom), txt: 'Ton gérant de « {biz} » se sert dans la caisse. Les chiffres ne mentent pas.', ch: [
    { t: 'Le licencier', fx: { money: -3000 }, r: 'Indemnités payées, problème réglé.' },
    { t: 'Porter plainte', out: [{ p: 0.6, fx: { money: 8000 }, r: 'Il rembourse sous la pression.' }, { p: 1, r: 'Procédure interminable.' }] },
  ] },
  { id: 'biz_hygiene', cat: 'Business', cond: (s) => s.business.some((b) => b.type === 'resto' || b.type === 'kebab'), txt: 'Contrôle d’hygiène surprise dans ton restaurant.', ch: [
    { t: 'Ouvrir grand les portes', out: [{ p: 0.6, r: 'Tout est en règle.' }, { p: 1, fx: { money: -15000 }, r: 'Fermeture administrative d’une semaine. Amende salée.' }] },
    { t: 'Glisser une enveloppe', fx: { money: -2000, karma: -4 }, out: [{ p: 0.7, r: 'Le contrôleur ne voit rien.' }, { p: 1, fx: { casier: 'Tentative de corruption' }, r: 'Il était intègre.' }] },
  ] },
  { id: 'startup_rachat', cat: 'Business', cond: (s) => s.business.some((b) => b.type === 'startup' && b.users > 20000), pre: (s) => { const b = s.business.find((x) => x.type === 'startup' && x.users > 20000); s.tmp.biz = b.nom; s.tmp.x = Math.round(b.valo * 1.3); }, txt: 'Un géant de la tech veut racheter « {biz} » pour {€x}.', ch: [
    { t: 'Vendre', fx: (s) => { const b = s.business.find((x) => x.nom === s.tmp.biz); s.business = s.business.filter((x) => x !== b); return { money: s.tmp.x, bonheur: 15 }; }, r: 'Tu deviens multimillionnaire du jour au lendemain.' },
    { t: 'Refuser, viser la licorne', fx: { intel: 2 }, r: 'Pari risqué. Tu crois en ta boîte.' },
  ] },
  { id: 'vetements_collab', cat: 'Business', cond: (s) => s.business.some((b) => b.type === 'vetements') && st(s, 'notoriete') >= 30, txt: 'Un rappeur veut une collab avec ta marque de vêtements.', ch: [
    { t: 'Faire la collab', fx: (s) => { s.business.find((b) => b.type === 'vetements').rep += 20; return { notoriete: 5 }; }, r: 'Rupture de stock en 2 heures.' },
    { t: 'Garder ta marque indépendante', r: 'Ton identité d’abord.' },
  ] },

  // ================= VIE ADULTE (variété) =================
  { id: 'nouvelle_ville', forced: 1, cat: 'Nouvelle ville', txt: 'Premiers jours à {ville}. Nouveau quartier, nouvelles têtes. Comment tu t’intègres ?', ch: [
    { t: 'Sortir tous les soirs', fx: { addRel: { lien: 'ami' }, bonheur: 6, charisme: 2 }, r: 'Tu te fais vite une bande.' },
    { t: 'Te faire des contacts pro', fx: { contact: true, intel: 1 }, r: 'Un nouveau contact enregistré dans ton téléphone.' },
    { t: 'Rester discret{|e}', fx: { bonheur: -2 }, r: 'Tu prends tes marques doucement.' },
  ] },
  { id: 'voisin_aide', cat: 'Vie', age: [18, 90], w: 0.6, txt: 'Ta voisine âgée est tombée dans l’escalier. Personne ne l’aide.', ch: [
    { t: 'L’aider et appeler les secours', fx: { karma: 8 }, r: 'Elle te tricote une écharpe pour te remercier.' },
    { t: 'Passer ton chemin', fx: { karma: -5 }, r: 'Tu l’entends gémir derrière toi.' },
  ] },
  { id: 'portefeuille', cat: 'Vie', age: [10, 90], w: 0.6, pre: gain(200, 1500), txt: 'Tu trouves un portefeuille avec {€x} en liquide et une carte d’identité.', ch: [
    { t: 'Le rendre', fx: { karma: 8 }, out: [{ p: 0.3, fx: (s) => ({ money: Math.round(s.tmp.x / 4) }), r: 'Le propriétaire te donne une récompense.' }, { p: 1, r: 'Le propriétaire te remercie chaleureusement.' }] },
    { t: 'Garder l’argent', fx: (s) => ({ money: s.tmp.x, karma: -6 }), r: 'Personne n’en saura rien.' },
  ] },
  { id: 'soiree_famille', cat: 'Famille', age: [25, 80], cond: (s) => kids(s).length > 0 || !!partner(s), avec: 'famille', txt: 'Dimanche soir. Toute ta famille est réunie à table.', ch: [
    { t: 'Profiter du moment', fx: { bonheur: 8, rel: { lien: 'partenaire', d: 6 } }, r: 'Rires, plats qui débordent. Ces moments-là valent tout.' },
    { t: 'Rester sur ton téléphone', fx: { rel: { lien: 'partenaire', d: -6 }, bonheur: -2 }, r: 'On te fait la remarque.' },
  ] },
  { id: 'vacances_enfants', cat: 'Famille', cond: (s) => kids(s).some((k) => k.age < 14) && s.money >= 3000, avec: 'enfant', txt: 'Les enfants rêvent de vacances au soleil cet été.', ch: [
    { t: 'Les emmener (3 000 €)', fx: { money: -3000, bonheur: 12, lieu: 'plage' }, r: 'Châteaux de sable et glaces. Ils s’en souviendront toute leur vie.', days: 10 },
    { t: 'Promettre l’année prochaine', fx: { bonheur: -3 }, r: 'Leurs visages déçus te restent en tête.' },
  ] },
];
