# Documento de Requisitos

## Introducción

Simulador de túnel infinito tipo endless runner en el navegador. El usuario controla un vehículo low-poly (nave) que avanza automáticamente por un túnel generado proceduralmente, esquivando obstáculos 3D que aparecen de forma progresiva. La puntuación crece según la distancia recorrida y la partida termina al colisionar con un obstáculo, pudiendo reiniciarse sin recargar la página. El estado (puntuación, posición, segmentos, obstáculos) vive únicamente en memoria.

## Requisitos

### Requisito 1

**Historia de Usuario:** Como jugador, quiero mover el vehículo lateralmente dentro del túnel, para esquivar los obstáculos que aparecen en mi camino.

#### Criterios de Aceptación

1.1. WHEN el jugador presiona la tecla de movimiento lateral izquierdo o derecho THEN el sistema SHALL desplazar el vehículo lateralmente a lo largo del eje horizontal del túnel, actualizando el campo `posicionLateral`.

1.2. WHILE el vehículo se encuentra en uno de los extremos laterales del túnel THE sistema SHALL impedir que el vehículo lo atraviese, recortando `posicionLateral` al valor límite correspondiente.

1.3. WHEN el jugador libera las teclas de movimiento lateral THEN el sistema SHALL mantener el vehículo en la última `posicionLateral` alcanzada, sin desplazamiento residual.

1.4. WHILE el juego está en ejecución THE sistema SHALL aplicar el movimiento lateral de forma proporcional al tiempo transcurrido entre frames, para que el desplazamiento sea independiente del framerate.

### Requisito 2

**Historia de Usuario:** Como jugador, quiero ver un túnel infinito que se genera mientras avanzo, para mantener la sensación de velocidad y de recorrido continuo.

#### Criterios de Aceptación

2.1. WHEN el juego está en ejecución THEN el sistema SHALL generar segmentos de túnel por delante de la cámara de forma continua, avanzando el campo `segmentoActual`.

2.2. WHILE el juego está en ejecución THE sistema SHALL reciclar los segmentos que quedan por detrás de la cámara reubicándolos al frente, manteniendo un número constante de segmentos en memoria.

2.3. WHEN un segmento se recicla THEN el sistema SHALL reutilizar su geometría y material existentes, sin crear nuevas instancias.

2.4. WHILE el juego está en ejecución THE sistema SHALL renderizar la escena con niebla para reforzar la sensación de profundidad y velocidad.

### Requisito 3

**Historia de Usuario:** Como jugador, quiero que aparezcan obstáculos que debo evitar, para que la dificultad aumente a medida que avanzo.

#### Criterios de Aceptación

3.1. WHEN el juego está en ejecución THEN el sistema SHALL generar obstáculos en posiciones aleatorias dentro del radio del túnel, activando el campo `obstaculoActivo`.

3.2. WHEN un obstáculo se genera THEN el sistema SHALL ubicarlo por delante de la posición actual del vehículo, de forma que sea visible antes de alcanzarlo.

3.3. WHEN la distancia recorrida aumenta THEN el sistema SHALL incrementar progresivamente la frecuencia o la velocidad de aparición de obstáculos.

3.4. IF la bounding box del vehículo intersecta la bounding box de un obstáculo activo THEN el sistema SHALL finalizar la partida y mostrar la pantalla de game over.

3.5. WHILE el juego está en ejecución THE sistema SHALL reciclar los obstáculos que quedan por detrás de la cámara, reutilizando su geometría y material.

### Requisito 4

**Historia de Usuario:** Como jugador, quiero ver mi puntuación según la distancia recorrida y poder reiniciar la partida, para medir mi rendimiento y volver a jugar sin recargar la página.

#### Criterios de Aceptación

4.1. WHILE el juego está en ejecución THE sistema SHALL incrementar el campo `puntuacion` de forma continua y proporcional a la distancia recorrida por el vehículo.

4.2. WHILE el juego está en ejecución THE sistema SHALL mostrar la `puntuacion` actual en el HUD de forma reactiva, sin recargar la página.

4.3. WHEN la partida finaliza por colisión THEN el sistema SHALL mostrar una pantalla de game over con la puntuación final alcanzada.

4.4. WHEN el jugador activa la acción de reinicio desde la pantalla de game over THEN el sistema SHALL reiniciar `puntuacion`, `posicionLateral`, `segmentoActual` y `obstaculoActivo` a sus valores iniciales, sin recargar la página completa.

4.5. WHEN la partida se reinicia THEN el sistema SHALL reanudar el bucle de juego de inmediato, dejando el juego en estado jugable.
