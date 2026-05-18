# Stage 1 — сборка
FROM node:20-alpine AS builder

# Устанавливаем pnpm
RUN npm install -g pnpm

WORKDIR /app

# Копируем файлы для установки зависимостей
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY turbo.json ./

# Копируем package.json всех пакетов
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/core/package.json ./packages/core/
COPY packages/types/package.json ./packages/types/

# Устанавливаем зависимости
RUN pnpm install --frozen-lockfile

# Копируем весь исходный код
COPY apps/web ./apps/web
COPY packages ./packages

# Доустанавливаем зависимости после копирования исходников
RUN pnpm install --frozen-lockfile

# Собираем приложение
RUN pnpm --filter @podcast/web build

# Stage 2 — продакшн сервер
FROM nginx:alpine

# Копируем собранный фронт
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Копируем конфиг nginx
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]