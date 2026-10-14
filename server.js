import http from 'node:http';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { challenges, challengeById, publicChallenge } from './server/challenges.js';
import { runChallenge, LANGS } from './server/runner.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data');
const PROGRESS = path.join(DATA, 'progress.json');
const PORT = Number(process.env.PORT) || 3000;
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const publicList = JSON.stringify(challenges.map(publicChallenge));

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

function readBody(req, limit = 2_000_000) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('Cuerpo demasiado grande'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// El servidor ejecuta código: solo aceptamos peticiones de la propia app en localhost
// (evita que otra web abierta en el navegador lo use, y ataques de DNS rebinding).
function isTrusted(req) {
  const host = (req.headers.host || '').toLowerCase();
  if (host !== `localhost:${PORT}` && host !== `127.0.0.1:${PORT}`) return false;
  const origin = req.headers.origin;
  if (origin && origin !== `http://localhost:${PORT}` && origin !== `http://127.0.0.1:${PORT}`) return false;
  if (req.method !== 'GET' && !(req.headers['content-type'] || '').startsWith('application/json')) return false;
  return true;
}

let saving = Promise.resolve();
function saveProgress(json) {
  saving = saving.then(async () => {
    await mkdir(DATA, { recursive: true });
    const tmp = PROGRESS + '.tmp';
    await writeFile(tmp, json, 'utf8');
    await rename(tmp, PROGRESS);
  });
  return saving;
}

async function handleApi(req, res, pathname) {
  if (!isTrusted(req)) return send(res, 403, JSON.stringify({ error: 'Origen no permitido' }));

  if (pathname === '/api/challenges' && req.method === 'GET') return send(res, 200, publicList);

  if (pathname === '/api/run' && req.method === 'POST') {
    const body = JSON.parse(await readBody(req));
    const challenge = challengeById.get(body.challengeId);
    if (!challenge) return send(res, 404, JSON.stringify({ error: 'Reto no encontrado' }));
    if (!LANGS.includes(body.language)) return send(res, 400, JSON.stringify({ error: 'Lenguaje no soportado' }));
    const mode = body.mode === 'submit' ? 'submit' : 'run';
    const result = await runChallenge(challenge, body.language, String(body.code ?? ''), mode);
    return send(res, 200, JSON.stringify(result));
  }

  if (pathname === '/api/progress') {
    if (req.method === 'GET') {
      try {
        return send(res, 200, await readFile(PROGRESS, 'utf8'));
      } catch {
        return send(res, 200, 'null');
      }
    }
    if (req.method === 'PUT') {
      const text = await readBody(req);
      JSON.parse(text); // valida
      await saveProgress(text);
      return send(res, 200, '{"ok":true}');
    }
  }

  return send(res, 404, JSON.stringify({ error: 'No encontrado' }));
}

async function handleStatic(res, pathname) {
  const rel = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) return send(res, 403, 'Prohibido', 'text/plain');
  try {
    const data = await readFile(file);
    send(res, 200, data, MIME[path.extname(file)] || 'application/octet-stream');
  } catch {
    send(res, 404, 'No encontrado', 'text/plain; charset=utf-8');
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    if (pathname.startsWith('/api/')) await handleApi(req, res, pathname);
    else await handleStatic(res, pathname);
  } catch (err) {
    send(res, 500, JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  ⚡ CodeRush listo en  http://localhost:${PORT}\n`);
});
