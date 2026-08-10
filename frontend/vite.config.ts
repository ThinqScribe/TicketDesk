import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': `${import.meta.dirname}/src`,
    },
  },
  server: {
    proxy: {
      '/auth': { target: 'http://localhost:8000', changeOrigin: true },
      '/users': { target: 'http://localhost:8000', changeOrigin: true },
      '/tickets': { target: 'http://localhost:8000', changeOrigin: true },
      '/customers': { target: 'http://localhost:8000', changeOrigin: true },
      '/webhooks': { target: 'http://localhost:8000', changeOrigin: true },
      '/tenant': { target: 'http://localhost:8000', changeOrigin: true },
      '/health': { target: 'http://localhost:8000', changeOrigin: true },
      // Proxy only the billing API endpoints — NOT /billing/success or /billing/cancel
      // Those are frontend pages handled by React Router under /dashboard/billing/*
      '^/billing$': { target: 'http://localhost:8000', changeOrigin: true },
      '^/billing/checkout-session$': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
