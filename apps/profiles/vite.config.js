import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envDir: '../..',
  server: {
    port: 5175,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: true,
    outDir: 'dist',
  },
});
