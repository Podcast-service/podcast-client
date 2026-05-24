# CEF: публикация RSS в YouTube Music

Эта инструкция как из React-кода Tauri-приложения отправить RSS-фид подкаста в библиотеку пользователя на YouTube Music. Всё остальное про CEF (low-level Tauri-команды `cef_open`/`cef_navigate`/...) тут намеренно не описывается — пользуйтесь готовой функцией.

## Что это делает

Под капотом запускается sidecar-процесс `cef-host` (встроенный Chromium), он открывает `music.youtube.com/library/podcasts`, при необходимости показывает окно входа в Google, перехватывает у YouTube `Authorization`-заголовок (`SAPISIDHASH`) и POST'ит RSS-ссылку в `https://music.youtube.com/youtubei/v1/flow` (`FEmusic_podcasts_add_by_url`). После завершения процесс CEF закрывается.

Профиль (cookies, сессия) сохраняется в `<app-data>/cef-profile`, поэтому второй и последующие запуски проходят без входа.

## Минимальный пример

```ts
import { publishToYoutubeMusic } from "@/cef/publishYoutubeMusic";

await publishToYoutubeMusic("https://castapp.ru/feed/abcd1234");
```

Если всё хорошо — Promise зарезолвится объектом `{ status: 200, toast: "..." }`. Если что-то пошло не так — Promise отклонится с `Error`.

## С отображением статусов

```ts
import {
  publishToYoutubeMusic,
  type PublishStage,
} from "@/cef/publishYoutubeMusic";

await publishToYoutubeMusic(rssUrl, {
  onStage: (stage, message) => {
    console.log(stage, message);
    // обновите свой UI здесь
  },
});
```

`onStage` вызывается каждый раз, когда меняется фаза. Возможные значения `stage`:

| stage             | когда                                                          | UX-подсказка                                  |
| ----------------- | -------------------------------------------------------------- | --------------------------------------------- |
| `opening`         | sidecar запускается, открывается окно (скрытое)                | спиннер «Запуск браузера»                     |
| `loading`         | грузится music.youtube.com                                     | спиннер «Загрузка YouTube Music»              |
| `checking-login`  | проверяется `ytcfg.LOGGED_IN`                                  | спиннер «Проверка авторизации»                |
| `awaiting-login`  | пользователь **не залогинен** — окно стало видимым, ждём входа | «Войдите в Google в открывшемся окне»         |
| `adding`          | логин есть, отправляется POST в YouTube API                    | «Добавление RSS-фида»                         |
| `done`            | успех                                                          | зелёный success-стейт + значение `toast`      |
| `error`           | ошибка (любая)                                                 | красный, текст из `message` (это `err.message`) |

Стадия `awaiting-login` интересна тем, что в этот момент CEF-окно реально видно пользователю, и он сам кликает по Google-формам. Как только он завершит вход и редирект вернёт на `music.youtube.com`, окно скрывается и процесс продолжается с фазы `adding` автоматически.

## Полная сигнатура

```ts
function publishToYoutubeMusic(
  rssUrl: string,
  options?: {
    onStage?: (stage: PublishStage, message: string) => void;
  },
): Promise<{ status: number; toast: string | null }>;
```

- `rssUrl` — обязателен, формат `https://castapp.ru/feed/<id_playlist>`. Пустая строка → `Error("rssUrl is required")`.
- `status` — HTTP-статус ответа `/youtubei/v1/flow` (200 при успехе).
- `toast` — текст всплывашки от YouTube («Подкаст добавлен в библиотеку») или `null`.

## Типичный React-пример

```tsx
import { useState } from "react";
import {
  publishToYoutubeMusic,
  type PublishStage,
} from "@/cef/publishYoutubeMusic";

function PublishButton({ rssUrl }: { rssUrl: string }) {
  const [stage, setStage] = useState<PublishStage | null>(null);
  const [busy, setBusy] = useState(false);

  async function publish() {
    setBusy(true);
    try {
      const r = await publishToYoutubeMusic(rssUrl, { onStage: setStage });
      alert(r.toast ?? "Готово");
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={publish} disabled={busy}>
      {stage ?? "Опубликовать в YouTube Music"}
    </button>
  );
}
```

## Что важно помнить

- **Только desktop.** Функция импортирует `@tauri-apps/api` и валится в браузере. В shared-пакеты её тащить не надо — она живёт в `apps/desktop/src/cef/`.
- **Одна публикация за раз.** Внутри держится один пул CEF-листенеров на процесс; параллельный вызов будет работать, но статусы перемешаются. Блокируйте кнопку, пока Promise не зарезолвится.
- **Sidecar тушится сам.** После `done` или `error` вызывается `cef_shutdown` — следующий запуск стартует чистый процесс. Руками гасить не нужно.
- **Долгий вход.** Если пользователь застрял на `awaiting-login`, ждём до 10 минут — достаточно для самого медленного 2FA. После — `Error("load_end timeout")`.
- **Если RSS невалидный** или YouTube вернёт не-200 — придёт `Error("HTTP 4xx ... body=...")` с распарсенным телом ответа от YouTube, чтобы можно было понять причину.

## Ссылки

- [`apps/desktop/src/cef/publishYoutubeMusic.ts`](../src/cef/publishYoutubeMusic.ts) — реализация (можно подсмотреть JS-скрипты, которые исполняются внутри CEF).
- [`apps/desktop/src/cef/TestPanel.tsx`](../src/cef/TestPanel.tsx) — пример с инпутом и статусами (плавающая панель на `/`).
- [`src/cef.rs`](./src/cef.rs) — Tauri-команды (нужны только если хочется добавить новый CEF-сценарий помимо публикации RSS).
