import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import PodcastRow from "../../components/PodcastRow/PodcastRow";
import styles from "./ProfileHistoryPage.module.css";

import { getMyHistory } from "../../api/podcast";
import { toPodcastRow, type PodcastRowData } from "../../utils/mappers";

interface MainLayoutContext {
  playPodcast: (podcast: any) => void;
}

interface HistoryRow extends PodcastRowData {
  completed: boolean;
}

const ProfileHistoryPage: React.FC = () => {
  const context = useOutletContext<MainLayoutContext | null>();
  const playPodcast = context?.playPodcast ?? (() => {});

  const [items, setItems] = useState<HistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getMyHistory({ size: 50 })
      .then((page) => {
        if (cancelled) return;
        setItems(
          page.items.map((item) => ({
            ...toPodcastRow(item.podcast),
            progress: item.progressPercent ?? undefined,
            completed: item.completed,
            isCompleted: item.completed,
          }))
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setError("Не удалось загрузить историю.");
          console.error("Failed to load history", err);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <p style={{ padding: "24px 0" }}>Загрузка…</p>;
  }

  if (error) {
    return <p style={{ padding: "24px 0" }}>{error}</p>;
  }

  if (items.length === 0) {
    return <p style={{ padding: "24px 0" }}>История прослушивания пуста.</p>;
  }

  return (
    <div className={styles.list}>
      {items.map((podcast) => (
        <PodcastRow
          key={podcast.id}
          {...podcast}
          onPlayClick={() => playPodcast(podcast)}
        />
      ))}
    </div>
  );
};

export default ProfileHistoryPage;
