# podcast-client

Монорепозиторий на **pnpm + Turborepo** для **Podcast Client** — веб и десктоп (Tauri) приложения с общим UI.

## Структура

```
apps/
  web/          — веб-приложение (Vite + React)
  desktop/      — десктоп-приложение (Tauri + Vite + React)
  mobile/       — мобильное приложение (Capacitor + Vite + React, iOS/Android)
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

## Mobile (Capacitor)

Мобильное приложение собирается из `apps/mobile`. Web-бандл собирается через Vite, дальше Capacitor оборачивает его в нативные iOS/Android проекты.

### Требования

- **iOS:** macOS, Xcode, CocoaPods (`brew install cocoapods`).
- **Android:** Android Studio, установленный Android SDK и переменная окружения `ANDROID_HOME`.

### Цикл разработки

После любой правки React-кода нужно пересобрать web-бандл и синкнуть его в нативные проекты:

```bash
# из apps/mobile
pnpm build                  # vite build -> dist/
npx cap sync                # обновляет ios/ и android/ из dist/
```

### iOS

```bash
# открыть проект в Xcode (выбрать симулятор / Team подписи и запустить ▶)
pnpm --filter @podcast/mobile cap:ios

# или запустить из CLI без открытия Xcode
cd apps/mobile && npx cap run ios
```

### Android

**Первый запуск (одноразовая настройка):**

1. Открыть Android Studio → **More Actions → SDK Manager**:
   - вкладка **SDK Platforms** — отметить актуальный стабильный API (например **Android 14 / API 34**).
   - вкладка **SDK Tools** — отметить **Android SDK Build-Tools**, **Platform-Tools**, **Command-line Tools**, **Android Emulator**.
2. Добавить в `~/.zshrc`:

   ```bash
   export ANDROID_HOME="$HOME/Library/Android/sdk"
   export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin"
   ```

   Перезапустить терминал, проверить `adb --version`.
3. Создать эмулятор: Android Studio → **Virtual Device Manager → Create Device** (предпочтительно стабильный API, не превью — на превью-образах WebView иногда глючит). Либо подключить телефон с включённым **USB Debugging**.

**Запуск:**

```bash
# открыть проект в Android Studio (после Gradle Sync — выбрать эмулятор/устройство и ▶)
pnpm --filter @podcast/mobile cap:android

# или запустить из CLI
cd apps/mobile && npx cap run android
```

### Live reload (опционально)

Чтобы приложение тянуло UI напрямую с dev-сервера Vite вместо статики из `dist/`, временно добавь в `apps/mobile/capacitor.config.ts`:

```ts
server: {
  androidScheme: "https",
  url: "http://<LAN-IP>:5173",
  cleartext: true,
},
```

Запусти `pnpm --filter @podcast/mobile dev`, потом `npx cap sync` и собери приложение — внутри будет HMR. Перед коммитом блок `url`/`cleartext` убери.

### Добавление платформы

Если папки `ios/` или `android/` нет (например, после свежего клона репо):

```bash
cd apps/mobile
pnpm build
npx cap add ios
npx cap add android
```

