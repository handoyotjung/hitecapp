import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    allowedHosts: true
  },
  build: {
    target: 'es2015',
    sourcemap: true,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      return { relative: true };
    }
  },
  test: {
    environment: 'jsdom',
    globals: true
  }
})
