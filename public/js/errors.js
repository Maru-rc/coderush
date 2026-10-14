// Traduce errores técnicos a explicaciones claras en español, con una pista para arreglarlos.
// Cada regla: [lenguajes, patrón, (match) => { title, tip }]. Se usa la primera que coincida.

const JS = ['javascript', 'typescript'];
const PY = ['python'];
const ALL = [...JS, ...PY];

// Confusiones típicas al saltar entre lenguajes.
const PY_ATTR_HINTS = {
  push: 'En Python las listas usan <code>.append(x)</code>, no <code>.push(x)</code>.',
  length: 'En Python la longitud se obtiene con <code>len(x)</code>, no con <code>.length</code>.',
  toUpperCase: 'En Python se usa <code>texto.upper()</code>.',
  toLowerCase: 'En Python se usa <code>texto.lower()</code>.',
  includes: 'En Python se comprueba con el operador <code>in</code>: <code>x in lista</code>.',
  indexOf: 'En Python se usa <code>lista.index(x)</code> (o <code>texto.find(x)</code>, que devuelve -1).',
  forEach: 'En Python se recorre con <code>for x in lista:</code>.',
  map: 'En Python usa una comprensión de lista: <code>[f(x) for x in lista]</code>.',
  filter: 'En Python usa una comprensión: <code>[x for x in lista if condicion]</code>.',
  trim: 'En Python se usa <code>texto.strip()</code>.',
  charAt: 'En Python se accede con <code>texto[i]</code>.',
  slice: 'En Python se recorta con <code>lista[inicio:fin]</code>.',
  concat: 'En Python se unen listas con <code>+</code>.',
};
const JS_NAME_HINTS = {
  len: 'En JavaScript la longitud es una propiedad: <code>x.length</code>, no <code>len(x)</code>.',
  print: 'En JavaScript se imprime con <code>console.log()</code>.',
  True: 'En JavaScript los booleanos van en minúscula: <code>true</code>.',
  False: 'En JavaScript los booleanos van en minúscula: <code>false</code>.',
  None: 'En JavaScript el valor vacío es <code>null</code>.',
  elif: 'En JavaScript se escribe <code>else if</code>.',
  range: 'JavaScript no tiene <code>range()</code>: usa <code>for (let i = 0; i &lt; n; i++)</code>.',
  input: 'Aquí no se lee del teclado: los datos llegan como parámetros de la función.',
  prompt: 'Aquí no se lee del teclado: los datos llegan como parámetros de la función.',
  str: 'En JavaScript se convierte a texto con <code>String(x)</code>.',
  int: 'En JavaScript se convierte a entero con <code>Number(x)</code> o <code>Math.trunc(x)</code>.',
  sum: 'JavaScript no tiene <code>sum()</code>: usa un bucle o <code>lista.reduce((a, b) =&gt; a + b, 0)</code>.',
  max: 'En JavaScript es <code>Math.max(...lista)</code>.',
  min: 'En JavaScript es <code>Math.min(...lista)</code>.',
};
const PY_NAME_HINTS = {
  true: 'En Python los booleanos empiezan con mayúscula: <code>True</code>.',
  false: 'En Python los booleanos empiezan con mayúscula: <code>False</code>.',
  null: 'En Python el valor vacío es <code>None</code>.',
  undefined: 'En Python el valor vacío es <code>None</code>.',
  console: 'En Python se imprime con <code>print()</code>.',
  Math: 'En Python las funciones matemáticas están en el módulo <code>math</code> (<code>import math</code>) o son integradas: <code>abs</code>, <code>max</code>, <code>min</code>, <code>round</code>.',
  length: 'En Python la longitud se obtiene con <code>len(x)</code>.',
  let: 'En Python no se declara con <code>let</code>: simplemente asigna <code>x = valor</code>.',
  const: 'En Python no se declara con <code>const</code>: simplemente asigna <code>x = valor</code>.',
  var: 'En Python no se declara con <code>var</code>: simplemente asigna <code>x = valor</code>.',
};

const code = (s) => `<code>${String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</code>`;

