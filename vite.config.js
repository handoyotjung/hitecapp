import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Plugin to strip crossorigin from CSS links to prevent mobile cache/CORS bugs
const stripCssCrossoriginPlugin = () => {
  return {
    name: 'strip-css-crossorigin',
    transformIndexHtml(html) {
      return html.replace(/<link rel="stylesheet" crossorigin([^>]+)>/g, '<link rel="stylesheet"$1>');
    }
  }
};

export default defineConfig({
  base: '/',
  plugins: [react(), stripCssCrossoriginPlugin()],
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
    crossorigin: false,
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
