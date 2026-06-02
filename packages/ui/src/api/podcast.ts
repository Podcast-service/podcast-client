import { getAccessToken, setAccessToken, authedFetch } from "./auth";

/**
 * Базовый путь podcast-core. По умолчанию относительный (/podcast/v1):
 * в проде фронт отдаётся с castapp.ru (тот же origin), а в dev запросы
 * проксируются на castapp.ru через Vite (см. apps/web/vite.config.ts).
 * Можно переопределить абсолютным URL через VITE_PODCAST_API_URL.
 */
const BASE_URL =
  (import.meta as any).env?.VITE_PODCAST_API_URL ?? "/podcast/v1";

// ───── Типы из OpenAPI (podcast-service-dev) ─────

export type PodcastStatus =
  | "DRAFT"
  | "UPLOADING"
  | "UPLOADED"
  | "PROCESSING"
  | "PROCESSED"
  | "PUBLISHED"
  | "FAILED"
  | "ARCHIVED";

export type SortPodcasts = "DATE_DESC" | "DATE_ASC" | "RATING" | "VIEWS";

export type SortPlaylists = "DATE_DESC" | "DATE_ASC" | "RATING";

export type SortAuthors = "POPULAR" | "SUBSCRIBERS" | "DATE_DESC";

export type SortLikedPodcasts = "DATE_DESC" | "DATE_ASC";

export type VoteType = "LIKE" | "DISLIKE";

export type Theme = "DARK" | "LIGHT";

export type Language = "RU" | "EN";

export type SearchType = "ALL" | "PODCAST" | "AUTHOR" | "PLAYLIST";

export type SearchSort = "RELEVANCE" | "DATE" | "RATING" | "VIEWS";

export interface AuthorCard {
  id: string;
  authorName: string;
  avatarUrl?: string | null;
  subscribersCount?: number | null;
  isSubscribed?: boolean | null;
}

export interface CategoryResponse {
  id: string;
  name: string;
  position: number;
}

export interface PodcastCard {
  id: string;
  title: string;
  author: AuthorCard;
  category?: CategoryResponse | null;
  coverImageUrl?: string | null;
  durationSeconds?: number | null;
  num_speakers: number;
  status: PodcastStatus;
  viewsCount: number;
  likesCount: number;
  dislikesCount: number;
  publishedAt?: string | null;
  createdAt: string;
  currentUserVote?: VoteType | null;
  progressSeconds?: number | null;
  progressPercent?: number | null;
}

export interface PodcastDetailResponse extends PodcastCard {
  description?: string | null;
  audioUrl?: string | null;
  audio_url_file?: string | null;
  audio_size_file?: number | null;
  hasTranscript?: boolean | null;
  hasSummary?: boolean | null;
}

/** Одна реплика транскрипта: текст + голос (спикер). */
export interface PodcastTranscriptSegment {
  text: string;
  /** Идентификатор голоса из TTS (напр. "aidar", "xenia"). */
  voice: string;
  /** Порядковый номер спикера (1..N) — по порядку появления голоса. */
  speakerId: number;
}

export interface PodcastTranscriptResponse {
  podcastId: string;
  language: string;
  /** Плоский текст транскрипта (для поиска / обратной совместимости). */
  content: string;
  /** Структурированные реплики по спикерам (если бэкенд их прислал). */
  segments: PodcastTranscriptSegment[];
  generatedAt: string;
}

export interface PodcastSummaryResponse {
  podcastId: string;
  language: string;
  content: string;
  generatedAt: string;
}

export interface PodcastSpeakersResponse {
  podcastId: string;
  num_speakers: number;
}

const normalizeTextContent = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const lines = value
      .map((item) => normalizeTextContent(item))
      .filter((item): item is string => Boolean(item?.trim()));
    return lines.length > 0 ? lines.join("\n") : null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["content", "text", "transcript", "summary", "value"]) {
      const normalized = normalizeTextContent(record[key]);
      if (normalized?.trim()) {
        return normalized;
      }
    }
  }

  return null;
};

