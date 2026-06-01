import React, { useEffect, useRef, useState } from "react";
import styles from "./AuthorPodcastsCarousel.module.css";

import PlaylistCard from "../../components/PlaylistCard/PlaylistCard";

import LeftSvg from "../../assets/icons/left.svg";
import RightSvg from "../../assets/icons/right.svg";

interface PlaylistItem {
  id: string;
  title: string;
  author: string;
  episodesCount: number;
  coverUrl?: string;
  listeners?: number;
  likes?: number;
  dislikes?: number;
  isAdded?: boolean;
}

interface AuthorPodcastsCarouselProps {
  title?: string;
  playlists: PlaylistItem[];
}

const AuthorPodcastsCarousel: React.FC<AuthorPodcastsCarouselProps> = ({
  title = "Плейлисты",
  playlists,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const track = trackRef.current;
    if (!track) return;

    const maxScrollLeft = track.scrollWidth - track.clientWidth;

    setCanScrollLeft(track.scrollLeft > 4);
    setCanScrollRight(track.scrollLeft < maxScrollLeft - 4);
  };

  const scrollCarousel = (direction: "left" | "right") => {
    const track = trackRef.current;
    if (!track) return;

    const firstCard = track.querySelector<HTMLElement>(`.${styles.cardWrap}`);
    const cardWidth = firstCard?.offsetWidth || 320;
    const gap = 24;

    track.scrollBy({
      left: direction === "right" ? cardWidth + gap : -(cardWidth + gap),
      behavior: "smooth",
    });
  };

  useEffect(() => {
    updateScrollState();

    const track = trackRef.current;
    if (!track) return;

    track.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [playlists]);

  return (
    <section className={styles.section}>
      <div className={styles.carouselGrid}>
        <div className={styles.arrowSlot}>
          {canScrollLeft && (
            <button
              type="button"
              className={styles.arrowBtn}
              onClick={() => scrollCarousel("left")}
              aria-label="Прокрутить влево"
            >
              <img src={LeftSvg} alt="" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className={styles.content}>
          <h2 className={styles.title}>{title}</h2>

          <div ref={trackRef} className={styles.track}>
            {playlists.map((playlist) => (
              <div key={playlist.id} className={styles.cardWrap}>
                <PlaylistCard {...playlist} isPrivate={false} />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.arrowSlot}>
          {canScrollRight && (
            <button
              type="button"
              className={styles.arrowBtn}
              onClick={() => scrollCarousel("right")}
              aria-label="Прокрутить вправо"
            >
              <img src={RightSvg} alt="" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default AuthorPodcastsCarousel;