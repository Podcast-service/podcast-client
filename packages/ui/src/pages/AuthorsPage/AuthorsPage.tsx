import React, { useState } from "react";
import styles from "./AuthorsPage.module.css";

import FilterTabs from "../../components/FilterTabs/FilterTabs";
import AuthorRow from "../../components/AuthorRow/AuthorRow";
import LoadMoreButton from "../../components/LoadMoreButton/LoadMoreButton";

interface Author {
  id: string;
  name: string;
  description: string;
  subscribers: number;
  avatarUrl?: string;
  isSubscribed?: boolean;
}

const MOCK_SORT = [
  { id: "POPULAR", label: "Популярные" },
  { id: "NEW", label: "Новые" },
  { id: "SUBSCRIBERS", label: "По подписчикам" },
];

const AUTHOR_AVATAR =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop";

const MOCK_AUTHORS: Author[] = Array.from({ length: 5 }, (_, index) => ({
  id: String(index + 1),
  name: "Алексей Романов",
  description:
    "Исследователь античности и автор цикла «Тени Прошлого». Погружение в забытые детали великих империй и анализ их влияния на современный мир через исторические параллели.",
  subscribers: 42500,
  avatarUrl: AUTHOR_AVATAR,
  isSubscribed: index === 4,
}));

const AuthorsPage: React.FC = () => {
  const [activeSort, setActiveSort] = useState("POPULAR");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [authors, setAuthors] = useState<Author[]>(MOCK_AUTHORS);

  const handleSubscribe = (id: string) => {
    setAuthors((prev) =>
      prev.map((author) =>
        author.id === id
          ? { ...author, isSubscribed: !author.isSubscribed }
          : author
      )
    );
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setHasMore(false);
    setIsLoadingMore(false);
  };

  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <div className={styles.pageHeader}>
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>Авторы</h1>
            <span className={styles.count}>1244 автора</span>
          </div>

          <p className={styles.pageDesc}>
            Откройте для себя авторов подкастов на любой вкус
          </p>
        </div>

        <div className={styles.filters}>
          <FilterTabs
            sortOptions={MOCK_SORT}
            activeSort={activeSort}
            onSortChange={setActiveSort}
          />
        </div>

        <div className={styles.list}>
          {authors.map((author) => (
            <AuthorRow
              key={author.id}
              id={author.id}
              name={author.name}
              description={author.description}
              subscribers={author.subscribers}
              avatarUrl={author.avatarUrl}
              isSubscribed={author.isSubscribed}
              onSubscribeClick={() => handleSubscribe(author.id)}
            />
          ))}
        </div>

        {hasMore && (
          <LoadMoreButton onClick={handleLoadMore} loading={isLoadingMore} />
        )}
      </div>
    </div>
  );
};

export default AuthorsPage;