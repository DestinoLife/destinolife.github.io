// Décors 2D en SVG (viewBox 1000×560, sol vers y=490, perso centré en x=500).
// Le ciel, la lumière des fenêtres et la météo changent selon l'heure (tod) et la météo.
const SKY = {
  nuit: ['#060920', '#121848', '#2a2560'],
  aube: ['#33408f', '#c46b9a', '#ffb98f'],
  jour: ['#2a7ee0', '#6cb8f6', '#cdeeff'],
  soir: ['#2b2a7a', '#b84f8f', '#ff8a65'],
};
const STARS = Array.from({ length: 46 }, (_, i) => [((i * 197) % 1000), ((i * 89) % 260) + 8, (i % 3) * 0.5 + 0.8]);

let E; // environnement courant { tod, meteo }
const night = () => E.tod === 'nuit' || E.tod === 'soir';
const lit = (i) => night() && (i * 37) % 10 < 6;
const W = (x, y, w, h, i = 0, frame = '#2e2350') =>
  `<rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" rx="3" fill="${frame}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="url(#${lit(i) ? 'wL' : 'wD'})"/>${lit(i) ? '' : `<path d="M${x + 3} ${y + h - 4} L${x + w * 0.55} ${y + 3}" stroke="#fff" stroke-width="2" opacity=".25"/>`}`;
const grid = (x0, y0, cols, rows, w, h, gx, gy, frame) => {
  let s = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) s += W(x0 + c * gx, y0 + r * gy, w, h, r * cols + c + x0, frame);
  return s;
};

function defs() {
  const [a, b, c] = SKY[E.tod];
  return `<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>
  <radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6d2"/><stop offset=".3" stop-color="#ffd27a" stop-opacity=".85"/><stop offset="1" stop-color="#ff8a65" stop-opacity="0"/></radialGradient>
  <radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".75"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></radialGradient>
  <linearGradient id="wL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe7a3"/><stop offset="1" stop-color="#ffb35c"/></linearGradient>
  <linearGradient id="wD" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${night() ? '#2a3156' : '#bfe0f7'}"/><stop offset="1" stop-color="${night() ? '#171c38' : '#6f9fc4'}"/></linearGradient>
  <radialGradient id="leaf" cx=".4" cy=".3" r=".75"><stop offset="0" stop-color="#8ee08a"/><stop offset=".6" stop-color="#3fa35b"/><stop offset="1" stop-color="#22663f"/></radialGradient>
  <linearGradient id="trunk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a5a3c"/><stop offset="1" stop-color="#5a3622"/></linearGradient>
  <linearGradient id="walk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9a2c9"/><stop offset="1" stop-color="#7d6896"/></linearGradient>
  <linearGradient id="asph" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f6a7e"/><stop offset="1" stop-color="#46425a"/></linearGradient>
  <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${night() ? '#1b2a5a' : '#2bb3d6'}"/><stop offset="1" stop-color="${night() ? '#0e1838' : '#1a6fa8'}"/></linearGradient>
  <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4dca6"/><stop offset="1" stop-color="#d9b77a"/></linearGradient>
  <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6cc46a"/><stop offset="1" stop-color="#3b8a4a"/></linearGradient>
  <linearGradient id="pool" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fe3f2"/><stop offset="1" stop-color="#2aa7cf"/></linearGradient>
  <linearGradient id="far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${night() ? '#241d4d' : E.tod === 'jour' ? '#7c8fc0' : '#6a3f8f'}"/><stop offset="1" stop-color="${night() ? '#30275e' : E.tod === 'jour' ? '#97a9d4' : '#8a4f86'}"/></linearGradient>
  </defs>`;
}

function sky() {
  let s = `<rect width="1000" height="560" fill="url(#sky)"/>`;
  if (E.tod === 'nuit') s += STARS.map(([x, y, r], i) => `<circle class="${i % 3 ? '' : 'twinkle'}" cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".7"/>`).join('') + `<circle cx="820" cy="96" r="26" fill="#f4f1e2"/><circle cx="832" cy="88" r="24" fill="${SKY.nuit[0]}" opacity=".85"/>`;
  else {
    const [x, y, r] = { aube: [190, 330, 34], jour: [790, 110, 40], soir: [760, 330, 42] }[E.tod];
    s += `<circle cx="${x}" cy="${y}" r="${r * 4}" fill="url(#sun)"/><circle cx="${x}" cy="${y}" r="${r}" fill="#fff3cf"/>`;
  }
  if (E.meteo !== 'soleil') {
    const c = E.meteo === 'pluie' ? '#7d84a3' : night() ? '#3a3a6a' : '#ffffff';
    const op = E.meteo === 'pluie' ? 0.9 : 0.75;
    const cl = (x, y, k) => `<g opacity="${op}" fill="${c}"><ellipse cx="${x}" cy="${y}" rx="${70 * k}" ry="${22 * k}"/><circle cx="${x - 28 * k}" cy="${y - 12 * k}" r="${24 * k}"/><circle cx="${x + 14 * k}" cy="${y - 20 * k}" r="${30 * k}"/></g>`;
    s += `<g class="drift">${cl(160, 110, 1)}${cl(860, 140, 0.9)}</g><g class="drift slow">${cl(520, 80, 1.3)}</g>`;
    if (E.meteo === 'pluie') s += `<rect width="1000" height="560" fill="#1f2840" opacity=".28"/>`;
  }
  return s;
}

