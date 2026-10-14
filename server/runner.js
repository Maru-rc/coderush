// Ejecuta el código del usuario contra los tests de un reto en un proceso aislado.
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const LANGS = ['javascript', 'typescript', 'python'];

const MARK = '@@CODERUSH@@';
const TIMEOUT_MS = 6000;
const MAX_OUTPUT = 2_000_000;
const MAX_LOG = 20_000;
const PYTHON = process.env.PYTHON_CMD || (process.platform === 'win32' ? 'python' : 'python3');

const b64 = (value) => Buffer.from(JSON.stringify(value), 'utf8').toString('base64');

// El arnés se añade DESPUÉS del código del usuario para que los números de línea coincidan.
function jsHarness(code, fn, argsList) {
  return `${code}
;(async () => {
  const __args = JSON.parse(Buffer.from("${b64(argsList)}", "base64").toString("utf8"));
  const __emit = (o) => process.stdout.write("\\n${MARK}" + JSON.stringify(o) + "\\n");
  let __fn;
  try { __fn = ${fn}; } catch {}
  if (typeof __fn !== "function") {
    __emit({ notFound: true });
    return process.stdout.write("", () => process.exit(0));
  }
  for (let __i = 0; __i < __args.length; __i++) {
    __emit({ start: __i });
    const __t0 = performance.now();
    try {
      let __r = __fn(...__args[__i]);
      if (__r && typeof __r.then === "function") __r = await __r;
      let __v = __r === undefined ? null : __r;
      try { JSON.stringify(__v); } catch { __v = String(__r); }
      __emit({ i: __i, ok: true, value: __v, undef: __r === undefined, ms: performance.now() - __t0 });
    } catch (__e) {
      const __at = String((__e && __e.stack) || "").match(/main\\.[jt]s:(\\d+)/);
      __emit({ i: __i, ok: false, error: __e instanceof Error ? __e.name + ": " + __e.message : String(__e), line: __at ? Number(__at[1]) : null, ms: performance.now() - __t0 });
    }
  }
  process.stdout.write("", () => process.exit(0));
})();
`;
}

function pyHarness(code, fn, argsList) {
  return `${code}


def __coderush_run():
    import json as _j, base64 as _b, time as _t, sys as _s, traceback as _tb

    def _conv(o):
        if isinstance(o, (set, frozenset)):
            return sorted(o, key=repr)
        if isinstance(o, tuple):
            return list(o)
        return repr(o)

    def _emit(o):
        _s.stdout.write("\\n${MARK}" + _j.dumps(o, default=_conv) + "\\n")
        _s.stdout.flush()

    _args = _j.loads(_b.b64decode("${b64(argsList)}").decode("utf-8"))
    _fn = globals().get("${fn}")
    if not callable(_fn):
        _emit({"notFound": True})
        return
    for _i, _a in enumerate(_args):
        _emit({"start": _i})
        _t0 = _t.perf_counter()
        try:
            _r = _fn(*_a)
            _ms = (_t.perf_counter() - _t0) * 1000
            try:
                _j.dumps(_r, default=_conv, allow_nan=False)
                _v = _r
            except Exception:
                _v = repr(_r)
            _emit({"i": _i, "ok": True, "value": _v, "undef": _r is None, "ms": _ms})
        except Exception as _e:
            _ln = None
            for _fr in _tb.extract_tb(_e.__traceback__):
                if _fr.filename.endswith("main.py"):
                    _ln = _fr.lineno
            _emit({"i": _i, "ok": False, "error": type(_e).__name__ + ": " + str(_e), "line": _ln, "ms": (_t.perf_counter() - _t0) * 1000})


__coderush_run()
`;
}

// Sin colores de terminal: los códigos ANSI ensucian los mensajes de error.
function childEnv() {
  const env = { ...process.env, NODE_OPTIONS: '', PYTHONIOENCODING: 'utf-8', PYTHONDONTWRITEBYTECODE: '1', PYTHON_COLORS: '0', NO_COLOR: '1', NODE_DISABLE_COLORS: '1' };
  delete env.FORCE_COLOR;
  return env;
}

