/**
 * Player.js — Vehículo del jugador.
 *
 * Control:
 *  - Mouse (prioritario): la posición X normalizada del mouse mapea directamente
 *    a la posición lateral dentro de [-LIMITE, +LIMITE].
 *  - Teclado (fallback): si el mouse no ha sido usado, se usa dirección discreta.
 *
 * La posición final siempre se recorta con clampLateral().
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { clampLateral } from './logic.js'
import { getLateralDir, getMouseNormX } from './input.js'
import { gameState } from './state.js'
import {
  LIMITE,
  VELOCIDAD_LATERAL,
} from './constants.js'

const VEHICLE_GLB_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Fox/glTF-Binary/Fox.glb'

const VEHICLE_HALF = { x: 0.35, y: 0.25, z: 0.55 }

// Suavizado del movimiento con mouse (lerp por frame)
const MOUSE_LERP = 0.12

export class Player {
  mesh = null
  posicionLateral = 0
  #yPos = 0
  #zPos = 0

  constructor(scene) {
    this.scene = scene
    this._buildFallback()
    this._loadGLB()
  }

  _buildFallback() {
    const geo = new THREE.BoxGeometry(
      VEHICLE_HALF.x * 2,
      VEHICLE_HALF.y * 2,
      VEHICLE_HALF.z * 2,
    )
    const mat = new THREE.MeshStandardMaterial({ color: 0x00d4ff, metalness: 0.4, roughness: 0.5 })
    this.mesh = new THREE.Mesh(geo, mat)
    this.mesh.name = 'player'
    this._place()
    this.scene.add(this.mesh)
    console.log('[Player] Usando geometría de fallback.')
  }

  _loadGLB() {
    const loader = new GLTFLoader()
    loader.loadAsync(VEHICLE_GLB_URL)
      .then((gltf) => {
        const model = gltf.scene
        model.scale.setScalar(0.012)
        model.rotation.y = Math.PI
        this.scene.remove(this.mesh)
        this.mesh = model
        this.mesh.name = 'player'
        this._place()
        this.scene.add(this.mesh)
        console.log('[Player] Modelo GLB cargado.')
      })
      .catch((err) => {
        console.warn('[Player] No se pudo cargar el GLB, usando fallback:', err.message)
      })
  }

  _place() {
    this.mesh.position.set(this.posicionLateral, this.#yPos, this.#zPos)
  }

  /**
   * Actualiza la posición lateral del vehículo para este frame.
   * Prioridad: mouse > teclado.
   * @param {number} delta
   */
  update(delta) {
    const mouseNormX = getMouseNormX()

    if (mouseNormX !== null) {
      // Control por mouse: la posición objetivo es mouseNormX * LIMITE
      const target = mouseNormX * LIMITE
      // Lerp suave hacia el objetivo, luego clamp por seguridad
      this.posicionLateral += (target - this.posicionLateral) * MOUSE_LERP
      this.posicionLateral = Math.max(-LIMITE, Math.min(LIMITE, this.posicionLateral))
    } else {
      // Fallback teclado
      const dir = getLateralDir()
      this.posicionLateral = clampLateral(
        this.posicionLateral,
        dir,
        delta,
        LIMITE,
        VELOCIDAD_LATERAL,
      )
    }

    this.mesh.position.x = this.posicionLateral

    // Leve inclinación visual según la velocidad lateral (solo cosmético)
    const targetRoll = -(this.posicionLateral / LIMITE) * 0.18
    this.mesh.rotation.z += (targetRoll - this.mesh.rotation.z) * 0.1

    gameState.posicionLateral = this.posicionLateral
  }

  getAABB() {
    const cx = this.mesh.position.x
    const cy = this.mesh.position.y
    const cz = this.mesh.position.z
    return {
      minX: cx - VEHICLE_HALF.x, maxX: cx + VEHICLE_HALF.x,
      minY: cy - VEHICLE_HALF.y, maxY: cy + VEHICLE_HALF.y,
      minZ: cz - VEHICLE_HALF.z, maxZ: cz + VEHICLE_HALF.z,
    }
  }

  reset() {
    this.posicionLateral = 0
    if (this.mesh) {
      this.mesh.position.x = 0
      this.mesh.rotation.z = 0
    }
    gameState.posicionLateral = 0
  }
}
