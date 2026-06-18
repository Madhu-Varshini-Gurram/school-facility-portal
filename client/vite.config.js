import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxyConfig = {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
    secure: false,
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: proxyConfig
  },
  preview: {
    port: 3000,
    proxy: proxyConfig
  }
})
