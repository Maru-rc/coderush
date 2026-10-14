// Verifica que cada reto tenga resultados esperados correctos (con soluciones de referencia en JS)
// y que los ejecutores de TypeScript y Python funcionen. Uso: npm run verify
import { challenges, challengeById } from '../server/challenges.js';
import { runChallenge } from '../server/runner.js';

const js = {
  suma: 'function suma(a, b) { return a + b; }',
  'es-par': 'function esPar(n) { return n % 2 === 0; }',
  'mayor-de-tres': 'function mayorDeTres(a, b, c) { let m = a; if (b > m) m = b; if (c > m) m = c; return m; }',
  bisiesto: 'function esBisiesto(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }',
  'invertir-texto': 'function invertirTexto(s) { return [...s].reverse().join(""); }',
  'contar-vocales': 'function contarVocales(s) { return [...s.toLowerCase()].filter(c => "aeiou".includes(c)).length; }',
  fizzbuzz: 'function fizzBuzz(n) { const r = []; for (let i = 1; i <= n; i++) r.push(i % 15 === 0 ? "FizzBuzz" : i % 3 === 0 ? "Fizz" : i % 5 === 0 ? "Buzz" : String(i)); return r; }',
  'suma-arreglo': 'function sumaArreglo(nums) { let s = 0; for (const x of nums) s += x; return s; }',
  factorial: 'function factorial(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }',
  palindromo: 'function esPalindromo(s) { const c = s.replace(/ /g, "").toLowerCase(); return c === [...c].reverse().join(""); }',
  'contar-palabras': 'function contarPalabras(s) { return s.split(" ").filter(Boolean).length; }',
  celsius: 'function celsiusAFahrenheit(c) { return c * 9 / 5 + 32; }',
  'tabla-multiplicar': 'function tablaMultiplicar(n) { return Array.from({ length: 10 }, (_, i) => n * (i + 1)); }',
  'palabra-mas-larga': 'function palabraMasLarga(s) { let b = ""; for (const w of s.split(" ")) if (w.length > b.length) b = w; return b; }',
  fibonacci: 'function fibonacci(n) { let a = 0, b = 1; for (let i = 0; i < n; i++) [a, b] = [b, a + b]; return a; }',
  'es-primo': 'function esPrimo(n) { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }',
  mcd: 'function mcd(a, b) { while (b) [a, b] = [b, a % b]; return a; }',
  'suma-digitos': 'function sumaDigitos(n) { let s = 0; while (n > 0) { s += n % 10; n = Math.floor(n / 10); } return s; }',
  anagramas: 'function sonAnagramas(a, b) { const f = s => [...s.replace(/ /g, "").toLowerCase()].sort().join(""); return f(a) === f(b); }',
  'eliminar-duplicados': 'function eliminarDuplicados(nums) { return [...new Set(nums)]; }',
  'segundo-mayor': 'function segundoMayor(nums) { const u = [...new Set(nums)].sort((a, b) => b - a); return u.length > 1 ? u[1] : null; }',
  capitalizar: 'function capitalizarPalabras(s) { return s.split(" ").map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w).join(" "); }',
  'contar-caracteres': 'function contarCaracteres(s) { const o = {}; for (const c of s) if (c !== " ") o[c] = (o[c] || 0) + 1; return o; }',
  romanos: 'function romanoADecimal(s) { const v = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }; let t = 0; for (let i = 0; i < s.length; i++) { const x = v[s[i]]; t += x < (v[s[i + 1]] || 0) ? -x : x; } return t; }',
  aplanar: 'function aplanar(arr) { return arr.flat(Infinity); }',
  parentesis: 'function parentesisBalanceados(s) { const p = { ")": "(", "]": "[", "}": "{" }, st = []; for (const c of s) { if ("([{".includes(c)) st.push(c); else if (st.pop() !== p[c]) return false; } return st.length === 0; }',
  rotar: 'function rotarArreglo(nums, k) { if (!nums.length) return []; k %= nums.length; return [...nums.slice(nums.length - k), ...nums.slice(0, nums.length - k)]; }',
  comprimir: 'function comprimirTexto(s) { let r = ""; for (let i = 0; i < s.length;) { let j = i; while (s[j] === s[i]) j++; r += s[i] + (j - i); i = j; } return r; }',
  escaleras: 'function escaleras(n) { let a = 1, b = 1; for (let i = 0; i < n; i++) [a, b] = [b, a + b]; return a; }',
  'busqueda-binaria': 'function busquedaBinaria(nums, x) { let l = 0, r = nums.length - 1; while (l <= r) { const m = (l + r) >> 1; if (nums[m] === x) return m; if (nums[m] < x) l = m + 1; else r = m - 1; } return -1; }',
  burbuja: 'function ordenarBurbuja(nums) { const a = [...nums]; for (let i = 0; i < a.length; i++) for (let j = 0; j < a.length - 1 - i; j++) if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]]; return a; }',
  'primos-hasta': 'function primosHasta(n) { const r = []; for (let i = 2; i <= n; i++) { let p = true; for (let j = 2; j * j <= i; j++) if (i % j === 0) { p = false; break; } if (p) r.push(i); } return r; }',
  transpuesta: 'function transpuesta(m) { return m[0].map((_, j) => m.map(row => row[j])); }',
  armstrong: 'function esArmstrong(n) { const d = String(n); return [...d].reduce((s, c) => s + Number(c) ** d.length, 0) === n; }',
  'dos-suma': 'function dosSuma(nums, t) { const seen = new Map(); for (let i = 0; i < nums.length; i++) { if (seen.has(t - nums[i])) return [seen.get(t - nums[i]), i]; seen.set(nums[i], i); } }',
  binario: 'function decimalABinario(n) { if (n === 0) return "0"; let r = ""; while (n > 0) { r = (n % 2) + r; n = Math.floor(n / 2); } return r; }',
  kadane: 'function maximaSumaSubarreglo(nums) { let cur = nums[0], best = nums[0]; for (const x of nums.slice(1)) { cur = Math.max(x, cur + x); best = Math.max(best, cur); } return best; }',
  espiral: 'function espiral(m) { const r = []; if (!m.length) return r; let t = 0, b = m.length - 1, l = 0, rt = m[0].length - 1; while (t <= b && l <= rt) { for (let j = l; j <= rt; j++) r.push(m[t][j]); t++; for (let i = t; i <= b; i++) r.push(m[i][rt]); rt--; if (t <= b) { for (let j = rt; j >= l; j--) r.push(m[b][j]); b--; } if (l <= rt) { for (let i = b; i >= t; i--) r.push(m[i][l]); l++; } } return r; }',
  hanoi: 'function hanoi(n, o, d, a) { if (n === 0) return []; return [...hanoi(n - 1, o, a, d), o + "->" + d, ...hanoi(n - 1, a, d, o)]; }',
  'sin-repetir': 'function subcadenaSinRepetir(s) { const last = new Map(); let start = 0, best = 0; for (let i = 0; i < s.length; i++) { if (last.has(s[i]) && last.get(s[i]) >= start) start = last.get(s[i]) + 1; last.set(s[i], i); best = Math.max(best, i - start + 1); } return best; }',
  rpn: 'function evaluarRPN(tokens) { const st = []; for (const t of tokens) { if ("+-*/".includes(t) && t.length === 1) { const b = st.pop(), a = st.pop(); st.push(t === "+" ? a + b : t === "-" ? a - b : t === "*" ? a * b : Math.trunc(a / b)); } else st.push(Number(t)); } return st[0]; }',
  islas: 'function contarIslas(g) { let c = 0; const sink = (i, j) => { if (i < 0 || j < 0 || i >= g.length || j >= g[0].length || g[i][j] !== 1) return; g[i][j] = 0; sink(i + 1, j); sink(i - 1, j); sink(i, j + 1); sink(i, j - 1); }; for (let i = 0; i < g.length; i++) for (let j = 0; j < g[i].length; j++) if (g[i][j] === 1) { c++; sink(i, j); } return c; }',
  monedas: 'function cambioMonedas(m, coins) { const dp = Array(m + 1).fill(Infinity); dp[0] = 0; for (let x = 1; x <= m; x++) for (const c of coins) if (c <= x) dp[x] = Math.min(dp[x], dp[x - c] + 1); return dp[m] === Infinity ? -1 : dp[m]; }',
};

