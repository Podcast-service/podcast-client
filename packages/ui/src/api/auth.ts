// Базовый путь auth-service. По умолчанию относительный (эндпоинты /auth/*):
// в проде — тот же origin (castapp.ru), в dev — прокси Vite на castapp.ru.
// Можно переопределить абсолютным URL через VITE_AUTH_API_URL.
const BASE_URL = (import.meta as any).env?.VITE_AUTH_API_URL ?? "";
const API_ORIGIN =
  (import.meta as any).env?.VITE_API_ORIGIN ?? "https://castapp.ru";

interface TauriApiFetchResponse {
  status: number;
  headers?: Record<string, string>;
  body?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RegisterResponse {
  id: string;
  email: string;
}

export interface ApiError {
  error?: string;
  message?: string;
}

/** Событие смены состояния авторизации (для реактивного UI в той же вкладке). */
export const AUTH_CHANGE_EVENT = "auth-change";

const emitAuthChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
};

export const saveTokens = (tokens: AuthTokens) => {
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
  emitAuthChange();
  scheduleAutoRefresh();
};

export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  cancelAutoRefresh();
  emitAuthChange();
};

/**
 * Перезаписать только access-token, оставив refresh-token прежним.
 * Нужно, когда бэкенд выдаёт новый access (например, после выдачи роли
 * author через POST /authors/me) — в нём обновлённые claims/роли.
 */
export const setAccessToken = (accessToken: string) => {
  localStorage.setItem("access_token", accessToken);
  emitAuthChange();
  scheduleAutoRefresh();
};

export const getAccessToken = () => localStorage.getItem("access_token");
export const getRefreshToken = () => localStorage.getItem("refresh_token");

const isPackagedTauri = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const protocol = window.location.protocol;
  return (
    protocol !== "http:" &&
    protocol !== "https:" &&
    typeof (window as any).__TAURI_INTERNALS__?.invoke === "function"
  );
};

const resolveNativeApiUrl = (input: string | URL): string => {
  const raw = input instanceof URL ? input.toString() : input;
  const apiOrigin = new URL(API_ORIGIN);
  const parsed = new URL(raw, apiOrigin);

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return new URL(
      `${parsed.pathname}${parsed.search}${parsed.hash}`,
      apiOrigin
    ).toString();
  }

  if (parsed.host === window.location.host && parsed.origin !== apiOrigin.origin) {
    return new URL(
      `${parsed.pathname}${parsed.search}${parsed.hash}`,
      apiOrigin
    ).toString();
  }

  return parsed.toString();
};

const headersToRecord = (headers?: HeadersInit): Record<string, string> => {
  const record: Record<string, string> = {};
  new Headers(headers).forEach((value, key) => {
    record[key] = value;
  });
  return record;
};

/**
 * API fetch для всех окружений.
 * В packaged Tauri относительные запросы не должны идти в asset server
 * приложения, поэтому прокидываем их через Rust-команду без browser CORS.
 */
export async function appFetch(
  input: string | URL,
  init: RequestInit = {}
): Promise<Response> {
  if (!isPackagedTauri()) {
    return fetch(input, init);
  }

  if (init.body != null && typeof init.body !== "string") {
    return fetch(input, init);
  }

  const invoke = (window as any).__TAURI_INTERNALS__.invoke;
  const response = (await invoke("api_fetch", {
    request: {
      method: init.method ?? "GET",
      url: resolveNativeApiUrl(input),
      headers: headersToRecord(init.headers),
      body: init.body ?? null,
    },
  })) as TauriApiFetchResponse;

  return new Response(response.body ?? "", {
    status: response.status,
    headers: response.headers,
  });
}

/** Claims из access-token (user_id, email, roles, ...). null, если токена нет/он битый. */
export const getTokenClaims = (): Record<string, any> | null => {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
};

// ───── Срок жизни / автообновление access-токена ─────

/** За сколько до истечения access-токена считаем его «пора обновить». */
const REFRESH_SKEW_MS = 60_000;

/** Момент истечения access-токена (ms, epoch) из claim `exp`. null — если неизвестен. */
const getAccessTokenExpiry = (): number | null => {
  const exp = getTokenClaims()?.exp;
  return typeof exp === "number" ? exp * 1000 : null;
};

/**
 * Истёк ли access-токен (или истечёт в ближайшие REFRESH_SKEW_MS).
 * Если `exp` в токене нет — считаем, что не истёк (полагаемся на 401 от сервера).
 */
