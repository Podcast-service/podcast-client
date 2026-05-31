import React from "react";
import { Link } from "react-router-dom";
import styles from "./PodcastCard.module.css";

import { useAuthAction } from "../../hooks/useAuthAction";
import LoginPromptModal from "../LoginPromptModal/LoginPromptModal";

import ListenersSvg from "../../assets/icons/listeners.svg";
import LikeSvg from "../../assets/icons/like.svg";
import DislikeSvg from "../../assets/icons/dislike.svg";

import LikeCardSvg from "../../assets/icons/likeCard.svg";
import LikeActiveSvg from "../../assets/icons/likePodRow.svg";
import PlayCardSvg from "../../assets/icons/playCard.svg";
import PauseCardSvg from "../../assets/icons/pauseCard.svg";
import PlusCardSvg from "../../assets/icons/plusCard.svg";

interface PodcastCardProps {
  id: string;
  title: string;
  author: string;
  duration: string;
  coverUrl?: string;
  listeners?: number;
  likes?: number;
  dislikes?: number;
  progress?: number;
  isLiked?: boolean;
  isPlaying?: boolean;
  isAuthenticated?: boolean;
  onPlayClick?: () => void;
  onLikeClick?: () => void;
  onAddClick?: () => void;
}

const formatStat = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(".", ",")} к`;
  }

  return value.toString();
};

const PodcastCard: React.FC<PodcastCardProps> = ({
  id,
  title,
  author,
  duration,
  coverUrl,
  listeners,
  likes,
  dislikes,
  progress,
  isLiked = false,
  isPlaying = false,
  isAuthenticated = false,
  onPlayClick,
  onLikeClick,
  onAddClick,
}) => {
  const hasProgress = progress !== undefined && progress > 0 && progress < 100;
  const { isModalOpen, closeModal, guard } =
  useAuthAction(isAuthenticated);

  return (
    <article className={styles.card}>
      <Link to={`/podcasts/${id}`} className={styles.cardLink}>
        <div className={styles.coverWrap}>
          {coverUrl ? (
            <img src={coverUrl} alt={title} className={styles.cover} />
          ) : (
            <div className={styles.coverPlaceholder} aria-hidden="true" />
          )}

          <span className={styles.duration}>{duration}</span>

          {hasProgress && (
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className={styles.overlay}>
            <button
              type="button"
              className={styles.overlayBtn}
              onClick={(e) => {
                e.preventDefault();
                guard(onAddClick)();
              }}
              aria-label="Добавить"
            >
              <img
                src={PlusCardSvg}
                alt=""
                aria-hidden="true"
                className={styles.overlayIcon}
              />
            </button>

            <button
              type="button"
              className={styles.overlayPlayBtn}
              onClick={(e) => {
                e.preventDefault();
                onPlayClick?.();
              }}
              aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
            >
              <img
                src={isPlaying ? PauseCardSvg : PlayCardSvg}
                alt=""
                aria-hidden="true"
                className={styles.overlayPlayIcon}
              />
            </button>

            <button
              type="button"
              className={styles.overlayBtn}
              onClick={(e) => {
                e.preventDefault();
                guard(onLikeClick)();
              }}
              aria-label={isLiked ? "Убрать лайк" : "Поставить лайк"}
            >
              <img
                src={isLiked ? LikeActiveSvg : LikeCardSvg}
                alt=""
                aria-hidden="true"
                className={styles.overlayIcon}
              />
            </button>
          </div>
        </div>

        <div className={styles.info}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.author}>{author}</p>

          <div className={styles.stats} aria-label="Статистика подкаста">
            {listeners !== undefined && (
              <span className={styles.stat}>
                <img
                  src={ListenersSvg}
                  alt=""
                  aria-hidden="true"
                  className={styles.statIcon}
                />
                {formatStat(listeners)}
              </span>
            )}

            {likes !== undefined && (
              <span className={styles.stat}>
                <img
                  src={LikeSvg}
                  alt=""
                  aria-hidden="true"
                  className={styles.statIcon}
                />
                {formatStat(likes)}
              </span>
            )}

            {dislikes !== undefined && (
              <span className={styles.stat}>
                <img
                  src={DislikeSvg}
                  alt=""
                  aria-hidden="true"
                  className={styles.statIcon}
                />
                {formatStat(dislikes)}
              </span>
            )}
          </div>
        </div>
      </Link>
      {isModalOpen && (
        <LoginPromptModal onClose={closeModal} />
      )}
    </article>
  );
};

export default PodcastCard;