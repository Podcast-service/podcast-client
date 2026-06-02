import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import styles from "./SearchPage.module.css";

import AuthorCard from "../../components/AuthorCard/AuthorCard";
import PlaylistCard from "../../components/PlaylistCard/PlaylistCard";
import PodcastRow from "../../components/PodcastRow/PodcastRow";
import LoadMoreButton from "../../components/LoadMoreButton/LoadMoreButton";
import {
  isAuthenticated,
  search,
  subscribeAuthor,
  unsubscribeAuthor,
  type AuthorCard as ApiAuthorCard,
  type PlaylistCard as ApiPlaylistCard,
  type SearchResponse,
} from "../../api/podcast";
import { formatRuDate } from "../../utils/format";
import { toPodcastRow, type PodcastRowData } from "../../utils/mappers";

import SearchSvg from "../../assets/icons/search.svg";
import LeftSvg from "../../assets/icons/left.svg";
import RightSvg from "../../assets/icons/right.svg";

interface MainLayoutContext {
  playPodcast: (podcast: PodcastRowData, queue?: PodcastRowData[]) => void;
}

const PAGE_SIZE = 10;
const INITIAL_VISIBLE = 5;

const SUGGESTIONS = [
  "подкаст про природу",
  "подкаст про то, как надо обращат...",
  "подкаст про мир",
  "подкаст про жизнь вне общества",
];




const useCarousel = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateScroll();
    el.addEventListener("scroll", updateScroll);
    window.addEventListener("resize", updateScroll);
    return () => {
      el.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
    };
  });

  const scroll = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const w = (card?.offsetWidth ?? 480) + 16;
    el.scrollBy({ left: dir === "right" ? w : -w, behavior: "smooth" });
    setTimeout(updateScroll, 350);
  };

  return { trackRef, canScrollLeft, canScrollRight, scroll };
};


interface CarouselSectionProps {
  title: string;
  children: React.ReactNode;
  trackRef: React.RefObject<HTMLDivElement | null>;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onScrollLeft: () => void;
  onScrollRight: () => void;
}

const CarouselSection: React.FC<CarouselSectionProps> = ({
  title, children, trackRef,
  canScrollLeft, canScrollRight,
  onScrollLeft, onScrollRight,
}) => (
  <section className={styles.section}>
    <h2 className={styles.sectionTitle}>{title}</h2>
    <div className={styles.carouselWrap}>
      <button
        type="button"
        className={`${styles.arrowBtn} ${!canScrollLeft ? styles.arrowBtnHidden : ""}`}
        onClick={onScrollLeft}
        aria-label="Прокрутить влево"
      >
        <img src={LeftSvg} alt="" aria-hidden="true" className={styles.arrowIcon} />
      </button>
      <div ref={trackRef} className={styles.carouselTrack}>
        {children}
      </div>
      <button
        type="button"
        className={`${styles.arrowBtn} ${!canScrollRight ? styles.arrowBtnHidden : ""}`}
        onClick={onScrollRight}
        aria-label="Прокрутить вправо"
      >
        <img src={RightSvg} alt="" aria-hidden="true" className={styles.arrowIcon} />
      </button>
    </div>
  </section>
);


