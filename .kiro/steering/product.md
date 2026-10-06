---
inclusion: always
---

# Product Steering

## Propósito

Simulador de túnel infinito tipo endless runner en el navegador: el jugador controla un vehículo low-poly que avanza por un túnel generado proceduralmente, esquivando obstáculos 3D con dificultad creciente, mientras acumula puntuación por la distancia recorrida. Es una demo técnica de Three.js centrada en generación procedural, bucle de juego continuo a 60 fps y control de usuario.

## Usuarios

- **Jugador ocasional**: abre la página, juega unos minutos, ve su puntuación y reinicia. No hay cuentas, ni perfiles, ni sesiones.
- **Desarrollador / evaluador técnico**: inspecciona el código para verificar generación procedural, reciclaje de objetos, detección AABB y control lateral limitado.

## Casos de uso

1. Jugar una partida esquivando obstáculos hasta colisionar.
2. Reiniciar la partida desde la pantalla de game over sin recargar la página.
3. Observar la dificultad progresiva al aumentar la distancia recorrida.
4. Ver la puntuación en vivo en el HUD y la puntuación final en el game over.

## Funcionalidades

- Control lateral del vehículo con teclado, limitado a los bordes del túnel.
- Túnel infinito con segmentos generados y reciclados (número constante en memoria).
- Obstáculos 3D en posiciones aleatorias dentro del radio del túnel, con frecuencia creciente.
- Detección de colisión por bounding box y game over al impactar.
- Puntuación acumulada por distancia, mostrada de forma reactiva.
- Reinicio en caliente sin recargar la página.

## Límites del producto

- **Estado efímero en memoria**: no hay persistencia, ni localStorage, ni backend. Al recargar la página, la puntuación se pierde.
- **Una sola pantalla**: HUD + canvas + overlay de game over. No hay menú principal, ni ajustes, ni niveles, ni selección de vehículo.
- **Un solo vehículo**: no hay elección de coche, moto o nave; se usa la nave low-poly por defecto.
- **Sin sonido** en el MVP.
- **Sin multijugador, sin ranking, sin logros**.
- **Sin controles táctiles**: la entrada es solo teclado (flechas izquierda/derecha y `A`/`D`).

## Restricción de alcance

No se deben incluir funcionalidades adicionales a las descritas. La implementación se limita estrictamente a este MVP, usando únicamente las funcionalidades, campos y tecnologías especificadas en el spec. No se deben inventar requisitos, campos, pantallas, flujos ni capacidades adicionales.
