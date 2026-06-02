import React, { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import styles from "./PlaylistsPage.module.css";

import FilterTabs from "../../components/FilterTabs/FilterTabs";
import PlaylistRow from "../../components/PlaylistRow/PlaylistRow";
import LoadMoreButton from "../../components/LoadMoreButton/LoadMoreButton";

import {
  getPlaylists,
  getPlaylist,
  getMyLibraryPlaylists,
  isAuthenticated,
  removePlaylistFromLibrary,
  savePlaylistToLibrary,
  type SortPlaylists,
  type PlaylistCard,
} from "../../api/podcast";
import { toPodcastRow } from "../../utils/mappers";
import { formatRuDate, pluralizeRu } from "../../utils/format";

interface MainLayoutContext {
  playPodcast: (podcast: any, queue?: any[]) => void;
}

interface PlaylistRowData {
  id: string;
  title: string;
  author: string;
  podcastsCount: number;
  coverUrl?: string;
  createdAt?: string;
  isSaved?: boolean;
}

const PAGE_SIZE = 20;

const SORT_OPTIONS: { id: SortPlaylists; label: string }[] = [
  { id: "RATING", label: "Популярные" },
  { id: "DATE_DESC", label: "Новые" },
  { id: "DATE_ASC", label: "Старые" },
];

const toPlaylistRow = (playlist: PlaylistCard): PlaylistRowData => ({
  id: playlist.id,
  title: playlist.title,
  author: playlist.owner.username,
  podcastsCount: playlist.podcastsCount,
  coverUrl: playlist.coverImageUrl ?? undefined,
  createdAt: formatRuDate(playlist.createdAt),
});

const formatPlaylistsCount = (count: number) =>
  `${count} ${pluralizeRu(count, ["плейлист", "плейлиста", "плейлистов"])}`;

const PlaylistsPage: React.FC = () => {
  const navigate = useNavigate();
  const { playPodcast } = useOutletContext<MainLayoutContext>();
  const [activeSort, setActiveSort] = useState<SortPlaylists>("RATING");

  const [playlists, setPlaylists] = useState<PlaylistRowData[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [result, savedPage] = await Promise.all([
          getPlaylists({
          sort: activeSort,
          page: 1,
          size: PAGE_SIZE,
          }),
          isAuthenticated()
            ? getMyLibraryPlaylists({ size: 50 }).catch(() => null)
            : Promise.resolve(null),
        ]);
        if (cancelled) {
          return;
        }

        const savedIds = new Set(savedPage?.items.map((item) => item.id) ?? []);
        setPlaylists(
          result.items.map((item) => ({
            ...toPlaylistRow(item),
            isSaved: savedIds.has(item.id),
          }))
        );
        setPage(1);
        setTotalPages(result.meta.totalPages);
        setTotalCount(result.meta.totalElements);
      } catch (err) {
        if (!cancelled) {
          setError("Не удалось загрузить плейлисты. Попробуйте позже.");
          console.error("Failed to load playlists", err);
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
  }, [activeSort]);

  const handleLoadMore = async () => {
    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;

      const [result, savedPage] = await Promise.all([
        getPlaylists({
        sort: activeSort,
        page: nextPage,
        size: PAGE_SIZE,
        }),
        isAuthenticated()
          ? getMyLibraryPlaylists({ size: 50 }).catch(() => null)
          : Promise.resolve(null),
      ]);
      const savedIds = new Set(savedPage?.items.map((item) => item.id) ?? []);

      setPlaylists((prev) => [
        ...prev,
        ...result.items.map((item) => ({
          ...toPlaylistRow(item),
          isSaved: savedIds.has(item.id),
        })),
      ]);
      setPage(nextPage);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      console.error("Failed to load more playlists", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleToggleSave = async (playlistId: string) => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const target = playlists.find((playlist) => playlist.id === playlistId);
    if (!target) return;

    const wasSaved = Boolean(target.isSaved);
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === playlistId
          ? { ...playlist, isSaved: !wasSaved }
          : playlist
      )
    );

    try {
      const result = wasSaved
        ? await removePlaylistFromLibrary(playlistId)
        : await savePlaylistToLibrary(playlistId);
      setPlaylists((prev) =>
        prev.map((playlist) =>
          playlist.id === playlistId
            ? { ...playlist, isSaved: result.isSaved }
            : playlist
        )
      );
    } catch (err) {
      setPlaylists((prev) =>
        prev.map((playlist) =>
          playlist.id === playlistId
            ? { ...playlist, isSaved: wasSaved }
            : playlist
        )
      );
      console.error("Failed to toggle playlist save", err);
    }
  };

  // На странице есть только метаданные плейлиста — подгружаем его треклист и
  // запускаем первый подкаст, остальные кладём в очередь плеера.
  const handlePlayPlaylist = async (playlistId: string) => {
    try {
      const detail = await getPlaylist(playlistId);
      const rows = (detail.podcasts ?? []).map(toPodcastRow);
      if (rows.length === 0) return;
      playPodcast(rows[0], rows);
    } catch (err) {
      console.error("Failed to play playlist", err);
    }
  };

  const hasMore = page < totalPages;

  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <div className={styles.pageHeader}>
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>Плейлисты</h1>
            <span className={styles.count}>
              {formatPlaylistsCount(totalCount)}
            </span>
          </div>

          <p className={styles.pageDesc}>Подборки подкастов на любой вкус</p>
        </div>

        <div className={styles.filters}>
          <FilterTabs
            sortOptions={SORT_OPTIONS}
            activeSort={activeSort}
            onSortChange={(id) => setActiveSort(id as SortPlaylists)}
          />
        </div>

        {isLoading ? (
          <p style={{ padding: "24px 0" }}>Загрузка…</p>
        ) : error ? (
          <p style={{ padding: "24px 0" }}>{error}</p>
        ) : playlists.length === 0 ? (
          <p style={{ padding: "24px 0" }}>Плейлистов пока нет.</p>
        ) : (
          <>
            <div className={styles.list}>
              {playlists.map((playlist) => (
                <PlaylistRow
                  key={playlist.id}
                  id={playlist.id}
                  title={playlist.title}
                  author={playlist.author}
                  podcastsCount={playlist.podcastsCount}
                  coverUrl={playlist.coverUrl}
                  createdAt={playlist.createdAt}
                  isAdded={playlist.isSaved}
                  onAddClick={() => handleToggleSave(playlist.id)}
                  onPlayClick={() => handlePlayPlaylist(playlist.id)}
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

export default PlaylistsPage;
