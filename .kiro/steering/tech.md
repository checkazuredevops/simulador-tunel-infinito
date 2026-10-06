---
inclusion: auto
---

# Tech Steering

## Stack

- **HTML5 + CSS3**: estructura de la SPA y estilos del HUD / pantalla de game over.
- **JavaScript (ES2022, módulos ESM)**: lógica de juego y bucle de render.
- **Three.js** (`^0.169`): motor 3D, generación procedural del túnel, cámara, niebla, partículas y colisiones AABB.
- **GLTFLoader** (addon oficial de Three.js): carga de modelos low-poly (`.glb`) del vehículo y los obstáculos.
- **Vue 3** (`^3.5`, SFC vía Vite): HUD reactivo (`HUD.vue`) y pantalla de game over (`GameOver.vue`).
- **Vite** (`^5`): servidor de desarrollo con HMR y bundler de producción.
- **Vitest** (`^2`): pruebas unitarias y PBT; `jsdom` para las de UI.
- **fast-check** (`^3`): property-based testing de los invariantes del núcleo del juego.

## Dependencias

Solo dependencias directas y mantenidas:

- `three` — motor 3D.
- `vue` — capa de UI reactiva.
- `vite` — dev server + build.
- `@vitejs/plugin-vue` — soporte de SFC en Vite.
- `vitest`, `jsdom`, `@vue/test-utils` — pruebas unitarias y de UI.
- `fast-check` — PBT (devDependency).

No se usan frameworks de estado (Pinia, Vuex), ni librerías de animación (GSAP), ni de UI (Vuetify). El estado del juego vive en un objeto `reactive` de Vue (`src/game/state.js`) más campos internos de los módulos de juego.

## Lógica pura testeable

Toda la lógica que se prueba con Vitest y fast-check vive en **`src/game/logic.js`** y **`src/game/constants.js`**. Estos módulos no importan Three.js ni Vue, por lo que pueden ejecutarse directamente en Node/Vitest sin canvas ni mocks pesados.

Funciones exportadas desde `src/game/logic.js`:

| Función | Descripción |
|---|---|
| `clampLateral(p, dir, speed, delta, limite)` | Aplica movimiento lateral y recorta al intervalo `[-limite, +limite]` |
| `acumularPuntuacion(s, delta, velocidad)` | Incrementa `puntuacion` de forma proporcional al delta |
| `checkCollision(boxA, boxB)` | Devuelve `true` si las dos `Box3`-like se solapan en X, Y y Z |
| `reciclarSegmento(segmento, posicionFrente, separacion)` | Reposiciona un segmento al frente del pool sin crear un nuevo objeto |

## Pruebas

### Unitarias (Vitest)
Lógica pura del juego: `clampLateral`, `acumularPuntuacion`, reciclaje de segmentos, colisión AABB, reinicio de estado.
Archivos: `tests/tunnel.test.js`, `tests/player.test.js`, `tests/ui.test.js`.

### UI (Vitest + jsdom + @vue/test-utils)
Montaje de `HUD.vue` y `GameOver.vue`, reactividad de `puntuacion`, emisión del evento `restart`.
Archivo: `tests/ui.test.js`.

### Property-based testing (fast-check + Vitest)
Cuatro propiedades de correctitud definidas en `## Propiedades de Correctitud` del `design.md`. Cada test importa exclusivamente desde `src/game/logic.js` y `src/game/constants.js` — sin Three.js, sin canvas.

| Archivo | Property | Requisitos validados |
|---|---|---|
| `tests/position.property.test.js` | Clamp `posicionLateral ∈ [-LIMITE, +LIMITE]` para cualquier `p0` y secuencia de pasos | 1.2, 1.4 |
| `tests/scoring.property.test.js` | `puntuacion` es no decreciente; estrictamente creciente si `Σdeltas > 0` | 4.1 |
| `tests/recycling.property.test.js` | `pool.length === POOL_SIZE` invariante tras cualquier número de frames | 2.1, 2.2, 2.3 |
| `tests/collision.property.test.js` | `checkCollision(A,B)` ↔ solapamiento en los 3 ejes; colisión → `gameOver = true` | 3.4 |

Cada test usa `fc.assert(fc.property(...), { numRuns: 1000 })`.

### Manuales en navegador
60 fps, sensación de velocidad, límites laterales, reinicio sin recarga.

## Comandos

```bash
npm install                 # instalar dependencias
npm run dev                 # servidor de desarrollo con HMR
npm run build               # build de producción
npm run preview             # previsualizar el build
npm test                    # ejecutar Vitest una vez (unitarias + PBT)
npm run test:watch          # Vitest en modo watch
```

## Restricciones técnicas

- **Todo el estado vive en memoria**. No usar `localStorage`, `sessionStorage`, `IndexedDB` ni peticiones a backends.
- **Un único canvas WebGL** en la página; el render corre en `requestAnimationFrame`.
- **Framerate objetivo: 60 fps**. El pool de segmentos y obstáculos es fijo y se recicla; no se instancian objetos en el bucle caliente.
- **Movimiento independiente del framerate**: todo desplazamiento se multiplica por `delta`, recortado a `Math.min(delta, 0.05)`.
- **Sin `eval`, `new Function` ni `v-html`** en la UI.
- **Lógica pura separada de Three.js**: `src/game/logic.js` y `src/game/constants.js` no pueden importar `three` ni `vue`. Esto es un requisito de arquitectura para que los PBT corran sin canvas.
- **Compatibilidad**: navegadores de escritorio con WebGL2 (Chrome, Edge, Firefox, Safari recientes).
- **Assets**: los `.glb` se cargan desde CDN público vía HTTPS con fallback geométrico obligatorio.

## Seguridad

- Sin backend, sin autenticación, sin datos de usuario.
- Assets externos por HTTPS desde CDN conocidos.
- Sin secretos en el código ni en configuración.
- Input externo limitado a eventos de teclado comparados contra una lista cerrada de `key`/`code`.

## Integraciones

- **CDN de modelos GLB**: assets low-poly para vehículo y obstáculos. Fallback geométrico obligatorio.
- La arquitectura completa (capas, flujos, modelo de datos, propiedades de correctitud, decisiones y alternativas) está documentada en `#[[file:.kiro/specs/simulador-tunel-infinito/design.md]]`; no la dupliques aquí.
