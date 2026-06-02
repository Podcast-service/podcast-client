import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Hls from "hls.js";
import { getPodcast, isAuthenticated, savePodcastProgress } from "../../api/podcast";

/**
 * Подкаст, который можно отправить в плеер. Страницы передают карточку
 * (id + метаданные), audioUrl приходит из GET /podcasts/{id} и догружается
 * автоматически, если его нет в переданном объекте.
 */
export interface PlayablePodcast {
  id: string;
  title?: string;
  author?: string;
  coverUrl?: string;
  /** HLS .m3u8. Если не передан — догружается через getPodcast(id). */
  audioUrl?: string | null;
  durationSeconds?: number | null;
  progressSeconds?: number | null;
}

interface ActivePodcastMeta {
  id: string;
  title?: string;
  author?: string;
  coverUrl?: string;
}

interface PlayerContextValue {
  /** Текущий подкаст в плеере (null — плеер скрыт). */
  activePodcast: ActivePodcastMeta | null;
  isPlaying: boolean;
  /** Идёт загрузка манифеста/буферизация. */
  isLoading: boolean;
  error: string | null;
  /** Текущая позиция, сек. */
  currentTime: number;
  /** Длительность, сек (0, пока неизвестна). */
  duration: number;
  /** Громкость 0–100. */
  volume: number;
  /** Можно ли перейти к следующему/предыдущему подкасту в очереди. */
  hasNext: boolean;
  hasPrev: boolean;
  /** Включён ли режим случайного воспроизведения. */
  isShuffle: boolean;
  /** Включён ли повтор текущего подкаста (loop). */
  isRepeat: boolean;
  /**
   * Запустить подкаст. Повторный вызов с тем же id — пауза/возобновление.
   * Вторым аргументом можно передать очередь (список подкастов, в котором
   * лежит этот подкаст) — тогда становятся активны кнопки вперёд/назад.
   */
  playPodcast: (
    podcast: PlayablePodcast | Record<string, any>,
    queue?: Array<PlayablePodcast | Record<string, any>>
  ) => void;
  togglePlay: () => void;
  /** Следующий/предыдущий подкаст очереди (с учётом shuffle). */
  next: () => void;
  prev: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  /** Сдвинуть позицию на delta секунд (отрицательное — назад). */
  seekBy: (deltaSeconds: number) => void;
  /** Перемотать на долю 0–100. */
  seekToPercent: (percent: number) => void;
  setVolumePercent: (percent: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

/** Приведение произвольной карточки подкаста к PlayablePodcast. */
const normalize = (input: PlayablePodcast | Record<string, any>): PlayablePodcast => ({
  id: String(input.id),
  title: input.title,
  author:
    typeof input.author === "string" ? input.author : input.author?.authorName,
  coverUrl: input.coverUrl ?? input.coverImageUrl ?? undefined,
  audioUrl: input.audioUrl ?? input.audio_url_file ?? null,
  durationSeconds: input.durationSeconds ?? null,
  progressSeconds: input.progressSeconds ?? null,
});

/** Случайный индекс в [0, len), не равный current (для shuffle). */
const randomOtherIndex = (len: number, current: number): number => {
  if (len <= 1) return current;
  let idx = Math.floor(Math.random() * (len - 1));
  if (idx >= current) idx += 1; // пропускаем текущий
  return idx;
};

const PROGRESS_SAVE_INTERVAL = 15; // сек между сохранениями прогресса

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  // Позиция, на которую нужно перемотать после загрузки метаданных (resume).
  const resumeRef = useRef(0);
  // id активного подкаста — для сравнения в playPodcast без замыкания на state.
  const activeIdRef = useRef<string | null>(null);
  // Последняя сохранённая на бэкенд позиция, чтобы не слать запрос каждую сек.
  const lastSavedRef = useRef(0);
  // Идёт переключение на другой подкаст: пауза старого трека не должна
  // повторно сохранять прогресс (он уже сохранён под старым id).
  const switchingRef = useRef(false);

  // Очередь и позиция в ней — refs для логики (next/prev/ended без stale-замыканий),
  // дублируются в state для перерисовки кнопок.
  const queueRef = useRef<PlayablePodcast[]>([]);
  const queueIndexRef = useRef(-1);
  const shuffleRef = useRef(false);
  const repeatRef = useRef(false);
  // Авто-переход в конце трека (заполняется ниже, вызывается из onEnded).
  const autoAdvanceRef = useRef<() => boolean>(() => false);

  const [activePodcast, setActivePodcast] = useState<ActivePodcastMeta | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [queueLength, setQueueLength] = useState(0);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  // Один <audio> на всё приложение создаётся лениво и переиспользуется.
  const getAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "metadata";
      audio.volume = volume / 100;
      audioRef.current = audio;
    }
    return audioRef.current;
    // volume намеренно не в зависимостях: начальное значение, дальше — через эффект
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProgress = useCallback((seconds: number) => {
    const id = activeIdRef.current;
    if (!id || !isAuthenticated() || seconds <= 0) return;
    lastSavedRef.current = seconds;
    savePodcastProgress(id, Math.floor(seconds)).catch(() => {
      /* прогресс — не критично, ошибки глотаем */
    });
  }, []);