const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { playPodcast } = useOutletContext<MainLayoutContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useMemo(() => searchParams.get("q")?.trim() ?? "", [searchParams]);

  const [inputValue, setInputValue] = useState(query);
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const authorsCarousel = useCarousel();
  const playlistsCarousel = useCarousel();

  useEffect(() => {
    setInputValue(query);
    setVisibleCount(INITIAL_VISIBLE);
  }, [query]);

  useEffect(() => {
    if (!query) {
      setResults(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await search({ q: query, page: 1, size: PAGE_SIZE });
        if (!cancelled) setResults(data);
      } catch (err) {
        if (!cancelled) {
          setError("Не удалось выполнить поиск. Попробуйте позже.");
          console.error("Failed to search", err);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [query]);

  const handleSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setIsFocused(false);
    setSearchParams({ q: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch(inputValue);
    if (e.key === "Escape") setIsFocused(false);
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await new Promise((r) => setTimeout(r, 600));
    setVisibleCount((prev) => prev + INITIAL_VISIBLE);
    setIsLoadingMore(false);
  };

  const updateAuthor = (authorId: string, patch: Partial<ApiAuthorCard>) => {
    setResults((prev) => {
      if (!prev?.authors) return prev;
      return {
        ...prev,
        authors: {
          ...prev.authors,
          items: prev.authors.items.map((a) =>
            a.id === authorId ? { ...a, ...patch } : a
          ),
        },
      };
    });
  };

  const handleSubscribe = async (author: ApiAuthorCard) => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    const wasSubscribed = Boolean(author.isSubscribed);
    const prevCount = author.subscribersCount ?? 0;
    updateAuthor(author.id, {
      isSubscribed: !wasSubscribed,
      subscribersCount: prevCount + (wasSubscribed ? -1 : 1),
    });
    try {
      const result = wasSubscribed
        ? await unsubscribeAuthor(author.id)
        : await subscribeAuthor(author.id);
      updateAuthor(author.id, {
        isSubscribed: result.isSubscribed,
        subscribersCount: result.subscribersCount,
      });
    } catch (err) {
      updateAuthor(author.id, { isSubscribed: wasSubscribed, subscribersCount: prevCount });
      console.error("Failed to toggle subscription from search", err);
    }
  };

  const podcasts = results?.podcasts?.items.map(toPodcastRow) ?? [];
  const authors = results?.authors?.items ?? [];
  const playlists = results?.playlists?.items ?? [];
  const visiblePodcasts = podcasts.slice(0, visibleCount);
  const hasMore = visibleCount < podcasts.length;

  const isEmpty =
    !isLoading && !error && query &&
    podcasts.length === 0 && authors.length === 0 && playlists.length === 0;

  const showSuggestions = isFocused && inputValue.length > 0;

  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>

        <div className={styles.searchSection}>
          <div className={`${styles.searchWrap} ${isFocused ? styles.searchWrapFocused : ""}`}>
            <img src={SearchSvg} alt="" aria-hidden="true" className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Поиск подкастов, авторов, плейлистов..."
              value={inputValue}
              autoFocus
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 150)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {showSuggestions && (
            <div className={styles.suggestions}>
              <div className={styles.suggestionActive}>
                <img src={SearchSvg} alt="" aria-hidden="true" className={styles.suggestionIcon} />
                <span className={styles.suggestionTextBold}>{inputValue}</span>
              </div>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={styles.suggestionItem}
                  onMouseDown={() => handleSearch(s)}
                >
                  <img src={SearchSvg} alt="" aria-hidden="true" className={styles.suggestionIcon} />
                  <span className={styles.suggestionText}>{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {!query && <p className={styles.message}>Введите запрос в строке поиска.</p>}
        {isLoading && <p className={styles.message}>Ищем...</p>}
        {error && <p className={styles.message}>{error}</p>}
        {isEmpty && <p className={styles.message}>Ничего не найдено.</p>}

        {!isLoading && !error && (podcasts.length > 0 || authors.length > 0 || playlists.length > 0) && (
          <div className={styles.sections}>

            {podcasts.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Подкасты</h2>
                <div className={styles.list}>
                  {visiblePodcasts.map((podcast) => (
                    <PodcastRow
                      key={podcast.id}
                      {...podcast}
                      isAuthenticated={isAuthenticated()}
                      onPlayClick={() => playPodcast(podcast, visiblePodcasts)}
                    />
                  ))}
                </div>
                {hasMore && (
                  <div className={styles.loadMore}>
                    <LoadMoreButton onClick={handleLoadMore} loading={isLoadingMore} />
                  </div>
                )}
              </section>
            )}

            {authors.length > 0 && (
              <CarouselSection
                title="Авторы"
                trackRef={authorsCarousel.trackRef}
                canScrollLeft={authorsCarousel.canScrollLeft}
                canScrollRight={authorsCarousel.canScrollRight}
                onScrollLeft={() => authorsCarousel.scroll("left")}
                onScrollRight={() => authorsCarousel.scroll("right")}
              >
                {authors.map((author) => (
                  <div key={author.id} data-card className={styles.authorCard}>
                    <AuthorCard
                      id={author.id}
                      name={author.authorName}
                      category=""
                      subscribers={author.subscribersCount ?? 0}
                      avatarUrl={author.avatarUrl ?? undefined}
                      isSubscribed={author.isSubscribed ?? false}
                      onSubscribeClick={() => handleSubscribe(author)}
                    />
                  </div>
                ))}
              </CarouselSection>
            )}

            {playlists.length > 0 && (
              <CarouselSection
                title="Плейлисты"
                trackRef={playlistsCarousel.trackRef}
                canScrollLeft={playlistsCarousel.canScrollLeft}
                canScrollRight={playlistsCarousel.canScrollRight}
                onScrollLeft={() => playlistsCarousel.scroll("left")}
                onScrollRight={() => playlistsCarousel.scroll("right")}
              >
                {playlists.map((playlist) => (
                  <div key={playlist.id} data-card className={styles.playlistCard}>
                    <PlaylistCard
                      id={playlist.id}
                      title={playlist.title}
                      author={playlist.owner.username}
                      episodesCount={playlist.podcastsCount}
                      coverUrl={playlist.coverImageUrl ?? undefined}
                      onAddClick={() => {}}
                    />
                  </div>
                ))}
              </CarouselSection>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default SearchPage;