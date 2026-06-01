import React, { useEffect, useMemo, useState } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import styles from "./AuthorPage.module.css";

import AuthorProfileHero from "../../components/AuthorProfileHero/AuthorProfileHero";
import AuthorPodcastsCarousel from "../../components/AuthorPodcastsCarousel/AuthorPodcastsCarousel";
import PodcastRow from "../../components/PodcastRow/PodcastRow";

import {
  getAuthor,
  getAuthorPodcasts,
  getAuthorPlaylists,
  subscribeAuthor,
  unsubscribeAuthor,
  votePodcast,
  removePodcastVote,
  isAuthenticated,
  type AuthorProfileResponse,
} from "../../api/podcast";
import { toPodcastRow, type PodcastRowData } from "../../utils/mappers";

interface MainLayoutContext {
  playPodcast: (podcast: any) => void;
}

interface CarouselItem {
  id: string;
  title: string;
  author: string;
  episodesCount: number;
  coverUrl?: string;
  likes?: number;
  dislikes?: number;
}

const AuthorPage: React.FC = () => {
  const { authorId } = useParams<{ authorId: string }>();
  const { playPodcast } = useOutletContext<MainLayoutContext>();
  const navigate = useNavigate();

  const [author, setAuthor] = useState<AuthorProfileResponse | null>(null);
  const [podcasts, setPodcasts] = useState<PodcastRowData[]>([]);
  const [playlists, setPlaylists] = useState<CarouselItem[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribers, setSubscribers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authorId) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const profile = await getAuthor(authorId);
        if (cancelled) {
          return;
        }
        setAuthor(profile);
        setIsSubscribed(profile.isSubscribed ?? false);
        setSubscribers(profile.subscribersCount);

        getAuthorPodcasts(authorId, { sort: "DATE_DESC", size: 50 })
          .then((page) => {
            if (!cancelled) {
              setPodcasts(page.items.map(toPodcastRow));
            }
          })
          .catch((err) => console.error("Failed to load author podcasts", err));

        getAuthorPlaylists(authorId, { size: 20 })
          .then((page) => {
            if (!cancelled) {
              setPlaylists(
                page.items.map((playlist) => ({
                  id: playlist.id,
                  title: playlist.title,
                  author: playlist.owner.username,
                  episodesCount: playlist.podcastsCount,
                  coverUrl: playlist.coverImageUrl ?? undefined,
                  likes: playlist.likesCount,
                  dislikes: playlist.dislikesCount,
                }))
              );
            }
          })
          .catch((err) => console.error("Failed to load author playlists", err));
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.status === 404
              ? "Автор не найден."
              : "Не удалось загрузить профиль автора. Попробуйте позже."
          );
          console.error("Failed to load author", err);
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
  }, [authorId]);

  const handleSubscribe = async () => {
    if (!authorId) {
      return;
    }
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const wasSubscribed = isSubscribed;
    setIsSubscribed(!wasSubscribed);

    try {
      const result = wasSubscribed
        ? await unsubscribeAuthor(authorId)
        : await subscribeAuthor(authorId);
      setIsSubscribed(result.isSubscribed);
      setSubscribers(result.subscribersCount);
    } catch (err) {
      setIsSubscribed(wasSubscribed);
      console.error("Failed to toggle subscription", err);
    }
  };

  const handlePodcastLike = async (id: string) => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const target = podcasts.find((podcast) => podcast.id === id);
    if (!target) return;
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
      console.error("Failed to vote podcast", err);
    }
  };

  const filteredPodcasts = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return podcasts;
    }
    return podcasts.filter((podcast) =>
      podcast.title.toLowerCase().includes(query)
    );
  }, [searchValue, podcasts]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={`container ${styles.pageInner}`}>
          <p style={{ padding: "40px 0" }}>Загрузка…</p>
        </div>
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className={styles.page}>
        <div className={`container ${styles.pageInner}`}>
          <p style={{ padding: "40px 0" }}>{error ?? "Автор не найден."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <div className={styles.offsetContent}>
          <AuthorProfileHero
            name={author.authorName}
            description={author.description ?? undefined}
            subscribers={subscribers}
            avatarUrl={author.avatarUrl ?? undefined}
            isSubscribed={isSubscribed}
            onSubscribeClick={handleSubscribe}
            onShareClick={() => {}}
          />
        </div>

        {playlists.length > 0 && (
          <AuthorPodcastsCarousel playlists={playlists} />
        )}

        <section className={`${styles.allPodcasts} ${styles.offsetContent}`}>
          <div className={styles.listHeader}>
            <h2 className={styles.sectionTitle}>Все подкасты</h2>

            <input
              type="text"
              className={styles.searchInput}
              placeholder="Поиск по названию..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>

          <div className={styles.list}>
            {filteredPodcasts.length === 0 ? (
              <p style={{ padding: "16px 0" }}>Подкастов пока нет.</p>
            ) : (
              filteredPodcasts.map((podcast) => (
                <PodcastRow
                  key={podcast.id}
                  {...podcast}
                  onPlayClick={() => playPodcast(podcast)}
                  onLikeClick={() => handlePodcastLike(podcast.id)}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthorPage;
