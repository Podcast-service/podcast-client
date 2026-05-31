import React, { useEffect, useState } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import styles from "./PodcastPage.module.css";

import PodcastHero from "../../components/PodcastHero/PodcastHero";
import RecommendedPodcasts from "../../components/RecommendedPodcasts/RecommendedPodcasts";

import {
  getPodcast,
  getPodcasts,
  getPodcastTranscript,
  getPodcastSummary,
  votePodcast,
  removePodcastVote,
  isAuthenticated,
  type PodcastDetailResponse,
  type VoteType,
} from "../../api/podcast";
import { formatClock, formatMinutes, formatRuDate } from "../../utils/format";

interface MainLayoutContext {
  playPodcast: (podcast: any) => void;
}

interface RecommendedItem {
  id: string;
  title: string;
  category: string;
  duration: string;
  coverUrl?: string;
}

interface VoteState {
  currentUserVote: VoteType | null;
}

const PodcastPage: React.FC = () => {
  const { podcastId } = useParams<{ podcastId: string }>();
  const { playPodcast } = useOutletContext<MainLayoutContext>();
  const navigate = useNavigate();

  const [podcast, setPodcast] = useState<PodcastDetailResponse | null>(null);
  const [vote, setVote] = useState<VoteState>({ currentUserVote: null });
  const [transcript, setTranscript] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [recommended, setRecommended] = useState<RecommendedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!podcastId) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const detail = await getPodcast(podcastId);
        if (cancelled) {
          return;
        }
        setPodcast(detail);
        setVote({ currentUserVote: detail.currentUserVote ?? null });

        // Транскрипт может быть не готов (404) — это не ошибка страницы.
        getPodcastTranscript(podcastId)
          .then((data) => {
            if (!cancelled) {
              setTranscript(data.content);
            }
          })
          .catch(() => {
            if (!cancelled) {
              setTranscript(null);
            }
          });

        // Summary тоже может быть не готов — в таком случае просто не показываем блок.
        getPodcastSummary(podcastId)
          .then((data) => {
            if (!cancelled) {
              setSummary(data.content);
            }
          })
          .catch(() => {
            if (!cancelled) {
              setSummary(null);
            }
          });

        // Рекомендации — подкасты из той же категории.
        if (detail.category?.id) {
          getPodcasts({ categoryId: detail.category.id, sort: "VIEWS", size: 4 })
            .then((page) => {
              if (cancelled) {
                return;
              }
              setRecommended(
                page.items
                  .filter((item) => item.id !== detail.id)
                  .slice(0, 3)
                  .map((item) => ({
                    id: item.id,
                    title: item.title,
                    category: item.category?.name ?? "",
                    duration: `${formatMinutes(item.durationSeconds)} мин`,
                    coverUrl: item.coverImageUrl ?? undefined,
                  }))
              );
            })
            .catch((err) => console.error("Failed to load recommendations", err));
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.status === 404
              ? "Подкаст не найден."
              : "Не удалось загрузить подкаст. Попробуйте позже."
          );
          console.error("Failed to load podcast", err);
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
  }, [podcastId]);

  const handleVote = async (voteType: VoteType) => {
    if (!podcastId) {
      return;
    }
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const previous = vote.currentUserVote;
    // Повторный клик по тому же типу — снимаем голос.
    const shouldRemove = previous === voteType;

    setVote({ currentUserVote: shouldRemove ? null : voteType });

    try {
      const result = shouldRemove
        ? await removePodcastVote(podcastId)
        : await votePodcast(podcastId, voteType);
      setVote({ currentUserVote: result.currentUserVote ?? null });
      setPodcast((prev) =>
        prev
          ? {
              ...prev,
              likesCount: result.likesCount,
              dislikesCount: result.dislikesCount,
            }
          : prev
      );
    } catch (err) {
      setVote({ currentUserVote: previous });
      console.error("Failed to vote", err);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={`container ${styles.pageInner}`}>
          <p style={{ padding: "40px 0" }}>Загрузка…</p>
        </div>
      </div>
    );
  }

  if (error || !podcast) {
    return (
      <div className={styles.page}>
        <div className={`container ${styles.pageInner}`}>
          <p style={{ padding: "40px 0" }}>{error ?? "Подкаст не найден."}</p>
        </div>
      </div>
    );
  }

  const handlePlay = () =>
    playPodcast({
      id: podcast.id,
      title: podcast.title,
      author: podcast.author.authorName,
      duration: formatClock(podcast.durationSeconds),
      coverUrl: podcast.coverImageUrl ?? undefined,
    });

  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <PodcastHero
          title={podcast.title}
          author={podcast.author.authorName}
          category={podcast.category?.name ?? ""}
          publishedAt={formatRuDate(podcast.publishedAt ?? podcast.createdAt)}
          duration={formatClock(podcast.durationSeconds)}
          listeners={podcast.viewsCount}
          coverUrl={podcast.coverImageUrl ?? undefined}
          progress={podcast.progressPercent ?? 0}
          volume={80}
          isLiked={vote.currentUserVote === "LIKE"}
          isDisliked={vote.currentUserVote === "DISLIKE"}
          downloadStatus="idle"
          onPlayClick={handlePlay}
          onLikeClick={() => handleVote("LIKE")}
          onDislikeClick={() => handleVote("DISLIKE")}
        />

        <div className={styles.content}>
          <main className={styles.mainColumn}>
            {podcast.description && (
              <section className={styles.about}>
                <h2 className={styles.sectionTitle}>О подкасте</h2>
                <p className={styles.aboutText}>{podcast.description}</p>
              </section>
            )}

            {summary && (
              <section className={styles.about}>
                <h2 className={styles.sectionTitle}>Краткое содержание</h2>
                <p className={styles.aboutText}>{summary}</p>
              </section>
            )}

            {transcript && (
              <section className={styles.about}>
                <h2 className={styles.sectionTitle}>Транскрипт</h2>
                {transcript
                  .split(/\n+/)
                  .filter((line) => line.trim().length > 0)
                  .map((line, index) => (
                    <p key={index} className={styles.aboutText}>
                      {line}
                    </p>
                  ))}
              </section>
            )}
          </main>

          {recommended.length > 0 && (
            <aside className={styles.sideColumn}>
              <RecommendedPodcasts podcasts={recommended} />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default PodcastPage;