/**
 * Разбирает поле content транскрипта в структурированные реплики.
 * Новый формат бэкенда — массив { text, voice }; голосам назначаются
 * speakerId по порядку первого появления. Старый формат (строка) тоже
 * поддерживается: каждая непустая строка считается отдельной репликой.
 */
const parseTranscriptSegments = (
  content: unknown
): PodcastTranscriptSegment[] => {
  const voiceToSpeaker = new Map<string, number>();
  const speakerIdFor = (voice: string): number => {
    const key = voice.trim().toLowerCase();
    if (!voiceToSpeaker.has(key)) {
      voiceToSpeaker.set(key, voiceToSpeaker.size + 1);
    }
    return voiceToSpeaker.get(key)!;
  };

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        const record =
          item && typeof item === "object"
            ? (item as Record<string, unknown>)
            : {};
        const text = normalizeTextContent(record.text ?? item)?.trim() ?? "";
        const voice =
          typeof record.voice === "string" ? record.voice.trim() : "";
        return { text, voice };
      })
      .filter((item) => item.text.length > 0)
      .map((item) => ({
        text: item.text,
        voice: item.voice,
        speakerId: speakerIdFor(item.voice || "speaker"),
      }));
  }

  const flat = normalizeTextContent(content);
  if (!flat) {
    return [];
  }

  return flat
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, index) => ({
      text: line,
      voice: "",
      speakerId: (index % 2) + 1,
    }));
};

const normalizePodcastTextResponse = <
  T extends PodcastTranscriptResponse | PodcastSummaryResponse
>(
  data: unknown,
  podcastId: string,
  fallbackKeys: string[]
): T => {
  const record =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};

  const content =
    normalizeTextContent(record.content) ??
    normalizeTextContent(fallbackKeys.map((key) => record[key])) ??
    normalizeTextContent(data) ??
    "";

  return {
    ...record,
    podcastId:
      typeof record.podcastId === "string" ? record.podcastId : podcastId,
    language: typeof record.language === "string" ? record.language : "",
    content,
    generatedAt:
      typeof record.generatedAt === "string" ? record.generatedAt : "",
  } as T;
};

export interface AuthorProfileResponse {
  id: string;
  userId: string;
  authorName: string;
  avatarUrl?: string | null;
  description?: string | null;
  subscribersCount: number;
  isSubscribed?: boolean | null;
  createdAt: string;
}

export interface PlaylistOwnerResponse {
  id: string;
  username: string;
}

export interface PlaylistCard {
  id: string;
  title: string;
  coverImageUrl?: string | null;
  owner: PlaylistOwnerResponse;
  isPublic: boolean;
  podcastsCount: number;
  likesCount: number;
  dislikesCount: number;
  createdAt: string;
  currentUserVote?: VoteType | null;
}

export interface PlaylistPodcastItem extends PodcastCard {
  position: number;
}

export interface PlaylistDetailResponse extends PlaylistCard {
  description?: string | null;
  updatedAt?: string;
  podcasts?: PlaylistPodcastItem[];
}

export interface PageMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PageOf<T> {
  items: T[];
  meta: PageMeta;
}

export type PageOfPodcastCard = PageOf<PodcastCard>;
export type PageOfPodcastDetail = PageOf<PodcastDetailResponse>;
export type PageOfPlaylistCard = PageOf<PlaylistCard>;
export type PageOfAuthorCard = PageOf<AuthorCard>;

export interface VoteResponse {
  targetId: string;
  targetType: "PODCAST" | "PLAYLIST";
  likesCount: number;
  dislikesCount: number;
  currentUserVote?: VoteType | null;
}

export interface AuthorSubscriptionResponse {
  authorId: string;
  subscribersCount: number;
  isSubscribed: boolean;
}

export interface PlaylistSaveResponse {
  playlistId: string;
  isSaved: boolean;
}

export interface UserProfilePrivateResponse {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  createdAt: string;
  theme?: Theme;
  language?: Language;
}

export interface UserSettingsResponse {
  theme?: Theme;
  language?: Language;
}

export interface SearchSuggestItem {
  type: "PODCAST" | "AUTHOR" | "PLAYLIST";
  id: string;
  label: string;
  coverUrl?: string | null;
}