function execute(cmd, args, cwd) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let overflow = false;
    const child = spawn(cmd, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      env: childEnv(),
    });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, TIMEOUT_MS);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (d) => {
      stdout += d;
      if (stdout.length > MAX_OUTPUT) {
        overflow = true;
        child.kill('SIGKILL');
      }
    });
    child.stderr.on('data', (d) => {
      if (stderr.length < MAX_LOG) stderr += d;
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ spawnError: err, stdout, stderr, timedOut, overflow, ms: Date.now() - t0 });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut, overflow, ms: Date.now() - t0 });
    });
  });
}

export function deepEqual(a, b) {
  if (typeof a === 'number' && typeof b === 'number') {
    return a === b || Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
  }
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((x, i) => deepEqual(x, b[i]));
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a);
    if (ka.length !== Object.keys(b).length) return false;
    return ka.every((k) => Object.hasOwn(b, k) && deepEqual(a[k], b[k]));
  }
  return a === b;
}

const clip = (s) => (s.length > MAX_LOG ? s.slice(0, MAX_LOG) + '\n… (salida recortada)' : s);

function cleanErrors(text, dir) {
  const dirUrl = pathToFileURL(dir).href + '/';
  return text
    .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
    .replace(/\r\n/g, '\n')
    .split(dir + path.sep).join('')
    .split(dirUrl).join('')
    .split('\n')
    .filter((l) => !/node:internal|^Node\.js v\d/.test(l))
    .join('\n')
    .trim();
}

// Separa la salida en: logs globales, logs por test y resultados por test.
function parseOutput(stdout) {
  const results = [];
  const logs = [];
  let globalLog = '';
  let current = null;
  let fatal = null;
  for (const line of stdout.replace(/\r\n/g, '\n').split('\n')) {
    const idx = line.indexOf(MARK);
    if (idx === -1) {
      if (current !== null) logs[current] = (logs[current] ?? '') + line + '\n';
      else globalLog += line + '\n';
      continue;
    }
    const before = line.slice(0, idx);
    if (before) {
      if (current !== null) logs[current] = (logs[current] ?? '') + before;
      else globalLog += before;
    }
    let msg;
    try {
      msg = JSON.parse(line.slice(idx + MARK.length));
    } catch {
      continue;
    }
    if (msg.notFound) fatal = 'notFound';
    else if (typeof msg.start === 'number') current = msg.start;
    else if (typeof msg.i === 'number') {
      results[msg.i] = msg;
      current = null;
    }
  }
  return { results, logs, globalLog, notFound: fatal === 'notFound', lastStarted: current };
}

// ───────────── Diagnóstico de errores del usuario ─────────────
function typeName(v, lang) {
  if (v === null) return lang === 'python' ? 'None' : 'null';
  if (Array.isArray(v)) return 'una lista';
  if (typeof v === 'number') return 'un número';
  if (typeof v === 'string') return 'un texto';
  if (typeof v === 'boolean') return lang === 'python' ? 'un booleano (True/False)' : 'un booleano (true/false)';
  return lang === 'python' ? 'un diccionario' : 'un objeto';
}

