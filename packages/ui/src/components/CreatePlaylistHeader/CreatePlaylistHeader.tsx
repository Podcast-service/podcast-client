import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./CreatePlaylistHeader.module.css";

import LoadIconSvg from "../../assets/icons/loadIcon.svg";
import GlobeSvg from "../../assets/icons/globe.svg";
import LockPlaySvg from "../../assets/icons/lockPlay.svg";

interface CreatePlaylistHeaderProps {
    isAuthor?: boolean;
    activeTab: "likes" | "all" | "mine";
    onTabChange: (tab: "likes" | "all" | "mine") => void;
    onCoverChange?: (file: File) => void;
    name: string;
    onNameChange: (value: string) => void;
    nameError?: string;
    description: string;
    onDescriptionChange: (value: string) => void;
    descriptionError?: string;
    isPrivate: boolean;
    onPrivacyChange?: (isPrivate: boolean) => void;
}

const CreatePlaylistHeader: React.FC<CreatePlaylistHeaderProps> = ({
    isAuthor = false,
    activeTab,
    onTabChange,
    onCoverChange,
    name,
    onNameChange,
    nameError,
    description,
    onDescriptionChange,
    descriptionError,
    isPrivate,
    onPrivacyChange,
}) => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);

    const handleCoverClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) return;
        const url = URL.createObjectURL(file);
        setCoverPreview(url);
        onCoverChange?.(file);
    };

    const tabs = [
        { key: "likes" as const, label: "Мои лайки" },
        ...(isAuthor ? [{ key: "mine" as const, label: "Мои подкасты" }] : []),
        { key: "all" as const, label: "Все подкасты" },
    ];

    return (
        <div className={styles.header}>

            <div className={styles.top}>

                <div className={styles.coverSection}>
                    <p className={styles.coverLabel}>Обложка плейлиста</p>

                    <button
                        type="button"
                        className={styles.coverUpload}
                        onClick={handleCoverClick}
                        aria-label="Загрузить обложку"
                    >
                        {coverPreview ? (
                            <img
                                src={coverPreview}
                                alt="Обложка плейлиста"
                                className={styles.coverPreview}
                            />
                        ) : (
                            <div className={styles.coverPlaceholder}>
                                <img
                                    src={LoadIconSvg}
                                    alt=""
                                    aria-hidden="true"
                                    className={styles.coverIcon}
                                />
                                <span className={styles.coverHint}>Загрузить обложку</span>
                            </div>
                        )}
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className={styles.hiddenInput}
                        onChange={handleFileChange}
                    />
                </div>

                <div className={styles.fields}>

                    <div className={styles.fieldWrap}>
                        <div className={styles.fieldLabelRow}>
                            <label className={styles.fieldLabel}>Название плейлиста</label>
                            <span className={styles.fieldCounter}>{name.length}/100</span>
                        </div>
                        <div className={`${styles.inputWrap} ${nameError ? styles.inputError : ""}`}>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Введите название"
                                value={name}
                                maxLength={100}
                                onChange={(e) => onNameChange(e.target.value)}
                            />
                        </div>
                        {nameError && <p className={styles.errorText}>{nameError}</p>}
                    </div>

                    <div className={styles.fieldWrap}>
                        <label className={styles.fieldLabel}>Описание</label>
                        <div className={`${styles.textareaWrap} ${descriptionError ? styles.inputError : ""}`}>
                            <textarea
                                className={styles.textarea}
                                placeholder="О чем этот плейлист?"
                                value={description}
                                maxLength={1000}
                                rows={3}
                                onChange={(e) => onDescriptionChange(e.target.value)}
                            />
                        </div>
                        <div className={styles.fieldBottom}>
                            {descriptionError && <p className={styles.errorText}>{descriptionError}</p>}
                            <span className={styles.fieldCounter}>{description.length}/1000</span>
                        </div>
                    </div>

                    {isAuthor ? (
                        <div className={styles.privacyToggle}>
                            <button
                                type="button"
                                className={`${styles.privacyBtn} ${!isPrivate ? styles.privacyBtnActive : ""}`}
                                onClick={() => onPrivacyChange?.(false)}
                            >
                                <img src={GlobeSvg} alt="" aria-hidden="true" className={styles.privacyIcon} />
                                Публичный
                            </button>

                            <button
                                type="button"
                                className={`${styles.privacyBtn} ${isPrivate ? styles.privacyBtnActive : ""}`}
                                onClick={() => onPrivacyChange?.(true)}
                            >
                                <img src={LockPlaySvg} alt="" aria-hidden="true" className={styles.privacyIcon} />
                                Приватный
                            </button>
                        </div>
                    ) : (
                        <div className={styles.privacyInfo}>
                            <div className={styles.privacyBadge}>
                                <img src={LockPlaySvg} alt="" aria-hidden="true" className={styles.privacyIcon} />
                                Приватный
                            </div>
                            <p className={styles.privacyText}>
                                Плейлист будет виден только вам.{" "}
                                Чтобы плейлист был виден всем —{" "}
                                <Link to="/become-author" className={styles.privacyLink}>
                                    станьте автором
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.tabsSection}>
                <p className={styles.tabsTitle}>Выберите подкасты</p>

                <nav className={styles.tabs}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ""}`}
                            onClick={() => onTabChange(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

        </div>
    );
};

export default CreatePlaylistHeader;