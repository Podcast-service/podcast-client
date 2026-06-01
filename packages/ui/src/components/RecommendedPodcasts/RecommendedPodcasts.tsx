import React from "react";
import { Link } from "react-router-dom";
import styles from "./RecommendedPodcasts.module.css";

import DefaultBookSvg from "../../assets/icons/defaultBook.svg";

interface RecommendedPodcast {
  id: string;
  title: string;
  category: string;
  duration: string;
  coverUrl?: string;
}

interface RecommendedPodcastsProps {
  podcasts: RecommendedPodcast[];
  title?: string;
}

const RecommendedPodcasts: React.FC<RecommendedPodcastsProps> = ({
  podcasts,
  title = "Рекомендуемые выпуски",
}) => {
  return (
    <aside className={styles.recommended}>
      <h2 className={styles.title}>{title}</h2>

      <div className={styles.list}>
        {podcasts.map((podcast) => (
          <Link
            key={podcast.id}
            to={`/podcasts/${podcast.id}`}
            className={styles.card}
          >
            <div className={styles.coverWrap}>
              {podcast.coverUrl ? (
                <img
                  src={podcast.coverUrl}
                  alt={podcast.title}
                  className={styles.cover}
                />
              ) : (
                <div className={styles.coverPlaceholder} aria-hidden="true">
                  <img
                    src={DefaultBookSvg}
                    alt=""
                    aria-hidden="true"
                    className={styles.defaultCover}
                  />
                </div>
              )}
            </div>

            <div className={styles.info}>
              <span className={styles.category}>{podcast.category}</span>

              <h3 className={styles.podcastTitle}>{podcast.title}</h3>

              <span className={styles.duration}>{podcast.duration}</span>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
};

export default RecommendedPodcasts;