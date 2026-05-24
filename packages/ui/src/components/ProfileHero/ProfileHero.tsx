import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProfileHero.module.css";
import DefaultAvatarSvg from "../../assets/icons/defaultAvatar.svg";

interface ProfileHeroProps {
    username: string;
    email: string;
    avatarUrl?: string;
    isAuthor?: boolean;
}

const ProfileHero: React.FC<ProfileHeroProps> = ({
    username,
    email,
    avatarUrl,
    isAuthor = false,
}) => {
    const navigate = useNavigate();

    return (
        <section className={styles.hero}>
            <div className={styles.left}>
                <div className={styles.avatarWrap}>
                    <img
                        src={avatarUrl || DefaultAvatarSvg}
                        alt={username}
                        className={styles.avatar}
                    />
                </div>

                <div className={styles.info}>
                    <h1 className={styles.name}>{username}</h1>

                    <p className={styles.email}>{email}</p>

                    <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => navigate("/profile/edit")}
                    >
                        Редактировать профиль
                    </button>
                </div>
            </div>

            {!isAuthor && (
                <button
                    type="button"
                    className={styles.becomeAuthorBtn}
                    onClick={() => navigate("/become-author")}
                >
                    Стать автором
                </button>
            )}
        </section>
    );
};

export default ProfileHero;