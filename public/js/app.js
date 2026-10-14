import * as game from './game.js';
import { LANGS, DIFFICULTY, DAILY_GOAL, ACHIEVEMENTS, LESSON_XP, levelInfo, state } from './game.js';
import { LESSONS, lessonById, lessonsForChallenge, pick } from './lessons.js';
import { highlightLines } from './highlight.js';
import { createEditor } from './editor.js';
import { explain } from './errors.js';
import { icon } from './icons.js';
import { sfx, setMuted, confetti, confettiFrom, confettiRain, toast, floatFrom, shake, pulse, countUp, wait } from './effects.js';

const $ = (sel, root = document) => root.querySelector(sel);
const app = $('#app');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// Texto del servidor con `código` entre comillas invertidas → HTML seguro.
const rich = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
const stripTags = (s) => s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const pad = (n) => String(n).padStart(2, '0');
const dias = (n) => `${n} día${n === 1 ? '' : 's'}`;

const api = {
  challenges: () => fetch('/api/challenges').then((r) => r.json()),
  async run(challengeId, language, code, mode) {
    let r;
    try {
      r = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, language, code, mode }),
      });
    } catch {
      throw new Error('Sin conexión con el servidor. Comprueba que la terminal con `npm start` siga abierta.');
    }
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `El servidor respondió con un error (${r.status}).`);
    return data;
  },
};

// ───────────── Presentación de código ─────────────
const PY_TYPES = {
  number: 'int', string: 'str', boolean: 'bool', 'number[]': 'list[int]', 'number[][]': 'list[list[int]]',
  'string[]': 'list[str]', 'any[]': 'list', 'Record<string, number>': 'dict[str, int]', 'number | null': 'int | None',
};

const fnName = (c, lang) => (lang === 'python' ? c.pyFn : c.fn);
const numOf = (c) => pad(game.challenges.indexOf(c) + 1);

function signature(c, lang) {
  if (lang === 'python') {
    const ps = c.params.map(([n, t, py]) => `${n}: ${py || PY_TYPES[t]}`).join(', ');
    return `def ${c.pyFn}(${ps}) -> ${c.pyReturns || PY_TYPES[c.returns]}`;
  }
  if (lang === 'typescript') return `function ${c.fn}(${c.params.map(([n, t]) => `${n}: ${t}`).join(', ')}): ${c.returns}`;
  return `function ${c.fn}(${c.params.map((p) => p[0]).join(', ')})`;
}

function starter(c, lang) {
  if (lang === 'python') return `${signature(c, lang)}:\n    # Escribe tu código aquí\n    pass\n`;
  return `${signature(c, lang)} {\n  // Escribe tu código aquí\n  \n}\n`;
}

function fmt(v, lang) {
  const py = lang === 'python';
  if (v === null || v === undefined) return py ? 'None' : 'null';
  if (typeof v === 'boolean') return py ? (v ? 'True' : 'False') : String(v);
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map((x) => fmt(x, lang)).join(', ')}]`;
  if (typeof v === 'object') {
    const entries = Object.entries(v);
    if (!entries.length) return '{}';
    const key = (k) => (py || !/^[A-Za-z_$][\w$]*$/.test(k) ? JSON.stringify(k) : k);
    return `{ ${entries.map(([k, x]) => `${key(k)}: ${fmt(x, lang)}`).join(', ')} }`;
  }
  return String(v);
}

const callStr = (c, lang, args) => `${fnName(c, lang)}(${args.map((a) => fmt(a, lang)).join(', ')})`;
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const comboMult = (n) => (1 + Math.min(Math.max(n, 1) - 1, 5) * 0.1).toFixed(1);
const diffSq = (d) => `<i class="sq sq-${d}"></i>`;

// ───────────── HUD ─────────────
let hudSnapshot = null;

function updateHud({ animate = false } = {}) {
  const info = levelInfo(state.xp);
  const streak = game.streakInfo();
  const goal = game.todayCount();
  const achCount = Object.keys(state.achievements).length;

  $('#levelBadge').textContent = info.level;
  $('#levelTitle').textContent = info.title;
  $('#xpText').textContent = `${info.current}/${info.needed} XP`;
  $('#xpFill').style.width = `${(info.current / info.needed) * 100}%`;

  $('#streakVal').textContent = streak.current;
  const streakEl = $('#streak');
  streakEl.classList.toggle('lit', streak.doneToday);
  streakEl.classList.toggle('risk', streak.atRisk);
  streakEl.title = streak.atRisk
    ? `Tu racha de ${dias(streak.current)} se pierde a medianoche. Resuelve un reto hoy.`
    : `Racha: ${dias(streak.current)} (mejor: ${streak.best})`;

  $('#goalBoxes').innerHTML = Array.from({ length: DAILY_GOAL }, (_, i) => `<i class="${i < goal ? 'on' : ''}"></i>`).join('');
  $('#goal').classList.toggle('done', goal >= DAILY_GOAL);
  $('#goal').title = goal >= DAILY_GOAL ? 'Meta diaria cumplida' : `Meta diaria: ${DAILY_GOAL} retos hoy (+30 XP)`;

  $('#combo').hidden = state.combo < 2;
  $('#comboVal').textContent = comboMult(state.combo);
  $('#achCount').textContent = `${achCount}/${ACHIEVEMENTS.length}`;
  $('#btnSound').innerHTML = state.settings.sound ? icon.sound : icon.mute;

  if (animate && hudSnapshot) {
    if (info.level !== hudSnapshot.level) pulse($('.lvl'), 'pop');
    if (streak.current !== hudSnapshot.streak) pulse(streakEl, 'pop');
    if (goal !== hudSnapshot.goal) pulse($('#goalBoxes'), 'pop');
    if (achCount !== hudSnapshot.ach) pulse($('#btnAchievements'), 'pop');
    if (state.combo !== hudSnapshot.combo && state.combo >= 2) pulse($('#combo'), 'pop');
  }
  hudSnapshot = { level: info.level, streak: streak.current, goal, ach: achCount, combo: state.combo };
}

// ───────────── Router ─────────────
let cleanup = [];
function teardown() {
  cleanup.forEach((fn) => fn());
  cleanup = [];
}

function route() {
  teardown();
  closeModal();
  const hash = location.hash;
  let m;
  if ((m = hash.match(/^#\/reto\/([\w-]+)/))) renderChallenge(m[1]);
  else if ((m = hash.match(/^#\/aprender\/([\w-]+)/))) renderLesson(TRACKS.aprender, m[1]);
  else if (/^#\/aprender\/?$/.test(hash)) renderLearn();
  else renderHome();
  const section = hash.startsWith('#/aprender') ? 'aprender' : 'retos';
  document.querySelectorAll('.topnav a').forEach((a) => a.classList.toggle('on', a.dataset.nav === section));
  scrollTo(0, 0);
}

// ───────────── Vista: tablero ─────────────
const homeFilters = { difficulty: 'todos', status: 'todos', category: 'todas' };

function msUntilMidnight() {
  const n = new Date();
  const m = new Date(n);
  m.setHours(24, 0, 0, 0);
  return m - n;
}
const hhmmss = (ms) => {
  const s = Math.floor(ms / 1000);
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(pad).join(':');
};

function motivation() {
  const streak = game.streakInfo();
  const goal = game.todayCount();
  if (streak.atRisk) return `Tu racha de <b>${dias(streak.current)}</b> se pierde a medianoche. Un reto basta para salvarla.`;
  if (game.uniqueSolved() === 0) return 'Empieza por el Nº 01: tu primer reto desbloquea tu primer logro. ¿Prefieres repasar la teoría antes? Pasa por <a href="#/aprender">Aprender</a>.';
  if (goal < DAILY_GOAL) {
    const left = DAILY_GOAL - goal;
    return `Te ${left === 1 ? 'falta <b>1 reto</b>' : `faltan <b>${left} retos</b>`} para la meta diaria (+30 XP).`;
  }
  return 'Meta diaria cumplida. Cada reto extra sigue sumando XP y combo.';
}

function seg(id, options, current, attr = 'v') {
  return `<div class="seg" id="${id}">${options.map(([v, l]) => `<button class="${v === current ? 'on' : ''}" data-${attr}="${v}">${l}</button>`).join('')}</div>`;
}

const langSeg = () => seg('langPick', Object.entries(LANGS).map(([k, l]) => [k, l.label]), state.settings.lang, 'lang');

function bindLangPick(onChange) {
  $('#langPick').addEventListener('click', (e) => {
    const b = e.target.closest('[data-lang]');
    if (!b || b.dataset.lang === state.settings.lang) return;
    sfx.click();
    state.settings.lang = b.dataset.lang;
    game.save();
    $('#langPick').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    onChange();
  });
}

function langMarks(id) {
  const langs = game.solvedLangs(id);
  return Object.entries(LANGS).map(([k, l]) => `<span class="lm lm-${k} ${langs.includes(k) ? 'on' : ''}" title="${l.label}">${l.short}</span>`).join('');
}

function tileHtml(c, lang) {
  const available = game.isAvailable(c);
  const solvedHere = game.isSolved(c.id, lang);
  const daily = game.isDaily(c.id);
  const cls = ['tile', solvedHere && 'solved', !available && 'locked', daily && 'daily'].filter(Boolean).join(' ');
  const corner = !available ? icon.lock : solvedHere ? `${icon.check}` : `+${c.xp} XP`;
  const inner = `
    <div class="tile-top"><span class="tile-num">${numOf(c)}</span><span class="tile-xp">${corner}</span></div>
    <h3>${esc(c.title)}</h3>
    ${daily ? '<span class="tile-flag">Hoy ×2</span>' : ''}
    <div class="tile-foot"><span>${esc(c.category)}</span><span class="lms">${langMarks(c.id)}</span></div>`;
  return available ? `<a class="${cls}" href="#/reto/${c.id}">${inner}</a>` : `<div class="${cls}" aria-disabled="true" title="Bloqueado">${inner}</div>`;
}

function renderHome() {
  const lang = state.settings.lang;
  const total = game.challenges.length;
  const solved = game.uniqueSolved();
  const info = levelInfo(state.xp);
  const streak = game.streakInfo();
  const daily = game.dailyChallenge();
  const dailyDone = game.isSolved(daily.id, lang);
  const next = game.nextChallenge(lang);
  const categories = [...new Set(game.challenges.map((c) => c.category))];

  app.innerHTML = `
  <section class="home">
    ${streak.atRisk ? `<div class="banner">${icon.flame}<span>Tu racha de <b>${dias(streak.current)}</b> está en peligro. Resuelve un reto antes de medianoche para mantenerla.</span></div>` : ''}

    <header class="board-head">
      <div>
        <div class="label">Tablero · ${LANGS[lang].label}</div>
        <h1>Retos <span class="h-count">${pad(solved)}/${total}</span></h1>
        <p class="lead">${motivation()}</p>
      </div>
      <div class="board-lang">
        <div class="label">Lenguaje</div>
        ${langSeg()}
      </div>
    </header>

    <div class="feature-row">
      <a class="daily ${dailyDone ? 'done' : ''}" href="#/reto/${daily.id}">
        <div class="daily-top">
          <span class="label">Reto del día · XP ×2</span>
          <span class="countdown"><span class="label">Cierra en</span><b id="countdown">${hhmmss(msUntilMidnight())}</b></span>
        </div>
        <div class="daily-main">
          <span class="daily-num">Nº ${numOf(daily)}</span>
          <h2>${esc(daily.title)}</h2>
          <p>${esc(daily.category)} · ${DIFFICULTY[daily.difficulty].label} · +${daily.xp * 2} XP base</p>
        </div>
        <span class="btn dark">${dailyDone ? `Hecho en ${LANGS[lang].label} · prueba otro lenguaje` : 'Aceptar el reto'} ${icon.arrowRight}</span>
      </a>

      ${next ? `
      <a class="next" href="#/reto/${next.id}">
        <span class="label">Siguiente recomendado</span>
        <span class="next-num">Nº ${numOf(next)}</span>
        <h2>${esc(next.title)}</h2>
        <p>${diffSq(next.difficulty)} ${DIFFICULTY[next.difficulty].label} · ${esc(next.category)} · +${next.xp} XP</p>
        <span class="btn">Continuar ${icon.arrowRight}</span>
      </a>` : `
      <div class="next">
        <span class="label">Todo resuelto</span>
        <h2>Has superado todo lo disponible</h2>
        <p>Resuelve los retos en otro lenguaje para seguir sumando XP.</p>
      </div>`}

      <dl class="ledger">
        <div><dt>Superados</dt><dd>${solved}<small>/${total}</small></dd></div>
        <div><dt>Nivel</dt><dd>${info.level}<small>${info.title}</small></dd></div>
        <div><dt>Racha</dt><dd>${streak.current}<small>${streak.current === 1 ? 'día' : 'días'} · mejor ${streak.best}</small></dd></div>
        <div><dt>Logros</dt><dd>${Object.keys(state.achievements).length}<small>/${ACHIEVEMENTS.length}</small></dd></div>
      </dl>
    </div>

    <div class="filters">
      ${seg('fDiff', [['todos', 'Todos'], ['facil', 'Fácil'], ['medio', 'Medio'], ['dificil', 'Difícil']], homeFilters.difficulty)}
      ${seg('fStatus', [['todos', 'Todos'], ['pendientes', 'Pendientes'], ['resueltos', 'Resueltos']], homeFilters.status)}
      <select class="select" id="catFilter" aria-label="Categoría">
        <option value="todas">Todas las categorías</option>
        ${categories.map((c) => `<option ${homeFilters.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
      </select>
    </div>
    <div id="tiers"></div>
  </section>`;

  renderTiers();

  bindLangPick(renderHome);
  for (const [id, key] of [['#fDiff', 'difficulty'], ['#fStatus', 'status']]) {
    $(id).addEventListener('click', (e) => {
      const b = e.target.closest('[data-v]');
      if (!b) return;
      sfx.click();
      homeFilters[key] = b.dataset.v;
      $(id).querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      renderTiers();
    });
  }
  $('#catFilter').addEventListener('change', (e) => {
    homeFilters.category = e.target.value;
    renderTiers();
  });

  const timer = setInterval(() => {
    const el = $('#countdown');
    if (el) el.textContent = hhmmss(msUntilMidnight());
  }, 1000);
  cleanup.push(() => clearInterval(timer));
}

function renderTiers() {
  const lang = state.settings.lang;
  const f = homeFilters;
  const html = Object.entries(DIFFICULTY)
    .filter(([tier]) => f.difficulty === 'todos' || f.difficulty === tier)
    .map(([tier, d]) => {
      const all = game.challenges.filter((c) => c.difficulty === tier);
      const list = all.filter(
        (c) =>
          (f.category === 'todas' || c.category === f.category) &&
          (f.status === 'todos' || (f.status === 'resueltos') === game.isSolved(c.id, lang)),
      );
      if (!list.length) return '';
      const done = all.filter((c) => game.isSolved(c.id, lang)).length;
      const prog = game.unlockProgress(tier);
      let lockMsg = '';
      if (!game.tierUnlocked(tier) && prog) {
        const left = prog.need - prog.have;
        const from = DIFFICULTY[prog.from].label.toLowerCase();
        lockMsg = `<span class="lock-msg">${icon.lock} Resuelve ${left} reto${left === 1 ? '' : 's'} ${from}${left === 1 ? '' : 's'} más para desbloquear <span class="meter inline"><i style="width:${(prog.have / prog.need) * 100}%"></i></span></span>`;
      }
      return `
      <section class="tier">
        <header class="tier-head">
          <h2>${diffSq(tier)}${d.label}</h2>
          <span class="label">${done}/${all.length} en ${LANGS[lang].label}</span>
          ${lockMsg}
        </header>
        <div class="grid">${list.map((c) => tileHtml(c, lang)).join('')}</div>
      </section>`;
    })
    .join('');
  $('#tiers').innerHTML = html || '<p class="empty">Ningún reto coincide con esos filtros.</p>';
}

function errorBox({ heading, line, ex, text, original, compact }) {
  return `<div class="errbox ${compact ? 'compact' : ''}">
    ${heading ? `<div class="errbox-head"><span class="errbox-mark">${icon.x}</span><b>${heading}</b>${line ? `<button class="line-link" data-line="${line}">Ir a la línea ${line} ${icon.arrowRight}</button>` : ''}</div>` : ''}
    ${ex ? `<p class="errbox-title">${ex.title}</p><p class="errbox-tip">${ex.tip}</p>` : ''}
    ${text ? `<p class="errbox-title">${text}</p>` : ''}
    ${original ? `<div class="errbox-orig"><span class="label">Mensaje original</span><pre>${esc(original)}</pre></div>` : ''}
  </div>`;
}

// ───────────── Vista: reto ─────────────
async function renderChallenge(id) {
  const c = game.challenges.find((x) => x.id === id);
  if (!c) {
    toast({ icon: '?', title: 'Ese reto no existe', text: 'Te llevamos de vuelta al tablero.', kind: 'bad' });
    location.hash = '#/';
    return;
  }
  if (!game.isAvailable(c)) {
    const prog = game.unlockProgress(c.difficulty);
    const left = prog ? prog.need - prog.have : 0;
    toast({ icon: icon.lock, title: 'Reto bloqueado', text: `Resuelve ${left} reto${left === 1 ? '' : 's'} ${DIFFICULTY[prog.from].label.toLowerCase()}${left === 1 ? '' : 's'} más para desbloquearlo.`, kind: 'bad' });
    location.hash = '#/';
    return;
  }

  let lang = state.settings.lang;
  let busy = false;
  let editor = null;
  const startTime = Date.now();
  const daily = game.isDaily(c.id);

  app.innerHTML = `
  <section class="arena">
    <aside class="brief" id="brief"></aside>
    <div class="workspace">
      <div class="ws-head">
        <div class="tabs" id="langTabs" role="tablist"></div>
        <button class="btn small" id="btnReset" title="Restaurar el código inicial">${icon.reset} Reiniciar</button>
      </div>
      <div class="editor" id="editor"><div class="editor-loading">Cargando editor…</div></div>
      <div class="actions">
        <span class="keys">Probar ejecuta los ejemplos · Enviar valida todo y da XP</span>
        <button class="btn" id="btnRun">${icon.play} Probar <kbd>Ctrl ↵</kbd></button>
        <button class="btn primary" id="btnSubmit">Enviar ${icon.arrowRight} <kbd>Ctrl ⇧ ↵</kbd></button>
      </div>
      <div class="results" id="results">
        <div class="results-empty">
          <span class="label">Resultados</span>
          <p>Escribe tu solución y pulsa <b>Probar</b> para ver los ejemplos, o <b>Enviar</b> para validar con todos los tests y ganar XP.</p>
        </div>
      </div>
    </div>
  </section>`;

  const brief = $('#brief');
  const results = $('#results');

  function renderBrief() {
    const hintsShown = state.hints[c.id] || 0;
    const langsDone = game.solvedLangs(c.id);
    const firstTime = langsDone.length === 0;
    const baseXp = firstTime ? c.xp : Math.round(c.xp / 2);
    const solvedHere = game.isSolved(c.id, lang);
    const concepts = lessonsForChallenge(c.id);
    brief.innerHTML = `
      <div class="brief-top">
        <a href="#/" class="back">${icon.arrowLeft} Tablero</a>
        <span class="timer" id="timer"></span>
      </div>
      <div class="brief-id">
        <span class="label">Nº ${numOf(c)}</span>
        <span class="tag">${diffSq(c.difficulty)}${DIFFICULTY[c.difficulty].label}</span>
        <span class="tag">${esc(c.category)}</span>
        ${daily ? '<span class="tag hi">Reto del día ×2</span>' : ''}
      </div>
      <h1>${esc(c.title)}</h1>
      <p class="reward-line ${solvedHere ? 'done' : ''}">
        ${solvedHere
          ? `${icon.check} Ya resuelto en ${LANGS[lang].label}. Práctica libre: no suma XP. Prueba otro lenguaje para ganar más.`
          : `<mark>+${baseXp * (daily ? 2 : 1)} XP</mark> base${firstTime ? '' : ' (nuevo lenguaje)'}. Bonus por primer intento, sin pistas y rapidez.`}
      </p>
      <div class="desc">${c.description}</div>

      <section class="sec">
        <h4 class="label">Aprende el concepto</h4>
        <div class="concepts">
          ${concepts.map((l) => `<a class="concept ${game.lessonDone(l.id) ? 'done' : ''}" href="#/aprender/${l.id}" title="Lección ${lessonNum(l)}">${game.lessonDone(l.id) ? icon.check : icon.book}<span>${esc(l.title)}</span></a>`).join('')}
        </div>
      </section>

      <section class="sec">
        <h4 class="label">Firma</h4>
        <pre class="sig"><code>${esc(signature(c, lang))}</code></pre>
      </section>

      <section class="sec">
        <h4 class="label">Ejemplos</h4>
        <table class="examples">
          ${c.examples.map((ex) => `<tr><td><code>${esc(callStr(c, lang, ex.args))}</code></td><td class="arrow">→</td><td><code class="out">${esc(fmt(ex.expected, lang))}</code></td></tr>`).join('')}
        </table>
        <p class="footnote">+ ${c.totalTests - c.examples.length} tests ocultos al enviar.</p>
      </section>

      <section class="sec">
        <h4 class="label">Pistas ${hintsShown}/${c.hints.length}</h4>
        <div class="hints">
          ${c.hints.slice(0, hintsShown).map((h, i) => `<div class="hint"><span class="hint-n">${i + 1}</span><span>${h}</span></div>`).join('')}
          ${hintsShown < c.hints.length
            ? `<button class="btn small" id="btnHint">${icon.bulb} Ver pista ${hintsShown + 1}${hintsShown === 0 ? ' <span class="muted">· pierdes el bonus sin pistas</span>' : ''}</button>`
            : ''}
        </div>
      </section>

      <section class="sec">
        <h4 class="label">Resuelto en</h4>
        <div class="lang-progress">
          ${Object.entries(LANGS).map(([k, l]) => `<span class="lm big lm-${k} ${langsDone.includes(k) ? 'on' : ''}">${langsDone.includes(k) ? icon.check : ''}${l.label}</span>`).join('')}
        </div>
      </section>`;
    $('#btnHint')?.addEventListener('click', () => {
      sfx.click();
      game.recordHint(c.id);
      renderBrief();
      tickTimer();
    });
  }

  function renderTabs() {
    $('#langTabs').innerHTML = Object.entries(LANGS)
      .map(([k, l]) => `<button class="tab ${k === lang ? 'on' : ''}" data-lang="${k}" role="tab">${game.isSolved(c.id, k) ? icon.check : ''}${l.label}</button>`)
      .join('');
  }

  // Temporizador con cuenta atrás del bonus de velocidad.
  const speed = DIFFICULTY[c.difficulty].speed;
  function tickTimer() {
    const el = $('#timer');
    if (!el) return;
    const s = (Date.now() - startTime) / 1000;
    if (s <= speed && !game.isSolved(c.id, lang)) {
      el.className = 'timer bonus';
      el.innerHTML = `${icon.bolt} Bonus velocidad <b>${mmss(speed - s)}</b>`;
    } else {
      el.className = 'timer';
      el.innerHTML = `${icon.clock} <b>${mmss(s)}</b>`;
    }
  }
  const timerId = setInterval(tickTimer, 500);
  cleanup.push(() => clearInterval(timerId));

  renderBrief();
  renderTabs();
  tickTimer();

  const codeFor = (l) => state.drafts[game.draftKey(c.id, l)] ?? starter(c, l);
  editor = await createEditor($('#editor'), {
    language: LANGS[lang].monaco,
    value: codeFor(lang),
    onChange: (v) => {
      state.drafts[game.draftKey(c.id, lang)] = v;
      game.save();
    },
    onRun: () => execute('run'),
    onSubmit: () => execute('submit'),
  });
  if (!location.hash.includes(c.id)) return editor.dispose(); // se navegó mientras cargaba
  cleanup.push(() => editor.dispose());
  editor.focus();

  $('#langTabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-lang]');
    if (!b || b.dataset.lang === lang) return;
    sfx.click();
    lang = b.dataset.lang;
    state.settings.lang = lang;
    game.save();
    editor.setLanguage(LANGS[lang].monaco, codeFor(lang));
    renderTabs();
    renderBrief();
    tickTimer();
    editor.focus();
  });

  $('#btnReset').addEventListener('click', () => {
    if (!confirm('¿Restaurar el código inicial? Perderás lo que has escrito en este lenguaje.')) return;
    delete state.drafts[game.draftKey(c.id, lang)];
    editor.setValue(starter(c, lang));
    editor.clearMarks();
    game.save();
  });
  $('#btnRun').addEventListener('click', () => execute('run'));
  $('#btnSubmit').addEventListener('click', () => execute('submit'));
  results.addEventListener('click', (e) => {
    const link = e.target.closest('[data-line]');
    if (link) editor.goTo(Number(link.dataset.line));
  });

  // Errores de uso que no merecen gastar un intento.
  function precheck(code, mode) {
    if (!code.trim()) {
      return { title: 'El editor está vacío.', tip: 'Pulsa <b>Reiniciar</b> para recuperar la plantilla con la función del reto.' };
    }
    if (mode === 'submit' && code.trim() === starter(c, lang).trim()) {
      return { title: 'Todavía tienes el código inicial.', tip: 'Escribe tu solución dentro de la función antes de enviar. Este envío no ha contado como intento ni rompe tu combo.' };
    }
    return null;
  }

  async function execute(mode) {
    if (busy) return;
    const code = editor.getValue();
    const problem = precheck(code, mode);
    if (problem) {
      results.innerHTML = `<div class="notice warn"><b>${problem.title}</b><p>${problem.tip}</p></div>`;
      shake(results);
      sfx.testFail();
      return;
    }
    busy = true;
    editor.clearMarks();
    const btns = [$('#btnRun'), $('#btnSubmit')];
    btns.forEach((b) => (b.disabled = true));
    const activeBtn = mode === 'run' ? btns[0] : btns[1];
    activeBtn.classList.add('is-loading');
    results.innerHTML = `<div class="running"><span class="spinner"></span>${mode === 'run' ? 'Ejecutando los ejemplos…' : 'Validando con todos los tests…'}</div>`;
    // Enviar suena a "carga" hasta que llegan los resultados (con un mínimo para crear suspense).
    const stopCharge = mode === 'submit' ? sfx.submitStart() : (sfx.runStart(), null);
    const started = performance.now();
    try {
      const res = await api.run(c.id, lang, code, mode);
      if (mode === 'submit') await wait(Math.max(0, 750 - (performance.now() - started)));
      stopCharge?.();
      await showResults(res, mode);
      if (mode === 'run') onRunDone(res);
      else await onSubmitDone(res);
    } catch (err) {
      stopCharge?.();
      sfx.error();
      results.innerHTML = errorBox({ heading: 'No se pudo ejecutar', text: rich(err.message) });
    } finally {
      stopCharge?.();
      busy = false;
      btns.forEach((b) => (b.disabled = false));
      activeBtn.classList.remove('is-loading');
    }
  }

  function fatalHtml(res) {
    const headings = { notFound: 'Función no encontrada', timeout: 'Tiempo agotado', overflow: 'Demasiada salida', spawn: 'No se pudo ejecutar' };
    if (res.fatalKind !== 'crash') return errorBox({ heading: headings[res.fatalKind] || 'Error', text: rich(res.fatal) });
    const ex = explain(res.fatalError || res.fatal, lang) || {
      title: 'Tu código no se pudo ejecutar.',
      tip: 'Lee el mensaje original de abajo: la primera palabra indica el tipo de error y suele señalar la línea exacta.',
    };
    return errorBox({ heading: res.fatalLine ? `Error en la línea ${res.fatalLine}` : 'Error al ejecutar', line: res.fatalLine, ex, original: res.fatal });
  }

  async function showResults(res, mode) {
    results.innerHTML = `
      <div class="res-head">
        <span class="label">${mode === 'run' ? 'Ejemplos' : 'Envío completo'}</span>
        <span class="res-count"><b id="resCount">0</b>/${res.total} tests</span>
        <span class="res-time">${res.ms} ms</span>
      </div>
      <div class="segments" id="segments">${res.tests.map(() => '<i></i>').join('')}</div>
      ${res.fatal ? fatalHtml(res) : ''}
      <div class="tests" id="tests"></div>
      <div id="resFoot"></div>`;

    // Marca en el editor el primer error localizado.
    const firstErr = res.tests.find((t) => t.line);
    if (res.fatalLine) {
      const ex = explain(res.fatalError || res.fatal, lang);
      editor.markError(res.fatalLine, ex ? stripTags(ex.title) : res.fatalError || 'Error');
    } else if (firstErr) {
      const ex = explain(firstErr.error, lang);
      editor.markError(firstErr.line, ex ? stripTags(`${ex.title} ${ex.tip}`) : firstErr.error);
    }

    const segEls = results.querySelectorAll('#segments i');
    const list = $('#tests');
    const delay = Math.max(70, Math.min(220, 1400 / Math.max(1, res.tests.length)));
    const seenErrors = new Map();
    let passCount = 0;
    const anyRan = res.tests.some((t) => t.status !== 'skipped');
    for (const t of res.tests) {
      if (!anyRan) break;
      await wait(delay);
      segEls[t.index].className = t.passed ? 'pass' : t.status === 'skipped' ? 'skip' : 'fail';
      if (t.passed) {
        passCount++;
        $('#resCount').textContent = passCount;
        sfx.testPass(passCount - 1, passCount === res.total);
      } else if (t.status !== 'skipped') sfx.testFail();
      list.insertAdjacentHTML('beforeend', testHtml(t, seenErrors));
    }
    if (res.fatal && !anyRan) {
      sfx.error();
      shake(results);
    }
    const extra = [];
    if (res.console) extra.push(`<div class="console"><div class="console-head">Consola</div><pre>${esc(res.console)}</pre></div>`);
    if (res.stderr) extra.push(`<div class="console"><div class="console-head">Avisos (stderr)</div><pre>${esc(res.stderr)}</pre></div>`);
    $('#resFoot').innerHTML = extra.join('');
  }

  function testHtml(t, seenErrors) {
    const mark = { pass: icon.check, fail: icon.x, error: '!', timeout: icon.clock, skipped: '–' }[t.status];
    const label = t.hidden ? `Test oculto ${pad(t.index + 1)}` : `Test ${pad(t.index + 1)}`;
    const ms = typeof t.ms === 'number' ? `<span class="ms">${t.ms < 1 ? '<1' : Math.round(t.ms)} ms</span>` : '';
    const lineLink = t.line ? `<button class="line-link" data-line="${t.line}">Línea ${t.line} ${icon.arrowRight}</button>` : '';
    let body = '';
    if (!t.hidden) {
      body += `<div class="kv"><span>Entrada</span><code>${esc(callStr(c, lang, t.args))}</code></div>`;
      body += `<div class="kv"><span>Esperado</span><code>${esc(fmt(t.expected, lang))}</code></div>`;
      if (t.status === 'fail' || t.status === 'pass') {
        const shown = t.undef ? (lang === 'python' ? 'None' : 'undefined') : fmt(t.actual, lang);
        body += `<div class="kv"><span>Obtenido</span><code class="${t.passed ? 'ok' : 'bad'}">${esc(shown)}</code></div>`;
      }
    }
    if (t.status === 'fail') {
      if (t.diagnosis) body += `<p class="note">${esc(t.diagnosis)}</p>`;
      else if (t.hidden) body += '<p class="note">Falla en un caso oculto. Piensa en los casos límite: vacío, cero, negativos, un solo elemento…</p>';
    }
    if (t.error) {
      if (seenErrors.has(t.error)) {
        body += `<p class="note">Mismo error que el test ${pad(seenErrors.get(t.error) + 1)}.</p>`;
      } else {
        seenErrors.set(t.error, t.index);
        const ex = explain(t.error, lang);
        body += errorBox({ ex, original: t.error, compact: true });
      }
    }
    if (t.status === 'timeout') body += '<p class="note warn">Este test no terminó a tiempo: revisa que tus bucles avancen hacia su condición de salida.</p>';
    if (t.logs) body += `<div class="console mini"><div class="console-head">Salida</div><pre>${esc(t.logs)}</pre></div>`;
    const showBody = body && (!t.passed || !t.hidden);
    return `<div class="test ${t.status}"><div class="test-head"><span class="ti">${mark}</span><span>${label}</span>${lineLink}${ms}</div>${showBody ? `<div class="test-body">${body}</div>` : ''}</div>`;
  }

  function onRunDone(res) {
    game.recordRun();
    if (res.allPassed) {
      sfx.runPass();
      confettiFrom($('#btnSubmit'), { count: 40, power: 0.6 });
      pulse($('#btnSubmit'), 'glow');
      footNote('Todos los ejemplos pasan. Pulsa <b>Enviar</b> para validar con los tests ocultos y cobrar tu XP.', 'good');
    } else if (!res.fatal && res.passed > 0) {
      footNote(`Vas bien: ${res.passed} de ${res.total} ejemplos correctos.`, 'info');
    }
  }

  async function onSubmitDone(res) {
    if (res.allPassed) {
      const seconds = (Date.now() - startTime) / 1000;
      const reward = game.recordSolve({ challenge: c, lang, seconds });
      renderTabs();
      if (reward.repeat) {
        sfx.runPass();
        confettiFrom(results, { count: 50, power: 0.7 });
        footNote(`Correcto otra vez. Ya tenías este reto en ${LANGS[lang].label}, así que no suma XP: prueba otro lenguaje.`, 'good');
        updateHud({ animate: true });
        return;
      }
      await celebrate(reward, challengeTicket(c, lang));
      renderBrief();
      tickTimer();
      return;
    }
    const { lostCombo, fails } = game.recordFail(c.id, lang);
    if (!res.fatal) {
      await wait(150);
      if (res.passed / res.total >= 0.6) sfx.nearMiss();
      else sfx.fail();
      shake(results);
    }
    updateHud({ animate: true });
    if (lostCombo >= 2) toast({ icon: icon.heartbreak, title: `Combo ×${comboMult(lostCombo)} perdido`, text: 'Usa “Probar” antes de enviar para proteger tu combo.', kind: 'bad' });
    const missing = res.total - res.passed;
    if (!res.fatal && res.passed / res.total >= 0.6) footNote(`¡Casi! Solo ${missing === 1 ? 'falla 1 test' : `fallan ${missing} tests`}.`, 'warn');
    if (fails === 3 && (state.hints[c.id] || 0) < c.hints.length) {
      toast({ icon: icon.bulb, title: '¿Atascado?', text: 'Una pista puede desbloquearte. No te rindas.', kind: 'info' });
    }
  }

  function footNote(html, kind) {
    $('#resFoot')?.insertAdjacentHTML('afterbegin', `<div class="notice ${kind}">${html}</div>`);
  }
}

// ───────────── Vista: academia ─────────────
// Vista de lecciones genérica: cada ruta de aprendizaje define su lista, sus enlaces y su práctica.
const TRACKS = {
  aprender: {
    list: LESSONS,
    home: '#/aprender',
    homeLabel: 'Aprender',
    href: (l) => `#/aprender/${l.id}`,
    lang: () => state.settings.lang,
    practice: (l) => ({ done: l.challenges.filter((id) => game.isSolved(id)).length, total: l.challenges.length, unit: 'retos' }),
    practiceHtml(l, lang) {
      const list = game.challenges.filter((c) => l.challenges.includes(c.id));
      return {
        html: list.map((c) => tileHtml(c, lang)).join(''),
        count: `${list.filter((c) => game.isSolved(c.id, lang)).length}/${list.length} en ${LANGS[lang].label}`,
      };
    },
  },
};

const lessonNum = (l, track = TRACKS.aprender) => pad(track.list.indexOf(l) + 1);
const nextLesson = (track) => track.list.find((l) => !game.lessonDone(l.id));
const CODE_LABELS = { shell: 'Terminal', json: 'JSON' };

function codeBlock(code, lang, out, file) {
  const lines = highlightLines(code, lang).map((l) => `<span class="line">${l}</span>`).join('');
  const label = file ?? LANGS[lang]?.label ?? CODE_LABELS[lang] ?? lang;
  return `<figure class="codeblock">
    <figcaption class="codeblock-head">${LANGS[lang] ? `<i class="lang-dot bg-${lang}"></i>` : ''}${esc(label)}</figcaption>
    <pre class="code"><code>${lines}</code></pre>
    ${out != null ? `<div class="codeblock-out"><div class="codeblock-out-head">${icon.arrowRight} Salida</div><pre>${esc(out)}</pre></div>` : ''}
  </figure>`;
}

