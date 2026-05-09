import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envDir: "../..",
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "https://api.procraft.uz",
        changeOrigin: true,
        secure: true,
      },
      "/uploads": {
        target: "https://api.procraft.uz",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    sourcemap: true,
    outDir: "dist",
  },
});