export interface SearchResponse {
  podcasts?: PageOfPodcastCard;
  authors?: PageOfAuthorCard;
  playlists?: PageOfPlaylistCard;
}

export interface ApiError {
  code?: string;
  message?: string;
  status?: number;
}

// ───── Низкоуровневый клиент ─────

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as T;
  }

  const raw = await res.text();
  let data: any = undefined;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      // Тело не JSON: при ошибке отдаём как message, при «успехе» это
      // признак того, что запрос не дошёл до API (напр. SPA index.html
      // вместо проксированного /podcast/v1) — не глотаем в {}, а кидаем.
      data = { message: raw.slice(0, 200) };
    }
  }

  if (!res.ok) {
    throw { status: res.status, ...(data ?? {}) } as ApiError;
  }

  // Успех, но тело пустое или не-JSON — для ручек, ожидающих JSON, это
  // некорректный ответ. Бросаем, чтобы страница показала состояние ошибки,
  // а не падала на result.items / result.meta.
  if (data === undefined || typeof data !== "object") {
    throw {
      status: res.status,
      message: "Некорректный ответ сервера (ожидался JSON)",
    } as ApiError;
  }

  return data as T;
}

const PROTECTED_GET_PREFIXES = [
  "/users/me",
  "/authors/me",
];

const canRetryAnonymously = (path: string): boolean =>
  !PROTECTED_GET_PREFIXES.some((prefix) => path.startsWith(prefix));

/**
 * GET-запрос к podcast-core. Bearer-токен добавляется автоматически,
 * если пользователь авторизован (часть ручек публичны, но при наличии
 * токена возвращают доп. поля: currentUserVote, isSubscribed и т.д.).
 */
async function apiGet<T>(path: string, query?: object): Promise<T> {
  // window.location.origin как база — корректно резолвит и относительный,
  // и абсолютный BASE_URL.
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  // authedFetch сам подставляет/обновляет access-токен и при 401 пробует
  // refresh. Для публичных ручек разрешаем анонимный повтор, если refresh
  // не удался (защищённые /users/me, /authors/me — нет).
  const res = await authedFetch(
    url.toString(),
    {},
    { retryAnonymously: canRetryAnonymously(path) }
  );

  return handleResponse<T>(res);
}

/** POST/PUT/DELETE к podcast-core с авторизацией. */
async function apiSend<T>(
  method: "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const res = await authedFetch(`${BASE_URL}${path}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return handleResponse<T>(res);
}

/** Залогинен ли пользователь (есть ли access token). */
export const isAuthenticated = (): boolean => Boolean(getAccessToken());

// ───── Podcasts ─────

export interface GetPodcastsParams {
  q?: string;
  categoryId?: string;
  authorId?: string;
  sort?: SortPodcasts;
  page?: number;
  size?: number;
}

/** Список опубликованных подкастов. GET /podcasts — публичная ручка. */
export function getPodcasts(
  params: GetPodcastsParams = {}
): Promise<PageOfPodcastCard> {
  return apiGet<PageOfPodcastCard>("/podcasts", params);
}

/** Детальная карточка подкаста. GET /podcasts/{id}. */
export function getPodcast(podcastId: string): Promise<PodcastDetailResponse> {
  return apiGet<PodcastDetailResponse>(`/podcasts/${podcastId}`);
}

/** Транскрипт подкаста. GET /podcasts/{id}/transcript — 404, если не готов. */
export function getPodcastTranscript(
  podcastId: string
): Promise<PodcastTranscriptResponse> {
  return apiGet<unknown>(`/podcasts/${podcastId}/transcript`).then((data) => {
    const record =
      data && typeof data === "object" && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : {};

    // Сырое содержимое: либо массив { text, voice } в record.content,
    // либо сам ответ — массив, либо строка под одним из fallback-ключей.
    const rawContent =
      record.content ??
      (Array.isArray(data) ? data : undefined) ??
      record.transcript ??
      record.text ??
      data;

    const segments = parseTranscriptSegments(rawContent);
    const content =
      segments.length > 0
        ? segments.map((segment) => segment.text).join("\n")
        : normalizeTextContent(rawContent) ?? "";

    return {
      podcastId:
        typeof record.podcastId === "string" ? record.podcastId : podcastId,
      language: typeof record.language === "string" ? record.language : "",
      content,
      segments,
      generatedAt:
        typeof record.generatedAt === "string" ? record.generatedAt : "",
    };
  });
}

