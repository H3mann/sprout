/// <reference types='vitest' />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/web',
  plugins: [
    react({
      jsxImportSource: '@emotion/react'
    })
  ],
  server: {
    port: 4200,
    host: 'localhost',
    proxy: {
      '/api/medlineplus': {
        target: 'https://wsearch.nlm.nih.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/medlineplus/, '/ws/query')
      },
      '/api/perplexity': {
        target: 'https://api.perplexity.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/perplexity/, '')
      },
      '/api/children': {
        target: 'http://localhost:3333',
        changeOrigin: true
      },
      '/api/growth': {
        target: 'http://localhost:3333',
        changeOrigin: true
      },
      '/api/visit-prep': {
        target: 'http://localhost:3333',
        changeOrigin: true
      },
      '/api/health': {
        target: 'http://localhost:3333',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4300,
    host: 'localhost'
  },
  build: {
    outDir: '../../dist/apps/web',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/web',
      provider: 'v8'
    }
  }
});
