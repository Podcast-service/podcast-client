import React, { useState } from "react";
import styles from "./PodcastHero.module.css";

import { usePlayerOptional } from "../Player/PlayerProvider";
import { useAuthAction } from "../../hooks/useAuthAction";
import LoginPromptModal from "../LoginPromptModal/LoginPromptModal";
import CopyLinkModal from "../CopyLinkModal/CopyLinkModal";
import DateSvg from "../../assets/icons/date.svg";
import TimerSvg from "../../assets/icons/timer.svg";
import ListenersSvg from "../../assets/icons/listeners.svg";
import PlayTopSvg from "../../assets/icons/continue.svg";
import StopSvg from "../../assets/icons/stop.svg";
import DefHeartSvg from "../../assets/icons/defHeart.svg";
import DefDislikeSvg from "../../assets/icons/defDislike.svg";
import ShareSvg from "../../assets/icons/share.svg";
import LeftTimerSvg from "../../assets/icons/leftTimer.svg";
import RightTimerSvg from "../../assets/icons/rightTime.svg";
import QueueSvg from "../../assets/icons/queue.svg";
import VolumeSvg from "../../assets/icons/volume.svg";
import PlaySvg from "../../assets/icons/play.svg";
import PauseSvg from "../../assets/icons/pause.svg";
import DefaultBookSvg from "../../assets/icons/defaultBook.svg";

type DownloadStatus = "idle" | "loading" | "done";

interface PodcastHeroProps {
  /** id подкаста — для синхронизации инлайн-плеера с глобальным плеером. */
  podcastId?: string;
  title: string;
  author: string;
  category: string;
  publishedAt: string;
  duration: string;
  listeners: number;
  coverUrl?: string;
  currentTime?: string;
  progress?: number;
  volume?: number;
  isPlaying?: boolean;
  isLiked?: boolean;
  isDisliked?: boolean;
  downloadStatus?: DownloadStatus;
  isAuthenticated?: boolean;
  onPlayClick?: () => void;
  onLikeClick?: () => void;
  onDislikeClick?: () => void;
  onShareClick?: () => void;
  onDownloadClick?: () => void;
}

const formatListeners = (value: number) => value.toLocaleString("en-US");