export const isAccessTokenExpired = (skewMs = REFRESH_SKEW_MS): boolean => {
  const expiry = getAccessTokenExpiry();
  if (expiry === null) return false;
  return expiry - skewMs <= Date.now();
};

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

const cancelAutoRefresh = () => {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
};

/**
 * Запланировать фоновое обновление токена незадолго до его истечения, чтобы
 * сессия не «протухала» через 30 минут при открытом приложении. Перевызов
 * сбрасывает предыдущий таймер (после каждого saveTokens/setAccessToken).
 */
function scheduleAutoRefresh() {
  if (typeof window === "undefined") return;
  cancelAutoRefresh();

  if (!getRefreshToken()) return;
  const expiry = getAccessTokenExpiry();
  if (expiry === null) return;

  const delay = Math.max(expiry - Date.now() - REFRESH_SKEW_MS, 0);
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    // Ошибку глотаем: refreshTokens на «жёстком» отказе сам чистит токены.
    refreshTokens().catch(() => {});
  }, delay);
}


async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw { status: res.status, ...data };
  }
  return data as T;
}

/**
 * Разбор ответа, который может прийти как JSON, так и обычным текстом.
 * password-change на ошибках без тела (401 "token missing", "invalid token",
 * "token expired") отдаёт plain-text, а на остальных — JSON ({ error } / { message }).
 */
async function handleJsonOrText<T>(res: Response): Promise<T> {
  const raw = await res.text();
  let data: any = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      // не JSON — оборачиваем как { error: <текст> }
      data = { error: raw.trim() };
    }
  }
  if (!res.ok) {
    throw { status: res.status, ...(data ?? {}) };
  }
  return (data ?? {}) as T;
}

// ───── Auth API ─────

/**
 * Регистрация
 * POST /auth/register
 * Ответ 201: { id, email }
 * Ошибки:
 *   409 — имя пользователя или email уже заняты
 */
export async function register(
  username: string,
  email: string,
  password: string
): Promise<RegisterResponse> {
  const res = await appFetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  return handleResponse<RegisterResponse>(res);
}

/**
 * Верификация email
 * POST /auth/verify-email
 * Ответ 200: { access_token, refresh_token, expires_in }
 */
export async function verifyEmail(
  email: string,
  code: string
): Promise<AuthTokens> {
  const res = await appFetch(`${BASE_URL}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  return handleResponse<AuthTokens>(res);
}

/**
 * Повторная отправка кода верификации
 * POST /auth/resend-verification
 */
export async function resendVerification(email: string): Promise<void> {
  const res = await appFetch(`${BASE_URL}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleResponse<void>(res);
}

/**
 * Вход
 * POST /auth/login
 * Ответ 200: { access_token, refresh_token, expires_in }
 * Ошибки:
 *   401 — неверная почта или пароль
 *   403 — email не подтвержден (сервер сам отправит код)
 */
export async function login(
  email: string,
  password: string
): Promise<AuthTokens> {
  const res = await appFetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      device_name: navigator.userAgent.slice(0, 50),
    }),
  });
  return handleResponse<AuthTokens>(res);
}

/**
 * Запрос сброса пароля — отправляет код на почту
 * POST /auth/password-reset/request
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const res = await appFetch(`${BASE_URL}/auth/password-reset/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleResponse<void>(res);
}

/**
 * Подтверждение сброса пароля — проверяет код и меняет пароль
 * POST /auth/password-reset/confirm
 */
