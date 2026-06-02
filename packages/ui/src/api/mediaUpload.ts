import { authedFetch, getAccessToken } from "./auth";

const BASE_URL = (
  (import.meta as any).env?.VITE_MEDIA_UPLOAD_API_URL ?? ""
).replace(/\/+$/, "");

export const MAX_MEDIA_UPLOAD_SIZE = 50 * 1024 * 1024;

export interface MediaUploadResponse {
  success: boolean;
  type?: "audio" | "profile_cover" | "podcast_cover" | "playlist_cover" | string;
  object_id?: string;
  url?: string;
  size?: number;
  content_type?: string;
  filename?: string;
  message?: string;
  error?: string;
}

export interface SuccessfulMediaUploadResponse extends MediaUploadResponse {
  success: true;
  url: string;
}

export interface MediaUploadError {
  status?: number;
  message?: string;
  error?: string;
}

const endpoints = {
  audio: "/api/media/upload_audio",
  profileCover: "/api/media/upload_cover_profile",
  podcastCover: "/api/media/upload_cover_podcast",
  playlistCover: "/api/media/upload_cover_playlist",
};

async function uploadMedia(
  endpoint: string,
  fileField: "audio" | "image",
  file: File,
  objectField?: { name: "id_podcast" | "id_playlist"; value: string }
): Promise<SuccessfulMediaUploadResponse> {
  const token = getAccessToken();
  if (!token) {
    throw {
      status: 401,
      message: "Нужно войти в аккаунт перед загрузкой файла",
    } satisfies MediaUploadError;
  }

  if (file.size > MAX_MEDIA_UPLOAD_SIZE) {
    throw {
      status: 413,
      message: "Файл больше 50 MB",
    } satisfies MediaUploadError;
  }

  const formData = new FormData();
  if (objectField) {
    formData.append(objectField.name, objectField.value);
  }
  formData.append(fileField, file);

  // authedFetch сам подставит/обновит access-токен и при 401 попробует refresh.
  const res = await authedFetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    body: formData,
  });

  const data = (await res.json().catch(() => ({}))) as MediaUploadResponse;

  if (!res.ok || data.success === false) {
    throw {
      status: res.status,
      message: data.message || data.error || "Не удалось загрузить файл",
      error: data.error,
    } satisfies MediaUploadError;
  }

  if (!data.url) {
    throw {
      status: res.status,
      message: "Сервис загрузки не вернул URL файла",
    } satisfies MediaUploadError;
  }

  return data as SuccessfulMediaUploadResponse;
}

export function uploadPodcastAudio(
  podcastId: string,
  file: File
): Promise<SuccessfulMediaUploadResponse> {
  return uploadMedia(endpoints.audio, "audio", file, {
    name: "id_podcast",
    value: podcastId,
  });
}

export function uploadProfileCover(
  file: File
): Promise<SuccessfulMediaUploadResponse> {
  return uploadMedia(endpoints.profileCover, "image", file);
}

export function uploadPodcastCover(
  podcastId: string,
  file: File
): Promise<SuccessfulMediaUploadResponse> {
  return uploadMedia(endpoints.podcastCover, "image", file, {
    name: "id_podcast",
    value: podcastId,
  });
}

export function uploadPlaylistCover(
  playlistId: string,
  file: File
): Promise<SuccessfulMediaUploadResponse> {
  return uploadMedia(endpoints.playlistCover, "image", file, {
    name: "id_playlist",
    value: playlistId,
  });
}
