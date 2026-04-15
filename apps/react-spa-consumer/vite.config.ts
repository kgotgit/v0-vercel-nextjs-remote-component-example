import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["remote-components"],
    include: ["react-server-dom-webpack/client.browser"],
  },
});
