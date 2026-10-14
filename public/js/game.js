// Motor de progresión: XP, niveles, rachas, combos, logros, meta diaria, desbloqueos y lecciones.
import { LESSONS } from './lessons.js';
import { NEST_LESSONS } from './nest-content.js';

export const LANGS = {
  javascript: { label: 'JavaScript', short: 'JS', monaco: 'javascript' },
  typescript: { label: 'TypeScript', short: 'TS', monaco: 'typescript' },
  python: { label: 'Python', short: 'PY', monaco: 'python' },
};

export const DIFFICULTY = {
  facil: { label: 'Fácil', speed: 120 },
  medio: { label: 'Medio', speed: 300 },
  dificil: { label: 'Difícil', speed: 600 },
};

export const DAILY_GOAL = 3;
const DAILY_GOAL_XP = 30;
const ACHIEVEMENT_XP = 20;
export const LESSON_XP = 20;
const LESSON_PERFECT_XP = 10;
const CRIT_CHANCE = 0.12;
const UNLOCK_RULES = {
  medio: { from: 'facil', count: 3 },
  dificil: { from: 'medio', count: 4 },
};

const TITLES = [
  [1, 'Novato'], [3, 'Aprendiz'], [5, 'Explorador'], [8, 'Programador'],
  [11, 'Hacker'], [14, 'Arquitecto'], [17, 'Maestro'], [20, 'Leyenda'],
];

export const xpToNext = (level) => 50 + 25 * (level - 1);

export function levelInfo(xp) {
  let level = 1;
  let rem = xp;
  while (rem >= xpToNext(level)) {
    rem -= xpToNext(level);
    level++;
  }
  const title = TITLES.filter(([l]) => level >= l).pop()[1];
  return { level, current: rem, needed: xpToNext(level), title };
}

// ───────────── Fechas (zona horaria local) ─────────────
const dayStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const today = () => dayStr(new Date());
export const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayStr(d);
};
export const dayOffset = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return dayStr(d);
};

// ───────────── Estado ─────────────
const defaults = () => ({
  version: 1,
  xp: 0,
  solved: {}, // { [id]: { [lang]: { at, fails, seconds, hints, xp } } }
  failed: {}, // { "id|lang": n }
  hints: {}, // { id: pistas reveladas }
  streak: { current: 0, best: 0, lastDay: null },
  activity: {}, // { 'YYYY-MM-DD': retos resueltos ese día }
  combo: 0,
  bestCombo: 0,
  achievements: {}, // { id: timestamp }
  dailyGoalDone: {},
  unlocked: { medio: false, dificil: false },
  drafts: {}, // { "id|lang": código }
  lessons: {}, // { id: { tries, at? } } — `at` marca la lección como completada
  nest: { solved: {}, failed: {} }, // actividades de NestJS: solved { id: { at, fails, hints, seconds, xp } }
  stats: { submissions: 0, successes: 0, runs: 0, crits: 0 },
  settings: { sound: true, lang: 'javascript' },
});

export let state = defaults();
export let challenges = [];
let byId = new Map();
export let nestActivities = [];
export const setNestActivities = (list) => (nestActivities = list);

export async function init(list) {
  challenges = list;
  byId = new Map(list.map((c) => [c.id, c]));
  let loaded = null;
  try {
    loaded = await fetch('/api/progress').then((r) => r.json());
  } catch {}
  if (!loaded) {
    try {
      loaded = JSON.parse(localStorage.getItem('coderush-backup') || 'null');
    } catch {}
  }
  const base = defaults();
  if (loaded) {
    for (const k of Object.keys(base)) {
      if (loaded[k] === undefined) continue;
      base[k] = base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) ? { ...base[k], ...loaded[k] } : loaded[k];
    }
  }
  state = base;
  // Al cargar, si ya se cumplen los requisitos no celebramos de nuevo.
  for (const tier of Object.keys(UNLOCK_RULES)) if (tierUnlocked(tier)) state.unlocked[tier] = true;
}

let saveTimer = null;
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 600);
}
export function flush() {
  clearTimeout(saveTimer);
  const json = JSON.stringify(state);
  try {
    localStorage.setItem('coderush-backup', json);
  } catch {}
  return fetch('/api/progress', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: json, keepalive: json.length < 60000 }).catch(() => {});
}
addEventListener('beforeunload', () => flush());

export function resetProgress() {
  const settings = state.settings;
  state = defaults();
  state.settings = settings;
  return flush();
}

