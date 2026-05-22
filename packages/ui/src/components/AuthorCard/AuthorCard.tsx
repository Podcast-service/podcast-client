import React from "react";
import { Link } from "react-router-dom";
import styles from "./AuthorCard.module.css";
import DefaultAvatarSvg from "../../assets/icons/defaultAvatar.svg";

interface AuthorCardProps {
  id: string;
  name: string;
  category: string;
  subscribers: number;
  avatarUrl?: string;
  isSubscribed?: boolean;
  onSubscribeClick?: () => void;
}

const formatSubscribers = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(".", ",")} к`;
  }

  return value.toString();
};

const AuthorCard: React.FC<AuthorCardProps> = ({
  id,
  name,
  category,
  subscribers,
  avatarUrl,
  isSubscribed = false,
  onSubscribeClick,
}) => {
  return (
    <article className={styles.card}>
      <Link to={`/authors/${id}`} className={styles.authorLink}>
        <div className={styles.avatarWrap}>
          <img
            src={avatarUrl || DefaultAvatarSvg}
            alt={name}
            className={styles.avatar}
          />
        </div>

        <h3 className={styles.name}>{name}</h3>
        <p className={styles.category}>{category}</p>
      </Link>

      <button
        type="button"
        className={`${styles.subscribeBtn} ${
          isSubscribed ? styles.subscribedBtn : ""
        }`}
        onClick={onSubscribeClick}
      >
        {isSubscribed ? "Отписаться" : "Подписаться"}
      </button>

      <p className={styles.subscribers}>
        {formatSubscribers(subscribers)} подписчиков
      </p>
    </article>
  );
};

export default AuthorCard;