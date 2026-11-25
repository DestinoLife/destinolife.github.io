// Vérifie les montants d'impôts sur quelques profils types : node scripts/tax-check.mjs
import { createLife } from '../src/engine/core.js';
import { randomConfig } from '../src/engine/random.js';
import { fiscalite, migrate3, migrate } from '../src/engine/flow.js';

const mk = (fn) => {
  const s = createLife(randomConfig(), { age: 35 });
  migrate(s); migrate3(s);
  s.carriere = null; s.money = 0; s.biens = []; s.business = []; s.proprio = false; s.chezParents = false; s.logement = 'appart';
  s.relations = s.relations.filter((r) => !['conjoint', 'partenaire', 'enfant'].includes(r.lien));
  fn(s);
  return fiscalite(s);
};
const kid = (s) => s.relations.push({ id: 900 + s.relations.length, lien: 'enfant', vivant: true, age: 6, prenom: 'X' });
const show = (nom, z) => console.log(nom.padEnd(42), `total ${z.total.toLocaleString('fr-FR').padStart(12)} €`, `(revenu ${z.revenu}, sociétés ${z.societes}, foncière ${z.fonciere}, fortune ${z.fortune}, ${z.parts} part(s), ${z.regime})`);
show('Sans emploi', mk(() => {}));
show('Cadre 4 000 €/mois, célibataire', mk((s) => { s.pension = 4000; }));
show('Cadre 4 000 €/mois, marié, 2 enfants', mk((s) => { s.pension = 4000; s.relations.push({ id: 800, lien: 'conjoint', vivant: true, age: 35, prenom: 'Y' }); kid(s); kid(s); }));
show('Patron : 300 k€ de bénéfice', mk((s) => { s.business = [{ benef: 300000, valo: 900000 }]; }));
show('Millionnaire : villa + 3 M€ en banque', mk((s) => { s.money = 3000000; s.logement = 'villa'; s.proprio = true; }));
show('Millionnaire en optimisation', mk((s) => { s.money = 3000000; s.logement = 'villa'; s.proprio = true; s.flags.optimisation = true; }));
show('Millionnaire en exil fiscal', mk((s) => { s.money = 3000000; s.logement = 'villa'; s.proprio = true; s.flags.exil_fiscal = true; }));
