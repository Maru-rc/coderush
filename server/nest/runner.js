// Ejecuta una actividad de NestJS: compila el TypeScript del usuario (con decoradores), arranca su app
// con Nest real en un proceso aparte y compara cada respuesta con lo esperado.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const RUNS = path.join(ROOT, '.runs'); // dentro del proyecto para que el código resuelva node_modules
const DRIVER = fileURLToPath(new URL('./driver.mjs', import.meta.url));
const require = createRequire(path.join(ROOT, 'package.json'));
const MARK = '@@NEST@@';
const TIMEOUT_MS = 15000;
const MAX_OUTPUT = 2_000_000;
const MAX_LOG = 20_000;

export const NEST_PACKAGES = [
  '@nestjs/common', '@nestjs/core', '@nestjs/platform-express', '@nestjs/testing', '@nestjs/config', '@nestjs/jwt',
  '@nestjs/swagger', '@nestjs/typeorm', 'typeorm', 'sql.js', 'class-validator', 'class-transformer', 'reflect-metadata', 'rxjs', 'typescript',
];

export function nestStatus() {
  const missing = NEST_PACKAGES.filter((p) => !existsSync(path.join(ROOT, 'node_modules', p, 'package.json')));
  return { ready: missing.length === 0, missing };
}

let ts = null;
const typescript = () => (ts ??= require('typescript'));

// ───────────── Compilación ─────────────
export function compile(code) {
  const t = typescript();
  const out = t.transpileModule(code, {
    fileName: 'solucion.ts',
    reportDiagnostics: true,
    compilerOptions: {
      module: t.ModuleKind.ESNext,
      target: t.ScriptTarget.ES2022,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      useDefineForClassFields: false,
      inlineSourceMap: true,
      inlineSources: true,
    },
  });
  const d = out.diagnostics?.[0];
  if (d) {
    const line = d.file && d.start != null ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : null;
    return { error: t.flattenDiagnosticMessageText(d.messageText, '\n'), line };
  }
  return { js: out.outputText };
}

// ───────────── Proceso hijo ─────────────
function childEnv(extra) {
  const env = { ...process.env, NODE_OPTIONS: '', NO_COLOR: '1', NODE_DISABLE_COLORS: '1', ...extra };
  delete env.FORCE_COLOR;
  return env;
}

function execute(dir, env) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let overflow = false;
    const child = spawn(process.execPath, ['--enable-source-maps', '--disable-warning=ExperimentalWarning', DRIVER, dir], {
      cwd: dir,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      env: childEnv(env),
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
    child.on('close', () => {
      clearTimeout(timer);
      resolve({ stdout, stderr, timedOut, overflow, ms: Date.now() - t0 });
    });
  });
}

function parseOutput(stdout) {
  const events = [];
  const logs = { global: '', byTest: {} };
  let current = null;
  for (const line of stdout.split('\n')) {
    if (line.startsWith(MARK)) {
      const ev = JSON.parse(line.slice(MARK.length));
      if ('start' in ev) current = ev.start;
      events.push(ev);
    } else if (current === null) logs.global += line + '\n';
    else logs.byTest[current] = (logs.byTest[current] ?? '') + line + '\n';
  }
  return { events, logs };
}

const clip = (s) => (s.length > MAX_LOG ? s.slice(0, MAX_LOG) + '\n… (salida recortada)' : s);
const tidy = (s) => s.replace(/^\n+|\n+$/g, '');