/** Summary подкаста. GET /podcasts/{id}/summary — 404, если не готов. */
export function getPodcastSummary(
  podcastId: string
): Promise<PodcastSummaryResponse> {
  return apiGet<unknown>(`/podcasts/${podcastId}/summary`).then((data) =>
    normalizePodcastTextResponse<PodcastSummaryResponse>(data, podcastId, [
      "summary",
      "text",
    ])
  );
}

/** Количество спикеров подкаста. GET /podcasts/{id}/speakers. */
export function getPodcastSpeakers(
  podcastId: string
): Promise<PodcastSpeakersResponse> {
  return apiGet<PodcastSpeakersResponse>(`/podcasts/${podcastId}/speakers`);
}

export interface CreatePodcastRequest {
  title: string;
  description?: string | null;
  categoryId?: string | null;
  coverImageUrl?: string | null;
  num_speakers: number;
}

/** Создать подкаст. POST /podcasts. */
export function createPodcast(
  body: CreatePodcastRequest
): Promise<PodcastDetailResponse> {
  return apiSend<PodcastDetailResponse>("POST", "/podcasts", body);
}

export interface UpdatePodcastRequest {
  title?: string;
  description?: string | null;
  categoryId?: string | null;
  coverImageUrl?: string | null;
}

/** Обновить подкаст. PUT /podcasts/{id}. */
export function updatePodcast(
  podcastId: string,
  body: UpdatePodcastRequest
): Promise<PodcastDetailResponse> {
  return apiSend<PodcastDetailResponse>("PUT", `/podcasts/${podcastId}`, body);
}

/** Архивировать подкаст. DELETE /podcasts/{id}. */
export function deletePodcast(podcastId: string): Promise<void> {
  return apiSend<void>("DELETE", `/podcasts/${podcastId}`);
}

/**
 * Опубликовать подкаст. POST /podcasts/{id}/publish (только автор-владелец).
 * Переводит подкаст из PROCESSED в публичный доступ; бэкенд отвечает 202 и
 * возвращает актуальный PodcastDetailResponse.
 */
export function publishPodcast(
  podcastId: string
): Promise<PodcastDetailResponse> {
  return apiSend<PodcastDetailResponse>(
    "POST",
    `/podcasts/${podcastId}/publish`
  );
}

/** Сохранить прогресс прослушивания. POST /podcasts/{id}/progress. */
export function savePodcastProgress(
  podcastId: string,
  progressSeconds: number
): Promise<void> {
  return apiSend<void>("POST", `/podcasts/${podcastId}/progress`, {
    progressSeconds,
  });
}

// ───── Categories ─────

/** Список всех категорий. GET /categories — публичная ручка. */
export function getCategories(): Promise<CategoryResponse[]> {
  return apiGet<CategoryResponse[]>("/categories");
}

export interface CreateCategoryRequest {
  name: string;
  position?: number;
}

/** Создать категорию. POST /categories (ADMIN). */
export function createCategory(
  body: CreateCategoryRequest
): Promise<CategoryResponse> {
  return apiSend<CategoryResponse>("POST", "/categories", body);
}

export interface UpdateCategoryRequest {
  name?: string;
  position?: number;
}

/** Обновить категорию. PUT /categories/{id} (ADMIN). */
export function updateCategory(
  categoryId: string,
  body: UpdateCategoryRequest
): Promise<CategoryResponse> {
  return apiSend<CategoryResponse>("PUT", `/categories/${categoryId}`, body);
}

/** Удалить категорию. DELETE /categories/{id} (ADMIN). */
export function deleteCategory(categoryId: string): Promise<void> {
  return apiSend<void>("DELETE", `/categories/${categoryId}`);
}

// ───── Authors ─────

