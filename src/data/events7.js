// Événements v0.10 « Relations & Dynasties » : initiatives des proches (Living Stories) et choix d'ambition.
// Ils ne sortent jamais au hasard (w: 0) : le moteur des PNJ les déclenche à partir de faits simulés
// (licenciement, mariage, jalousie, dette, souvenirs) et leur attache une cible précise.
import { cibleEvenement, preparerEvenement } from '../engine/npc.js';
import { suggestions, nomAmbition } from '../engine/goals.js';
import { AMBITIONS } from './ambitions.js';

const pnj = (id, def) => ({ id, w: 0, cat: 'Proches', cond: (s) => !!cibleEvenement(s, id), pre: (s) => preparerEvenement(s, id), ...def });
const charisme = (base) => (s) => base + s.stats.charisme / 250;

export const EVENTS7 = [
  pnj('pnj_emploi', {
    cat: 'Carrière',
    txt: '{pnj}, {plien}, a très bien réussi : {pil} dirige aujourd’hui une entreprise. En apprenant que tu cherches du travail, {pil} te propose un poste de {poste}.',
    ch: [
      { t: 'Accepter', h: 'Emploi · {poste}', fx: { pnjEmbauche: 1, pnj: { rel: 6, souv: 'Tu as accepté son offre d’emploi quand tu étais au chômage.', w: 1 } }, r: 'Tu commences lundi. {pnj} te présente à l’équipe : « Pas de traitement de faveur, hein ! »' },
      { t: 'Refuser poliment', fx: { pnj: { rel: -2 } }, r: '{pnj} comprend. La porte reste ouverte.' },
      { t: 'Refuser : tu ne veux rien lui devoir', fx: { pnj: { rel: -8, ranc: 8, souv: 'Tu as refusé son aide avec mépris.', w: -1 } }, r: '{pnj} est vexé{pe}. Tu as gardé ta fierté, et perdu un peu d’amitié.' },
    ],
  }),
  pnj('pnj_pret', {
    txt: '{pnj} ({plien}) traverse une mauvaise passe et n’ose pas trop te le demander : {pil} aurait besoin de {€somme} pour s’en sortir.',
    ch: [
      { t: 'Lui prêter {€somme}', h: 'Il faudra attendre pour être remboursé', c: (s) => s.money >= s.tmp.somme, fx: { pnjSomme: -1, pnj: { rel: 6, dette: 1, souv: 'Tu lui as prêté de l’argent quand ça n’allait pas.', w: 2 } }, r: '« Je te rembourse dès que je peux, promis. »' },
      { t: 'Lui donner, sans rien attendre', h: 'Karma ▲', c: (s) => s.money >= s.tmp.somme, fx: { pnjSomme: -1, karma: 3, pnj: { rel: 12, adm: 10, souv: 'Tu lui as donné de l’argent sans rien attendre en retour.', w: 3 } }, r: '{pnj} a les larmes aux yeux. Ça, {pil} ne l’oubliera pas.' },
      { t: 'Refuser', fx: { pnj: { rel: -8, ranc: 10, souv: 'Tu as refusé de l’aider quand ça n’allait pas.', w: -1 } }, r: '{pnj} encaisse sans rien dire. Ça laissera des traces.' },
    ],
  }),
  pnj('pnj_retour', {
    txt: '{pnj} ({plien}) n’a jamais oublié ce que tu as fait pour {plui}. Aujourd’hui à l’aise, {pil} veut te rendre la pareille et t’offre {€somme}.',
    ch: [
      { t: 'Accepter', h: '+{€somme}', fx: { pnjSomme: 1, pnj: { retour: 1, rel: 5 } }, r: '« Sans toi, je n’en serais pas là. Prends, ça me fait plaisir. »' },
      { t: 'Refuser : c’était normal', h: 'Karma ▲', fx: { karma: 4, pnj: { retour: 1, rel: 10, adm: 10 } }, r: '{pnj} insiste, puis renonce. Ton geste n’en est que plus beau.' },
    ],
  }),
  pnj('pnj_mariage', {
    txt: '{pnj} ({plien}) se marie avec {pconj} ! Tu es invité{e} à la cérémonie.',
    ch: [
      { t: 'Y aller avec un beau cadeau', h: '300 €', c: (s) => s.money >= 300, fx: { money: -300, bonheur: 4, pnj: { rel: 10, souv: 'Tu étais là le jour de son mariage, avec un beau cadeau.', w: 2 } }, r: 'Belle cérémonie. {pnj} te serre fort dans ses bras.' },
      { t: 'Y aller', fx: { bonheur: 3, pnj: { rel: 5, souv: 'Tu étais là le jour de son mariage.', w: 1 } }, r: 'Tu danses jusqu’au bout de la nuit.' },
      { t: 'Trouver une excuse', fx: { pnj: { rel: -8, ranc: 8, souv: 'Tu n’es pas venu{e} à son mariage.', w: -1 } }, r: 'Les photos circulent. Ton absence a été remarquée.' },
    ],
  }),
  pnj('pnj_chomage', {
    txt: '{pnj} ({plien}) vient de perdre son emploi et le vit très mal.',
    ch: [
      { t: 'Être là pour {plui}', fx: { pnj: { rel: 6, conf: 6, souv: 'Tu as été là quand {pil} a perdu son emploi.', w: 1 } }, r: 'Vous parlez des heures. {pnj} se sent moins seul{pe}.' },
      { t: 'Activer ton réseau', h: 'Charisme', out: [
        { p: charisme(0.3), fx: { pnj: { emploi: 1, rel: 12, adm: 10, souv: 'Tu l’as aidé{pe} à retrouver du travail.', w: 3 } }, r: 'Grâce à toi, {pnj} décroche un entretien… et le poste.' },
        { p: 1, fx: { pnj: { rel: 3 } }, r: 'Tu passes quelques coups de fil, sans résultat. {pnj} apprécie quand même.' },
      ] },
      { t: 'L’embaucher dans ton entreprise', h: 'Relation ▲▲', hide: (s) => !s.business.length, c: (s) => s.business.length > 0, fx: { pnj: { emploi: 1, job: 'employé{pe} dans ton entreprise', rel: 15, adm: 12, souv: 'Tu l’as embauché{pe} dans ton entreprise.', w: 3 } }, r: '{pnj} rejoint ton équipe, gonflé{pe} à bloc.' },
      { t: 'Lui dire de se secouer', fx: { pnj: { rel: -6, ranc: 6, souv: 'Tu lui as fait la morale au pire moment.', w: -1 } }, r: '{pnj} raccroche, blessé{pe}.' },
    ],
  }),
  pnj('pnj_reconcil', {
    sms: '{pnj}',
    txt: 'Ça fait longtemps… Je repense souvent à nous. On pourrait se voir et tourner la page ?',
    ch: [
      { t: 'Accepter', fx: { bonheur: 5, pnj: { rancZero: 1, rel: 20, conf: 10, souv: 'Vous avez fait la paix.', w: 2 } }, r: 'Vous vous retrouvez autour d’un café. Les vieilles rancunes s’envolent.' },
      { t: 'Pas encore', fx: { pnj: { rel: -3 } }, r: 'Tu laisses le message sans réponse. Peut-être plus tard.' },
    ],
  }),
  pnj('pnj_jaloux', {
    txt: '{pnj} ({plien}) raconte à qui veut l’entendre que ta réussite « n’est pas très propre ». La jalousie, sans doute.',
    ch: [
      { t: 'Aller lui parler', h: 'Charisme', out: [
        { p: charisme(0.35), fx: { pnj: { jal: -40, rel: 6, jalouxDit: 1, souv: 'Tu es venu{e} lui parler franchement.', w: 1 } }, r: 'Vous crevez l’abcès. {pnj} finit par avouer qu’{pil} t’envie un peu.' },
        { p: 1, fx: { pnj: { rel: -8, ranc: 8, jalouxDit: 1 } }, r: 'Le ton monte. Ça n’a rien arrangé.' },
      ] },
      { t: 'Laisser dire', h: 'Karma ▲', fx: { karma: 1, pnj: { jal: -10, jalouxDit: 1 } }, r: 'Tu ne réponds pas. Les ragots finissent par s’essouffler.' },
      { t: 'Couper les ponts', fx: { pnj: { rel: -30, ranc: 15, jalouxDit: 1, souv: 'Tu as coupé les ponts.', w: -2 } }, r: 'Tu ne veux plus entendre parler de {plui}.' },
    ],
  }),
  pnj('pnj_mentor', {
    txt: '{pnj} ({plien}) t’admire beaucoup. {Pil} rêve de suivre ton exemple et te demande conseil pour se lancer.',
    ch: [
      { t: 'Prendre le temps de l’accompagner', h: 'Karma ▲ · relation ▲', fx: { bonheur: 3, karma: 2, pnj: { rel: 10, adm: 10, fort: 1, mentor: 1, souv: 'Tu l’as conseillé{pe} quand {pil} se lançait.', w: 2 } }, r: 'Tes conseils portent leurs fruits : {pnj} prend confiance.' },
      { t: 'Pas le temps', fx: { pnj: { adm: -20, mentor: 1 } }, r: '{pnj} est déçu{pe}, mais comprend.' },
    ],
  }),
  pnj('pnj_brouille', {
    txt: '{pnj} et {pnj2} se sont brouillés. Chacun attend que tu prennes son parti.',
    ch: [
      { t: 'Soutenir {pnj}', fx: { pnj: { rel: 8, souv: 'Tu as pris son parti face à {pnj2}.', w: 1 }, pnj2: { rel: -12, ranc: 12 } }, r: '{pnj} te remercie. {pnj2} ne te parle plus.' },
      { t: 'Soutenir {pnj2}', fx: { pnj2: { rel: 8 }, pnj: { rel: -12, ranc: 12, souv: 'Tu as pris le parti de {pnj2} contre {plui}.', w: -1 } }, r: '{pnj2} te remercie. {pnj} le prend mal.' },
      { t: 'Essayer de les réconcilier', h: 'Charisme', out: [
        { p: charisme(0.25), fx: { pnj: { rel: 5 }, pnj2: { rel: 5 }, pnjLien: 'amis' }, r: 'Autour d’un verre, tu les réconcilies. Bien joué.' },
        { p: 1, fx: { pnj: { rel: -2 }, pnj2: { rel: -2 } }, r: 'Ta tentative tombe à plat. Chacun campe sur ses positions.' },
      ] },
      { t: 'Rester neutre', fx: { pnj: { rel: -2 }, pnj2: { rel: -2 } }, r: 'Tu refuses de choisir. Personne n’est ravi, mais personne ne t’en veut.' },
    ],
  }),

  // ================= Ambitions de vie =================
  {
    id: 'ambition_choix', cat: 'Ambitions', w: 0,
    cond: (s) => (s.amb?.act?.length ?? 0) < 3 && suggestions(s).length > 0,
    pre: (s) => {
      const sug = suggestions(s);
      s.tmp.sug = sug.map((a) => a.id);
      s.tmp.sugNoms = sug.map((a) => nomAmbition(s, a));
      s.tmp.sugAides = sug.map((a) => AMBITIONS[a.id].aide || '');
    },
    txt: (s) => (s.age < 16 ? 'Tu commences à te demander ce que tu veux vraiment faire de ta vie.' : s.age < 30 ? 'Une nouvelle étape commence. Qu’est-ce qui compte vraiment pour toi ?' : s.age < 55 ? 'Le temps passe vite. Tu fais le point sur ce que tu veux encore accomplir.' : 'À ton âge, on sait ce qui compte. Il te reste une envie à réaliser.'),
    ch: [
      ...[0, 1, 2].map((i) => ({ t: (s) => s.tmp.sugNoms?.[i] || '', h: (s) => s.tmp.sugAides?.[i] || '', hide: (s) => !s.tmp.sug?.[i], fx: { ambition: i }, r: (s) => `C’est décidé : ${s.tmp.sugNoms?.[i] || ''}.` })),
      { t: 'Je verrai plus tard', r: 'Rien ne presse : tu peux choisir une ambition à tout moment dans ta fiche (onglet Vie).' },
    ],
  },
];
