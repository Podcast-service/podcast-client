import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Бэкенд по умолчанию — сервер castapp.ru. Можно переопределить через API_TARGET.
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

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: true,
    // Важно: матчим только API-префиксы. Строка "/auth" перехватывает
    // клиентский роут /authors, поэтому используем regex с границей пути.
    proxy: {
      "^/podcast/v1(?:/|$)": proxyConfig,
      "^/auth(?:/|$)": proxyConfig,
    },
  },
  preview: {
    host: true,
  },
});
