---
name: threejs-endless-runner
description: Genera y mantiene juegos endless runner con Three.js: túnel procedural con reciclaje de segmentos, bucle de juego a 60 fps con delta acotado, movimiento lateral con clamp, detección de colisiones por bounding box y HUD reactivo con Vue. Úsalo cuando el usuario trabaje en el núcleo de un juego Three.js, hable de túnel infinito, segmentos procedurales, reciclaje de objetos o colisiones AABB.
---

# Three.js Endless Runner

## Propósito

Guiar la implementación y el mantenimiento del núcleo de un endless runner en Three.js, con foco en generación procedural eficiente (pool fijo + reciclaje), bucle de juego estable a 60 fps y detección de colisiones simple pero correcta.

## Condiciones de activación

Actívate cuando el usuario:
- Trabaje en `src/game/` de un proyecto endless runner con Three.js.
- Hable de túnel procedural, segmentos que se reciclan, pool fijo de objetos.
- Pida ayuda con colisiones por bounding box, movimiento lateral con límites o bucle de juego con delta.
- Mencione Three.js en el contexto de un juego de avance continuo.

## Casos en los que NO debe activarse

- Preguntas generales sobre Three.js no relacionadas con endless runners o juegos.
- Tareas de Vue puro (componentes, reactividad, estado) sin componente de juego 3D.
- Consultas sobre otros juegos 2D o sobre motores distintos a Three.js.

## Entradas

- Archivos del proyecto bajo `src/game/`: `Game.js`, `TunnelManager.js`, `ObstacleManager.js`, `Player.js`, `constants.js`.
- El spec del proyecto en `.kiro/specs/simulador-tunel-infinito/` (requisitos, diseño, tareas).
- El steering técnico en `.kiro/steering/tech.md`.

## Pasos de trabajo

1. **Verificar el estado actual**: leer los módulos implicados antes de proponer cambios. No asumir la implementación: leerla.
2. **Mantener el pool fijo**: los segmentos del túnel y los obstáculos deben reciclarse, nunca crearse ni destruirse en el bucle caliente. Reutilizar geometría y material existentes.
3. **Aplicar delta acotado**: todo desplazamiento se multiplica por `delta`, y `delta` se recorta con `Math.min(delta, 0.05)` para evitar teletransportes tras pestañas inactivas.
4. **Respetar el clamp lateral**: `posicionLateral` siempre dentro de `[-LIMITE, +LIMITE]`; si el valor propuesto lo supera, recortarlo.
5. **Usar AABB para colisiones**: `Box3.intersectsBox` entre la caja del vehículo y la del obstáculo. No usar esferas ni SAT en el MVP.
6. **Mantener el HUD reactivo**: la puntuación vive en un objeto `reactive` de Vue; el bucle de juego la incrementa y el HUD la muestra sin recargar la página.
7. **Aplicar fallback geométrico**: si la carga de un `.glb` desde CDN falla, usar `BoxGeometry` con `MeshStandardMaterial` para no bloquear el juego.
8. **Probar antes de cerrar**: ejecutar `npm test` para verificar que las propiedades y los tests unitarios siguen pasando.

## Salidas esperadas

- Código de juego en `src/game/` coherente con el spec y el steering técnico.
- Sin instanciaciones en el bucle caliente (pool fijo respetado).
- Sin valores de `posicionLateral` fuera de rango.
- Sin `delta` gigantes que rompan la física.

## Límites

- No añadir funcionalidades fuera del MVP definido en `requirements.md`.
- No introducir persistencia (`localStorage`, `sessionStorage`, IndexedDB).
- No añadir menús, niveles, selección de vehículo, sonido ni controles táctiles.
- No reemplazar Three.js ni Vue por otras librerías.

## Dependencias

- Three.js (`^0.169`) y GLTFLoader.
- Vue 3 (`^3.5`) para el HUD reactivo.
- Vitest + fast-check para pruebas y propiedades de correctitud.

## Recursos

- `resources/game-invariants.md` — referencia rápida de las 4 invariantes críticas del MVP (pool fijo, clamp lateral, delta recortado, AABB). Consúltalo cuando necesites recordar las reglas mientras trabajas en el núcleo del juego; no lo cargues si la tarea no toca esas invariantes.
