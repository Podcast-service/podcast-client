import React, { useEffect, useMemo, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useNavigate, useOutletContext } from "react-router-dom";
import styles from "./MainPage.module.css";

import SectionRow from "../../components/SectionRow/SectionRow";
import PodcastCard from "../../components/PodcastCard/PodcastCard";
import AuthorCard from "../../components/AuthorCard/AuthorCard";
import { usePlayerOptional } from "../../components/Player/PlayerProvider";

import FireSvg from "../../assets/icons/fire.svg";
import UserSvg from "../../assets/icons/user.svg";
import ClockSvg from "../../assets/icons/clock.svg";
import HeadphonesSvg from "../../assets/icons/listeners.svg";
import PlaySvg from "../../assets/icons/playTop.svg";
import PauseSvg from "../../assets/icons/pauseTop.svg";

import {
  getPodcasts,
  subscribeAuthor,
  unsubscribeAuthor,
  votePodcast,
  removePodcastVote,
  isAuthenticated,
  type PodcastCard as ApiPodcastCard,
  type VoteType,
} from "../../api/podcast";
import { formatClock } from "../../utils/format";

interface Podcast {
  id: string;
  title: string;
  author: string;
  duration: string;
  listeners: number;
  likes: number;
  dislikes: number;
  coverUrl?: string;
  description?: string;
  progress?: number;
  isLiked?: boolean;
  currentUserVote?: VoteType | null;
}

interface Author {
  id: string;
  name: string;
  category: string;
  subscribers: number;
  avatarUrl?: string;
  isSubscribed?: boolean;
}

interface MainLayoutContext {
  playPodcast: (podcast: Podcast, queue?: Podcast[]) => void;
}

const TOP_FEED_SIZE = 50;

const mapPodcast = (podcast: ApiPodcastCard): Podcast => ({
  id: podcast.id,
  title: podcast.title,
  author: podcast.author.authorName,
  duration: formatClock(podcast.durationSeconds),
  listeners: podcast.viewsCount,
  likes: podcast.likesCount,
  dislikes: podcast.dislikesCount,
  coverUrl: podcast.coverImageUrl ?? undefined,
  progress: podcast.progressPercent ?? undefined,
  isLiked: podcast.currentUserVote === "LIKE",
  currentUserVote: podcast.currentUserVote ?? null,
});

const deriveTopAuthors = (podcasts: ApiPodcastCard[]): Author[] => {
  const byAuthor = new Map<string, Author>();

  for (const podcast of podcasts) {
    const { author } = podcast;
    if (byAuthor.has(author.id)) {
      continue;
    }

    byAuthor.set(author.id, {
      id: author.id,
      name: author.authorName,
      category: podcast.category?.name ?? "",
      subscribers: author.subscribersCount ?? 0,
      avatarUrl: author.avatarUrl ?? undefined,
      isSubscribed: author.isSubscribed ?? false,
    });
  }

  return [...byAuthor.values()]
    .sort((a, b) => b.subscribers - a.subscribers)
    .slice(0, 5);
};

const formatDuration = (duration: string) => {
  const minutes = Number(duration.split(":")[0]);

  if (!Number.isFinite(minutes)) {
    return duration;
  }

  if (minutes % 10 === 1 && minutes !== 11) {
    return `${minutes} минута`;
  }

  if (
    minutes % 10 >= 2 &&
    minutes % 10 <= 4 &&
    !(minutes >= 12 && minutes <= 14)
  ) {
    return `${minutes} минуты`;
  }

  return `${minutes} минут`;
};

const formatListeners = (listeners: number) => {
  if (listeners >= 1_000_000) {
    return `${(listeners / 1_000_000).toFixed(1).replace(".", ",")}M`;
  }

  if (listeners >= 1_000) {
    return `${(listeners / 1_000).toFixed(1).replace(".", ",")}K`;
  }

  return listeners.toString();
};

