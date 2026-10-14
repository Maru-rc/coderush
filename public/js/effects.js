// Estímulos: sonidos sintetizados, confeti, toasts, textos flotantes y contadores animados.

// El sonido vive en sound.js; se reexporta aquí para mantener un único punto de entrada.
export { sfx, setMuted, isMuted } from './sound.js';

// ───────────── Confeti ─────────────
const canvas = document.getElementById('fx');
const ctx2d = canvas.getContext('2d');
let particles = [];
let rafId = null;
const COLORS = ['#ff5a1f', '#ffd84d', '#17140f', '#178a50', '#2f6fde', '#fffcf5'];

function resize() {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
}
addEventListener('resize', resize);
resize();

function loop() {
  ctx2d.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx2d.clearRect(0, 0, innerWidth, innerHeight);
  const now = performance.now();
  // Además del contador de frames, caducan por tiempo (si la pestaña se oculta no quedan congelados).
  particles = particles.filter((p) => p.life > 0 && p.y < innerHeight + 40 && now - p.born < 7000);
  for (const p of particles) {
    p.vy += p.g;
    p.vx *= 0.99;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life--;
    ctx2d.save();
    ctx2d.globalAlpha = Math.min(1, p.life / 40);
    ctx2d.translate(p.x, p.y);
    ctx2d.rotate(p.rot);
    ctx2d.fillStyle = p.color;
    if (p.shape === 'circle') {
      ctx2d.beginPath();
      ctx2d.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx2d.fill();
    } else ctx2d.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    ctx2d.restore();
  }
  rafId = particles.length ? requestAnimationFrame(loop) : null;
}

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function confetti({ x = innerWidth / 2, y = innerHeight / 2, count = 120, spread = 1, power = 1 } = {}) {
  if (reducedMotion) return;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = (4 + Math.random() * 9) * power;
    particles.push({
      x, y,
      vx: Math.cos(a) * v * spread,
      vy: Math.sin(a) * v - 6 * power,
      g: 0.25,
      size: 6 + Math.random() * 7,
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.4,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      shape: 'rect',
      life: 140 + Math.random() * 60,
      born: performance.now(),
    });
  }
  if (!rafId) rafId = requestAnimationFrame(loop);
}

export function confettiRain(duration = 2200) {
  if (reducedMotion) return;
  const end = performance.now() + duration;
  (function drop() {
    for (let i = 0; i < 6; i++) {
      particles.push({
        x: Math.random() * innerWidth, y: -20,
        vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3, g: 0.08,
        size: 7 + Math.random() * 7, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
        color: COLORS[(Math.random() * COLORS.length) | 0], shape: 'rect', life: 400, born: performance.now(),
      });
    }
    if (!rafId) rafId = requestAnimationFrame(loop);
    if (performance.now() < end) setTimeout(drop, 30);
  })();
}

export function confettiFrom(el, opts) {
  const r = el.getBoundingClientRect();
  confetti({ x: r.left + r.width / 2, y: r.top + r.height / 2, ...opts });
}

// ───────────── Toasts y textos flotantes ─────────────
export function toast({ icon = '!', title, text = '', kind = 'info', duration = 4200 }) {
  const root = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast toast-${kind}`;
  el.innerHTML = `<div class="toast-icon">${icon}</div><div class="toast-body"><div class="toast-title">${title}</div>${text ? `<div class="toast-text">${text}</div>` : ''}</div>`;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 400);
  }, duration);
}

export function floatText(text, x, y, color) {
  const el = document.createElement('div');
  el.className = 'float-text';
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  if (color) el.style.color = color;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

export function floatFrom(el, text, color) {
  const r = el.getBoundingClientRect();
  floatText(text, r.left + r.width / 2, r.top, color);
}

export function shake(el) {
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}

export function pulse(el, cls = 'pulse') {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

export function countUp(el, from, to, duration = 900, onTick) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    let lastShown = from;
    function frame(now) {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (to - from) * eased);
      el.textContent = v;
      if (v !== lastShown && onTick) onTick(v);
      lastShown = v;
      if (p < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
