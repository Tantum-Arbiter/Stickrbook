import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables
  const env = loadEnv(mode, process.cwd(), '')

  // Backend URL - defaults to Windows PC on local network
  const BACKEND_URL = env.VITE_BACKEND_URL || 'http://192.168.1.213:8000'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/stores': path.resolve(__dirname, './src/stores'),
        '@/api': path.resolve(__dirname, './src/api'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/utils': path.resolve(__dirname, './src/utils'),
        '@/styles': path.resolve(__dirname, './src/styles'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        // Proxy all /v1/* requests to backend
        '/v1': {
          target: BACKEND_URL,
          changeOrigin: true,
          // Log proxy requests in development
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.error('Proxy error:', err.message)
            })
            proxy.on('proxyReq', (_proxyReq, req) => {
              console.log(`→ ${req.method} ${req.url} → ${BACKEND_URL}`)
            })
          },
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    // Expose backend URL to client code if needed
    define: {
      __BACKEND_URL__: JSON.stringify(BACKEND_URL),
    },
  }
})

