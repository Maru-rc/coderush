# ⚡ CodeRush

Retos de lógica de programación con recompensas, en **JavaScript**, **TypeScript** y **Python**, y una ruta de backend con **NestJS**.

## Arrancar

```bash
npm install   # solo para la sección de NestJS
npm start
```

Abre http://localhost:3000. Los retos y la sección Aprender no necesitan dependencias. La sección **NestJS** ejecuta tu código con Nest real, así que sus actividades necesitan `npm install` (unos 170 MB en `node_modules`, versiones fijadas en `package.json`). Sin ellas, sus lecciones y librerías se pueden leer igualmente.

**Requisitos:** Node.js 23.6 o superior, que ejecuta TypeScript de forma nativa (24.11 o superior para las actividades de NestJS, por TypeORM), y Python 3 en el PATH (`python` en Windows y `python3` en el resto; puedes cambiarlo con la variable `PYTHON_CMD`). El editor (Monaco, el mismo de VS Code) se carga desde un CDN. Si no hay internet, la app usa un editor de texto simple.

## Cómo se juega

- **Probar** (`Ctrl+Enter`) ejecuta solo los ejemplos y no cuenta como intento.
- **Enviar** (`Ctrl+Shift+Enter`) valida con todos los tests, incluidos los ocultos, y da XP si pasan todos.
- Resolver el mismo reto en otro lenguaje da el 50 % del XP base.
- Cuando algo falla, el error se explica en español con una pista (`public/js/errors.js`) y la línea queda marcada en el editor. Si el resultado es incorrecto sin que haya un error, también se explica por qué ("devolviste un texto y se esperaba un número", "los elementos están en otro orden"…).

| Mecánica | Detalle |
|---|---|
| XP y niveles | Fácil 15 · Medio 30 · Difícil 60 de base. Los primeros niveles se suben rápido. |
| Bonus | 🎯 primer intento +50 %, 🧠 sin pistas +25 %, ⚡ velocidad +25 % (2, 5 o 10 min según la dificultad) |
| Combo | Cada reto resuelto seguido suma ×0.1 (hasta ×1.5). Un envío fallido lo reinicia. |
| Golpe crítico | 12 % de probabilidad de duplicar el XP |
| Reto del día | Cambia cada día y da XP ×2. Siempre se puede jugar, aunque esté bloqueado. |
| Racha | Días seguidos resolviendo al menos un reto. Se avisa cuando está en peligro. |
| Meta diaria | 3 retos al día dan +30 XP |
| Desbloqueos | Medios: 3 fáciles resueltos. Difíciles: 4 medios resueltos. |
| Logros | 37 logros, cada uno da +20 XP |

## Aprender

La sección **Aprender** (`#/aprender`) tiene 12 lecciones, una por concepto: variables, condicionales, bucles, textos, arreglos, recursión, diccionarios y conjuntos, pilas, matemática con enteros, búsqueda y ordenamiento, programación dinámica y matrices.

- Cada lección explica el concepto con ejemplos en el lenguaje elegido y muestra su salida.
- Al final hay un mini-quiz: aprobarlo da **+20 XP** (+10 si aciertas todo a la primera). Después queda como práctica libre.
- Cada lección enlaza a sus retos para practicar, y cada reto muestra "Aprende el concepto" con enlaces a sus lecciones.

## NestJS

La sección **NestJS** (`#/nest`) tiene tres pestañas:

- **Lecciones**: 12 temas, desde controladores y proveedores hasta TypeORM, JWT, Swagger y pruebas, con ejemplos en TypeScript y un quiz. Dan el mismo XP que las de Aprender.
- **Actividades**: 13 ejercicios que se ejecutan con **NestJS de verdad**. CodeRush compila tu TypeScript (con decoradores), arranca tu `AppModule` en un proceso aparte y le hace peticiones HTTP reales, en orden y sobre la misma app. Para configurar la app como en `main.ts` (pipes, filtros, Swagger), exporta una función `configurar(app)`. Los errores típicos de Nest ("can't resolve dependencies", un módulo sin exportar, un repositorio sin `forFeature`…) se explican en español. Dan XP según la dificultad (20 · 40 · 70), con bonus por pasar a la primera y sin pistas, y cuentan para la racha y la meta diaria.
- **Librerías**: fichas de las 15 librerías más usadas (config, class-validator, TypeORM, Prisma, Mongoose, JWT, Passport, Swagger, testing, throttler, helmet, bcrypt, schedule, cache y axios), con el comando de instalación, cuándo usarlas, un ejemplo y enlaces a su lección y su actividad.

El progreso se guarda en `data/progress.json`. Se puede reiniciar desde 📊 Estadísticas.

## Estructura

```
server.js              Servidor HTTP (solo escucha en 127.0.0.1)
server/challenges.js   Catálogo de retos y tests
server/runner.js       Ejecuta el código en un proceso aparte con límite de 6 s
server/nest/           Actividades de NestJS: catálogo y pruebas, runner (compila y compara) y driver (arranca Nest)
scripts/verify.js      npm run verify: comprueba los 43 retos con soluciones de referencia
scripts/verify-lessons.js  ejecuta los ejemplos de las lecciones en los 3 lenguajes y compara su salida
scripts/verify-nest.js     resuelve cada actividad de NestJS con su solución de referencia y compila los ejemplos con los tipos reales
public/js/lessons.js   Contenido de la academia (lecciones, ejemplos y quizzes)
public/js/nest-content.js  Lecciones y librerías de NestJS
public/                Interfaz (HTML, CSS y módulos ES, sin compilación)
```

### Añadir un reto

Agrega un objeto a `server/challenges.js` con `id`, `fn` (en camelCase; para Python se convierte a snake_case), `params` con tipos de TypeScript, `returns` y sus `tests`. Usa `t()` para los tests visibles y `h()` para los ocultos. Después añade su solución de referencia en `scripts/verify.js`, enlázalo desde al menos una lección (`challenges` en `public/js/lessons.js`) y ejecuta `npm run verify`.

### Añadir una lección

Agrega un objeto a `LESSONS` en `public/js/lessons.js` con `id`, `title`, `summary`, `challenges`, `sections` y `quiz`. Cada sección lleva su código (`{ js, ts?, py }`; TypeScript reutiliza JavaScript si se omite) y la salida exacta en `out`. Las preguntas del quiz con código deben imprimir el texto de su respuesta correcta. `npm run verify` lo comprueba todo.

### Añadir una actividad de NestJS

Agrega un objeto a `server/nest/activities.js` con su código inicial (`starter`) y sus pruebas: peticiones (`req` + `expect.status` y `body` exacto o `match` parcial) o llamadas directas a un proveedor (`call`). Enlázala desde una lección (`activities` en `public/js/nest-content.js`), añade su solución de referencia en `scripts/verify-nest.js` y ejecuta `npm run verify`.

> ⚠️ El servidor ejecuta el código que escribes en tu máquina. Solo acepta conexiones locales y peticiones de la propia app. No lo expongas a internet.
