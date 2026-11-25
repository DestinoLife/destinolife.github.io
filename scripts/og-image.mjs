// Génère l'image d'aperçu des liens (Discord, X, WhatsApp, Google) : public/og.png (1200×630)
// et l'icône iPhone public/apple-touch-icon.png. Lancer : npm run og
import { writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { sceneSVG } from '../src/render/scene.js';
import { avatarSVG } from '../src/render/avatar.js';
import { randomLook } from '../src/data/look.js';
import { logoMark } from '../src/ui/icons.js';

const W = 1200, H = 630;
const env = { tod: 'soir', meteo: 'soleil' };
const look = { ...randomLook('h', 'afrique_ouest'), coiffure: 'fade', barbe: 'trois', cheveuxC: '#0e0907', corpulence: 'normal', style: 'chic', acc: ['chaine'] };
const look2 = { ...randomLook('f', 'france'), coiffure: 'long', cheveuxC: '#5b3a22', corpulence: 'mince', style: 'casual', acc: [] };

const scene = `<svg x="0" y="0" width="${W}" height="${H}" viewBox="140 0 860 560" preserveAspectRatio="xMidYMax slice">
  ${sceneSVG('villa', env)}
  <g transform="translate(735 530) scale(.92)">${avatarSVG({ look: look2, genre: 'f', age: 27, outfit: 'casual' }, 'og2')}</g>
  <g transform="translate(880 534) scale(.98)">${avatarSVG({ look, genre: 'h', age: 30, outfit: 'chic' }, 'og1')}</g>
</svg>`;

const font = "Segoe UI, Arial, Helvetica, sans-serif";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0b0a12" stop-opacity=".95"/><stop offset=".45" stop-color="#0b0a12" stop-opacity=".78"/><stop offset=".7" stop-color="#0b0a12" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="title" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff6b8b"/><stop offset=".5" stop-color="#ff9f5a"/><stop offset="1" stop-color="#b59cff"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#1a1530"/>
  ${scene}
  <rect width="${W}" height="${H}" fill="url(#shade)"/>
  <g transform="translate(70 92)">${logoMark(96, 'oglogo').replace('<svg', '<svg x="0" y="0"')}</g>
  <text x="70" y="290" font-family="${font}" font-size="118" font-weight="800" fill="url(#title)" letter-spacing="4">DESTINO</text>
  <text x="74" y="352" font-family="${font}" font-size="38" font-weight="600" fill="#ffffff">Une vie. Des milliers de destins.</text>
  <text x="74" y="410" font-family="${font}" font-size="25" fill="#c9c2dc">Braqueur, rappeur, médecin, président ou SDF :</text>
  <text x="74" y="444" font-family="${font}" font-size="25" fill="#c9c2dc">chaque choix change ta vie… et ton décor.</text>
  <g font-family="${font}" font-size="21" font-weight="700">
    <rect x="72" y="498" width="150" height="46" rx="23" fill="#ffffff" fill-opacity=".12"/><text x="147" y="528" text-anchor="middle" fill="#fff">Gratuit</text>
    <rect x="236" y="498" width="178" height="46" rx="23" fill="#ffffff" fill-opacity=".12"/><text x="325" y="528" text-anchor="middle" fill="#fff">PC et mobile</text>
    <rect x="428" y="498" width="86" height="46" rx="23" fill="#ff5470" fill-opacity=".9"/><text x="471" y="528" text-anchor="middle" fill="#fff">18+</text>
  </g>
  <text x="74" y="596" font-family="${font}" font-size="20" fill="#8f87a8">destinolife.github.io</text>
</svg>`;

const png = new Resvg(svg, { fitTo: { mode: 'width', value: W }, font: { loadSystemFonts: true } }).render().asPng();
writeFileSync('public/og.png', png);

const icon = logoMark(180, 'ati').replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><rect width="180" height="180" fill="#0b0a12"/>${icon.replace('<svg', '<svg x="0" y="0"')}</svg>`;
writeFileSync('public/apple-touch-icon.png', new Resvg(bg, { fitTo: { mode: 'width', value: 180 } }).render().asPng());
console.log('public/og.png', png.length, 'octets');