const extra = [
  ['python', 'suma', 'def suma(a: int, b: int) -> int:\n    print("debug", a)\n    return a + b'],
  ['python', 'segundo-mayor', 'def segundo_mayor(nums):\n    u = sorted(set(nums), reverse=True)\n    return u[1] if len(u) > 1 else None'],
  ['python', 'contar-caracteres', 'def contar_caracteres(s):\n    d = {}\n    for c in s:\n        if c != " ":\n            d[c] = d.get(c, 0) + 1\n    return d'],
  ['python', 'celsius', 'def celsius_a_fahrenheit(c: float) -> float:\n    return c * 9 / 5 + 32'],
  ['python', 'rpn', 'def evaluar_rpn(tokens):\n    st = []\n    for t in tokens:\n        if t in "+-*/" and len(t) == 1:\n            b, a = st.pop(), st.pop()\n            st.append(a + b if t == "+" else a - b if t == "-" else a * b if t == "*" else int(a / b))\n        else:\n            st.append(int(t))\n    return st[0]'],
  ['typescript', 'dos-suma', 'enum Nada { A }\nfunction dosSuma(nums: number[], objetivo: number): number[] {\n  const seen = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const j = seen.get(objetivo - nums[i]);\n    if (j !== undefined) return [j, i];\n    seen.set(nums[i], i);\n  }\n  return [];\n}'],
  ['typescript', 'hanoi', 'function hanoi(n: number, o: string, d: string, a: string): string[] {\n  if (n === 0) return [];\n  return [...hanoi(n - 1, o, a, d), `${o}->${d}`, ...hanoi(n - 1, a, d, o)];\n}'],
];

