import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import PodcastRow from "../../components/PodcastRow/PodcastRow";
import styles from "./ProfileLikesPage.module.css";

import {
  getMyLikedPodcasts,
  removePodcastVote,
} from "../../api/podcast";
import { toPodcastRow, type PodcastRowData } from "../../utils/mappers";

interface MainLayoutContext {
  playPodcast?: (podcast: PodcastRowData, queue?: PodcastRowData[]) => void;
}

const ProfileLikesPage: React.FC = () => {
  const context = useOutletContext<MainLayoutContext | null>();
  const playPodcast = context?.playPodcast ?? (() => {});

  const [podcasts, setPodcasts] = useState<PodcastRowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getMyLikedPodcasts({ size: 50, sort: "DATE_DESC" })
      .then((page) => {
        if (!cancelled) {
          setPodcasts(
            page.items.map((item) => ({
              ...toPodcastRow(item),
              isLiked: true,
              currentUserVote: "LIKE",
            }))
          );
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError("Не удалось загрузить лайкнутые подкасты.");
          console.error("Failed to load liked podcasts", err);
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
    const snapshot = podcasts;
    setPodcasts((prev) => prev.filter((podcast) => podcast.id !== id));

    try {
      await removePodcastVote(id);
    } catch (err) {
      setPodcasts(snapshot);
      console.error("Failed to remove podcast like", err);
    }
  };

  if (isLoading) {
    return <p style={{ padding: "24px 0" }}>Загрузка…</p>;
  }

  if (error) {
    return <p style={{ padding: "24px 0" }}>{error}</p>;
  }

  if (podcasts.length === 0) {
    return <p style={{ padding: "24px 0" }}>Вы пока ничего не лайкнули.</p>;
  }

  return (
    <div className={styles.list}>
      {podcasts.map((podcast) => (
        <PodcastRow
          key={podcast.id}
          {...podcast}
          isLiked={true}
          onPlayClick={() => playPodcast(podcast, podcasts)}
          onLikeClick={() => handleLike(podcast.id)}
        />
      ))}
    </div>
  );
};

export default ProfileLikesPage;
