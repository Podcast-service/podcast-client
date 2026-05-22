import React, { useMemo, useState } from "react";
import styles from "./AuthorPage.module.css";

import AuthorProfileHero from "../../components/AuthorProfileHero/AuthorProfileHero";
import AuthorPodcastsCarousel from "../../components/AuthorPodcastsCarousel/AuthorPodcastsCarousel";
import PodcastRow from "../../components/PodcastRow/PodcastRow";

const AVATAR =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop";

const COVER =
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop";

const AUTHOR_PLAYLISTS = [
  {
    id: "1",
    title: "Эмоциональный интеллект",
    author: "Мария Смирнова",
    episodesCount: 24,
    coverUrl: COVER,
    listeners: 12300,
    likes: 2500,
    dislikes: 243,
    isAdded: true,
  },
  {
    id: "2",
    title: "Лидерство и Рост",
    author: "Мария Смирнова",
    episodesCount: 24,
    coverUrl: COVER,
    listeners: 12300,
    likes: 2500,
    dislikes: 243,
  },
  {
    id: "3",
    title: "Осознанность",
    author: "Мария Смирнова",
    episodesCount: 18,
    coverUrl: COVER,
    listeners: 8700,
    likes: 1400,
    dislikes: 96,
  },
  {
    id: "4",
    title: "Мышление лидера",
    author: "Мария Смирнова",
    episodesCount: 31,
    coverUrl: COVER,
    listeners: 18700,
    likes: 5400,
    dislikes: 221,
  },
];

const AUTHOR_PODCASTS = Array.from({ length: 6 }, (_, index) => ({
  id: String(index + 1),
  title: [
    "Как справиться с прокрастинацией",
    "Искусство глубокого сна",
    "Почему мы забываем важное?",
    "Эмпатия в цифровой век",
  ][index % 4],
  author: "Александр Соколов",
  date: "12 окт 2023",
  duration: "45:00",
  category: "Саморазвитие",
  coverUrl: index % 3 === 0 ? undefined : COVER,
  progress: index === 0 ? 66 : undefined,
  isCompleted: index === 2,
  isLiked: index === 1,
}));

const AuthorPage: React.FC = () => {
  const [searchValue, setSearchValue] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const filteredPodcasts = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) return AUTHOR_PODCASTS;

    return AUTHOR_PODCASTS.filter((podcast) =>
      podcast.title.toLowerCase().includes(query)
    );
  }, [searchValue]);

  
  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <div className={styles.offsetContent}>
            <AuthorProfileHero
                name="Александр Соколов"
                category="Психология"
                description="Практикующий психолог и исследователь человеческого поведения. В своих подкастах Александр исследует глубины сознания, когнитивные искажения и способы достижения внутреннего спокойствия в современном мире."
                subscribers={124500}
                avatarUrl={AVATAR}
                isSubscribed={isSubscribed}
                onSubscribeClick={() => setIsSubscribed((prev) => !prev)}
                onShareClick={() => {}}
            />
        </div>

        <AuthorPodcastsCarousel playlists={AUTHOR_PLAYLISTS} />

        <section className={`${styles.allPodcasts} ${styles.offsetContent}`}>
          <div className={styles.listHeader}>
            <h2 className={styles.sectionTitle}>Все подкасты</h2>

            <input
              type="text"
              className={styles.searchInput}
              placeholder="Поиск по названию..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>

          <div className={styles.list}>
            {filteredPodcasts.map((podcast) => (
              <PodcastRow key={podcast.id} {...podcast} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthorPage;