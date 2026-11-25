// Icônes au trait (24×24) et logo Destino.
const P = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
  mask: '<path d="M3 8c3-2 15-2 18 0 0 6-3 10-9 10S3 14 3 8z"/><circle cx="8.5" cy="11" r="1.5"/><circle cx="15.5" cy="11" r="1.5"/>',
  heart: '<path d="M12 20s-7-4.5-9-9a4.5 4.5 0 0 1 9-3 4.5 4.5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>',
  home: '<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  forward: '<path d="M5 5l7 7-7 7M12 5l7 7-7 7"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z"/>',
  rain: '<path d="M7 15h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 6.5 4.3 4.3 0 0 0 7 15z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',
  pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.2"/><circle cx="16" cy="16" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="16" cy="8" r="1.2"/><circle cx="8" cy="16" r="1.2"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 5h-5L8 10z"/>',
  dumbbell: '<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>',
  run: '<circle cx="14" cy="4" r="2"/><path d="M6 21l3-6 3 2v4M9 15l2-6 4 2 3 1M11 9l-3 1-2 3"/>',
  book: '<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  brush: '<path d="M14 4l6 6-8 8H6v-6z"/><path d="M3 21c2 0 3-1 3-3"/>',
  music: '<path d="M9 18V6l11-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  plane: '<path d="M2 16l20-7-4 10-5-3-3 4-1-5z"/>',
  cross: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
  sparkle: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
  leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15M5 19l7-7"/>',
  hand: '<path d="M7 11V5a1.5 1.5 0 0 1 3 0v5M10 10V4a1.5 1.5 0 0 1 3 0v6M13 10V5a1.5 1.5 0 0 1 3 0v6M16 11V8a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7 6 6 0 0 1-5-3l-3-5a1.5 1.5 0 0 1 2.5-1.5L7 14"/>',
  ticket: '<path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 0 0-4V4H3z"/><path d="M13 4v16" stroke-dasharray="2 2"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  door: '<path d="M14 3H6v18h8M10 12h11M18 9l3 3-3 3"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 21h8M9 17h6v4H9z"/>',
  camera: '<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 7l2-3h4l2 3"/>',
  file: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  car: '<path d="M3 16v-4l2-5h14l2 5v4z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  laptop: '<rect x="4" y="5" width="16" height="11" rx="1"/><path d="M2 19h20"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2.4.6 4 2.4 4 5.5"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>',
  fist: '<path d="M6 10V7a2 2 0 0 1 4 0v3M10 9V6a2 2 0 0 1 4 0v4M14 9V7a2 2 0 0 1 4 0v6a7 7 0 0 1-7 7H9a5 5 0 0 1-5-5v-3a2 2 0 0 1 4 0"/>',
  euro: '<path d="M17 6a7 7 0 1 0 0 12M4 10h9M4 14h9"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  scale: '<path d="M12 3v18M5 21h14M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  phone: '<rect x="6.5" y="2" width="11" height="20" rx="2.5"/><path d="M11 18.5h2"/>',
};

export const icon = (n, size = 20, cls = '') =>
  `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || P.sparkle}</svg>`;

// Logo : un chemin qui se sépare en deux (un choix), dans un médaillon dégradé.
export const logoMark = (size = 40, id = 'lg') => `<svg width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true">
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b8b"/><stop offset=".5" stop-color="#ff9f5a"/><stop offset="1" stop-color="#7b5cff"/></linearGradient></defs>
  <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#${id})"/>
  <path d="M24 40V27C24 21 19 18 14 14M24 27c0-6 5-9 10-13" stroke="#fff" stroke-width="3.6" fill="none" stroke-linecap="round"/>
  <circle cx="13" cy="13" r="4" fill="#fff"/><circle cx="35" cy="13" r="4" fill="#fff" opacity=".55"/>
</svg>`;

export const logo = (size = 40) => `<span class="logo">${logoMark(size)}<span class="logo-word" style="font-size:${Math.round(size * 0.62)}px">DESTINO</span></span>`;