// Deja el mensaje y solo las líneas de la pila que apuntan al código del usuario.
function cleanStack(text) {
  const lines = String(text).replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').split('\n');
  const firstFrame = lines.findIndex((l) => /^\s+at /.test(l));
  const head = (firstFrame === -1 ? lines : lines.slice(0, firstFrame)).join('\n').trim();
  const frames = lines
    .slice(firstFrame === -1 ? lines.length : firstFrame)
    .filter((l) => /solucion\.ts:\d+/.test(l))
    .map((l) => l.replace(/\(?(?:file:\/\/)?[^\s(]*solucion\.ts:/, '(solucion.ts:').replace(/\(\(/, '('));
  return [head, ...frames].join('\n');
}
const userLine = (text) => Number(String(text).match(/solucion\.ts:(\d+)/)?.[1]) || null;

// ───────────── Explicaciones de errores de Nest ─────────────
const c = (s) => `<code>${String(s).replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch])}</code>`;
const NEST_HINTS = [
  [/can't resolve dependencies of the (\w+) \(([^)]*)\)\. Please make sure that the argument "?([\w$]+)"? at index \[\d+\] is available in the (\w+) (?:context|module)/i,
    (m) => /Repository$/.test(m[3])
      ? { title: `Nest no puede inyectar el repositorio ${c(m[3])} en ${c(m[1])}.`, tip: `Los repositorios de TypeORM se registran con ${c('TypeOrmModule.forFeature([Entidad])')} en los ${c('imports')} del módulo que los usa (además de ${c('TypeOrmModule.forRoot(...)')}).` }
      : m[3] === 'Object' || m[3] === 'Function'
        ? { title: `Nest no sabe qué inyectar en ${c(m[1])}.`, tip: `Un parámetro del constructor no tiene un tipo de clase concreto (por ejemplo ${c('any')} o una interfaz). Usa la clase del servicio como tipo, o ${c('@Inject(TOKEN)')}.` }
        : { title: `Nest no puede crear ${c(m[1])}: le falta ${c(m[3])}.`, tip: `Añade ${c(m[3])} a los ${c('providers')} de ${c(m[4])}. Si pertenece a otro módulo, ese módulo debe tenerlo en ${c('exports')} y ${c(m[4])} debe importarlo en ${c('imports')}.` }],
  [/cannot export a provider\/module that is not a part of the currently processed module \((\w+)\)/i,
    (m) => ({ title: `${c(m[1])} exporta algo que no tiene.`, tip: `Solo se puede poner en ${c('exports')} un proveedor que también esté en los ${c('providers')} de ese mismo módulo (o un módulo que importe).` })],
  [/must not appear in the "imports" array/i,
    () => ({ title: 'Hay una clase en el lugar equivocado del módulo.', tip: `En ${c('imports')} solo van módulos. Los controladores van en ${c('controllers')} y los servicios, guards, etc. en ${c('providers')}.` })],
  [/(?:module at index \[\d+\] of the (\w+) "imports" array is undefined|Nest cannot create the (\w+) instance)/i,
    (m) => ({ title: `Un módulo importado por ${c(m[1] || m[2])} es ${c('undefined')}.`, tip: 'Suele pasar al usar un módulo antes de declararlo en el archivo. Declara primero los módulos que se importan y después el que los importa.' })],
  [/No metadata for "(\w+)" was found|Entity metadata for (\w+)#\w+ was not found/i,
    (m) => ({ title: `TypeORM no conoce la entidad ${c(m[1] || m[2])}.`, tip: `Añade la clase a ${c('entities')} en ${c('TypeOrmModule.forRoot')} (o usa ${c('autoLoadEntities: true')}) y comprueba que tenga ${c('@Entity()')}.` })],
  [/does not provide an export named '(\w+)'/,
    (m) => ({ title: `${c(m[1])} no existe en el paquete del que lo importas.`, tip: 'Revisa el nombre (mayúsculas incluidas) y el paquete: por ejemplo, los decoradores de validación vienen de <code>class-validator</code> y los de Swagger de <code>@nestjs/swagger</code>.' })],
  [/Cannot find (?:package|module) '([^']+)'/,
    (m) => ({ title: `El paquete ${c(m[1])} no está disponible.`, tip: 'En CodeRush puedes usar los paquetes de NestJS instalados: <code>@nestjs/*</code>, <code>typeorm</code>, <code>class-validator</code>, <code>class-transformer</code> y <code>rxjs</code>. No se pueden importar otros archivos.' })],
  [/secretOrPrivateKey must have a value|secret.*must be provided/i,
    () => ({ title: 'JwtService no tiene una clave secreta.', tip: `Registra el módulo con ${c("JwtModule.register({ secret: '…' })")}.` })],
  [/(\w+) is not defined/,
    (m) => ({ title: `Usas ${c(m[1])} sin haberlo importado o declarado.`, tip: `Si es un decorador o una clase de Nest, añádelo al ${c('import')} de arriba del archivo.` })],
];

function nestHint(text) {
  for (const [re, fn] of NEST_HINTS) {
    const m = String(text).match(re);
    if (m) return fn(m);
  }
  return null;
}

// ───────────── Comparación ─────────────
const fmt = (v) => (v === undefined ? 'nada' : JSON.stringify(v));
const WILDCARDS = { '<string>': (v) => typeof v === 'string', '<number>': (v) => typeof v === 'number', '<any>': (v) => v !== undefined };

// Devuelve null si coinciden, o la primera diferencia: { at, expected, got, kind }.
function compare(expected, got, partial, at = 'cuerpo') {
  if (typeof expected === 'string' && WILDCARDS[expected]) return WILDCARDS[expected](got) ? null : { at, expected, got, kind: 'type' };
  if (Array.isArray(expected)) {
    if (!Array.isArray(got)) return { at, expected, got, kind: 'value' };
    if (got.length !== expected.length) return { at, expected, got, kind: 'length' };
    for (let i = 0; i < expected.length; i++) {
      const d = compare(expected[i], got[i], partial, `${at}[${i}]`);
      if (d) return d;
    }
    return null;
  }
  if (expected && typeof expected === 'object') {
    if (!got || typeof got !== 'object' || Array.isArray(got)) return { at, expected, got, kind: 'value' };
    for (const k of Object.keys(expected)) {
      if (!Object.hasOwn(got, k)) return { at: `${at}.${k}`, expected: expected[k], got: undefined, kind: 'missing' };
      const d = compare(expected[k], got[k], partial, `${at}.${k}`);
      if (d) return d;
    }
    if (!partial) {
      const extra = Object.keys(got).find((k) => !Object.hasOwn(expected, k));
      if (extra) return { at: `${at}.${extra}`, got: got[extra], kind: 'extra' };
    }
    return null;
  }
  return expected === got ? null : { at, expected, got, kind: 'value' };
}

function describeDiff(d) {
  if (d.kind === 'missing') return `Falta la propiedad \`${d.at}\` (se esperaba ${fmt(d.expected)}).`;
  if (d.kind === 'extra') return `Sobra la propiedad \`${d.at}\` (vale ${fmt(d.got)}). La respuesta debe tener solo las propiedades esperadas.`;
  if (d.kind === 'length') return `\`${d.at}\` tiene ${d.got.length} elemento${d.got.length === 1 ? '' : 's'} y se esperaban ${d.expected.length}.`;
  if (d.kind === 'type') return `En \`${d.at}\` se esperaba un valor de tipo ${d.expected.slice(1, -1)} y llegó ${fmt(d.got)}.`;
  if (typeof d.expected === 'number' && typeof d.got === 'string' && String(d.expected) === d.got) {
    return `En \`${d.at}\` llegó el texto ${fmt(d.got)} en vez del número ${d.expected}. Los parámetros y las variables de entorno llegan como texto: conviértelos (por ejemplo con \`ParseIntPipe\` o \`Number(...)\`).`;
  }
  return `En \`${d.at}\` se esperaba ${fmt(d.expected)} y llegó ${fmt(d.got)}.`;
}

function diagnoseStatus(test, r) {
  const exp = test.expect.status;
  const got = r.status;
  const { method, path: route } = test.req;
  if (got === 404 && exp !== 404) {
    const missingRoute = typeof r.body === 'object' && /^Cannot \w+ /.test(r.body?.message ?? '');
    return missingRoute
      ? `La ruta ${method} ${route.split('?')[0]} no existe. Revisa el prefijo de \`@Controller(...)\`, el decorador del método (\`@${method[0] + method.slice(1).toLowerCase()}(...)\`) y que el controlador esté en \`controllers\` de su módulo.`
      : 'Respondiste 404 (no encontrado) donde se esperaba otra cosa.';
  }
  if (got === 500) return 'Tu código lanzó un error al atender la petición. Mira el error de abajo.';
  if (exp === 200 && got === 201 && method === 'POST') return '`@Post` responde 201 por defecto. Para devolver 200 añade `@HttpCode(200)` al método.';
  if (exp === 204 && got !== 204) return 'Para responder sin contenido usa `@HttpCode(204)` en el método.';
  if (exp === 400 && got < 300) return method === 'GET'
    ? 'Se aceptó un parámetro inválido. Conviértelo con un pipe como `ParseIntPipe`, que responde 400 si el valor no sirve.'
    : 'Se aceptaron datos inválidos. Valida el cuerpo: decoradores de `class-validator` en el DTO y `ValidationPipe` activado (en `configurar(app)` con `app.useGlobalPipes(...)`).';
  if ((exp === 401 || exp === 403) && got < 300) return 'La ruta debería estar protegida: aplica el guard con `@UseGuards(...)` y haz que no deje pasar esta petición.';
  if (exp === 401 && got === 403) return 'Respondiste 403 (prohibido), pero aquí corresponde 401 (no autenticado): lanza `UnauthorizedException` en vez de devolver `false`.';
  if (exp === 403 && got === 401) return 'Respondiste 401, pero aquí corresponde 403: devuelve `false` en el guard (o lanza `ForbiddenException`).';
  if (exp === 404 && got < 300) return 'Cuando el recurso no existe, lanza `NotFoundException` en vez de devolver una respuesta vacía.';
  return `Se esperaba el estado ${exp} y llegó ${got}.`;
}

function evaluate(test, r) {
  if (test.req) {
    const errors = (r.errors ?? []).map(cleanStack);
    const actual = { status: r.status, body: r.body === '' ? null : r.body };
    if (r.status !== test.expect.status) {
      return { passed: false, actual, diagnosis: diagnoseStatus(test, r), error: errors[0] ?? null };
    }
    const spec = test.expect.body !== undefined ? [test.expect.body, false] : test.expect.match !== undefined ? [test.expect.match, true] : null;
    if (spec) {
      if (!r.isJson && typeof spec[0] === 'object') {
        return { passed: false, actual, diagnosis: 'La respuesta no es JSON. Devuelve un objeto o un arreglo desde el método y Nest lo enviará como JSON.' };
      }
      const d = compare(spec[0], actual.body, spec[1]);
      if (d) return { passed: false, actual, diagnosis: describeDiff(d) };
    }
    return { passed: true, actual };
  }
  // Llamada directa a un proveedor
  if (r.missing) return { passed: false, diagnosis: `No encontré la clase \`${r.missing}\`. Debe estar exportada (\`export class ${r.missing}\`).` };
  if (r.threw) {
    if (test.expect.throws && r.threw.name === test.expect.throws) return { passed: true, actual: { threw: r.threw.name } };
    return { passed: false, actual: { threw: r.threw.name }, error: cleanStack(r.error), diagnosis: /is not a function/.test(r.threw.message) ? `\`${test.call.provider}\` no tiene el método \`${test.call.method}\`.` : null };
  }
  if (test.expect.throws) return { passed: false, actual: { value: r.value }, diagnosis: `Se esperaba que lanzara \`${test.expect.throws}\`.` };
  const exp = test.expect.value !== undefined ? [test.expect.value, false] : [test.expect.match, true];
  const d = compare(exp[0], r.undef ? undefined : r.value, exp[1], 'resultado');
  return d ? { passed: false, actual: { value: r.value }, diagnosis: r.undef ? 'El método no devolvió nada: ¿falta un `return`?' : describeDiff(d) } : { passed: true, actual: { value: r.value } };
}

// ───────────── API ─────────────
const FATALS = {
  import: 'Tu código falló al cargarse',
  boot: 'La aplicación no pudo arrancar',
  configurar: 'Falló la función configurar(app)',
};

export async function runNestActivity(activity, code) {
  const status = nestStatus();
  const base = { total: activity.tests.length, passed: 0, allPassed: false, tests: [], console: '', ms: 0 };
  if (!status.ready) {
    return { ...base, fatalKind: 'setup', fatal: `Faltan las dependencias de NestJS (${status.missing.slice(0, 4).join(', ')}${status.missing.length > 4 ? '…' : ''}). Ejecuta \`npm install\` en la carpeta del proyecto y reinicia \`npm start\`.` };
  }
  const compiled = compile(code);
  if (compiled.error) {
    return { ...base, fatalKind: 'syntax', fatalHeading: compiled.line ? `Error de sintaxis en la línea ${compiled.line}` : 'Error de sintaxis', fatal: compiled.error, fatalLine: compiled.line, fatalError: `SyntaxError: ${compiled.error}` };
  }

  await mkdir(RUNS, { recursive: true });
  const dir = await mkdtemp(path.join(RUNS, 'r-'));
  try {
    await writeFile(path.join(dir, 'solucion.mjs'), compiled.js, 'utf8');
    await writeFile(path.join(dir, 'spec.json'), JSON.stringify({ module: activity.module, tests: activity.tests }), 'utf8');
    const out = await execute(dir, activity.env);
    const { events, logs } = parseOutput(out.stdout);
    const fatalEv = events.find((e) => e.fatal);
    const results = new Map(events.filter((e) => 'i' in e).map((e) => [e.i, e]));
    const lastStarted = events.filter((e) => 'start' in e).at(-1)?.start ?? null;

    let fatal = null;
    if (out.spawnError) fatal = { fatalKind: 'spawn', fatal: `No se pudo ejecutar Node: ${out.spawnError.message}` };
    else if (out.overflow) fatal = { fatalKind: 'overflow', fatal: 'Tu código imprimió demasiado texto y se detuvo. ¿Hay un `console.log` dentro de un bucle infinito?' };
    else if (fatalEv?.fatal === 'notFound') {
      fatal = { fatalKind: 'notFound', fatal: `No encontré \`export class ${fatalEv.name}\`. CodeRush arranca ese módulo: decláralo con ese nombre y expórtalo.${fatalEv.exports.length ? ` Exportas: ${fatalEv.exports.map((x) => `\`${x}\``).join(', ')}.` : ''}` };
    } else if (fatalEv) {
      const text = cleanStack(fatalEv.error);
      fatal = { fatalKind: 'crash', fatalHeading: FATALS[fatalEv.fatal], fatal: text, fatalLine: userLine(fatalEv.error), fatalError: text, fatalHint: nestHint(text) };
    } else if (out.timedOut && lastStarted === null) {
      fatal = { fatalKind: 'timeout', fatal: `La aplicación tardó más de ${TIMEOUT_MS / 1000} segundos en arrancar. ¿Hay un bucle infinito en algún constructor o en configurar(app)?` };
    } else if (!events.some((e) => e.ready) && !out.timedOut) {
      const text = cleanStack(out.stderr) || 'El proceso terminó sin arrancar la aplicación.';
      fatal = { fatalKind: 'crash', fatalHeading: 'La aplicación no pudo arrancar', fatal: text, fatalLine: userLine(out.stderr), fatalError: text, fatalHint: nestHint(text) };
    }

    const tests = activity.tests.map((test, i) => {
      const r = results.get(i);
      const info = { index: i, name: test.name, req: test.req, call: test.call, expect: test.expect, logs: clip(tidy(logs.byTest[i] ?? '')) };
      if (!r) {
        const timeout = out.timedOut && lastStarted === i;
        return { ...info, status: timeout ? 'timeout' : 'skipped', passed: false, diagnosis: timeout ? 'Esta petición no terminó a tiempo: ¿algún método nunca devuelve (por ejemplo, un `await` que no se resuelve o un bucle infinito)?' : null };
      }
      if (r.error && test.req) {
        const err = cleanStack(r.error);
        return { ...info, status: 'error', passed: false, error: err, line: userLine(r.error), ms: r.ms };
      }
      const ev = evaluate(test, r);
      const error = ev.error ?? null;
      return { ...info, status: ev.passed ? 'pass' : error ? 'error' : 'fail', passed: ev.passed, actual: ev.actual, diagnosis: ev.diagnosis ?? null, error, line: error ? userLine(error) : null, hint: error ? nestHint(error) : null, ms: r.ms };
    });

    const passed = tests.filter((x) => x.passed).length;
    return {
      ...base,
      ...fatal,
      fatal: fatal?.fatal ? clip(fatal.fatal) : null,
      passed,
      allPassed: !fatal && passed === tests.length,
      tests,
      console: clip(tidy(logs.global)),
      stderr: fatal ? '' : clip(cleanStack(out.stderr)),
      ms: out.ms,
    };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
