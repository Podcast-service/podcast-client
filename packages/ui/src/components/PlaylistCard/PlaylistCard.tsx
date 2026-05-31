import React from "react";
import { Link } from "react-router-dom";
import styles from "./PlaylistCard.module.css";

import { useAuthAction } from "../../hooks/useAuthAction";
import LoginPromptModal from "../LoginPromptModal/LoginPromptModal";

import PlusSvg from "../../assets/icons/plus.svg";
import CheckSvg from "../../assets/icons/check.svg";
import EditSvg from "../../assets/icons/edit.svg";
import LockSvg from "../../assets/icons/lock.svg";
import ListenersSvg from "../../assets/icons/listeners.svg";
import LikeSvg from "../../assets/icons/like.svg";
import DislikeSvg from "../../assets/icons/dislike.svg";
import DefaultBookSvg from "../../assets/icons/defaultBook.svg";

interface PlaylistCardProps {
  id: string;
  title: string;
  author: string;
  episodesCount: number;
  coverUrl?: string;
  listeners?: number;
  likes?: number;
  dislikes?: number;
  isAdded?: boolean;
  isPrivate?: boolean;
  isOwner?: boolean;
  isAuthor?: boolean;
  isAuthenticated?: boolean;
  onAddClick?: () => void;
  onEditClick?: () => void;
}

const formatStat = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(".", ",")} к`;
  }
  return value.toString();
};

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

const PlaylistCard: React.FC<PlaylistCardProps> = ({
  id,
  title,
  author,
  episodesCount,
  coverUrl,
  listeners,
  likes,
  dislikes,
  isAdded = false,
  isPrivate = false,
  isOwner = false,
  isAuthor = false,
  isAuthenticated = false,
  onAddClick,
  onEditClick,
}) => {
  const { isModalOpen, closeModal, guard } =
    useAuthAction(isAuthenticated);
  return (
    <article className={styles.card}>
      <Link to={`/playlists/${id}`} className={styles.cardLink}>
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

          {isPrivate && (
            <span className={styles.lockBadge} aria-label="Приватный плейлист">
              <img src={LockSvg} alt="" aria-hidden="true" />
            </span>
          )}

          <span className={styles.episodesBadge}>
            {formatEpisodesCount(episodesCount)}
          </span>
        </div>

        <div className={styles.info}>
          <div className={styles.topRow}>
            <div className={styles.textBlock}>
              <h3 className={styles.title}>{title}</h3>
              <p className={styles.author}>{author}</p>
            </div>

            {isOwner ? (
              <button
                type="button"
                className={styles.addBtn}
                onClick={(e) => {
                  e.preventDefault();
                  onEditClick?.();
                }}
                aria-label="Редактировать плейлист"
              >
                <img
                  src={EditSvg}
                  alt=""
                  aria-hidden="true"
                  className={styles.addIcon}
                />
              </button>
            ) : (
              <button
                type="button"
                className={styles.addBtn}
                onClick={(e) => {
                  e.preventDefault();
                  guard(onAddClick)();
                }}
                aria-label={isAdded ? "Убрать из моих плейлистов" : "Добавить в мои плейлисты"}
              >
                <img
                  src={isAdded ? CheckSvg : PlusSvg}
                  alt=""
                  aria-hidden="true"
                  className={styles.addIcon}
                />
              </button>
            )}
          </div>

          <div className={styles.stats} aria-label="Статистика плейлиста">
            {listeners !== undefined && (
              <span className={styles.stat}>
                <img src={ListenersSvg} alt="" aria-hidden="true" className={styles.statIcon} />
                {formatStat(listeners)}
              </span>
            )}

            {likes !== undefined && (
              <span className={styles.stat}>
                <img src={LikeSvg} alt="" aria-hidden="true" className={styles.statIcon} />
                {formatStat(likes)}
              </span>
            )}

            {dislikes !== undefined && (
              <span className={styles.stat}>
                <img src={DislikeSvg} alt="" aria-hidden="true" className={styles.statIcon} />
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

export default PlaylistCard;