// Explica por qué un resultado es incorrecto sin revelar el valor esperado.
function diagnose(actual, expected, undef, lang) {
  if (undef && expected !== null) {
    return lang === 'python'
      ? 'Tu función devolvió None: falta un return (o solo tiene pass).'
      : 'Tu función devolvió undefined: falta un return.';
  }
  if (typeof expected === 'boolean' && typeof actual === 'number') {
    return `Devolviste el número ${actual}, pero se espera un booleano (${lang === 'python' ? 'True o False' : 'true o false'}).`;
  }
  if (typeof expected === 'number' && typeof actual === 'string' && actual.trim() !== '' && !Number.isNaN(Number(actual))) {
    return 'Devolviste el número como texto (entre comillas). Devuelve un número.';
  }
  const ta = typeName(actual, lang);
  const te = typeName(expected, lang);
  if (ta !== te) return `Se esperaba ${te} y devolviste ${ta}.`;
  if (Array.isArray(expected)) {
    if (actual.length !== expected.length) {
      return `Tu lista tiene ${actual.length} elemento${actual.length === 1 ? '' : 's'}, pero se esperaban ${expected.length}.`;
    }
    const canon = (a) => JSON.stringify(a.map((x) => JSON.stringify(x)).sort());
    if (canon(actual) === canon(expected)) return 'Tienes los elementos correctos, pero en distinto orden.';
    const i = expected.findIndex((x, k) => typeName(x, lang) !== typeName(actual[k], lang));
    if (i !== -1) {
      return `El elemento en la posición ${i} es ${typeName(actual[i], lang)}, pero se esperaba ${typeName(expected[i], lang)}.`;
    }
    const wrong = expected.filter((x, k) => !deepEqual(x, actual[k])).length;
    return `Tu lista tiene el tamaño correcto, pero ${wrong === 1 ? 'un elemento no coincide' : `${wrong} elementos no coinciden`}.`;
  }
  if (typeof expected === 'string') {
    if (actual.toLowerCase() === expected.toLowerCase()) return 'Casi: solo cambian mayúsculas y minúsculas.';
    if (actual.trim() === expected.trim()) return 'Sobran espacios al principio o al final del texto.';
    if (actual.length !== expected.length) return `Tu texto tiene ${actual.length} caracteres, pero se esperaban ${expected.length}.`;
    return null;
  }
  if (typeof expected === 'number') {
    if (Number.isInteger(expected) && !Number.isInteger(actual)) {
      return `Devolviste un número con decimales y se esperaba un entero. ¿Usaste / en vez de división entera (${lang === 'python' ? '//' : 'Math.floor o Math.trunc'})?`;
    }
    if (expected !== 0 && actual === -expected) return 'El valor es correcto pero con el signo al revés.';
    if (Math.abs(actual - expected) === 1) return 'Te pasas o te quedas corto por 1: revisa los límites del bucle (< frente a <=) o el valor inicial.';
    return null;
  }
  if (expected && typeof expected === 'object') {
    const missing = Object.keys(expected).filter((k) => !Object.hasOwn(actual, k));
    const extra = Object.keys(actual).filter((k) => !Object.hasOwn(expected, k));
    if (extra.length) return `Tu ${lang === 'python' ? 'diccionario' : 'objeto'} tiene claves de más: ${extra.slice(0, 4).map((k) => JSON.stringify(k)).join(', ')}.`;
    if (missing.length) return `A tu ${lang === 'python' ? 'diccionario' : 'objeto'} le faltan ${missing.length} clave${missing.length === 1 ? '' : 's'}.`;
    return 'Las claves son correctas, pero algún contador tiene un valor distinto.';
  }
  return null;
}

// Busca la línea del código del usuario y la línea "XxxError: ..." en un error de compilación/arranque.
function locateFatal(text, language, codeLines) {
  const re = language === 'python' ? /File "main\.py", line (\d+)/g : /main\.[jt]s:(\d+)/g;
  const all = [...text.matchAll(re)].map((m) => Number(m[1]));
  const lines = all.filter((n) => n <= codeLines);
  let line = lines.length ? (language === 'python' ? lines.at(-1) : lines[0]) : null;
  // Si el error cae en el código añadido tras el del usuario, falta cerrar algo al final de su código.
  if (line === null && all.length) line = codeLines;
  const kind = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^[A-Z]\w*(Error|Exception)\b/.test(l))
    .pop();
  return { line, kind: kind || null };
}

function notFoundMessage(code, name, language) {
  const re = language === 'python' ? /^\s*def\s+(\w+)/gm : /function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:function|async|\(|\w+\s*=>)/g;
  const found = [...code.matchAll(re)].map((m) => m[1] || m[2]).filter((n) => n && n !== name);
  if (found.length) {
    return `El reto espera una función llamada \`${name}\`, pero encontré \`${found[0]}\`. Renómbrala exactamente como \`${name}\` (se distinguen mayúsculas y minúsculas).`;
  }
  return `No encontré la función \`${name}\`. Escribe tu solución dentro de ella y no le cambies el nombre.`;
}

