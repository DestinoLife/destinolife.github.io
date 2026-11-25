// Banque d'événements V3 : petite enfance variée, étapes scolaires, addictions, maladies, confiance,
// amours d'ado, pays en crise, foot international, politique (jusqu'à président ou dictateur).
import { rnd, pick } from '../engine/rng.js';

const st = (s, k) => s.stats[k];
const job = (s, id) => s.carriere?.id === id;
const lvl = (s) => s.carriere?.niveau ?? -1;
const fr = (s) => s.id.statut === 'ne_france' || s.id.statut === 'naturalise';
const partner = (s) => s.relations.find((r) => r.vivant && (r.lien === 'partenaire' || r.lien === 'conjoint'));
const conf = (s, r) => r?.conf ?? 50;
const best = (s) => s.relations.filter((r) => r.vivant && r.lien === 'ami').sort((a, b) => b.rel - a.rel)[0];
const scandal = (s) => s.justice.casier.length > 0 || s.sale > 20000 || s.flags.ripou || st(s, 'crime') > 30;
const elec = (s, bonus = 0) => 0.25 + st(s, 'charisme') / 250 + st(s, 'notoriete') / 400 + (s.flags.soutien_politique ? 0.1 : 0) + bonus;

export const EVENTS3 = [
  // ================= PETITE ENFANCE (début de partie plus varié) =================
  { id: 'premier_mot', cat: 'Enfance', age: [0, 1], once: 1, avec: 'parents', txt: 'Dans ton berceau, tu babilles devant tes parents émerveillés. Tout à coup, un premier vrai mot sort.', ch: [
    { t: 'Dire « Maman »', fx: { rel: { lien: 'mere', d: 10 }, bonheur: 4 }, r: 'Ta mère a les larmes aux yeux. Elle appelle toute la famille.' },
    { t: 'Dire « Papa »', fx: { rel: { lien: 'pere', d: 10 }, bonheur: 4 }, r: 'Ton père bombe le torse de fierté pendant une semaine.' },
    { t: 'Éclater de rire sans rien dire', fx: { charisme: 3, bonheur: 5 }, r: 'Ton rire contagieux fait fondre toute la pièce.' },
  ] },
  { id: 'berceuse_pays', cat: 'Racines', age: [0, 2], once: 1, cond: (s) => s.id.statut === 'au_pays', avec: 'parents', txt: 'Le soir tombe sur {pays}. Depuis la fenêtre ouverte montent les voix du quartier, les épices et une berceuse que ta mère fredonne.', ch: [
    { t: 'T’endormir contre elle', fx: { bonheur: 5, rel: { lien: 'mere', d: 8 }, sante: 2 }, r: 'Tu garderas cette mélodie en toi toute ta vie.' },
    { t: 'Regarder les lumières dehors', fx: { intel: 2, art: 2, bonheur: 3 }, r: 'Déjà curieux{|se} du grand monde qui t’entoure.' },
  ] },
  { id: 'fete_pays', cat: 'Racines', age: [3, 9], once: 1, cond: (s) => s.id.statut === 'au_pays', avec: 'parents', txt: 'Grande fête familiale à {pays} : cousins partout, musique jusqu’à minuit, plats qui débordent de la table.', ch: [
    { t: 'Danser au milieu du cercle', fx: { charisme: 4, bonheur: 6, art: 2 }, r: 'Tout le monde tape dans ses mains. Tu es la star de la soirée.' },
    { t: 'Écouter les histoires des anciens', fx: { intel: 4, karma: 3 }, r: 'Tu découvres d’où vient ta famille et les rêves qu’elle porte.' },
  ] },
  { id: 'doudou_perdu', cat: 'Enfance', age: [1, 3], once: 1, w: 0.8, avec: 'parents', txt: 'Drame absolu : ton doudou préféré a disparu avant l’heure de dormir.', ch: [
    { t: 'Pleurer jusqu’à ce qu’on retourne tout', fx: { bonheur: -2, rel: { lien: 'parents', d: -2 } }, out: [{ p: 0.7, fx: { bonheur: 6 }, r: 'Retrouvé sous le canapé ! Nuit paisible.' }, { p: 1, fx: { bonheur: -4 }, r: 'Introuvable. Ta mère t’en achète un neuf le lendemain.' }] },
    { t: 'Faire le grand et dormir sans', fx: { karma: 2, charisme: 2, bonheur: 2 }, r: 'Tes parents sont bluffés par ton calme.' },
  ] },
  { id: 'premiers_pas', cat: 'Enfance', age: [0, 1], once: 1, avec: 'parents', txt: 'Tu te lèves en t’accrochant au canapé. Tout le salon retient son souffle.', ch: [
    { t: 'Faire tes premiers pas', fx: { forme: 3, bonheur: 4 }, r: 'Trois pas, puis tu tombes dans les bras de ta mère. Ovation.' },
    { t: 'Te rasseoir et réclamer à manger', fx: { bonheur: 2 }, r: 'Chaque chose en son temps.' },
  ] },
  { id: 'petit_frere', cat: 'Famille', age: [1, 6], once: 1, w: 0.7, avec: 'parents', pre: (s) => (s.tmp.bb = pick(['Nael', 'Lina', 'Sami', 'Jade', 'Ilyan', 'Maya'])), txt: 'Tes parents rentrent de la maternité avec un bébé : {bb}. Tout le monde ne regarde que lui.', ch: [
    { t: 'Lui faire un bisou', fx: { karma: 3, addRel: { lien: 'fratrie', age: 0 } }, r: 'Tu deviens le plus protecteur des grands frères et sœurs.' },
    { t: 'Faire une crise de jalousie', fx: { bonheur: -4, addRel: { lien: 'fratrie', age: 0 } }, r: 'Tu caches sa tétine. Personne n’est dupe.' },
  ] },
  { id: 'demenagement_enfance', cat: 'Famille', age: [2, 9], once: 1, w: 0.5, txt: 'Tes parents annoncent qu’on déménage dans un autre quartier. Tu vas tout quitter.', ch: [
    { t: 'Pleurer tout le trajet', fx: { bonheur: -5 }, r: 'Les premières semaines sont dures.' },
    { t: 'Voir ça comme une aventure', fx: { charisme: 3, addRel: { lien: 'ami' } }, r: 'Dès la première semaine, tu te fais un nouveau pote.' },
  ] },
  { id: 'nounou', cat: 'Enfance', age: [1, 4], once: 1, w: 0.6, txt: 'Tes parents travaillent tard. Tu passes tes journées chez une nounou qui ne parle que de foot.', ch: [
    { t: 'Taper dans le ballon avec elle', fx: { forme: 4, flag: 'club_foot' }, r: 'À trois ans, tu jongles déjà.' },
    { t: 'Dessiner dans ton coin', fx: { art: 4 }, r: 'Elle affiche tes dessins sur son frigo.' },
  ] },
  { id: 'papa_licencie', cat: 'Famille', age: [3, 14], once: 1, w: 0.4, cond: (s) => s.relations.some((r) => r.vivant && r.lien === 'pere'), avec: 'parents', txt: 'Ton père vient de perdre son travail. L’ambiance à la maison est lourde.', ch: [
    { t: 'Lui faire un dessin pour le consoler', fx: { karma: 4, rel: { lien: 'pere', d: 10 } }, r: 'Il le garde dans son portefeuille pendant des années.' },
    { t: 'Faire comme si de rien n’était', fx: { bonheur: -3 }, r: 'Tu entends tes parents parler d’argent tard le soir.' },
  ] },
  { id: 'meilleur_ami', cat: 'Amitié', age: [5, 10], once: 1, pre: (s) => (s.tmp.bf = pick(['Ilyes', 'Lucas', 'Moussa', 'Emma', 'Nour', 'Tiago', 'Minh', 'Sofia'])), txt: 'À l’école, {bf} te propose d’être ton meilleur ami pour la vie. Il faut faire un pacte.', ch: [
    { t: 'Pacte de sang (avec un feutre rouge)', fx: (s) => ({ addRel: { lien: 'ami', prenom: s.tmp.bf, rel: 90 }, bonheur: 6 }), r: 'Meilleurs amis pour la vie. Qui sait ce que {bf} deviendra…' },
    { t: 'Dire que t’as déjà un meilleur ami', fx: { charisme: -1 }, r: '{bf} part bouder.' },
  ] },

  // ================= ÉCOLE : primaire, collège, lycée =================
  { id: 'cm2_passage', cat: 'École', age: [10, 11], once: 1, cond: (s) => s.etudes.cursus === 'ecole', txt: 'Dernier jour de CM2. Le collège, c’est l’an prochain. Tout le monde est un peu stressé.', ch: [
    { t: 'Promettre à tes potes de rester ensemble', fx: { rel: { lien: 'ami', d: 10 } }, r: 'Vous signez vos t-shirts au feutre.' },
    { t: 'Avoir hâte d’être grand', fx: { bonheur: 3 }, r: 'Fini les cours de récré pour petits.' },
  ] },
  { id: 'college_rentree', cat: 'Collège', age: [11, 12], once: 1, cond: (s) => s.etudes.cursus === 'ecole', txt: 'Rentrée en 6e. Les 3e ont l’air immenses et ils te regardent de haut.', ch: [
    { t: 'Rester avec ceux de ton ancienne école', fx: { bonheur: 3 }, r: 'Sécurité.' },
    { t: 'Te faire remarquer', out: [{ p: 0.5, fx: { reputation: 6, charisme: 3 }, r: 'Tout le collège connaît ton prénom en une semaine.' }, { p: 1, fx: { bonheur: -5 }, r: 'Tu finis la tête dans les toilettes.' }] },
  ] },
  { id: 'joint_college', cat: 'Collège', age: [13, 16], once: 1, txt: 'Derrière le gymnase, des grands font tourner un joint. Ils te le tendent : « Vas-y, t’es pas un bébé. »', ch: [
    { t: 'Tirer dessus', h: 'Addiction ▲', fx: { use: 'cannabis', reputation: 4, intel: -1 }, out: [{ p: 0.7, r: 'Tu tousses, tu rigoles pour rien. Ils te font une place.' }, { p: 1, fx: { rel: { lien: 'parents', d: -12 } }, r: 'Un surveillant vous surprend. Tes parents sont convoqués.' }] },
    { t: 'Refuser', fx: { karma: 2, reputation: -2 }, r: '« T’es pas drôle. » Tant pis.' },
    { t: 'Leur en acheter pour revendre', h: 'Crime ▲', fx: { crime: 4, money: 60, use: 'cannabis' }, r: 'Ton premier « business ». Tu te sens important.' },
  ] },
  { id: 'couple_ado', cat: 'Amour', age: [13, 17], cond: (s) => !partner(s), pre: (s) => { const gr = s.id.attirance === 'hf' ? pick(['h', 'f']) : s.id.attirance || (s.id.genre === 'f' ? 'h' : 'f'); s.tmp.cg = gr; s.tmp.crush2 = pick(gr === 'f' ? ['Lina', 'Jade', 'Sarah', 'Inès', 'Chloé', 'Aminata'] : ['Rayan', 'Lucas', 'Adam', 'Moussa', 'Enzo', 'Yanis']); },
    txt: '{crush2}, de ta classe, t’a envoyé un message à 23 h : « T’es réveillé{e} ? » 👀', ch: [
    { t: 'Lui proposer de sortir ensemble', out: [{ p: (s) => 0.35 + st(s, 'apparence') / 220 + st(s, 'charisme') / 260, fx: (s) => ({ addRel: { lien: 'partenaire', prenom: s.tmp.crush2, genre: s.tmp.cg, age: s.age, rel: 80 }, bonheur: 12 }), r: 'Vous êtes ensemble. Tout le collège est au courant le lendemain.' }, { p: 1, fx: { bonheur: -6 }, r: '« Je te vois plutôt comme un ami… » Aïe.' }] },
    { t: 'Faire le mystérieux', fx: { charisme: 2 }, r: 'Tu laisses le message en vu. Stratégie.' },
  ] },
  { id: 'secher', cat: 'École', age: [12, 18], cond: (s) => ['ecole', 'lycee', 'cap'].includes(s.etudes.cursus), w: 0.8, txt: '{ami} propose de sécher l’après-midi pour aller au centre commercial.', ch: [
    { t: 'Sécher', fx: { bonheur: 5, intel: -2 }, out: [{ p: 0.7, r: 'Meilleur après-midi du mois.' }, { p: 1, fx: { rel: { lien: 'parents', d: -10 } }, r: 'L’école appelle tes parents. Tu es privé{e} de sortie.' }] },
    { t: 'Aller en cours', fx: { intel: 2 }, r: 'Le contrôle surprise était pour cet après-midi. Bien joué.' },
  ] },
  { id: 'decrochage', cat: 'Lycée', age: [16, 19], once: 1, cond: (s) => ['lycee', 'cap', 'fac'].includes(s.etudes.cursus) && st(s, 'intel') < 45, txt: 'Tu n’arrives plus à suivre. Tes notes chutent et tu ne vois plus l’intérêt.', ch: [
    { t: 'Décrocher et chercher du travail', fx: { etudes: { cursus: null, reste: null }, bonheur: 5 }, r: 'Tu quittes l’école. Liberté… et incertitude.' },
    { t: 'Prendre des cours de soutien', c: (s) => s.money >= 400 || s.chezParents, fx: { intel: 6, money: -200 }, r: 'Ça repart doucement.' },
    { t: 'T’accrocher seul{e}', out: [{ p: 0.5, fx: { intel: 4 }, r: 'Tu tiens bon.' }, { p: 1, fx: { bonheur: -6 }, r: 'Tu redoubles.' }] },
  ] },
  { id: 'fugue_action', forced: 1, major: 3, cat: 'Fugue', txt: 'Tu as fait ton sac en pleine nuit. Où est-ce que tu vas ?', ch: [
    { t: 'Chez {ami}', out: [{ p: 0.7, fx: { bonheur: 4, rel: { lien: 'ami', d: 10 }, confiance: { lien: 'ami', d: 10 } }, r: 'Trois jours chez {ami}. Ses parents finissent par appeler les tiens.', days: 3 }, { p: 1, r: '{ami} te dénonce à ses parents. Retour à la maison.', days: 1 }] },
    { t: 'Prendre un train au hasard', out: [{ p: 0.5, fx: { charisme: 3, bonheur: 3 }, r: 'Tu découvres une autre ville. La police te ramène une semaine plus tard.', days: 7 }, { p: 1, fx: { sante: -10, bonheur: -8 }, r: 'Tu dors dans une gare. Ça se passe mal.', days: 5 }] },
    { t: 'Faire demi-tour', fx: { rel: { lien: 'parents', d: 5 } }, r: 'Tu remets ton sac sous le lit avant que quelqu’un se réveille.' },
  ] },

  // ================= ADDICTIONS =================
  { id: 'manque', forced: 1, cat: 'Addiction', txt: 'Ça fait des semaines sans {manque}. Mains qui tremblent, nuits blanches, irritabilité.', ch: [
    { t: 'Replonger', fx: (s) => { const k = Object.entries(s.addic).sort((a, b) => b[1] - a[1])[0][0]; return { use: k, bonheur: 6 }; }, r: 'Le soulagement… puis la honte.' },
    { t: 'Tenir bon', fx: { bonheur: -8, karma: 3 }, out: [{ p: 0.55, fx: { cure: 'legere' }, r: 'Le plus dur est passé.' }, { p: 1, r: 'Tu tiens, mais chaque jour est un combat.' }] },
    { t: 'Entrer en cure (4 000 €)', c: (s) => s.money >= 4000, fx: { money: -4000, cure: 'lourde', bonheur: -3 }, r: 'Un mois en centre de désintoxication. Tu ressors plus fort{e}.', days: 30 },
  ] },
  { id: 'alcool_derive', forced: 1, cat: 'Addiction', avec: 'famille', txt: 'Tu t’es réveillé{e} sans aucun souvenir de la veille. Ton entourage s’inquiète sérieusement.', ch: [
    { t: 'Rejoindre les Alcooliques anonymes', fx: { cure: 'legere', karma: 3 }, r: 'Premier jour sans alcool. Tu le comptes.' },
    { t: 'Dire que tout va bien', fx: { use: 'alcool', confiance: { lien: 'partenaire', d: -15 } }, r: 'Personne ne te croit vraiment.' },
  ] },
  { id: 'soiree_coke', cat: 'Fête', age: [18, 60], w: (s) => (s.money > 50000 || s.carriere?.id === 'rappeur' ? 0.9 : 0.25), txt: 'Soirée privée. Sur la table basse, quelqu’un trace des lignes de cocaïne. Tout le monde y passe.', ch: [
    { t: 'Essayer', h: 'Addiction ▲▲', fx: { use: 'coke', bonheur: 8, sante: -4 }, r: 'Tu te sens invincible jusqu’au matin.' },
    { t: 'Refuser et partir', fx: { karma: 3 }, r: 'Tu rentres dormir. Sage décision.' },
  ] },
  { id: 'paris_sportifs', cat: 'Jeu', age: [18, 70], w: 0.6, sms: 'Appli de paris', txt: '100 € offerts pour ton premier pari ! Cote x8 sur le match de ce soir 🔥', ch: [
    { t: 'Parier', fx: { use: 'jeu' }, out: [{ p: 0.25, fx: { money: 800, bonheur: 6 }, r: 'Gagné ! Facile, non ?' }, { p: 1, fx: { money: -150 }, r: 'Perdu. La prochaine fois…' }] },
    { t: 'Supprimer l’appli', fx: { karma: 2 }, r: 'Bonne idée.' },
  ] },

  // ================= SANTÉ : symptômes avant la maladie =================
  { id: 'symptome', forced: 1, cat: 'Santé', txt: 'Depuis quelques semaines, tu remarques : {symptome}. Ça ne passe pas.', ch: [
    { t: 'Prendre rendez-vous chez le médecin', fx: { diagnostic: true, money: -25, lieu: 'hopital' }, r: 'Examens complets. Le diagnostic tombe, le traitement commence tout de suite.', days: 5 },
    { t: 'Ignorer, ça va passer', fx: { bonheur: -2 }, r: 'Tu préfères ne pas y penser…' },
    { t: 'Chercher sur Internet', fx: { bonheur: -5 }, r: 'Selon Internet, tu as douze maladies mortelles. Panique.' },
  ] },

  // ================= RELATIONS ET CONFIANCE =================
  { id: 'partenaire_soupcon', cat: 'Amour', cond: (s) => partner(s) && conf(s, partner(s)) < 40, avec: 'partenaire', txt: '{partenaire} fouille ton téléphone. « Tu me caches quelque chose, je le sens. »', ch: [
    { t: 'Tout lui montrer', fx: { confiance: { lien: 'partenaire', d: 15 } }, r: 'Rien à cacher. La confiance remonte.' },
    { t: 'Te mettre en colère', fx: { confiance: { lien: 'partenaire', d: -10 }, rel: { lien: 'partenaire', d: -10 } }, r: 'Grosse dispute. Une porte claque.' },
    { t: 'Avouer une erreur', out: [{ p: 0.5, fx: { confiance: { lien: 'partenaire', d: 10 }, rel: { lien: 'partenaire', d: -8 } }, r: 'C’est dur, mais tu as été honnête.' }, { p: 1, fx: { rupture: true }, r: 'C’en est trop. C’est fini.' }] },
  ] },
  { id: 'ami_secret', cat: 'Amitié', age: [10, 70], cond: (s) => !!best(s), pre: (s) => (s.tmp.bf2 = best(s).prenom), txt: '{bf2} te confie un secret très lourd et te demande de ne le dire à personne.', ch: [
    { t: 'Garder le secret', fx: { confiance: { lien: 'ami', d: 15 }, karma: 3 }, r: '{bf2} sait qu’il peut compter sur toi.' },
    { t: 'En parler à quelqu’un', fx: { confiance: { lien: 'ami', d: -30 }, rel: { lien: 'ami', d: -15 } }, r: 'Ça s’est su. {bf2} ne te regarde plus pareil.' },
  ] },
  { id: 'ami_aide', cat: 'Amitié', age: [18, 80], cond: (s) => best(s) && conf(s, best(s)) >= 65 && (s.money < 500 || s.logement === 'rue'), pre: (s) => (s.tmp.bf2 = best(s).prenom), txt: '{bf2} a appris que tu étais dans la galère. Il débarque sans prévenir : « Tu crois que j’allais te laisser ? »', ch: [
    { t: 'Accepter son aide', fx: { money: 2000, bonheur: 10, rel: { lien: 'ami', d: 10 } }, r: 'Un vrai ami. Tu ne l’oublieras jamais.' },
    { t: 'Refuser par fierté', fx: { confiance: { lien: 'ami', d: 5 } }, r: '« Comme tu veux, mais je reste là. »' },
  ] },
  { id: 'trahison_ami', cat: 'Amitié', age: [16, 70], w: 0.4, cond: (s) => best(s) && conf(s, best(s)) < 35, pre: (s) => (s.tmp.bf2 = best(s).prenom), txt: 'Tu découvres que {bf2} parle mal de toi derrière ton dos depuis des mois.', ch: [
    { t: 'Le confronter', fx: { rel: { lien: 'ami', d: -20 } }, r: 'Explications houleuses. L’amitié est abîmée.' },
    { t: 'Couper les ponts', fx: (s) => { const b = best(s); if (b) b.lien = 'ex'; return { bonheur: -4 }; }, r: 'Tu tournes la page.' },
  ] },

  // ================= MONDE =================
  { id: 'pays_crise', forced: 1, cat: 'Monde', sms: 'Famille au {pays}', pre: (s) => (s.tmp.sit = { crise: 'la crise économique', emeutes: 'les émeutes', guerre: 'la guerre' }[s.monde.pays[s.id.pays]] || 'la crise'),
    txt: 'Ici c’est très dur avec {sit}. Les prix explosent. Tu peux nous aider ?', ch: [
    { t: 'Envoyer 2 000 €', c: (s) => s.money >= 2000, fx: { money: -2000, karma: 8 }, r: 'Ta tante t’envoie une photo de toute la famille pour te remercier.' },
    { t: 'Les faire venir en France', c: (s) => s.money >= 15000 && s.age >= 21, fx: { money: -15000, karma: 12, addRel: { lien: 'fratrie' } }, r: 'Ton cousin arrive chez toi avec une valise et beaucoup d’espoir.' },
    { t: 'Ne pas pouvoir aider', fx: { bonheur: -6 }, r: 'Tu te sens impuissant{|e}.' },
  ] },
  { id: 'mercenaire', cat: 'Monde', age: [20, 45], w: 0.3, cond: (s) => Object.values(s.monde?.pays || {}).includes('guerre') && (job(s, 'legion') || st(s, 'crime') >= 40), txt: 'Une société militaire privée recrute pour une guerre à l’étranger. 25 000 € par mois.', ch: [
    { t: 'Signer', out: [{ p: 0.6, fx: { money: 150000, karma: -10, sante: -15 }, r: 'Six mois dans l’enfer. Tu reviens riche et changé{e}.', days: 180 }, { p: 0.85, fx: { sante: -45, blesse: true }, r: 'Blessé{e} au combat. Rapatriement sanitaire.', days: 90 }, { p: 1, fx: { mort: 'Tué{e} au combat' }, r: 'Tu ne reviendras pas.' }] },
    { t: 'Refuser', fx: { karma: 3 }, r: 'La guerre, ce n’est pas un business.' },
  ] },

  // ================= FOOT =================
  { id: 'selection_nationale', forced: 1, cat: 'Football', txt: 'Le sélectionneur national t’appelle : tu es convoqué{e} en équipe de France !', ch: [
    { t: 'Accepter avec fierté', fx: (s) => { s.foot.selections++; return { notoriete: 10, bonheur: 15 }; }, r: 'Hymne national, maillot bleu. Tes parents pleurent devant la télé.', next: 'coupe_du_monde' },
    { t: 'Choisir la sélection de ton pays d’origine', c: (s) => s.id.origine !== 'france', fx: (s) => { s.foot.selections++; return { notoriete: 8, bonheur: 12, karma: 3 }; }, r: 'Tout le {pays} est derrière toi.', next: 'coupe_du_monde' },
  ] },
  { id: 'coupe_du_monde', chain: 1, major: 30, cat: 'Coupe du monde', txt: 'Coupe du monde, demi-finale. 0-0 à la 88e minute. Tu as le ballon à 25 mètres.', ch: [
    { t: 'Frapper', out: [{ p: (s) => 0.3 + st(s, 'forme') / 300, fx: { notoriete: 25, bonheur: 20, money: 500000 }, r: 'LUCARNE. Ton pays est en finale. Ton nom est chanté partout.', days: 20 }, { p: 1, fx: { notoriete: -5, bonheur: -10 }, r: 'Au-dessus. Défaite aux tirs au but.', days: 20 }] },
    { t: 'Chercher la passe décisive', out: [{ p: 0.5, fx: { notoriete: 15, karma: 4 }, r: 'Ton coéquipier marque. Vous êtes en finale !', days: 20 }, { p: 1, fx: { bonheur: -6 }, r: 'Interception. Prolongations perdues.', days: 20 }] },
  ] },

  // ================= POLITIQUE =================
  { id: 'municipales', forced: 1, major: 30, cat: 'Élections municipales', txt: 'Tu te présentes aux municipales à {ville}. Un mois de campagne. Ta stratégie ?', ch: [
    { t: 'Porte-à-porte dans tous les quartiers', out: [{ p: (s) => elec(s, 0.1), fx: { job: 'politique', notoriete: 6 }, r: 'Élu{e} au conseil municipal !', days: 30 }, { p: 1, fx: { bonheur: -6 }, r: 'Battu{e} de quelques voix.', days: 30 }] },
    { t: 'Grosse campagne sur les réseaux (20 000 €)', c: (s) => s.money >= 20000, fx: { money: -20000 }, out: [{ p: (s) => elec(s, 0.2), fx: { job: 'politique', notoriete: 8 }, r: 'Élu{e} ! Ta campagne digitale a cartonné.', days: 30 }, { p: 1, fx: { bonheur: -6 }, r: 'Battu{e}. Beaucoup de likes, peu de votes.', days: 30 }] },
    { t: 'Acheter des voix', h: 'Risqué', fx: { karma: -8, money: -10000 }, out: [{ p: 0.6, fx: { job: 'politique', sale: 0 }, r: 'Élu{e}. Personne ne pose de questions… pour l’instant.', days: 30 }, { p: 1, fx: { arrest: { motif: 'Fraude électorale', peine: [1, 3] } }, r: 'Un assesseur a tout filmé.', days: 30 }] },
  ] },
  { id: 'elections_suivantes', cat: 'Politique', cond: (s) => job(s, 'politique') && lvl(s) < 3 && !s.flags.mandat_recent, major: 30,
    pre: (s) => (s.tmp.poste = ['les municipales pour devenir maire', 'les législatives pour devenir député', 'un poste au gouvernement'][Math.max(0, lvl(s))]), txt: 'Ton parti te propose de te lancer : {poste}.', ch: [
    { t: 'Faire campagne', out: [{ p: (s) => elec(s), fx: { jobLvl: 1, notoriete: 8, bonheur: 10 }, r: 'Victoire ! Tu montes d’un échelon.', days: 30 }, { p: 1, fx: { bonheur: -8 }, r: 'Défaite. Il faudra attendre la prochaine fois.', days: 30 }] },
    { t: 'Attendre ton heure', r: 'La politique, c’est aussi la patience.' },
  ] },
  { id: 'matignon', cat: 'Politique', once: 1, cond: (s) => job(s, 'politique') && lvl(s) === 3, txt: 'Le président t’appelle un dimanche soir : il veut te nommer Premier ministre.', ch: [
    { t: 'Accepter', fx: { jobLvl: 1, notoriete: 15, sante: -5 }, r: 'Tu entres à Matignon. Les journées font 18 heures.' },
    { t: 'Refuser pour viser l’Élysée', fx: { charisme: 3 }, r: 'Tu préserves ton image pour la présidentielle.' },
  ] },
  { id: 'presidentielle', cat: 'Présidentielle', once: 1, major: 60, cond: (s) => job(s, 'politique') && lvl(s) >= 3 && fr(s) && s.age >= 35, txt: 'Élection présidentielle. Les sondages te placent au second tour. Débat télévisé ce soir face à ton adversaire.', ch: [
    { t: 'Rester calme et présidentiel', out: [{ p: (s) => elec(s, 0.05) + (s.traits.includes('calme') ? 0.1 : 0), fx: { job: 'politique', jobLvl: 5, notoriete: 30, bonheur: 25, lieu: 'palais' }, r: 'Tu es élu{e} président{|e} de la République !', days: 60 }, { p: 1, fx: { bonheur: -15 }, r: 'Défaite au second tour. 48,7 %. Si proche.', days: 60 }] },
    { t: 'L’attaquer sur ses scandales', out: [{ p: (s) => elec(s, -0.05) + st(s, 'charisme') / 400, fx: { job: 'politique', jobLvl: 5, notoriete: 30, bonheur: 25, lieu: 'palais' }, r: 'Coup de grâce en direct. Tu es élu{e} président{|e} !', days: 60 }, { p: 1, fx: { notoriete: -10, bonheur: -15 }, r: 'Ça se retourne contre toi. Défaite.', days: 60 }] },
  ] },
  { id: 'scandale_politique', cat: 'Politique', cond: (s) => job(s, 'politique') && scandal(s), txt: 'Un journal publie une enquête sur ton passé : casier, argent liquide, fréquentations douteuses.', ch: [
    { t: 'Tout nier en bloc', out: [{ p: 0.5, fx: { notoriete: -5 }, r: 'L’affaire s’essouffle.' }, { p: 1, fx: { jobLvl: -1, notoriete: -15 }, r: 'De nouvelles preuves sortent. Tu perds ton poste.' }] },
    { t: 'Démissionner avec dignité', fx: { job: null, karma: 5 }, r: 'Tu quittes la vie politique.' },
    { t: 'Faire pression sur le journal', fx: { karma: -8 }, out: [{ p: 0.4, r: 'L’article est retiré.' }, { p: 1, fx: { arrest: { motif: 'Abus de pouvoir', peine: [1, 4] } }, r: 'L’affaire devient une affaire d’État.' }] },
  ] },
  { id: 'crise_nationale', cat: 'Présidence', major: 7, cond: (s) => job(s, 'politique') && lvl(s) >= 4, txt: 'Grève générale, manifestations massives. Le pays est bloqué. Tout le monde attend ta décision.', ch: [
    { t: 'Ouvrir le dialogue', fx: { karma: 6, notoriete: 4 }, out: [{ p: 0.6, r: 'Accord trouvé. Ta popularité remonte.', days: 7 }, { p: 1, fx: { notoriete: -6 }, r: 'Les négociations échouent. Le pays reste bloqué.', days: 7 }] },
    { t: 'Passer en force', fx: { karma: -6 }, out: [{ p: 0.5, fx: { notoriete: 3 }, r: 'Le mouvement s’essouffle.', days: 7 }, { p: 1, fx: { notoriete: -15 }, r: 'Émeutes. Ta popularité s’effondre.', days: 7 }] },
    { t: 'Dissoudre l’Assemblée', out: [{ p: 0.35, fx: { notoriete: 10 }, r: 'Pari gagné : majorité renforcée.', days: 30 }, { p: 1, fx: { jobLvl: -1, notoriete: -10 }, r: 'Pari perdu. Cohabitation humiliante.', days: 30 }] },
  ] },
  { id: 'coup_etat', cat: 'Zarkovie', once: 1, major: 3, cond: (s) => (s.expat?.pays === 'Zarkovie' || s.cavale?.pays === 'Zarkovie') && (s.money >= 2000000 || st(s, 'crime') >= 60 || job(s, 'legion')), txt: 'En Zarkovie, des généraux mécontents te proposent de financer un coup d’État. En échange : le pouvoir.', ch: [
    { t: 'Financer le coup (2 000 000 €)', c: (s) => s.money >= 2000000, fx: { money: -2000000, karma: -20 }, out: [{ p: 0.55, fx: { job: 'dictateur', notoriete: 40, lieu: 'palais' }, r: 'Le palais tombe en une nuit. Tu prends le pouvoir.', days: 3 }, { p: 0.85, fx: { sante: -30 }, r: 'Le coup échoue. Tu fuis le pays en hélicoptère.', days: 3 }, { p: 1, fx: { mort: 'Exécuté{e} après un coup d’État raté' }, r: 'Tu es arrêté{e} par la garde présidentielle.' }] },
    { t: 'Mener toi-même les troupes', c: (s) => job(s, 'legion') || st(s, 'crime') >= 60, fx: { karma: -15 }, out: [{ p: 0.45, fx: { job: 'dictateur', notoriete: 40, lieu: 'palais' }, r: 'Tu entres dans la capitale à la tête des chars. Le pays est à toi.', days: 3 }, { p: 1, fx: { mort: 'Tué{e} pendant le coup d’État' }, r: 'Les loyalistes résistent.' }] },
    { t: 'Refuser et quitter le pays', fx: { karma: 5 }, r: 'Trop dangereux. Tu prends le premier avion.' },
  ] },
  { id: 'dictature', cat: 'Régime', cond: (s) => job(s, 'dictateur'), txt: 'Ton peuple gronde. Des manifestants exigent des élections libres devant le palais.', ch: [
    { t: 'Organiser des élections libres', fx: { karma: 20, job: null }, out: [{ p: 0.4, fx: { notoriete: 10 }, r: 'Tu perds, mais tu entres dans l’histoire comme celui qui a rendu le pouvoir.' }, { p: 1, fx: { arrest: { motif: 'Crimes contre la population', peine: [5, 15] } }, r: 'Le nouveau régime te juge pour tes crimes.' }] },
    { t: 'Réprimer', fx: { karma: -20, jobLvl: 1 }, out: [{ p: 0.7, r: 'Le silence revient. Les sanctions internationales tombent.' }, { p: 1, fx: { mort: 'Renversé{e} et tué{e} par la foule' }, r: 'L’armée change de camp.' }] },
    { t: 'Fuir avec le trésor national', fx: { money: 20000000, cavaleFin: true, job: null, recherche: 5, motif: 'Détournement de fonds publics' }, r: 'Un jet privé t’attend. Tu deviens l’homme le plus recherché du monde.' },
  ] },
];
