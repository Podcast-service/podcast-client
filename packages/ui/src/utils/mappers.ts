import { formatClock, formatRuDate } from "./format";
import type { PodcastCard, PodcastStatus, VoteType } from "../api/podcast";

export type PublishStatus =
  | "draft"
  | "processing"
  | "ready"
  | "published"
  | "error";

/**
 * Статус подкаста из API → состояние блока публикации (PodcastPublishStatus).
 * - PROCESSING / UPLOADING / UPLOADED → «Обработка файла»
 * - PROCESSED                        → «Готов к публикации» (можно публиковать)
 * - PUBLISHED                        → «Опубликован»
 * - FAILED                           → «Ошибка»
 * - DRAFT / ARCHIVED / прочее        → черновик
 */
export const toPublishStatus = (status?: PodcastStatus): PublishStatus => {
  if (status === "PUBLISHED") return "published";
  if (status === "PROCESSED") return "ready";
  if (
    status === "UPLOADING" ||
    status === "UPLOADED" ||
    status === "PROCESSING"
  )
    return "processing";
  if (status === "FAILED") return "error";
  return "draft";
};

export interface PodcastRowData {
  id: string;
  title: string;
  author: string;
  authorId: string;
  date: string;
  duration: string;
  category?: string;
  coverUrl?: string;
  progress?: number;
  isLiked?: boolean;
  isCompleted?: boolean;
  currentUserVote?: VoteType | null;
}

/** API PodcastCard → пропсы компонента PodcastRow. */
export const toPodcastRow = (podcast: PodcastCard): PodcastRowData => ({
  id: podcast.id,
  title: podcast.title,
  author: podcast.author.authorName,
  authorId: podcast.author.id,
  date: formatRuDate(podcast.publishedAt ?? podcast.createdAt),
  duration: formatClock(podcast.durationSeconds),
  category: podcast.category?.name ?? undefined,
  coverUrl: podcast.coverImageUrl ?? undefined,
  progress: podcast.progressPercent ?? undefined,
  isLiked: podcast.currentUserVote === "LIKE",
  isCompleted: (podcast.progressPercent ?? 0) >= 100,
  currentUserVote: podcast.currentUserVote ?? null,
});
