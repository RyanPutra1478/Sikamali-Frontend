import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://192.168.0.244:5000",
        changeOrigin: true,
      },

    },
    host: true,
    port: 5174,
  },
});