// ───────────── Consultas ─────────────
export const solvedLangs = (id) => Object.keys(state.solved[id] || {});
export const isSolved = (id, lang) => (lang ? !!state.solved[id]?.[lang] : solvedLangs(id).length > 0);
export const uniqueSolved = () => Object.keys(state.solved).filter((id) => byId.has(id) && solvedLangs(id).length).length;
export const totalSolves = () => Object.values(state.solved).reduce((n, langs) => n + Object.keys(langs).length, 0);
const solvedInLang = (lang) => Object.values(state.solved).filter((l) => l[lang]).length;
const solvedInTier = (tier) => challenges.filter((c) => c.difficulty === tier && isSolved(c.id)).length;
const allEntries = () => Object.values(state.solved).flatMap((l) => Object.values(l));

export function tierUnlocked(tier) {
  const rule = UNLOCK_RULES[tier];
  return !rule || solvedInTier(rule.from) >= rule.count;
}
export function unlockProgress(tier) {
  const rule = UNLOCK_RULES[tier];
  return rule ? { have: Math.min(solvedInTier(rule.from), rule.count), need: rule.count, from: rule.from } : null;
}

function hashStr(s) {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
export const dailyChallenge = () => challenges[hashStr('coderush' + today()) % challenges.length];
export const isDaily = (id) => dailyChallenge()?.id === id;
export const isAvailable = (c) => tierUnlocked(c.difficulty) || isDaily(c.id);

export function streakInfo() {
  const { current, best, lastDay } = state.streak;
  const alive = lastDay === today() || lastDay === yesterday();
  return { current: alive ? current : 0, best, doneToday: lastDay === today(), atRisk: lastDay === yesterday() && current > 0 };
}
export const todayCount = () => state.activity[today()] || 0;

export function nextChallenge(lang, afterId) {
  const order = challenges.filter(isAvailable);
  const start = Math.max(0, order.findIndex((c) => c.id === afterId) + 1);
  const rotated = [...order.slice(start), ...order.slice(0, start)];
  return rotated.find((c) => !isSolved(c.id)) || rotated.find((c) => !isSolved(c.id, lang) && c.id !== afterId) || null;
}

export const lessonDone = (id) => !!state.lessons[id]?.at;
export const lessonsDone = () => LESSONS.filter((l) => lessonDone(l.id)).length;
export const nestLessonsDone = () => NEST_LESSONS.filter((l) => lessonDone(l.id)).length;
export const nestSolved = (id) => !!state.nest.solved[id];
export const nestSolvedCount = () => nestActivities.filter((a) => nestSolved(a.id)).length;
const nestHintKey = (id) => `nest:${id}`;
export const nestHints = (id) => state.hints[nestHintKey(id)] || 0;
export const recordNestHint = (id) => recordHint(nestHintKey(id));

export function draftKey(id, lang) {
  return `${id}|${lang}`;
}

// ───────────── Logros ─────────────
export const ACHIEVEMENTS = [
  { id: 'primer-paso', mark: '01', name: 'Hola, mundo', desc: 'Resuelve tu primer reto', check: () => uniqueSolved() >= 1 },
  { id: 'calentando', mark: '05', name: 'Calentando motores', desc: 'Resuelve 5 retos distintos', check: () => uniqueSolved() >= 5 },
  { id: 'imparable', mark: '15', name: 'Imparable', desc: 'Resuelve 15 retos distintos', check: () => uniqueSolved() >= 15 },
  { id: 'veterano', mark: '30', name: 'Veterano', desc: 'Resuelve 30 retos distintos', check: () => uniqueSolved() >= 30 },
  { id: 'completista', mark: 'ALL', name: 'Completista', desc: 'Resuelve todos los retos', check: () => uniqueSolved() >= challenges.length },
  { id: 'fundamentos', mark: 'F✓', name: 'Bases sólidas', desc: 'Resuelve todos los retos fáciles', check: () => solvedInTier('facil') >= challenges.filter((c) => c.difficulty === 'facil').length },
  { id: 'primer-dificil', mark: 'D1', name: 'Rompecabezas', desc: 'Resuelve tu primer reto difícil', check: () => solvedInTier('dificil') >= 1 },
  { id: 'poliglota', mark: '3L', name: 'Políglota', desc: 'Resuelve un mismo reto en los 3 lenguajes', check: () => Object.values(state.solved).some((l) => Object.keys(l).length >= 3) },
  { id: 'triple', mark: 'JTP', name: 'Triple amenaza', desc: 'Resuelve al menos un reto en cada lenguaje', check: () => Object.keys(LANGS).every((l) => solvedInLang(l) > 0) },
  { id: 'js-10', mark: 'JS', name: 'Ninja de JavaScript', desc: 'Resuelve 10 retos en JavaScript', check: () => solvedInLang('javascript') >= 10 },
  { id: 'ts-10', mark: 'TS', name: 'Señor de los tipos', desc: 'Resuelve 10 retos en TypeScript', check: () => solvedInLang('typescript') >= 10 },
  { id: 'py-10', mark: 'PY', name: 'Pythonista', desc: 'Resuelve 10 retos en Python', check: () => solvedInLang('python') >= 10 },
  { id: 'francotirador', mark: '1º', name: 'Francotirador', desc: 'Resuelve 5 retos al primer intento', check: () => allEntries().filter((e) => e.fails === 0).length >= 5 },
  { id: 'mente', mark: '0?', name: 'Mente brillante', desc: 'Resuelve 10 retos sin usar pistas', check: () => allEntries().filter((e) => !e.hints).length >= 10 },
  { id: 'combo-3', mark: 'x3', name: 'En racha', desc: 'Consigue un combo x3', check: () => state.bestCombo >= 3 },
  { id: 'combo-7', mark: 'x7', name: 'Tornado', desc: 'Consigue un combo x7', check: () => state.bestCombo >= 7 },
  { id: 'racha-3', mark: '3d', name: 'Hábito', desc: 'Mantén una racha de 3 días', check: () => state.streak.best >= 3 },
  { id: 'racha-7', mark: '7d', name: 'Semana perfecta', desc: 'Mantén una racha de 7 días', check: () => state.streak.best >= 7 },
  { id: 'racha-30', mark: '30d', name: 'Disciplina de acero', desc: 'Mantén una racha de 30 días', check: () => state.streak.best >= 30 },
  { id: 'meta-diaria', mark: '3/3', name: 'Cumplidor', desc: 'Completa la meta diaria', check: () => Object.keys(state.dailyGoalDone).length >= 1 },
  { id: 'reto-dia', mark: 'HOY', name: 'Puntual', desc: 'Completa un reto del día', check: (ctx) => ctx?.daily },
  { id: 'velocista', mark: '60s', name: 'Velocista', desc: 'Resuelve un reto en menos de 60 segundos', check: (ctx) => ctx && ctx.seconds < 60 },
  { id: 'persistente', mark: '5+', name: 'Persistente', desc: 'Resuelve un reto tras 5 o más intentos fallidos', check: (ctx) => ctx && ctx.fails >= 5 },
  { id: 'critico', mark: '2×', name: '¡Crítico!', desc: 'Consigue un golpe crítico de XP', check: () => state.stats.crits >= 1 },
  { id: 'noctambulo', mark: '0h', name: 'Noctámbulo', desc: 'Resuelve un reto entre las 0:00 y las 5:00', check: (ctx) => ctx && ctx.hour < 5 },
  { id: 'madrugador', mark: '5h', name: 'Madrugador', desc: 'Resuelve un reto entre las 5:00 y las 8:00', check: (ctx) => ctx && ctx.hour >= 5 && ctx.hour < 8 },
  { id: 'leccion-1', mark: 'AP1', name: 'Estudiante', desc: 'Completa tu primera lección', check: () => lessonsDone() >= 1 },
  { id: 'leccion-6', mark: 'AP6', name: 'Estudioso', desc: 'Completa 6 lecciones', check: () => lessonsDone() >= 6 },
  { id: 'academia', mark: 'APR', name: 'Académico', desc: 'Completa todas las lecciones', check: () => lessonsDone() >= LESSONS.length },
  { id: 'teoria-practica', mark: 'T+P', name: 'Teoría y práctica', desc: 'Completa una lección y resuelve todos sus retos', check: () => LESSONS.some((l) => lessonDone(l.id) && l.challenges.every((id) => isSolved(id))) },
  { id: 'nest-1', mark: 'N1', name: 'Hola, Nest', desc: 'Completa tu primera actividad de NestJS', check: () => nestSolvedCount() >= 1 },
  { id: 'nest-5', mark: 'N5', name: 'Backend en marcha', desc: 'Completa 5 actividades de NestJS', check: () => nestSolvedCount() >= 5 },
  { id: 'nest-todas', mark: 'NST', name: 'Arquitecto Nest', desc: 'Completa todas las actividades de NestJS', check: () => nestActivities.length > 0 && nestSolvedCount() >= nestActivities.length },
  { id: 'nest-teoria', mark: 'NLX', name: 'Teoría de Nest', desc: 'Completa todas las lecciones de NestJS', check: () => nestLessonsDone() >= NEST_LESSONS.length },
  { id: 'nivel-5', mark: 'L5', name: 'Explorador', desc: 'Alcanza el nivel 5', check: () => levelInfo(state.xp).level >= 5 },
  { id: 'nivel-10', mark: 'L10', name: 'Doble dígito', desc: 'Alcanza el nivel 10', check: () => levelInfo(state.xp).level >= 10 },
  { id: 'nivel-20', mark: 'L20', name: 'Leyenda', desc: 'Alcanza el nivel 20', check: () => levelInfo(state.xp).level >= 20 },
];

function checkAchievements(ctx) {
  const unlocked = [];
  let found = true;
  while (found) {
    found = false;
    for (const a of ACHIEVEMENTS) {
      if (state.achievements[a.id] || !a.check(ctx)) continue;
      state.achievements[a.id] = Date.now();
      state.xp += ACHIEVEMENT_XP;
      unlocked.push(a);
      found = true; // el XP extra puede desbloquear logros de nivel
    }
  }
  return unlocked;
}

// ───────────── Eventos de juego ─────────────
// Cuenta un ejercicio resuelto hoy: mantiene la racha y suma a la meta diaria.
function recordDailyProgress(lines) {
  const d = today();
  let streakUp = false;
  if (state.streak.lastDay !== d) {
    state.streak.current = state.streak.lastDay === yesterday() ? state.streak.current + 1 : 1;
    state.streak.lastDay = d;
    state.streak.best = Math.max(state.streak.best, state.streak.current);
    streakUp = true;
  }
  state.activity[d] = (state.activity[d] || 0) + 1;
  let dailyGoal = false;
  if (state.activity[d] >= DAILY_GOAL && !state.dailyGoalDone[d]) {
    state.dailyGoalDone[d] = true;
    state.xp += DAILY_GOAL_XP;
    lines.push({ label: 'Meta diaria', add: DAILY_GOAL_XP });
    dailyGoal = true;
  }
  return { streakUp, dailyGoal };
}

export function recordRun() {
  state.stats.runs++;
  save();
}

export function recordHint(id) {
  state.hints[id] = (state.hints[id] || 0) + 1;
  save();
}

export function recordFail(id, lang) {
  const key = draftKey(id, lang);
  state.failed[key] = (state.failed[key] || 0) + 1;
  state.stats.submissions++;
  const lostCombo = state.combo;
  state.combo = 0;
  save();
  return { lostCombo, fails: state.failed[key] };
}

export function recordSolve({ challenge, lang, seconds }) {
  const { id, difficulty } = challenge;
  state.stats.submissions++;
  state.stats.successes++;

  if (state.solved[id]?.[lang]) {
    save();
    return { repeat: true };
  }

  const xpBefore = state.xp;
  const levelBefore = levelInfo(xpBefore).level;
  const fails = state.failed[draftKey(id, lang)] || 0;
  const hints = state.hints[id] || 0;
  const otherLangs = solvedLangs(id).length;
  const daily = isDaily(id);
  const lines = [];

  let base = challenge.xp;
  if (otherLangs) base = Math.round(base / 2);
  lines.push({ label: otherLangs ? `Base ${DIFFICULTY[difficulty].label.toLowerCase()} · nuevo lenguaje` : `Base ${DIFFICULTY[difficulty].label.toLowerCase()}`, add: base });
  let total = base;
  const bonus = (label, pct) => {
    const add = Math.max(1, Math.round(base * pct));
    lines.push({ label, add });
    total += add;
  };
  if (fails === 0) bonus('Primer intento', 0.5);
  if (!hints) bonus('Sin pistas', 0.25);
  if (seconds <= DIFFICULTY[difficulty].speed) bonus('Velocidad', 0.25);

  state.combo++;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  if (state.combo >= 2) {
    const mult = 1 + Math.min(state.combo - 1, 5) * 0.1;
    const add = Math.round(total * (mult - 1));
    lines.push({ label: `Combo ×${mult.toFixed(1)}`, add });
    total += add;
  }
  if (daily) {
    lines.push({ label: 'Reto del día ×2', add: total });
    total *= 2;
  }
  const crit = Math.random() < CRIT_CHANCE;
  if (crit) {
    lines.push({ label: 'Golpe crítico ×2', add: total, crit: true });
    total *= 2;
    state.stats.crits++;
  }

  state.xp += total;
  state.solved[id] = { ...(state.solved[id] || {}), [lang]: { at: Date.now(), fails, seconds, hints, xp: total } };
  const { streakUp, dailyGoal } = recordDailyProgress(lines);

  // Desbloqueo de dificultades
  const newTiers = [];
  for (const tier of Object.keys(UNLOCK_RULES)) {
    if (!state.unlocked[tier] && tierUnlocked(tier)) {
      state.unlocked[tier] = true;
      newTiers.push(tier);
    }
  }

  const achievements = checkAchievements({ seconds, fails, daily, hour: new Date().getHours() });
  for (const a of achievements) lines.push({ label: `Logro · ${a.name}`, add: ACHIEVEMENT_XP, achievement: true });

  save();
  return {
    repeat: false,
    lines,
    xpBefore,
    xpAfter: state.xp,
    gained: state.xp - xpBefore,
    levelBefore,
    levelAfter: levelInfo(state.xp).level,
    crit,
    combo: state.combo,
    streakUp,
    streak: state.streak.current,
    dailyGoal,
    newTiers,
    achievements,
  };
}

// Quiz de una lección. Solo el primer aprobado da XP; repetirlo después es práctica libre.
export function recordQuiz(id, passed) {
  const entry = (state.lessons[id] ||= { tries: 0 });
  if (entry.at) return { repeat: true, passed };
  entry.tries++;
  if (!passed) {
    save();
    return { repeat: false, passed: false, tries: entry.tries };
  }

  const xpBefore = state.xp;
  const levelBefore = levelInfo(xpBefore).level;
  entry.at = Date.now();
  const lines = [{ label: 'Lección completada', add: LESSON_XP }];
  if (entry.tries === 1) lines.push({ label: 'Quiz perfecto a la primera', add: LESSON_PERFECT_XP });
  state.xp += lines.reduce((n, l) => n + l.add, 0);

  const achievements = checkAchievements();
  for (const a of achievements) lines.push({ label: `Logro · ${a.name}`, add: ACHIEVEMENT_XP, achievement: true });

  save();
  return {
    repeat: false,
    passed: true,
    lines,
    xpBefore,
    xpAfter: state.xp,
    gained: state.xp - xpBefore,
    levelBefore,
    levelAfter: levelInfo(state.xp).level,
    achievements,
  };
}

// Actividad de NestJS. Sin combo ni crítico: el XP depende de la dificultad, el primer intento y las pistas.
export function recordNestResult(activity, passed, seconds) {
  const { id, difficulty } = activity;
  state.stats.submissions++;
  if (!passed) {
    state.nest.failed[id] = (state.nest.failed[id] || 0) + 1;
    save();
    return { passed: false, fails: state.nest.failed[id] };
  }
  state.stats.successes++;
  if (state.nest.solved[id]) {
    save();
    return { passed: true, repeat: true };
  }

  const xpBefore = state.xp;
  const levelBefore = levelInfo(xpBefore).level;
  const fails = state.nest.failed[id] || 0;
  const hints = nestHints(id);
  const base = activity.xp;
  const lines = [{ label: `Base ${DIFFICULTY[difficulty].label.toLowerCase()} · NestJS`, add: base }];
  if (fails === 0) lines.push({ label: 'Primer intento', add: Math.round(base * 0.5) });
  if (!hints) lines.push({ label: 'Sin pistas', add: Math.round(base * 0.25) });
  const total = lines.reduce((n, l) => n + l.add, 0);
  state.xp += total;
  state.nest.solved[id] = { at: Date.now(), fails, hints, seconds, xp: total };
  const { streakUp, dailyGoal } = recordDailyProgress(lines);

  const achievements = checkAchievements({ seconds, fails, hour: new Date().getHours() });
  for (const a of achievements) lines.push({ label: `Logro · ${a.name}`, add: ACHIEVEMENT_XP, achievement: true });

  save();
  return {
    passed: true,
    repeat: false,
    lines,
    xpBefore,
    xpAfter: state.xp,
    gained: state.xp - xpBefore,
    levelBefore,
    levelAfter: levelInfo(state.xp).level,
    crit: false,
    combo: state.combo,
    streakUp,
    streak: state.streak.current,
    dailyGoal,
    newTiers: [],
    achievements,
  };
}
