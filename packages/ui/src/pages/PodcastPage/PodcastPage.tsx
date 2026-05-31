import React from "react";
import styles from "./PodcastPage.module.css";

import PodcastHero from "../../components/PodcastHero/PodcastHero";
import PodcastTranscript from "../../components/PodcastTranscript/PodcastTranscript";
import RecommendedPodcasts from "../../components/RecommendedPodcasts/RecommendedPodcasts";

const PODCAST_COVER =
  "https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=900&auto=format&fit=crop";

const RECOMMENDED_PODCASTS = [
  {
    id: "1",
    title: "Квантовый мир: За пределами воображения",
    category: "Наука",
    duration: "48 мин",
    coverUrl:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Урбанистика будущего: Города для людей",
    category: "Общество",
    duration: "32 мин",
    coverUrl: PODCAST_COVER,
  },
  {
    id: "3",
    title: "Web 3.0: Миф или новая реальность?",
    category: "Технологии",
    duration: "55 мин",
    coverUrl:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=400&auto=format&fit=crop",
  },
];

const TRANSCRIPT_ITEMS = [
  {
    id: "1",
    speakerId: 1,
    time: "00:06",
    text: "Приветствую всех слушателей Lumina Audio. Сегодня мы погружаемся в одну из самых обсуждаемых и в то же время пугающих тем нашего времени - этику искусственного интеллекта.",
  },
  {
    id: "2",
    speakerId: 2,
    time: "00:14",
    text: "Начнем с того, что мы уже не можем доверять своим глазам. Технология дипфейков достигла такого уровня, что отличить реальную запись от сгенерированной практически невозможно.",
  },
  {
    id: "3",
    speakerId: 1,
    time: "00:26",
    text: "Важно понимать, что ИИ -это не просто алгоритм, это зеркало наших собственных предубеждений, заложенных в обучающие выборки.",
  },
  {
    id: "4",
    speakerId: 2,
    time: "00:35",
    text: "Александр, как вы считаете, готовы ли мы к тому, что ИИ начнет принимать решения в судебной системе или медицине в обход человеческого контроля?",
  },
  {
    id: "5",
    speakerId: 3,
    time: "00:48",
    text: "Ключевой вопрос здесь не в скорости развития технологий, а в том, успевают ли общественные институты вырабатывать правила и ограничения.",
  },
];

const PodcastPage: React.FC = () => {
  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <PodcastHero
          title="Этика будущего: Как ИИ меняет наше восприятие реальности"
          author="Александр Соколов"
          category="Искусственный интеллект"
          publishedAt="14 Октября 2024"
          duration="54:12"
          listeners={12450}
          coverUrl={PODCAST_COVER}
          currentTime="15:25"
          progress={28}
          volume={80}
          downloadStatus="idle"
        />

        <div className={styles.content}>
          <main className={styles.mainColumn}>
            <section className={styles.about}>
              <h2 className={styles.sectionTitle}>О подкасте</h2>

              <p className={styles.aboutText}>
                В этом выпуске мы обсуждаем, как искусственный интеллект меняет
                наше восприятие реальности, доверие к информации и границы
                человеческого контроля. Говорим о дипфейках, алгоритмах,
                этических дилеммах и будущем технологий.
              </p>
            </section>

            <PodcastTranscript items={TRANSCRIPT_ITEMS} initialVisibleCount={4} />
          </main>

          <aside className={styles.sideColumn}>
            <RecommendedPodcasts podcasts={RECOMMENDED_PODCASTS} />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PodcastPage;