// Proceso hijo: carga la solución compilada, arranca su AppModule con Nest y ejecuta las pruebas en orden.
// Solo ejecuta y reporta; quien compara con lo esperado es nest/runner.js.
// Uso: node --enable-source-maps driver.mjs <carpeta con solucion.mjs y spec.json>
import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const MARK = '@@NEST@@';
const emit = (o) => process.stdout.write(`\n${MARK}${JSON.stringify(o)}\n`);
const finish = () => process.stdout.write('', () => process.exit(0));
const errText = (e) => (e instanceof Error ? e.stack || `${e.name}: ${e.message}` : String(e));

const dir = process.argv[2];
const spec = JSON.parse(await readFile(path.join(dir, 'spec.json'), 'utf8'));

// Nest registra con su logger los errores no controlados de cada petición (los que acaban en 500).
const captured = [];
const capture = (args) => {
  const err = args.find((a) => a instanceof Error);
  captured.push(err ? errText(err) : args.filter((a) => typeof a === 'string').join(' '));
};
const logger = { log() {}, warn() {}, debug() {}, verbose() {}, error: (...a) => capture(a), fatal: (...a) => capture(a) };

let user;
try {
  user = await import(pathToFileURL(path.join(dir, 'solucion.mjs')).href);
} catch (e) {
  emit({ fatal: 'import', error: errText(e) });
  finish();
}

if (user) await main();

async function main() {
  const Root = user[spec.module];
  if (typeof Root !== 'function') {
    emit({ fatal: 'notFound', name: spec.module, exports: Object.keys(user) });
    return finish();
  }
  const { NestFactory } = await import('@nestjs/core');
  let app;
  try {
    // abortOnError: false → si falla el arranque, lanza el error en vez de terminar el proceso.
    app = await NestFactory.create(Root, { logger, abortOnError: false });
  } catch (e) {
    emit({ fatal: 'boot', error: errText(e) });
    return finish();
  }
  if (typeof user.configurar === 'function') {
    try {
      await user.configurar(app);
    } catch (e) {
      emit({ fatal: 'configurar', error: errText(e) });
      return finish();
    }
  }
  try {
    await app.listen(0, '127.0.0.1');
  } catch (e) {
    emit({ fatal: 'boot', error: errText(e) });
    return finish();
  }
  const base = `http://127.0.0.1:${app.getHttpServer().address().port}`;
  emit({ ready: true });

  const vars = {};
  const fill = (v) => {
    if (typeof v === 'string') return v.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
    if (Array.isArray(v)) return v.map(fill);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)]));
    return v;
  };
  const dig = (obj, p) => p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  const safe = (v) => {
    try {
      return JSON.parse(JSON.stringify(v ?? null));
    } catch {
      return String(v);
    }
  };

  for (const [i, t] of spec.tests.entries()) {
    emit({ start: i });
    captured.length = 0;
    const t0 = performance.now();
    if (t.req) {
      const req = fill(t.req);
      try {
        const headers = { ...req.headers };
        let body;
        if (req.body !== undefined) {
          headers['content-type'] = 'application/json';
          body = JSON.stringify(req.body);
        }
        const r = await fetch(base + req.path, { method: req.method, headers, body, signal: AbortSignal.timeout(5000) });
        const text = await r.text();
        let parsed;
        let isJson = false;
        try {
          parsed = text ? JSON.parse(text) : null;
          isJson = true;
        } catch {
          parsed = text;
        }
        for (const [k, p] of Object.entries(t.save ?? {})) vars[k] = dig(parsed, p);
        emit({ i, status: r.status, body: parsed, isJson, errors: [...captured], ms: performance.now() - t0 });
      } catch (e) {
        emit({ i, error: e.name === 'TimeoutError' ? 'La petición no respondió en 5 segundos.' : errText(e), ms: performance.now() - t0 });
      }
    } else if (t.call) {
      const Cls = user[t.call.provider];
      if (typeof Cls !== 'function') {
        emit({ i, missing: t.call.provider });
        continue;
      }
      try {
        const instance = app.get(Cls, { strict: false });
        const value = await instance[t.call.method](...fill(t.call.args ?? []));
        emit({ i, value: safe(value), undef: value === undefined, ms: performance.now() - t0 });
      } catch (e) {
        emit({ i, threw: { name: e?.constructor?.name ?? 'Error', message: e?.message ?? String(e) }, error: errText(e), ms: performance.now() - t0 });
      }
    }
  }
  await app.close().catch(() => {});
  finish();
}
