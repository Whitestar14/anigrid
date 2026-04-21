import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  // Automatically use the right environment based on mode
  // dev mode uses .env.development, prod uses .env.production
  const proxyUrl =
    env.VITE_IMAGE_PROXY_URL || "http://localhost:5000/proxy/image";

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react(), tailwindcss()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.VITE_IMAGE_PROXY_URL": JSON.stringify(proxyUrl),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
