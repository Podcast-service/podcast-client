import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import styles from "./SearchPage.module.css";

import AuthorRow from "../../components/AuthorRow/AuthorRow";
import PlaylistRow from "../../components/PlaylistRow/PlaylistRow";
import PodcastRow from "../../components/PodcastRow/PodcastRow";
import {
  isAuthenticated,
  search,
  subscribeAuthor,
  unsubscribeAuthor,
  type AuthorCard as ApiAuthorCard,
  type PlaylistCard as ApiPlaylistCard,
  type SearchResponse,
} from "../../api/podcast";
import { formatRuDate } from "../../utils/format";
import { toPodcastRow, type PodcastRowData } from "../../utils/mappers";

interface MainLayoutContext {
  playPodcast: (podcast: PodcastRowData) => void;
}

const PAGE_SIZE = 10;

const toPlaylistRow = (playlist: ApiPlaylistCard) => ({
  id: playlist.id,
  title: playlist.title,
  author: playlist.owner.username,
  podcastsCount: playlist.podcastsCount,
  coverUrl: playlist.coverImageUrl ?? undefined,
  createdAt: formatRuDate(playlist.createdAt),
});

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { playPodcast } = useOutletContext<MainLayoutContext>();
  const [params] = useSearchParams();
  const query = useMemo(() => params.get("q")?.trim() ?? "", [params]);

  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setResults(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await search({ q: query, page: 1, size: PAGE_SIZE });
        if (!cancelled) setResults(data);
      } catch (err) {
        if (!cancelled) {
          setError("Не удалось выполнить поиск. Попробуйте позже.");
          console.error("Failed to search", err);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query]);

  const updateAuthor = (authorId: string, patch: Partial<ApiAuthorCard>) => {
    setResults((prev) => {
      if (!prev?.authors) return prev;
      return {
        ...prev,
        authors: {
          ...prev.authors,
          items: prev.authors.items.map((author) =>
            author.id === authorId ? { ...author, ...patch } : author
          ),
        },
      };
    });
  };

  const handleSubscribe = async (author: ApiAuthorCard) => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const wasSubscribed = Boolean(author.isSubscribed);
    const previousSubscribers = author.subscribersCount ?? 0;
    updateAuthor(author.id, {
      isSubscribed: !wasSubscribed,
      subscribersCount: previousSubscribers + (wasSubscribed ? -1 : 1),
    });

    try {
      const result = wasSubscribed
        ? await unsubscribeAuthor(author.id)
        : await subscribeAuthor(author.id);
      updateAuthor(author.id, {
        isSubscribed: result.isSubscribed,
        subscribersCount: result.subscribersCount,
      });
    } catch (err) {
      updateAuthor(author.id, {
        isSubscribed: wasSubscribed,
        subscribersCount: previousSubscribers,
      });
      console.error("Failed to toggle subscription from search", err);
    }
  };

  const podcasts = results?.podcasts?.items.map(toPodcastRow) ?? [];
  const authors = results?.authors?.items ?? [];
  const playlists = results?.playlists?.items.map(toPlaylistRow) ?? [];
  const isEmpty =
    !isLoading &&
    !error &&
    query &&
    podcasts.length === 0 &&
    authors.length === 0 &&
    playlists.length === 0;

  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>Поиск</h1>
          {query ? (
            <p className={styles.subtitle}>Результаты по запросу «{query}»</p>
          ) : (
            <p className={styles.subtitle}>Введите запрос в строке поиска.</p>
          )}
        </div>

        {isLoading ? (
          <p className={styles.message}>Ищем...</p>
        ) : error ? (
          <p className={styles.message}>{error}</p>
        ) : isEmpty ? (
          <p className={styles.message}>Ничего не найдено.</p>
        ) : (
          <div className={styles.sections}>
            {podcasts.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Подкасты</h2>
                <div className={styles.list}>
                  {podcasts.map((podcast) => (
                    <PodcastRow
                      key={podcast.id}
                      {...podcast}
                      onPlayClick={() => playPodcast(podcast)}
                    />
                  ))}
                </div>
              </section>
            )}

            {authors.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Авторы</h2>
                <div className={styles.list}>
                  {authors.map((author) => (
                    <AuthorRow
                      key={author.id}
                      id={author.id}
                      name={author.authorName}
                      subscribers={author.subscribersCount ?? 0}
                      avatarUrl={author.avatarUrl ?? undefined}
                      isSubscribed={author.isSubscribed ?? false}
                      onSubscribeClick={() => handleSubscribe(author)}
                    />
                  ))}
                </div>
              </section>
            )}

            {playlists.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Плейлисты</h2>
                <div className={styles.list}>
                  {playlists.map((playlist) => (
                    <PlaylistRow key={playlist.id} {...playlist} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