/** Список авторов. GET /authors — публичная ручка с опциональным bearer. */
export function getAuthors(
  params: { q?: string; sort?: SortAuthors; page?: number; size?: number } = {}
): Promise<PageOfAuthorCard> {
  return apiGet<PageOfAuthorCard>("/authors", params);
}

/** Публичный профиль автора. GET /authors/{id}. */
export function getAuthor(authorId: string): Promise<AuthorProfileResponse> {
  return apiGet<AuthorProfileResponse>(`/authors/${authorId}`);
}

/** Опубликованные подкасты автора. GET /authors/{id}/podcasts. */
export function getAuthorPodcasts(
  authorId: string,
  params: { q?: string; sort?: SortPodcasts; page?: number; size?: number } = {}
): Promise<PageOfPodcastCard> {
  return apiGet<PageOfPodcastCard>(`/authors/${authorId}/podcasts`, params);
}

/** Все подкасты текущего автора, включая черновики и обработку. GET /authors/me/podcasts. */
export function getMyAuthorPodcasts(
  params: {
    status?: PodcastStatus;
    q?: string;
    sort?: SortPodcasts;
    page?: number;
    size?: number;
  } = {}
): Promise<PageOfPodcastDetail> {
  return apiGet<PageOfPodcastDetail>("/authors/me/podcasts", params);
}

/** Публичные плейлисты автора. GET /authors/{id}/playlists. */
export function getAuthorPlaylists(
  authorId: string,
  params: { page?: number; size?: number } = {}
): Promise<PageOfPlaylistCard> {
  return apiGet<PageOfPlaylistCard>(`/authors/${authorId}/playlists`, params);
}

// ───── Playlists ─────

/** Публичные плейлисты. GET /playlists — публичная ручка. */
export function getPlaylists(
  params: { q?: string; sort?: SortPlaylists; page?: number; size?: number } = {}
): Promise<PageOfPlaylistCard> {
  return apiGet<PageOfPlaylistCard>("/playlists", params);
}

/** Плейлист с треклистом. GET /playlists/{id}. */
export function getPlaylist(
  playlistId: string
): Promise<PlaylistDetailResponse> {
  return apiGet<PlaylistDetailResponse>(`/playlists/${playlistId}`);
}

export interface CreatePlaylistRequest {
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  isPublic?: boolean;
}

/** Создать плейлист. POST /playlists. */
export function createPlaylist(
  body: CreatePlaylistRequest
): Promise<PlaylistDetailResponse> {
  return apiSend<PlaylistDetailResponse>("POST", "/playlists", body);
}

export interface UpdatePlaylistRequest {
  title?: string;
  description?: string | null;
  coverImageUrl?: string | null;
  isPublic?: boolean;
}

/** Обновить плейлист. PUT /playlists/{id}. */
export function updatePlaylist(
  playlistId: string,
  body: UpdatePlaylistRequest
): Promise<PlaylistDetailResponse> {
  return apiSend<PlaylistDetailResponse>(
    "PUT",
    `/playlists/${playlistId}`,
    body
  );
}

/** Удалить плейлист (только владелец). DELETE /playlists/{id}. */
export function deletePlaylist(playlistId: string): Promise<void> {
  return apiSend<void>("DELETE", `/playlists/${playlistId}`);
}

/** Добавить подкаст в плейлист (только владелец). POST /playlists/{id}/podcasts. */
export function addPodcastToPlaylist(
  playlistId: string,
  podcastId: string
): Promise<PlaylistDetailResponse> {
  return apiSend<PlaylistDetailResponse>(
    "POST",
    `/playlists/${playlistId}/podcasts`,
    { podcastId }
  );
}

/** Убрать подкаст из плейлиста. DELETE /playlists/{playlistId}/podcasts/{podcastId}. */
export function removePodcastFromPlaylist(
  playlistId: string,
  podcastId: string
): Promise<void> {
  return apiSend<void>(
    "DELETE",
    `/playlists/${playlistId}/podcasts/${podcastId}`
  );
}

