<template>
  <div class="hud" role="status" aria-live="polite" aria-label="Puntuación actual">
    <span class="hud__label">Puntuación</span>
    <span class="hud__score">{{ puntuacionDisplay }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { gameState } from '../game/state.js'

// Mostramos la puntuación como entero sin decimales
const puntuacionDisplay = computed(() => Math.floor(gameState.puntuacion).toLocaleString('es'))
</script>
