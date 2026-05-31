import React from "react";
import { Link } from "react-router-dom";
import styles from "./PlaylistRow.module.css";

import { useAuthAction } from "../../hooks/useAuthAction";
import LoginPromptModal from "../LoginPromptModal/LoginPromptModal";


import PlusSvg from "../../assets/icons/plus.svg";
import CheckSvg from "../../assets/icons/check.svg";
import PlaySvg from "../../assets/icons/play.svg";
import PauseSvg from "../../assets/icons/pause.svg";
import DefaultBookSvg from "../../assets/icons/defaultBook.svg";

interface PlaylistRowProps {
  id: string;
  title: string;
  author: string;
  podcastsCount: number;
  coverUrl?: string;
  description?: string;
  createdAt?: string;
  isAdded?: boolean;
  isPlaying?: boolean;
  isAuthenticated?: boolean;
  onAddClick?: () => void;
  onPlayClick?: () => void;
}

const formatEpisodesCount = (count: number) => {
  if (count % 10 === 1 && count % 100 !== 11) {
    return `${count} эпизод`;
  }

  if (
    count % 10 >= 2 &&
    count % 10 <= 4 &&
    !(count % 100 >= 12 && count % 100 <= 14)
  ) {
    return `${count} эпизода`;
  }

  return `${count} эпизодов`;
};

const PlaylistRow: React.FC<PlaylistRowProps> = ({
  id,
  title,
  author,
  podcastsCount,
  coverUrl,
  description,
  createdAt,
  isAdded = false,
  isPlaying = false,
  isAuthenticated = false,
  onAddClick,
  onPlayClick,
}) => {
  const { isModalOpen, closeModal, guard } = useAuthAction(isAuthenticated);
  return (
    <article className={styles.row}>
      <Link to={`/playlists/${id}`} className={styles.rowLink}>
        <div className={styles.coverWrap}>
          {coverUrl ? (
            <img src={coverUrl} alt={title} className={styles.cover} />
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

          <span className={styles.coverMeta}>
            {formatEpisodesCount(podcastsCount)}
          </span>
        </div>

        <div className={styles.info}>
          <h3 className={styles.title}>{title}</h3>

          <p className={styles.author}>{author}</p>

          {description && <p className={styles.description}>{description}</p>}

          {createdAt && (
            <span className={styles.meta}>Создано {createdAt}</span>
          )}
        </div>
      </Link>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={guard(onAddClick)}
          aria-label={isAdded ? "Плейлист добавлен" : "Добавить плейлист"}
        >
          <img
            src={isAdded ? CheckSvg : PlusSvg}
            alt=""
            aria-hidden="true"
            className={styles.actionIcon}
          />
        </button>

        <button
          type="button"
          className={styles.playBtn}
          onClick={onPlayClick}
          aria-label={isPlaying ? "Пауза" : "Воспроизвести плейлист"}
        >
          <img
            src={isPlaying ? PauseSvg : PlaySvg}
            alt=""
            aria-hidden="true"
            className={styles.playIcon}
          />
        </button>
      </div>
      {isModalOpen && (
        <LoginPromptModal onClose={closeModal} />
      )}
    </article>
  );
};

export default PlaylistRow;