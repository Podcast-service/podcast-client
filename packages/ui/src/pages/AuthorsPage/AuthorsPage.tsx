import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AuthorsPage.module.css";

import FilterTabs from "../../components/FilterTabs/FilterTabs";
import AuthorRow from "../../components/AuthorRow/AuthorRow";
import LoadMoreButton from "../../components/LoadMoreButton/LoadMoreButton";

import {
  getAuthors,
  subscribeAuthor,
  unsubscribeAuthor,
  isAuthenticated,
  type AuthorCard as ApiAuthorCard,
  type SortAuthors,
} from "../../api/podcast";
import { pluralizeRu } from "../../utils/format";

interface Author {
  id: string;
  name: string;
  subscribers: number;
  avatarUrl?: string;
  isSubscribed?: boolean;
}

const PAGE_SIZE = 20;

const SORT_OPTIONS: { id: SortAuthors; label: string }[] = [
  { id: "POPULAR", label: "Популярные" },
  { id: "SUBSCRIBERS", label: "По подписчикам" },
  { id: "DATE_DESC", label: "Новые" },
];

const mapAuthor = (author: ApiAuthorCard): Author => ({
  id: author.id,
  name: author.authorName,
  subscribers: author.subscribersCount ?? 0,
  avatarUrl: author.avatarUrl ?? undefined,
  isSubscribed: author.isSubscribed ?? false,
});

const AuthorsPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeSort, setActiveSort] = useState<SortAuthors>("POPULAR");
  const [authors, setAuthors] = useState<Author[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = async (pageNumber: number, reset: boolean) => {
    const result = await getAuthors({
      sort: activeSort,
      page: pageNumber,
      size: PAGE_SIZE,
    });

    setAuthors((prev) =>
      reset ? result.items.map(mapAuthor) : [...prev, ...result.items.map(mapAuthor)]
    );
    setPage(pageNumber);
    setTotalPages(result.meta.totalPages);
    setTotalCount(result.meta.totalElements);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        if (!cancelled) {
          await loadPage(1, true);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Не удалось загрузить авторов. Попробуйте позже.");
          console.error("Failed to load authors", err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeSort]);

  const handleSubscribe = async (id: string) => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const target = authors.find((author) => author.id === id);
    if (!target) {
      return;
    }
    const wasSubscribed = Boolean(target.isSubscribed);

    setAuthors((prev) =>
      prev.map((author) =>
        author.id === id ? { ...author, isSubscribed: !wasSubscribed } : author
      )
    );

    try {
      const result = wasSubscribed
        ? await unsubscribeAuthor(id)
        : await subscribeAuthor(id);
      setAuthors((prev) =>
        prev.map((author) =>
          author.id === id
            ? {
                ...author,
                isSubscribed: result.isSubscribed,
                subscribers: result.subscribersCount,
              }
            : author
        )
      );
    } catch (err) {
      setAuthors((prev) =>
        prev.map((author) =>
          author.id === id
            ? { ...author, isSubscribed: wasSubscribed }
            : author
        )
      );
      console.error("Failed to toggle subscription", err);
    }
  };

  const handleLoadMore = async () => {
    try {
      setIsLoadingMore(true);
      await loadPage(page + 1, false);
    } catch (err) {
      console.error("Failed to load more authors", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const hasMore = page < totalPages;

  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <div className={styles.pageHeader}>
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>Авторы</h1>
            <span className={styles.count}>
              {totalCount}{" "}
              {pluralizeRu(totalCount, ["автор", "автора", "авторов"])}
            </span>
          </div>

          <p className={styles.pageDesc}>
            Откройте для себя авторов подкастов на любой вкус
          </p>
        </div>

        <div className={styles.filters}>
          <FilterTabs
            sortOptions={SORT_OPTIONS}
            activeSort={activeSort}
            onSortChange={(id) => setActiveSort(id as SortAuthors)}
          />
        </div>

        {isLoading ? (
          <p style={{ padding: "24px 0" }}>Загрузка…</p>
        ) : error ? (
          <p style={{ padding: "24px 0" }}>{error}</p>
        ) : authors.length === 0 ? (
          <p style={{ padding: "24px 0" }}>Авторов пока нет.</p>
        ) : (
          <>
            <div className={styles.list}>
              {authors.map((author) => (
                <AuthorRow
                  key={author.id}
                  id={author.id}
                  name={author.name}
                  subscribers={author.subscribers}
                  avatarUrl={author.avatarUrl}
                  isSubscribed={author.isSubscribed}
                  onSubscribeClick={() => handleSubscribe(author.id)}
                />
              ))}
            </div>

            {hasMore && (
              <LoadMoreButton
                onClick={handleLoadMore}
                loading={isLoadingMore}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuthorsPage;
