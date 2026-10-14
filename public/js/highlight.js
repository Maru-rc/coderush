// Resaltado de sintaxis ligero para los ejemplos de las lecciones (JS, TS, Python, JSON y terminal), con la paleta del editor.
// Devuelve una línea HTML por línea de código para poder numerarlas.

const words = (s) => new Set(s.split(' '));
const JS_KW = 'const let var function return if else for while do of in break continue new true false null undefined typeof instanceof class switch case default throw try catch';
const LANG = {
  javascript: { kw: words(JS_KW), types: new Set(), builtins: words('console Math Number String Array Map Set Object JSON Infinity') },
  typescript: { kw: words(`${JS_KW} type interface enum as`), types: words('number string boolean void unknown any never Record'), builtins: words('console Math Number String Array Map Set Object JSON Infinity') },
  python: { kw: words('def return if elif else for while in not and or is True False None break continue import from as global pass lambda class with try except raise'), types: words('int str bool float list dict set tuple'), builtins: words('print len range max min sorted sum abs round enumerate isinstance') },
  json: { kw: words('true false null'), types: new Set(), builtins: new Set() },
  shell: { kw: words('npm npx nest cd git node'), types: new Set(), builtins: new Set() },
};
const PATTERN = {
  javascript: /(\/\/.*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g,
  python: /(#.*)|([fr]?"(?:[^"\\\n]|\\.)*"|[fr]?'(?:[^'\\\n]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)/g,
  // Terminal y .env: comentarios con #, textos entre comillas y la primera palabra conocida (npm, nest…).
  shell: /(#.*)|("[^"\n]*"|'[^'\n]*')|()(\b[a-z]+\b)/g,
};
const PATTERN_FOR = { javascript: 'javascript', typescript: 'javascript', json: 'javascript', python: 'python', shell: 'shell' };

const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
// Un token que ocupa varias líneas se envuelve por tramos para que ningún <span> cruce un salto de línea.
const wrap = (text, cls) => (cls ? text.split('\n').map((p) => (p ? `<span class="tk-${cls}">${esc(p)}</span>` : '')).join('\n') : esc(text));

export function highlightLines(code, lang) {
  const spec = LANG[lang];
  if (!spec) return esc(code).split('\n');
  const re = new RegExp(PATTERN[PATTERN_FOR[lang]]);
  let html = '';
  let last = 0;
  let m;
  while ((m = re.exec(code))) {
    const [tok, comment, str, num, word] = m;
    let cls = comment ? 'c' : str ? 's' : num ? 'n' : '';
    if (word) {
      if (spec.kw.has(word)) cls = 'k';
      else if (spec.types.has(word)) cls = 't';
      else if (spec.builtins.has(word)) cls = 'b';
      else if (/^\s*\(/.test(code.slice(re.lastIndex))) cls = 'f';
    }
    html += esc(code.slice(last, m.index)) + wrap(tok, cls);
    last = re.lastIndex;
  }
  html += esc(code.slice(last));
  return html.split('\n');
}
