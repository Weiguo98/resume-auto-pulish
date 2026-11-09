import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const api = `http://localhost:${process.env.PORT ?? 3000}`;

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { "/api": api, "/auth": api },
  },
});
