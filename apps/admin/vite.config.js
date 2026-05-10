import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envDir: "../..",
  server: {
    port: 5176,
    proxy: {
      "/api": {
        target: "http://localhost:5080",
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
