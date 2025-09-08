import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ao-vendor': ['@permaweb/aoconnect']
        }
      }
    },
    minify: 'esbuild',
    sourcemap: true,
    cssCodeSplit: true,
    assetsInlineLimit: 4096
  },
  // Optimize dev server
  server: {
    open: true,
    cors: true,
    hmr: {
      overlay: true
    }
  }
})
