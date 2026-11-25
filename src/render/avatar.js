// Avatar 2D détaillé en SVG (volumes, dégradés, reflets). Origine = pieds du perso (0,0), hauteur adulte ≈ 345.
import { OUTFITS, BUILDS } from '../data/look.js';

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const shade = (h, a) => hex(rgb(h).map((v) => (a < 0 ? v * (1 + a) : v + (255 - v) * a)));
export const mix = (a, b, k) => {
  const x = rgb(a), y = rgb(b);
  return hex(x.map((v, i) => v + (y[i] - v) * k));
};

function dims(age) {
  if (age < 3) return [0.36, 0.66];
  if (age < 7) return [0.48, 0.76];
  if (age < 12) return [0.62, 0.85];
  if (age < 16) return [0.84, 0.95];
  return [1, 1];
}

// ---------- Cheveux (repère de la tête : centre 0,0) ----------
function hair(style, c, u, f) {
  const H = `url(#${u}hr)`;
  const dk = shade(c, -0.45);
  const lt = shade(c, 0.28);
  const shine = `<path d="M-18 -42 q12 -8 26 -6" stroke="${lt}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".55"/>`;
  switch (style) {
    case 'court':
      return { front: `<path d="M-38 -6 Q-41 -54 0 -56 Q41 -54 38 -6 Q35 -26 24 -30 Q12 -24 0 -30 Q-14 -24 -26 -29 Q-34 -21 -38 -6Z" fill="${H}"/><path d="M-22 -46 q10 -7 22 -5 M4 -50 q14 0 22 8" stroke="${lt}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>` };
    case 'fade':
      return { front: `<path d="M-37 -2 Q-37 -20 -34 -26 L-32 -10 Z M37 -2 Q37 -20 34 -26 L32 -10 Z" fill="${dk}" opacity=".45"/><path d="M-35 -14 Q-38 -54 0 -56 Q38 -54 35 -14 Q32 -32 22 -35 Q8 -29 -4 -34 Q-18 -29 -28 -32 Q-33 -26 -35 -14Z" fill="${H}"/>${shine}` };
    case 'boucles': {
      const pts = [[-30, -30, 11], [-17, -45, 12], [0, -51, 12], [17, -45, 12], [30, -30, 11], [-37, -14, 9], [37, -14, 9], [-8, -38, 9], [10, -38, 9], [-24, -40, 9], [24, -40, 9]];
      return { front: `<path d="M-38 -4 Q-42 -50 0 -52 Q42 -50 38 -4 Q34 -24 0 -26 Q-34 -24 -38 -4Z" fill="${dk}"/>${pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${H}"/><circle cx="${x - 3}" cy="${y - 3}" r="${r / 3}" fill="${lt}" opacity=".35"/>`).join('')}` };
    }
    case 'afro': {
      const ring = Array.from({ length: 16 }, (_, i) => {
        const a = Math.PI * (0.92 + (i / 15) * 1.16);
        return `<circle cx="${(Math.cos(a) * 52).toFixed(1)}" cy="${(-24 + Math.sin(a) * 44).toFixed(1)}" r="14" fill="${H}"/>`;
      }).join('');
      return {
        back: `<ellipse cx="0" cy="-24" rx="54" ry="46" fill="${H}"/>${ring}<circle cx="-20" cy="-52" r="9" fill="${lt}" opacity=".22"/><circle cx="14" cy="-58" r="6" fill="${lt}" opacity=".18"/>`,
        front: `<path d="M-37 -2 Q-40 -46 0 -48 Q40 -46 37 -2 Q33 -30 0 -33 Q-33 -30 -37 -2Z" fill="${dk}"/><path d="M-30 -30 q30 -12 60 0" stroke="${lt}" stroke-width="2" fill="none" opacity=".25"/>`,
      };
    }
    case 'long':
      return {
        back: `<path d="M-42 -6 Q-47 -60 0 -60 Q47 -60 42 -6 L48 74 Q36 86 24 66 L-24 66 Q-36 86 -48 74Z" fill="${H}"/>`,
        front: `<path d="M-39 0 Q-42 -56 0 -56 Q42 -56 39 0 Q34 -30 12 -38 Q-8 -24 -39 0Z" fill="${H}"/><path d="M-30 -20 Q-14 -40 10 -40" stroke="${lt}" stroke-width="2.5" fill="none" opacity=".45" stroke-linecap="round"/>`,
      };
    case 'queue':
      return {
        back: `<path d="M28 -40 Q66 -32 54 24 Q50 46 38 34 Q46 2 24 -28Z" fill="${H}"/>`,
        front: `<path d="M-37 -6 Q-40 -56 0 -56 Q40 -56 37 -6 Q32 -38 0 -40 Q-32 -38 -37 -6Z" fill="${H}"/>${shine}`,
      };
    case 'tresses': {
      const br = [-36, -24, 24, 36].map((x) => `<rect x="${x - 5}" y="-22" width="10" height="${f ? 96 : 70}" rx="5" fill="${H}"/>`).join('');
      return {
        back: br,
        front: `<path d="M-37 -6 Q-40 -56 0 -56 Q40 -56 37 -6 Q32 -38 0 -40 Q-32 -38 -37 -6Z" fill="${H}"/><path d="M-20 -50 Q-26 -28 -34 -8 M-6 -55 Q-8 -40 -12 -40 M8 -55 Q10 -40 12 -40 M20 -50 Q26 -28 34 -8" stroke="${dk}" stroke-width="2.2" fill="none"/>`,
      };
    }
    case 'chignon':
      return {
        back: `<circle cx="0" cy="-58" r="16" fill="${H}"/>`,
        front: `<path d="M-37 -6 Q-40 -56 0 -56 Q40 -56 37 -6 Q32 -38 0 -40 Q-32 -38 -37 -6Z" fill="${H}"/>${shine}`,
      };
    case 'rase':
      return { front: `<path d="M-37 -6 Q-40 -52 0 -52 Q40 -52 37 -6 Q32 -36 0 -38 Q-32 -36 -37 -6Z" fill="${dk}" opacity=".5"/>` };
    default:
      return { front: '' };
  }
}

function foulard(c) {
  const d = shade(c, -0.3);
  return {
    back: `<path d="M-50 0 Q-52 -66 0 -66 Q52 -66 50 0 L60 76 Q0 94 -60 76Z" fill="${c}"/>`,
    front: `<path d="M-42 -12 Q-42 -54 0 -54 Q42 -54 42 -12 Q37 -42 0 -44 Q-37 -42 -42 -12Z" fill="${c}"/><path d="M-40 8 Q-34 52 0 54 Q34 52 40 8 L46 44 Q0 74 -46 44Z" fill="${c}"/><path d="M-30 50 Q0 64 30 50" stroke="${d}" stroke-width="2" fill="none" opacity=".6"/>`,
  };
}

// ---------- Visage ----------
function face(p, u) {
  const { look, f, age } = p;
  const sk = `url(#${u}sk)`;
  const line = shade(look.peau, -0.42);
  const jaw = f
    ? 'M-32 -6 Q-33 -44 0 -46 Q33 -44 32 -6 Q31 18 16 33 Q0 43 -16 33 Q-31 18 -32 -6Z'
    : 'M-36 -4 Q-36 -44 0 -46 Q36 -44 36 -4 Q36 28 15 40 Q0 46 -15 40 Q-36 28 -36 -4Z';
  const ears = look.coiffure === 'foulard' ? '' : `<ellipse cx="-35" cy="0" rx="6" ry="10" fill="${sk}"/><ellipse cx="35" cy="0" rx="6" ry="10" fill="${sk}"/><path d="M-35 -4 q-3 5 0 10 M35 -4 q3 5 0 10" stroke="${line}" stroke-width="1.6" fill="none" opacity=".6"/>`;
  const browW = f ? 2 : 3.6;
  const hc = p.hairC;
  const eye = (x, s) => `<path d="M${x - 8 * s} 0 Q${x} -7 ${x + 8 * s} 0 Q${x} 5 ${x - 8 * s} 0Z" fill="#f6f3ec"/><circle cx="${x}" cy="-.5" r="4.3" fill="url(#${u}ir)"/><circle cx="${x}" cy="-.5" r="2" fill="#070403"/><circle cx="${x + 1.5}" cy="-2" r="1.3" fill="#fff"/><path d="M${x - 9 * s} 0 Q${x} -8.5 ${x + 9 * s} -.5" stroke="#120a05" stroke-width="${f ? 1.8 : 2}" fill="none" stroke-linecap="round"/>${f ? `<path d="M${x + 9 * s} -.5 l${2.4 * s} -2.4" stroke="#120a05" stroke-width="1.6" stroke-linecap="round"/>` : ''}`;
  const mouth = f
    ? `<path d="M-10 26 Q-4 22 0 24 Q4 22 10 26 Q5 27 0 27 Q-5 27 -10 26Z" fill="${mix(look.peau, '#9e2f3f', 0.62)}"/><path d="M-10 26 Q0 35 10 26 Q0 28 -10 26Z" fill="${mix(look.peau, '#b8404f', 0.55)}"/><ellipse cx="-2" cy="29.5" rx="3.5" ry="1.2" fill="#fff" opacity=".3"/>`
    : `<path d="M-9 28 Q1 31 11 26" stroke="${mix(look.peau, '#6e3328', 0.7)}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M-5 31 Q2 34 8 30" stroke="${line}" stroke-width="1.1" fill="none" opacity=".35"/>`;
  let beard = '';
  if (!f && age >= 16) {
    const bc = shade(hc, -0.2);
    if (look.barbe === 'trois') beard = `<path d="M-34 8 Q-32 32 -15 40 Q0 46 15 40 Q32 32 34 8 Q28 28 14 29 Q0 33 -14 29 Q-28 28 -34 8Z" fill="${bc}" opacity=".38"/><path d="M-10 20 Q0 16 10 20 Q0 22 -10 20Z" fill="${bc}" opacity=".45"/>`;
    if (look.barbe === 'barbe') beard = `<path d="M-36 2 Q-35 42 -15 50 Q0 56 15 50 Q35 42 36 2 Q31 24 14 26 Q0 31 -14 26 Q-31 24 -36 2Z" fill="${bc}"/><path d="M-12 20 Q0 15 12 20 Q6 24 0 22 Q-6 24 -12 20Z" fill="${bc}"/><path d="M-8 34 q8 4 16 0" stroke="${shade(bc, 0.3)}" stroke-width="1.4" fill="none" opacity=".5"/>`;
    if (look.barbe === 'moustache') beard = `<path d="M-12 21 Q0 15 12 21 Q6 25 0 23 Q-6 25 -12 21Z" fill="${bc}"/>`;
    if (look.barbe === 'bouc') beard = `<path d="M-12 21 Q0 15 12 21 Q6 25 0 23 Q-6 25 -12 21Z M-9 33 Q0 50 9 33 Q0 37 -9 33Z" fill="${bc}"/>`;
  }
  const wrinkles = age >= 55 ? `<path d="M-16 -30 q16 -4 32 0 M-12 -24 q12 -3 24 0 M-16 12 q-4 8 -2 16 M16 12 q4 8 2 16" stroke="${line}" stroke-width="1.2" fill="none" opacity=".45"/>` : '';
  return `${ears}<path d="${jaw}" fill="${sk}"/><ellipse cx="-8" cy="-26" rx="14" ry="5" fill="#fff" opacity=".13"/>
  <path d="M-${f ? 24 : 25} -12 q9 -${f ? 6 : 4} 18 -1" stroke="${shade(hc, -0.15)}" stroke-width="${browW}" fill="none" stroke-linecap="round"/><path d="M7 -13 q9 -3 18 ${f ? 2 : 1}" stroke="${shade(hc, -0.15)}" stroke-width="${browW}" fill="none" stroke-linecap="round"/>
  <g class="blink">${f ? `<g transform="translate(-15 0) scale(1.18) translate(15 0)">${eye(-15, 1)}<path d="M-24 -2 l-2.5 -2.5 M-21 -4.5 l-1.5 -3" stroke="#120a05" stroke-width="1.3" stroke-linecap="round"/></g><g transform="translate(15 0) scale(1.18) translate(-15 0)">${eye(15, -1)}<path d="M24 -2 l2.5 -2.5 M21 -4.5 l1.5 -3" stroke="#120a05" stroke-width="1.3" stroke-linecap="round"/></g>` : `${eye(-15, 1)}${eye(15, -1)}`}</g>
  ${p.etat?.cernes ? `<path d="M-23 6.5 q8 4 16 0 M7 6.5 q8 4 16 0" stroke="${shade(look.peau, -0.5)}" stroke-width="2.6" opacity=".45" fill="none" stroke-linecap="round"/>` : ''}
  ${p.etat?.blesse ? `<ellipse cx="-17" cy="3" rx="10" ry="7" fill="#5a2d63" opacity=".32"/><g transform="rotate(-18 19 -30)"><rect x="7" y="-35" width="26" height="10" rx="3" fill="#f3ede2"/><path d="M13 -33 v6 M20 -33 v6 M27 -33 v6" stroke="#d8cdbb" stroke-width="1.2"/></g>` : ''}
  <path d="M-21 5 q6 3 12 0 M9 5 q6 3 12 0" stroke="${line}" stroke-width="1" fill="none" opacity=".4"/>
  <path d="${f ? 'M1 7 q-3 8 -3 10 q3 2.5 7 0' : 'M1 2 q-4 12 -4 15 q4 3 9 0'}" stroke="${line}" stroke-width="${f ? 1.6 : 2}" fill="none" stroke-linecap="round" opacity="${f ? 0.6 : 0.8}"/><ellipse cx="2" cy="12" rx="1.6" ry="3" fill="#fff" opacity=".2"/>
  ${f ? `<ellipse cx="-20" cy="15" rx="8" ry="4.5" fill="#e0707a" opacity=".24"/><ellipse cx="20" cy="15" rx="8" ry="4.5" fill="#e0707a" opacity=".24"/>` : ''}
  ${wrinkles}${beard}${mouth}`;
}

// ---------- Corps (repère adulte, pieds à 0) ----------
function body(p, u, o) {
  const { look, f } = p;
  const sk = `url(#${u}sk)`;
  const top = `url(#${u}tp)`;
  const bot = `url(#${u}bt)`;
  const dk = shade(o.top, -0.35);
  let legs = '';
  if (o.bas === 'short' || o.bas === 'jupe') {
    legs = `<path d="M-26 -86 L-30 -14 h22 L-4 -86Z" fill="${sk}"/><path d="M4 -86 L8 -14 h22 L26 -86Z" fill="${sk}"/>`;
    legs += o.bas === 'short'
      ? `<path d="M-31 -134 L-35 -78 h31 L0 -110 L4 -78 h31 L31 -134Z" fill="${bot}"/><path d="M-35 -82 h31 M4 -82 h31" stroke="#000" stroke-width="2" opacity=".15"/>`
      : `<path d="M-30 -134 L-44 -72 Q0 -60 44 -72 L30 -134Z" fill="${bot}"/>`;
  } else {
    legs = `<path d="M-28 -134 L-32 -14 h24 L-2 -128Z" fill="${bot}"/><path d="M2 -128 L8 -14 h24 L28 -134Z" fill="${bot}"/><path d="M-20 -64 l3 32 M20 -64 l-3 32" stroke="#fff" stroke-width="1.2" opacity=".12"/>`;
    if (o.bas === 'jogging') legs += `<rect x="-33" y="-24" width="26" height="9" rx="4" fill="${shade(o.basC, -0.3)}"/><rect x="7" y="-24" width="26" height="9" rx="4" fill="${shade(o.basC, -0.3)}"/>`;
    if (o.bas === 'jean') legs += `<path d="M-2 -128 v26" stroke="${shade(o.basC, -0.35)}" stroke-width="1.5"/>`;
  }
  const shoe = (x) => `<rect x="${x}" y="-18" width="40" height="15" rx="7" fill="${o.shoes}"/><rect x="${x - 1}" y="-6" width="42" height="6" rx="3" fill="${shade(o.shoes, -0.2)}"/>${o.accent ? `<path d="M${x + 10} -12 h16" stroke="${o.accent}" stroke-width="3" stroke-linecap="round"/>` : ''}`;
  legs += shoe(-44) + shoe(4);

  const T = f ? 'M-41 -212 Q-40 -240 0 -242 Q40 -240 41 -212 Q31 -178 38 -152 Q46 -136 45 -124 Q0 -114 -45 -124 Q-46 -136 -38 -152 Q-31 -178 -41 -212 Z' : 'M-50 -208 Q-48 -240 0 -242 Q48 -240 50 -208 L54 -124 Q0 -110 -54 -124 Z';
  const LONG = 'M-50 -208 Q-48 -240 0 -242 Q48 -240 50 -208 L58 -76 Q0 -64 -58 -76 Z';
  const shortSleeve = ['tshirt', 'jersey', 'gilet'].includes(o.type);
  const bare = o.type === 'tank';
  let arms;
  if (bare) arms = `<path d="M-46 -224 Q-62 -182 -64 -130 q0 8 9 8 q9 0 10 -8 L-38 -196Z" fill="${sk}"/><path d="M46 -224 Q62 -182 64 -130 q0 8 -9 8 q-9 0 -10 -8 L38 -196Z" fill="${sk}"/>`;
  else if (shortSleeve) arms = `<path d="M-58 -182 Q-64 -156 -65 -130 q0 8 9 8 q9 0 10 -8 Q-44 -156 -41 -178Z" fill="${sk}"/><path d="M58 -182 Q64 -156 65 -130 q0 8 -9 8 q-9 0 -10 -8 Q44 -156 41 -178Z" fill="${sk}"/><path d="M-48 -226 Q-58 -204 -61 -178 L-40 -172 L-38 -200Z" fill="${top}"/><path d="M48 -226 Q58 -204 61 -178 L40 -172 L38 -200Z" fill="${top}"/>`;
  else arms = `<path d="M-48 -226 Q-64 -182 -66 -130 q0 8 10 8 q9 0 10 -8 L-38 -192Z" fill="${top}"/><path d="M48 -226 Q64 -182 66 -130 q0 8 -10 8 q-9 0 -10 -8 L38 -192Z" fill="${top}"/><path d="M-66 -132 q10 4 20 0 M46 -132 q10 4 20 0" stroke="${dk}" stroke-width="5" stroke-linecap="round"/>`;
  arms += `<ellipse cx="-56" cy="-116" rx="8" ry="10" fill="${sk}"/><ellipse cx="56" cy="-116" rx="8" ry="10" fill="${sk}"/>`;
  if (o.gold) arms += `<rect x="-63" y="-130" width="14" height="5" rx="2" fill="#e8c15a"/>`;

  let torso = '';
  switch (o.type) {
    case 'hoodie':
      torso = `<path d="${T}" fill="${top}"/><path d="M-27 -240 Q0 -216 27 -240 Q21 -224 0 -220 Q-21 -224 -27 -240Z" fill="${dk}"/><path d="M-30 -162 Q0 -168 30 -162 L34 -130 Q0 -124 -34 -130Z" fill="#000" opacity=".18"/><path d="M-9 -222 v34 M9 -222 v34" stroke="#e6e3ee" stroke-width="2" stroke-linecap="round"/>${o.accent ? `<path d="M-16 -200 h32" stroke="${o.accent}" stroke-width="3" stroke-linecap="round" opacity=".9"/>` : ''}`;
      break;
    case 'tshirt':
    case 'jersey':
    case 'tank':
      torso = `<path d="${T}" fill="${top}"/>${bare ? `<path d="M-46 -224 Q-34 -200 -36 -176 M46 -224 Q34 -200 36 -176" stroke="${dk}" stroke-width="3" fill="none"/>` : ''}<path d="M-14 -241 Q0 -228 14 -241" stroke="${dk}" stroke-width="3" fill="none"/>`;
      if (o.num) torso += `<text x="0" y="-160" text-anchor="middle" font-family="Sora, sans-serif" font-weight="800" font-size="34" fill="${o.numC}" opacity=".92">${o.num}</text>`;
      if (o.type === 'jersey') torso += `<path d="M-50 -204 L-52 -130 M50 -204 L52 -130" stroke="#fff" stroke-width="4" opacity=".7"/>`;
      if (o.accent && o.type === 'tshirt') torso += `<circle cx="-18" cy="-206" r="5" fill="${o.accent}"/>`;
      break;
    case 'blazer':
    case 'uniforme':
      torso = `<path d="${T}" fill="${top}"/><path d="M-15 -241 L0 -196 L15 -241Z" fill="${o.shirt}"/>${o.tie ? `<path d="M-4 -236 h8 l3 36 -7 8 -7 -8z" fill="${o.tie}"/>` : ''}<path d="M-17 -241 L-3 -192 L-24 -214Z M17 -241 L3 -192 L24 -214Z" fill="${dk}"/><circle cx="0" cy="-170" r="2.5" fill="${dk}"/><circle cx="0" cy="-150" r="2.5" fill="${dk}"/>`;
      if (o.type === 'uniforme') torso += `<rect x="-54" y="-136" width="108" height="9" fill="#111" opacity=".55"/>${o.cap ? `<path d="M22 -214 l7 -4 7 4 -1 9 -6 3 -6 -3z" fill="#e8c15a"/><rect x="-36" y="-212" width="18" height="5" rx="1" fill="#fff" opacity=".8"/>` : `<rect x="-38" y="-214" width="16" height="10" rx="2" fill="#2c3a24"/>`}`;
      break;
    case 'gilet':
      torso = `<path d="${T}" fill="${top}"/><path d="M-46 -226 L-28 -240 L-16 -200 L-16 -122 L-53 -126Z M46 -226 L28 -240 L16 -200 L16 -122 L53 -126Z" fill="${o.vest}"/><path d="M-52 -168 h36 M16 -168 h36 M-52 -150 h36 M16 -150 h36" stroke="#e8e8ee" stroke-width="4"/>`;
      break;
    case 'blouse':
      torso = `<path d="${LONG}" fill="${top}"/><path d="M-15 -241 L0 -200 L15 -241Z" fill="#7fb3c6"/><path d="M-17 -241 L-4 -190 L-22 -212Z M17 -241 L4 -190 L22 -212Z" fill="#dfe4ee"/><rect x="18" y="-196" width="18" height="14" rx="2" fill="none" stroke="#c9d0dc" stroke-width="1.5"/><path d="M-20 -228 Q-30 -190 -10 -176 Q4 -170 8 -186" stroke="#3a3f4a" stroke-width="2.5" fill="none"/>`;
      break;
    case 'manteau':
      torso = `<path d="${LONG}" fill="${top}"/><path d="M0 -236 V-70" stroke="${dk}" stroke-width="2"/><circle cx="6" cy="-200" r="3" fill="${dk}"/><circle cx="6" cy="-170" r="3" fill="${dk}"/><circle cx="6" cy="-140" r="3" fill="${dk}"/><rect x="-40" y="-150" width="18" height="16" rx="2" fill="${shade(o.top, 0.15)}" transform="rotate(-8 -31 -142)"/><path d="M-27 -240 Q0 -222 27 -240" stroke="${dk}" stroke-width="5" fill="none"/>`;
      break;
  }
  torso += `<path d="M22 -220 Q40 -180 40 -128" stroke="#000" stroke-width="6" opacity=".1" fill="none"/>`;
  const neck = f ? `<path d="M-9 -260 h18 v22 q-9 6 -18 0z" fill="${shade(look.peau, -0.18)}"/>` : `<path d="M-12 -260 h24 v22 q-12 8 -24 0z" fill="${shade(look.peau, -0.18)}"/>`;
  if (p.etat?.ventre) torso += `<ellipse cx="0" cy="-148" rx="44" ry="24" fill="${top}"/><path d="M-38 -140 Q0 -120 38 -140" stroke="#000" stroke-width="3" opacity=".12" fill="none"/>`;
  if (f) {
    arms = `<g transform="scale(.86 1)">${arms}</g>`;
    legs = `<g transform="scale(.9 1)">${legs}</g>`;
  }
  if (p.etat?.muscle && !f) arms = `<g transform="scale(1.07 1)">${arms}</g>`;
  const chain = o.chain || (look.acc || []).includes('chaine') ? `<path d="M-15 -243 Q0 -222 15 -243" stroke="#e8c15a" stroke-width="2.2" fill="none"/><circle cx="0" cy="-226" r="3.4" fill="#e8c15a"/>` : '';
  return legs + neck + torso + arms + chain;
}

function hats(p, o) {
  let s = '';
  const acc = p.look.acc || [];
  if (o.cap) s += `<path d="M-40 -20 Q-42 -58 0 -62 Q42 -58 40 -20Z" fill="${o.cap}"/><rect x="-40" y="-28" width="80" height="9" fill="#0d0d10"/><path d="M-38 -20 Q0 -10 38 -20 L40 -14 Q0 -2 -40 -14Z" fill="#0d0d10"/><path d="M-6 -48 l6 -4 6 4 -2 8 -4 2 -4 -2z" fill="#e8c15a"/>`;
  else if (o.beret) s += `<path d="M-40 -24 Q-44 -56 4 -58 Q46 -54 40 -26 Q10 -34 -40 -24Z" fill="${o.beret}"/><circle cx="-26" cy="-34" r="4" fill="#e8c15a"/>`;
  else if (acc.includes('casquette') && p.look.coiffure !== 'foulard') s += `<path d="M-40 -18 Q-42 -58 0 -58 Q42 -58 40 -18Z" fill="#1d1d24"/><path d="M-6 -20 Q30 -28 60 -14 Q30 -10 -6 -14Z" fill="#141419"/><circle cx="0" cy="-58" r="3" fill="#ff4f7b"/>`;
  if (acc.includes('lunettes')) s += `<rect x="-27" y="-8" width="22" height="15" rx="5" fill="#ffffff" fill-opacity=".1" stroke="#151515" stroke-width="2.4"/><rect x="5" y="-8" width="22" height="15" rx="5" fill="#ffffff" fill-opacity=".1" stroke="#151515" stroke-width="2.4"/><path d="M-5 -2 h10 M-27 -3 l-8 -2 M27 -3 l8 -2" stroke="#151515" stroke-width="2.2"/>`;
  if (acc.includes('boucles') && p.look.coiffure !== 'foulard') s += `<circle cx="-36" cy="11" r="2.8" fill="#e8c15a"/><circle cx="36" cy="11" r="2.8" fill="#e8c15a"/>`;
  return s;
}

// p : { look, genre, age, outfit }, u : préfixe unique pour les ids de dégradés.
export function avatarSVG(p, u = 'av') {
  const look = (p.age ?? 25) < 6 ? { ...p.look, acc: [] } : p.look;
  const f = p.genre === 'f';
  const age = p.age ?? 25;
  const o = OUTFITS[p.outfit] || OUTFITS.casual;
  let hairC = look.cheveuxC;
  if (age >= 72) hairC = '#d9d9de';
  else if (age >= 56) hairC = mix(hairC, '#bfbfc7', 0.55);
  const P = { look, f, age, hairC, etat: p.etat || {} };
  const [bs, hs] = dims(age);
  const build = (BUILDS.find((b) => b[0] === look.corpulence) || BUILDS[1])[2];
  const hy = bs * -258 - 34 * hs;
  const style = age < 1 ? 'rase' : look.coiffure;
  const hr = style === 'foulard' && age >= 10 ? foulard(look.foulardC || '#4b3a78') : hair(style === 'foulard' ? 'long' : style, hairC, u, f);
  const sk = p.etat?.pale ? mix(look.peau, '#cfc7bd', 0.32) : look.peau;
  const defs = `<defs>
    <radialGradient id="${u}sk" cx=".42" cy=".36" r=".72"><stop offset="0" stop-color="${shade(sk, 0.12)}"/><stop offset=".7" stop-color="${sk}"/><stop offset="1" stop-color="${shade(sk, -0.25)}"/></radialGradient>
    <linearGradient id="${u}hr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(hairC, 0.12)}"/><stop offset="1" stop-color="${shade(hairC, -0.4)}"/></linearGradient>
    <radialGradient id="${u}ir" cx=".45" cy=".4" r=".6"><stop offset="0" stop-color="${shade(look.yeux, 0.3)}"/><stop offset="1" stop-color="${shade(look.yeux, -0.45)}"/></radialGradient>
    <linearGradient id="${u}tp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(o.top, 0.12)}"/><stop offset="1" stop-color="${shade(o.top, -0.3)}"/></linearGradient>
    <linearGradient id="${u}bt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(o.basC, 0.1)}"/><stop offset="1" stop-color="${shade(o.basC, -0.3)}"/></linearGradient>
  </defs>`;
  const head = `<g transform="translate(0 ${hy.toFixed(1)}) scale(${hs})">`;
  return `${defs}<ellipse cx="0" cy="0" rx="${52 * bs * build}" ry="8" fill="#000" opacity=".28"/>
  <g class="idle">
    ${hr.back ? `${head}${hr.back}</g>` : ''}
    <g transform="scale(${(bs * build).toFixed(3)} ${bs})">${body(P, u, o)}</g>
    ${head}${face(P, u)}${hr.front}${hats(P, o)}</g>
  </g>`;
}
