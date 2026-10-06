/**
 * recycling.property.test.js
 *
 * Property 3 — Invariante de reciclaje de segmentos del túnel.
 *
 * Valida: Requisitos 2.1 (generación continua), 2.2 (pool constante en memoria),
 * 2.3 (reutilización de geometría/material sin crear nuevas instancias).
 * Ref: design.md § Propiedades de Correctitud → Property 3
 *
 * El pool se simula como un array de POJOs { z: number, id: number }.
 * Propiedades centrales:
 *   - pool.length === POOL_SIZE en todo momento
 *   - Los ids de los objetos nunca cambian (misma referencia reutilizada)
 *   - Tras reciclar, z = posicionFrente + separacion
 *
 * Nota sobre fc.float en fast-check v3:
 *   Los límites deben ser floats de 32 bits. Se usa Math.fround().
 */

import { describe, it } from 'vitest'
import * as fc from 'fast-check'
import { reciclarSegmento } from '../src/game/logic.js'
import { POOL_SIZE, SEGMENT_SPACING } from '../src/game/constants.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Crea el pool inicial: POOL_SIZE segmentos distribuidos a lo largo del eje Z,
 * cada uno con un id único e inmutable para verificar la identidad de referencia.
 */
function crearPool() {
  return Array.from({ length: POOL_SIZE }, (_, i) => ({
    id: i,
    z: i * SEGMENT_SPACING,
  }))
}

/**
 * Simula un frame del bucle de reciclaje.
 * Recicla al frente los segmentos que quedan por detrás del umbral de la cámara.
 *
 * @param {Array<{id:number,z:number}>} pool
 * @param {number} camZ    - Posición actual de la cámara.
 * @param {number} avance  - Desplazamiento longitudinal del frame.
 * @returns {{ camZ: number }}
 */
function simularFrame(pool, camZ, avance) {
  const UMBRAL_RECICLAJE = SEGMENT_SPACING * 2

  for (const seg of pool) {
    if (seg.z < camZ - UMBRAL_RECICLAJE) {
      const posFrente = Math.max(...pool.map((s) => s.z))
      reciclarSegmento(seg, posFrente, SEGMENT_SPACING)
    }
  }

  return { camZ: camZ + avance }
}

// ---------------------------------------------------------------------------
// Árbitros
// ---------------------------------------------------------------------------

/** Número de frames: 0–1000. */
const arbFrames = fc.integer({ min: 0, max: 1000 })

/** Avance por frame: positivo, acotado al rango realista (vel=60 × delta=0.05 → 3). */
const arbAvance = fc.float({ min: Math.fround(0), max: Math.fround(3), noNaN: true })

/** Par (n, secuencia de n avances) — correlacionados para que siempre haya exactamente n. */
const arbSecuencia = arbFrames.chain((n) =>
  fc.tuple(
    fc.constant(n),
    fc.array(arbAvance, { minLength: n, maxLength: n }),
  ),
)

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 3 — pool de segmentos es siempre POOL_SIZE', () => {
  it('pool.length === POOL_SIZE en todo momento, independientemente del número de frames', () => {
    fc.assert(
      fc.property(arbSecuencia, ([n, avances]) => {
        const pool = crearPool()
        let camZ = 0

        if (pool.length !== POOL_SIZE) return false

        for (let f = 0; f < n; f++) {
          const resultado = simularFrame(pool, camZ, avances[f])
          camZ = resultado.camZ
          if (pool.length !== POOL_SIZE) return false
        }
        return true
      }),
      { numRuns: 500, verbose: false },
    )
  })

  it('los ids de los objetos nunca cambian (sin new en el bucle caliente)', () => {
    fc.assert(
      fc.property(arbSecuencia, ([n, avances]) => {
        const pool = crearPool()
        const idsOriginales = new Set(pool.map((s) => s.id))
        let camZ = 0

        for (let f = 0; f < n; f++) {
          const resultado = simularFrame(pool, camZ, avances[f])
          camZ = resultado.camZ

          const idsActuales = new Set(pool.map((s) => s.id))
          if (idsActuales.size !== idsOriginales.size) return false
          for (const id of idsOriginales) {
            if (!idsActuales.has(id)) return false
          }
        }
        return true
      }),
      { numRuns: 500, verbose: false },
    )
  })

  it('reciclarSegmento no crea un objeto nuevo — la referencia es la misma', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
        fc.float({ min: Math.fround(0.1),  max: Math.fround(20),  noNaN: true }),
        (posicionFrente, separacion) => {
          const segmento = { id: 42, z: -999 }
          const referencia = segmento
          const resultado = reciclarSegmento(segmento, posicionFrente, separacion)
          return resultado === referencia
        },
      ),
      { numRuns: 1000, verbose: false },
    )
  })

  it('tras reciclar, z del segmento es posicionFrente + separacion', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(-1000), max: Math.fround(1000), noNaN: true }),
        fc.float({ min: Math.fround(0.1),   max: Math.fround(50),   noNaN: true }),
        (posicionFrente, separacion) => {
          const seg = { id: 0, z: -9999 }
          reciclarSegmento(seg, posicionFrente, separacion)
          return Math.abs(seg.z - (posicionFrente + separacion)) < 1e-9
        },
      ),
      { numRuns: 1000, verbose: false },
    )
  })
})