const MainPage: React.FC = () => {
  usePageTitle();
  const navigate = useNavigate();
  const { playPodcast } = useOutletContext<MainLayoutContext>();
  const player = usePlayerOptional();

  const [topPodcasts, setTopPodcasts] = useState<Podcast[]>([]);
  const [topAuthors, setTopAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const page = await getPodcasts({ sort: "VIEWS", size: TOP_FEED_SIZE });
        if (cancelled) {
          return;
        }

        const items = page?.items ?? [];
        setTopPodcasts(items.map(mapPodcast));
        setTopAuthors(deriveTopAuthors(items));
      } catch (err) {
        if (!cancelled) {
          setError("Не удалось загрузить данные. Попробуйте позже.");
          console.error("Failed to load main page data", err);
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
  }, []);

  const handleSubscribe = async (authorId: string) => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const author = topAuthors.find((item) => item.id === authorId);
    if (!author) {
      return;
    }
    const wasSubscribed = Boolean(author.isSubscribed);

    setTopAuthors((prev) =>
      prev.map((item) =>
        item.id === authorId
          ? { ...item, isSubscribed: !wasSubscribed }
          : item
      )
    );

    try {
      const result = wasSubscribed
        ? await unsubscribeAuthor(authorId)
        : await subscribeAuthor(authorId);
      setTopAuthors((prev) =>
        prev.map((item) =>
          item.id === authorId
            ? {
                ...item,
                isSubscribed: result.isSubscribed,
                subscribers: result.subscribersCount,
              }
            : item
        )
      );
    } catch (err) {
      setTopAuthors((prev) =>
        prev.map((item) =>
          item.id === authorId
            ? { ...item, isSubscribed: wasSubscribed }
            : item
        )
      );
      console.error("Failed to toggle subscription", err);
    }
  };

  const handlePodcastLike = async (id: string) => {
    // Гостя перехватывает guard в PodcastCard (popup), сюда он не дойдёт.
    if (!isAuthenticated()) return;

    const target = topPodcasts.find((podcast) => podcast.id === id);
    if (!target) return;
    const wasLiked = target.currentUserVote === "LIKE";

    setTopPodcasts((prev) =>
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
      setTopPodcasts((prev) =>
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
      setTopPodcasts((prev) =>
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

  const heroPodcast = useMemo(() => topPodcasts[0], [topPodcasts]);

  // Активен ли подкаст из hero «Популярно сейчас» в глобальном плеере.
  const heroPlaying = Boolean(
    player &&
      heroPodcast &&
      player.activePodcast?.id === heroPodcast.id &&
      player.isPlaying
  );

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={`container ${styles.pageInner}`}>
          <p style={{ padding: "40px 0" }}>Загрузка…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={`container ${styles.pageInner}`}>
          <p style={{ padding: "40px 0" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        {heroPodcast && (
          <section className={styles.hero}>
            <div className={styles.heroImageWrap}>
              {heroPodcast.coverUrl && (
                <img
                  src={heroPodcast.coverUrl}
                  alt=""
                  aria-hidden="true"
                  className={styles.heroImage}
                />
              )}
            </div>

            <div className={styles.heroGradient} />

            <div className={styles.heroContent}>
              <div className={styles.heroBadge}>
                <img
                  src={FireSvg}
                  alt=""
                  aria-hidden="true"
                  className={styles.heroBadgeIcon}
                />

                <span className={styles.heroBadgeText}>Популярно сейчас</span>
              </div>

              <h1 className={styles.heroTitle}>{heroPodcast.title}</h1>

              <p className={styles.heroDesc}>
                {heroPodcast.description?.trim() ||
                  "Один из популярных подкастов сегодня. Нажмите слушать, чтобы начать воспроизведение."}
              </p>

              <div className={styles.heroMeta}>
                <span className={styles.heroMetaItem}>
                  <img
                    src={UserSvg}
                    alt=""
                    aria-hidden="true"
                    className={styles.heroMetaIcon}
                  />

                  {heroPodcast.author}
                </span>

                {heroPodcast.duration && (
                  <span className={styles.heroMetaItem}>
                    <img
                      src={ClockSvg}
                      alt=""
                      aria-hidden="true"
                      className={styles.heroMetaIcon}
                    />

                    {formatDuration(heroPodcast.duration)}
                  </span>
                )}

                <span className={styles.heroMetaItem}>
                  <img
                    src={HeadphonesSvg}
                    alt=""
                    aria-hidden="true"
                    className={styles.heroMetaIcon}
                  />

                  {formatListeners(heroPodcast.listeners)} прослушиваний
                </span>
              </div>

              <div className={styles.heroActions}>
                <button
                  type="button"
                  className={styles.listenBtn}
                  onClick={() => playPodcast(heroPodcast, topPodcasts)}
                >
                  <img
                    src={heroPlaying ? PauseSvg : PlaySvg}
                    alt=""
                    aria-hidden="true"
                    className={styles.listenIcon}
                  />

                  {heroPlaying ? "Пауза" : "Слушать"}
                </button>

                <button
                  type="button"
                  className={styles.moreBtn}
                  onClick={() => navigate(`/podcasts/${heroPodcast.id}`)}
                >
                  Подробнее
                </button>
              </div>
            </div>
          </section>
        )}

        <div className={styles.sections}>
          {topPodcasts.length > 0 && (
            <SectionRow
              title="Топ подкастов"
              actionText="Смотреть все →"
              actionTo="/podcasts"
            >
              <div className={styles.podcastsGrid}>
                {topPodcasts.slice(0, 5).map((podcast) => (
                  <PodcastCard
                    key={podcast.id}
                    {...podcast}
                    isAuthenticated={isAuthenticated()}
                    onPlayClick={() => playPodcast(podcast, topPodcasts)}
                    onLikeClick={() => handlePodcastLike(podcast.id)}
                  />
                ))}
              </div>
            </SectionRow>
          )}

          {topAuthors.length > 0 && (
            <SectionRow
              title="Топ авторов"
              actionText="Смотреть все →"
              actionTo="/authors"
            >
              <div className={styles.authorsGrid}>
                {topAuthors.map((author) => (
                  <AuthorCard
                    key={author.id}
                    {...author}
                    onSubscribeClick={() => handleSubscribe(author.id)}
                  />
                ))}
              </div>
            </SectionRow>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainPage;
