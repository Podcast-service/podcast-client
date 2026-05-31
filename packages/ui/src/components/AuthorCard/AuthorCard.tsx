import React from "react";
import { Link } from "react-router-dom";
import styles from "./AuthorCard.module.css";
import DefaultAvatarSvg from "../../assets/icons/defaultAvatar.svg";

import { useAuthAction } from "../../hooks/useAuthAction";
import LoginPromptModal from "../LoginPromptModal/LoginPromptModal";


interface AuthorCardProps {
  id: string;
  name: string;
  category: string;
  subscribers: number;
  avatarUrl?: string;
  isSubscribed?: boolean;
  isAuthenticated?: boolean;
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
  isAuthenticated = false,
  onSubscribeClick,
}) => {
  const { isModalOpen, closeModal, guard } = useAuthAction(isAuthenticated);

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
        onClick={guard(onSubscribeClick)}
      >
        {isSubscribed ? "Отписаться" : "Подписаться"}
      </button>

      <p className={styles.subscribers}>
        {formatSubscribers(subscribers)} подписчиков
      </p>
      {isModalOpen && (
        <LoginPromptModal onClose={closeModal} />
      )}
    </article>
  );
};

export default AuthorCard;