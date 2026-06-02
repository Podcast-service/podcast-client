import React from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuthAction } from "../../hooks/useAuthAction";
import LoginPromptModal from "../LoginPromptModal/LoginPromptModal";
import { useAddToPlaylist } from "../AddToPlaylist/useAddToPlaylist";
import { usePlayerOptional } from "../Player/PlayerProvider";

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
  let totalSeconds = 0;

  if (parts.length === 3) {
    totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    totalSeconds = parts[0] * 60 + parts[1];
  }

  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "";
  }

  // Меньше минуты — в секундах, меньше часа — в минутах, дальше — в часах.
  if (totalSeconds < 60) {
    return `${totalSeconds} сек`;
  }

  if (totalSeconds < 3600) {
    return `${Math.floor(totalSeconds / 60)} мин`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return minutes > 0 ? `${hours} ч ${minutes} мин` : `${hours} ч`;
};

const calcTimeLeft = (duration: string, progress: number): string => {
  const parts = duration.split(":").map(Number);
  let totalSeconds = 0;

  if (parts.length === 3) {
    totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    totalSeconds = parts[0] * 60 + parts[1];
  }

  const leftSeconds = Math.ceil((totalSeconds * (100 - progress)) / 100);

  // Меньше минуты — в секундах, меньше часа — в минутах, дальше — в часах.
  if (leftSeconds < 60) {
    return `Осталось ${leftSeconds} сек`;
  }

  if (leftSeconds < 3600) {
    return `Осталось ${Math.ceil(leftSeconds / 60)} мин`;
  }

  const hours = Math.floor(leftSeconds / 3600);
  const minutes = Math.round((leftSeconds % 3600) / 60);
  return minutes > 0
    ? `Осталось ${hours} ч ${minutes} мин`
    : `Осталось ${hours} ч`;
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
  isAuthenticated = true,
  onPlayClick,
  onLikeClick,
  onAddClick,
  onEditClick,
}) => {
  const navigate = useNavigate();
  const addToPlaylist = useAddToPlaylist();

  // Иконка play/pause отражает реальное состояние глобального плеера.
  const player = usePlayerOptional();
  const playingNow = player
    ? player.activePodcast?.id === id && player.isPlaying
    : isPlaying;

  const hasProgress = progress !== undefined && progress > 0 && !isCompleted;
  const { isModalOpen, closeModal, guard } =
    useAuthAction(isAuthenticated);
  const handleAddClick =
    onAddClick ?? (addToPlaylist ? () => addToPlaylist.open(id) : undefined);

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
            {formatDuration(duration) && (
              <span className={styles.metaItem}>{formatDuration(duration)}</span>
            )}

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

            guard(handleAddClick)();
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
          aria-label={playingNow ? "Пауза" : "Воспроизвести"}
        >
          <img
            src={playingNow ? PauseSvg : PlaySvg}
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
