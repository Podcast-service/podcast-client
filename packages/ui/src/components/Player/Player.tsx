import React, { useState } from "react";
import styles from "./Player.module.css";

import ShuffleSvg from "../../assets/icons/shuffle.svg";
import PrevSvg from "../../assets/icons/prev.svg";
import PlaySvg from "../../assets/icons/play.svg";
import PauseSvg from "../../assets/icons/pause.svg";
import NextSvg from "../../assets/icons/next.svg";
import RepeatSvg from "../../assets/icons/repeat.svg";
import DownloadSvg from "../../assets/icons/download.svg";
import DoneDownloadSvg from "../../assets/icons/doneDownload.svg";
import ProgressDownloadSvg from "../../assets/icons/progressDownload.svg";
import QueueSvg from "../../assets/icons/queue.svg";
import VolumeSvg from "../../assets/icons/volume.svg";
import DefaultBookSvg from "../../assets/icons/defaultBook.svg";

type DownloadStatus = "idle" | "loading" | "done";

interface PlayerProps {
  isVisible?: boolean;
  title?: string;
  episode?: string;
  coverUrl?: string;
  currentTime?: string;
  totalTime?: string;
  progress?: number;
  volume?: number;
  downloadStatus?: DownloadStatus;
  onDownloadClick?: () => void;
}

const Player: React.FC<PlayerProps> = ({
  isVisible = false,
  title = "The Stoic Mindset in the Digital Age",
  episode = "Эпизод 52",
  coverUrl,
  currentTime = "4:04",
  totalTime = "12:34",
  progress = 33,
  volume = 80,
  downloadStatus = "idle",
  onDownloadClick,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(progress);
  const [currentVolume, setCurrentVolume] = useState(volume);

  if (!isVisible) {
    return null;
  }

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
    <section className={styles.player} aria-label="Плеер">
      <div className={styles.trackInfo}>
        <div className={styles.coverWrap}>
          <img
            src={coverUrl || DefaultBookSvg}
            alt={title}
            className={styles.cover}
          />
        </div>

        <div className={styles.trackText}>
          <span className={styles.trackTitle}>{title}</span>
          <span className={styles.trackEpisode}>{episode}</span>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlButtons}>
          <button
            type="button"
            className={styles.controlBtn}
            aria-label="Перемешать"
          >
            <img src={ShuffleSvg} alt="" aria-hidden="true" />
          </button>

          <button
            type="button"
            className={styles.controlBtn}
            aria-label="Предыдущий"
          >
            <img src={PrevSvg} alt="" aria-hidden="true" />
          </button>

          <button
            type="button"
            className={styles.playBtn}
            onClick={() => setIsPlaying((prev) => !prev)}
            aria-label={isPlaying ? "Пауза" : "Играть"}
          >
            <img
              src={isPlaying ? PauseSvg : PlaySvg}
              alt=""
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            className={styles.controlBtn}
            aria-label="Следующий"
          >
            <img src={NextSvg} alt="" aria-hidden="true" />
          </button>

          <button
            type="button"
            className={styles.controlBtn}
            aria-label="Повтор"
          >
            <img src={RepeatSvg} alt="" aria-hidden="true" />
          </button>
        </div>

        <div className={styles.progressWrap}>
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
              onChange={(event) =>
                setCurrentProgress(Number(event.target.value))
              }
              className={styles.progressInput}
              aria-label="Прогресс"
            />
          </div>

          <span className={styles.time}>{totalTime}</span>
        </div>
      </div>

      <div className={styles.extra}>
        <button
          type="button"
          className={`${styles.extraBtn} ${
            downloadStatus === "loading" ? styles.downloadLoading : ""
          }`}
          onClick={onDownloadClick}
          disabled={downloadStatus === "loading"}
          aria-label={downloadLabel}
          title={downloadLabel}
        >
          <img src={downloadIcon} alt="" aria-hidden="true" />
        </button>

        <button type="button" className={styles.extraBtn} aria-label="Очередь">
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
              onChange={(event) =>
                setCurrentVolume(Number(event.target.value))
              }
              className={styles.volumeInput}
              aria-label="Громкость"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Player;