/** Сохранить чужой плейлист в библиотеку. POST /playlists/{id}/save. */
export function savePlaylistToLibrary(
  playlistId: string
): Promise<PlaylistSaveResponse> {
  return apiSend<PlaylistSaveResponse>(
    "POST",
    `/playlists/${playlistId}/save`
  );
}

/** Убрать плейлист из библиотеки. DELETE /playlists/{id}/save. */
export function removePlaylistFromLibrary(
  playlistId: string
): Promise<PlaylistSaveResponse> {
  return apiSend<PlaylistSaveResponse>(
    "DELETE",
    `/playlists/${playlistId}/save`
  );
}

export interface ReorderPlaylistItem {
  podcastId: string;
  position: number;
}

/** Изменить порядок подкастов в плейлисте. PUT /playlists/{id}/podcasts/reorder. */
export function reorderPlaylistPodcasts(
  playlistId: string,
  items: ReorderPlaylistItem[]
): Promise<PlaylistDetailResponse> {
  return apiSend<PlaylistDetailResponse>(
    "PUT",
    `/playlists/${playlistId}/podcasts/reorder`,
    { items }
  );
}

// ───── Votes (требуют bearer) ─────

/** Проголосовать за подкаст. POST /podcasts/{id}/vote. */
export function votePodcast(
  podcastId: string,
  voteType: VoteType
): Promise<VoteResponse> {
  return apiSend<VoteResponse>("POST", `/podcasts/${podcastId}/vote`, {
    voteType,
  });
}

/** Отозвать голос с подкаста. DELETE /podcasts/{id}/vote. */
export function removePodcastVote(podcastId: string): Promise<VoteResponse> {
  return apiSend<VoteResponse>("DELETE", `/podcasts/${podcastId}/vote`);
}

/** Проголосовать за плейлист. POST /playlists/{id}/vote. */
export function votePlaylist(
  playlistId: string,
  voteType: VoteType
): Promise<VoteResponse> {
  return apiSend<VoteResponse>("POST", `/playlists/${playlistId}/vote`, {
    voteType,
  });
}

/** Отозвать голос с плейлиста. DELETE /playlists/{id}/vote. */
export function removePlaylistVote(playlistId: string): Promise<VoteResponse> {
  return apiSend<VoteResponse>("DELETE", `/playlists/${playlistId}/vote`);
}

// ───── Subscriptions (требуют bearer) ─────

/** Подписаться на автора. POST /authors/{id}/subscribe. */
export function subscribeAuthor(
  authorId: string
): Promise<AuthorSubscriptionResponse> {
  return apiSend<AuthorSubscriptionResponse>(
    "POST",
    `/authors/${authorId}/subscribe`
  );
}

/** Отписаться от автора. DELETE /authors/{id}/subscribe. */
export function unsubscribeAuthor(
  authorId: string
): Promise<AuthorSubscriptionResponse> {
  return apiSend<AuthorSubscriptionResponse>(
    "DELETE",
    `/authors/${authorId}/subscribe`
  );
}

// ───── Current user ─────

/** Свой профиль. GET /users/me/profile (требует bearer). */
export function getMyProfile(): Promise<UserProfilePrivateResponse> {
  return apiGet<UserProfilePrivateResponse>("/users/me/profile");
}

/** Мои плейлисты. GET /users/me/playlists (требует bearer). */
export function getMyPlaylists(
  params: { page?: number; size?: number } = {}
): Promise<PageOfPlaylistCard> {
  return apiGet<PageOfPlaylistCard>("/users/me/playlists", params);
}

/** Лайкнутые подкасты. GET /users/me/liked-podcasts. */
export function getMyLikedPodcasts(
  params: { page?: number; size?: number; sort?: SortLikedPodcasts } = {}
): Promise<PageOfPodcastCard> {
  return apiGet<PageOfPodcastCard>("/users/me/liked-podcasts", params);
}

/** Сохранённые чужие плейлисты. GET /users/me/library/playlists. */
export function getMyLibraryPlaylists(
  params: { page?: number; size?: number } = {}
): Promise<PageOfPlaylistCard> {
  return apiGet<PageOfPlaylistCard>("/users/me/library/playlists", params);
}