const skyline = (y = 300) => `<path d="M0 ${y + 130} V${y} h60 v-40 h50 v60 h40 v-90 h60 v120 h50 v-50 h70 v-30 h50 v70 h46 v-80 h60 v50 h50 v-30 h60 v70 h48 v-100 h70 v80 h56 v-40 h60 v60 h60 v${130 + 40} Z" fill="url(#far)" opacity=".9"/>`;
const sidewalk = (c1 = 'url(#walk)', edge = '#e7d9f0') => `<path d="M0 492 L1000 484 L1000 560 L0 560 Z" fill="${c1}"/><path d="M0 492 L1000 484" stroke="${edge}" stroke-width="3"/><g stroke="#000" stroke-width="1.5" opacity=".12"><path d="M120 491 L110 560"/><path d="M300 490 L296 560"/><path d="M660 487 L670 560"/><path d="M840 485 L860 560"/></g>`;
const tree = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="0" cy="2" rx="40" ry="6" fill="#000" opacity=".18"/><path d="M-6 0 C-8 -40 -10 -60 -6 -90 h14 c2 30 0 50 -2 90z" fill="url(#trunk)"/><circle cx="-30" cy="-110" r="30" fill="url(#leaf)"/><circle cx="28" cy="-112" r="30" fill="url(#leaf)"/><circle cx="0" cy="-142" r="36" fill="url(#leaf)"/><circle cx="-10" cy="-150" r="8" fill="#b6f0a8" opacity=".45"/></g>`;
const palm = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-4 0 Q-10 -90 6 -180 L14 -178 Q4 -90 8 0Z" fill="url(#trunk)"/>${[[-70, -150], [-60, -200], [10, -230], [70, -200], [76, -150]].map(([dx, dy]) => `<path d="M10 -180 Q${dx / 2} ${dy - 10} ${dx} ${dy} Q${dx / 2 + 6} ${dy + 6} 10 -176Z" fill="#2f9a57"/>`).join('')}<circle cx="6" cy="-176" r="7" fill="#6b4a22"/></g>`;
const lamp = (x) => `${night() ? `<circle cx="${x}" cy="327" r="60" fill="url(#glow)"/>` : ''}<rect x="${x - 3}" y="330" width="6" height="160" rx="3" fill="#2d2245"/><path d="M${x - 12} 329 h24 l-4 -10 h-16z" fill="#2d2245"/><circle cx="${x}" cy="332" r="5" fill="${night() ? '#fff1c9' : '#cfd3e6'}"/>`;
const car = (x, y, c, k = 1, type = 'citadine') => carSVG(x, y, c, k, type);
export function carSVG(x, y, c, k = 1, type = 'citadine') {
  const glass = night() ? '#26304f' : '#a9d3ec';
  const wheel = (wx, r = 16) => `<circle cx="${wx}" cy="-6" r="${r}" fill="#15151b"/><circle cx="${wx}" cy="-6" r="${r * 0.45}" fill="#9a9aa8"/>`;
  const light = night() ? '#fff4c2' : '#f2f2f2';
  const body = {
    citadine: `<path d="M-86 -12 Q-86 -36 -64 -40 L-40 -64 Q-30 -72 10 -72 Q40 -72 56 -48 L78 -42 Q90 -38 90 -16 L90 -8 L-86 -8Z" fill="${c}"/><path d="M-36 -60 L-20 -66 H8 V-46 H-48Z M16 -66 Q36 -66 48 -46 H16Z" fill="${glass}"/>${wheel(-50)}${wheel(54)}`,
    compacte: `<path d="M-92 -12 Q-92 -34 -70 -38 L-44 -62 Q-34 -68 14 -68 Q42 -68 60 -44 L86 -38 Q96 -34 96 -14 L96 -8 L-92 -8Z" fill="${c}"/><path d="M-40 -58 L-26 -63 H10 V-44 H-52Z M18 -63 Q38 -63 52 -44 H18Z" fill="${glass}"/><path d="M-92 -22 H96" stroke="#fff" stroke-width="3" opacity=".5"/>${wheel(-54, 17)}${wheel(58, 17)}`,
    suv: `<path d="M-98 -14 Q-98 -50 -80 -54 L-58 -86 Q-50 -92 20 -92 Q52 -92 66 -60 L92 -54 Q102 -50 102 -18 L102 -8 L-98 -8Z" fill="${c}"/><path d="M-52 -82 H10 V-58 H-68Z M18 -82 Q46 -82 56 -58 H18Z" fill="${glass}"/><rect x="-98" y="-28" width="200" height="6" fill="#000" opacity=".25"/>${wheel(-58, 20)}${wheel(62, 20)}`,
    sport: `<path d="M-104 -12 Q-104 -28 -84 -32 L-40 -52 Q-20 -60 20 -58 Q56 -56 84 -36 L102 -30 Q110 -26 108 -12 L108 -8 L-104 -8Z" fill="${c}"/><path d="M-30 -50 Q-14 -56 18 -54 L40 -36 H-46Z" fill="${glass}"/><path d="M-104 -20 L108 -20" stroke="#000" stroke-width="2" opacity=".3"/><rect x="-108" y="-36" width="18" height="6" rx="2" fill="#111"/>${wheel(-62, 15)}${wheel(66, 15)}`,
    collection: `<path d="M-96 -12 Q-98 -30 -80 -36 Q-70 -40 -58 -40 Q-40 -72 6 -72 Q44 -72 58 -42 Q86 -40 98 -30 Q104 -22 100 -10 L-96 -10Z" fill="${c}"/><path d="M-44 -44 Q-30 -66 2 -66 V-44Z M10 -66 Q38 -66 48 -44 H10Z" fill="${glass}"/><path d="M-96 -16 H100" stroke="#d8d8d8" stroke-width="3"/>${wheel(-56, 17)}${wheel(60, 17)}`,
  }[type] || '';
  return `<g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="0" cy="2" rx="100" ry="8" fill="#000" opacity=".25"/>${body}<rect x="${type === 'suv' ? 94 : 84}" y="-34" width="8" height="6" rx="2" fill="${light}"/></g>`;
}

