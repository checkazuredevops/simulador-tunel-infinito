/**
 * logic.js — Lógica pura del núcleo del juego.
 *
 * RESTRICCIÓN ARQUITECTÓNICA: este módulo NO importa three ni vue.
 * Toda función aquí es pura (sin efectos secundarios sobre el DOM ni la escena)
 * y puede ejecutarse directamente en Node/Vitest sin canvas ni mocks.
 *
 * Es el único módulo que los tests PBT con fast-check importan para verificar
 * las cuatro propiedades de correctitud definidas en design.md.
 */

import { LIMITE, VELOCIDAD_LATERAL, PUNTUACION_FACTOR, SEGMENT_SPACING } from './constants.js'

// ---------------------------------------------------------------------------
// Property 1 — Control lateral
// ---------------------------------------------------------------------------

/**
 * Aplica un paso de movimiento lateral al vehículo y recorta al intervalo
 * [-limite, +limite]. Implementa Req. 1.1, 1.2, 1.4.
 *
 * @param {number} posActual   - Posición lateral actual (cualquier número finito).
 * @param {number} dir         - Dirección: -1 (izquierda), 0 (quieto) o +1 (derecha).
 * @param {number} delta       - Tiempo transcurrido en segundos (ya recortado a DELTA_MAX).
 * @param {number} [limite]    - Límite lateral (por defecto LIMITE de constants.js).
 * @param {number} [velocidad] - Velocidad lateral (por defecto VELOCIDAD_LATERAL).
 * @returns {number} Nueva posición lateral dentro de [-limite, +limite].
 */
export function clampLateral(
  posActual,
  dir,
  delta,
  limite = LIMITE,
  velocidad = VELOCIDAD_LATERAL,
) {
  const nueva = posActual + dir * velocidad * delta
  return Math.max(-limite, Math.min(limite, nueva))
}

// ---------------------------------------------------------------------------
// Property 2 — Puntuación
// ---------------------------------------------------------------------------

/**
 * Incrementa la puntuación de forma proporcional a la distancia recorrida en el frame.
 * Implementa Req. 4.1.
 *
 * @param {number} puntuacionActual - Puntuación acumulada actual (≥ 0).
 * @param {number} delta            - Tiempo en segundos del frame actual.
 * @param {number} velocidad        - Velocidad de avance actual (unidades/segundo).
 * @returns {number} Nueva puntuación (≥ puntuacionActual).
 */
export function acumularPuntuacion(puntuacionActual, delta, velocidad) {
  // distancia = velocidad * delta; puntuacion crece con el factor configurado
  return puntuacionActual + velocidad * delta * PUNTUACION_FACTOR
}

// ---------------------------------------------------------------------------
// Property 3 — Reciclaje de segmentos del túnel
// ---------------------------------------------------------------------------

/**
 * Reposiciona un segmento del túnel al frente del pool.
 * No crea un nuevo objeto — muta la propiedad `z` de la referencia recibida.
 * Implementa Req. 2.2, 2.3.
 *
 * El objeto `segmento` es intencionalmente un POJO `{ z: number }` para que
 * este módulo no dependa de Three.js. El TunnelManager real envuelve esta
 * lógica sobre objetos `THREE.Mesh`, pero los PBT la verifican sobre POJOs.
 *
 * @param {{ z: number }} segmento       - Referencia al objeto del pool (se muta).
 * @param {number}        posicionFrente - Posición Z más avanzada del pool actualmente.
 * @param {number}        [separacion]   - Distancia entre segmentos (por defecto SEGMENT_SPACING).
 * @returns {{ z: number }} La misma referencia mutada (para facilitar las aserciones).
 */
export function reciclarSegmento(segmento, posicionFrente, separacion = SEGMENT_SPACING) {
  segmento.z = posicionFrente + separacion
  return segmento
}

// ---------------------------------------------------------------------------
// Property 4 — Detección de colisión AABB
// ---------------------------------------------------------------------------

/**
 * Comprueba si dos cajas alineadas a los ejes (AABB) se solapan.
 * Implementa la misma lógica que `Box3.intersectsBox` de Three.js.
 * Implementa Req. 3.4.
 *
 * Cada caja se describe como un objeto con `min` y `max` por eje:
 *   { minX, maxX, minY, maxY, minZ, maxZ }
 *
 * Usar objetos planos (no `THREE.Box3`) garantiza que esta función es testeable
 * sin montar Three.js. El ObstacleManager real construye estas cajas a partir
 * de `THREE.Box3` y las pasa a esta función.
 *
 * @param {{ minX: number, maxX: number, minY: number, maxY: number, minZ: number, maxZ: number }} a
 * @param {{ minX: number, maxX: number, minY: number, maxY: number, minZ: number, maxZ: number }} b
 * @returns {boolean} true si las dos cajas se solapan en los tres ejes.
 */
export function checkCollision(a, b) {
  return (
    a.maxX >= b.minX && a.minX <= b.maxX &&
    a.maxY >= b.minY && a.minY <= b.maxY &&
    a.maxZ >= b.minZ && a.minZ <= b.maxZ
  )
}

/**
 * Construye una AABB plana a partir de un centro y la mitad del tamaño en cada eje.
 * Función de apoyo para los tests y para ObstacleManager.
 *
 * @param {{ x: number, y: number, z: number }} centro
 * @param {{ x: number, y: number, z: number }} halfSize - Dimensiones positivas (> 0).
 * @returns {{ minX: number, maxX: number, minY: number, maxY: number, minZ: number, maxZ: number }}
 */
export function makeBox(centro, halfSize) {
  return {
    minX: centro.x - halfSize.x,
    maxX: centro.x + halfSize.x,
    minY: centro.y - halfSize.y,
    maxY: centro.y + halfSize.y,
    minZ: centro.z - halfSize.z,
    maxZ: centro.z + halfSize.z,
  }
}
