<template>
  <!-- Error de WebGL: fallback visible cuando el contexto no pudo iniciarse -->
  <div v-if="gameState.webglError" class="webgl-error">
    Tu navegador no soporta WebGL2. Prueba con Chrome, Edge o Firefox actualizados.
  </div>

  <template v-else>
    <!-- HUD: visible mientras se juega (no en game over) -->
    <HUD v-if="!gameState.gameOver" />

    <!-- Overlay Game Over -->
    <GameOver v-if="gameState.gameOver" @restart="onRestart" />

    <!-- Contador FPS (solo en desarrollo) -->
    <div v-if="isDev" class="fps">{{ fps }} fps</div>
  </template>
</template>

<script setup>
import { ref } from 'vue'
import { gameState } from '../game/state.js'
import HUD from './HUD.vue'
import GameOver from './GameOver.vue'

// El evento 'restart' se comunica al Game a través de un CustomEvent en window
// para mantener la UI desacoplada de la instancia de Game.
function onRestart() {
  window.dispatchEvent(new CustomEvent('game:restart'))
}

// FPS counter — solo en modo dev
const isDev = import.meta.env.DEV
const fps = ref(0)

if (isDev) {
  let frames = 0
  let last = performance.now()
  function countFps() {
    frames++
    const now = performance.now()
    if (now - last >= 1000) {
      fps.value = frames
      frames = 0
      last = now
    }
    requestAnimationFrame(countFps)
  }
  requestAnimationFrame(countFps)
}
</script>
