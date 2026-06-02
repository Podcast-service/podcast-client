import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import PodcastRow from "../../components/PodcastRow/PodcastRow";
import LoadMoreButton from "../../components/LoadMoreButton/LoadMoreButton";
import styles from "./ProfileHistoryPage.module.css";

import {
  getMyHistory,
  votePodcast,
  removePodcastVote,
} from "../../api/podcast";
import { toPodcastRow, type PodcastRowData } from "../../utils/mappers";
import { formatRelativeDate } from "../../utils/format";

interface MainLayoutContext {
  playPodcast: (podcast: any, queue?: any[]) => void;
}

interface HistoryRow extends PodcastRowData {
  completed: boolean;
  // Поля для возобновления воспроизведения с сохранённой позиции.
  progressSeconds: number;
  durationSeconds: number | null;
}

const PAGE_SIZE = 20;

const ProfileHistoryPage: React.FC = () => {
  const context = useOutletContext<MainLayoutContext | null>();
  const playPodcast = context?.playPodcast ?? (() => {});

  const [items, setItems] = useState<HistoryRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ListenHistoryItem → пропсы PodcastRow. В отличие от обычного списка,
  // здесь дата — это когда пользователь слушал (lastListenedAt), а прогресс
  // и признак завершённости берутся из истории.
  const toHistoryRow = (item: {
    podcast: any;
    progressSeconds: number;
    progressPercent?: number | null;
    completed: boolean;
    lastListenedAt: string;
  }): HistoryRow => ({
    ...toPodcastRow(item.podcast),
    date: formatRelativeDate(item.lastListenedAt),
    progress: item.progressPercent ?? undefined,
    completed: item.completed,
    isCompleted: item.completed,
    progressSeconds: item.progressSeconds,
    durationSeconds: item.podcast.durationSeconds ?? null,
  });

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    getMyHistory({ page: 1, size: PAGE_SIZE })
      .then((pageData) => {
        if (cancelled) return;
        setItems(pageData.items.map(toHistoryRow));
        setPage(1);
        setTotalPages(pageData.meta.totalPages);
      })
      .catch((err) => {
        if (!cancelled) {
          setError("Не удалось загрузить историю.");
          console.error("Failed to load history", err);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLike = async (id: string) => {
    const target = items.find((item) => item.id === id);
    if (!target) return;
    const wasLiked = target.currentUserVote === "LIKE";

    // Оптимистично переключаем лайк в списке.
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isLiked: !wasLiked,
              currentUserVote: wasLiked ? null : "LIKE",
            }
          : item
      )
    );

    try {
      if (wasLiked) {
        await removePodcastVote(id);
      } else {
        await votePodcast(id, "LIKE");
      }
    } catch (err) {
      // Откат при ошибке.
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                isLiked: wasLiked,
                currentUserVote: wasLiked ? "LIKE" : null,
              }
            : item
        )
      );
      console.error("Failed to toggle like", err);
    }
  };

  const handleLoadMore = async () => {
    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      const pageData = await getMyHistory({ page: nextPage, size: PAGE_SIZE });
      setItems((prev) => [...prev, ...pageData.items.map(toHistoryRow)]);
      setPage(nextPage);
      setTotalPages(pageData.meta.totalPages);
    } catch (err) {
      console.error("Failed to load more history", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (isLoading) {
    return <p style={{ padding: "24px 0" }}>Загрузка…</p>;
  }

  if (error) {
    return <p style={{ padding: "24px 0" }}>{error}</p>;
  }

  if (items.length === 0) {
    return <p style={{ padding: "24px 0" }}>История прослушивания пуста.</p>;
  }

  const hasMore = page < totalPages;

  return (
    <div className={styles.list}>
      {items.map((podcast) => (
        <PodcastRow
          key={podcast.id}
          {...podcast}
          isLiked={podcast.currentUserVote === "LIKE"}
          onPlayClick={() => playPodcast(podcast, items)}
          onLikeClick={() => handleLike(podcast.id)}
        />
      ))}

      {hasMore && (
        <LoadMoreButton onClick={handleLoadMore} loading={isLoadingMore} />
      )}
    </div>
  );
};

export default ProfileHistoryPage;