/** Настройки пользователя. GET /users/me/settings. */
export function getMySettings(): Promise<UserSettingsResponse> {
  return apiGet<UserSettingsResponse>("/users/me/settings");
}

/** Обновить настройки пользователя. PUT /users/me/settings. */
export function updateMySettings(
  body: Partial<UserSettingsResponse>
): Promise<UserSettingsResponse> {
  return apiSend<UserSettingsResponse>("PUT", "/users/me/settings", body);
}

export interface SubscriptionResponse {
  author: AuthorCard;
  subscribedAt: string;
}

export type PageOfSubscription = PageOf<SubscriptionResponse>;

/** Мои подписки. GET /users/me/subscriptions (требует bearer). */
export function getMySubscriptions(
  params: { page?: number; size?: number } = {}
): Promise<PageOfSubscription> {
  return apiGet<PageOfSubscription>("/users/me/subscriptions", params);
}

/** Лента подписок. GET /users/me/subscriptions/feed. */
export function getMySubscriptionsFeed(
  params: { sort?: SortPodcasts; page?: number; size?: number } = {}
): Promise<PageOfPodcastCard> {
  return apiGet<PageOfPodcastCard>("/users/me/subscriptions/feed", params);
}

export interface ListenHistoryItem {
  podcast: PodcastCard;
  progressSeconds: number;
  progressPercent?: number | null;
  completed: boolean;
  lastListenedAt: string;
}

export type PageOfListenHistory = PageOf<ListenHistoryItem>;

/** История прослушивания. GET /users/me/history (требует bearer). */
export function getMyHistory(
  params: { page?: number; size?: number } = {}
): Promise<PageOfListenHistory> {
  return apiGet<PageOfListenHistory>("/users/me/history", params);
}

/** Профиль автора текущего пользователя. GET /authors/me (200 — автор; 403/404 — нет). */
export function getMyAuthorProfile(): Promise<AuthorProfileResponse> {
  return apiGet<AuthorProfileResponse>("/authors/me");
}

export interface UpdateUserProfileRequest {
  username?: string;
  avatarUrl?: string | null;
}

/** Обновить свой профиль. PUT /users/me/profile. */
export function updateMyProfile(
  body: UpdateUserProfileRequest
): Promise<UserProfilePrivateResponse> {
  return apiSend<UserProfilePrivateResponse>("PUT", "/users/me/profile", body);
}

export interface CreateAuthorProfileRequest {
  authorName: string;
  description?: string | null;
}

/**
 * Ответ POST /authors/me: auth-service выдаёт новый access_token с ролью
 * author, а podcast-service возвращает (или создаёт) профиль автора.
 */
export interface BecomeAuthorResponse {
  access_token: string;
  expires_in: number;
  author_profile: AuthorProfileResponse;
}

/**
 * Стать автором. POST /authors/me.
 * В ответе приходит новый access_token (уже с ролью author) — перезаписываем
 * сохранённый токен, чтобы последующие запросы шли с обновлёнными правами.
 */
export async function createAuthorProfile(
  body: CreateAuthorProfileRequest
): Promise<BecomeAuthorResponse> {
  const res = await apiSend<BecomeAuthorResponse>("POST", "/authors/me", body);
  if (res?.access_token) {
    setAccessToken(res.access_token);
  }
  return res;
}

/** Обновить профиль автора. PUT /authors/me. */
export function updateMyAuthorProfile(
  body: { authorName?: string; description?: string | null }
): Promise<AuthorProfileResponse> {
  return apiSend<AuthorProfileResponse>("PUT", "/authors/me", body);
}

// ───── Search ─────

/** Подсказки поиска. GET /search/suggest. */
export function getSearchSuggestions(
  q: string
): Promise<SearchSuggestItem[]> {
  return apiGet<SearchSuggestItem[]>("/search/suggest", { q });
}

/** Полнотекстовый поиск. GET /search. */
export function search(
  params: {
    q: string;
    type?: SearchType;
    categoryId?: string;
    sort?: SearchSort;
    page?: number;
    size?: number;
  }
): Promise<SearchResponse> {
  return apiGet<SearchResponse>("/search", params);
}
