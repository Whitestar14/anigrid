import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // `mode`, not the literal string "mode" — passing a literal made Vite look for
  // `.env.mode`, so every `.env.development` / `.env.production` value was
  // silently ignored.
  const env = loadEnv(mode, ".", "");

  const proxyUrl =
    env.VITE_IMAGE_PROXY_URL || "http://localhost:5000/proxy/image";

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    define: {
      // Only the image proxy URL is inlined. The previous block also embedded
      // `GEMINI_API_KEY` into the client bundle and nothing ever read it.
      "process.env.VITE_IMAGE_PROXY_URL": JSON.stringify(proxyUrl),
    },
      build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: "motion",
                test: /node_modules[\\/](motion|framer-motion)[\\/]/,
              },
              { name: "dnd", test: /node_modules[\\/]@dnd-kit[\\/]/ },
              { name: "export", test: /node_modules[\\/]html-to-image[\\/]/ },
            ],
          },
        },
      },
    },
  };
});
