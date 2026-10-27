import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // Se usa IPv4 explícito porque Django local está enlazado a 127.0.0.1;
        // "localhost" puede resolver a ::1 en Windows y devolver 502.
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