// Casos que deben FALLAR de forma controlada.
const negative = [
  ['javascript', 'suma', 'function suma(a, b) { a + b; }', (r) => !r.allPassed && r.tests[0].undef && /return/.test(r.tests[0].diagnosis)],
  ['javascript', 'suma', 'function sumar(a, b) { return a + b; }', (r) => r.fatalKind === 'notFound' && /`sumar`/.test(r.fatal)],
  ['javascript', 'suma', 'function suma(a, b) { while (true) {} }', (r) => r.fatalKind === 'timeout' && r.tests[0].status === 'timeout'],
  ['javascript', 'suma', 'function suma(a, b) {\n  return a + b;\n', (r) => /end of input/.test(r.fatalError) && r.fatalLine === 3],
  ['javascript', 'invertir-texto', 'function invertirTexto(s) {\n  let r = "";\n  for (let i = s.length; i >= 0; i--) r += s[i].toUpperCase();\n  return r;\n}', (r) => r.tests[0].status === 'error' && r.tests[0].line === 3],
  ['python', 'suma', 'def suma(a, b)\n    return a + b', (r) => /SyntaxError/.test(r.fatalError) && r.fatalLine === 1],
  ['python', 'suma', 'def suma(a, b):\nreturn a + b', (r) => /IndentationError/.test(r.fatalError) && r.fatalLine === 2],
  ['python', 'factorial', 'def factorial(n):\n    return factorial(n - 1) * n', (r) => r.tests.every((x) => x.status === 'error' && x.line === 2)],
  ['python', 'fizzbuzz', 'def fizz_buzz(n):\n    return list(range(1, n + 1))', (r) => /posición 0 es un número/.test(r.tests[0].diagnosis)],
  ['typescript', 'suma', 'function suma(a: number, b: number): number {\n  throw new Error("boom");\n}', (r) => r.tests[0].error === 'Error: boom' && r.tests[0].line === 2],
  ['typescript', 'suma', 'function suma(a: number, b: number): number {\n  return a +;\n}', (r) => /SyntaxError/.test(r.fatalError) && r.fatalLine === 2],
];

let failures = 0;
const report = (ok, label, detail) => {
  if (!ok) failures++;
  console.log(`${ok ? '✔' : '✘'} ${label}${ok ? '' : `\n   ${detail}`}`);
};

for (const c of challenges) {
  const code = js[c.id];
  if (!code) {
    report(false, c.id, 'falta solución de referencia');
    continue;
  }
  const r = await runChallenge(c, 'javascript', code, 'submit');
  report(r.allPassed, `[js] ${c.id}`, JSON.stringify(r.fatal ?? r.tests.filter((x) => !x.passed)));
}

for (const [lang, id, code] of extra) {
  const r = await runChallenge(challengeById.get(id), lang, code, 'submit');
  report(r.allPassed, `[${lang}] ${id}`, JSON.stringify(r.fatal ?? r.tests.filter((x) => !x.passed)));
}

for (const [lang, id, code, check] of negative) {
  const r = await runChallenge(challengeById.get(id), lang, code, 'submit');
  report(check(r), `[${lang}] ${id} (caso negativo)`, JSON.stringify(r).slice(0, 600));
}

console.log(failures ? `\n${failures} fallo(s)` : `\nTodo correcto: ${challenges.length} retos verificados.`);
process.exit(failures ? 1 : 0);
