# Plan de Implementación

- [ ] 1. Bootstrap del proyecto SPA
  - Crear `index.html` con `#app` para Vue y un `<canvas>` para Three.js
  - Configurar `vite.config.js` y `package.json` con `three`, `vue` y `vite`
  - Punto de entrada `src/main.js` que monta Vue y arranca la clase `Game`
  - _Requirements: 1.1, 2.1, 4.2_
  - _Kiro features: Specs_
  - _Evidence: `npm run dev` sirve la página sin errores en consola_

- [ ] 2. Escena base de Three.js
  - Crear escena, cámara perspectiva detrás del vehículo, `WebGLRenderer` a tamaño completo
  - Añadir niebla (`FogExp2`) y una luz ambiental + direccional
  - Bucle `requestAnimationFrame` con `delta` recortado a 0.05 y pausa por `visibilitychange`
  - _Requirements: 2.4_
  - _Kiro features: Specs_
  - _Evidence: canvas renderiza escena vacía a 60 fps sin warnings_

- [ ] 3. Vehículo low-poly y control lateral
  - Cargar el GLB del vehículo con `GLTFLoader` desde CDN; fallback a `BoxGeometry` si falla
  - Escuchar `keydown`/`keyup` para flechas izquierda/derecha (y `A`/`D`)
  - Actualizar `posicionLateral` por delta y aplicar clamp a `[-LIMITE, +LIMITE]`
  - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - _Depends on: 2_
  - _Kiro features: Specs_
  - _Evidence: el vehículo se mueve lateralmente y no atraviesa las paredes del túnel_

- [ ] 4. Túnel procedural con reciclaje
  - Crear `TunnelManager` con un pool fijo de segmentos (anillos o cilindros)
  - Avanzar `segmentoActual` por delta y reciclar al frente los segmentos que pasan detrás de la cámara
  - Reutilizar geometría y material al reciclar (sin `new` en el bucle caliente)
  - _Requirements: 2.1, 2.2, 2.3_
  - _Depends on: 2_
  - _Kiro features: Specs_
  - _Evidence: el túnel parece infinito y el número de segmentos en escena es constante_

- [ ] 5. Obstáculos y detección de colisión
  - Crear `ObstacleManager` con pool fijo de obstáculos low-poly (GLB con fallback geométrico)
  - Generar obstáculos por delante del vehículo en posiciones aleatorias dentro del radio del túnel
  - Escalar la frecuencia de aparición con la distancia recorrida
  - Detección AABB con `Box3.intersectsBox`; al colisionar, marcar `obstaculoActivo` y disparar game over
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - _Depends on: 3, 4_
  - _Kiro features: Specs_
  - _Evidence: los obstáculos aparecen, se reciclan y el impacto dispara game over_

- [ ] 6. Puntuación, HUD y pantalla de game over con reinicio
  - Incrementar `puntuacion` en cada frame según delta y velocidad actual
  - Componente `HUD.vue` que muestra `puntuacion` de forma reactiva
  - Componente `GameOver.vue` con puntuación final y botón de reinicio
  - Al reiniciar, resetear `puntuacion`, `posicionLateral`, `segmentoActual` y `obstaculoActivo` sin recargar la página
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - _Depends on: 5_
  - _Kiro features: Specs_
  - _Evidence: la puntuación sube en vivo, el game over muestra el total y el reinicio deja el juego jugable_

- [ ] 7. Pulido visual: niebla y partículas de velocidad
  - Ajustar `FogExp2` para reforzar la profundidad
  - Añadir un `Points` con partículas que se reciclan hacia la cámara para reforzar la sensación de velocidad
  - _Requirements: 2.4_
  - _Depends on: 4_
  - _Kiro features: Specs_
  - _Evidence: la escena se ve con profundidad y partículas de velocidad sin bajar de 60 fps_

- [ ] 8. Pruebas unitarias del núcleo
  - Configurar Vitest + jsdom en `vite.config.js`
  - Extraer lógica pura en `src/game/logic.js`: `clampLateral`, `acumularPuntuacion`, `checkCollision`, `reciclarSegmento`
  - Probar `clampLateral`, `acumularPuntuacion`, reciclaje de segmentos y colisión AABB en `tests/tunnel.test.js`, `tests/player.test.js` y `tests/ui.test.js`
  - _Requirements: 1.2, 2.2, 3.4, 4.1_
  - _Depends on: 6_
  - _Kiro features: Specs_
  - _Evidence: `npm test` pasa en verde_

- [ ] 9. Property-based testing con fast-check
  - Instalar `fast-check` como `devDependency`
  - Implementar los cuatro archivos de PBT trazados a `## Propiedades de Correctitud` en `design.md`:
    - `tests/position.property.test.js` → Property 1: clamp `posicionLateral` en `[-LIMITE, +LIMITE]` para cualquier `p0` y secuencia de pasos (valida Req. 1.2, 1.4)
    - `tests/scoring.property.test.js` → Property 2: monotonía de `puntuacion` para cualquier `s0 ≥ 0` y secuencia de deltas positivos (valida Req. 4.1)
    - `tests/recycling.property.test.js` → Property 3: `pool.length === POOL_SIZE` tras cualquier número de frames con avances positivos; sin `new` en el bucle (valida Req. 2.1, 2.2, 2.3)
    - `tests/collision.property.test.js` → Property 4: `checkCollision(A,B)` ↔ solapamiento en los tres ejes; colisión verdadera implica `gameOver = true` (valida Req. 3.4)
  - Cada test usa `fc.assert(fc.property(...))` con al menos 1000 ejecuciones
  - La lógica bajo prueba se importa desde `src/game/logic.js` y `src/game/constants.js` — sin montar Three.js ni canvas en los tests
  - _Requirements: 1.2, 1.4, 2.1, 2.2, 2.3, 3.4, 4.1_
  - _Depends on: 8_
  - _Kiro features: Specs_
  - _Evidence: `npm test` ejecuta los cuatro archivos `.property.test.js` y todos pasan en verde; `fast-check` reporta el número de casos generados sin shrink errors_
