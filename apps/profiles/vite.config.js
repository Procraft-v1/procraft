import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envDir: "../..",
  server: {
    port: 5175,
    host: "localhost",
    proxy: {
      "/api": {
        target: "https://api.procraft.uz",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "https://api.procraft.uz",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    sourcemap: true,
    outDir: "dist",
  },
});
