# CEF: интеграция с Google / YouTube Music

В Tauri-приложении доступны три высокоуровневые функции, использующие встроенный Chromium (`cef-host`) для работы с залогиненным Google-аккаунтом пользователя:

| Функция                 | Что делает                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------- |
| `publishToYoutubeMusic` | Публикует RSS-фид в библиотеку подкастов YouTube Music                                  |
| `getCurrentGoogleUser`  | Возвращает email + имя текущего залогиненного аккаунта (или `null`)                     |
| `logoutFromGoogle`      | Разлогинивает все Google-сессии в профиле CEF                                           |

Все три используют один общий профиль (cookies, сессия) в `<app-data>/cef-profile`, поэтому состояние логина персистится между запусками приложения. Low-level Tauri-команды (`cef_open`/`cef_navigate`/...) тут намеренно не описаны — пользуйтесь готовыми функциями.

## Публикация RSS в YouTube Music

### Что это делает

Под капотом запускается sidecar-процесс `cef-host` (встроенный Chromium), он открывает `music.youtube.com/library/podcasts`, при необходимости показывает окно входа в Google, перехватывает у YouTube `Authorization`-заголовок (`SAPISIDHASH`) и POST'ит RSS-ссылку в `https://music.youtube.com/youtubei/v1/flow` (`FEmusic_podcasts_add_by_url`). После успешной публикации, прежде чем выключить sidecar, в той же сессии переходим на `myaccount.google.com` и читаем email — он отдаётся вызывающему.

### Минимальный пример

```ts
import { publishToYoutubeMusic } from "@/cef/publishYoutubeMusic";

const r = await publishToYoutubeMusic("https://castapp.ru/feed/abcd1234");
console.log(r.status, r.toast, r.user?.email);
```

Если всё хорошо — Promise зарезолвится объектом `{ status: 200, toast: "...", user: { email, name } }`. Если что-то пошло не так — Promise отклонится с `Error`.

### С отображением статусов

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

### Полная сигнатура

```ts
function publishToYoutubeMusic(
  rssUrl: string,
  options?: {
    onStage?: (stage: PublishStage, message: string) => void;
  },
): Promise<{
  status: number;
  toast: string | null;
  user: { email: string; name: string | null } | null;
}>;
```

- `rssUrl` — обязателен, формат `https://castapp.ru/feed/<id_playlist>`. Пустая строка → `Error("rssUrl is required")`.
- `status` — HTTP-статус ответа `/youtubei/v1/flow` (200 при успехе).
- `toast` — текст всплывашки от YouTube («Подкаст добавлен в библиотеку») или `null`.
- `user` — Google-аккаунт, под которым была сделана публикация. `null` если по какой-то причине не удалось прочитать (но публикация сама уже прошла).

### Типичный React-пример

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

## Кто сейчас залогинен

```ts
import { getCurrentGoogleUser } from "@/cef/getCurrentGoogleUser";

const user = await getCurrentGoogleUser();
if (user) console.log(user.email, user.name);
else console.log("не залогинен");
```

Запускает скрытое CEF-окно на `myaccount.google.com`, ждёт первый `load_end`:

- финальный URL остался на `myaccount.google.com` → парсит email + имя из `aria-label` account chip (с фолбэком на скан `body.innerText`), возвращает `{ email, name }`;
- редирект на sign-in или куда-то ещё → возвращает `null`.

В конце вызывается `cef_shutdown`. Занимает ~2-4 сек в зависимости от сети.

## Выход из аккаунта

```ts
import { logoutFromGoogle } from "@/cef/logoutGoogle";

await logoutFromGoogle({
  onStage: (stage, message) => console.log(stage, message),
});
```

Запускает скрытое CEF-окно на `https://accounts.google.com/Logout?continue=...`, ждёт пока редиректы выведут за пределы `/Logout`, потом выключает sidecar. После этого SAPISID и прочие auth-cookies удалены, следующий `publishToYoutubeMusic` снова покажет sign-in.

`onStage` опционален; стадии: `opening` → `logging-out` → `done` / `error`.

## Что важно помнить

- **Только desktop.** Все три функции импортируют `@tauri-apps/api` и валятся в браузере. В shared-пакеты их тащить не надо — они живут в `apps/desktop/src/cef/`.
- **Одна операция за раз.** Sidecar — один процесс на приложение. Параллельный вызов publish + logout/who-am-i ломает обоих. Блокируйте UI пока Promise не зарезолвится.
- **Sidecar тушится сам.** После `done` или `error` (и в `finally` у `getCurrentGoogleUser`/`logoutFromGoogle`) вызывается `cef_shutdown` — следующий вызов стартует чистый процесс.
- **Долгий вход.** Если пользователь застрял на `awaiting-login`, ждём до 10 минут — достаточно для самого медленного 2FA. После — `Error("load_end timeout")`.
- **Если RSS невалидный** или YouTube вернёт не-200 — придёт `Error("HTTP 4xx ... body=...")` с распарсенным телом ответа от YouTube, чтобы можно было понять причину.
- **`user` в `PublishResult` может быть `null`** даже при успехе — myaccount.google.com может не подгрузиться, но публикация в этот момент уже состоялась. Не используйте поле `user` как индикатор успеха — для этого есть `status`/throw.

## Ссылки

- [`apps/desktop/src/cef/publishYoutubeMusic.ts`](../src/cef/publishYoutubeMusic.ts) — публикация (можно подсмотреть JS-скрипты, которые исполняются внутри CEF).
- [`apps/desktop/src/cef/getCurrentGoogleUser.ts`](../src/cef/getCurrentGoogleUser.ts) — чтение текущего аккаунта; также экспортирует `readGoogleUserInBrowser(browserId)` для переиспользования уже открытой сессии.
- [`apps/desktop/src/cef/logoutGoogle.ts`](../src/cef/logoutGoogle.ts) — выход из аккаунта.
- [`apps/desktop/src/cef/cefSession.ts`](../src/cef/cefSession.ts) — общие хелперы (`setupCefListeners`, `waitForLoadEnd`, `runQuery`); регистрация Tauri-листенеров происходит один раз на загрузку модуля.
- [`apps/desktop/src/cef/TestPanel.tsx`](../src/cef/TestPanel.tsx) — пример со всеми тремя функциями (плавающая панель на `/`).
- [`src/cef.rs`](./src/cef.rs) — Tauri-команды (нужны только если хочется добавить новый CEF-сценарий).
