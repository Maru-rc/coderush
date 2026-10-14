// Iconos de trazo (24×24) que heredan el color del texto.
const svg = (paths) =>
  `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${paths}</svg>`;

export const icon = {
  check: svg('<path d="M20 6 9 17l-5-5"/>'),
  x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  lock: svg('<rect x="5" y="11" width="14" height="10"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  flame: svg('<path d="M12 22a7 7 0 0 0 7-7c0-3-1.5-5.5-4-8 0 3-1.5 4.5-3 4.5 0-3.5-1-6-3-9.5C9 7 5 10 5 15a7 7 0 0 0 7 7z"/>'),
  bolt: svg('<path d="M13 2 4 14h8l-1 8 9-12h-8l1-8z"/>'),
  play: svg('<path d="M7 4v16l13-8z"/>'),
  arrowRight: svg('<path d="M4 12h16M14 6l6 6-6 6"/>'),
  arrowLeft: svg('<path d="M20 12H4M10 18l-6-6 6-6"/>'),
  reset: svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
  bulb: svg('<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2z"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  chart: svg('<path d="M3 3v18h18"/><path d="M8 17v-4M13 17V8M18 17v-7"/>'),
  sound: svg('<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>'),
  mute: svg('<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/>'),
  unlock: svg('<rect x="5" y="11" width="14" height="10"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>'),
  heartbreak: svg('<path d="M12 21 4 13a5 5 0 0 1 7-7l1 1 1-1a5 5 0 0 1 7 7z"/><path d="m12 7-2 4 3 2-1 4"/>'),
};
