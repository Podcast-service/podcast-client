import React, { useState } from "react";
import styles from "./PodcastHero.module.css";

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
import DownloadSvg from "../../assets/icons/download.svg";
import DoneDownloadSvg from "../../assets/icons/doneDownload.svg";
import ProgressDownloadSvg from "../../assets/icons/progressDownload.svg";
import LeftTimerSvg from "../../assets/icons/leftTimer.svg";
import RightTimerSvg from "../../assets/icons/rightTime.svg";
import QueueSvg from "../../assets/icons/queue.svg";
import VolumeSvg from "../../assets/icons/volume.svg";
import PlaySvg from "../../assets/icons/play.svg";
import PauseSvg from "../../assets/icons/pause.svg";
import DefaultBookSvg from "../../assets/icons/defaultBook.svg";

type DownloadStatus = "idle" | "loading" | "done";

interface PodcastHeroProps {
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

const PodcastHero: React.FC<PodcastHeroProps> = ({
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

  const downloadIcon =
    downloadStatus === "done"
      ? DoneDownloadSvg
      : downloadStatus === "loading"
        ? ProgressDownloadSvg
        : DownloadSvg;

  const downloadLabel =
    downloadStatus === "done"
      ? "Скачано"
      : downloadStatus === "loading"
        ? "Скачивается"
        : "Скачать";

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
              src={isPlaying ? StopSvg : PlayTopSvg}
              alt=""
              aria-hidden="true"
            />
            {isPlaying ? "Остановить" : "Воспроизвести"}
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

          <button
            type="button"
            className={`${styles.downloadBtn} ${
              downloadStatus === "loading" ? styles.downloadLoading : ""
            }`}
            onClick={onDownloadClick}
            disabled={downloadStatus === "loading"}
            aria-label={downloadLabel}
          >
            <img src={downloadIcon} alt="" aria-hidden="true" />
            {downloadLabel}
          </button>
        </div>

        <div className={styles.inlinePlayer}>
          <div className={styles.progressRow}>
            <span className={styles.time}>{currentTime}</span>

            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${currentProgress}%` }}
              />

              <input
                type="range"
                min={0}
                max={100}
                value={currentProgress}
                onChange={(e) => setCurrentProgress(Number(e.target.value))}
                className={styles.rangeInput}
                aria-label="Прогресс подкаста"
              />
            </div>

            <span className={styles.time}>{duration}</span>
          </div>

          <div className={styles.playerBottom}>
            <div className={styles.playerControls}>
              <button
                type="button"
                className={styles.playerBtn}
                aria-label="Назад на 10 секунд"
              >
                <img src={LeftTimerSvg} alt="" aria-hidden="true" />
              </button>

              <button
                type="button"
                className={styles.playerPlayBtn}
                onClick={onPlayClick}
                aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
              >
                <img
                  src={isPlaying ? PauseSvg : PlaySvg}
                  alt=""
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                className={styles.playerBtn}
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
                    style={{ width: `${currentVolume}%` }}
                  />

                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={currentVolume}
                    onChange={(e) => setCurrentVolume(Number(e.target.value))}
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