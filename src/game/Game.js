/**
 * Game.js — Clase principal: escena, cámara tercera persona, luces, niebla, bucle RAF.
 *
 * Cámara en tercera persona: sigue al vehículo desde atrás y arriba con lerp suave,
 * mirando siempre hacia un punto por delante del vehículo en el túnel.
 */

import * as THREE from 'three'
import { gameState, resetGameState } from './state.js'
import { initInput, resetInput } from './input.js'
import { Player } from './Player.js'
import { TunnelManager } from './TunnelManager.js'
import { ObstacleManager } from './ObstacleManager.js'
import { ParticleSystem } from './ParticleSystem.js'
import { acumularPuntuacion } from './logic.js'
import {
  DELTA_MAX,
  VELOCIDAD_INICIAL,
  VELOCIDAD_INCREMENTO,
  VELOCIDAD_MAXIMA,
  CAM_OFFSET_Z,
  CAM_OFFSET_Y,
  CAM_LERP,
} from './constants.js'

export class Game {
  #canvas
  #renderer   = null
  #scene      = null
  #camera     = null
  #rafId      = null

  #tunnel     = null
  #obstacles  = null
  #player     = null
  #particles  = null

  #lastTime   = 0
  #velocidad  = VELOCIDAD_INICIAL
  #distancia  = 0
  #running    = false

  // Posición Z acumulada del "mundo" (los objetos se mueven, la cámara sigue al jugador)
  #worldZ     = 0

  constructor(canvas) {
    this.#canvas = canvas
  }

  start() {
    if (!this._initRenderer()) return
    this._initScene()
    initInput()
    this._initSubsystems()
    this._bindVisibility()
    this.#running = true
    this.#lastTime = performance.now()
    this.#rafId = requestAnimationFrame((t) => this._loop(t))
  }

  _initRenderer() {
    try {
      this.#renderer = new THREE.WebGLRenderer({
        canvas: this.#canvas,
        antialias: true,
        powerPreference: 'high-performance',
      })
      this.#renderer.setSize(window.innerWidth, window.innerHeight)
      this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      window.addEventListener('resize', () => this._onResize())
      return true
    } catch {
      console.error('[Game] WebGL no disponible.')
      gameState.webglError = true
      return false
    }
  }

  _onResize() {
    if (!this.#camera || !this.#renderer) return
    this.#camera.aspect = window.innerWidth / window.innerHeight
    this.#camera.updateProjectionMatrix()
    this.#renderer.setSize(window.innerWidth, window.innerHeight)
  }

  _initScene() {
    this.#scene = new THREE.Scene()
    this.#scene.background = new THREE.Color(0x000510)
    this.#scene.fog = new THREE.FogExp2(0x000510, 0.018)

    // Cámara — posición inicial detrás y arriba del origen (posición del jugador)
    this.#camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      300,
    )
    this.#camera.position.set(0, CAM_OFFSET_Y, CAM_OFFSET_Z)
    this.#camera.lookAt(0, 0, 20)

    const ambient = new THREE.AmbientLight(0x112244, 1.8)
    this.#scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(0x4488ff, 2.5)
    dirLight.position.set(0, 8, -10)
    this.#scene.add(dirLight)

    const accent = new THREE.PointLight(0x00d4ff, 1.2, 30)
    accent.position.set(0, 0, 5)
    this.#scene.add(accent)
  }

  _initSubsystems() {
    this.#tunnel    = new TunnelManager(this.#scene)
    this.#player    = new Player(this.#scene)
    this.#obstacles = new ObstacleManager(this.#scene)
    this.#particles = new ParticleSystem(this.#scene)
  }

  _bindVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.#running = false
      } else {
        this.#running = true
        this.#lastTime = performance.now()
        if (!this.#rafId) {
          this.#rafId = requestAnimationFrame((t) => this._loop(t))
        }
      }
    })
  }

  _loop(timestamp) {
    this.#rafId = requestAnimationFrame((t) => this._loop(t))
    if (!this.#running || gameState.gameOver) return

    const rawDelta = (timestamp - this.#lastTime) / 1000
    const delta    = Math.min(rawDelta, DELTA_MAX)
    this.#lastTime = timestamp

    // Velocidad progresiva muy gradual
    this.#distancia += this.#velocidad * delta
    this.#velocidad  = Math.min(
      VELOCIDAD_INICIAL + (this.#distancia / 100) * VELOCIDAD_INCREMENTO,
      VELOCIDAD_MAXIMA,
    )

    // Puntuación
    gameState.puntuacion = acumularPuntuacion(
      gameState.puntuacion,
      delta,
      this.#velocidad,
    )

    // Avance acumulado del mundo
    this.#worldZ += this.#velocidad * delta

    // Actualizar subsistemas
    this.#player.update(delta)
    this.#tunnel.update(delta, this.#velocidad, this.#worldZ)
    this.#particles.update(delta, this.#velocidad, this.#worldZ)

    // -----------------------------------------------------------------------
    // Cámara tercera persona
    // Objetivo: posicionarse detrás y arriba del vehículo, mirar hacia adelante.
    // -----------------------------------------------------------------------
    const playerX = this.#player.posicionLateral

    // Posición objetivo de la cámara (en espacio del mundo)
    const targetCamX = playerX * 0.6          // sigue lateralmente al jugador con amortiguación
    const targetCamY = CAM_OFFSET_Y
    const targetCamZ = this.#worldZ + CAM_OFFSET_Z   // detrás del frente del mundo

    // Lerp suave hacia la posición objetivo
    this.#camera.position.x += (targetCamX - this.#camera.position.x) * CAM_LERP
    this.#camera.position.y += (targetCamY - this.#camera.position.y) * CAM_LERP
    this.#camera.position.z += (this.#worldZ + CAM_OFFSET_Z - this.#camera.position.z) * CAM_LERP

    // La cámara siempre mira hacia el punto adelante del vehículo
    const lookTarget = new THREE.Vector3(
      playerX * 0.4,
      0,
      this.#worldZ + 15,   // punto 15 unidades por delante en el túnel
    )
    this.#camera.lookAt(lookTarget)

    // -----------------------------------------------------------------------
    // Detección de colisión
    // -----------------------------------------------------------------------
    const playerAABB = this.#player.getAABB()
    // Ajustar Z al espacio del mundo
    playerAABB.minZ += this.#worldZ
    playerAABB.maxZ += this.#worldZ

    const colision = this.#obstacles.update(
      delta,
      this.#velocidad,
      this.#worldZ,
      this.#distancia,
      playerAABB,
    )

    if (colision) {
      gameState.gameOver = true
      this.#running = false
    }

    this.#renderer.render(this.#scene, this.#camera)
  }

  restart() {
    this.#velocidad = VELOCIDAD_INICIAL
    this.#distancia = 0
    this.#worldZ    = 0
    this.#lastTime  = performance.now()

    resetGameState()
    resetInput()

    this.#player.reset()
    this.#tunnel.reset()
    this.#obstacles.reset()
    this.#particles.reset()

    this.#camera.position.set(0, CAM_OFFSET_Y, CAM_OFFSET_Z)
    this.#camera.lookAt(0, 0, 20)

    this.#running = true
  }
}
