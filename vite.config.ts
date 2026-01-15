import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/DevuCaption-Universal-Batch-Captioning/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: false,
      },
      plugins: [react()],
      // Do not embed API keys at build time. Users must enter their API key in-app.
      // If you need env-based keys for CI, inject them securely at deployment time.
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
