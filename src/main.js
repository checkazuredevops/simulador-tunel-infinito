/**
 * main.js — Punto de entrada de la SPA.
 *
 * 1. Monta la aplicación Vue sobre #app (HUD + GameOver).
 * 2. Instancia y arranca el Game (escena Three.js + bucle RAF).
 *
 * El orden importa: Game necesita que el canvas exista en el DOM,
 * y Vue necesita que #app exista — ambos están en index.html.
 */

import { createApp } from 'vue'
import App from './ui/App.vue'
import { Game } from './game/Game.js'

// Montar la UI reactiva
createApp(App).mount('#app')

// Arrancar el juego (Three.js + bucle de render)
const game = new Game(document.getElementById('tunnel-canvas'))
game.start()

// El botón de reinicio en GameOver.vue emite este CustomEvent
window.addEventListener('game:restart', () => game.restart())
