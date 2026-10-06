/**
 * collision.property.test.js
 *
 * Property 4 — Detección de colisión por bounding box (AABB).
 *
 * Valida: Requisito 3.4 (si la bounding box del vehículo intersecta la del
 * obstáculo, el sistema finaliza la partida y muestra la pantalla de game over).
 * Ref: design.md § Propiedades de Correctitud → Property 4
 *
 * Invariantes:
 *   - checkCollision(A, B) === true  ↔  solapamiento en X ∧ Y ∧ Z  (oráculo)
 *   - Si checkCollision devuelve true, gameOver se marca como true
 *   - Simetría: checkCollision(A, B) === checkCollision(B, A)
 *   - Una caja siempre colisiona consigo misma
 *
 * Nota sobre fc.float en fast-check v3:
 *   Los límites deben ser floats de 32 bits. Se usa Math.fround().
 */

import { describe, it } from 'vitest'
import * as fc from 'fast-check'
import { checkCollision, makeBox } from '../src/game/logic.js'

// ---------------------------------------------------------------------------
// Árbitros
// ---------------------------------------------------------------------------

/** Centro de una caja: coordenadas reales acotadas. */
const arbCentro = fc.record({
  x: fc.float({ min: Math.fround(-50),  max: Math.fround(50),  noNaN: true }),
  y: fc.float({ min: Math.fround(-50),  max: Math.fround(50),  noNaN: true }),
  z: fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
})

/** Mitad del tamaño (halfSize): siempre positivo. */
const arbHalfSize = fc.record({
  x: fc.float({ min: Math.fround(0.01), max: Math.fround(2), noNaN: true }),
  y: fc.float({ min: Math.fround(0.01), max: Math.fround(2), noNaN: true }),
  z: fc.float({ min: Math.fround(0.01), max: Math.fround(2), noNaN: true }),
})

/** Par de cajas arbitrarias. */
const arbParCajas = fc.tuple(
  fc.tuple(arbCentro, arbHalfSize),
  fc.tuple(arbCentro, arbHalfSize),
)

// ---------------------------------------------------------------------------
// Oráculo independiente: solapamiento eje por eje
// ---------------------------------------------------------------------------

function solapaEje(aMin, aMax, bMin, bMax) {
  return aMax >= bMin && aMin <= bMax
}

/**
 * Calcula la colisión eje por eje sin usar checkCollision.
 * La coincidencia con checkCollision en todos los casos demuestra su corrección.
 */
function oraculo(a, b) {
  return (
    solapaEje(a.minX, a.maxX, b.minX, b.maxX) &&
    solapaEje(a.minY, a.maxY, b.minY, b.maxY) &&
    solapaEje(a.minZ, a.maxZ, b.minZ, b.maxZ)
  )
}

// ---------------------------------------------------------------------------
// Simulación del efecto de juego
// ---------------------------------------------------------------------------

function simularCicloColision(boxVehiculo, boxObstaculo) {
  const state = { gameOver: false }
  if (checkCollision(boxVehiculo, boxObstaculo)) {
    state.gameOver = true
  }
  return state
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 4 — detección de colisión AABB', () => {
  it('checkCollision coincide con el oráculo eje-por-eje para cualquier par de cajas', () => {
    fc.assert(
      fc.property(arbParCajas, ([[centroA, halfA], [centroB, halfB]]) => {
        const a = makeBox(centroA, halfA)
        const b = makeBox(centroB, halfB)
        return checkCollision(a, b) === oraculo(a, b)
      }),
      { numRuns: 1000, verbose: false },
    )
  })

  it('checkCollision es simétrico: checkCollision(A,B) === checkCollision(B,A)', () => {
    fc.assert(
      fc.property(arbParCajas, ([[centroA, halfA], [centroB, halfB]]) => {
        const a = makeBox(centroA, halfA)
        const b = makeBox(centroB, halfB)
        return checkCollision(a, b) === checkCollision(b, a)
      }),
      { numRuns: 1000, verbose: false },
    )
  })

  it('una caja siempre colisiona consigo misma', () => {
    fc.assert(
      fc.property(arbCentro, arbHalfSize, (centro, half) => {
        const box = makeBox(centro, half)
        return checkCollision(box, box) === true
      }),
      { numRuns: 1000, verbose: false },
    )
  })

  it('cajas separadas en X no colisionan', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(2),  noNaN: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(50), noNaN: true }),
        (halfX, extra) => {
          const separacion = 2 * halfX + extra   // garantiza hueco en X
          const a = makeBox({ x: 0, y: 0, z: 0 }, { x: halfX, y: 1, z: 1 })
          const b = makeBox({ x: separacion, y: 0, z: 0 }, { x: halfX, y: 1, z: 1 })
          return checkCollision(a, b) === false
        },
      ),
      { numRuns: 1000, verbose: false },
    )
  })

  it('cajas separadas en Z no colisionan', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(2),  noNaN: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(50), noNaN: true }),
        (halfZ, extra) => {
          const separacion = 2 * halfZ + extra   // garantiza hueco en Z
          const a = makeBox({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: halfZ })
          const b = makeBox({ x: 0, y: 0, z: separacion }, { x: 1, y: 1, z: halfZ })
          return checkCollision(a, b) === false
        },
      ),
      { numRuns: 1000, verbose: false },
    )
  })

  it('si hay colisión, el ciclo de juego marca gameOver = true', () => {
    // Misma posición y tamaño → colisión garantizada
    fc.assert(
      fc.property(arbCentro, arbHalfSize, (centro, half) => {
        const vehiculo  = makeBox(centro, half)
        const obstaculo = makeBox(centro, half)
        const { gameOver } = simularCicloColision(vehiculo, obstaculo)
        return gameOver === true
      }),
      { numRuns: 1000, verbose: false },
    )
  })

  it('si no hay colisión, el ciclo de juego NO marca gameOver', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(2),  noNaN: true }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(50), noNaN: true }),
        (halfX, extra) => {
          const separacion = 2 * halfX + extra
          const vehiculo  = makeBox({ x: 0, y: 0, z: 0 }, { x: halfX, y: 1, z: 1 })
          const obstaculo = makeBox({ x: separacion, y: 0, z: 0 }, { x: halfX, y: 1, z: 1 })
          const { gameOver } = simularCicloColision(vehiculo, obstaculo)
          return gameOver === false
        },
      ),
      { numRuns: 1000, verbose: false },
    )
  })
})
