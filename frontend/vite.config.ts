import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { reactRouter } from '@react-router/dev/vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL ?? 'http://localhost:3001',
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
