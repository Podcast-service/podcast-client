import React, { useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import styles from "./MainPage.module.css";

import SectionRow from "../../components/SectionRow/SectionRow";
import PodcastCard from "../../components/PodcastCard/PodcastCard";
import AuthorCard from "../../components/AuthorCard/AuthorCard";

import FireSvg from "../../assets/icons/fire.svg";
import UserSvg from "../../assets/icons/user.svg";
import ClockSvg from "../../assets/icons/clock.svg";
import HeadphonesSvg from "../../assets/icons/listeners.svg";
import PlaySvg from "../../assets/icons/playTop.svg";

interface Podcast {
  id: string;
  title: string;
  author: string;
  duration: string;
  listeners: number;
  likes: number;
  dislikes: number;
  coverUrl?: string;
  description?: string;
  progress?: number;
}

interface Author {
  id: string;
  name: string;
  category: string;
  subscribers: number;
  avatarUrl?: string;
  isSubscribed?: boolean;
}

interface MainLayoutContext {
  playPodcast: (podcast: Podcast) => void;
}

const PODCAST_COVER =
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=1200&auto=format&fit=crop";

const isAuthenticated = true;
const hasSubscriptions = true;

const formatDuration = (duration: string) => {
  const minutes = Number(duration.split(":")[0]);

  if (minutes % 10 === 1 && minutes !== 11) {
    return `${minutes} минута`;
  }

  if (
    minutes % 10 >= 2 &&
    minutes % 10 <= 4 &&
    !(minutes >= 12 && minutes <= 14)
  ) {
    return `${minutes} минуты`;
  }

  return `${minutes} минут`;
};

const formatListeners = (listeners: number) => {
  if (listeners >= 1_000_000) {
    return `${(listeners / 1_000_000).toFixed(1).replace(".", ",")}M`;
  }

  if (listeners >= 1_000) {
    return `${(listeners / 1_000).toFixed(1).replace(".", ",")}K`;
  }

  return listeners.toString();
};

const TOP_PODCASTS: Podcast[] = [
  {
    id: "1",
    title: "Неизведанный путь",
    author: "Иван Петров",
    duration: "54:03",
    listeners: 122300,
    likes: 2500,
    dislikes: 243,
    coverUrl: PODCAST_COVER,
    description:
      "Погрузитесь в глубокое исследование того, как пространство формирует наше сознание. Авторский цикл лекций о дизайне, психологии и поиске покоя в современном мире.",
  },
  {
    id: "2",
    title: "Стратегия тишины",
    author: "Алексей Воробьев",
    duration: "54:03",
    listeners: 12300,
    likes: 2500,
    dislikes: 243,
    coverUrl: PODCAST_COVER,
  },
  {
    id: "3",
    title: "Психология фокуса",
    author: "Алексей Воробьев",
    duration: "48:12",
    listeners: 12400,
    likes: 3200,
    dislikes: 120,
    coverUrl: PODCAST_COVER,
  },
  {
    id: "4",
    title: "Цифровая гигиена",
    author: "Podcast Lab",
    duration: "35:08",
    listeners: 9800,
    likes: 1400,
    dislikes: 64,
    coverUrl: PODCAST_COVER,
  },
  {
    id: "5",
    title: "Архитектура жизни",
    author: "Нейроэфир",
    duration: "56:30",
    listeners: 23100,
    likes: 5600,
    dislikes: 180,
    coverUrl: PODCAST_COVER,
  },
];

const CONTINUE_PODCASTS: Podcast[] = TOP_PODCASTS.slice(1, 5).map(
  (podcast, index) =>
    index === 0
      ? {
          ...podcast,
          progress: 42,
        }
      : podcast
);

const RECOMMENDED_PODCASTS: Podcast[] = [
  {
    id: "6",
    title: "Лабиринты мысли",
    author: "Николай Соколов",
    duration: "42:18",
    listeners: 18300,
    likes: 2900,
    dislikes: 88,
    coverUrl: PODCAST_COVER,
  },
  {
    id: "7",
    title: "Второе дыхание",
    author: "Николай Соколов",
    duration: "39:40",
    listeners: 15400,
    likes: 1800,
    dislikes: 72,
    coverUrl: PODCAST_COVER,
  },
  {
    id: "8",
    title: "Свет и тень",
    author: "Story Voice",
    duration: "1:02:11",
    listeners: 26800,
    likes: 4100,
    dislikes: 130,
    coverUrl: PODCAST_COVER,
  },
  {
    id: "9",
    title: "Путь героя",
    author: "Podcast Lab",
    duration: "45:22",
    listeners: 9700,
    likes: 1100,
    dislikes: 50,
    coverUrl: PODCAST_COVER,
  },
  {
    id: "10",
    title: "Эхо классики",
    author: "Нейроэфир",
    duration: "51:09",
    listeners: 21100,
    likes: 3500,
    dislikes: 99,
    coverUrl: PODCAST_COVER,
  },
];

const TOP_AUTHORS: Author[] = [
  {
    id: "1",
    name: "Николай Соколов",
    category: "Психология",
    subscribers: 123400,
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "2",
    name: "Алексей Воробьев",
    category: "Саморазвитие",
    subscribers: 98400,
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "3",
    name: "Podcast Lab",
    category: "Образование",
    subscribers: 87600,
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "4",
    name: "Нейроэфир",
    category: "Наука",
    subscribers: 74200,
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "5",
    name: "Story Voice",
    category: "Аудиокниги",
    subscribers: 45700,
    avatarUrl:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=600&auto=format&fit=crop",
  },
];

const getDailyPodcast = (podcasts: Podcast[]) => {
  const dayIndex = new Date().getDate() % podcasts.length;
  return podcasts[dayIndex];
};

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const { playPodcast } = useOutletContext<MainLayoutContext>();

  const heroPodcast = useMemo(() => getDailyPodcast(TOP_PODCASTS), []);

  const shouldShowRecommendations =
    isAuthenticated && hasSubscriptions && RECOMMENDED_PODCASTS.length > 0;

  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <section className={styles.hero}>
          <div className={styles.heroImageWrap}>
            <img
              src={heroPodcast.coverUrl}
              alt=""
              aria-hidden="true"
              className={styles.heroImage}
            />
          </div>

          <div className={styles.heroGradient} />

          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <img
                src={FireSvg}
                alt=""
                aria-hidden="true"
                className={styles.heroBadgeIcon}
              />

              <span className={styles.heroBadgeText}>Популярно сейчас</span>
            </div>

            <h1 className={styles.heroTitle}>{heroPodcast.title}</h1>

            <p className={styles.heroDesc}>
              {heroPodcast.description?.trim() ||
                "Один из популярных подкастов сегодня. Нажмите слушать, чтобы начать воспроизведение."}
            </p>

            <div className={styles.heroMeta}>
              <span className={styles.heroMetaItem}>
                <img
                  src={UserSvg}
                  alt=""
                  aria-hidden="true"
                  className={styles.heroMetaIcon}
                />

                {heroPodcast.author}
              </span>

              <span className={styles.heroMetaItem}>
                <img
                  src={ClockSvg}
                  alt=""
                  aria-hidden="true"
                  className={styles.heroMetaIcon}
                />

                {formatDuration(heroPodcast.duration)}
              </span>

              <span className={styles.heroMetaItem}>
                <img
                  src={HeadphonesSvg}
                  alt=""
                  aria-hidden="true"
                  className={styles.heroMetaIcon}
                />

                {formatListeners(heroPodcast.listeners)} прослушиваний
              </span>
            </div>

            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.listenBtn}
                onClick={() => playPodcast(heroPodcast)}
              >
                <img
                  src={PlaySvg}
                  alt=""
                  aria-hidden="true"
                  className={styles.listenIcon}
                />

                Слушать
              </button>

              <button
                type="button"
                className={styles.moreBtn}
                onClick={() => navigate(`/podcasts/${heroPodcast.id}`)}
              >
                Подробнее
              </button>
            </div>
          </div>
        </section>

        <div className={styles.sections}>
          <SectionRow
            title="Продолжить прослушивание"
            actionText="Смотреть все →"
            actionTo="/history"
          >
            <div className={styles.podcastsGrid}>
              {CONTINUE_PODCASTS.slice(0, 5).map((podcast) => (
                <PodcastCard key={podcast.id} {...podcast} />
              ))}
            </div>
          </SectionRow>

          <SectionRow
            title="Топ подкастов"
            actionText="Смотреть все →"
            actionTo="/podcasts"
          >
            <div className={styles.podcastsGrid}>
              {TOP_PODCASTS.slice(0, 5).map((podcast) => (
                <PodcastCard key={podcast.id} {...podcast} />
              ))}
            </div>
          </SectionRow>

          {shouldShowRecommendations && (
            <SectionRow
              title="Мои рекомендации"
              actionText="Смотреть все →"
              actionTo="/recommendation"
            >
              <div className={styles.podcastsGrid}>
                {RECOMMENDED_PODCASTS.slice(0, 5).map((podcast) => (
                  <PodcastCard key={podcast.id} {...podcast} />
                ))}
              </div>
            </SectionRow>
          )}

          <SectionRow
            title="Топ авторов"
            actionText="Смотреть все →"
            actionTo="/authors"
          >
            <div className={styles.authorsGrid}>
              {TOP_AUTHORS.slice(0, 5).map((author) => (
                <AuthorCard key={author.id} {...author} />
              ))}
            </div>
          </SectionRow>
        </div>
      </div>
    </div>
  );
};

export default MainPage;