/**
 * constants.js — Constantes globales del juego.
 *
 * Este módulo NO importa three ni vue.
 * Es importado por logic.js, TunnelManager, ObstacleManager, Player y los tests PBT.
 */

// --- Límites del túnel ---

/** Radio interior del túnel (unidades Three.js). Define el espacio de juego en X. */
export const TUNNEL_RADIUS = 4

/** Límite lateral máximo del vehículo: se puede mover en [-LIMITE, +LIMITE]. */
export const LIMITE = TUNNEL_RADIUS - 0.6  // 3.4 — deja margen respecto a la pared

/** Velocidad lateral del vehículo (unidades/segundo). Usado solo con teclado. */
export const VELOCIDAD_LATERAL = 6

// --- Túnel procedural ---

/** Número fijo de segmentos en el pool. Nunca se crea ni destruye ninguno. */
export const POOL_SIZE = 20

/** Longitud de cada segmento del túnel (unidades Three.js). */
export const SEGMENT_LENGTH = 10

/** Separación entre el inicio de un segmento y el siguiente. */
export const SEGMENT_SPACING = SEGMENT_LENGTH

// --- Obstáculos ---

/** Número fijo de obstáculos en el pool. */
export const OBSTACLE_POOL_SIZE = 8

/** Distancia mínima por delante del vehículo a la que aparece un obstáculo. */
export const OBSTACLE_SPAWN_DISTANCE = 60

// --- Velocidad de avance ---

/** Velocidad inicial de avance del vehículo (unidades/segundo). Lenta al comienzo. */
export const VELOCIDAD_INICIAL = 5

/**
 * Incremento de velocidad cada 100 unidades de distancia recorrida.
 * Valor pequeño = aceleración muy gradual (de 5 a 35 a lo largo de ~37 000 u.).
 */
export const VELOCIDAD_INCREMENTO = 0.08

/** Velocidad máxima de avance permitida. */
export const VELOCIDAD_MAXIMA = 35

// --- Bucle de juego ---

/** Delta máximo permitido (segundos). Recorta frames largos tras pestañas inactivas. */
export const DELTA_MAX = 0.05

// --- Puntuación ---

/** Multiplicador de puntuación sobre la distancia recorrida (puntos por unidad). */
export const PUNTUACION_FACTOR = 1

// --- Cámara tercera persona ---

/** Distancia detrás del vehículo (eje Z negativo local). */
export const CAM_OFFSET_Z = -5

/** Altura de la cámara sobre el vehículo. */
export const CAM_OFFSET_Y = 1.8

/** Factor de suavizado de la cámara (lerp por frame). 1 = inmediato, 0.06 = suave. */
export const CAM_LERP = 0.06
