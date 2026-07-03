import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// In dev, proxy /api to the local API so the SPA and API share an origin
// (mirrors how nginx serves them together in production).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Split heavy libraries into their own chunks so the main bundle stays
        // small and the >1 MB build warning clears.
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          hls: ["hls.js"],
          motion: ["gsap", "framer-motion"],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_TARGET ?? "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
