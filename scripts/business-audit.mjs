// Audit v0.13 : pour chaque secteur, rentabilité moyenne de plusieurs stratégies sur 8 ans.
// Vérifie qu'aucune stratégie de prix ne gagne partout et que chaque secteur est viable bien géré.
import { createLife } from '../src/engine/core.js';
import { randomConfig } from '../src/engine/random.js';
import { migrate3 } from '../src/engine/life2.js';
import { migrate, createBusiness, businessAction, businessTick, BUSINESS } from '../src/engine/economy.js';

const N = Number(process.argv[2] || 120);
const SECT = ['resto', 'kebab', 'vetements', 'garage', 'salle', 'label', 'hotel', 'agence', 'boite', 'club'];
const STRATS = {
  bas: ['prix:bas'], moyen: [], haut: ['prix:haut'],
};
const EXTRA = {
  resto: { premium: ['sx:fourn:premium', 'sx:chef'], premium_haut: ['sx:fourn:premium', 'sx:chef', 'prix:haut'], discount: ['sx:fourn:grossiste'] },
  kebab: { gare: ['sx:empl:gare'], livraison: ['sx:livr'] },
  vetements: { grosse: ['sx:coll:grosse'], tendance: ['sx:style:tendance'] },
  garage: { gonfle: ['sx:devis:gonfle'] },
  salle: { coachs: ['sx:coach', 'sx:coach'] },
  label: { promo: ['sx:promo'], signe: [] },
  hotel: { booking: ['sx:booking'], renove: [] },
  agence: { negociateur: ['sx:neg'] },
  boite: { hiphop_sans_secu: ['sx:prog:hiphop', 'sx:secu:0'], dj: [] },
  club: { recrute: [] },
};
const res = {};
for (const t of SECT) {
  res[t] = {};
  const strats = { ...STRATS, ...EXTRA[t] };
  for (const [nom, acts] of Object.entries(strats)) {
    let tot = 0, faillites = 0;
    for (let i = 0; i < N; i++) {
      const s = migrate3(migrate(createLife(randomConfig(), { age: 30 })));
      s.money = 5e6; s.queue = []; s.stats.notoriete = 60; s.justice.prison = 0;
      createBusiness(s, t, 'Test');
      const b = s.business[0];
      const m0 = s.money;
      for (const a of acts) businessAction(s, b.uid, a);
      for (let y = 0; y < 8 && s.business.length; y++) {
        if (t === 'salle' && b.sx.equip < 40) businessAction(s, b.uid, 'sx:equip');
        if (t === 'resto' || t === 'kebab') if (b.sx.hyg < 45) businessAction(s, b.uid, 'sx:normes');
        if (nom === 'dj') businessAction(s, b.uid, 'sx:dj');
        if (nom === 'signe' && b.sx.art.length < 3) businessAction(s, b.uid, 'sx:signer');
        if (nom === 'renove' && b.sx.etat < 50) businessAction(s, b.uid, 'sx:renover');
        if (nom === 'recrute') businessAction(s, b.uid, 'sx:recruter');
        s.age++;
        businessTick(s);
        s.queue = [];
      }
      if (!s.business.length) faillites++;
      tot += s.money - m0 + (s.business[0] ? s.business[0].valo : 0);
    }
    res[t][nom] = { gain: Math.round(tot / N), faillite: Math.round((faillites / N) * 100) };
  }
}
const meilleursPrix = {};
for (const t of SECT) {
  const r = res[t];
  const best = Object.entries(r).sort((a, b) => b[1].gain - a[1].gain)[0];
  const bp = ['bas', 'moyen', 'haut'].sort((a, b) => r[b].gain - r[a].gain)[0];
  meilleursPrix[t] = bp;
  console.log(`${BUSINESS[t].nom.padEnd(22)} ${Object.entries(r).map(([k, v]) => `${k}: ${Math.round(v.gain / 1000)}k (${v.faillite}% faillite)`).join(' · ')}  → meilleure : ${best[0]}`);
}
const distincts = new Set(Object.values(meilleursPrix));
console.log(`Meilleure politique de prix par secteur : ${JSON.stringify(meilleursPrix)}`);
console.log(distincts.size >= 2 ? 'OK : aucune politique de prix ne domine tous les secteurs' : 'ALERTE : une politique de prix domine partout');
