# ⚡ CodeRush

Retos de lógica de programación con recompensas, en **JavaScript**, **TypeScript** y **Python**.

## Arrancar

```bash
npm start
```

Abre http://localhost:3000. No hay dependencias que instalar.

**Requisitos:** Node.js 23.6 o superior (ejecuta TypeScript de forma nativa) y Python 3 en el PATH (`python` en Windows y `python3` en el resto; puedes cambiarlo con la variable `PYTHON_CMD`). El editor (Monaco, el mismo de VS Code) se carga desde un CDN. Si no hay internet, la app usa un editor de texto simple.

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
| Logros | 29 logros, cada uno da +20 XP |

El progreso se guarda en `data/progress.json`. Se puede reiniciar desde 📊 Estadísticas.

## Estructura

```
server.js              Servidor HTTP (solo escucha en 127.0.0.1)
server/challenges.js   Catálogo de retos y tests
server/runner.js       Ejecuta el código en un proceso aparte con límite de 6 s
scripts/verify.js      npm run verify: comprueba los 43 retos con soluciones de referencia
public/                Interfaz (HTML, CSS y módulos ES, sin compilación)
```

### Añadir un reto

Agrega un objeto a `server/challenges.js` con `id`, `fn` (en camelCase; para Python se convierte a snake_case), `params` con tipos de TypeScript, `returns` y sus `tests`. Usa `t()` para los tests visibles y `h()` para los ocultos. Después añade su solución de referencia en `scripts/verify.js` y ejecuta `npm run verify`.

> ⚠️ El servidor ejecuta el código que escribes en tu máquina. Solo acepta conexiones locales y peticiones de la propia app. No lo expongas a internet.
