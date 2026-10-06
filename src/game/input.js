/**
 * input.js — Gestión de entrada: teclado + mouse.
 *
 * Teclado: ArrowLeft/ArrowRight y A/D → dirección discreta (-1, 0, +1).
 * Mouse:   mousemove → posición X normalizada en [-1, +1].
 *
 * El Player decide qué fuente de input usar:
 *   - Si hay movimiento de mouse reciente → usa posición de mouse (control directo).
 *   - Si no → usa dirección de teclado (fallback).
 *
 * No importa three ni vue.
 */

// ---------------------------------------------------------------------------
// Teclado
// ---------------------------------------------------------------------------

const KEYS_LEFT  = new Set(['ArrowLeft',  'a', 'A'])
const KEYS_RIGHT = new Set(['ArrowRight', 'd', 'D'])

let _left  = false
let _right = false

function onKeyDown(e) {
  if (KEYS_LEFT.has(e.key))  { _left  = true; e.preventDefault() }
  if (KEYS_RIGHT.has(e.key)) { _right = true; e.preventDefault() }
}

function onKeyUp(e) {
  if (KEYS_LEFT.has(e.key))  _left  = false
  if (KEYS_RIGHT.has(e.key)) _right = false
}

// ---------------------------------------------------------------------------
// Mouse
// ---------------------------------------------------------------------------

/**
 * Posición X del mouse normalizada: -1 (borde izquierdo) → +1 (borde derecho).
 * null si el mouse nunca se ha movido en esta sesión.
 */
let _mouseNormX = null

function onMouseMove(e) {
  // Normalizar a [-1, +1] respecto al ancho de la ventana
  _mouseNormX = (e.clientX / window.innerWidth) * 2 - 1
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export function initInput() {
  window.addEventListener('keydown',    onKeyDown)
  window.addEventListener('keyup',      onKeyUp)
  window.addEventListener('mousemove',  onMouseMove)
}

export function destroyInput() {
  window.removeEventListener('keydown',   onKeyDown)
  window.removeEventListener('keyup',     onKeyUp)
  window.removeEventListener('mousemove', onMouseMove)
  _left = _right = false
  _mouseNormX = null
}

/**
 * Devuelve la dirección de teclado del frame actual.
 * @returns {-1 | 0 | 1}
 */
export function getLateralDir() {
  if (_left && !_right) return -1
  if (_right && !_left) return  1
  return 0
}

/**
 * Devuelve la posición X del mouse normalizada a [-1, +1], o null si nunca se movió.
 * @returns {number | null}
 */
export function getMouseNormX() {
  return _mouseNormX
}

export function resetInput() {
  _left = _right = false
  _mouseNormX = null
}
