// Базовый путь auth-service. По умолчанию относительный (эндпоинты /auth/*):
// в проде — тот же origin (castapp.ru), в dev — прокси Vite на castapp.ru.
// Можно переопределить абсолютным URL через VITE_AUTH_API_URL.
const BASE_URL = (import.meta as any).env?.VITE_AUTH_API_URL ?? "";

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
};

export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
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
};

export const getAccessToken = () => localStorage.getItem("access_token");
export const getRefreshToken = () => localStorage.getItem("refresh_token");

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


async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
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
  const res = await fetch(`${BASE_URL}/auth/register`, {
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
  const res = await fetch(`${BASE_URL}/auth/verify-email`, {
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
  const res = await fetch(`${BASE_URL}/auth/resend-verification`, {
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
  const res = await fetch(`${BASE_URL}/auth/login`, {
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
  const res = await fetch(`${BASE_URL}/auth/password-reset/request`, {
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
  const res = await fetch(`${BASE_URL}/auth/password-reset/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, new_password }),
  });
  return handleResponse<void>(res);
}

/**
 * Обновление токенов
 * POST /auth/refresh
 */
export async function refreshTokens(): Promise<AuthTokens> {
  const refresh_token = getRefreshToken();
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });
  return handleResponse<AuthTokens>(res);
}

/**
 * Выход
 * POST /auth/logout
 */
export async function logout(): Promise<void> {
  const access_token = getAccessToken();
  const refresh_token = getRefreshToken();
  const res = await fetch(`${BASE_URL}/auth/logout`, {
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
  const access_token = getAccessToken();
  const res = await fetch(`${BASE_URL}/auth/password-change`, {
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