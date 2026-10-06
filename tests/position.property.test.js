/**
 * position.property.test.js
 *
 * Property 1 — Clamp de posicionLateral dentro de los límites del túnel.
 *
 * Valida: Requisito 1.2 (límites laterales) y 1.4 (movimiento proporcional al delta).
 * Ref: design.md § Propiedades de Correctitud → Property 1
 *
 * Invariante: para cualquier posición inicial p0 ∈ [0, LIMITE] y cualquier
 * secuencia finita de pares (delta, dir), la posición resultante siempre
 * pertenece al intervalo cerrado [-LIMITE, +LIMITE].
 *
 * Nota sobre fc.float en fast-check v3:
 *   Los límites de fc.float deben ser floats de 32 bits válidos.
 *   Se usa Math.fround() para convertir los literales JS (float64) a float32.
 */

import { describe, it } from 'vitest'
import * as fc from 'fast-check'
import { clampLateral } from '../src/game/logic.js'
import { LIMITE, DELTA_MAX } from '../src/game/constants.js'

// Convertir los límites a float32 para cumplir el contrato de fc.float v3
const F_LIMITE    = Math.fround(LIMITE)
const F_DELTA_MAX = Math.fround(DELTA_MAX)

// ---------------------------------------------------------------------------
// Árbitros reutilizables
// ---------------------------------------------------------------------------

/** Posición inicial en [0, LIMITE] — el vehículo siempre nace dentro del túnel. */
const arbP0 = fc.float({ min: Math.fround(0), max: F_LIMITE, noNaN: true })

/** Un paso de movimiento: tupla (delta ∈ [0, DELTA_MAX], dir ∈ {-1, +1}). */
const arbPaso = fc.tuple(
  fc.float({ min: Math.fround(0), max: F_DELTA_MAX, noNaN: true }),
  fc.constantFrom(-1, 1),
)

/** Secuencia arbitraria de 0 a 200 pasos. */
const arbPasos = fc.array(arbPaso, { minLength: 0, maxLength: 200 })

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 1 — posicionLateral siempre en [-LIMITE, +LIMITE]', () => {
  it('tras cualquier secuencia de pasos la posición queda dentro de los límites', () => {
    fc.assert(
      fc.property(arbP0, arbPasos, (p0, pasos) => {
        let pos = p0
        for (const [delta, dir] of pasos) {
          pos = clampLateral(pos, dir, delta)
          // Invariante central: siempre dentro del intervalo cerrado
          if (pos < -LIMITE - Number.EPSILON || pos > LIMITE + Number.EPSILON) {
            return false
          }
        }
        return true
      }),
      { numRuns: 1000, verbose: false },
    )
  })

  it('cuando p0 = LIMITE y dir = +1, la posición no supera LIMITE', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0), max: F_DELTA_MAX, noNaN: true }),
        (delta) => {
          const pos = clampLateral(LIMITE, +1, delta)
          return pos <= LIMITE
        },
      ),
      { numRuns: 1000, verbose: false },
    )
  })

  it('cuando p0 = -LIMITE y dir = -1, la posición no es menor que -LIMITE', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0), max: F_DELTA_MAX, noNaN: true }),
        (delta) => {
          const pos = clampLateral(-LIMITE, -1, delta)
          return pos >= -LIMITE
        },
      ),
      { numRuns: 1000, verbose: false },
    )
  })

  it('con dir = 0 (sin entrada) la posición no cambia', () => {
    // Los valores generados por fc.float son float32; los comparamos con la
    // lógica de clampLateral que opera en float64. Math.fround asegura que
    // el valor de entrada ya sea representable exactamente como float32,
    // de modo que la identidad pos_entrada === pos_salida se mantiene.
    fc.assert(
      fc.property(
        // Usamos un rango interior a [-LIMITE, +LIMITE] para evitar que los
        // extremos del float32 caigan fuera del LIMITE float64 por redondeo.
        fc.float({ min: Math.fround(-LIMITE + 0.1), max: Math.fround(LIMITE - 0.1), noNaN: true }),
        fc.float({ min: Math.fround(0), max: F_DELTA_MAX, noNaN: true }),
        (pos, delta) => {
          // clampLateral con dir=0 no aplica velocidad, debe devolver pos sin cambio
          return clampLateral(pos, 0, delta) === pos
        },
      ),
      { numRuns: 1000, verbose: false },
    )
  })
})