function lessonCard(l, track) {
  const done = game.lessonDone(l.id);
  const upNext = nextLesson(track) === l;
  const p = track.practice(l);
  return `<a class="lcard ${done ? 'done' : ''} ${upNext ? 'up-next' : ''}" href="${track.href(l)}">
    <div class="tile-top"><span class="tile-num">${lessonNum(l, track)}</span><span class="tile-xp">${done ? icon.check : `+${LESSON_XP} XP`}</span></div>
    ${upNext ? '<span class="tile-flag">Siguiente</span>' : ''}
    <h3>${esc(l.title)}</h3>
    <p>${esc(l.summary)}</p>
    <div class="lcard-foot">${p.total
      ? `<span>${p.done}/${p.total} ${p.unit}</span><span class="meter inline"><i style="width:${(p.done / p.total) * 100}%"></i></span>`
      : '<span>Solo teoría</span>'}</div>
  </a>`;
}

function nextLessonCard(track) {
  const next = nextLesson(track);
  if (!next) return '';
  const started = track.list.some((l) => game.lessonDone(l.id));
  return `
    <a class="learn-next" href="${track.href(next)}">
      <span class="learn-next-num">${lessonNum(next, track)}</span>
      <span class="learn-next-main">
        <span class="label">${started ? 'Siguiente lección' : 'Empieza por aquí'} · lección ${lessonNum(next, track)} de ${track.list.length}</span>
        <b>${esc(next.title)}</b>
        <span class="learn-next-sum">${esc(next.summary)}</span>
      </span>
      <span class="btn primary">${started ? 'Continuar' : 'Empezar'} lección ${icon.arrowRight}</span>
    </a>`;
}

