import React, { useEffect, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import AuthorRow from "../../components/AuthorRow/AuthorRow";
import styles from "./ProfileSubscriptionsPage.module.css";

import {
  getMySubscriptions,
  unsubscribeAuthor,
  type SubscriptionResponse,
} from "../../api/podcast";

const ProfileSubscriptionsPage: React.FC = () => {
  usePageTitle("Подписки");
  const [subscriptions, setSubscriptions] = useState<SubscriptionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getMySubscriptions({ size: 50 })
      .then((page) => {
        if (!cancelled) setSubscriptions(page.items);
      })
      .catch((err) => {
        if (!cancelled) {
          setError("Не удалось загрузить подписки.");
          console.error("Failed to load subscriptions", err);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleUnsubscribe = async (authorId: string) => {
    const snapshot = subscriptions;
    setSubscriptions((prev) =>
      prev.filter((item) => item.author.id !== authorId)
    );
    try {
      await unsubscribeAuthor(authorId);
    } catch (err) {
      setSubscriptions(snapshot);
      console.error("Failed to unsubscribe", err);
    }
  };

  if (isLoading) {
    return <p style={{ padding: "24px 0" }}>Загрузка…</p>;
  }

  if (error) {
    return <p style={{ padding: "24px 0" }}>{error}</p>;
  }

  if (subscriptions.length === 0) {
    return <p style={{ padding: "24px 0" }}>Вы пока ни на кого не подписаны.</p>;
  }

  return (
    <div className={styles.list}>
      {subscriptions.map(({ author }) => (
        <AuthorRow
          key={author.id}
          id={author.id}
          name={author.authorName}
          subscribers={author.subscribersCount ?? 0}
          avatarUrl={author.avatarUrl ?? undefined}
          isSubscribed={true}
          onSubscribeClick={() => handleUnsubscribe(author.id)}
        />
      ))}
    </div>
  );
};

export default ProfileSubscriptionsPage;
