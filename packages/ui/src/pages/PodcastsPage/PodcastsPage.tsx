import React, { useState } from "react";
import styles from "./PodcastsPage.module.css";
import FilterTabs from "../../components/FilterTabs/FilterTabs";
import PodcastRow from "../../components/PodcastRow/PodcastRow";
import LoadMoreButton from "../../components/LoadMoreButton/LoadMoreButton";
import { useOutletContext } from "react-router-dom";

interface Podcast {
  id: string;
  title: string;
  author: string;
  date: string;
  duration: string;
  category?: string;
  coverUrl?: string;
  progress?: number;
  isCompleted?: boolean;
  isLiked?: boolean;
}

interface MainLayoutContext {
  playPodcast: (podcast: any) => void;
}

const MOCK_CATEGORIES = [
  { id: "all", label: "Все подкасты" },
  { id: "design", label: "Дизайн" },
  { id: "business", label: "Бизнес" },
  { id: "psychology", label: "Психология" },
  { id: "science", label: "Наука" },
  { id: "entertainment", label: "Развлечения" },
  { id: "tech", label: "Технологии" },
  { id: "sport", label: "Спорт" },
  { id: "health", label: "Здоровье" },
];

const MOCK_SORT = [
  { id: "RATING", label: "Популярные" },
  { id: "DATE_DESC", label: "Новые" },
  { id: "DATE_ASC", label: "Старые" },
  { id: "VIEWS", label: "По просмотрам" },
];

const COVER = "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=400&auto=format&fit=crop";

const MOCK_PODCASTS: Podcast[] = Array.from({ length: 8 }, (_, i) => ({
  id: String(i + 1),
  title: ["Как справиться с прокрастинацией", "Искусство глубокого сна", "Почему мы забываем важное?", "Эмпатия в цифровой век"][i % 4],
  author: "Виктор Соколов",
  date: "12 окт 2023",
  duration: "45:00",
  category: "Саморазвитие",
  coverUrl: i % 3 === 0 ? undefined : COVER,
  progress: i === 0 ? 66 : undefined,
  isCompleted: i === 2,
  isLiked: i === 1,
}));

const PodcastsPage: React.FC = () => {
  const { playPodcast } = useOutletContext<MainLayoutContext>();

  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSort, setActiveSort] = useState("RATING");
  const [podcasts, setPodcasts] = useState<Podcast[]>(MOCK_PODCASTS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await new Promise((r) => setTimeout(r, 800));
    setHasMore(false);
    setIsLoadingMore(false);
  };

  const handleLike = (id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCategoryChange = (id: string) => {
    setActiveCategory(id);
  };

  const handleSortChange = (id: string) => {
    setActiveSort(id);
  };

  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>

        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Подкасты</h1>
          <p className={styles.pageDesc}>Откройте для себя авторов подкастов на любой вкус</p>
        </div>

        <div className={styles.filters}>
          <FilterTabs
            categories={MOCK_CATEGORIES}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            sortOptions={MOCK_SORT}
            activeSort={activeSort}
            onSortChange={handleSortChange}
          />
        </div>

        <div className={styles.list}>
          {podcasts.map((podcast) => (
            <PodcastRow
              key={podcast.id}
              {...podcast}
              isLiked={likedIds.has(podcast.id) || podcast.isLiked}
              onPlayClick={() => playPodcast(podcast)}
              onLikeClick={() => handleLike(podcast.id)}
              onAddClick={() => {
              }}
            />
          ))}
        </div>

        {hasMore && (
          <LoadMoreButton onClick={handleLoadMore} loading={isLoadingMore} />
        )}

      </div>
    </div>
  );
};

export default PodcastsPage;