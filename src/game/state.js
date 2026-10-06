/**
 * state.js — Estado reactivo compartido entre la capa de juego y la UI Vue.
 *
 * Exporta un único objeto reactive que HUD.vue y GameOver.vue consumen directamente.
 * Los módulos de juego (Game, Player, ObstacleManager) escriben en él durante el bucle.
 *
 * Este módulo importa Vue (reactive) pero NO importa three.
 */

import { reactive } from 'vue'

/**
 * @typedef {Object} GameState
 * @property {number}  puntuacion      - Distancia acumulada, se muestra como entero.
 * @property {number}  posicionLateral - Desplazamiento lateral del vehículo en [-LIMITE, +LIMITE].
 * @property {boolean} gameOver        - true cuando la partida ha terminado por colisión.
 * @property {boolean} webglError      - true si el contexto WebGL no pudo iniciarse.
 */

/** @type {GameState} */
export const gameState = reactive({
  puntuacion: 0,
  posicionLateral: 0,
  gameOver: false,
  webglError: false,
})

/**
 * Reinicia todos los campos del estado a sus valores iniciales.
 * Llamado por Game al procesar el evento 'restart' emitido por GameOver.vue.
 */
export function resetGameState() {
  gameState.puntuacion = 0
  gameState.posicionLateral = 0
  gameState.gameOver = false
  gameState.webglError = false
}
