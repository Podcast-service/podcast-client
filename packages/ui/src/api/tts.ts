import { clearTokens, getAccessToken } from "./auth";

/**
 * Базовый хост tts-сервиса. По умолчанию same-origin:
 * в проде запросы маршрутизирует nginx, в dev — Vite proxy.
 * Переопределяется через VITE_TTS_API_URL.
 */
const BASE_URL = (
  (import.meta as any).env?.VITE_TTS_API_URL ?? ""
).replace(/\/+$/, "");

/** Одна реплика: текст + голос (имя спикера). */
export interface TtsTextBlock {
  text: string;
  voice: string;
}

export interface TtsGenerateRequest {
  id_podcast: string;
  text: TtsTextBlock[];
}

export interface TtsGenerateResponse {
  id_podcast: string;
  status: string;
}

export interface TtsError {
  status?: number;
  message?: string;
  detail?: unknown;
}

/**
 * Запустить генерацию подкаста из текста. POST /api/tts/generate.
 * Ответ 202 — задача принята в очередь; 422 — ошибка валидации (FastAPI).
 */
export async function generateTts(
  body: TtsGenerateRequest
): Promise<TtsGenerateResponse> {
  const token = getAccessToken();

  const res = await fetch(`${BASE_URL}/api/tts/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, any>;

  if (res.status === 401) {
    clearTokens();
  }

  if (!res.ok) {
    throw {
      status: res.status,
      message:
        typeof data?.detail === "string"
          ? data.detail
          : data?.message || "Не удалось запустить генерацию",
      detail: data?.detail,
    } satisfies TtsError;
  }

  return data as TtsGenerateResponse;
}
