import React from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuthAction } from "../../hooks/useAuthAction";
import LoginPromptModal from "../LoginPromptModal/LoginPromptModal";

import styles from "./PodcastRow.module.css";
import LikeActiveSvg from "../../assets/icons/likePodRow.svg";
import LikeDefaultSvg from "../../assets/icons/defHeart.svg";
import CheckSvg from "../../assets/icons/check.svg";
import PlaySvg from "../../assets/icons/play.svg";
import PauseSvg from "../../assets/icons/pause.svg";
import PlusSvg from "../../assets/icons/plus.svg";
import DefaultBookSvg from "../../assets/icons/defaultBook.svg";
import EditSvg from "../../assets/icons/edit.svg";

interface PodcastRowProps {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  date: string;
  duration: string;
  category?: string;
  coverUrl?: string;
  progress?: number;
  isCompleted?: boolean;
  isLiked?: boolean;
  isPlaying?: boolean;
  isOwner?: boolean;
  isAuthenticated?: boolean;
  onPlayClick?: () => void;
  onLikeClick?: () => void;
  onAddClick?: () => void;
  onEditClick?: () => void;
}

const formatDuration = (duration: string): string => {
  const parts = duration.split(":").map(Number);
  let totalMinutes = 0;

  if (parts.length === 3) {
    totalMinutes = parts[0] * 60 + parts[1];
  } else if (parts.length === 2) {
    totalMinutes = parts[0];
  }

  return `${totalMinutes} мин`;
};

const calcTimeLeft = (duration: string, progress: number): string => {
  const parts = duration.split(":").map(Number);
  let totalSeconds = 0;

  if (parts.length === 3) {
    totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    totalSeconds = parts[0] * 60 + parts[1];
  }

  const leftSeconds = Math.ceil(totalSeconds * (100 - progress) / 100);
  const leftMinutes = Math.ceil(leftSeconds / 60);

  return `Осталось ${leftMinutes} мин`;
};

const PodcastRow: React.FC<PodcastRowProps> = ({
  id,
  title,
  author,
  date,
  duration,
  category,
  coverUrl,
  progress,
  isCompleted = false,
  isLiked = false,
  isPlaying = false,
  isOwner = false,
  isAuthenticated = false,
  onPlayClick,
  onLikeClick,
  onAddClick,
  onEditClick,
}) => {
  const navigate = useNavigate();

  const hasProgress = progress !== undefined && progress > 0 && !isCompleted;
  const { isModalOpen, closeModal, guard } =
    useAuthAction(isAuthenticated);

  const handleEditClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    navigate(`/podcasts/${id}/edit`);

    onEditClick?.();
  };

  return (
    <article className={styles.row}>
      <Link to={`/podcasts/${id}`} className={styles.rowLink}>
        <div className={styles.coverWrap}>
          {coverUrl ? (
            <img src={coverUrl} alt={title} className={styles.cover} />
          ) : (
            <div className={styles.coverPlaceholder} aria-hidden="true">
              <img src={DefaultBookSvg} alt="" className={styles.defaultCover} />
            </div>
          )}
        </div>

        <div className={styles.info}>
          <h3 className={styles.title}>{title}</h3>

          <p className={styles.author}>{author}</p>

          <div className={styles.meta}>
            <span className={styles.metaItem}>{date}</span>
            <span className={styles.metaItem}>{formatDuration(duration)}</span>

            {category && <span className={styles.tag}>{category}</span>}
          </div>

          {hasProgress && (
            <div className={styles.progressWrap}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <span className={styles.timeLeft}>
                {calcTimeLeft(duration, progress)}
              </span>
            </div>
          )}

          {isCompleted && (
            <div className={styles.completed}>
              <img
                src={CheckSvg}
                alt=""
                aria-hidden="true"
                className={styles.checkIcon}
              />
              <span>Прослушано</span>
            </div>
          )}
        </div>
      </Link>

      <div className={styles.actions}>
        {isOwner && (
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleEditClick}
            aria-label="Редактировать подкаст"
          >
            <img
              src={EditSvg}
              alt=""
              aria-hidden="true"
              className={styles.actionIcon}
            />
          </button>
        )}

        <button
          type="button"
          className={styles.actionBtn}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();

            guard(onAddClick)();
          }}
          aria-label="Добавить в плейлист"
        >
          <img
            src={PlusSvg}
            alt=""
            aria-hidden="true"
            className={styles.actionIcon}
          />
        </button>

        <button
          type="button"
          className={styles.actionBtn}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();

            guard(onLikeClick)();
          }}
          aria-label={isLiked ? "Убрать лайк" : "Лайк"}
        >
          <img
            src={isLiked ? LikeActiveSvg : LikeDefaultSvg}
            alt=""
            aria-hidden="true"
            className={styles.actionIcon}
          />
        </button>

        <button
          type="button"
          className={styles.playBtn}
          onClick={onPlayClick}
          aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
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

export default PodcastRow;