import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  envDir: '../..',
  server: {
    port: 5173,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        portfolio: resolve(__dirname, 'portfolio-yaratish/index.html'),
        resume: resolve(__dirname, 'resume-yaratish/index.html'),
        cv: resolve(__dirname, 'cv-yaratish/index.html'),
      },
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});