const facade = (x, y, w, h, wall, sign, signC, signBg) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${wall}"/><rect x="${x - 6}" y="${y - 8}" width="${w + 12}" height="12" rx="3" fill="${shade2(wall)}"/>${sign ? `<rect x="${x + w / 2 - 110}" y="${y + 18}" width="220" height="38" rx="6" fill="${signBg}"/><text x="${x + w / 2}" y="${y + 44}" text-anchor="middle" font-family="Sora, sans-serif" font-weight="800" font-size="20" letter-spacing="3" fill="${signC}">${sign}</text>` : ''}`;
const shade2 = (c) => (c.startsWith('#') ? '#00000055' : c);
const flag = (x, y) => `<rect x="${x}" y="${y}" width="4" height="110" fill="#9aa0b0"/><rect x="${x + 4}" y="${y + 4}" width="22" height="34" fill="#2a4bb0"/><rect x="${x + 26}" y="${y + 4}" width="22" height="34" fill="#f4f4f6"/><rect x="${x + 48}" y="${y + 4}" width="22" height="34" fill="#d8283c"/>`;

// ---------- Scènes ----------
const S = {
  rue: () => `${sky()}${skyline(300)}
    <rect x="20" y="150" width="200" height="340" fill="#4a3d78"/><rect x="14" y="142" width="212" height="12" rx="3" fill="#2e2350"/>${grid(40, 175, 3, 3, 34, 40, 64, 70)}
    <rect x="90" y="400" width="60" height="90" rx="3" fill="#241b40"/><rect x="96" y="406" width="48" height="84" fill="#3a2f63"/>
    <rect x="240" y="260" width="150" height="230" fill="#d8866a"/><rect x="236" y="253" width="158" height="10" rx="3" fill="#a5554a"/>${W(256, 290, 34, 44, 3, '#6b3a35')}${W(332, 290, 34, 44, 4, '#6b3a35')}
    <path d="M288 375 h52 l8 18 h-68 Z" fill="#2fb39a"/><rect x="294" y="393" width="40" height="97" rx="3" fill="#3d2230"/>
    <rect x="840" y="300" width="160" height="190" fill="#2f7684"/><rect x="834" y="292" width="172" height="12" rx="3" fill="#1f4f5a"/><rect x="856" y="318" width="128" height="30" rx="6" fill="#14323a"/><text x="920" y="339" text-anchor="middle" font-family="Sora, sans-serif" font-weight="800" font-size="15" fill="#5ff5d0" letter-spacing="2">SUPÉRETTE</text>
    <path d="M846 360 h148 l-8 22 h-132z" fill="#ff4f7b"/><rect x="856" y="392" width="70" height="98" rx="3" fill="url(#wL)" opacity=".85"/>
    ${lamp(622)}${sidewalk()}<g transform="translate(730 490)"><path d="M-48 -45 h96 l-6 46 h-84z" fill="#d9d1e6"/></g>${tree(730, 446, 0.9)}`,

  cite: () => `${sky()}${skyline(330)}
    ${[[30, 120, 230, '#c9a77f'], [300, 60, 220, '#b98f6a'], [740, 100, 240, '#c49b74']].map(([x, y, w, c], k) => `<rect x="${x}" y="${y}" width="${w}" height="${490 - y}" fill="${c}"/><rect x="${x}" y="${y}" width="${w}" height="10" fill="#00000033"/>${grid(x + 18, y + 26, Math.floor((w - 20) / 42), Math.floor((410 - y) / 46), 26, 30, 42, 46, '#5b4636')}<rect x="${x + w / 2 - 26}" y="430" width="52" height="60" fill="#2b2230"/>`).join('')}
    <rect x="300" y="430" width="220" height="60" fill="#7a5bb5"/><path d="M312 452 q20 -18 40 0 t40 0 M410 470 q14 -22 30 -4 q16 16 34 -8" stroke="#ffd36e" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M330 474 h50" stroke="#5ff5d0" stroke-width="6" stroke-linecap="round"/>
    <rect x="590" y="330" width="6" height="160" fill="#555a6a"/><rect x="566" y="324" width="54" height="36" rx="2" fill="#f2f2f2" stroke="#555a6a" stroke-width="3"/><circle cx="593" cy="370" r="12" fill="none" stroke="#ff6a2b" stroke-width="3"/>
    ${sidewalk('url(#asph)', '#9c96b0')}<path d="M560 520 h300" stroke="#fff" stroke-width="3" opacity=".5"/>${tree(930, 492, 0.85)}`,

  bidonville: () => `${sky()}<path d="M0 360 L1000 340 V380 H0Z" fill="#4c4a5c"/><g stroke="#2d2b38" stroke-width="5">${[80, 260, 440, 620, 800, 980].map((x) => `<path d="M${x} 300 V362"/>`).join('')}</g><path d="M0 348 L1000 330" stroke="#3a3848" stroke-width="10"/>
    <path d="M150 300 Q300 330 470 296 M520 300 Q700 340 900 296" stroke="#1a1a22" stroke-width="2" fill="none"/>
    ${[[20, 330, 190, '#6f8aa8'], [220, 360, 170, '#b06a4a'], [600, 350, 180, '#7a9a6a'], [790, 320, 200, '#a8a090']].map(([x, y, w, c]) => `<rect x="${x}" y="${y}" width="${w}" height="${490 - y}" fill="${c}"/>${Array.from({ length: Math.floor(w / 14) }, (_, i) => `<path d="M${x + 7 + i * 14} ${y} V490" stroke="#000" stroke-width="2" opacity=".14"/>`).join('')}<path d="M${x - 10} ${y + 6} L${x + w / 2} ${y - 22} L${x + w + 10} ${y + 6}Z" fill="#8a8f9a"/>${W(x + 24, y + 40, 34, 30, x)}<rect x="${x + w - 64}" y="${y + 50}" width="40" height="${440 - y}" fill="#2a2430"/>`).join('')}
    <path d="M410 400 h120 l-10 40 h-100z" fill="#3a6ad1" opacity=".85"/><path d="M640 300 L820 300" stroke="#444" stroke-width="1.5"/>${['#ff4f7b', '#ffd36e', '#5ff5d0', '#ffffff'].map((c, i) => `<rect x="${660 + i * 38}" y="300" width="22" height="30" fill="${c}"/>`).join('')}
    <rect x="860" y="452" width="34" height="40" rx="4" fill="#3b6b4a"/><rect x="900" y="458" width="34" height="34" rx="4" fill="#9a3b2b"/>
    <path d="M0 492 Q500 480 1000 486 V560 H0Z" fill="#7a5d44"/><ellipse cx="300" cy="520" rx="90" ry="10" fill="#5b4433"/><ellipse cx="760" cy="532" rx="70" ry="8" fill="#5b4433"/>`,

  appart: () => `${sky()}
    ${[[0, 300], [320, 420], [680, 320]].map(([x, w], k) => `<rect x="${x}" y="110" width="${w}" height="380" fill="${k === 1 ? '#efe3cc' : '#e6d6bb'}"/><path d="M${x} 110 L${x + 20} 70 H${x + w - 20} L${x + w} 110Z" fill="#6b7590"/>${Array.from({ length: Math.floor(w / 80) }, (_, i) => `<rect x="${x + 30 + i * 80}" y="80" width="26" height="24" rx="12" fill="#55607a"/>`).join('')}${[150, 240].map((yy) => Array.from({ length: Math.floor(w / 80) }, (_, i) => `${W(x + 26 + i * 80, yy, 34, 56, i + yy + k, '#c9b89a')}<rect x="${x + 20 + i * 80}" y="${yy + 52}" width="46" height="8" fill="none" stroke="#1d1d24" stroke-width="2"/><path d="M${x + 24 + i * 80} ${yy + 52} v8 M${x + 34 + i * 80} ${yy + 52} v8 M${x + 44 + i * 80} ${yy + 52} v8 M${x + 54 + i * 80} ${yy + 52} v8" stroke="#1d1d24" stroke-width="1.5"/>`).join('')).join('')}<rect x="${x}" y="330" width="${w}" height="6" fill="#cdbd9e"/>`).join('')}
    <rect x="340" y="350" width="380" height="140" fill="#2c2430"/><path d="M330 350 h400 l-14 30 h-372z" fill="#b3132f"/><g fill="#fff" opacity=".35">${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${352 + i * 64} 350 l-4 30 h22 l4 -30z"/>`).join('')}</g>
    <text x="530" y="372" text-anchor="middle" font-family="Sora, sans-serif" font-weight="700" font-size="16" fill="#fff" letter-spacing="4">CAFÉ DE LA GARE</text>
    <rect x="360" y="392" width="150" height="98" fill="url(#wL)" opacity="${night() ? 0.95 : 0.6}"/><rect x="560" y="392" width="140" height="98" fill="url(#wL)" opacity="${night() ? 0.95 : 0.6}"/>
    ${sidewalk('url(#walk)', '#efe6f6')}${lamp(250)}${lamp(780)}${tree(120, 492, 1.05)}${tree(900, 492, 1)}`,

  maison: () => `${sky()}<path d="M0 420 Q250 380 520 410 T1000 400 V500 H0Z" fill="#5da36a"/>
    ${tree(120, 486, 1.15)}
    <rect x="300" y="300" width="330" height="190" fill="#f3ece1"/><path d="M280 306 L465 196 L650 306Z" fill="#c4553e"/><path d="M280 306 L465 196 L650 306" stroke="#933d2c" stroke-width="6" fill="none"/>
    ${W(330, 340, 60, 56, 1, '#7a6a5a')}${W(540, 340, 60, 56, 2, '#7a6a5a')}${W(436, 240, 56, 44, 5, '#7a6a5a')}<rect x="436" y="400" width="56" height="90" rx="3" fill="#3f5a7a"/><circle cx="482" cy="446" r="3" fill="#e8c15a"/>
    <rect x="650" y="370" width="150" height="120" fill="#e8e0d2"/><path d="M640 372 h170 l-10 -20 h-150z" fill="#a54a36"/><rect x="666" y="392" width="118" height="98" fill="#bcb5aa"/><path d="M666 412 h118 M666 432 h118 M666 452 h118 M666 472 h118" stroke="#9a948a" stroke-width="2"/>
    ${car(900, 500, '#2f5fc4', 0.85)}
    <path d="M0 490 L1000 482 V560 H0Z" fill="url(#grass)"/><g fill="#fff" opacity=".8">${[60, 90, 120, 150, 180, 210, 240].map((x) => `<rect x="${x}" y="452" width="10" height="40" rx="3"/>`).join('')}<rect x="50" y="462" width="210" height="6"/></g>
    <path d="M430 490 L470 490 L520 560 L380 560Z" fill="#d8cfc0"/>`,

  villa: () => `${sky()}${E.tod !== 'nuit' ? '<path d="M600 360 H1000 V400 H600Z" fill="url(#sea)"/>' : ''}
    ${palm(90, 490, 1.2)}${palm(940, 490, 1.05)}
    <rect x="170" y="230" width="420" height="180" fill="#f7f7f4"/><rect x="330" y="150" width="340" height="90" fill="#ffffff"/><rect x="320" y="140" width="360" height="12" fill="#d6d6d0"/><rect x="160" y="222" width="440" height="12" fill="#d6d6d0"/>
    <rect x="350" y="166" width="300" height="60" fill="url(#${night() ? 'wL' : 'wD'})"/><path d="M450 166 v60 M550 166 v60" stroke="#e8e8e4" stroke-width="4"/>
    <rect x="190" y="256" width="250" height="140" fill="url(#${night() ? 'wL' : 'wD'})"/><path d="M273 256 v140 M356 256 v140" stroke="#e8e8e4" stroke-width="4"/><rect x="470" y="256" width="100" height="154" fill="#4a3b2e"/>
    <rect x="600" y="300" width="200" height="110" fill="#ededea"/><rect x="620" y="320" width="160" height="70" fill="url(#${night() ? 'wL' : 'wD'})"/>
    <path d="M0 410 H1000 V560 H0Z" fill="#e9e3d7"/><path d="M20 430 H380 L410 520 H-10Z" fill="url(#pool)"/><path d="M60 455 q30 -8 60 0 t60 0 M180 485 q30 -8 60 0 t60 0" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/>
    <g transform="translate(700 470)"><rect x="0" y="0" width="120" height="14" rx="6" fill="#ffffff"/><rect x="-4" y="12" width="6" height="18" fill="#bbb"/><rect x="118" y="12" width="6" height="18" fill="#bbb"/><path d="M90 0 L120 -30" stroke="#fff" stroke-width="10" stroke-linecap="round"/></g>
    <path d="M0 490 H1000" stroke="#d8d0c0" stroke-width="2"/>`,

  plage: () => `${sky()}<path d="M0 330 Q140 280 300 320 T560 315 V360 H0Z" fill="${night() ? '#26224a' : '#9d8fb8'}" opacity=".7"/>
    <rect x="0" y="340" width="1000" height="130" fill="url(#sea)"/>${E.tod !== 'nuit' ? '<path d="M0 360 H1000" stroke="#fff" stroke-width="2" opacity=".35"/>' : ''}
    <g stroke="#fff" stroke-width="2.5" fill="none" opacity=".5"><path d="M80 400 q30 -8 60 0"/><path d="M380 380 q30 -8 60 0"/><path d="M720 410 q30 -8 60 0"/><path d="M560 440 q30 -8 60 0"/></g>
    <g transform="translate(780 360)"><path d="M0 0 L60 0 L50 14 L8 14Z" fill="#f4f4f6"/><path d="M30 -60 V0 M30 -58 L58 -6 H30Z" stroke="#f4f4f6" stroke-width="3" fill="#f4f4f6"/></g>
    <path d="M0 470 Q500 440 1000 466 V560 H0Z" fill="url(#sand)"/><path d="M0 472 Q500 442 1000 468" stroke="#fff" stroke-width="5" opacity=".6" fill="none"/>
    ${palm(90, 520, 1.2)}<g transform="translate(760 520)"><path d="M0 0 V-130" stroke="#7a5a3a" stroke-width="5"/><path d="M-90 -120 Q0 -175 90 -120Z" fill="#ff4f7b"/><path d="M-30 -138 Q0 -175 30 -138 L0 -120Z" fill="#fff" opacity=".85"/></g><rect x="660" y="520" width="130" height="30" rx="4" fill="#3f8fd6" transform="rotate(-4 720 535)"/>`,

  bureau: () => `<rect width="1000" height="560" fill="#e9ecf3"/><rect x="60" y="60" width="880" height="250" fill="url(#sky)"/>${skyline(170).replace('fill="url(#far)" opacity=".9"', 'fill="url(#far)" opacity=".7"')}<path d="M60 60 h880 v250 h-880z M280 60 v250 M500 60 v250 M720 60 v250" fill="none" stroke="#c9cfdc" stroke-width="10"/>
    <rect x="0" y="310" width="1000" height="180" fill="#dfe3ec"/><rect x="0" y="0" width="1000" height="44" fill="#d3d8e3"/>${[180, 500, 820].map((x) => `<rect x="${x - 70}" y="16" width="140" height="10" rx="5" fill="#fff" opacity=".9"/>`).join('')}
    ${[[110, 1], [780, -1]].map(([x]) => `<rect x="${x}" y="400" width="180" height="12" rx="3" fill="#c7b59a"/><rect x="${x + 10}" y="412" width="8" height="78" fill="#8d94a6"/><rect x="${x + 162}" y="412" width="8" height="78" fill="#8d94a6"/><rect x="${x + 40}" y="330" width="100" height="64" rx="4" fill="#1d2230"/><rect x="${x + 46}" y="336" width="88" height="52" rx="2" fill="${night() ? '#3a6ad1' : '#5f8fe8'}"/><rect x="${x + 85}" y="394" width="10" height="8" fill="#8d94a6"/>`).join('')}
    <g transform="translate(330 490)"><rect x="-18" y="-50" width="36" height="50" rx="5" fill="#c9cfdc"/><circle cx="0" cy="-74" r="26" fill="url(#leaf)"/></g>
    <rect x="0" y="490" width="1000" height="70" fill="#b9a183"/><path d="M0 490 H1000" stroke="#9a8468" stroke-width="3"/>`,

  chantier: () => `${sky()}${skyline(330)}
    <g stroke="#f2b01e" stroke-width="5" fill="none"><path d="M760 80 V490 M790 80 V490"/>${Array.from({ length: 13 }, (_, i) => `<path d="M760 ${100 + i * 30} L790 ${130 + i * 30}"/>`).join('')}<path d="M560 80 H990 M560 100 H990"/>${Array.from({ length: 14 }, (_, i) => `<path d="M${570 + i * 30} 80 L${585 + i * 30} 100"/>`).join('')}</g><path d="M640 100 V200" stroke="#333" stroke-width="2"/><rect x="618" y="200" width="44" height="26" fill="#8a8f9a"/>
    <rect x="120" y="180" width="380" height="310" fill="none"/>${[180, 260, 340, 420].map((y) => `<rect x="120" y="${y}" width="380" height="14" fill="#a9a9b0"/>`).join('')}${[130, 250, 370, 480].map((x) => `<rect x="${x}" y="180" width="14" height="310" fill="#9a9aa2"/>`).join('')}
    <g stroke="#3e6fc4" stroke-width="3">${[110, 210, 310, 410, 510].map((x) => `<path d="M${x} 170 V490"/>`).join('')}${[200, 280, 360, 440].map((y) => `<path d="M110 ${y} H510"/>`).join('')}</g>
    <path d="M0 492 L1000 484 V560 H0Z" fill="#a88a64"/><path d="M180 492 q60 -60 140 0z" fill="#d9b77a"/>
    ${[600, 680].map((x) => `<path d="M${x} 492 l10 -34 l10 34z" fill="#ff6a2b"/><rect x="${x + 3}" y="474" width="14" height="5" fill="#fff"/>`).join('')}<g transform="translate(860 470)"><rect width="120" height="22" fill="#fff"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M${i * 26} 0 l14 0 l-12 22 h-14z" fill="#d8283c"/>`).join('')}</g>`,

  commissariat: () => `${sky()}${skyline(320)}${facade(170, 200, 660, 290, '#d9dde6', 'POLICE', '#ffffff', '#1d3a8a')}
    ${grid(200, 280, 7, 2, 50, 50, 88, 80, '#9aa3b6')}<rect x="455" y="410" width="90" height="80" fill="#2a3550"/><rect x="455" y="400" width="90" height="10" fill="#1d3a8a"/>
    ${flag(120, 230)}${flag(860, 230)}${car(820, 500, '#f4f4f6', 0.9)}<rect x="752" y="460" width="150" height="8" fill="#1d3a8a"/><rect x="790" y="430" width="40" height="8" rx="3" fill="${night() ? '#4d7bff' : '#3a5fd0'}"/>
    ${sidewalk('url(#asph)', '#a7a3b8')}`,

  hopital: () => `${sky()}${skyline(330)}${facade(150, 170, 700, 320, '#f1f3f7', 'HÔPITAL', '#ffffff', '#1f63c9')}
    ${grid(180, 240, 8, 3, 48, 42, 84, 64, '#a9b4c7')}<rect x="440" y="420" width="120" height="70" fill="url(#wD)"/><path d="M500 420 v70" stroke="#fff" stroke-width="3"/>
    <rect x="860" y="230" width="60" height="60" rx="8" fill="#1f63c9"/><text x="890" y="275" text-anchor="middle" font-family="Sora, sans-serif" font-weight="800" font-size="40" fill="#fff">H</text>
    <g transform="translate(210 500)"><ellipse cx="0" cy="2" rx="100" ry="7" fill="#000" opacity=".2"/><rect x="-96" y="-90" width="190" height="84" rx="10" fill="#fff"/><rect x="-96" y="-40" width="190" height="10" fill="#ffd21f"/><rect x="-10" y="-80" width="10" height="30" fill="#d8283c"/><rect x="-20" y="-70" width="30" height="10" fill="#d8283c"/><circle cx="-60" cy="-6" r="15" fill="#1a1a22"/><circle cx="60" cy="-6" r="15" fill="#1a1a22"/><rect x="-30" y="-100" width="40" height="10" rx="4" fill="#3a6ad1"/></g>
    ${sidewalk('url(#walk)', '#ece6f2')}`,

  ecole: () => `${sky()}${skyline(330)}${facade(180, 210, 640, 280, '#ead9b8', 'ÉCOLE', '#2a2230', '#f7efe0')}
    <text x="500" y="285" text-anchor="middle" font-family="Sora, sans-serif" font-weight="600" font-size="14" letter-spacing="3" fill="#6b5a44">LIBERTÉ · ÉGALITÉ · FRATERNITÉ</text>
    ${grid(210, 310, 6, 1, 60, 56, 104, 0, '#8a7458')}<rect x="455" y="400" width="90" height="90" rx="4" fill="#3a5a7a"/>${flag(140, 240)}
    <path d="M0 492 L1000 484 V560 H0Z" fill="#9a8fae"/><path d="M80 530 h200 M720 526 h200" stroke="#fff" stroke-width="4" opacity=".7"/><g stroke="#3a3a48" stroke-width="3"><path d="M0 470 H170 M830 466 H1000"/>${[10, 40, 70, 100, 130, 160, 840, 870, 900, 930, 960, 990].map((x) => `<path d="M${x} 440 V490"/>`).join('')}</g>${tree(900, 484, 0.9)}`,

  stade: () => `<rect width="1000" height="560" fill="url(#sky)"/>${E.tod === 'nuit' ? STARS.slice(0, 20).map(([x, y, r]) => `<circle cx="${x}" cy="${y / 2}" r="${r}" fill="#fff" opacity=".6"/>`).join('') : ''}
    <path d="M0 160 Q500 100 1000 160 V380 H0Z" fill="#2a2f45"/>${[180, 220, 260, 300, 340].map((y, i) => `<path d="M0 ${y} Q500 ${y - 50 + i * 8} 1000 ${y}" stroke="${['#d8283c', '#ffffff', '#2a4bb0', '#d8283c', '#ffffff'][i]}" stroke-width="22" fill="none" opacity=".55"/>`).join('')}
    <g fill="#fff" opacity=".35">${Array.from({ length: 70 }, (_, i) => `<circle cx="${(i * 71) % 1000}" cy="${190 + ((i * 37) % 150)}" r="3"/>`).join('')}</g>
    ${[80, 920].map((x) => `<rect x="${x - 3}" y="40" width="6" height="140" fill="#8a8f9a"/><rect x="${x - 40}" y="30" width="80" height="26" rx="3" fill="#f2f2f6"/>${night() ? `<circle cx="${x}" cy="44" r="80" fill="url(#glow)"/>` : ''}`).join('')}
    <rect x="0" y="380" width="1000" height="180" fill="url(#grass)"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<rect x="${i * 100}" y="380" width="50" height="180" fill="#fff" opacity=".05"/>`).join('')}
    <path d="M0 470 Q500 440 1000 470" stroke="#fff" stroke-width="4" fill="none" opacity=".85"/><path d="M860 380 V320 H990 V380" stroke="#fff" stroke-width="5" fill="none"/><path d="M860 320 L990 380 M990 320 L860 380" stroke="#fff" stroke-width="1" opacity=".3"/>`,

  studio: () => `<rect width="1000" height="560" fill="#1a1428"/>${Array.from({ length: 60 }, (_, i) => { const x = (i % 12) * 84 + 2, y = Math.floor(i / 12) * 84 + 2; return `<rect x="${x}" y="${y}" width="80" height="80" fill="${i % 2 ? '#2a2140' : '#241c38'}"/><path d="M${x + 10} ${y + 20} h60 M${x + 10} ${y + 40} h60 M${x + 10} ${y + 60} h60" stroke="#000" stroke-width="3" opacity=".25"/>`; }).join('')}
    <rect x="380" y="60" width="240" height="60" rx="12" fill="#2a0e18" stroke="#ff3b5c" stroke-width="4"/><text x="500" y="102" text-anchor="middle" font-family="Sora, sans-serif" font-weight="800" font-size="30" letter-spacing="6" fill="#ff5470">ON AIR</text>
    <rect x="0" y="430" width="1000" height="6" fill="#7b5cff" opacity=".8"/>
    <g transform="translate(640 490)"><rect x="-3" y="-200" width="6" height="200" fill="#3a3a48"/><path d="M0 -200 L-60 -230" stroke="#3a3a48" stroke-width="5"/><rect x="-80" y="-262" width="30" height="46" rx="14" fill="#c9c9d6"/><circle cx="-65" cy="-239" r="26" fill="none" stroke="#1a1a22" stroke-width="3"/><path d="M-30 0 h60" stroke="#3a3a48" stroke-width="6"/></g>
    <rect x="70" y="330" width="250" height="100" rx="6" fill="#2d2f3c"/>${Array.from({ length: 10 }, (_, i) => `<rect x="${88 + i * 22}" y="${350 + ((i * 7) % 30)}" width="8" height="18" rx="2" fill="${['#5ff5d0', '#ffd36e', '#ff4f7b'][i % 3]}"/>`).join('')}
    <rect x="820" y="280" width="110" height="200" rx="8" fill="#15151c"/><circle cx="875" cy="340" r="30" fill="#2a2a36"/><circle cx="875" cy="430" r="40" fill="#2a2a36"/>
    <rect x="0" y="490" width="1000" height="70" fill="#110d1c"/>`,

  prison: () => `<rect width="1000" height="560" fill="#8d8f98"/>${Array.from({ length: 30 }, (_, i) => `<rect x="${(i % 10) * 100 + (Math.floor(i / 10) % 2) * 50}" y="${Math.floor(i / 10) * 60 + 40}" width="96" height="56" fill="#9b9da6" opacity=".55"/>`).join('')}
    <rect x="420" y="90" width="160" height="110" fill="url(#sky)"/><g stroke="#3a3c46" stroke-width="7">${[440, 470, 500, 530, 560].map((x) => `<path d="M${x} 90 V200"/>`).join('')}</g><rect x="414" y="84" width="172" height="122" fill="none" stroke="#5a5c66" stroke-width="10"/>
    <g transform="translate(70 300)"><rect width="220" height="14" fill="#4a4c58"/><rect y="90" width="220" height="14" fill="#4a4c58"/><rect y="-10" width="220" height="12" rx="4" fill="#dcdce2"/><rect y="80" width="220" height="12" rx="4" fill="#dcdce2"/><path d="M4 0 V190 M216 0 V190" stroke="#4a4c58" stroke-width="8"/></g>
    <rect x="770" y="230" width="150" height="260" fill="#5a5c66"/><rect x="800" y="270" width="90" height="20" fill="#2a2c34"/><circle cx="890" cy="370" r="6" fill="#2a2c34"/>
    <path d="M0 490 H1000 V560 H0Z" fill="#6c6e78"/><path d="M0 490 H1000" stroke="#5a5c66" stroke-width="4"/>
    <g stroke="#26282f" stroke-width="10" opacity=".9">${[20, 980].map((x) => `<path d="M${x} 0 V560"/>`).join('')}</g>`,

  pays: () => `${sky()}<path d="M0 360 Q300 330 600 352 T1000 340 V420 H0Z" fill="#d9a76c" opacity=".6"/>
    ${[[10, 300, 200, '#f1e2c4'], [230, 330, 170, '#e9c99a'], [620, 310, 190, '#f4e8d0'], [830, 290, 170, '#e7bf8a']].map(([x, y, w, c], k) => `<rect x="${x}" y="${y}" width="${w}" height="${490 - y}" fill="${c}"/><rect x="${x - 4}" y="${y - 8}" width="${w + 8}" height="10" fill="#00000022"/><path d="M${x + 30} ${490} V${y + 120} a24 24 0 0 1 48 0 V490Z" fill="${['#2a6fb0', '#1f8a70', '#2a6fb0', '#b3132f'][k]}"/>${W(x + w - 70, y + 40, 40, 40, k + 2, '#8a6a4a')}`).join('')}
    ${palm(470, 492, 1.15)}
    <g transform="translate(500 492)"><rect x="40" y="-70" width="150" height="70" fill="#8a5a3a"/><path d="M30 -76 h170 l-14 -26 h-142z" fill="#ff6a2b"/>${['#ff4f7b', '#ffd36e', '#7ccf5a', '#ff8a3d', '#d8283c'].map((c, i) => `<circle cx="${60 + i * 26}" cy="-74" r="10" fill="${c}"/>`).join('')}</g>
    <path d="M0 492 Q500 480 1000 486 V560 H0Z" fill="#d6b07a"/>`,

  casino: () => `<rect width="1000" height="560" fill="#1c0a14"/><rect y="0" width="1000" height="300" fill="#2a0e1c"/>${Array.from({ length: 9 }, (_, i) => `<g class="twinkle"><circle cx="${60 + i * 110}" cy="60" r="26" fill="#ffd36e" opacity=".85"/><circle cx="${60 + i * 110}" cy="60" r="60" fill="url(#glow)"/></g>`).join('')}
    <rect x="60" y="150" width="160" height="230" rx="14" fill="#3a1226"/><rect x="80" y="180" width="120" height="70" rx="6" fill="#0d0d12"/><text x="140" y="228" text-anchor="middle" font-family="Sora, sans-serif" font-weight="800" font-size="34" fill="#ffd36e">777</text><rect x="90" y="270" width="100" height="16" rx="8" fill="#ff4f7b"/>
    <rect x="780" y="150" width="160" height="230" rx="14" fill="#3a1226"/><rect x="800" y="180" width="120" height="70" rx="6" fill="#0d0d12"/><text x="860" y="228" text-anchor="middle" font-family="Sora, sans-serif" font-weight="800" font-size="30" fill="#5ff5d0">BAR</text><rect x="810" y="270" width="100" height="16" rx="8" fill="#5ff5d0"/>
    <ellipse cx="500" cy="440" rx="330" ry="70" fill="#0f5a3a"/><ellipse cx="500" cy="430" rx="330" ry="70" fill="#137a4d"/><circle cx="300" cy="420" r="44" fill="#4a2a12"/><circle cx="300" cy="420" r="34" fill="#c9a227"/><circle cx="300" cy="420" r="14" fill="#4a2a12"/>
    ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${620 + i * 30}" cy="${410 + (i % 2) * 18}" r="10" fill="${['#d8283c', '#111', '#2a6fb0', '#ffd36e', '#ffffff'][i]}" stroke="#fff" stroke-width="2"/>`).join('')}
    <rect x="0" y="490" width="1000" height="70" fill="#2a0b18"/><path d="M0 490 H1000" stroke="#c9a227" stroke-width="3"/>
    <text x="500" y="120" text-anchor="middle" font-family="Sora, sans-serif" font-weight="800" font-size="40" letter-spacing="10" fill="#ffd36e">CASINO</text>`,

  caserne: () => `${sky()}${skyline(320)}${facade(170, 220, 660, 270, '#c8c4a8', '2ᵉ RÉGIMENT ÉTRANGER', '#f2efe0', '#3e4a2e')}${grid(200, 300, 7, 2, 46, 40, 88, 70, '#6e6a50')}<rect x="450" y="420" width="100" height="70" fill="#3e4a2e"/>${flag(110, 250)}${sidewalk('url(#asph)', '#a7a3b8')}`,
};

const STREET = ['rue', 'cite', 'appart', 'commissariat', 'hopital', 'maison', 'ecole', 'pays', 'chantier', 'caserne'];
function ambient(key) {
  let s = '';
  const outdoor = !['bureau', 'studio', 'prison', 'casino'].includes(key);
  if (outdoor && (E.tod === 'jour' || E.tod === 'aube') && E.meteo !== 'pluie')
    s += `<g class="fly"><path d="M0 0 q8 -8 16 0 q8 -8 16 0 M40 20 q6 -6 12 0 q6 -6 12 0 M-30 26 q6 -6 12 0 q6 -6 12 0" stroke="#2a2440" stroke-width="2.5" fill="none" stroke-linecap="round" transform="translate(0 120)"/></g>`;
  if (STREET.includes(key)) s += `<g class="pass">${carSVG(0, 478, pickColor(key), 0.55, key === 'pays' ? 'citadine' : 'compacte')}</g><g class="pass p2">${carSVG(0, 478, '#e8e8ee', 0.5, 'suv')}</g>`;
  if (key === 'plage') s += `<g class="wave" stroke="#fff" stroke-width="3" fill="none" opacity=".55"><path d="M60 420 q30 -10 60 0 t60 0"/><path d="M420 400 q30 -10 60 0 t60 0"/><path d="M760 430 q30 -10 60 0 t60 0"/></g>`;
  if (key === 'villa') s += `<g class="wave" stroke="#fff" stroke-width="3" fill="none" opacity=".6"><path d="M90 470 q25 -8 50 0 t50 0"/><path d="M230 500 q25 -8 50 0 t50 0"/></g>`;
  return s;
}
const pickColor = (k) => ({ rue: '#ff9f5a', cite: '#3e6fc4', appart: '#111318', maison: '#c4553e', pays: '#e8e0d2' }[k] || '#7b5cff');

export function sceneSVG(key, env) {
  E = env;
  return defs() + (S[key] || S.rue)() + ambient(key);
}
