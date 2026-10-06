import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    // Vitest config embebida en vite.config.js (no se necesita archivo separado)
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
    globals: false,
  },
})
