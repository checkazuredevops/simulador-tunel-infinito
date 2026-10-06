/**
 * ObstacleManager.js — Pool de obstáculos con dificultad progresiva.
 *
 * Responsabilidades:
 *  - Mantener un pool fijo de OBSTACLE_POOL_SIZE meshes (reutilizados, nunca destruidos).
 *  - Activar/desactivar obstáculos según la distancia recorrida y la frecuencia actual.
 *  - Avanzar los obstáculos activos hacia la cámara y reciclarlos al frente cuando
 *    quedan atrás.
 *  - Detectar colisión AABB con el jugador mediante checkCollision() de logic.js.
 *  - Exponer obstaculoActivo (boolean) al estado reactivo.
 *
 * Requisitos cubiertos: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { checkCollision, makeBox } from './logic.js'
import { gameState } from './state.js'
import {
  OBSTACLE_POOL_SIZE,
  OBSTACLE_SPAWN_DISTANCE,
  TUNNEL_RADIUS,
  VELOCIDAD_INICIAL,
} from './constants.js'

// Dimensiones AABB de los obstáculos (mitad de tamaño en cada eje)
const OBS_HALF = { x: 0.45, y: 0.45, z: 0.45 }

// Separación mínima entre dos obstáculos consecutivos (unidades Z)
const MIN_SEPARATION = 18

// CDN público para el modelo del obstáculo
const OBSTACLE_GLB_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/BoxAnimated/glTF-Binary/BoxAnimated.glb'

export class ObstacleManager {
  /** @type {THREE.Mesh[]} pool completo */
  #pool = []

  /** Meshes actualmente visibles/activos en la escena */
  #active = new Set()

  /** Geometría compartida (fallback) */
  #geometry = null
  /** Material compartido (fallback) */
  #material = null

  /** Acumulador de tiempo para controlar la frecuencia de spawn */
  #spawnTimer = 0

  /** Intervalo entre spawns en segundos (decrece con la distancia) */
  #spawnInterval = 3.5

  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene
    this._build()
    this._loadGLB()
  }

  // -------------------------------------------------------------------------
  // Inicialización
  // -------------------------------------------------------------------------

  _build() {
    this.#geometry = new THREE.OctahedronGeometry(OBS_HALF.x * 1.4, 0)
    this.#material = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: new THREE.Color(0x660000),
      emissiveIntensity: 0.4,
      roughness: 0.4,
      metalness: 0.6,
    })

    for (let i = 0; i < OBSTACLE_POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(this.#geometry, this.#material)
      mesh.name = `obstacle-${i}`
      mesh.visible = false
      this.scene.add(mesh)
      this.#pool.push(mesh)
    }
    console.log('[ObstacleManager] Pool de fallback creado.')
  }

  _loadGLB() {
    const loader = new GLTFLoader()
    loader.loadAsync(OBSTACLE_GLB_URL)
      .then((gltf) => {
        // Sustituir la geometría de cada obstáculo por el modelo GLB
        const model = gltf.scene.children[0]
        if (!model) return

        for (const obs of this.#pool) {
          obs.geometry?.dispose()
          if (model.geometry) obs.geometry = model.geometry
          if (model.material) obs.material = model.material
          obs.scale.setScalar(0.5)
        }
        console.log('[ObstacleManager] Modelo GLB cargado.')
      })
      .catch((err) => {
        console.warn('[ObstacleManager] Usando fallback geométrico:', err.message)
      })
  }

  // -------------------------------------------------------------------------
  // Bucle de juego
  // -------------------------------------------------------------------------

  /**
   * @param {number} delta       — tiempo en segundos
   * @param {number} velocidad   — velocidad de avance actual
   * @param {number} camZ        — posición Z de la cámara
   * @param {number} distancia   — distancia total recorrida (para dificultad)
   * @param {{ minX,maxX,minY,maxY,minZ,maxZ }} playerAABB
   * @returns {boolean} true si se detectó colisión
   */
  update(delta, velocidad, camZ, distancia, playerAABB) {
    this._ajustarDificultad(distancia)
    this._spawnSiCorresponde(delta, camZ)
    this._moverActivos(delta, velocidad, camZ)

    const colision = this._detectarColision(playerAABB)
    gameState.obstaculoActivo = this.#active.size > 0
    return colision
  }

  // -------------------------------------------------------------------------
  // Dificultad progresiva
  // -------------------------------------------------------------------------

  _ajustarDificultad(distancia) {
    // Cada 200 unidades de distancia, el intervalo de spawn se reduce un 8 %
    // hasta un mínimo de 0.7 s
    const reducciones = Math.floor(distancia / 200)
    this.#spawnInterval = Math.max(0.7, 3.5 * Math.pow(0.92, reducciones))
  }

  // -------------------------------------------------------------------------
  // Spawn
  // -------------------------------------------------------------------------

  _spawnSiCorresponde(delta, camZ) {
    this.#spawnTimer += delta
    if (this.#spawnTimer < this.#spawnInterval) return
    this.#spawnTimer = 0

    const libre = this.#pool.find((m) => !this.#active.has(m))
    if (!libre) return  // todos ocupados; esperar al reciclaje

    // Posición aleatoria dentro del radio del túnel
    const angle  = Math.random() * Math.PI * 2
    const radius = Math.random() * (TUNNEL_RADIUS - OBS_HALF.x * 2 - 0.3)
    libre.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      camZ + OBSTACLE_SPAWN_DISTANCE + (Math.random() * 20),
    )
    libre.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      0,
    )
    libre.visible = true
    this.#active.add(libre)
  }

  // -------------------------------------------------------------------------
  // Movimiento y reciclaje
  // -------------------------------------------------------------------------

  _moverActivos(delta, velocidad, camZ) {
    const avance = velocidad * delta
    for (const obs of this.#active) {
      obs.position.z -= avance
      obs.rotation.y += delta * 1.2  // rotación visual

      // Reciclar si quedó atrás de la cámara
      if (obs.position.z < camZ - 10) {
        obs.visible = false
        this.#active.delete(obs)
      }
    }
  }

  // -------------------------------------------------------------------------
  // Colisión AABB
  // -------------------------------------------------------------------------

  _detectarColision(playerAABB) {
    for (const obs of this.#active) {
      const obsAABB = makeBox(
        { x: obs.position.x, y: obs.position.y, z: obs.position.z },
        OBS_HALF,
      )
      if (checkCollision(playerAABB, obsAABB)) {
        console.log('[ObstacleManager] Colisión detectada. Puntuación:', gameState.puntuacion)
        return true
      }
    }
    return false
  }

  // -------------------------------------------------------------------------
  // Reinicio
  // -------------------------------------------------------------------------

  reset() {
    for (const obs of this.#pool) {
      obs.visible = false
    }
    this.#active.clear()
    this.#spawnTimer = 0
    this.#spawnInterval = 3.5
    gameState.obstaculoActivo = false
  }
}
