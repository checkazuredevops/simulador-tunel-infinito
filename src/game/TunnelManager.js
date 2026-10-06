/**
 * TunnelManager.js — Túnel procedural con reciclaje de pool fijo.
 *
 * Crea POOL_SIZE segmentos (cilindros abiertos) al inicializar y los recicla
 * al frente cuando quedan detrás de la cámara. Nunca se hace `new` de geometría
 * ni de material en el bucle caliente — ambos se crean una sola vez y se
 * comparten entre todos los segmentos (instanced-like approach con Mesh).
 *
 * Requisitos cubiertos: 2.1, 2.2, 2.3, 2.4
 */

import * as THREE from 'three'
import {
  POOL_SIZE,
  SEGMENT_LENGTH,
  SEGMENT_SPACING,
  TUNNEL_RADIUS,
} from './constants.js'

// El eje del túnel corre en +Z. La cámara mira hacia +Z.
// Los segmentos se crean con z = i * SEGMENT_SPACING, comenzando en z=0.

const RECYCLE_THRESHOLD = -SEGMENT_SPACING * 1.5  // cuando z < camZ + threshold, reciclar

export class TunnelManager {
  /** @type {THREE.Mesh[]} */
  #pool = []

  /** Geometría compartida por todos los segmentos (creada una sola vez) */
  #geometry = null

  /** Material compartido (creado una sola vez) */
  #material = null

  /** Índice interno del segmento más adelantado (para saber dónde reciclar) */
  #segmentoActual = 0

  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene
    this._build()
  }

  // -------------------------------------------------------------------------
  // Inicialización
  // -------------------------------------------------------------------------

  _build() {
    // Geometría: cilindro abierto (open-ended) que forma el tubo del túnel
    this.#geometry = new THREE.CylinderGeometry(
      TUNNEL_RADIUS,      // radiusTop
      TUNNEL_RADIUS,      // radiusBottom
      SEGMENT_LENGTH,     // height
      24,                 // radialSegments
      1,                  // heightSegments
      true,               // openEnded — sin tapas
    )
    // Rotar la geometría 90° en X para que el eje del cilindro quede en Z
    this.#geometry.rotateX(Math.PI / 2)

    this.#material = new THREE.MeshStandardMaterial({
      color: 0x0a1a2e,
      side: THREE.BackSide,      // renderizamos el interior del tubo
      roughness: 0.85,
      metalness: 0.15,
      emissive: new THREE.Color(0x001428),
      emissiveIntensity: 0.3,
    })

    // Crear el pool: POOL_SIZE mallas, cada una en su posición inicial
    for (let i = 0; i < POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(this.#geometry, this.#material)
      mesh.name = `tunnel-segment-${i}`
      mesh.position.z = i * SEGMENT_SPACING
      this.scene.add(mesh)
      this.#pool.push(mesh)
    }
  }

  // -------------------------------------------------------------------------
  // Bucle de juego
  // -------------------------------------------------------------------------

  /**
   * Avanza los segmentos hacia la cámara y recicla los que quedan atrás.
   * @param {number} delta      — tiempo en segundos
   * @param {number} velocidad  — velocidad de avance actual
   * @param {number} camZ       — posición Z de la cámara (usada para calcular cuándo reciclar)
   */
  update(delta, velocidad, camZ) {
    const avance = velocidad * delta

    for (const seg of this.#pool) {
      seg.position.z -= avance

      // Reciclar si el segmento queda suficientemente atrás de la cámara
      if (seg.position.z < camZ + RECYCLE_THRESHOLD) {
        // Posición del segmento más adelantado del pool
        const maxZ = this._maxZ()
        seg.position.z = maxZ + SEGMENT_SPACING
        this.#segmentoActual++
      }
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  _maxZ() {
    let max = -Infinity
    for (const seg of this.#pool) {
      if (seg.position.z > max) max = seg.position.z
    }
    return max
  }

  /** Número de segmentos en el pool (invariante = POOL_SIZE). */
  get poolSize() { return this.#pool.length }

  /** Índice acumulado de segmentos procesados (para trazabilidad). */
  get segmentoActual() { return this.#segmentoActual }

  // -------------------------------------------------------------------------
  // Reinicio
  // -------------------------------------------------------------------------

  reset() {
    this.#segmentoActual = 0
    for (let i = 0; i < this.#pool.length; i++) {
      this.#pool[i].position.z = i * SEGMENT_SPACING
    }
  }
}
