import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: true,
    host: '0.0.0.0',
    port: 2025
  }
})

