import React, { useEffect, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useNavigate, useOutletContext } from "react-router-dom";
import styles from "./PodcastsPage.module.css";
import FilterTabs from "../../components/FilterTabs/FilterTabs";
import PodcastRow from "../../components/PodcastRow/PodcastRow";
import LoadMoreButton from "../../components/LoadMoreButton/LoadMoreButton";

import {
  getPodcasts,
  getCategories,
  votePodcast,
  removePodcastVote,
  isAuthenticated,
  type SortPodcasts,
  type CategoryResponse,
} from "../../api/podcast";
import { toPodcastRow, type PodcastRowData } from "../../utils/mappers";

interface MainLayoutContext {
  playPodcast: (podcast: any, queue?: any[]) => void;
}

const PAGE_SIZE = 20;

const SORT_OPTIONS: { id: SortPodcasts; label: string }[] = [
  { id: "RATING", label: "Популярные" },
  { id: "DATE_DESC", label: "Новые" },
  { id: "DATE_ASC", label: "Старые" },
  { id: "VIEWS", label: "По просмотрам" },
];

const PodcastsPage: React.FC = () => {
  usePageTitle("Подкасты");
  const navigate = useNavigate();
  const { playPodcast } = useOutletContext<MainLayoutContext>();

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSort, setActiveSort] = useState<SortPodcasts>("RATING");

  const [podcasts, setPodcasts] = useState<PodcastRowData[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => console.error("Failed to load categories", err));
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await getPodcasts({
          sort: activeSort,
          categoryId: activeCategory === "all" ? undefined : activeCategory,
          page: 1,
          size: PAGE_SIZE,
        });
        if (cancelled) {
          return;
        }

        setPodcasts(result.items.map(toPodcastRow));
        setPage(1);
        setTotalPages(result.meta.totalPages);
      } catch (err) {
        if (!cancelled) {
          setError("Не удалось загрузить подкасты. Попробуйте позже.");
          console.error("Failed to load podcasts", err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeCategory, activeSort]);

  const handleLoadMore = async () => {
    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;

      const result = await getPodcasts({
        sort: activeSort,
        categoryId: activeCategory === "all" ? undefined : activeCategory,
        page: nextPage,
        size: PAGE_SIZE,
      });

      setPodcasts((prev) => [...prev, ...result.items.map(toPodcastRow)]);
      setPage(nextPage);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      console.error("Failed to load more podcasts", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleLike = async (id: string) => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const target = podcasts.find((podcast) => podcast.id === id);
    if (!target) {
      return;
    }
    const wasLiked = target.currentUserVote === "LIKE";

    setPodcasts((prev) =>
      prev.map((podcast) =>
        podcast.id === id
          ? {
              ...podcast,
              isLiked: !wasLiked,
              currentUserVote: wasLiked ? null : "LIKE",
            }
          : podcast
      )
    );

    try {
      const result = wasLiked
        ? await removePodcastVote(id)
        : await votePodcast(id, "LIKE");
      setPodcasts((prev) =>
        prev.map((podcast) =>
          podcast.id === id
            ? {
                ...podcast,
                isLiked: result.currentUserVote === "LIKE",
                currentUserVote: result.currentUserVote ?? null,
              }
            : podcast
        )
      );
    } catch (err) {
      setPodcasts((prev) =>
        prev.map((podcast) =>
          podcast.id === id
            ? {
                ...podcast,
                isLiked: wasLiked,
                currentUserVote: wasLiked ? "LIKE" : null,
              }
            : podcast
        )
      );
      console.error("Failed to vote", err);
    }
  };

  const filterCategories = [
    { id: "all", label: "Все подкасты" },
    ...categories.map((category) => ({ id: category.id, label: category.name })),
  ];

  const hasMore = page < totalPages;

  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Подкасты</h1>
          <p className={styles.pageDesc}>
            Откройте для себя авторов подкастов на любой вкус
          </p>
        </div>

        <div className={styles.filters}>
          <FilterTabs
            categories={filterCategories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            sortOptions={SORT_OPTIONS}
            activeSort={activeSort}
            onSortChange={(id) => setActiveSort(id as SortPodcasts)}
          />
        </div>

        {isLoading ? (
          <p style={{ padding: "24px 0" }}>Загрузка…</p>
        ) : error ? (
          <p style={{ padding: "24px 0" }}>{error}</p>
        ) : podcasts.length === 0 ? (
          <p style={{ padding: "24px 0" }}>Подкастов пока нет.</p>
        ) : (
          <>
            <div className={styles.list}>
              {podcasts.map((podcast) => (
                <PodcastRow
                  key={podcast.id}
                  {...podcast}
                  isAuthenticated={isAuthenticated()}
                  onPlayClick={() => playPodcast(podcast, podcasts)}
                  onLikeClick={() => handleLike(podcast.id)}
                />
              ))}
            </div>

            {hasMore && (
              <LoadMoreButton
                onClick={handleLoadMore}
                loading={isLoadingMore}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PodcastsPage;
