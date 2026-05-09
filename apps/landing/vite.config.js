import { defineConfig } from 'vite';

export default defineConfig({
  envDir: '../..',
  server: {
    port: 5173,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});
