import React, { useMemo, useState } from "react";
import styles from "./PodcastTranscript.module.css";

import SearchSvg from "../../assets/icons/search.svg";
import PeopleOneSvg from "../../assets/icons/peopleOne.svg";
import PeopleTwoSvg from "../../assets/icons/peopleTwo.svg";

interface TranscriptItem {
  id: string;
  speakerId: number;
  time?: string;
  text: string;
}

interface PodcastTranscriptProps {
  items: TranscriptItem[];
  initialVisibleCount?: number;
}

const SPEAKER_STYLES = [
  {
    icon: PeopleOneSvg,
    colorClass: "speakerBlue",
    bubbleClass: "bubbleBlue",
  },
  {
    icon: PeopleTwoSvg,
    colorClass: "speakerGreen",
    bubbleClass: "bubbleGreen",
  },
  {
    icon: PeopleOneSvg,
    colorClass: "speakerPurple",
    bubbleClass: "bubblePurple",
  },
  {
    icon: PeopleTwoSvg,
    colorClass: "speakerOrange",
    bubbleClass: "bubbleOrange",
  },
];

const getSpeakerStyle = (speakerId: number) => {
  return SPEAKER_STYLES[(speakerId - 1) % SPEAKER_STYLES.length];
};

const PodcastTranscript: React.FC<PodcastTranscriptProps> = ({
  items,
  initialVisibleCount = 4,
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredItems = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((item) => item.text.toLowerCase().includes(query));
  }, [items, searchValue]);

  const visibleItems = isExpanded
    ? filteredItems
    : filteredItems.slice(0, initialVisibleCount);

  const hasMore = filteredItems.length > initialVisibleCount && !isExpanded;

  return (
    <section className={styles.transcript}>
      <div className={styles.header}>
        <h2 className={styles.title}>Транскрипт</h2>

        <div className={styles.searchWrap}>
          <img
            src={SearchSvg}
            alt=""
            aria-hidden="true"
            className={styles.searchIcon}
          />

          <input
            type="text"
            className={styles.searchInput}
            placeholder="Поиск по тексту..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.list}>
        {visibleItems.map((item) => {
          const speakerStyle = getSpeakerStyle(item.speakerId);

          return (
            <article key={item.id} className={styles.item}>
              <div className={styles.speaker}>
                <img
                  src={speakerStyle.icon}
                  alt=""
                  aria-hidden="true"
                  className={styles.speakerIcon}
                />

                <div className={styles.speakerText}>
                  <span
                    className={`${styles.speakerName} ${
                      styles[speakerStyle.colorClass]
                    }`}
                  >
                    Человек {item.speakerId}
                  </span>

                  {item.time && (
                    <span className={styles.time}>{item.time}</span>
                  )}
                </div>
              </div>

              <div
                className={`${styles.bubble} ${
                  styles[speakerStyle.bubbleClass]
                }`}
              >
                {item.text}
              </div>
            </article>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <p className={styles.empty}>По этому запросу ничего не найдено</p>
      )}

      {hasMore && (
        <div className={styles.moreWrap}>
          <button
            type="button"
            className={styles.moreBtn}
            onClick={() => setIsExpanded(true)}
          >
            Читать далее
          </button>
        </div>
      )}
    </section>
  );
};

export default PodcastTranscript;