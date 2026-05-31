import React from "react";
import { Link } from "react-router-dom";
import styles from "./AuthorRow.module.css";

import { useAuthAction } from "../../hooks/useAuthAction";
import LoginPromptModal from "../LoginPromptModal/LoginPromptModal";

import DefaultAvatarSvg from "../../assets/icons/defaultAvatar.svg";

interface AuthorRowProps {
  id: string;
  name: string;
  description?: string;
  subscribers: number;
  avatarUrl?: string;
  isSubscribed?: boolean;
  isAuthenticated?: boolean;
  onSubscribeClick?: () => void;
}

const formatSubscribers = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(".", ",")}K`;
  }

  return value.toString();
};

const AuthorRow: React.FC<AuthorRowProps> = ({
  id,
  name,
  description,
  subscribers,
  avatarUrl,
  isSubscribed = false,
  isAuthenticated = false,
  onSubscribeClick,
}) => {
  const { isModalOpen, closeModal, guard } = useAuthAction(isAuthenticated);
  return (
    <article className={styles.row}>
      <Link to={`/authors/${id}`} className={styles.rowLink}>
        <div className={styles.left}>
          <div className={styles.avatarWrap}>
            <img
              src={avatarUrl || DefaultAvatarSvg}
              alt={name}
              className={styles.avatar}
            />
          </div>

          <div className={styles.info}>
            <h3 className={styles.name}>{name}</h3>

            {description && (
              <p className={styles.description}>{description}</p>
            )}

            <span className={styles.subscribers}>
              {formatSubscribers(subscribers)} подписчиков
            </span>
          </div>
        </div>
      </Link>

      <button
        type="button"
        className={`${styles.subscribeBtn} ${
          isSubscribed ? styles.subscribeBtnActive : ""
        }`}
        onClick={guard(onSubscribeClick)}
      >
        {isSubscribed ? "Отписаться" : "Подписаться"}
      </button>
      {isModalOpen && (
        <LoginPromptModal onClose={closeModal} />
      )}
    </article>
  );
};

export default AuthorRow;