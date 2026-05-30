import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProfileAuthorHero.module.css";

import ShareSvg from "../../assets/icons/share.svg";
import DefaultAvatarSvg from "../../assets/icons/defaultAvatar.svg";

interface ProfileAuthorHeroProps {
    authorName: string;
    email: string;
    avatarUrl?: string;
    bio?: string;
    subscribers: number;
    onShareClick?: () => void;
}

const formatSubscribers = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return String(count);
};

const ProfileAuthorHero: React.FC<ProfileAuthorHeroProps> = ({
    authorName,
    email,
    avatarUrl,
    bio,
    subscribers,
    onShareClick,
}) => {
    const navigate = useNavigate();

    return (
        <section className={styles.hero}>
            <div className={styles.avatarWrap}>
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={authorName}
                        className={styles.avatar}
                    />
                ) : (
                    <div className={styles.avatarPlaceholder}>
                        <img
                            src={DefaultAvatarSvg}
                            alt=""
                            aria-hidden="true"
                            className={styles.defaultAvatar}
                        />
                    </div>
                )}
            </div>

            <div className={styles.info}>
                <h1 className={styles.name}>{authorName}</h1>

                <p className={styles.email}>{email}</p>

                {bio && (
                    <p className={styles.bio}>{bio}</p>
                )}

                <div className={styles.statsRow}>
                    <div className={styles.authorBadge}>
                        Вы являетесь автором
                    </div>

                    <div className={styles.subscribers}>
                        <span className={styles.subscribersCount}>
                            {formatSubscribers(subscribers)}
                        </span>
                        <span className={styles.subscribersLabel}>
                            Подписчиков
                        </span>
                    </div>

                    <button
                        type="button"
                        className={styles.shareBtn}
                        onClick={onShareClick}
                        aria-label="Поделиться профилем"
                    >
                        <img
                            src={ShareSvg}
                            alt=""
                            aria-hidden="true"
                            className={styles.shareIcon}
                        />
                    </button>
                </div>

                <button
                    type="button"
                    className={styles.editLink}
                    onClick={() => navigate("/profile/edit")}
                >
                    Редактировать профиль
                </button>
            </div>
        </section>
    );
};

export default ProfileAuthorHero;