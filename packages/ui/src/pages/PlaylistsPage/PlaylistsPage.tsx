import React, { useState } from "react";
import styles from "./PlaylistsPage.module.css";

import FilterTabs from "../../components/FilterTabs/FilterTabs";
import PlaylistRow from "../../components/PlaylistRow/PlaylistRow";
import LoadMoreButton from "../../components/LoadMoreButton/LoadMoreButton";

interface Playlist {
  id: string;
  title: string;
  author: string;
  podcastsCount: number;
  coverUrl?: string;
  description?: string;
  createdAt?: string;
  isAdded?: boolean;
  isPlaying?: boolean;
}

const MOCK_SORT = [
  { id: "POPULAR", label: "Популярные" },
  { id: "NEW", label: "Новые" },
  { id: "OLD", label: "Старые" },
];

const PLAYLIST_COVER =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=400&auto=format&fit=crop";

const MOCK_PLAYLISTS: Playlist[] = Array.from({ length: 4 }, (_, index) => ({
  id: String(index + 1),
  title: "Вечерние размышления о будущем",
  author: "Артем Николаев",
  podcastsCount: 12,
  coverUrl: PLAYLIST_COVER,
  description:
    "Глубокие интервью с футурологами и учеными о том, как изменится наш мир в ближайшие 50 лет. Обсуждаем ИИ, экологию и колонизацию Марса.",
  createdAt: "14 окт. 2023",
  isAdded: index === 3,
  isPlaying: false,
}));

const formatPlaylistsCount = (count: number) => {
  if (count % 10 === 1 && count % 100 !== 11) {
    return `${count} плейлист`;
  }

  if (
    count % 10 >= 2 &&
    count % 10 <= 4 &&
    !(count % 100 >= 12 && count % 100 <= 14)
  ) {
    return `${count} плейлиста`;
  }

  return `${count} плейлистов`;
};

const PlaylistsPage: React.FC = () => {
  const [activeSort, setActiveSort] = useState("POPULAR");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [playlists, setPlaylists] = useState<Playlist[]>(MOCK_PLAYLISTS);

  const totalCount = 124;

  const handleAdd = (id: string) => {
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === id
          ? { ...playlist, isAdded: !playlist.isAdded }
          : playlist
      )
    );
  };

  const handlePlay = (id: string) => {
    setPlaylists((prev) =>
      prev.map((playlist) => ({
        ...playlist,
        isPlaying: playlist.id === id ? !playlist.isPlaying : false,
      }))
    );
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setHasMore(false);
    setIsLoadingMore(false);
  };

  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <div className={styles.pageHeader}>
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>Плейлисты</h1>
            <span className={styles.count}>{formatPlaylistsCount(totalCount)}</span>
          </div>

          <p className={styles.pageDesc}>Подборки подкастов на любой вкус</p>
        </div>

        <div className={styles.filters}>
          <FilterTabs
            sortOptions={MOCK_SORT}
            activeSort={activeSort}
            onSortChange={setActiveSort}
          />
        </div>

        <div className={styles.list}>
          {playlists.map((playlist) => (
            <PlaylistRow
              key={playlist.id}
              id={playlist.id}
              title={playlist.title}
              author={playlist.author}
              podcastsCount={playlist.podcastsCount}
              coverUrl={playlist.coverUrl}
              description={playlist.description}
              createdAt={playlist.createdAt}
              isAdded={playlist.isAdded}
              isPlaying={playlist.isPlaying}
              onAddClick={() => handleAdd(playlist.id)}
              onPlayClick={() => handlePlay(playlist.id)}
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

export default PlaylistsPage;