export async function runChallenge(challenge, language, code, mode) {
  const tests = mode === 'submit' ? challenge.tests : challenge.tests.filter((x) => !x.hidden);
  const argsList = tests.map((x) => x.args);
  const dir = await mkdtemp(path.join(os.tmpdir(), 'coderush-'));
  try {
    let file, cmd, args, source;
    if (language === 'python') {
      file = 'main.py';
      source = pyHarness(code, challenge.pyFn, argsList);
      cmd = PYTHON;
      args = ['-X', 'utf8', '-u', file];
    } else if (language === 'typescript') {
      file = 'main.ts';
      source = jsHarness(code, challenge.fn, argsList);
      cmd = process.execPath;
      args = ['--experimental-transform-types', '--disable-warning=ExperimentalWarning', file];
    } else {
      file = 'main.js';
      source = jsHarness(code, challenge.fn, argsList);
      cmd = process.execPath;
      args = [file];
    }
    await writeFile(path.join(dir, file), source, 'utf8');
    const out = await execute(cmd, args, dir);
    const parsed = parseOutput(out.stdout);

    const codeLines = code.split('\n').length;
    const fnName = language === 'python' ? challenge.pyFn : challenge.fn;
    let fatal = null;
    let fatalKind = null;
    let fatalLine = null;
    let fatalError = null;
    if (out.spawnError) {
      fatalKind = 'spawn';
      fatal = language === 'python'
        ? `No se pudo ejecutar Python (“${PYTHON}”). Instálalo o define la variable PYTHON_CMD.`
        : `No se pudo ejecutar el código: ${out.spawnError.message}`;
    } else if (out.overflow) {
      fatalKind = 'overflow';
      fatal = 'Tu programa imprimió demasiado texto y se detuvo. ¿Hay un print/console.log dentro de un bucle que no termina?';
    } else if (out.timedOut) {
      fatalKind = 'timeout';
      fatal = `Tu código tardó más de ${TIMEOUT_MS / 1000} segundos. Suele ser un bucle infinito (la condición nunca deja de cumplirse) o un algoritmo demasiado lento.`;
    } else if (parsed.notFound) {
      fatalKind = 'notFound';
      fatal = notFoundMessage(code, fnName, language);
    } else if (parsed.results.length === 0 && tests.length > 0) {
      fatalKind = 'crash';
      fatal = cleanErrors(out.stderr, dir) || 'El programa terminó sin producir resultados.';
      ({ line: fatalLine, kind: fatalError } = locateFatal(fatal, language, codeLines));
    }

    const testResults = tests.map((test, i) => {
      const r = parsed.results[i];
      const base = { index: i, hidden: !!test.hidden, logs: clip((parsed.logs[i] ?? '').replace(/\n+$/, '')) };
      if (!test.hidden) Object.assign(base, { args: test.args, expected: test.expected });
      if (!r) {
        const status = out.timedOut && parsed.lastStarted === i ? 'timeout' : 'skipped';
        return { ...base, status, passed: false };
      }
      if (!r.ok) {
        const line = r.line && r.line <= codeLines ? r.line : null;
        return { ...base, status: 'error', passed: false, error: cleanErrors(r.error, dir), line, ms: r.ms };
      }
      const passed = deepEqual(r.value, test.expected);
      const res = { ...base, status: passed ? 'pass' : 'fail', passed, ms: r.ms, undef: r.undef };
      if (!passed) res.diagnosis = diagnose(r.value, test.expected, r.undef, language);
      if (!test.hidden) res.actual = r.value;
      return res;
    });

    const passedCount = testResults.filter((x) => x.passed).length;
    return {
      mode,
      language,
      total: tests.length,
      passed: passedCount,
      allPassed: !fatal && passedCount === tests.length,
      fatal: fatal ? clip(fatal) : null,
      fatalKind,
      fatalLine,
      fatalError,
      stderr: !fatal && out.stderr ? clip(cleanErrors(out.stderr, dir)) : '',
      console: clip(parsed.globalLog.replace(/^\n+|\n+$/g, '')),
      ms: out.ms,
      tests: testResults,
    };
  } finally {
    rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
