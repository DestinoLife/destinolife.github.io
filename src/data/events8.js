// Événements v0.11 « Banque & Immobilier » : déclenchés par le moteur bancaire (w: 0, jamais au hasard).
import { euros } from '../engine/rng.js';
import { dette, annuites, nomCourt } from '../engine/bank.js';

const bienLoue = (s) => s.biens.find((x) => x.uid === s.banque?.cibleLoc);

export const EVENTS8 = [
  {
    id: 'surendettement', cat: 'Banque', w: 0, major: 1,
    cond: (s) => (s.banque?.prets?.length ?? 0) > 0,
    txt: (s) => `Tes dettes t’étouffent : ${euros(dette(s))} à rembourser, ${euros(annuites(s))} d’échéances par an. Une conseillère de la Banque de France te reçoit et t’explique tes options.`,
    ch: [
      { t: 'Déposer un dossier de surendettement', h: 'Intérêts supprimés · fiché{e} 7 ans · train de vie modeste', fx: { surendettement: 'plan' }, r: 'Ton dossier est accepté. Les échéances deviennent supportables.' },
      { t: 'Demander un rétablissement personnel', h: 'Tout ce que tu possèdes est vendu · le reste est effacé', fx: { surendettement: 'faillite' }, r: 'La page est tournée. Il faudra repartir de zéro.' },
      { t: 'T’en sortir seul{e}', r: 'Tu serres les dents et promets de te serrer la ceinture.' },
    ],
  },
  {
    id: 'loc_impaye', cat: 'Immobilier', w: 0,
    cond: (s) => !!bienLoue(s)?.loc?.loc,
    pre: (s) => {
      const b = bienLoue(s);
      s.tmp.locataire = b.loc.loc;
      s.tmp.bienLoc = nomCourt(b);
      s.tmp.impaye = b.loc.impaye;
    },
    txt: '{locataire}, ton locataire ({bienLoc}), ne paie plus son loyer : {€impaye} d’impayés.',
    ch: [
      { t: 'Lancer une procédure', h: '1 500 € de frais · expulsion', c: (s) => s.money >= 1500, fx: { locImpaye: 'procedure' }, r: 'L’huissier est passé. Le dossier est clos.' },
      { t: 'Trouver un arrangement', h: 'Tu récupères 40 % · il reste', fx: { locImpaye: 'arrangement' }, r: 'Vous signez un échéancier. Ce n’est pas tout, mais c’est déjà ça.' },
      { t: 'Laisser courir', r: 'Tu espères que ça s’arrange tout seul.' },
    ],
  },
];
