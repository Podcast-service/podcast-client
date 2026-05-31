const BASE_URL = "http://186.246.30.30";

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

export const saveTokens = (tokens: AuthTokens) => {
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
};

export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

export const getAccessToken = () => localStorage.getItem("access_token");
export const getRefreshToken = () => localStorage.getItem("refresh_token");


async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw { status: res.status, ...data };
  }
  return data as T;
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