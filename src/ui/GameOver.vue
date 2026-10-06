<template>
  <div class="game-over" role="dialog" aria-modal="true" aria-label="Fin del juego">
    <h1 class="game-over__title">Game Over</h1>
    <p class="game-over__subtitle">Distancia recorrida</p>
    <p class="game-over__score">{{ puntuacionFinal }}</p>
    <button
      class="game-over__btn"
      @click="onRestart"
      autofocus
    >
      Reiniciar
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { gameState } from '../game/state.js'

const emit = defineEmits(['restart'])

const puntuacionFinal = computed(() =>
  Math.floor(gameState.puntuacion).toLocaleString('es'),
)

function onRestart() {
  emit('restart')
}
</script>
