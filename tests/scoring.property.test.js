/**
 * scoring.property.test.js
 *
 * Property 2 — Monotonía de la puntuación.
 *
 * Valida: Requisito 4.1 (la puntuación crece de forma continua y proporcional
 * a la distancia recorrida).
 * Ref: design.md § Propiedades de Correctitud → Property 2
 *
 * Invariantes:
 *   - puntuacion_final ≥ s0  (no decrece nunca)
 *   - Si Σdeltas > 0, entonces puntuacion_final > s0  (crece estrictamente)
 *   - Si todos los deltas son 0, la puntuación no cambia
 *
 * Nota sobre fc.float en fast-check v3:
 *   Los límites deben ser floats de 32 bits. Se usa Math.fround().
 */

import { describe, it } from 'vitest'
import * as fc from 'fast-check'
import { acumularPuntuacion } from '../src/game/logic.js'
import { DELTA_MAX } from '../src/game/constants.js'

const F_DELTA_MAX = Math.fround(DELTA_MAX)

// ---------------------------------------------------------------------------
// Árbitros reutilizables
// ---------------------------------------------------------------------------

/** Puntuación inicial no negativa, hasta 1 millón (cubre partidas muy largas). */
const arbS0 = fc.float({ min: Math.fround(0), max: Math.fround(1e6), noNaN: true })

/** Delta de un frame: ∈ [0, DELTA_MAX]. */
const arbDelta = fc.float({ min: Math.fround(0), max: F_DELTA_MAX, noNaN: true })

/** Secuencia de 0 a 500 deltas. */
const arbDeltas = fc.array(arbDelta, { minLength: 0, maxLength: 500 })

/** Velocidad de avance positiva (varía con la dificultad). */
const arbVelocidad = fc.float({ min: Math.fround(1), max: Math.fround(100), noNaN: true })

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 2 — puntuación nunca decrece', () => {
  it('la puntuación final es siempre ≥ puntuación inicial', () => {
    fc.assert(
      fc.property(arbS0, arbDeltas, arbVelocidad, (s0, deltas, velocidad) => {
        let puntuacion = s0
        for (const delta of deltas) {
          puntuacion = acumularPuntuacion(puntuacion, delta, velocidad)
        }
        return puntuacion >= s0
      }),
      { numRuns: 1000, verbose: false },
    )
  })

  it('si al menos un delta es numéricamente significativo, la puntuación crece estrictamente', () => {
    // fast-check puede generar valores subnormales (ej. 1.4e-45) donde
    // s0 + delta*vel === s0 por redondeo de punto flotante. La propiedad
    // correcta es que el crecimiento sea observable cuando el incremento
    // supera el epsilon relativo de s0.
    //
    // Usamos un delta mínimo de 1e-7 para garantizar que la diferencia sea
    // representable en float64 para cualquier s0 ≤ 1e6.
    // (1e6 * 1e-7 * 1 = 0.1 >> Number.EPSILON * 1e6 ≈ 2.2e-10)
    const arbDeltaSignificativo = fc.float({
      min: Math.fround(1e-7),
      max: F_DELTA_MAX,
      noNaN: true,
    })

    fc.assert(
      fc.property(arbS0, arbDeltaSignificativo, arbVelocidad, (s0, delta, velocidad) => {
        const puntuacion = acumularPuntuacion(s0, delta, velocidad)
        return puntuacion > s0
      }),
      { numRuns: 1000, verbose: false },
    )
  })

  it('si todos los deltas son 0, la puntuación no cambia', () => {
    fc.assert(
      fc.property(
        arbS0,
        fc.integer({ min: 0, max: 200 }),
        arbVelocidad,
        (s0, n, velocidad) => {
          let puntuacion = s0
          for (let i = 0; i < n; i++) {
            puntuacion = acumularPuntuacion(puntuacion, 0, velocidad)
          }
          return puntuacion === s0
        },
      ),
      { numRuns: 1000, verbose: false },
    )
  })

  it('el incremento es proporcional a velocidad × delta (linealidad)', () => {
    fc.assert(
      fc.property(
        arbS0,
        fc.float({ min: Math.fround(0), max: F_DELTA_MAX, noNaN: true }),
        arbVelocidad,
        (s0, delta, velocidad) => {
          const resultado = acumularPuntuacion(s0, delta, velocidad)
          const esperado = s0 + velocidad * delta
          // Tolerancia para aritmética de punto flotante
          return Math.abs(resultado - esperado) < 1e-9
        },
      ),
      { numRuns: 1000, verbose: false },
    )
  })
})