function renderLearn() {
  const track = TRACKS.aprender;
  const done = game.lessonsDone();
  app.innerHTML = `
  <section class="home learn">
    <header class="board-head">
      <div>
        <div class="label">Academia · ${LANGS[state.settings.lang].label}</div>
        <h1>Aprender <span class="h-count">${pad(done)}/${LESSONS.length}</span></h1>
        <p class="lead">${nextLesson(track)
          ? `Cada lección explica un concepto con ejemplos en tu lenguaje y termina con un quiz que da <b>+${LESSON_XP} XP</b>. Después, practica con sus retos.`
          : 'Completaste todas las lecciones. Puedes repasarlas cuando quieras: el quiz queda como práctica libre.'}</p>
      </div>
      <div class="board-lang">
        <div class="label">Lenguaje de los ejemplos</div>
        ${langSeg()}
      </div>
    </header>
    ${nextLessonCard(track)}
    <div class="lesson-grid">${LESSONS.map((l) => lessonCard(l, track)).join('')}</div>
  </section>`;
  bindLangPick(renderLearn);
}

function renderLesson(track, id) {
  const l = track.list.find((x) => x.id === id);
  if (!l) {
    toast({ icon: '?', title: 'Esa lección no existe', text: 'Te llevamos a la lista de lecciones.', kind: 'bad' });
    location.hash = track.home;
    return;
  }
  const idx = track.list.indexOf(l);
  const prev = track.list[idx - 1];
  const next = track.list[idx + 1];
  const fixedLang = track.fixedLang; // las rutas con un solo lenguaje no muestran el selector
  let answers = l.quiz.map(() => null);
  let checked = false;
  let result = null;

  app.innerHTML = `
  <section class="lesson">
    <div class="lesson-top">
      <a href="${track.home}" class="back">${icon.arrowLeft} ${track.homeLabel}</a>
      ${fixedLang ? `<span class="tag">${fixedLang}</span>` : langSeg()}
    </div>
    <header class="lesson-head">
      <div class="label">${track.kicker ?? ''}Lección ${lessonNum(l, track)} de ${track.list.length}</div>
      <h1>${esc(l.title)}</h1>
      <p class="lead">${esc(l.summary)}</p>
      <p class="reward-line" id="lessonStatus"></p>
    </header>
    <div id="lessonBody"></div>
    <section class="quiz" id="quiz"></section>
    <section class="practice">
      <header class="tier-head"><h2>Practica</h2><span class="label" id="practiceCount"></span></header>
      <div class="grid" id="practiceGrid"></div>
    </section>
    <nav class="lesson-nav">
      ${prev ? `<a class="btn" href="${track.href(prev)}">${icon.arrowLeft} ${lessonNum(prev, track)} · ${esc(prev.title)}</a>` : '<span></span>'}
      ${next ? `<a class="btn" href="${track.href(next)}">${lessonNum(next, track)} · ${esc(next.title)} ${icon.arrowRight}</a>` : `<a class="btn" href="${track.home}">Todas las lecciones</a>`}
    </nav>
  </section>`;

  function renderStatus() {
    const el = $('#lessonStatus');
    const done = game.lessonDone(l.id);
    el.classList.toggle('done', done);
    el.innerHTML = done
      ? `${icon.check} Lección completada. El quiz queda como práctica libre.`
      : `<mark>+${LESSON_XP} XP</mark> al aprobar el quiz del final, +10 si aciertas todo a la primera.`;
  }

  function renderBody() {
    const lang = track.lang();
    $('#lessonBody').innerHTML = l.sections
      .map((s, i) => `
      <article class="lsec">
        <h2><span class="lsec-n">${pad(i + 1)}</span>${esc(s.title)}</h2>
        <p class="ltext">${s.text}</p>
        ${codeBlock(pick(s.code, lang), s.lang ?? lang, pick(s.out, lang), s.file)}
      </article>`)
      .join('');
  }

  function renderPractice() {
    const { html, count } = track.practiceHtml(l, track.lang());
    $('#practiceGrid').innerHTML = html;
    $('#practiceCount').textContent = count;
  }

  function quizMessage() {
    if (!checked) {
      const left = answers.filter((a) => a === null).length;
      return left ? `Responde ${left === 1 ? 'la pregunta que falta' : `las ${left} preguntas`} y pulsa Comprobar.` : 'Listo para comprobar.';
    }
    const right = answers.filter((a, i) => a === l.quiz[i].answer).length;
    if (!result.passed) return `<b>${right}/${l.quiz.length} correctas.</b> Lee las explicaciones e inténtalo de nuevo.`;
    if (result.repeat) return '<b>¡Todo correcto!</b> Ya tenías esta lección, así que no suma XP.';
    return `<b>¡Lección completada!</b> +${result.gained} XP`;
  }

  function renderQuiz() {
    const lang = track.lang();
    const answered = answers.every((a) => a !== null);
    $('#quiz').innerHTML = `
      <header class="quiz-head">
        <h2>Mini-quiz</h2>
        <span class="label">${game.lessonDone(l.id) ? 'Práctica libre' : `+${LESSON_XP} XP al aprobar`}</span>
      </header>
      <ol class="qs">
        ${l.quiz.map((q, i) => {
          const picked = answers[i];
          const ok = picked === q.answer;
          return `<li class="q ${checked ? (ok ? 'right' : 'wrong') : ''}">
            <p class="q-text"><span class="q-n">${i + 1}</span><span>${q.q}</span></p>
            ${q.code ? codeBlock(pick(q.code, lang), lang) : ''}
            <div class="opts">
              ${q.options.map((o, j) => {
                const cls = ['opt', picked === j && 'picked', checked && j === q.answer && 'answer', checked && picked === j && !ok && 'miss'].filter(Boolean).join(' ');
                return `<button class="${cls}" data-q="${i}" data-o="${j}" ${checked ? 'disabled' : ''}><span class="opt-key">${'ABCD'[j]}</span><span>${o}</span></button>`;
              }).join('')}
            </div>
            ${checked ? `<p class="why"><b>${ok ? 'Correcto.' : 'Incorrecto.'}</b> ${q.why}</p>` : ''}
          </li>`;
        }).join('')}
      </ol>
      ${result?.passed && !result.repeat ? `<ul class="r-lines quiz-receipt">${result.lines.map((x) => `<li class="${x.achievement ? 'ach' : ''}"><span>${esc(x.label)}</span><i></i><b>+${x.add}</b></li>`).join('')}</ul>` : ''}
      <div class="quiz-foot">
        <span class="quiz-msg">${quizMessage()}</span>
        <span class="quiz-btns">
          ${checked
            ? `<button class="btn ${result.passed ? 'small' : ''}" id="btnRetry">${icon.reset} ${result.passed ? 'Repetir' : 'Intentar de nuevo'}</button>`
            : `<button class="btn primary" id="btnCheck" ${answered ? '' : 'disabled'}>Comprobar ${icon.arrowRight}</button>`}
          ${checked && result.passed ? (next
            ? `<a class="btn primary" href="${track.href(next)}">Siguiente lección ${icon.arrowRight}</a>`
            : `<a class="btn primary" href="${track.home}">Todas las lecciones</a>`) : ''}
        </span>
      </div>`;
  }

  async function checkQuiz() {
    checked = true;
    const passed = answers.every((a, i) => a === l.quiz[i].answer);
    result = game.recordQuiz(l.id, passed);
    renderQuiz();
    if (!passed) {
      sfx.fail();
      shake($('#quiz'));
      return;
    }
    if (result.repeat) {
      sfx.runPass();
      confettiFrom($('#quiz .quiz-foot'), { count: 40, power: 0.6 });
      return;
    }
    sfx.success();
    confetti({ count: 120, power: 1 });
    renderStatus();
    updateHud({ animate: true });
    floatFrom($('#xpFill'), `+${result.gained} XP`);
    for (const a of result.achievements) {
      toast({ icon: a.mark, title: `Logro: ${a.name}`, text: `${a.desc} · +20 XP`, kind: 'gold' });
      await wait(250);
    }
    if (result.levelAfter > result.levelBefore) {
      await wait(400);
      showLevelUp(result.levelAfter);
    }
  }

  $('#quiz').addEventListener('click', (e) => {
    const opt = e.target.closest('[data-o]');
    if (opt && !checked) {
      sfx.click();
      answers[Number(opt.dataset.q)] = Number(opt.dataset.o);
      renderQuiz();
    } else if (e.target.closest('#btnCheck')) {
      checkQuiz();
    } else if (e.target.closest('#btnRetry')) {
      sfx.click();
      // Tras un fallo se conservan los aciertos; tras aprobar se empieza de cero.
      answers = result.passed ? answers.map(() => null) : answers.map((a, i) => (a === l.quiz[i].answer ? a : null));
      checked = false;
      result = null;
      renderQuiz();
    }
  });

  if (!fixedLang) {
    bindLangPick(() => {
      renderBody();
      renderQuiz();
      renderPractice();
    });
  }
  renderStatus();
  renderBody();
  renderQuiz();
  renderPractice();
}

