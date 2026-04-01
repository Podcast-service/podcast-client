# podcast-client

Монорепозиторий на **pnpm + Turborepo** для **Podcast Client** — веб и десктоп (Tauri) приложения с общим UI.

## Структура

```
apps/
  web/          — веб-приложение (Vite + React)
  desktop/      — десктоп-приложение (Tauri + Vite + React)
packages/
  ui/           — общие React-компоненты
  core/         — бизнес-логика
  types/        — общие типы
```

## Установка

```bash
pnpm install
```

## Web

```bash
# dev-сервер
pnpm --filter @podcast/web dev

# production-сборка
pnpm --filter @podcast/web build
```

## Desktop (Tauri)

Требуется установленный [Rust](https://www.rust-lang.org/tools/install).

```bash
# dev-режим
pnpm --filter @podcast/desktop tauri:dev

# production-сборка
pnpm --filter @podcast/desktop tauri:build
```

