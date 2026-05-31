import React from "react";
import styles from "./PlaylistHero.module.css";

import { useAuthAction } from "../../hooks/useAuthAction";
import LoginPromptModal from "../LoginPromptModal/LoginPromptModal";

import EpisodeSvg from "../../assets/icons/episode.svg";
import TimerSvg from "../../assets/icons/timer.svg";
import DateSvg from "../../assets/icons/date.svg";
import ListenersSvg from "../../assets/icons/listeners.svg";
import DefaultBookSvg from "../../assets/icons/defaultBook.svg";
import LockSvg from "../../assets/icons/lock.svg";
import GlobeSvg from "../../assets/icons/globe.svg";
import YoutubeSvg from "../../assets/icons/youtube.svg";

interface PlaylistHeroProps {
    title: string;
    author: string;
    description?: string;
    coverUrl?: string;
    isPrivate?: boolean;
    isOwner: boolean;
    isAuthor?: boolean;
    canPublishToYoutube?: boolean;
    episodesCount: number;
    totalDuration: string;
    createdAt: string;
    listeners: number;
    isAdded?: boolean;
    isAuthenticated?: boolean;
    onPlayAll?: () => void;
    onAddClick?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onPublishToYoutube?: () => void;
}

const formatListeners = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)} млн`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)} тыс`;
    return String(count);
};

const PlaylistHero: React.FC<PlaylistHeroProps> = ({
    title,
    author,
    description,
    coverUrl,
    isPrivate = false,
    isOwner,
    isAuthor = false,
    canPublishToYoutube = false,
    episodesCount,
    totalDuration,
    createdAt,
    listeners,
    isAdded = false,
    isAuthenticated = false,
    onPlayAll,
    onAddClick,
    onEdit,
    onDelete,
    onPublishToYoutube,
}) => {
    const { isModalOpen, closeModal, guard } = useAuthAction(isAuthenticated);
    return (
        <section className={styles.hero}>

            <div className={styles.coverWrap}>
                {coverUrl ? (
                    <img src={coverUrl} alt={title} className={styles.cover} />
                ) : (
                    <div className={styles.coverPlaceholder}>
                        <img src={DefaultBookSvg} alt="" aria-hidden="true" className={styles.coverPlaceholderIcon} />
                    </div>
                )}
            </div>

            <div className={styles.info}>

                <div className={styles.statusBadge}>
                    <img
                        src={isPrivate ? LockSvg : GlobeSvg}
                        alt=""
                        aria-hidden="true"
                        className={styles.statusIcon}
                    />
                    <span className={styles.statusLabel}>
                        {isPrivate ? "Приватный" : "Публичный"}
                    </span>
                </div>

                <h1 className={styles.title}>{title}</h1>

                <p className={styles.author}>{author}</p>

                {description && (
                    <p className={styles.description}>{description}</p>
                )}

                <div className={styles.meta}>
                    <div className={styles.metaItem}>
                        <img src={EpisodeSvg} alt="" aria-hidden="true" className={styles.metaIcon} />
                        <span className={styles.metaText}>{episodesCount} эпизодов</span>
                    </div>

                    <div className={styles.metaItem}>
                        <img src={TimerSvg} alt="" aria-hidden="true" className={styles.metaIcon} />
                        <span className={styles.metaText}>{totalDuration} мин</span>
                    </div>

                    <div className={styles.metaItem}>
                        <img src={DateSvg} alt="" aria-hidden="true" className={styles.metaIcon} />
                        <span className={styles.metaText}>{createdAt}</span>
                    </div>

                    <div className={styles.metaItem}>
                        <img src={ListenersSvg} alt="" aria-hidden="true" className={styles.metaIcon} />
                        <span className={styles.metaText}>{formatListeners(listeners)}</span>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button type="button" className={styles.btnPlay} onClick={onPlayAll}>
                        Слушать все
                    </button>

                    {isOwner ? (
                        <>
                            <button type="button" className={styles.btnEdit} onClick={onEdit}>
                                Изменить
                            </button>

                            <button type="button" className={styles.btnDelete} onClick={onDelete}>
                                Удалить
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            className={isAdded ? styles.btnRemove : styles.btnAdd}
                            onClick={guard(onAddClick)}
                        >
                            {isAdded ? "Удалить у себя" : "Добавить к себе"}
                        </button>
                    )}
                </div>

                {canPublishToYoutube && (
                    <button
                        type="button"
                        className={styles.btnYoutube}
                        onClick={onPublishToYoutube}
                    >
                        <img src={YoutubeSvg} alt="" aria-hidden="true" className={styles.youtubeIcon} />
                        Опубликовать на YouTube Music
                    </button>
                )}

            </div>
            {isModalOpen && (
                <LoginPromptModal onClose={closeModal} />
            )}
        </section>
    );
};

export default PlaylistHero;