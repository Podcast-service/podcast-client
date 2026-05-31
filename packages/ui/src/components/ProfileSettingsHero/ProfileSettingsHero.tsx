import React, { useEffect, useRef, useState } from "react";
import styles from "./ProfileSettingsHero.module.css";

import DefaultAvatarSvg from "../../assets/icons/defaultAvatar.svg";
import ChangePhotoSvg from "../../assets/icons/changePhoto.svg";

interface ProfileSettingsHeroProps {
    username: string;
    email: string;
    avatarUrl?: string;
    onPhotoChange?: (file: File) => void;
}

const ProfileSettingsHero: React.FC<ProfileSettingsHeroProps> = ({
    username,
    email,
    avatarUrl,
    onPhotoChange,
}) => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [previewUrl, setPreviewUrl] = useState(avatarUrl);

    useEffect(() => {
        setPreviewUrl(avatarUrl);
    }, [avatarUrl]);

    const handleOpenFilePicker = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            return;
        }

        const localPreviewUrl = URL.createObjectURL(file);

        setPreviewUrl(localPreviewUrl);
        onPhotoChange?.(file);
    };

    return (
        <section className={styles.hero}>
            <div className={styles.avatarWrap}>
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt={username}
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

                <button
                    type="button"
                    className={styles.changePhotoBtn}
                    onClick={handleOpenFilePicker}
                    aria-label="Изменить фото профиля"
                >
                    <img
                        src={ChangePhotoSvg}
                        alt=""
                        aria-hidden="true"
                        className={styles.changePhotoIcon}
                    />
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className={styles.hiddenInput}
                    onChange={handleFileChange}
                />
            </div>

            <div className={styles.info}>
                <h1 className={styles.name}>{username}</h1>
                <p className={styles.email}>{email}</p>
            </div>
        </section>
    );
};

export default ProfileSettingsHero;
