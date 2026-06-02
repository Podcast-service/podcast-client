import React from "react";
import styles from "./Player.module.css";
import { usePlayer } from "./PlayerProvider";

import ShuffleSvg from "../../assets/icons/shuffle.svg";
import PrevSvg from "../../assets/icons/prev.svg";
import PlaySvg from "../../assets/icons/play.svg";
import PauseSvg from "../../assets/icons/pause.svg";
import NextSvg from "../../assets/icons/next.svg";
import RepeatSvg from "../../assets/icons/repeat.svg";
import QueueSvg from "../../assets/icons/queue.svg";
import VolumeSvg from "../../assets/icons/volume.svg";
import DefaultBookSvg from "../../assets/icons/defaultBook.svg";

/** Секунды → "m:ss" / "h:mm:ss". В отличие от formatClock не схлопывает 0 в "". */
const formatTime = (totalSeconds: number): string => {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
  const s = Math.floor(totalSeconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (v: number) => v.toString().padStart(2, "0");
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
};

const Player: React.FC = () => {
  const {
    activePodcast,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    togglePlay,
    seekToPercent,
    setVolumePercent,
    hasNext,
    hasPrev,
    isShuffle,
    isRepeat,
    next,
    prev,
    toggleShuffle,
    toggleRepeat,
  } = usePlayer();

  // Плеер появляется только когда выбран подкаст.
  if (!activePodcast) {
    return null;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const title = activePodcast.title || "Без названия";
  const episode = activePodcast.author || "";

  return (
    <section className={styles.player} aria-label="Плеер">
      <div className={styles.trackInfo}>
        <div className={styles.coverWrap}>
          <img
            src={activePodcast.coverUrl || DefaultBookSvg}
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
            className={`${styles.controlBtn} ${
              isShuffle ? styles.controlActive : ""
            }`}
            onClick={toggleShuffle}
            aria-label="Перемешать"
            aria-pressed={isShuffle}
          >
            <img src={ShuffleSvg} alt="" aria-hidden="true" />
          </button>

          <button
            type="button"
            className={styles.controlBtn}
            onClick={prev}
            disabled={!hasPrev}
            aria-label="Предыдущий"
          >
            <img src={PrevSvg} alt="" aria-hidden="true" />
          </button>

          <button
            type="button"
            className={styles.playBtn}
            onClick={togglePlay}
            disabled={isLoading}
            aria-label={isPlaying ? "Пауза" : "Играть"}
            aria-busy={isLoading}
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
            onClick={next}
            disabled={!hasNext}
            aria-label="Следующий"
          >
            <img src={NextSvg} alt="" aria-hidden="true" />
          </button>

          <button
            type="button"
            className={`${styles.controlBtn} ${
              isRepeat ? styles.controlActive : ""
            }`}
            onClick={toggleRepeat}
            aria-label="Повторять подкаст"
            aria-pressed={isRepeat}
          >
            <img src={RepeatSvg} alt="" aria-hidden="true" />
          </button>
        </div>

        <div className={styles.progressWrap}>
          <span className={styles.time}>{formatTime(currentTime)}</span>

          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />

            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progress}
              onChange={(event) => seekToPercent(Number(event.target.value))}
              className={styles.progressInput}
              aria-label="Прогресс"
            />
          </div>

          <span className={styles.time}>
            {duration > 0 ? formatTime(duration) : "0:00"}
          </span>
        </div>
      </div>

      <div className={styles.extra}>
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
              style={{ width: `${volume}%` }}
            />

            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(event) => setVolumePercent(Number(event.target.value))}
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
