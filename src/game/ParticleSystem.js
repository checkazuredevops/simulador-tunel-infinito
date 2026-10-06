/**
 * ParticleSystem.js — Partículas de velocidad (túnel de estrellas).
 *
 * Crea un único objeto THREE.Points con un buffer de posiciones fijo.
 * Las partículas se reciclan hacia delante de la cámara cuando quedan atrás,
 * reforzando la sensación de velocidad sin generar GC.
 *
 * Requisito cubierto: 2.4 (profundidad y sensación de velocidad).
 */

import * as THREE from 'three'
import { TUNNEL_RADIUS } from './constants.js'

const PARTICLE_COUNT = 600
const SPREAD         = TUNNEL_RADIUS * 0.85   // radio máximo de dispersión
const DEPTH_RANGE    = 180                     // extensión del campo Z de partículas
const RECYCLE_Z_BACK = -15                     // relativo a camZ: cuándo reciclar

export class ParticleSystem {
  #points   = null
  #positions = null  // Float32Array de posiciones (x, y, z interleaved)

  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene
    this._build()
  }

  // -------------------------------------------------------------------------
  // Construcción
  // -------------------------------------------------------------------------

  _build() {
    const geometry  = new THREE.BufferGeometry()
    this.#positions = new Float32Array(PARTICLE_COUNT * 3)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this._randomize(i, 0)
    }

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.#positions, 3),
    )

    const material = new THREE.PointsMaterial({
      color: 0xaaddff,
      size: 0.06,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    })

    this.#points = new THREE.Points(geometry, material)
    this.#points.name = 'particles'
    this.scene.add(this.#points)
  }

  /**
   * Coloca la partícula i en una posición aleatoria dentro del túnel.
   * @param {number} i     — índice en el pool
   * @param {number} baseZ — posición Z base (cámara actual)
   */
  _randomize(i, baseZ) {
    const angle  = Math.random() * Math.PI * 2
    const radius = Math.random() * SPREAD
    const idx    = i * 3
    this.#positions[idx]     = Math.cos(angle) * radius
    this.#positions[idx + 1] = Math.sin(angle) * radius
    this.#positions[idx + 2] = baseZ + Math.random() * DEPTH_RANGE
  }

  // -------------------------------------------------------------------------
  // Bucle de juego
  // -------------------------------------------------------------------------

  /**
   * @param {number} delta     — tiempo en segundos
   * @param {number} velocidad — velocidad de avance actual
   * @param {number} camZ      — posición Z de la cámara
   */
  update(delta, velocidad, camZ) {
    const avance = velocidad * delta

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3
      this.#positions[idx + 2] -= avance

      // Reciclar al frente cuando la partícula queda detrás de la cámara
      if (this.#positions[idx + 2] < camZ + RECYCLE_Z_BACK) {
        this._randomize(i, camZ + DEPTH_RANGE * 0.5)
      }
    }

    // Marcar el buffer como dirty para que Three.js lo reenvíe a la GPU
    this.#points.geometry.attributes.position.needsUpdate = true
  }

  // -------------------------------------------------------------------------
  // Reinicio
  // -------------------------------------------------------------------------

  reset() {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this._randomize(i, 0)
    }
    this.#points.geometry.attributes.position.needsUpdate = true
  }
}
