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

Требуется установленный [Rust](https://www.rust-lang.org/tools/install). Для CEF-функций (публикация в YouTube Music, чтение/выход из Google-аккаунта) дополнительно собирается sidecar `cef-host` со встроенным Chromium — это происходит автоматически.

```bash
# dev-режим (соберёт cef-host если ещё не собран, потом запустит tauri dev)
pnpm --filter @podcast/desktop tauri:dev

# production-сборка
pnpm --filter @podcast/desktop tauri:build
```

`tauri:dev` / `tauri:build` под капотом вызывают [`apps/desktop/scripts/build-cef-host.mjs`](apps/desktop/scripts/build-cef-host.mjs) — кросс-платформенную обёртку:

- На macOS/Linux запускает `build-cef-host.sh`, на Windows — `build-cef-host.ps1`.
- Если `cef-host/target/bundle/` уже содержит готовый бандл — **пропускает пересборку** (иначе каждый раз копировался бы ~400MB Chromium Embedded Framework).
- Чтобы форсировать перебилд (например после правок в `cef-host/`): `rm -rf apps/desktop/cef-host/target/bundle` или передать `--force`.
- CEF SDK (`cef-dll-sys`) скачивается автоматически в `OUT_DIR` — внешний `cef-rs`-клон не требуется.

### Distributable

Под прод-дистрибутив — отдельные скрипты, которые собирают бандл с `--release`, встраивают `cef-host.app` (на macOS) или вшитый exe (на Windows) и упаковывают:

```bash
# macOS — .dmg в apps/desktop/dist-release/
./apps/desktop/scripts/build-release.sh

# Windows — NSIS installer (.exe) в apps/desktop/dist-release/
powershell -ExecutionPolicy Bypass -File apps\desktop\scripts\build-release.ps1
```

По умолчанию фронт собран с `VITE_BACKEND_TARGET=server`. Для локального docker-бэкенда: `VITE_BACKEND_TARGET=local ./apps/desktop/scripts/build-release.sh`.

Документация по CEF-функциям (publish/logout/who-am-I) — в [`apps/desktop/src-tauri/README.md`](apps/desktop/src-tauri/README.md).