/** Секунды → "m:ss" / "h:mm:ss". */
const formatTime = (totalSeconds: number): string => {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
  const s = Math.floor(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (v: number) => v.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
};

const PodcastHero: React.FC<PodcastHeroProps> = ({
  podcastId,
  title,
  author,
  category,
  publishedAt,
  duration,
  listeners,
  coverUrl,
  currentTime = "0:00",
  progress = 0,
  volume = 80,
  isPlaying = false,
  isLiked = false,
  isDisliked = false,
  downloadStatus = "idle",
  isAuthenticated = false,
  onPlayClick,
  onLikeClick,
  onDislikeClick,
  onShareClick,
  onDownloadClick,
}) => {
  const [currentProgress, setCurrentProgress] = useState(progress);
  const [currentVolume, setCurrentVolume] = useState(volume);
  const { isModalOpen, closeModal, guard } = useAuthAction(isAuthenticated);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

  // Если этот подкаст сейчас в глобальном плеере — инлайн-плеер показывает
  // его реальные время/прогресс/громкость и управляет им; иначе работает
  // в демонстрационном режиме на локальном стейте.
  const player = usePlayerOptional();
  const isActive = Boolean(
    player && podcastId && player.activePodcast?.id === podcastId
  );
  const playingNow = isActive ? player!.isPlaying : isPlaying;

  const liveProgress =
    isActive && player!.duration > 0
      ? (player!.currentTime / player!.duration) * 100
      : null;
  const displayProgress = liveProgress ?? currentProgress;
  const displayVolume = isActive ? player!.volume : currentVolume;
  const displayCurrentTime = isActive
    ? formatTime(player!.currentTime)
    : currentTime;
  const displayDuration =
    isActive && player!.duration > 0 ? formatTime(player!.duration) : duration;

  const handleSeek = (value: number) => {
    if (isActive) player!.seekToPercent(value);
    else setCurrentProgress(value);
  };
  const handleVolume = (value: number) => {
    if (isActive) player!.setVolumePercent(value);
    else setCurrentVolume(value);
  };

  return (
    <section className={styles.hero}>
      <div className={styles.coverWrap}>
        <img
          src={coverUrl || DefaultBookSvg}
          alt={title}
          className={styles.cover}
        />
      </div>

      <div className={styles.content}>
        <span className={styles.category}>{category}</span>

        <h1 className={styles.title}>{title}</h1>

        <div className={styles.meta}>
          <span className={styles.author}>{author}</span>

          <span className={styles.metaItem}>
            <img src={DateSvg} alt="" aria-hidden="true" />
            {publishedAt}
          </span>

          <span className={styles.metaItem}>
            <img src={TimerSvg} alt="" aria-hidden="true" />
            {duration}
          </span>

          <span className={styles.metaItem}>
            <img src={ListenersSvg} alt="" aria-hidden="true" />
            {formatListeners(listeners)} прослушиваний
          </span>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.mainPlayBtn}
            onClick={onPlayClick}
          >
            <img
              src={playingNow ? StopSvg : PlayTopSvg}
              alt=""
              aria-hidden="true"
            />
            {playingNow ? "Остановить" : "Воспроизвести"}
          </button>

          <button
            type="button"
            className={`${styles.circleBtn} ${isLiked ? styles.activeBtn : ""}`}
            onClick={guard(onLikeClick)}
            aria-label="Лайк"
          >
            <img src={DefHeartSvg} alt="" aria-hidden="true" />
          </button>

          <button
            type="button"
            className={`${styles.circleBtn} ${
              isDisliked ? styles.activeBtn : ""
            }`}
            onClick={guard(onDislikeClick)}
            aria-label="Дизлайк"
          >
            <img src={DefDislikeSvg} alt="" aria-hidden="true" />
          </button>

          <button
            type="button"
            className={styles.circleBtn}
            onClick={() => {
              setIsCopyModalOpen(true);
              onShareClick?.();
            }}
            aria-label="Поделиться"
          >
            <img src={ShareSvg} alt="" aria-hidden="true" />
          </button>
        </div>

        <div className={styles.inlinePlayer}>
          <div className={styles.progressRow}>
            <span className={styles.time}>{displayCurrentTime}</span>

            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${displayProgress}%` }}
              />

              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={displayProgress}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className={styles.rangeInput}
                aria-label="Прогресс подкаста"
              />
            </div>

            <span className={styles.time}>{displayDuration}</span>
          </div>

          <div className={styles.playerBottom}>
            <div className={styles.playerControls}>
              <button
                type="button"
                className={styles.playerBtn}
                onClick={() => player!.seekBy(-10)}
                disabled={!isActive}
                aria-label="Назад на 10 секунд"
              >
                <img src={LeftTimerSvg} alt="" aria-hidden="true" />
              </button>

              <button
                type="button"
                className={styles.playerPlayBtn}
                onClick={onPlayClick}
                aria-label={playingNow ? "Пауза" : "Воспроизвести"}
              >
                <img
                  src={playingNow ? PauseSvg : PlaySvg}
                  alt=""
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                className={styles.playerBtn}
                onClick={() => player!.seekBy(30)}
                disabled={!isActive}
                aria-label="Вперед на 30 секунд"
              >
                <img src={RightTimerSvg} alt="" aria-hidden="true" />
              </button>
            </div>

            <div className={styles.playerExtra}>
              <button
                type="button"
                className={styles.playerBtn}
                aria-label="Дополнительные настройки"
              >
                <img src={QueueSvg} alt="" aria-hidden="true" />
              </button>

              <div className={styles.volumeWrap}>
                <img
                  src={VolumeSvg}
                  alt=""
                  aria-hidden="true"
                  className={styles.volumeIcon}
                />

                <div className={styles.volumeBar}>
                  <div
                    className={styles.volumeFill}
                    style={{ width: `${displayVolume}%` }}
                  />

                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={displayVolume}
                    onChange={(e) => handleVolume(Number(e.target.value))}
                    className={styles.rangeInput}
                    aria-label="Громкость"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <LoginPromptModal onClose={closeModal} />
      )}
      {isCopyModalOpen && (
        <CopyLinkModal
          link={window.location.href}
          onClose={() => setIsCopyModalOpen(false)}
        />
      )}
    </section>
  );
};

export default PodcastHero;