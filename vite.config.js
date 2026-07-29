import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Plugin to strip crossorigin from CSS links for mobile Android Chrome compatibility
const removeCssCrossoriginPlugin = () => {
  return {
    name: 'remove-css-crossorigin',
    transformIndexHtml(html) {
      return html.replace(
        /<link([^>]*?)rel="stylesheet"([^>]*?)>/gi,
        (match, p1, p2) => {
          const strippedP1 = p1.replace(/\s*crossorigin(?:="[^"]*")?/gi, '');
          const strippedP2 = p2.replace(/\s*crossorigin(?:="[^"]*")?/gi, '');
          return `<link${strippedP1}rel="stylesheet"${strippedP2}>`;
        }
      );
    }
  };
};

export default defineConfig({
  base: '/',
  plugins: [react(), removeCssCrossoriginPlugin()],
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
