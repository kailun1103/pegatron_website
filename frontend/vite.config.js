import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // 讓外部(ngrok)可連到你的 dev server
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 你的 Express
        changeOrigin: true,
      },
    },
  },
})
