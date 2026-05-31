import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// Бэкенд по умолчанию — сервер castapp.ru. Можно переопределить через API_TARGET.
// @ts-expect-error process is a nodejs global
const API_TARGET = process.env.API_TARGET ?? "http://castapp.ru";

// podcast-core на castapp.ru пускает по CORS только origin самого castapp.ru,
// поэтому в dev проксируем /podcast и /auth через Vite и убираем заголовок
// Origin (запрос без Origin сервер отдаёт без CORS-проверки).
const proxyConfig = {
  target: API_TARGET,
  changeOrigin: true,
  configure: (proxy: any) => {
    proxy.on("proxyReq", (proxyReq: any) => {
      proxyReq.removeHeader("origin");
    });
  },
};

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: "127.0.0.1",
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    // Важно: матчим только API-префиксы. Строка "/auth" перехватывает
    // клиентский роут /authors, поэтому используем regex с границей пути.
    proxy: {
      "^/podcast/v1(?:/|$)": proxyConfig,
      "^/auth(?:/|$)": proxyConfig,
    },
  },
}));
