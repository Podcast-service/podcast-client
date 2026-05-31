import React, { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import styles from "./ProfileMyPodcastsPage.module.css";

import PodcastRow from "../../components/PodcastRow/PodcastRow";
import {
    getMyAuthorPodcasts,
    removePodcastVote,
    votePodcast,
} from "../../api/podcast";
import { toPodcastRow, type PodcastRowData } from "../../utils/mappers";


const ProfileMyPodcastsPage: React.FC = () => {
    const navigate = useNavigate();
    const context = useOutletContext<{ playPodcast?: (podcast: any) => void } | null>();
    const playPodcast = context?.playPodcast ?? (() => {});
    const [podcasts, setPodcasts] = useState<PodcastRowData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setIsLoading(true);
                setError(null);
                const page = await getMyAuthorPodcasts({
                    sort: "DATE_DESC",
                    size: 50,
                });
                if (!cancelled) {
                    setPodcasts(page.items.map(toPodcastRow));
                }
            } catch (err) {
                if (!cancelled) {
                    setError("Не удалось загрузить ваши подкасты.");
                    console.error("Failed to load my podcasts", err);
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

    const handleLike = async (id: string) => {
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
            console.error("Failed to vote own podcast", err);
        }
    };

    return (
        <div className={styles.page}>

            <div className={styles.header}>
                <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => navigate("/podcasts/create")}
                >
                    Добавить подкаст
                </button>
            </div>

            {isLoading ? (
                <p style={{ padding: "24px 0" }}>Загрузка…</p>
            ) : error ? (
                <p style={{ padding: "24px 0" }}>{error}</p>
            ) : podcasts.length > 0 ? (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Мои подкасты</h2>
                    <div className={styles.list}>
                        {podcasts.map((podcast) => (
                            <PodcastRow
                                key={podcast.id}
                                {...podcast}
                                isOwner={true}
                                onPlayClick={() => playPodcast(podcast)}
                                onLikeClick={() => handleLike(podcast.id)}
                                onEditClick={() => navigate(`/podcasts/${podcast.id}/edit`)}
                            />
                        ))}
                    </div>
                </section>
            ) : (
                <p className={styles.empty}>У вас пока нет подкастов</p>
            )}

        </div>
    );
};

export default ProfileMyPodcastsPage;
