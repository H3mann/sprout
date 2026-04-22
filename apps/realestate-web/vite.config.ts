/// <reference types='vitest' />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/realestate-web',
  plugins: [
    react({
      jsxImportSource: '@emotion/react'
    })
  ],
  server: {
    port: 4201,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4301,
    host: 'localhost'
  },
  build: {
    outDir: '../../dist/apps/realestate-web',
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
      reportsDirectory: '../../coverage/apps/realestate-web',
      provider: 'v8'
    }
  }
});
