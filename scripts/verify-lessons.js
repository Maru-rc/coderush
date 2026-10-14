// Verifica la academia: estructura de cada lección, enlaces a retos existentes, que todo reto tenga
// al menos una lección y que cada ejemplo produzca en los 3 lenguajes exactamente la salida mostrada.
// Las preguntas del quiz con código deben imprimir el texto de su respuesta correcta.
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { challenges, challengeById } from '../server/challenges.js';
import { LESSONS, pick, lessonsForChallenge } from '../public/js/lessons.js';

const PYTHON = process.env.PYTHON_CMD || (process.platform === 'win32' ? 'python' : 'python3');
const LANGS = {
  javascript: { ext: 'js', cmd: process.execPath, args: [] },
  typescript: { ext: 'ts', cmd: process.execPath, args: ['--experimental-transform-types', '--disable-warning=ExperimentalWarning'] },
  python: { ext: 'py', cmd: PYTHON, args: ['-X', 'utf8'] },
};
const plain = (html) => html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

let failures = 0;
const report = (ok, label, detail) => {
  if (!ok) failures++;
  if (!ok || process.env.VERBOSE) console.log(`${ok ? '✔' : '✘'} ${label}${ok ? '' : `\n   ${detail}`}`);
};

// ───────────── Estructura y enlaces ─────────────
const ids = new Set();
for (const l of LESSONS) {
  report(!ids.has(l.id), `${l.id}: id único`, 'id repetido');
  ids.add(l.id);
  report(l.title && l.summary && l.sections.length > 0, `${l.id}: título, resumen y secciones`, 'faltan campos');
  for (const id of l.challenges) report(challengeById.has(id), `${l.id} → ${id}`, `el reto "${id}" no existe`);
  for (const [i, s] of l.sections.entries()) {
    report(s.title && s.text && pick(s.code, 'javascript') && pick(s.code, 'python') && s.out != null, `${l.id} sección ${i + 1}: campos`, 'falta título, texto, código JS/Python o salida');
  }
  report(l.quiz.length >= 2, `${l.id}: quiz`, 'el quiz necesita al menos 2 preguntas');
  for (const [i, q] of l.quiz.entries()) {
    report(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length && q.why, `${l.id} pregunta ${i + 1}: respuesta`, 'respuesta fuera de rango o sin explicación');
  }
}
for (const c of challenges) report(lessonsForChallenge(c.id).length > 0, `${c.id}: tiene lección`, `ninguna lección enlaza el reto "${c.id}"`);

// ───────────── Ejecución de ejemplos ─────────────
const dir = await mkdtemp(path.join(os.tmpdir(), 'coderush-lessons-'));
let fileN = 0;

async function run(lang, code) {
  const { ext, cmd, args } = LANGS[lang];
  const file = path.join(dir, `ej${fileN++}.${ext}`);
  await writeFile(file, code, 'utf8');
  return new Promise((resolve) => {
    const child = spawn(cmd, [...args, file], { cwd: dir, timeout: 10000 });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', (err) => resolve({ code: -1, stdout, stderr: err.message }));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

const jobs = [];
for (const l of LESSONS) {
  for (const lang of Object.keys(LANGS)) {
    l.sections.forEach((s, i) => jobs.push({ label: `[${lang}] ${l.id} sección ${i + 1}`, lang, code: pick(s.code, lang), expected: pick(s.out, lang) }));
    l.quiz.forEach((q, i) => {
      if (q.code) jobs.push({ label: `[${lang}] ${l.id} pregunta ${i + 1}`, lang, code: pick(q.code, lang), expected: plain(q.options[q.answer]) });
    });
  }
}

let next = 0;
async function worker() {
  while (next < jobs.length) {
    const job = jobs[next++];
    const r = await run(job.lang, job.code);
    const got = r.stdout.replace(/\r\n/g, '\n').trimEnd();
    const ok = r.code === 0 && !r.stderr.trim() && got === job.expected;
    report(ok, job.label, r.code !== 0 || r.stderr.trim() ? `falló (código ${r.code}): ${r.stderr.trim().split('\n').slice(-3).join(' | ')}` : `esperado ${JSON.stringify(job.expected)}\n   obtenido ${JSON.stringify(got)}`);
  }
}
await Promise.all(Array.from({ length: Math.min(8, os.availableParallelism?.() || 4) }, worker));
await rm(dir, { recursive: true, force: true });

console.log(failures ? `\n${failures} fallo(s) en la academia` : `\nAcademia correcta: ${LESSONS.length} lecciones, ${jobs.length} ejemplos ejecutados.`);
process.exit(failures ? 1 : 0);
