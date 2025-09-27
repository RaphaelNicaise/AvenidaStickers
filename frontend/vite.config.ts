import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permite conexiones externas (necesario para Docker)
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173, // Puerto para hot module replacement
    },
    watch: {
      usePolling: true, // Necesario para detectar cambios en Docker en Windows
    },
  },
  preview: {
    host: true,
    port: 5173,
  },
})