// ───────────── Celebración: el ticket ─────────────
function challengeTicket(c, lang) {
  const other = Object.keys(LANGS).find((k) => !game.isSolved(c.id, k));
  const next = game.nextChallenge(lang, c.id);
  return {
    label: 'Reto superado',
    title: c.title,
    sub: `Nº ${numOf(c)} · ${LANGS[lang].label}`,
    combo: true,
    secondary: other
      ? { label: `Resolver en ${LANGS[other].label}`, run: () => { closeModal(); state.settings.lang = other; route(); } }
      : { label: 'Tablero', href: '#/' },
    primary: next ? { label: 'Siguiente reto', href: `#/reto/${next.id}` } : null,
  };
}

// ticket: { label, title, sub, combo?, secondary: { label, href | run }, primary?: { label, href } }
async function celebrate(r, ticket) {
  sfx.success();
  confetti({ count: 150, power: 1.1 });
  const before = levelInfo(r.xpBefore);
  const now = new Date();
  const stamp = `${pad(now.getDate())}.${pad(now.getMonth() + 1)} · ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  openModal(`
    <div class="modal ticket ${r.crit ? 'crit' : ''}">
      <div class="ticket-head">
        <div class="ticket-row"><span class="label">${esc(ticket.label)}</span><span class="label">${stamp}</span></div>
        <h2>${esc(ticket.title)}</h2>
        <div class="ticket-row"><span>${esc(ticket.sub)}</span>${r.crit ? '<span class="crit-stamp">Crítico ×2</span>' : ''}</div>
      </div>
      <div class="ticket-body">
        <ul class="r-lines" id="rLines"></ul>
        <div class="r-total"><span class="label">Total</span><b>+<span id="rTotal">0</span><small> XP</small></b></div>
        <div class="r-level">
          <div class="r-level-head"><span>Nivel <b id="rLevel">${before.level}</b></span><span id="rXp">${before.current}/${before.needed}</span></div>
          <div class="xp-bar big"><span class="xp-fill" id="rFill" style="width:${(before.current / before.needed) * 100}%"></span></div>
        </div>
        <div class="r-meta">
          <span>Racha <b>${r.streak}</b>${r.streakUp ? ' <em>+1</em>' : ''}</span>
          ${ticket.combo ? `<span>Combo <b>×${comboMult(r.combo)}</b></span>` : ''}
          <span>Hoy <b>${Math.min(game.todayCount(), DAILY_GOAL)}/${DAILY_GOAL}</b></span>
        </div>
        <div class="modal-actions">
          ${ticket.secondary.href ? `<a class="btn" href="${ticket.secondary.href}">${esc(ticket.secondary.label)}</a>` : `<button class="btn" data-act="secondary">${esc(ticket.secondary.label)}</button>`}
          ${ticket.primary ? `<a class="btn primary" href="${ticket.primary.href}" data-act="next" autofocus>${esc(ticket.primary.label)} ${icon.arrowRight} <kbd>↵</kbd></a>` : ''}
        </div>
      </div>
    </div>`);

  const modal = $('#modalRoot');
  modal.querySelector('[data-act="secondary"]')?.addEventListener('click', ticket.secondary.run);

  // Líneas del recibo, una a una.
  const linesEl = $('#rLines');
  for (const line of r.lines) {
    await wait(line.crit ? 450 : 260);
    if (!$('#rLines')) return;
    const cls = line.crit ? 'crit' : line.achievement ? 'ach' : '';
    linesEl.insertAdjacentHTML('beforeend', `<li class="${cls}"><span>${esc(line.label)}</span><i></i><b>+${line.add}</b></li>`);
    if (line.crit) {
      sfx.crit();
      shake(modal.querySelector('.modal'));
      confetti({ count: 120, power: 1.3 });
    } else if (line.achievement) sfx.achievement();
    else sfx.coin();
  }
  await countUp($('#rTotal'), 0, r.gained, 700, () => sfx.tick());

  // Barra de XP, atravesando niveles si hace falta.
  const fill = $('#rFill');
  let lvl = before.level;
  let xpCursor = r.xpBefore;
  while (fill && xpCursor < r.xpAfter) {
    const li = levelInfo(xpCursor);
    const levelStart = xpCursor - li.current;
    const levelEnd = levelStart + li.needed;
    const target = Math.min(r.xpAfter, levelEnd);
    fill.style.width = `${((target - levelStart) / li.needed) * 100}%`;
    $('#rXp').textContent = `${target - levelStart}/${li.needed}`;
    await wait(650);
    xpCursor = target;
    if (target === levelEnd) {
      lvl++;
      $('#rLevel').textContent = lvl;
      pulse($('#rLevel'), 'pop');
      fill.style.transition = 'none';
      fill.style.width = '0%';
      void fill.offsetWidth;
      fill.style.transition = '';
      $('#rXp').textContent = `0/${levelInfo(xpCursor).needed}`;
    }
  }

  updateHud({ animate: true });
  floatFrom($('#xpFill'), `+${r.gained} XP`);

  for (const a of r.achievements) {
    toast({ icon: a.mark, title: `Logro: ${a.name}`, text: `${a.desc} · +20 XP`, kind: 'gold' });
    await wait(250);
  }
  if (r.dailyGoal) toast({ icon: `${DAILY_GOAL}/${DAILY_GOAL}`, title: 'Meta diaria cumplida', text: '+30 XP. Vuelve mañana para mantener tu racha.', kind: 'good' });
  for (const tier of r.newTiers) {
    sfx.unlock();
    toast({ icon: icon.unlock, title: `Retos ${DIFFICULTY[tier].label.toLowerCase()}s desbloqueados`, text: 'Nuevos desafíos y más XP te esperan en el tablero.', kind: 'gold', duration: 6000 });
  }
  if (r.levelAfter > r.levelBefore) {
    await wait(400);
    showLevelUp(r.levelAfter);
  }
}

function showLevelUp(level) {
  const info = levelInfo(state.xp);
  sfx.levelUp();
  confettiRain(2600);
  const el = document.createElement('div');
  el.className = 'levelup';
  el.innerHTML = `
    <div class="levelup-inner">
      <div class="label">Nivel alcanzado</div>
      <div class="levelup-num">${pad(level)}</div>
      <div class="levelup-title">${info.title}</div>
      <div class="label">Haz clic o pulsa una tecla para continuar</div>
    </div>`;
  document.body.appendChild(el);
  const close = () => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 300);
    removeEventListener('keydown', onKey, true);
  };
  const onKey = (e) => {
    e.stopPropagation();
    e.preventDefault();
    close();
  };
  el.addEventListener('click', close);
  setTimeout(() => addEventListener('keydown', onKey, true), 300);
}

// ───────────── Modales ─────────────
function openModal(html) {
  const root = $('#modalRoot');
  root.innerHTML = `<div class="overlay">${html}</div>`;
  root.querySelector('.overlay').addEventListener('click', (e) => {
    if (e.target.classList.contains('overlay')) closeModal();
  });
  requestAnimationFrame(() => root.querySelector('.overlay')?.classList.add('show'));
  root.querySelector('[autofocus]')?.focus();
  root.querySelector('.close')?.addEventListener('click', closeModal);
}
function closeModal() {
  $('#modalRoot').innerHTML = '';
}

addEventListener('keydown', (e) => {
  if (!$('#modalRoot').innerHTML || document.querySelector('.levelup')) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Enter') {
    const next = $('#modalRoot [data-act="next"]');
    if (next) {
      e.preventDefault();
      next.click();
    }
  }
});

function showAchievements() {
  const got = Object.keys(state.achievements).length;
  openModal(`
    <div class="modal wide">
      <button class="close" aria-label="Cerrar">${icon.x}</button>
      <div class="label">Colección</div>
      <h2>Logros <span class="h-count">${pad(got)}/${ACHIEVEMENTS.length}</span></h2>
      <div class="meter big"><i style="width:${(got / ACHIEVEMENTS.length) * 100}%"></i></div>
      <div class="ach-grid">
        ${ACHIEVEMENTS.map((a) => {
          const at = state.achievements[a.id];
          return `<div class="ach ${at ? 'got' : ''}">
            <div class="ach-mark">${esc(a.mark)}</div>
            <div><div class="ach-name">${esc(a.name)}</div><div class="ach-desc">${esc(a.desc)}</div>
            ${at ? `<div class="ach-date">${new Date(at).toLocaleDateString('es')}</div>` : ''}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`);
}

function showStats() {
  const info = levelInfo(state.xp);
  const s = state.stats;
  const acc = s.submissions ? Math.round((s.successes / s.submissions) * 100) : 0;
  const total = game.challenges.length;
  const perLang = Object.entries(LANGS).map(([k, l]) => {
    const n = Object.values(state.solved).filter((x) => x[k]).length;
    return `<div class="bar-row"><span>${l.label}</span><div class="meter"><i class="bg-${k}" style="width:${(n / total) * 100}%"></i></div><b>${n}</b></div>`;
  });
  const perDiff = Object.entries(DIFFICULTY).map(([k, d]) => {
    const all = game.challenges.filter((c) => c.difficulty === k);
    const n = all.filter((c) => game.isSolved(c.id)).length;
    return `<div class="bar-row"><span>${d.label}</span><div class="meter"><i class="bg-${k}" style="width:${(n / all.length) * 100}%"></i></div><b>${n}/${all.length}</b></div>`;
  });

  // Mapa de actividad: últimas 18 semanas, una columna por semana (lunes arriba).
  const weeks = 18;
  const todayDow = (new Date().getDay() + 6) % 7;
  const totalDays = (weeks - 1) * 7 + todayDow + 1;
  const cells = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = game.dayOffset(-i);
    const n = state.activity[d] || 0;
    const lvl = n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4;
    cells.push(`<i class="h${lvl}" title="${d}: ${n} reto${n === 1 ? '' : 's'}"></i>`);
  }

  const stat = (num, label) => `<div class="stat"><div class="stat-num">${num}</div><div class="label">${label}</div></div>`;
  openModal(`
    <div class="modal wide">
      <button class="close" aria-label="Cerrar">${icon.x}</button>
      <div class="label">Registro</div>
      <h2>Estadísticas</h2>
      <div class="stat-grid">
        ${stat(state.xp, `XP total · nivel ${info.level}`)}
        ${stat(game.totalSolves(), 'Soluciones (todos los lenguajes)')}
        ${stat(`${acc}%`, 'Precisión al enviar')}
        ${stat(state.streak.best, 'Mejor racha (días)')}
        ${stat(state.bestCombo, 'Mejor combo')}
        ${stat(s.crits, 'Golpes críticos')}
        ${stat(s.runs, 'Ejecuciones de prueba')}
        ${stat(Object.keys(state.dailyGoalDone).length, 'Metas diarias')}
      </div>
      <h4 class="label">Actividad · últimas ${weeks} semanas</h4>
      <div class="heatmap">${cells.join('')}</div>
      <div class="two-col">
        <div><h4 class="label">Por lenguaje</h4>${perLang.join('')}</div>
        <div><h4 class="label">Por dificultad</h4>${perDiff.join('')}</div>
      </div>
      <div class="danger-zone"><button class="btn small danger" id="btnResetAll">Reiniciar todo el progreso</button></div>
    </div>`);
  $('#btnResetAll').addEventListener('click', async () => {
    if (!confirm('¿Seguro? Se borrará todo tu XP, logros, rachas y código guardado. No se puede deshacer.')) return;
    await game.resetProgress();
    closeModal();
    updateHud();
    route();
  });
}

// ───────────── Arranque ─────────────
$('#streakIcon').innerHTML = icon.flame;
$('#btnStats').innerHTML = icon.chart;
$('#navRetosIco').innerHTML = icon.grid;
$('#navAprenderIco').innerHTML = icon.book;
$('#btnAchievements').addEventListener('click', () => (sfx.click(), showAchievements()));
$('#btnStats').addEventListener('click', () => (sfx.click(), showStats()));
$('#btnSound').addEventListener('click', () => {
  state.settings.sound = !state.settings.sound;
  setMuted(!state.settings.sound);
  game.save();
  updateHud();
  sfx.click();
});
$('#player').addEventListener('click', showStats);
$('#streak').addEventListener('click', showStats);

async function boot() {
  try {
    const list = await api.challenges();
    await game.init(list);
  } catch {
    app.innerHTML = `<div class="loading">${errorBoxStandalone()}</div>`;
    return;
  }
  setMuted(!state.settings.sound);
  updateHud();
  addEventListener('hashchange', route);
  route();
  const streak = game.streakInfo();
  if (streak.atRisk) {
    setTimeout(() => toast({ icon: icon.flame, title: 'Racha en peligro', text: `Llevas ${dias(streak.current)} seguidos. No la pierdas hoy.`, kind: 'bad', duration: 6000 }), 800);
  } else if (streak.doneToday && streak.current > 1) {
    setTimeout(() => toast({ icon: icon.flame, title: `Racha de ${dias(streak.current)}`, text: 'Hoy ya cumpliste. Sigue así.', kind: 'good' }), 800);
  }
}

function errorBoxStandalone() {
  return `<div class="errbox"><div class="errbox-head"><span class="errbox-mark">${icon.x}</span><b>No se pudo conectar con el servidor</b></div>
    <p class="errbox-title">La app necesita el servidor local para cargar los retos y ejecutar tu código.</p>
    <p class="errbox-tip">Abre una terminal en la carpeta del proyecto, ejecuta <code>npm start</code> y recarga esta página.</p></div>`;
}

boot();
