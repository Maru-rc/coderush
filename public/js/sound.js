// Motor de sonido sintetizado (Web Audio, sin archivos).
// Todo pasa por un bus maestro con compresor, reverberación y eco para que suene con cuerpo.

let ctx = null;
let master = null;
let reverbIn = null;
let echoIn = null;
let noiseBuf = null;
let muted = false;

export const setMuted = (m) => (muted = m);
export const isMuted = () => muted;

function impulse(c, seconds, decay) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 10;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.2;
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(comp).connect(ctx.destination);

    const conv = ctx.createConvolver();
    conv.buffer = impulse(ctx, 1.8, 2.8);
    reverbIn = ctx.createGain();
    reverbIn.gain.value = 0.35;
    reverbIn.connect(conv).connect(master);

    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.16;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.3;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 3200;
    echoIn = ctx.createGain();
    echoIn.connect(delay);
    delay.connect(tone).connect(feedback).connect(delay);
    tone.connect(master);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function route(node, verb, echo) {
  node.connect(master);
  if (verb) {
    const g = ctx.createGain();
    g.gain.value = verb;
    node.connect(g).connect(reverbIn);
  }
  if (echo) {
    const g = ctx.createGain();
    g.gain.value = echo;
    node.connect(g).connect(echoIn);
  }
}

function envelope(g, t, gain, attack, dur) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}

function tone(freq, { at = 0, dur = 0.15, type = 'sine', gain = 0.1, attack = 0.005, slide = 0, detune = 0, lp = 0, verb = 0.25, echo = 0 } = {}) {
  const c = ac();
  const t = c.currentTime + at;
  const o = c.createOscillator();
  o.type = type;
  o.detune.value = detune;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  const g = c.createGain();
  envelope(g, t, gain, attack, dur);
  let src = o;
  if (lp) {
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lp;
    o.connect(f);
    src = f;
  }
  src.connect(g);
  route(g, verb, echo);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise({ at = 0, dur = 0.2, gain = 0.08, type = 'bandpass', from = 1000, to = 0, q = 1, attack = 0.005, verb = 0.2 } = {}) {
  const c = ac();
  const t = c.currentTime + at;
  const s = c.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  const f = c.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = c.createGain();
  envelope(g, t, gain, attack, dur);
  s.connect(f).connect(g);
  route(g, verb, 0);
  s.start(t);
  s.stop(t + dur + 0.05);
}

// ───────────── Instrumentos ─────────────
const bell = (f, at = 0, gain = 0.09, dur = 0.6) => {
  tone(f, { at, dur, gain, attack: 0.003, verb: 0.4, echo: 0.25 });
  tone(f * 2.01, { at, dur: dur * 0.5, gain: gain * 0.35, attack: 0.002, verb: 0.3 });
  tone(f * 3.98, { at, dur: dur * 0.25, gain: gain * 0.12, attack: 0.001, verb: 0.3 });
};
const kick = (at = 0, gain = 0.55) => tone(160, { at, dur: 0.3, type: 'sine', gain, attack: 0.002, slide: 0.28, verb: 0 });
const snare = (at = 0, gain = 0.13) => {
  noise({ at, dur: 0.2, gain, type: 'highpass', from: 1600, verb: 0.35 });
  tone(210, { at, dur: 0.1, type: 'triangle', gain: gain * 0.7, slide: 0.7, verb: 0 });
};
const shimmer = (at = 0, dur = 0.6, gain = 0.035) => noise({ at, dur, gain, type: 'highpass', from: 7000, attack: 0.05, verb: 0.6 });
const stab = (freqs, at = 0, dur = 0.7, gain = 0.035) => {
  for (const f of freqs) {
    for (const det of [-8, 8]) tone(f, { at, dur, type: 'sawtooth', gain, attack: 0.01, detune: det, lp: 2600, verb: 0.35 });
  }
};

// Escala ascendente: cada test superado suena más agudo que el anterior.
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093, 2349.32];