export async function confirmPasswordReset(
  email: string,
  code: string,
  new_password: string
): Promise<void> {
  const res = await appFetch(`${BASE_URL}/auth/password-reset/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, new_password }),
  });
  return handleResponse<void>(res);
}

/** Текущий «полёт» refresh-запроса — чтобы параллельные вызовы не плодили запросы. */
let refreshPromise: Promise<AuthTokens> | null = null;

/**
 * Обновление токенов
 * POST /auth/refresh — тело { refresh_token }, ответ { access_token,
 * refresh_token, expires_in } (refresh-токен ротируется).
 *
 * Сохраняет новую пару в localStorage. Параллельные вызовы разделяют один
 * запрос (single-flight). На «жёстком» отказе (нет refresh-токена или сервер
 * вернул не-2xx — токен невалиден/отозван) чистит токены и пробрасывает ошибку.
 */
export async function refreshTokens(): Promise<AuthTokens> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refresh_token = getRefreshToken();
  if (!refresh_token) {
    return Promise.reject({ status: 401, error: "no_refresh_token" } as ApiError);
  }

  refreshPromise = (async () => {
    try {
      const res = await appFetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token }),
      });

      if (!res.ok) {
        // Refresh-токен невалиден/отозван/истёк — сессию не спасти, разлогиниваем.
        clearTokens();
        const data = await res.json().catch(() => ({}));
        throw { status: res.status, ...data } as ApiError;
      }

      const tokens = (await res.json()) as AuthTokens;
      saveTokens(tokens);
      return tokens;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Принудительно обновить access-токен (используется при 401 от ресурс-сервера,
 * даже если по нашим часам токен ещё «жив»: секрет мог смениться, токен —
 * быть отозван). Возвращает новый access или null, если refresh не удался.
 */
export async function tryRefresh(): Promise<string | null> {
  if (!getRefreshToken()) {
    return null;
  }
  try {
    const tokens = await refreshTokens();
    return tokens.access_token;
  } catch {
    return null;
  }
}

/**
 * Валидный access-токен для запроса: если текущий истёк (или вот-вот истечёт) —
 * проактивно обновляет его перед запросом. null — если пользователь не залогинен
 * или refresh не удался.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const token = getAccessToken();
  if (!token) {
    return null;
  }
  if (!isAccessTokenExpired()) {
    return token;
  }
  if (!getRefreshToken()) {
    clearTokens();
    return null;
  }
  return tryRefresh();
}

/**
 * fetch с авто-управлением access-токеном:
 *  1) перед запросом подставляет валидный access (обновив, если истёк);
 *  2) при 401 один раз пробует refresh и повторяет запрос;
 *  3) если и после refresh 401 — чистит токены; при retryAnonymously=true
 *     (публичные GET) повторяет запрос без Authorization.
 * Возвращает Response — разбор тела остаётся на вызывающем коде.
 */
export async function authedFetch(
  input: string,
  init: RequestInit = {},
  opts: { retryAnonymously?: boolean } = {}
): Promise<Response> {
  const withAuth = (token: string | null): RequestInit => {
    const headers = new Headers(init.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      headers.delete("Authorization");
    }
    return { ...init, headers };
  };

  let token = await getValidAccessToken();
  let res = await appFetch(input, withAuth(token));

  if (res.status === 401 && token) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await appFetch(input, withAuth(refreshed));
    }
    if (res.status === 401) {
      clearTokens();
      if (opts.retryAnonymously) {
        res = await appFetch(input, withAuth(null));
      }
    }
  }

  return res;
}

/**
 * Выход
 * POST /auth/logout
 */
export async function logout(): Promise<void> {
  const access_token = getAccessToken();
  const refresh_token = getRefreshToken();
  const res = await appFetch(`${BASE_URL}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({ refresh_token }),
  });
  clearTokens();
  return handleResponse<void>(res);
}

export interface ChangePasswordResponse {
  message: string;
}

/**
 * Смена пароля текущего авторизованного пользователя.
 * POST /auth/password-change (Bearer).
 * Ответ 200: { message: "password has been changed" }.
 *
 * Бэкенд отзывает все refresh-токены, новую пару токенов не выдаёт —
 * уже выданный access JWT живёт до истечения TTL (≤30 мин), после чего
 * клиенту нужно залогиниться заново.
 *
 * Ошибки (status в брошенном объекте):
 *   400 — { error: "invalid request body" } |
 *         { error: "old_password and new_password are required" }
 *   401 — нет/битый токен (plain-text "Unauthorized: token missing",
 *         "invalid token", "token expired" → { error: <текст> }) либо
 *         неверный старый пароль { error: "invalid credentials" }
 *   500 — { error: "internal server error" }
 */
export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<ChangePasswordResponse> {
  // Проактивно обновляем access, если он истёк, чтобы смена пароля не падала
  // на 401 у активного, но «засидевшегося» пользователя.
  const access_token = (await getValidAccessToken()) ?? getAccessToken();
  const res = await appFetch(`${BASE_URL}/auth/password-change`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
    }),
  });
  return handleJsonOrText<ChangePasswordResponse>(res);
}

// При загрузке модуля (старт приложения / перезагрузка вкладки) поднимаем
// таймер автообновления, если в localStorage уже лежит активная сессия. Если
// access уже истёк — таймер сработает с нулевой задержкой и сразу обновит его.
scheduleAutoRefresh();
