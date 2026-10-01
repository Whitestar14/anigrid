import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
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
      "process.env.VITE_IMAGE_PROXY_URL": JSON.stringify(proxyUrl),
    },
    css: {
      transformer: "postcss",
    },
    build: {
      target: "esnext",
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