const play = (fn) => (...args) => {
  if (muted) return undefined;
  try {
    return fn(...args);
  } catch (err) {
    console.warn('[sonido]', err); // un fallo de audio nunca debe romper la app
    return undefined;
  }
};

export const sfx = {
  click: play(() => tone(880, { dur: 0.04, type: 'triangle', gain: 0.05, verb: 0 })),

  // Al pulsar Probar: arranque corto.
  runStart: play(() => {
    noise({ dur: 0.22, gain: 0.07, from: 500, to: 3500, q: 2.5 });
    tone(660, { dur: 0.05, type: 'square', gain: 0.035, lp: 2400, verb: 0.1 });
    tone(990, { at: 0.06, dur: 0.08, type: 'square', gain: 0.035, lp: 2400, verb: 0.2 });
  }),

  // Al pulsar Enviar: sonido de carga que crece hasta que llegan los resultados.
  submitStart: play(() => {
    const c = ac();
    const t = c.currentTime;
    const rise = 1.8;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(880, t + rise);
    const o2 = c.createOscillator();
    o2.type = 'square';
    o2.frequency.setValueAtTime(55, t);
    o2.frequency.exponentialRampToValueAtTime(440, t + rise);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 6;
    lp.frequency.setValueAtTime(300, t);
    lp.frequency.exponentialRampToValueAtTime(4000, t + rise);
    const s = c.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 3;
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(6000, t + rise);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + rise);
    const gn = c.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(0.06, t + rise);
    // Trémolo que se acelera: sensación de "cargando".
    const lfo = c.createOscillator();
    lfo.frequency.setValueAtTime(6, t);
    lfo.frequency.linearRampToValueAtTime(22, t + rise);
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain).connect(g.gain);
    o.connect(lp);
    o2.connect(lp);
    lp.connect(g);
    s.connect(bp).connect(gn);
    route(g, 0.3, 0);
    route(gn, 0.3, 0);
    tone(1320, { dur: 0.06, type: 'square', gain: 0.04, lp: 3000, verb: 0.1 });
    const nodes = [o, o2, s, lfo];
    nodes.forEach((n) => n.start(t));
    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      const now = c.currentTime;
      for (const gg of [g, gn]) {
        gg.gain.cancelScheduledValues(now);
        gg.gain.setValueAtTime(Math.max(gg.gain.value, 0.0002), now);
        gg.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      }
      nodes.forEach((n) => n.stop(now + 0.1));
    };
  }),

  testPass: play((i, final = false) => {
    const f = SCALE[Math.min(i, SCALE.length - 1)];
    bell(f, 0, 0.085, 0.5);
    tone(f * 4, { at: 0.015, dur: 0.12, gain: 0.012, verb: 0.4 });
    if (final) {
      bell(f * 1.5, 0.09, 0.07, 0.8);
      shimmer(0.05, 0.5, 0.03);
    }
  }),

  testFail: play(() => {
    tone(150, { dur: 0.2, type: 'sine', gain: 0.16, attack: 0.002, slide: 0.5, verb: 0.05 });
    noise({ dur: 0.06, gain: 0.06, type: 'lowpass', from: 700, verb: 0 });
  }),

  // Ejemplos correctos al Probar: power-up.
  runPass: play(() => {
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => tone(f, { at: i * 0.055, dur: 0.12, type: 'square', gain: 0.04, lp: 3200, verb: 0.25, echo: 0.15 }));
    bell(1567.98, 0.3, 0.08, 0.9);
    shimmer(0.28, 0.6, 0.03);
  }),

  // Reto superado al Enviar: impacto + acorde + arpegio + destello.
  success: play(() => {
    kick(0, 0.6);
    snare(0, 0.12);
    tone(65.41, { dur: 0.7, type: 'sine', gain: 0.22, attack: 0.005, verb: 0 });
    stab([261.63, 329.63, 392, 523.25], 0, 0.8, 0.03);
    [1046.5, 1318.51, 1567.98, 2093, 2637.02].forEach((f, i) => bell(f, 0.12 + i * 0.07, 0.07, 0.7));
    shimmer(0.4, 0.9, 0.04);
    kick(0.48, 0.35);
    stab([392, 523.25, 659.25, 783.99], 0.48, 1.1, 0.025);
  }),

  // Envío fallido: "denegado", sin ser molesto.
  fail: play(() => {
    tone(392, { dur: 0.14, type: 'triangle', gain: 0.1, lp: 2400 });
    tone(311.13, { at: 0.13, dur: 0.35, type: 'triangle', gain: 0.1, lp: 2400, slide: 0.94 });
    tone(98, { dur: 0.45, type: 'sine', gain: 0.14, verb: 0 });
  }),

  // Envío fallido pero muy cerca: sube con ilusión y cae.
  nearMiss: play(() => {
    tone(330, { dur: 0.25, type: 'triangle', gain: 0.08, slide: 2, verb: 0.3 });
    tone(622.25, { at: 0.26, dur: 0.12, type: 'triangle', gain: 0.08 });
    tone(587.33, { at: 0.37, dur: 0.12, type: 'triangle', gain: 0.07 });
    tone(466.16, { at: 0.48, dur: 0.4, type: 'triangle', gain: 0.07, slide: 0.97 });
  }),

  // El código ni siquiera se ejecuta: glitch.
  error: play(() => {
    for (let i = 0; i < 5; i++) tone(i % 2 ? 180 : 240, { at: i * 0.045, dur: 0.04, type: 'square', gain: 0.045, lp: 1800, verb: 0.05 });
    tone(110, { at: 0.22, dur: 0.3, type: 'sawtooth', gain: 0.06, lp: 600, slide: 0.6 });
  }),

  coin: play(() => {
    tone(987.77, { dur: 0.07, type: 'square', gain: 0.035, lp: 5000, verb: 0.1 });
    tone(1318.51, { at: 0.07, dur: 0.28, type: 'square', gain: 0.035, lp: 5000, verb: 0.2, echo: 0.15 });
  }),

  tick: play(() => tone(2400, { dur: 0.02, type: 'square', gain: 0.008, verb: 0 })),

  crit: play(() => {
    kick(0, 0.5);
    tone(110, { dur: 0.38, type: 'sawtooth', gain: 0.05, slide: 16, lp: 5000, verb: 0.3 });
    noise({ dur: 0.38, gain: 0.06, from: 300, to: 8000, q: 2 });
    kick(0.38, 0.6);
    snare(0.38, 0.14);
    stab([523.25, 659.25, 783.99, 1046.5], 0.38, 0.9, 0.03);
    [2093, 2637.02, 3135.96].forEach((f, i) => bell(f, 0.42 + i * 0.06, 0.06));
  }),

  achievement: play(() => {
    [1318.51, 1567.98, 2093, 2637.02].forEach((f, i) => bell(f, i * 0.07, 0.07, 0.8));
    shimmer(0.1, 0.7, 0.03);
  }),

  levelUp: play(() => {
    kick(0, 0.6);
    [392, 523.25, 659.25, 783.99].forEach((f, i) => tone(f, { at: i * 0.09, dur: 0.16, type: 'sawtooth', gain: 0.05, lp: 2800, verb: 0.3 }));
    kick(0.42, 0.6);
    snare(0.42, 0.14);
    stab([261.63, 329.63, 392, 523.25, 659.25], 0.42, 1.4, 0.028);
    tone(65.41, { at: 0.42, dur: 1.2, type: 'sine', gain: 0.2, verb: 0 });
    [1046.5, 1318.51, 1567.98, 2093, 2637.02, 3135.96].forEach((f, i) => bell(f, 0.55 + i * 0.06, 0.06, 0.9));
    shimmer(0.5, 1.4, 0.045);
  }),

  unlock: play(() => {
    noise({ dur: 0.35, gain: 0.06, from: 300, to: 5000, q: 2 });
    [392, 587.33, 783.99].forEach((f, i) => bell(f, 0.2 + i * 0.09, 0.08, 0.7));
  }),
};
