import React from "react";
import styles from "./AuthorProfileHero.module.css";

import { useState } from "react";
import CopyLinkModal from "../CopyLinkModal/CopyLinkModal";

import { useAuthAction } from "../../hooks/useAuthAction";
import LoginPromptModal from "../LoginPromptModal/LoginPromptModal";

import ShareSvg from "../../assets/icons/share.svg";
import DefaultAvatarSvg from "../../assets/icons/defaultAvatar.svg";

interface AuthorProfileHeroProps {
  name: string;
  description?: string;
  subscribers: number;
  avatarUrl?: string;
  category?: string;
  isSubscribed?: boolean;
  isAuthenticated?: boolean;
  onSubscribeClick?: () => void;
  onShareClick?: () => void;
}

const formatSubscribers = (value: number) => {
  if (value >= 1000) {
    return `${Math.floor(value / 1000)}K`;
  }

  return value.toString();
};

const AuthorProfileHero: React.FC<AuthorProfileHeroProps> = ({
  name,
  description,
  subscribers,
  avatarUrl,
  category,
  isSubscribed = false,
  isAuthenticated = false,
  onSubscribeClick,
  onShareClick,
}) => {
  const { isModalOpen, closeModal, guard } = useAuthAction(isAuthenticated);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  return (
    <section className={styles.hero}>
      <div className={styles.avatarWrap}>
        <img
          src={avatarUrl || DefaultAvatarSvg}
          alt={name}
          className={styles.avatar}
        />
      </div>

      <div className={styles.content}>
        {category && <span className={styles.category}>{category}</span>}

        <h1 className={styles.name}>{name}</h1>

        {description && <p className={styles.description}>{description}</p>}

        <div className={styles.bottom}>
          <div className={styles.subscribers}>
            <span className={styles.subscribersCount}>
              {formatSubscribers(subscribers)}
            </span>
            <span className={styles.subscribersText}>Подписчиков</span>
          </div>

          <button
            type="button"
            className={`${styles.subscribeBtn} ${
              isSubscribed ? styles.subscribeBtnActive : ""
            }`}
            onClick={guard(onSubscribeClick)}
          >
            {isSubscribed ? "Отписаться" : "Подписаться"}
          </button>

          <button
            type="button"
            className={styles.shareBtn}
            onClick={() => {
              setIsCopyModalOpen(true);
              onShareClick?.();
            }}
            aria-label="Поделиться"
          >
            <img src={ShareSvg} alt="" aria-hidden="true" />
          </button>
        </div>
      </div>
      {isModalOpen && (
        <LoginPromptModal onClose={closeModal} />
      )}
      {isCopyModalOpen && (
        <CopyLinkModal
          link={window.location.href}
          onClose={() => setIsCopyModalOpen(false)}
        />
      )}
    </section>
  );
};

export default AuthorProfileHero;