  // Подписка на события <audio>. Вешается один раз.
  useEffect(() => {
    const audio = getAudio();

    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
      const resume = resumeRef.current;
      // Подкаст уже прослушан (позиция у самого конца, как считает бэкенд при
      // >= 95% длительности) — запускаем с начала, а не с сохранённой позиции.
      const isCompleted = audio.duration > 0 && resume >= audio.duration * 0.95;
      if (resume > 0 && resume < audio.duration && !isCompleted) {
        audio.currentTime = resume;
      }
      resumeRef.current = 0;
    };
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (
        audio.currentTime - lastSavedRef.current >= PROGRESS_SAVE_INTERVAL
      ) {
        saveProgress(audio.currentTime);
      }
    };
    const onDurationChange = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onPlay = () => {
      switchingRef.current = false;
      setIsPlaying(true);
    };
    const onPause = () => {
      setIsPlaying(false);
      // При переключении прогресс старого трека уже сохранён — не дублируем
      // (и не пишем старую позицию под новый id).
      if (switchingRef.current) return;
      saveProgress(audio.currentTime);
    };
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => setIsLoading(false);
    const onEnded = () => {
      saveProgress(audio.duration);
      // В конце трека — автопереход к следующему (с учётом shuffle/границ).
      const advanced = autoAdvanceRef.current();
      if (!advanced) setIsPlaying(false);
    };
    const onError = () => {
      switchingRef.current = false;
      setIsLoading(false);
      setError("Не удалось воспроизвести аудио");
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      audio.pause();
    };
  }, [getAudio, saveProgress]);

  // Загрузка HLS-источника в <audio>: нативно (Safari) либо через hls.js.
  const attachSource = useCallback(
    (url: string) => {
      const audio = getAudio();

      hlsRef.current?.destroy();
      hlsRef.current = null;

      const canNative = audio.canPlayType("application/vnd.apple.mpegurl");
      if (canNative) {
        audio.src = url;
        audio.load();
        return;
      }

      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        hls.on(Hls.Events.ERROR, (_evt, data) => {
          if (data.fatal) {
            setIsLoading(false);
            setError("Не удалось загрузить аудиопоток");
          }
        });
        hls.loadSource(url);
        hls.attachMedia(audio);
        hlsRef.current = hls;
        return;
      }

      // Крайний случай: пусть браузер попробует сам.
      audio.src = url;
      audio.load();
    },
    [getAudio]
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    if (audio.paused) {
      audio.play().catch(() => setError("Воспроизведение заблокировано"));
    } else {
      audio.pause();
    }
  }, []);

  // Загрузка и запуск конкретного подкаста (без управления очередью).
  const loadPodcast = useCallback(
    async (podcast: PlayablePodcast) => {
      const audio = getAudio();

      // Мгновенно обрываем текущий трек: сохраняем его позицию под старым id,
      // ставим на паузу и останавливаем загрузку старого источника. Иначе во
      // время запроса audioUrl нового подкаста старый продолжал бы звучать,
      // а его timeupdate возвращал бы прогресс-бар назад.
      if (audio.src && activeIdRef.current) {
        switchingRef.current = true;
        saveProgress(audio.currentTime);
        audio.pause();
        hlsRef.current?.destroy();
        hlsRef.current = null;
      }

      activeIdRef.current = podcast.id;
      lastSavedRef.current = 0;
      setActivePodcast({
        id: podcast.id,
        title: podcast.title,
        author: podcast.author,
        coverUrl: podcast.coverUrl,
      });
      setError(null);
      setIsLoading(true);
      setCurrentTime(0); // прогресс-бар сразу на 0
      setDuration(podcast.durationSeconds ?? 0);

      let url = podcast.audioUrl ?? null;
      resumeRef.current = podcast.progressSeconds ?? 0;

      try {
        // audioUrl приходит только из детальной ручки — догружаем по id.
        if (!url) {
          const detail = await getPodcast(podcast.id);
          // Гонка: за время запроса пользователь переключил подкаст.
          if (activeIdRef.current !== podcast.id) return;
          url = detail.audioUrl ?? detail.audio_url_file ?? null;
          resumeRef.current = detail.progressSeconds ?? resumeRef.current;
          if (detail.durationSeconds) setDuration(detail.durationSeconds);
          setActivePodcast((prev) =>
            prev && prev.id === podcast.id
              ? {
                  ...prev,
                  title: prev.title ?? detail.title,
                  author: prev.author ?? detail.author?.authorName,
                  coverUrl: prev.coverUrl ?? detail.coverImageUrl ?? undefined,
                }
              : prev
          );
        }

        if (!url) {
          setIsLoading(false);
          setError("Аудио ещё не готово");
          return;
        }

        attachSource(url);
        audio.loop = repeatRef.current; // сохраняем режим повтора между треками
        await audio.play().catch(() => {
          /* первый play может быть прерван attach — не критично */
        });
      } catch {
        if (activeIdRef.current === podcast.id) {
          setIsLoading(false);
          setError("Не удалось загрузить подкаст");
        }
      }
    },
    [attachSource, getAudio, saveProgress]
  );

  // Перейти к подкасту очереди по индексу.
  const playAtIndex = useCallback(
    (index: number) => {
      const queue = queueRef.current;
      if (index < 0 || index >= queue.length) return;
      queueIndexRef.current = index;
      setQueueIndex(index);
      loadPodcast(queue[index]);
    },
    [loadPodcast]
  );

  const playPodcast = useCallback(
    (
      input: PlayablePodcast | Record<string, any>,
      queue?: Array<PlayablePodcast | Record<string, any>>
    ) => {
      if (!input?.id) return;
      const podcast = normalize(input);

      // Формируем очередь: либо переданный список, либо одиночный трек.
      let q: PlayablePodcast[];
      let idx: number;
      if (queue && queue.length > 0) {
        q = queue.map(normalize);
        idx = q.findIndex((p) => p.id === podcast.id);
        if (idx < 0) {
          q = [podcast, ...q];
          idx = 0;
        }
      } else {
        q = [podcast];
        idx = 0;
      }
      queueRef.current = q;
      queueIndexRef.current = idx;
      setQueueLength(q.length);
      setQueueIndex(idx);

      // Тот же подкаст уже в плеере — просто пауза/возобновление.
      if (activeIdRef.current === podcast.id && audioRef.current?.src) {
        togglePlay();
        return;
      }

      loadPodcast(podcast);
    },
    [loadPodcast, togglePlay]
  );

  const next = useCallback(() => {
    const q = queueRef.current;
    const i = queueIndexRef.current;
    if (q.length <= 1) return;
    if (shuffleRef.current) {
      playAtIndex(randomOtherIndex(q.length, i));
    } else if (i + 1 < q.length) {
      playAtIndex(i + 1);
    }
  }, [playAtIndex]);

  const prev = useCallback(() => {
    const q = queueRef.current;
    const i = queueIndexRef.current;
    if (q.length <= 1) return;
    if (shuffleRef.current) {
      playAtIndex(randomOtherIndex(q.length, i));
    } else if (i - 1 >= 0) {
      playAtIndex(i - 1);
    }
  }, [playAtIndex]);

  // Автопереход в конце трека: возвращает true, если переключились.
  autoAdvanceRef.current = () => {
    const q = queueRef.current;
    const i = queueIndexRef.current;
    if (q.length <= 1) return false;
    if (shuffleRef.current) {
      playAtIndex(randomOtherIndex(q.length, i));
      return true;
    }
    if (i + 1 < q.length) {
      playAtIndex(i + 1);
      return true;
    }
    return false;
  };

  const toggleShuffle = useCallback(() => {
    shuffleRef.current = !shuffleRef.current;
    setIsShuffle(shuffleRef.current);
  }, []);

  const toggleRepeat = useCallback(() => {
    repeatRef.current = !repeatRef.current;
    setIsRepeat(repeatRef.current);
    // Зацикливание реализовано через <audio loop> — в режиме повтора
    // событие ended не возникает и автопереход к следующему не срабатывает.
    if (audioRef.current) audioRef.current.loop = repeatRef.current;
  }, []);

  const seekBy = useCallback((deltaSeconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0)
      return;
    const target = Math.min(
      audio.duration,
      Math.max(0, audio.currentTime + deltaSeconds)
    );
    audio.currentTime = target;
    setCurrentTime(target);
  }, []);

  const seekToPercent = useCallback((percent: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0)
      return;
    const clamped = Math.min(100, Math.max(0, percent));
    audio.currentTime = (clamped / 100) * audio.duration;
    setCurrentTime(audio.currentTime);
  }, []);

  const setVolumePercent = useCallback(
    (percent: number) => {
      const clamped = Math.min(100, Math.max(0, percent));
      setVolume(clamped);
      getAudio().volume = clamped / 100;
    },
    [getAudio]
  );

  // Кнопки вперёд/назад активны только при наличии очереди (и по границам,
  // если shuffle выключен; при включённом — пока в очереди >1 трека).
  const hasNext = isShuffle
    ? queueLength > 1
    : queueIndex >= 0 && queueIndex < queueLength - 1;
  const hasPrev = isShuffle ? queueLength > 1 : queueIndex > 0;

  const value: PlayerContextValue = {
    activePodcast,
    isPlaying,
    isLoading,
    error,
    currentTime,
    duration,
    volume,
    hasNext,
    hasPrev,
    isShuffle,
    isRepeat,
    playPodcast,
    togglePlay,
    next,
    prev,
    toggleShuffle,
    toggleRepeat,
    seekBy,
    seekToPercent,
    setVolumePercent,
  };

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
};

/** Доступ к плееру. Должен вызываться внутри <PlayerProvider>. */
export const usePlayer = (): PlayerContextValue => {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer must be used within <PlayerProvider>");
  }
  return ctx;
};

/**
 * То же, что usePlayer, но возвращает null вне <PlayerProvider> вместо ошибки.
 * Для карточек/строк, которые подсвечивают активный подкаст, но могут
 * рендериться и в изоляции (например, в DevPage).
 */
export const usePlayerOptional = (): PlayerContextValue | null =>
  useContext(PlayerContext);
