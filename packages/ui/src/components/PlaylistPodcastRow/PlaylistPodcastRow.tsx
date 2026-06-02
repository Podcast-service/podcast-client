import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "./PlaylistPodcastRow.module.css";
import { usePlayerOptional } from "../Player/PlayerProvider";

import PlusSvg from "../../assets/icons/plus.svg";
import CheckSvg from "../../assets/icons/check.svg";
import PlaySvg from "../../assets/icons/play.svg";
import PauseSvg from "../../assets/icons/pause.svg";
import CrestSvg from "../../assets/icons/crest.svg";
import MoveSvg from "../../assets/icons/move.svg";
import DefaultBookSvg from "../../assets/icons/defaultBook.svg";

interface PlaylistPodcastRowProps {
    id: string;
    title: string;
    author: string;
    coverUrl?: string;
    variant: "selector" | "added";
    isAdded?: boolean;
    isPlaying?: boolean;
    onAddClick?: () => void;
    onRemoveClick?: () => void;
    onPlayClick?: () => void;
}

const PlaylistPodcastRow: React.FC<PlaylistPodcastRowProps> = ({
    id,
    title,
    author,
    coverUrl,
    variant,
    isAdded = false,
    isPlaying = false,
    onAddClick,
    onRemoveClick,
    onPlayClick,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled: variant === "selector" });

    const player = usePlayerOptional();
    const playingNow = player
        ? player.activePodcast?.id === id && player.isPlaying
        : isPlaying;

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <article
            ref={setNodeRef}
            style={style}
            className={`${styles.row} ${isDragging ? styles.dragging : ""}`}
        >
            <div className={styles.coverWrap}>
                {coverUrl ? (
                    <img src={coverUrl} alt={title} className={styles.cover} />
                ) : (
                    <div className={styles.coverPlaceholder}>
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
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.author}>{author}</p>
            </div>

            <div className={styles.actions}>
                {variant === "selector" ? (
                    <>
                        <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={onAddClick}
                            aria-label={isAdded ? "Убрать из плейлиста" : "Добавить в плейлист"}
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
                            aria-label={playingNow ? "Пауза" : "Воспроизвести"}
                        >
                            <img
                                src={playingNow ? PauseSvg : PlaySvg}
                                alt=""
                                aria-hidden="true"
                                className={styles.playIcon}
                            />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={onRemoveClick}
                            aria-label="Убрать из плейлиста"
                        >
                            <img
                                src={CrestSvg}
                                alt=""
                                aria-hidden="true"
                                className={styles.actionIcon}
                            />
                        </button>

                        <button
                            type="button"
                            className={styles.moveBtn}
                            aria-label="Переместить"
                            {...attributes}
                            {...listeners}
                        >
                            <img
                                src={MoveSvg}
                                alt=""
                                aria-hidden="true"
                                className={styles.actionIcon}
                            />
                        </button>
                    </>
                )}
            </div>
        </article>
    );
};

export default PlaylistPodcastRow;