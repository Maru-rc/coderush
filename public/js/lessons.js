// Academia: lecciones por concepto, con ejemplos en los tres lenguajes y un mini-quiz.
// Cada ejemplo de código declara su salida exacta; `npm run verify` ejecuta todos los ejemplos y la comprueba.
// Formato de código y salida: { js, ts?, py } o un texto común. TypeScript reutiliza JavaScript si no se indica.
// Los ejemplos enseñan la idea con casos distintos a los retos, para no regalar las soluciones.

export const LESSONS = [
  // ───────────────────────────── 01 ─────────────────────────────
  {
    id: 'fundamentos',
    title: 'Variables, operadores y return',
    summary: 'Guardar valores, operar con ellos y devolver un resultado desde una función.',
    challenges: ['suma', 'es-par', 'celsius'],
    sections: [
      {
        title: 'Variables',
        text: 'Una variable es un nombre que guarda un valor. En JavaScript y TypeScript se declaran con <code>const</code> (no cambia) o <code>let</code> (puede cambiar); en Python basta con asignar. TypeScript además permite anotar el tipo: <code>let edad: number</code>.',
        code: {
          js: `const nombre = "Ana";
let edad = 20;
edad = edad + 1;
console.log(nombre, edad);`,
          ts: `const nombre: string = "Ana";
let edad: number = 20;
edad = edad + 1;
console.log(nombre, edad);`,
          py: `nombre = "Ana"
edad = 20
edad = edad + 1
print(nombre, edad)`,
        },
        out: 'Ana 21',
      },
      {
        title: 'Operadores aritméticos',
        text: 'Además de <code>+ - * /</code> tienes <code>%</code> (el <b>resto</b> de una división) y <code>**</code> (potencia). La división normal puede dar decimales; para la división entera usa <code>Math.floor(a / b)</code> en JS o <code>a // b</code> en Python. El resto sirve para saber si un número es divisible por otro: <code>n % d</code> vale 0 cuando lo es.',
        code: {
          js: `console.log(7 + 2);
console.log(7 / 2);
console.log(7 % 2);             // resto
console.log(Math.floor(7 / 2)); // división entera
console.log(2 ** 3);`,
          py: `print(7 + 2)
print(7 / 2)
print(7 % 2)   # resto
print(7 // 2)  # división entera
print(2 ** 3)`,
        },
        out: '9\n3.5\n1\n3\n8',
      },
      {
        title: 'Funciones y return',
        text: 'Una función recibe parámetros y <b>devuelve</b> un resultado con <code>return</code>. Imprimir (<code>console.log</code> / <code>print</code>) solo muestra el valor en pantalla: quien llama a la función no lo recibe. Los retos comprueban lo que devuelves, no lo que imprimes.',
        code: {
          js: `function doble(n) {
  return n * 2;
}
const r = doble(21);
console.log(r);`,
          ts: `function doble(n: number): number {
  return n * 2;
}
const r = doble(21);
console.log(r);`,
          py: `def doble(n: int) -> int:
    return n * 2

r = doble(21)
print(r)`,
        },
        out: '42',
      },
    ],
    quiz: [
      {
        q: '¿Cuánto vale <code>17 % 5</code>?',
        options: ['3', '2', '3.4', '12'],
        answer: 1,
        why: '17 = 5 × 3 + 2. El operador <code>%</code> da el resto: 2.',
      },
      {
        q: '¿Qué imprime este código?',
        code: {
          js: `let x = 10;
x = x * 2 + 1;
console.log(x);`,
          py: `x = 10
x = x * 2 + 1
print(x)`,
        },
        options: ['21', '22', '30', '12'],
        answer: 0,
        why: 'Primero se multiplica (10 × 2 = 20) y luego se suma 1. El resultado se guarda de nuevo en <code>x</code>.',
      },
      {
        q: 'Una función calcula el resultado pero lo imprime en vez de usar <code>return</code>. ¿Qué recibe quien la llama?',
        options: ['El resultado', '<code>undefined</code> en JS o <code>None</code> en Python', 'Un error de sintaxis', 'El texto impreso'],
        answer: 1,
        why: 'Sin <code>return</code>, la función termina sin devolver nada: JS devuelve <code>undefined</code> y Python <code>None</code>.',
      },
    ],
  },

  // ───────────────────────────── 02 ─────────────────────────────
  {
    id: 'condicionales',
    title: 'Condicionales',
    summary: 'Tomar decisiones con if, else y operadores lógicos.',
    challenges: ['es-par', 'mayor-de-tres', 'bisiesto', 'fizzbuzz'],
    sections: [
      {
        title: 'if, else if y else',
        text: 'Un condicional ejecuta un bloque solo si su condición es verdadera. Las ramas se revisan <b>en orden</b> y solo se ejecuta la primera que se cumple. En Python <code>else if</code> se escribe <code>elif</code> y los bloques se marcan con sangría en lugar de llaves.',
        code: {
          js: `const nota = 72;
if (nota >= 90) {
  console.log("Excelente");
} else if (nota >= 60) {
  console.log("Aprobado");
} else {
  console.log("Reprobado");
}`,
          py: `nota = 72
if nota >= 90:
    print("Excelente")
elif nota >= 60:
    print("Aprobado")
else:
    print("Reprobado")`,
        },
        out: 'Aprobado',
      },
      {
        title: 'Comparaciones y operadores lógicos',
        text: 'Las comparaciones (<code>&lt; &lt;= &gt; &gt;=</code>, igualdad y desigualdad) dan un booleano. Se combinan con <code>&amp;&amp;</code> (y), <code>||</code> (o) y <code>!</code> (no) en JS/TS, que en Python son <code>and</code>, <code>or</code> y <code>not</code>. En JavaScript usa <code>===</code> y <code>!==</code>: comparan sin convertir tipos.',
        code: {
          js: `const edad = 25;
const tieneEntrada = true;
console.log(edad >= 18 && tieneEntrada);
console.log(edad < 12 || edad > 65);
console.log(!tieneEntrada);
console.log(5 === "5");`,
          py: `edad = 25
tiene_entrada = True
print(edad >= 18 and tiene_entrada)
print(edad < 12 or edad > 65)
print(not tiene_entrada)
print(5 == "5")`,
        },
        out: { js: 'true\nfalse\nfalse\nfalse', py: 'True\nFalse\nFalse\nFalse' },
      },
      {
        title: 'Devolver la condición y ordenar los casos',
        text: 'Una comparación ya es <code>true</code> o <code>false</code>, así que puedes devolverla directamente sin <code>if</code>. Cuando varios casos se solapan, pon primero el <b>más específico</b>: si no, uno más general lo atrapa antes.',
        code: {
          js: `function esMayorDeEdad(edad) {
  return edad >= 18;
}
function categoria(n) {
  if (n % 10 === 0) return "múltiplo de 10";
  if (n % 2 === 0) return "par";
  return "impar";
}
console.log(esMayorDeEdad(20));
console.log(categoria(30), categoria(8), categoria(7));`,
          ts: `function esMayorDeEdad(edad: number): boolean {
  return edad >= 18;
}
function categoria(n: number): string {
  if (n % 10 === 0) return "múltiplo de 10";
  if (n % 2 === 0) return "par";
  return "impar";
}
console.log(esMayorDeEdad(20));
console.log(categoria(30), categoria(8), categoria(7));`,
          py: `def es_mayor_de_edad(edad: int) -> bool:
    return edad >= 18

def categoria(n: int) -> str:
    if n % 10 == 0:
        return "múltiplo de 10"
    if n % 2 == 0:
        return "par"
    return "impar"

print(es_mayor_de_edad(20))
print(categoria(30), categoria(8), categoria(7))`,
        },
        out: { js: 'true\nmúltiplo de 10 par impar', py: 'True\nmúltiplo de 10 par impar' },
      },
    ],
    quiz: [
      {
        q: '¿Qué imprime este código?',
        code: {
          js: `const x = 15;
if (x > 10) {
  console.log("A");
} else if (x > 5) {
  console.log("B");
} else {
  console.log("C");
}`,
          py: `x = 15
if x > 10:
    print("A")
elif x > 5:
    print("B")
else:
    print("C")`,
        },
        options: ['A', 'B', 'A y B', 'C'],
        answer: 0,
        why: 'Aunque 15 también es mayor que 5, solo se ejecuta la primera rama que se cumple.',
      },
      {
        q: '¿Cómo compruebas que <code>n</code> está entre 1 y 10, ambos incluidos?',
        options: ['<code>n &gt;= 1 &amp;&amp; n &lt;= 10</code> (en Python, <code>1 &lt;= n &lt;= 10</code>)', '<code>n &gt;= 1 || n &lt;= 10</code>', '<code>1 &lt;= n &amp;&amp; 10</code>', '<code>n == 1..10</code>'],
        answer: 0,
        why: 'Deben cumplirse las dos condiciones a la vez, así que se unen con "y". Con "o" cualquier número pasaría.',
      },
      {
        q: 'En JavaScript, ¿por qué se prefiere <code>===</code> a <code>==</code>?',
        options: ['Es más corto', 'Compara sin convertir tipos: <code>5 === "5"</code> es <code>false</code>', 'Solo funciona con números', 'No hay ninguna diferencia'],
        answer: 1,
        why: '<code>==</code> convierte los tipos antes de comparar (<code>5 == "5"</code> es <code>true</code>), lo que causa errores difíciles de ver.',
      },
    ],
  },

  // ───────────────────────────── 03 ─────────────────────────────
  {
    id: 'bucles',
    title: 'Bucles',
    summary: 'Repetir instrucciones con for y while, y acumular resultados.',
    challenges: ['fizzbuzz', 'suma-arreglo', 'factorial', 'tabla-multiplicar', 'es-primo', 'primos-hasta'],
    sections: [
      {
        title: 'for con contador',
        text: 'Un <code>for</code> repite un bloque mientras un contador avanza. En Python, <code>range(inicio, fin)</code> genera los números desde <code>inicio</code> hasta <code>fin - 1</code>: el final <b>no se incluye</b>.',
        code: {
          js: `for (let i = 1; i <= 5; i++) {
  console.log(i);
}`,
          py: `for i in range(1, 6):
    print(i)`,
        },
        out: '1\n2\n3\n4\n5',
      },
      {
        title: 'Acumuladores',
        text: 'Para sumar, contar o multiplicar dentro de un bucle, crea una variable <b>antes</b> del bucle y actualízala en cada vuelta. Una suma empieza en 0; un producto empieza en 1 (si empezara en 0, todo daría 0).',
        code: {
          js: `let total = 0;
for (let i = 1; i <= 4; i++) {
  total += i * i; // 1 + 4 + 9 + 16
}
console.log(total);`,
          py: `total = 0
for i in range(1, 5):
    total += i * i  # 1 + 4 + 9 + 16
print(total)`,
        },
        out: '30',
      },
      {
        title: 'while y salir antes de tiempo',
        text: '<code>while</code> repite mientras una condición sea verdadera; úsalo cuando no sabes cuántas vueltas habrá. Asegúrate de que algo dentro del bucle lo acerque a su fin, o nunca terminará (en CodeRush verás "Tiempo agotado"). Con <code>break</code> sales del bucle en cuanto encuentras lo que buscas; dentro de una función, <code>return</code> también lo corta.',
        code: {
          js: `// Primer múltiplo de 7 mayor que 50
let n = 51;
while (n % 7 !== 0) {
  n++;
}
console.log(n);

for (const x of [3, 8, 12, 5]) {
  if (x > 10) {
    console.log("encontrado:", x);
    break;
  }
}`,
          py: `# Primer múltiplo de 7 mayor que 50
n = 51
while n % 7 != 0:
    n += 1
print(n)

for x in [3, 8, 12, 5]:
    if x > 10:
        print("encontrado:", x)
        break`,
        },
        out: '56\nencontrado: 12',
      },
    ],
    quiz: [
      {
        q: '¿Qué imprime este código?',
        code: {
          js: `let c = 0;
for (let i = 0; i < 10; i += 3) {
  c++;
}
console.log(c);`,
          py: `c = 0
for i in range(0, 10, 3):
    c += 1
print(c)`,
        },
        options: ['3', '4', '10', '9'],
        answer: 1,
        why: '<code>i</code> toma los valores 0, 3, 6 y 9: son 4 vueltas.',
      },
      {
        q: 'Vas a calcular un producto como 1 × 2 × 3 × … ¿Con qué valor empieza el acumulador?',
        options: ['0', '1', '<code>null</code> / <code>None</code>', 'Con el último número'],
        answer: 1,
        why: '1 es el neutro de la multiplicación. Si empezaras en 0, cualquier producto daría 0.',
      },
      {
        q: 'Un <code>while</code> da "Tiempo agotado". ¿Cuál es la causa más probable?',
        options: ['Falta un <code>return</code>', 'La variable de la condición nunca cambia dentro del bucle', 'Usar <code>while</code> en vez de <code>for</code>', 'Los números son muy grandes'],
        answer: 1,
        why: 'Si nada dentro del bucle cambia la condición, esta sigue siendo verdadera para siempre.',
      },
    ],
  },

  // ───────────────────────────── 04 ─────────────────────────────
  {
    id: 'textos',
    title: 'Trabajar con textos',
    summary: 'Recorrer, cortar, transformar y construir cadenas de texto.',
    challenges: ['invertir-texto', 'contar-vocales', 'palindromo', 'contar-palabras', 'palabra-mas-larga', 'capitalizar', 'comprimir'],
    sections: [
      {
        title: 'Índices, longitud y recorrido',
        text: 'Un texto es una secuencia de caracteres numerados desde 0. Su longitud es <code>s.length</code> en JS o <code>len(s)</code> en Python, así que el último carácter está en la posición longitud − 1. En Python también puedes usar índices negativos: <code>s[-1]</code> es el último.',
        code: {
          js: `const s = "Hola";
console.log(s.length);
console.log(s[0], s[s.length - 1]);
for (const letra of s) {
  console.log(letra);
}`,
          py: `s = "Hola"
print(len(s))
print(s[0], s[-1])
for letra in s:
    print(letra)`,
        },
        out: '4\nH a\nH\no\nl\na',
      },
      {
        title: 'Métodos útiles',
        text: 'Pasar a minúsculas (<code>toLowerCase</code> / <code>lower</code>), quitar espacios de los extremos (<code>trim</code> / <code>strip</code>), partir en una lista (<code>split</code>) y unir una lista (<code>join</code>). Ojo: en JS, <code>split(" ")</code> deja textos vacíos cuando hay espacios dobles; en Python, <code>split()</code> sin argumentos los ignora.',
        code: {
          js: `const frase = "  El Gato  come ";
console.log(frase.trim().toLowerCase());
const palabras = frase.split(" ").filter((p) => p !== "");
console.log(palabras);
console.log(palabras.join("-"));
console.log("gato".includes("at"), "gato".slice(1, 3));`,
          ts: `const frase: string = "  El Gato  come ";
console.log(frase.trim().toLowerCase());
const palabras: string[] = frase.split(" ").filter((p) => p !== "");
console.log(palabras);
console.log(palabras.join("-"));
console.log("gato".includes("at"), "gato".slice(1, 3));`,
          py: `frase = "  El Gato  come "
print(frase.strip().lower())
palabras = frase.split()
print(palabras)
print("-".join(palabras))
print("at" in "gato", "gato"[1:3])`,
        },
        out: {
          js: "el gato  come\n[ 'El', 'Gato', 'come' ]\nEl-Gato-come\ntrue at",
          py: "el gato  come\n['El', 'Gato', 'come']\nEl-Gato-come\nTrue at",
        },
      },
      {
        title: 'Construir un texto nuevo',
        text: 'Los textos son <b>inmutables</b>: <code>s[0] = "X"</code> no cambia nada. Para transformar un texto, crea uno nuevo y ve añadiéndole piezas con <code>+=</code>, o junta una lista de piezas con <code>join</code>.',
        code: {
          js: `let resultado = "";
for (const c of "abc") {
  resultado += c + c;
}
console.log(resultado);
console.log("na".repeat(3));`,
          py: `resultado = ""
for c in "abc":
    resultado += c + c
print(resultado)
print("na" * 3)`,
        },
        out: 'aabbcc\nnanana',
      },
    ],
    quiz: [
      {
        q: '¿Qué imprime este código?',
        code: {
          js: `const s = "programar";
console.log(s.length, s[3]);`,
          py: `s = "programar"
print(len(s), s[3])`,
        },
        options: ['9 g', '9 o', '8 g', '10 r'],
        answer: 0,
        why: '"programar" tiene 9 letras y los índices empiezan en 0: p(0) r(1) o(2) <b>g(3)</b>.',
      },
      {
        q: '¿Qué devuelve <code>"a,b,,c".split(",")</code>?',
        options: ['Una lista de 3 elementos', 'Una lista de 4 elementos, uno de ellos vacío', 'Un error', 'El texto sin comas'],
        answer: 1,
        why: 'Entre las dos comas seguidas no hay nada, así que aparece un texto vacío: <code>["a", "b", "", "c"]</code>.',
      },
      {
        q: 'Para comparar letras sin importar mayúsculas, lo habitual es…',
        options: ['Comparar los códigos ASCII a mano', 'Pasar ambos textos a minúsculas antes de comparar', 'Usar <code>===</code>', 'No se puede'],
        answer: 1,
        why: '"A" y "a" son caracteres distintos. Normalizar los dos textos a minúsculas resuelve la diferencia.',
      },
    ],
  },

  // ───────────────────────────── 05 ─────────────────────────────
  {
    id: 'arreglos',
    title: 'Arreglos y listas',
    summary: 'Guardar varios valores, recorrerlos, buscar en ellos y transformarlos.',
    challenges: ['suma-arreglo', 'tabla-multiplicar', 'segundo-mayor', 'rotar'],
    sections: [
      {
        title: 'Crear, leer y modificar',
        text: 'Un arreglo (lista en Python) guarda valores en orden, numerados desde 0. Se añade al final con <code>push</code> / <code>append</code> y se cambia un elemento asignando en su posición.',
        code: {
          js: `const nums = [4, 8, 15];
nums.push(16);
console.log(nums.length, nums[0], nums[nums.length - 1]);
nums[1] = 99;
console.log(nums);`,
          ts: `const nums: number[] = [4, 8, 15];
nums.push(16);
console.log(nums.length, nums[0], nums[nums.length - 1]);
nums[1] = 99;
console.log(nums);`,
          py: `nums = [4, 8, 15]
nums.append(16)
print(len(nums), nums[0], nums[-1])
nums[1] = 99
print(nums)`,
        },
        out: { js: '4 4 16\n[ 4, 99, 15, 16 ]', py: '4 4 16\n[4, 99, 15, 16]' },
      },
      {
        title: 'Recorrer y buscar el máximo',
        text: 'Para buscar el mayor (o el menor), empieza con el <b>primer elemento</b> de la lista, no con 0: si todos fueran negativos, 0 nunca sería superado y darías un resultado falso. Si además necesitas la posición, recorre con el índice.',
        code: {
          js: `const temps = [18, 25, 21, 30, 19];
let maximo = temps[0];
let pos = 0;
for (let i = 1; i < temps.length; i++) {
  if (temps[i] > maximo) {
    maximo = temps[i];
    pos = i;
  }
}
console.log("Máximo " + maximo + " en la posición " + pos);`,
          py: `temps = [18, 25, 21, 30, 19]
maximo = temps[0]
pos = 0
for i in range(1, len(temps)):
    if temps[i] > maximo:
        maximo = temps[i]
        pos = i
print(f"Máximo {maximo} en la posición {pos}")`,
        },
        out: 'Máximo 30 en la posición 3',
      },
      {
        title: 'Rebanadas y transformaciones',
        text: '<code>slice(a, b)</code> en JS o <code>lista[a:b]</code> en Python devuelven una <b>copia</b> con los elementos de la posición <code>a</code> a la <code>b - 1</code>; con índices negativos se cuenta desde el final. Para transformar cada elemento usa <code>map</code> y para quedarte con algunos, <code>filter</code>. En Python se hace lo mismo con comprensiones de listas.',
        code: {
          js: `const nums = [1, 2, 3, 4, 5, 6];
console.log(nums.slice(0, 2), nums.slice(-2));
console.log(nums.map((n) => n * 10));
console.log(nums.filter((n) => n % 2 === 0));`,
          ts: `const nums: number[] = [1, 2, 3, 4, 5, 6];
console.log(nums.slice(0, 2), nums.slice(-2));
console.log(nums.map((n) => n * 10));
console.log(nums.filter((n) => n % 2 === 0));`,
          py: `nums = [1, 2, 3, 4, 5, 6]
print(nums[0:2], nums[-2:])
print([n * 10 for n in nums])
print([n for n in nums if n % 2 == 0])`,
        },
        out: {
          js: '[ 1, 2 ] [ 5, 6 ]\n[ 10, 20, 30, 40, 50, 60 ]\n[ 2, 4, 6 ]',
          py: '[1, 2] [5, 6]\n[10, 20, 30, 40, 50, 60]\n[2, 4, 6]',
        },
      },
    ],
    quiz: [
      {
        q: '¿Qué imprime este código?',
        code: {
          js: `const a = [5, 3, 9];
a.push(1);
console.log(a.length + a[2]);`,
          py: `a = [5, 3, 9]
a.append(1)
print(len(a) + a[2])`,
        },
        options: ['13', '5', '10', '12'],
        answer: 0,
        why: 'Tras añadir el 1 la lista tiene 4 elementos, y en la posición 2 está el 9: 4 + 9 = 13.',
      },
      {
        q: 'Buscas el máximo de una lista que puede tener solo negativos, como <code>[-5, -2, -9]</code>. ¿Con qué inicializas el máximo?',
        options: ['0', 'El primer elemento de la lista', '-1', '<code>null</code> / <code>None</code>'],
        answer: 1,
        why: 'Con 0 ningún negativo lo superaría y devolverías 0, que ni siquiera está en la lista.',
      },
      {
        q: '¿Qué hace <code>nums.slice(1)</code> en JS o <code>nums[1:]</code> en Python?',
        options: ['Borra el primer elemento de <code>nums</code>', 'Devuelve una lista nueva sin el primer elemento', 'Devuelve solo el elemento 1', 'Da error si la lista está vacía'],
        answer: 1,
        why: 'Las rebanadas crean una copia y no modifican la original. Con una lista vacía devuelven otra lista vacía.',
      },
    ],
  },

  // ───────────────────────────── 06 ─────────────────────────────
  {
    id: 'recursion',
    title: 'Funciones y recursión',
    summary: 'Funciones que se llaman a sí mismas para resolver un problema más pequeño.',
    challenges: ['factorial', 'fibonacci', 'aplanar', 'escaleras', 'hanoi'],
    sections: [
      {
        title: 'Caso base y caso recursivo',
        text: 'Una función recursiva se llama a sí misma con un problema <b>más pequeño</b>. Siempre necesita un <b>caso base</b>: una situación en la que responde sin volver a llamarse. Sin él, las llamadas no terminan nunca.',
        code: {
          js: `function cuentaAtras(n) {
  if (n === 0) {
    console.log("¡Despegue!"); // caso base
    return;
  }
  console.log(n);
  cuentaAtras(n - 1); // caso recursivo
}
cuentaAtras(3);`,
          ts: `function cuentaAtras(n: number): void {
  if (n === 0) {
    console.log("¡Despegue!"); // caso base
    return;
  }
  console.log(n);
  cuentaAtras(n - 1); // caso recursivo
}
cuentaAtras(3);`,
          py: `def cuenta_atras(n: int) -> None:
    if n == 0:
        print("¡Despegue!")  # caso base
        return
    print(n)
    cuenta_atras(n - 1)  # caso recursivo

cuenta_atras(3)`,
        },
        out: '3\n2\n1\n¡Despegue!',
      },
      {
        title: 'Devolver valores',
        text: 'La respuesta se construye con lo que devuelven las llamadas más pequeñas. <code>sumaHasta(4)</code> es 4 + <code>sumaHasta(3)</code>, que es 3 + <code>sumaHasta(2)</code>… hasta llegar al caso base. Si falta el caso base verás <code>RangeError: Maximum call stack size exceeded</code> en JS o <code>RecursionError</code> en Python.',
        code: {
          js: `function sumaHasta(n) {
  if (n <= 0) return 0;
  return n + sumaHasta(n - 1);
}
console.log(sumaHasta(4)); // 4 + 3 + 2 + 1 + 0`,
          ts: `function sumaHasta(n: number): number {
  if (n <= 0) return 0;
  return n + sumaHasta(n - 1);
}
console.log(sumaHasta(4)); // 4 + 3 + 2 + 1 + 0`,
          py: `def suma_hasta(n: int) -> int:
    if n <= 0:
        return 0
    return n + suma_hasta(n - 1)

print(suma_hasta(4))  # 4 + 3 + 2 + 1 + 0`,
        },
        out: '10',
      },
      {
        title: 'Recorrer estructuras anidadas',
        text: 'La recursión brilla cuando los datos se contienen a sí mismos, como listas dentro de listas: no sabes cuántos niveles habrá, pero cada nivel se trata igual que el anterior. Aquí se calcula cuántos niveles de anidación tiene una lista.',
        code: {
          js: `function profundidad(x) {
  if (!Array.isArray(x)) return 0;
  let maximo = 0;
  for (const el of x) {
    maximo = Math.max(maximo, profundidad(el));
  }
  return 1 + maximo;
}
console.log(profundidad([1, [2, [3]], 4]));`,
          ts: `function profundidad(x: unknown): number {
  if (!Array.isArray(x)) return 0;
  let maximo = 0;
  for (const el of x) {
    maximo = Math.max(maximo, profundidad(el));
  }
  return 1 + maximo;
}
console.log(profundidad([1, [2, [3]], 4]));`,
          py: `def profundidad(x) -> int:
    if not isinstance(x, list):
        return 0
    maximo = 0
    for el in x:
        maximo = max(maximo, profundidad(el))
    return 1 + maximo

print(profundidad([1, [2, [3]], 4]))`,
        },
        out: '3',
      },
    ],
    quiz: [
      {
        q: '¿Qué le pasa a una función recursiva sin caso base?',
        options: ['Devuelve 0', 'Se llama sin fin hasta agotar la pila y lanza un error', 'Python la convierte en un bucle', 'Nada'],
        answer: 1,
        why: 'Cada llamada ocupa espacio en la pila de ejecución; sin caso base se agota y el programa falla.',
      },
      {
        q: '¿Qué imprime este código?',
        code: {
          js: `function f(n) {
  if (n === 1) return 1;
  return 2 * f(n - 1);
}
console.log(f(5));`,
          py: `def f(n):
    if n == 1:
        return 1
    return 2 * f(n - 1)

print(f(5))`,
        },
        options: ['10', '16', '32', '25'],
        answer: 1,
        why: 'f(1) = 1, f(2) = 2, f(3) = 4, f(4) = 8, f(5) = 16: se duplica en cada nivel.',
      },
      {
        q: 'En <code>sumaHasta(n)</code>, ¿por qué la llamada recursiva usa <code>n - 1</code>?',
        options: ['Por estilo', 'Para que cada llamada se acerque al caso base', 'Para evitar números negativos', 'Porque el lenguaje lo exige'],
        answer: 1,
        why: 'Cada llamada debe resolver un problema más pequeño, o nunca se llegaría al caso base.',
      },
    ],
  },

  // ───────────────────────────── 07 ─────────────────────────────
  {
    id: 'diccionarios',
    title: 'Diccionarios y conjuntos',
    summary: 'Asociar claves con valores y recordar lo que ya viste, sin recorrer todo otra vez.',
    challenges: ['contar-caracteres', 'anagramas', 'eliminar-duplicados', 'dos-suma', 'sin-repetir'],
    sections: [
      {
        title: 'Clave → valor: contar frecuencias',
        text: 'Un diccionario asocia <b>claves</b> con <b>valores</b>. En JS se usa un objeto <code>{}</code> o un <code>Map</code>; en TS el tipo <code>Record&lt;string, number&gt;</code>; en Python un <code>dict</code>. El patrón más común es contar: si la clave no existe todavía, empieza en 0.',
        code: {
          js: `const votos = ["rojo", "azul", "rojo", "verde", "rojo"];
const conteo = {};
for (const v of votos) {
  conteo[v] = (conteo[v] || 0) + 1;
}
console.log(conteo);
console.log(conteo["rojo"]);`,
          ts: `const votos: string[] = ["rojo", "azul", "rojo", "verde", "rojo"];
const conteo: Record<string, number> = {};
for (const v of votos) {
  conteo[v] = (conteo[v] || 0) + 1;
}
console.log(conteo);
console.log(conteo["rojo"]);`,
          py: `votos = ["rojo", "azul", "rojo", "verde", "rojo"]
conteo = {}
for v in votos:
    conteo[v] = conteo.get(v, 0) + 1
print(conteo)
print(conteo["rojo"])`,
        },
        out: {
          js: '{ rojo: 3, azul: 1, verde: 1 }\n3',
          py: "{'rojo': 3, 'azul': 1, 'verde': 1}\n3",
        },
      },
      {
        title: 'Conjuntos: valores únicos',
        text: 'Un conjunto (<code>Set</code> / <code>set</code>) guarda cada valor <b>una sola vez</b> y responde casi al instante si contiene algo. Buscar en una lista obliga a recorrerla entera; en un conjunto no.',
        code: {
          js: `const visitadas = new Set();
for (const ciudad of ["Lima", "Quito", "Lima", "Bogotá"]) {
  if (visitadas.has(ciudad)) {
    console.log("Repetida:", ciudad);
  }
  visitadas.add(ciudad);
}
console.log(visitadas.size);`,
          ts: `const visitadas = new Set<string>();
for (const ciudad of ["Lima", "Quito", "Lima", "Bogotá"]) {
  if (visitadas.has(ciudad)) {
    console.log("Repetida:", ciudad);
  }
  visitadas.add(ciudad);
}
console.log(visitadas.size);`,
          py: `visitadas = set()
for ciudad in ["Lima", "Quito", "Lima", "Bogotá"]:
    if ciudad in visitadas:
        print("Repetida:", ciudad)
    visitadas.add(ciudad)
print(len(visitadas))`,
        },
        out: 'Repetida: Lima\n3',
      },
      {
        title: 'Recordar posiciones mientras recorres',
        text: 'Muchos problemas que parecen pedir dos bucles anidados se resuelven con uno solo si vas <b>guardando lo visto</b> en un diccionario. Con una lista de mil elementos pasas de un millón de comparaciones a mil. Aquí se guarda dónde apareció cada palabra por primera vez.',
        code: {
          js: `const palabras = ["sol", "mar", "sol", "luz", "mar"];
const primeraVez = new Map();
palabras.forEach((p, i) => {
  if (!primeraVez.has(p)) primeraVez.set(p, i);
});
console.log(primeraVez.get("mar"), primeraVez.get("luz"));`,
          ts: `const palabras: string[] = ["sol", "mar", "sol", "luz", "mar"];
const primeraVez = new Map<string, number>();
palabras.forEach((p, i) => {
  if (!primeraVez.has(p)) primeraVez.set(p, i);
});
console.log(primeraVez.get("mar"), primeraVez.get("luz"));`,
          py: `palabras = ["sol", "mar", "sol", "luz", "mar"]
primera_vez = {}
for i, p in enumerate(palabras):
    if p not in primera_vez:
        primera_vez[p] = i
print(primera_vez["mar"], primera_vez["luz"])`,
        },
        out: '1 3',
      },
    ],
    quiz: [
      {
        q: '¿Qué estructura usarías para saber rápidamente si ya viste un número?',
        options: ['Una lista que recorres cada vez', 'Un conjunto (<code>Set</code> / <code>set</code>)', 'Un texto', 'Una variable booleana'],
        answer: 1,
        why: 'Un conjunto responde "¿lo contiene?" sin recorrer todos los elementos.',
      },
      {
        q: '¿Qué imprime este código?',
        code: {
          js: `const d = {};
for (const c of "banana") {
  d[c] = (d[c] || 0) + 1;
}
console.log(d["a"]);`,
          ts: `const d: Record<string, number> = {};
for (const c of "banana") {
  d[c] = (d[c] || 0) + 1;
}
console.log(d["a"]);`,
          py: `d = {}
for c in "banana":
    d[c] = d.get(c, 0) + 1
print(d["a"])`,
        },
        options: ['2', '3', '6', '1'],
        answer: 1,
        why: '"banana" tiene tres letras <code>a</code>: b-<b>a</b>-n-<b>a</b>-n-<b>a</b>.',
      },
      {
        q: '¿Cuántos elementos tiene un conjunto creado a partir de <code>[1, 2, 2, 3, 3, 3]</code>?',
        options: ['6', '3', '1', '2'],
        answer: 1,
        why: 'Los repetidos se descartan: quedan 1, 2 y 3.',
      },
    ],
  },

  // ───────────────────────────── 08 ─────────────────────────────
  {
    id: 'pilas',
    title: 'Pilas',
    summary: 'La estructura "último en entrar, primero en salir" y cuándo usarla.',
    challenges: ['parentesis', 'rpn'],
    sections: [
      {
        title: 'Último en entrar, primero en salir',
        text: 'Una pila es como un montón de platos: solo pones y quitas por arriba. Con un arreglo, <code>push</code> / <code>append</code> apila y <code>pop</code> desapila el último. El de arriba se consulta con <code>pila[pila.length - 1]</code> en JS o <code>pila[-1]</code> en Python.',
        code: {
          js: `const pila = [];
pila.push("a");
pila.push("b");
pila.push("c");
console.log(pila.pop());
console.log(pila.pop());
console.log(pila);`,
          ts: `const pila: string[] = [];
pila.push("a");
pila.push("b");
pila.push("c");
console.log(pila.pop());
console.log(pila.pop());
console.log(pila);`,
          py: `pila = []
pila.append("a")
pila.append("b")
pila.append("c")
print(pila.pop())
print(pila.pop())
print(pila)`,
        },
        out: { js: "c\nb\n[ 'a' ]", py: "c\nb\n['a']" },
      },
      {
        title: 'Un historial con "atrás"',
        text: 'El botón "atrás" del navegador o el "deshacer" de un editor son pilas: siempre vuelves a lo más reciente. Cuidado con la pila vacía: en JS <code>pop()</code> devuelve <code>undefined</code>, pero en Python lanza <code>IndexError</code>. Comprueba que tenga elementos antes.',
        code: {
          js: `const historial = [];
function visitar(pagina) {
  historial.push(pagina);
}
function atras() {
  historial.pop();
  return historial.length > 0 ? historial[historial.length - 1] : "inicio";
}
visitar("home");
visitar("perfil");
visitar("ajustes");
console.log(atras());
console.log(atras());
console.log(atras());`,
          ts: `const historial: string[] = [];
function visitar(pagina: string): void {
  historial.push(pagina);
}
function atras(): string {
  historial.pop();
  return historial.length > 0 ? historial[historial.length - 1] : "inicio";
}
visitar("home");
visitar("perfil");
visitar("ajustes");
console.log(atras());
console.log(atras());
console.log(atras());`,
          py: `historial = []

def visitar(pagina: str) -> None:
    historial.append(pagina)

def atras() -> str:
    historial.pop()
    return historial[-1] if historial else "inicio"

visitar("home")
visitar("perfil")
visitar("ajustes")
print(atras())
print(atras())
print(atras())`,
        },
        out: 'perfil\nhome\ninicio',
      },
      {
        title: 'Cuándo pensar en una pila',
        text: 'Cuando algo se <b>abre</b> y debe <b>cerrarse</b> en orden inverso (paréntesis, etiquetas HTML, llamadas a funciones), o cuando cada paso opera con los últimos valores que guardaste. Sacar todo de una pila también invierte el orden en que entró.',
        code: {
          js: `const pila = [];
for (const palabra of "uno dos tres".split(" ")) {
  pila.push(palabra);
}
const invertido = [];
while (pila.length > 0) {
  invertido.push(pila.pop());
}
console.log(invertido.join(" "));`,
          ts: `const pila: string[] = [];
for (const palabra of "uno dos tres".split(" ")) {
  pila.push(palabra);
}
const invertido: string[] = [];
while (pila.length > 0) {
  invertido.push(pila.pop()!);
}
console.log(invertido.join(" "));`,
          py: `pila = []
for palabra in "uno dos tres".split():
    pila.append(palabra)
invertido = []
while pila:
    invertido.append(pila.pop())
print(" ".join(invertido))`,
        },
        out: 'tres dos uno',
      },
    ],
    quiz: [
      {
        q: 'En una pila, ¿qué elemento sale primero?',
        options: ['El primero que entró', 'El último que entró', 'El más pequeño', 'Uno al azar'],
        answer: 1,
        why: 'Es la regla de la pila: último en entrar, primero en salir (LIFO).',
      },
      {
        q: '¿Qué imprime este código?',
        code: {
          js: `const p = [];
p.push(1);
p.push(2);
p.pop();
p.push(3);
console.log(p[p.length - 1], p.length);`,
          py: `p = []
p.append(1)
p.append(2)
p.pop()
p.append(3)
print(p[-1], len(p))`,
        },
        options: ['3 2', '2 2', '3 3', '1 3'],
        answer: 0,
        why: 'Se quita el 2 y se añade el 3: la pila queda [1, 3]. Arriba está el 3 y hay 2 elementos.',
      },
      {
        q: '¿Qué pasa en Python si haces <code>pila.pop()</code> con la pila vacía?',
        options: ['Devuelve <code>None</code>', 'Lanza <code>IndexError</code>', 'Devuelve 0', 'Nada'],
        answer: 1,
        why: 'Python no permite sacar de una lista vacía: comprueba <code>if pila:</code> antes.',
      },
    ],
  },

  // ───────────────────────────── 09 ─────────────────────────────
  {
    id: 'enteros',
    title: 'Matemática con enteros',
    summary: 'Separar dígitos, divisibilidad, conversiones y las trampas de los decimales.',
    challenges: ['suma-digitos', 'mcd', 'binario', 'armstrong', 'romanos'],
    sections: [
      {
        title: 'Separar los dígitos de un número',
        text: '<code>n % 10</code> da el último dígito y la división entera entre 10 lo quita. Repitiendo las dos cosas mientras <code>n &gt; 0</code> recorres el número de derecha a izquierda. Con otra base (por ejemplo 2) el mismo truco da los dígitos en esa base.',
        code: {
          js: `let n = 4096;
while (n > 0) {
  console.log(n % 10);   // último dígito
  n = Math.floor(n / 10); // quita el último dígito
}`,
          py: `n = 4096
while n > 0:
    print(n % 10)  # último dígito
    n = n // 10    # quita el último dígito`,
        },
        out: '6\n9\n0\n4',
      },
      {
        title: 'Divisibilidad',
        text: '<code>a % b === 0</code> significa que <code>b</code> divide a <code>a</code>. Para buscar divisores no hace falta llegar hasta <code>n</code>: si <code>n</code> tiene un divisor mayor que su raíz cuadrada, también tiene uno menor. Por eso muchos algoritmos recorren solo mientras <code>d * d &lt;= n</code>.',
        code: {
          js: `const n = 36;
const divisores = [];
for (let d = 1; d * d <= n; d++) {
  if (n % d === 0) {
    divisores.push(d);
    if (d !== n / d) divisores.push(n / d);
  }
}
console.log(divisores.sort((a, b) => a - b).join(", "));`,
          ts: `const n = 36;
const divisores: number[] = [];
for (let d = 1; d * d <= n; d++) {
  if (n % d === 0) {
    divisores.push(d);
    if (d !== n / d) divisores.push(n / d);
  }
}
console.log(divisores.sort((a, b) => a - b).join(", "));`,
          py: `n = 36
divisores = []
d = 1
while d * d <= n:
    if n % d == 0:
        divisores.append(d)
        if d != n // d:
            divisores.append(n // d)
    d += 1
print(", ".join(str(x) for x in sorted(divisores)))`,
        },
        out: '1, 2, 3, 4, 6, 9, 12, 18, 36',
      },
      {
        title: 'Número ↔ texto, y tablas de valores',
        text: 'Convertir un número a texto te deja contar sus dígitos o leerlos uno a uno; para volver a número usa <code>Number</code> / <code>parseInt</code> o <code>int</code>. Cuando cada símbolo tiene un valor fijo, guárdalos en un diccionario en vez de encadenar muchos <code>if</code>.',
        code: {
          js: `const texto = String(905);
console.log(texto.length, texto[0]);
console.log(Number("42") + 1);

const valor = { a: 1, b: 2, c: 3 };
let total = 0;
for (const letra of "cab") total += valor[letra];
console.log(total);`,
          ts: `const texto: string = String(905);
console.log(texto.length, texto[0]);
console.log(Number("42") + 1);

const valor: Record<string, number> = { a: 1, b: 2, c: 3 };
let total = 0;
for (const letra of "cab") total += valor[letra];
console.log(total);`,
          py: `texto = str(905)
print(len(texto), texto[0])
print(int("42") + 1)

valor = {"a": 1, "b": 2, "c": 3}
total = 0
for letra in "cab":
    total += valor[letra]
print(total)`,
        },
        out: '3 9\n43\n6',
      },
      {
        title: 'Cuidado con los decimales y el redondeo',
        text: 'Los decimales se guardan de forma aproximada: <code>0.1 + 0.2</code> no da exactamente 0.3. Además, cada lenguaje redondea distinto: Python redondea 2.5 a 2 (al par más cercano) y JS a 3. Con negativos, <code>Math.floor</code> y <code>//</code> van hacia abajo (−4), mientras que <code>Math.trunc</code> e <code>int()</code> cortan los decimales (−3).',
        code: {
          js: `console.log(0.1 + 0.2);
console.log(Math.round(2.5), Math.trunc(-7 / 2), Math.floor(-7 / 2));`,
          py: `print(0.1 + 0.2)
print(round(2.5), int(-7 / 2), -7 // 2)`,
        },
        out: { js: '0.30000000000000004\n3 -3 -4', py: '0.30000000000000004\n2 -3 -4' },
      },
    ],
    quiz: [
      {
        q: '¿Qué imprime este código?',
        code: {
          js: `const n = 5274;
console.log(n % 10, Math.floor(n / 10));`,
          py: `n = 5274
print(n % 10, n // 10)`,
        },
        options: ['4 527', '5 274', '4 527.4', '7 527'],
        answer: 0,
        why: '<code>% 10</code> da el último dígito (4) y la división entera entre 10 lo quita (527).',
      },
      {
        q: '¿Cómo compruebas si <code>a</code> es divisible entre <code>b</code>?',
        options: ['<code>a / b == 0</code>', '<code>a % b == 0</code>', '<code>a - b == 0</code>', '<code>b % a == 0</code>'],
        answer: 1,
        why: 'Si el resto de dividir <code>a</code> entre <code>b</code> es 0, la división es exacta.',
      },
      {
        q: '¿Cuánto da <code>-7 // 2</code> en Python?',
        options: ['-3', '-4', '-3.5', '3'],
        answer: 1,
        why: '<code>//</code> redondea hacia abajo, y por debajo de −3.5 está −4.',
      },
    ],
  },

  // ───────────────────────────── 10 ─────────────────────────────
  {
    id: 'busqueda-orden',
    title: 'Buscar y ordenar',
    summary: 'Búsqueda lineal y binaria, ordenar listas y sus trampas.',
    challenges: ['busqueda-binaria', 'burbuja', 'segundo-mayor', 'anagramas'],
    sections: [
      {
        title: 'Búsqueda lineal',
        text: 'La forma más directa de buscar es mirar los elementos uno a uno. Si lo encuentras, devuelve su posición en ese momento; si terminas el recorrido sin encontrarlo, devuelve un valor que indique "no está" (por convención, −1).',
        code: {
          js: `function buscar(lista, objetivo) {
  for (let i = 0; i < lista.length; i++) {
    if (lista[i] === objetivo) return i;
  }
  return -1;
}
console.log(buscar([7, 3, 9], 9), buscar([7, 3, 9], 4));`,
          ts: `function buscar(lista: number[], objetivo: number): number {
  for (let i = 0; i < lista.length; i++) {
    if (lista[i] === objetivo) return i;
  }
  return -1;
}
console.log(buscar([7, 3, 9], 9), buscar([7, 3, 9], 4));`,
          py: `def buscar(lista: list[int], objetivo: int) -> int:
    for i in range(len(lista)):
        if lista[i] == objetivo:
            return i
    return -1

print(buscar([7, 3, 9], 9), buscar([7, 3, 9], 4))`,
        },
        out: '2 -1',
      },
      {
        title: 'Ordenar (y la trampa de JavaScript)',
        text: 'En JavaScript, <code>sort()</code> sin argumentos ordena <b>como texto</b>: "10" va antes que "9". Para números pásale una función de comparación: <code>(a, b) =&gt; a - b</code> para orden ascendente. Además <code>sort</code> modifica el arreglo original; copia antes con <code>[...nums]</code> si no quieres cambiarlo. En Python, <code>sorted()</code> devuelve una lista nueva y ordena los números correctamente.',
        code: {
          js: `const nums = [10, 9, 1, 100];
console.log([...nums].sort());
console.log([...nums].sort((a, b) => a - b));
console.log([...nums].sort((a, b) => b - a));
console.log(["pera", "Uva", "kiwi"].sort());`,
          py: `nums = [10, 9, 1, 100]
print(sorted(nums))
print(sorted(nums, reverse=True))
print(sorted(["pera", "Uva", "kiwi"]))`,
        },
        out: {
          js: "[ 1, 10, 100, 9 ]\n[ 1, 9, 10, 100 ]\n[ 100, 10, 9, 1 ]\n[ 'Uva', 'kiwi', 'pera' ]",
          py: "[1, 9, 10, 100]\n[100, 10, 9, 1]\n['Uva', 'kiwi', 'pera']",
        },
      },
      {
        title: 'Intercambiar y partir por la mitad',
        text: 'Muchos algoritmos de ordenamiento intercambian dos elementos; ambos lenguajes lo permiten en una línea. Y si una lista ya está <b>ordenada</b>, puedes buscar como en el juego de adivinar un número: mira el centro y descarta la mitad donde seguro no está. Cada paso divide el rango a la mitad, así que 100 opciones se resuelven en 7 pasos como mucho.',
        code: {
          js: `let a = 1, b = 2;
[a, b] = [b, a];
console.log(a, b);

// Adivinar un número del 1 al 100
const secreto = 73;
let bajo = 1, alto = 100, intentos = 0;
while (true) {
  intentos++;
  const medio = Math.floor((bajo + alto) / 2);
  if (medio === secreto) break;
  if (medio < secreto) bajo = medio + 1;
  else alto = medio - 1;
}
console.log("Encontrado en", intentos, "intentos");`,
          py: `a, b = 1, 2
a, b = b, a
print(a, b)

# Adivinar un número del 1 al 100
secreto = 73
bajo, alto, intentos = 1, 100, 0
while True:
    intentos += 1
    medio = (bajo + alto) // 2
    if medio == secreto:
        break
    if medio < secreto:
        bajo = medio + 1
    else:
        alto = medio - 1
print("Encontrado en", intentos, "intentos")`,
        },
        out: '2 1\nEncontrado en 6 intentos',
      },
    ],
    quiz: [
      {
        q: 'En JavaScript, ¿qué devuelve <code>[10, 9, 1].sort()</code>?',
        options: ['<code>[1, 9, 10]</code>', '<code>[1, 10, 9]</code>', '<code>[10, 9, 1]</code>', 'Un error'],
        answer: 1,
        why: 'Sin función de comparación ordena como texto: "1" &lt; "10" &lt; "9".',
      },
      {
        q: 'La búsqueda binaria solo funciona si…',
        options: ['La lista tiene un número par de elementos', 'La lista está ordenada', 'Los números son positivos', 'No hay duplicados'],
        answer: 1,
        why: 'Descartar una mitad solo es seguro si sabes que todo lo de esa mitad es menor (o mayor) que lo que buscas.',
      },
      {
        q: 'Con búsqueda binaria, ¿cuántos pasos necesitas como máximo en una lista ordenada de 1000 elementos?',
        options: ['Unos 10', 'Unos 100', '500', '1000'],
        answer: 0,
        why: '1000 → 500 → 250 → … → 1 son unas 10 divisiones a la mitad (2<sup>10</sup> = 1024).',
      },
    ],
  },

  // ───────────────────────────── 11 ─────────────────────────────
  {
    id: 'dinamica',
    title: 'Programación dinámica',
    summary: 'Guardar resultados intermedios para no recalcularlos.',
    challenges: ['fibonacci', 'escaleras', 'kadane', 'monedas'],
    sections: [
      {
        title: 'El problema: repetir trabajo',
        text: 'La secuencia tribonacci suma los <b>tres</b> anteriores: 0, 0, 1, 1, 2, 4, 7, 13… Escrita de forma recursiva directa, cada llamada abre tres más y los mismos valores se calculan miles de veces. Aquí contamos cuántas llamadas hacen falta para el término 20.',
        code: {
          js: `let llamadas = 0;
function trib(n) {
  llamadas++;
  if (n < 2) return 0;
  if (n === 2) return 1;
  return trib(n - 1) + trib(n - 2) + trib(n - 3);
}
console.log(trib(20), llamadas);`,
          ts: `let llamadas = 0;
function trib(n: number): number {
  llamadas++;
  if (n < 2) return 0;
  if (n === 2) return 1;
  return trib(n - 1) + trib(n - 2) + trib(n - 3);
}
console.log(trib(20), llamadas);`,
          py: `llamadas = 0

def trib(n: int) -> int:
    global llamadas
    llamadas += 1
    if n < 2:
        return 0
    if n == 2:
        return 1
    return trib(n - 1) + trib(n - 2) + trib(n - 3)

print(trib(20), llamadas)`,
        },
        out: '35890 128287',
      },
      {
        title: 'Memoización: apuntar lo ya calculado',
        text: 'Basta con guardar cada resultado en un diccionario la primera vez que se calcula y consultarlo antes de recalcular. Ahora cada término se calcula una sola vez, y el término 60 sale al instante.',
        code: {
          js: `const memo = new Map();
function trib(n) {
  if (n < 2) return 0;
  if (n === 2) return 1;
  if (memo.has(n)) return memo.get(n);
  const r = trib(n - 1) + trib(n - 2) + trib(n - 3);
  memo.set(n, r);
  return r;
}
console.log(trib(60));`,
          ts: `const memo = new Map<number, number>();
function trib(n: number): number {
  if (n < 2) return 0;
  if (n === 2) return 1;
  if (memo.has(n)) return memo.get(n)!;
  const r = trib(n - 1) + trib(n - 2) + trib(n - 3);
  memo.set(n, r);
  return r;
}
console.log(trib(60));`,
          py: `memo = {}

def trib(n: int) -> int:
    if n < 2:
        return 0
    if n == 2:
        return 1
    if n in memo:
        return memo[n]
    r = trib(n - 1) + trib(n - 2) + trib(n - 3)
    memo[n] = r
    return r

print(trib(60))`,
        },
        out: '1383410902447554',
      },
      {
        title: 'Tabla de abajo hacia arriba',
        text: 'También puedes llenar una tabla desde los casos pequeños. Define qué significa <code>dp[i]</code>, fija los casos base y escribe cómo se obtiene <code>dp[i]</code> a partir de los anteriores. Ejemplo: el mayor botín robando casas en fila sin tocar dos vecinas. En cada casa decides: saltarla (<code>dp[i-1]</code>) o robarla y sumar lo mejor hasta dos casas atrás (<code>dp[i-2] + casa</code>). Fíjate en que tomar siempre lo más grande en cada paso (estrategia "voraz") no siempre da el óptimo; la tabla compara todas las opciones.',
        code: {
          js: `const casas = [2, 7, 9, 3, 1];
const dp = [casas[0], Math.max(casas[0], casas[1])];
for (let i = 2; i < casas.length; i++) {
  dp[i] = Math.max(dp[i - 1], dp[i - 2] + casas[i]);
}
console.log(dp);
console.log(dp[dp.length - 1]);`,
          ts: `const casas: number[] = [2, 7, 9, 3, 1];
const dp: number[] = [casas[0], Math.max(casas[0], casas[1])];
for (let i = 2; i < casas.length; i++) {
  dp[i] = Math.max(dp[i - 1], dp[i - 2] + casas[i]);
}
console.log(dp);
console.log(dp[dp.length - 1]);`,
          py: `casas = [2, 7, 9, 3, 1]
dp = [casas[0], max(casas[0], casas[1])]
for i in range(2, len(casas)):
    dp.append(max(dp[i - 1], dp[i - 2] + casas[i]))
print(dp)
print(dp[-1])`,
        },
        out: { js: '[ 2, 7, 11, 11, 12 ]\n12', py: '[2, 7, 11, 11, 12]\n12' },
      },
    ],
    quiz: [
      {
        q: '¿Qué es memoizar?',
        options: ['Escribir comentarios en el código', 'Guardar resultados ya calculados para no repetirlos', 'Usar menos variables', 'Convertir siempre la recursión en un bucle'],
        answer: 1,
        why: 'La memoización cambia memoria por tiempo: cada subproblema se resuelve una sola vez.',
      },
      {
        q: '¿Qué imprime este código?',
        code: {
          js: `const v = [5, 1, 1, 5];
const dp = [v[0], Math.max(v[0], v[1])];
for (let i = 2; i < v.length; i++) {
  dp.push(Math.max(dp[i - 1], dp[i - 2] + v[i]));
}
console.log(dp[3]);`,
          py: `v = [5, 1, 1, 5]
dp = [v[0], max(v[0], v[1])]
for i in range(2, len(v)):
    dp.append(max(dp[i - 1], dp[i - 2] + v[i]))
print(dp[3])`,
        },
        options: ['10', '6', '11', '12'],
        answer: 0,
        why: 'dp = [5, 5, 6, 10]: lo mejor es robar la primera y la última casa (5 + 5).',
      },
      {
        q: 'Con monedas de valor 1, 3 y 4, quieres formar 6 con las menos monedas posibles. Si tomas siempre la moneda más grande que cabe…',
        options: ['Obtienes siempre el óptimo', 'Usas 3 monedas (4 + 1 + 1), pero lo óptimo son 2 (3 + 3)', 'No puedes formar 6', 'Usas 2 monedas'],
        answer: 1,
        why: 'La estrategia voraz no mira hacia adelante. La programación dinámica prueba todas las opciones de forma eficiente.',
      },
    ],
  },

  // ───────────────────────────── 12 ─────────────────────────────
  {
    id: 'matrices',
    title: 'Matrices y cuadrículas',
    summary: 'Listas de listas: filas, columnas, vecinos y límites.',
    challenges: ['transpuesta', 'espiral', 'islas'],
    sections: [
      {
        title: 'Listas de listas',
        text: 'Una matriz es una lista de filas. <code>m[f][c]</code> es el elemento de la fila <code>f</code> y la columna <code>c</code>; el número de filas es la longitud de <code>m</code> y el de columnas, la de <code>m[0]</code>. En Python, crea las filas con <code>[[0] * 3 for _ in range(2)]</code>: <code>[[0] * 3] * 2</code> repite <b>la misma</b> fila dos veces.',
        code: {
          js: `const m = [
  [1, 2, 3],
  [4, 5, 6],
];
console.log(m.length, m[0].length, m[1][2]);
for (const fila of m) {
  console.log(fila.join(" "));
}`,
          ts: `const m: number[][] = [
  [1, 2, 3],
  [4, 5, 6],
];
console.log(m.length, m[0].length, m[1][2]);
for (const fila of m) {
  console.log(fila.join(" "));
}`,
          py: `m = [
    [1, 2, 3],
    [4, 5, 6],
]
print(len(m), len(m[0]), m[1][2])
for fila in m:
    print(" ".join(str(x) for x in fila))`,
        },
        out: '2 3 6\n1 2 3\n4 5 6',
      },
      {
        title: 'Recorrer por columnas y diagonales',
        text: 'El orden de los bucles decide el recorrido: si el bucle exterior va por columnas (<code>j</code>) y el interior por filas (<code>i</code>), lees la matriz columna a columna. La diagonal principal son las posiciones donde fila y columna coinciden: <code>m[i][i]</code>.',
        code: {
          js: `const m = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
let diagonal = 0;
for (let i = 0; i < m.length; i++) diagonal += m[i][i];

const sumaColumnas = [];
for (let j = 0; j < m[0].length; j++) {
  let s = 0;
  for (let i = 0; i < m.length; i++) s += m[i][j];
  sumaColumnas.push(s);
}
console.log(diagonal, sumaColumnas.join(" "));`,
          ts: `const m: number[][] = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
let diagonal = 0;
for (let i = 0; i < m.length; i++) diagonal += m[i][i];

const sumaColumnas: number[] = [];
for (let j = 0; j < m[0].length; j++) {
  let s = 0;
  for (let i = 0; i < m.length; i++) s += m[i][j];
  sumaColumnas.push(s);
}
console.log(diagonal, sumaColumnas.join(" "));`,
          py: `m = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
]
diagonal = 0
for i in range(len(m)):
    diagonal += m[i][i]

suma_columnas = []
for j in range(len(m[0])):
    s = 0
    for i in range(len(m)):
        s += m[i][j]
    suma_columnas.append(s)
print(diagonal, " ".join(str(x) for x in suma_columnas))`,
        },
        out: '15 12 15 18',
      },
      {
        title: 'Vecinos y límites',
        text: 'En una cuadrícula, los vecinos de <code>(f, c)</code> están arriba, abajo, izquierda y derecha. Guarda los cuatro desplazamientos en una lista y comprueba siempre que la casilla vecina esté <b>dentro</b> de la cuadrícula antes de leerla. Para explorar zonas conectadas, combina esto con recursión (o con una pila) y marca las casillas ya visitadas.',
        code: {
          js: `const mapa = [
  [1, 0, 1],
  [1, 1, 0],
  [0, 1, 0],
];
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function vecinosConUno(f, c) {
  let n = 0;
  for (const [df, dc] of dirs) {
    const nf = f + df, nc = c + dc;
    const dentro = nf >= 0 && nf < mapa.length && nc >= 0 && nc < mapa[0].length;
    if (dentro && mapa[nf][nc] === 1) n++;
  }
  return n;
}
console.log(vecinosConUno(1, 1), vecinosConUno(0, 0));`,
          ts: `const mapa: number[][] = [
  [1, 0, 1],
  [1, 1, 0],
  [0, 1, 0],
];
const dirs: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function vecinosConUno(f: number, c: number): number {
  let n = 0;
  for (const [df, dc] of dirs) {
    const nf = f + df, nc = c + dc;
    const dentro = nf >= 0 && nf < mapa.length && nc >= 0 && nc < mapa[0].length;
    if (dentro && mapa[nf][nc] === 1) n++;
  }
  return n;
}
console.log(vecinosConUno(1, 1), vecinosConUno(0, 0));`,
          py: `mapa = [
    [1, 0, 1],
    [1, 1, 0],
    [0, 1, 0],
]
dirs = [(1, 0), (-1, 0), (0, 1), (0, -1)]

def vecinos_con_uno(f: int, c: int) -> int:
    n = 0
    for df, dc in dirs:
        nf, nc = f + df, c + dc
        dentro = 0 <= nf < len(mapa) and 0 <= nc < len(mapa[0])
        if dentro and mapa[nf][nc] == 1:
            n += 1
    return n

print(vecinos_con_uno(1, 1), vecinos_con_uno(0, 0))`,
        },
        out: '2 1',
      },
    ],
    quiz: [
      {
        q: '¿Qué imprime este código?',
        code: {
          js: `const m = [[1, 2], [3, 4], [5, 6]];
console.log(m.length, m[0].length, m[2][0]);`,
          py: `m = [[1, 2], [3, 4], [5, 6]]
print(len(m), len(m[0]), m[2][0])`,
        },
        options: ['3 2 5', '2 3 5', '3 2 6', '2 3 3'],
        answer: 0,
        why: 'Hay 3 filas de 2 columnas, y <code>m[2][0]</code> es el primer elemento de la tercera fila: 5.',
      },
      {
        q: 'En una cuadrícula de <code>F</code> filas y <code>C</code> columnas, ¿qué condición comprueba que <code>(f, c)</code> está dentro?',
        options: ['<code>f &lt; F</code> y <code>c &lt; C</code>', '<code>f &gt;= 0</code>, <code>f &lt; F</code>, <code>c &gt;= 0</code> y <code>c &lt; C</code>', '<code>f &lt;= F</code> y <code>c &lt;= C</code>', '<code>f + c &lt; F + C</code>'],
        answer: 1,
        why: 'Hay que vigilar los cuatro bordes: los índices negativos también están fuera (y en Python <code>-1</code> no da error, ¡lee la última fila!).',
      },
      {
        q: 'En Python, ¿por qué <code>[[0] * 3] * 2</code> es una trampa?',
        options: ['Da error', 'Las dos filas son la misma lista: cambiar una cambia la otra', 'Crea 3 filas', 'Los ceros son textos'],
        answer: 1,
        why: '<code>* 2</code> copia la referencia a la misma fila. Usa <code>[[0] * 3 for _ in range(2)]</code>.',
      },
    ],
  },
];

export const lessonById = new Map(LESSONS.map((l) => [l.id, l]));

const KEY = { javascript: 'js', typescript: 'ts', python: 'py' };

// Elige la variante de un ejemplo o salida para el lenguaje; TypeScript usa la de JavaScript si no tiene propia.
export function pick(value, lang) {
  if (value == null || typeof value === 'string') return value;
  return value[KEY[lang]] ?? (lang === 'typescript' ? value.js : undefined);
}

export const lessonsForChallenge = (id) => LESSONS.filter((l) => l.challenges.includes(id));