const RULES = [
  // ── Nombres que no existen ──
  [JS, /ReferenceError: (\w+) is not defined/, ([, n]) => ({
    title: `Usas ${code(n)}, pero no existe.`,
    tip: JS_NAME_HINTS[n] || '¿Está mal escrito (las mayúsculas cuentan) o te faltó declararlo con <code>let</code> o <code>const</code>?',
  })],
  [PY, /NameError: name '(\w+)' is not defined/, ([, n]) => ({
    title: `Usas ${code(n)}, pero no existe.`,
    tip: PY_NAME_HINTS[n] || '¿Está mal escrito (las mayúsculas cuentan) o lo usas antes de asignarle un valor?',
  })],
  [JS, /ReferenceError: Cannot access '(\w+)' before initialization/, ([, n]) => ({
    title: `Usas ${code(n)} antes de declararla.`,
    tip: 'Mueve la declaración (<code>let</code>/<code>const</code>) por encima de la línea donde la usas.',
  })],
  [PY, /UnboundLocalError: .*'(\w+)'/, ([, n]) => ({
    title: `Usas ${code(n)} antes de darle un valor dentro de la función.`,
    tip: 'Asígnale un valor inicial al principio de la función, antes de leerla o modificarla.',
  })],

  // ── Valores vacíos ──
  [JS, /Cannot read properties of (undefined|null) \(reading '([^']*)'\)/, ([, what, prop]) => ({
    title: `Intentaste leer ${code('.' + prop)} de algo que es ${code(what)}.`,
    tip: what === 'undefined'
      ? 'Suele pasar al acceder a una posición que no existe (por ejemplo <code>lista[lista.length]</code>; el último índice es <code>length - 1</code>) o al usar una variable que nunca recibió valor.'
      : 'Esa variable vale <code>null</code>. Comprueba ese caso antes de usarla.',
  })],
  [JS, /Cannot set properties of (undefined|null)/, ([, what]) => ({
    title: `Intentaste modificar algo que es ${code(what)}.`,
    tip: '¿Inicializaste la lista u objeto antes de escribir en él? Por ejemplo <code>const conteo = {}</code>.',
  })],
  [PY, /'NoneType' object/, () => ({
    title: 'Estás usando un valor <code>None</code>.',
    tip: 'Normalmente viene de una función sin <code>return</code>, o de métodos como <code>lista.sort()</code> o <code>lista.append()</code>, que modifican la lista y devuelven <code>None</code>.',
  })],

  // ── Funciones y métodos ──
  [JS, /TypeError: ([\w$.[\]]+)\.length is not a function/, () => ({
    title: '<code>length</code> es una propiedad, no una función.',
    tip: 'Escríbelo sin paréntesis: <code>x.length</code>.',
  })],
  [JS, /TypeError: ([\w$.[\]()]+) is not a function/, ([, n]) => {
    const method = n.split('.').pop();
    const tips = {
      append: 'En JavaScript se añade a una lista con <code>.push(x)</code>.',
      upper: 'En JavaScript se usa <code>.toUpperCase()</code>.',
      lower: 'En JavaScript se usa <code>.toLowerCase()</code>.',
      strip: 'En JavaScript se usa <code>.trim()</code>.',
      lenght: '¿Querías escribir <code>length</code>?',
    };
    return {
      title: `${code(n)} no es una función.`,
      tip: tips[method] || '¿El nombre del método está bien escrito? ¿Esa variable es del tipo que crees (texto, lista, número)?',
    };
  }],
  [PY, /AttributeError: '(\w+)' object has no attribute '(\w+)'/, ([, type, attr]) => ({
    title: `Un valor de tipo ${code(type)} no tiene ${code('.' + attr)}.`,
    tip: PY_ATTR_HINTS[attr] || '¿El nombre está bien escrito? ¿Esa variable es del tipo que crees?',
  })],
  [PY, /TypeError: (\w+)\(\) takes (\d+) positional arguments? but (\d+) (?:was|were) given/, ([, fn, want, got]) => ({
    title: `${code(fn + '()')} espera ${want} parámetro(s) y recibió ${got}.`,
    tip: 'No cambies los parámetros de la función del reto; si es una función tuya, revisa cómo la llamas.',
  })],
  [PY, /TypeError: '(\w+)' object is not callable/, ([, type]) => ({
    title: `Intentaste llamar como función a un valor de tipo ${code(type)}.`,
    tip: '¿Pusiste paréntesis donde no tocaba, o una variable tiene el mismo nombre que una función (por ejemplo <code>len</code>, <code>sum</code> o <code>max</code>)?',
  })],

  // ── Tipos que no encajan ──
  [PY, /can only concatenate str \(not "(\w+)"\) to str|unsupported operand type\(s\) for [+]: '(\w+)' and '(\w+)'/, () => ({
    title: 'Estás mezclando texto y números en una operación.',
    tip: 'Convierte antes: <code>str(n)</code> para pasar un número a texto, o <code>int(t)</code> para pasar un texto a número.',
  })],
  [PY, /unsupported operand type\(s\) for (\S+): '(\w+)' and '(\w+)'/, ([, op, a, b]) => ({
    title: `No se puede usar ${code(op)} entre ${code(a)} y ${code(b)}.`,
    tip: 'Revisa qué tipo tiene cada variable en esa línea; quizá una es <code>None</code> o una lista.',
  })],
  [PY, /'(\w+)' object is not iterable/, ([, type]) => ({
    title: `Intentaste recorrer un valor de tipo ${code(type)} como si fuera una lista.`,
    tip: type === 'int' ? 'Para repetir n veces usa <code>for i in range(n):</code>.' : 'Solo se pueden recorrer listas, textos, diccionarios, rangos…',
  })],
  [JS, /(\S+) is not iterable/, ([, n]) => ({
    title: `${code(n)} no se puede recorrer con <code>for...of</code>.`,
    tip: 'Solo se pueden recorrer listas y textos. Para contar hasta n usa <code>for (let i = 0; i &lt; n; i++)</code>; para un objeto, <code>Object.keys(obj)</code>.',
  })],
  [PY, /'(\w+)' object is not subscriptable/, ([, type]) => ({
    title: `Usaste corchetes ${code('[ ]')} sobre un valor de tipo ${code(type)}.`,
    tip: type === 'int' ? 'Un número no tiene posiciones. Para sus dígitos usa <code>n % 10</code> o conviértelo con <code>str(n)</code>.' : 'Solo las listas, textos y diccionarios se indexan con corchetes.',
  })],
  [PY, /'(\w+)' object does not support item assignment/, ([, type]) => ({
    title: `Los valores de tipo ${code(type)} no se pueden modificar por posición.`,
    tip: type === 'str' ? 'Los textos son inmutables en Python: construye uno nuevo o usa una lista y únela con <code>"".join(lista)</code>.' : 'Crea una copia modificada en lugar de cambiarlo.',
  })],
  [PY, /list indices must be integers or slices, not (\w+)/, ([, t]) => ({
    title: `Usaste un ${code(t)} como índice de una lista.`,
    tip: t === 'float' ? 'El operador <code>/</code> siempre da decimales: usa <code>//</code> para la división entera.' : 'Los índices deben ser números enteros.',
  })],
  [JS, /Assignment to constant variable/, () => ({
    title: 'Intentaste cambiar una variable declarada con <code>const</code>.',
    tip: 'Si su valor tiene que cambiar (contadores, acumuladores…), decláralo con <code>let</code>.',
  })],

  // ── Índices y claves ──
  [PY, /IndexError: (list|string|tuple) index out of range/, ([, kind]) => ({
    title: `Accediste a una posición que no existe en ${kind === 'string' ? 'el texto' : 'la lista'}.`,
    tip: 'Las posiciones van de <code>0</code> a <code>len(x) - 1</code>. Revisa los límites del bucle y el caso de listas o textos vacíos.',
  })],
  [PY, /KeyError: (.+)/, ([, k]) => ({
    title: `La clave ${code(k)} no existe en el diccionario.`,
    tip: 'Comprueba antes con <code>if clave in dic:</code> o usa <code>dic.get(clave, 0)</code> para tener un valor por defecto.',
  })],
  [JS, /Invalid array length/, () => ({
    title: 'Intentaste crear una lista con un tamaño no válido.',
    tip: 'El tamaño debe ser un entero ≥ 0. ¿Está calculado con decimales o es negativo?',
  })],

  // ── Matemáticas ──
  [PY, /ZeroDivisionError/, () => ({
    title: 'Dividiste entre cero.',
    tip: 'Contempla el caso en que el divisor vale 0 (por ejemplo, una lista vacía) antes de dividir o usar <code>%</code>.',
  })],
  [PY, /ValueError: invalid literal for int\(\) with base 10: (.+)/, ([, v]) => ({
    title: `No se puede convertir ${code(v)} en un número entero.`,
    tip: 'Asegúrate de convertir solo textos que contengan dígitos.',
  })],
  [PY, /ValueError: (max|min)\(\) (?:arg is an|iterable argument is) empty/, ([, f]) => ({
    title: `Llamaste a ${code(f + '()')} con una lista vacía.`,
    tip: 'Comprueba primero si la lista está vacía.',
  })],

  // ── Recursión ──
  [ALL, /Maximum call stack size exceeded|RecursionError/, () => ({
    title: 'Recursión infinita: tu función se llama a sí misma sin parar.',
    tip: 'Revisa el caso base: debe existir una condición que devuelva un valor sin volver a llamar a la función, y cada llamada debe acercarse a ella.',
  })],

  // ── Sintaxis Python ──
  [PY, /IndentationError: expected an indented block/, () => ({
    title: 'Falta sangría.',
    tip: 'Después de una línea que termina en <code>:</code> (<code>def</code>, <code>if</code>, <code>for</code>, <code>while</code>…) el bloque debe ir desplazado 4 espacios.',
  })],
  [PY, /IndentationError: unexpected indent/, () => ({
    title: 'Hay sangría donde no debería.',
    tip: 'Esa línea está más desplazada que el bloque al que pertenece. Alinéala con las líneas de arriba.',
  })],
  [PY, /IndentationError: unindent does not match|TabError/, () => ({
    title: 'La sangría no es coherente.',
    tip: 'Usa siempre 4 espacios por nivel y no mezcles tabuladores con espacios.',
  })],
  [PY, /SyntaxError: expected ':'/, () => ({
    title: 'Falta <code>:</code> al final de la línea.',
    tip: '<code>def</code>, <code>if</code>, <code>elif</code>, <code>else</code>, <code>for</code> y <code>while</code> terminan con dos puntos.',
  })],
  [PY, /SyntaxError: '(.)' was never closed/, ([, c]) => ({
    title: `Abriste ${code(c)} y nunca lo cerraste.`,
    tip: 'Cuenta los paréntesis, corchetes y llaves de esa línea.',
  })],
  [PY, /unterminated string literal|EOL while scanning/, () => ({
    title: 'Un texto no tiene comillas de cierre.',
    tip: 'Cada texto debe abrirse y cerrarse con el mismo tipo de comillas.',
  })],
  [PY, /Maybe you meant '==' or ':=' instead of '='|cannot assign to/, () => ({
    title: 'Usaste <code>=</code> donde iba una comparación.',
    tip: 'Para comparar se usa <code>==</code>; un solo <code>=</code> asigna un valor.',
  })],
  [PY, /SyntaxError: invalid syntax\. Perhaps you forgot a comma/, () => ({
    title: 'Parece que falta una coma.',
    tip: 'Separa con comas los elementos de listas y los argumentos de funciones.',
  })],
  [PY, /SyntaxError/, () => ({
    title: 'Error de sintaxis: Python no entiende esa línea.',
    tip: 'Revisa paréntesis, dos puntos, comillas y que no haya sintaxis de otro lenguaje (<code>{ }</code>, <code>;</code>, <code>&amp;&amp;</code>, <code>||</code>, <code>!</code>). En Python se usa <code>and</code>, <code>or</code> y <code>not</code>.',
  })],

  // ── Sintaxis JS/TS ──
  [JS, /Unexpected end of input/, () => ({
    title: 'Falta cerrar algo antes del final del código.',
    tip: 'Probablemente falta una llave <code>}</code>, un paréntesis o unas comillas. Cuenta las aperturas y los cierres.',
  })],
  [JS, /Identifier '(\w+)' has already been declared/, ([, n]) => ({
    title: `Declaraste ${code(n)} dos veces.`,
    tip: 'Usa <code>let</code>/<code>const</code> solo la primera vez; después asigna sin la palabra clave.',
  })],
  [JS, /Missing initializer in const declaration/, () => ({
    title: 'Una constante necesita valor al declararla.',
    tip: 'Escribe <code>const x = valor;</code>, o usa <code>let</code> si la asignas más tarde.',
  })],
  [JS, /Unexpected token '(.+?)'/, ([, t]) => ({
    title: `Hay un ${code(t)} donde no se esperaba.`,
    tip: 'Suele ser un paréntesis o llave de más o de menos, o una coma o un operador olvidado justo antes.',
  })],
  [JS, /Unexpected identifier '?(\w*)'?/, ([, t]) => ({
    title: `JavaScript no esperaba ${t ? code(t) : 'ese nombre'} en esa posición.`,
    tip: '¿Falta un operador, una coma o un paréntesis antes? ¿O es sintaxis de Python (<code>and</code>, <code>or</code>, <code>elif</code>, <code>def</code>)?',
  })],
  [JS, /Unexpected string|Invalid or unexpected token|Unterminated string/, () => ({
    title: 'Hay un texto o carácter mal colocado.',
    tip: 'Revisa que las comillas estén cerradas y que no falte un <code>+</code> o una coma entre valores.',
  })],
  [JS, /ERR_INVALID_TYPESCRIPT_SYNTAX|ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX/, () => ({
    title: 'Error de sintaxis en TypeScript.',
    tip: 'Revisa la línea marcada: paréntesis, llaves, tipos (<code>x: number</code>) y que no falte nada tras un operador.',
  })],
  [JS, /SyntaxError/, () => ({
    title: 'Error de sintaxis: JavaScript no entiende esa línea.',
    tip: 'Revisa llaves, paréntesis, comillas y comas.',
  })],

  // ── Errores lanzados a mano ──
  [ALL, /^(?:Error|Exception): (.+)/, ([, m]) => ({
    title: `Tu código lanzó un error: «${m}».`,
    tip: 'Lo provoca un <code>throw</code>/<code>raise</code> de tu propio código.',
  })],
  [PY, /EOFError/, () => ({
    title: 'Aquí no se lee del teclado.',
    tip: 'No uses <code>input()</code>: los datos llegan como parámetros de la función.',
  })],
];

export function explain(errorText, lang) {
  if (!errorText) return null;
  for (const [langs, re, build] of RULES) {
    if (!langs.includes(lang)) continue;
    const m = errorText.match(re);
    if (m) return build(m);
  }
  return null;
}
