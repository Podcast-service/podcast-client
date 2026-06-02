import React, { useEffect, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { Link, useNavigate } from "react-router-dom";
import styles from "./BecomeAuthorPage.module.css";

import InputField from "../../components/InputField/InputField";
import TextareaField from "../../components/TextareaField/TextareaField";
import BecomeAuthorSuccessModal from "../../components/BecomeAuthorSuccessModal/BecomeAuthorSuccessModal";
import { useToast } from "../../components/Toast/useToast";
import { createAuthorProfile, getMyProfile } from "../../api/podcast";

import WarningSvg from "../../assets/icons/warning.svg";
import DefaultAvatarSvg from "../../assets/icons/defaultAvatar.svg";


const validateAuthorName = (value: string): string => {
    if (!value.trim()) return "Имя автора обязательно";
    if (value.length < 3) return "Минимум 3 символа";
    return "";
};

const validateAuthorBio = (value: string): string => {
    if (value.length > 1000) return "Максимум 1000 символов";
    return "";
};


const BecomeAuthorPage: React.FC = () => {
  usePageTitle("Стать автором");
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [username, setUsername] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
    const [authorName, setAuthorName] = useState("");
    const [authorNameError, setAuthorNameError] = useState("");
    const [authorBio, setAuthorBio] = useState("");
    const [authorBioError, setAuthorBioError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    // Имя и аватар берём из профиля пользователя; именем предзаполняем поле автора.
    useEffect(() => {
        let cancelled = false;

        getMyProfile()
            .then((profile) => {
                if (cancelled) return;
                setUsername(profile.username);
                setAvatarUrl(profile.avatarUrl ?? undefined);
                setAuthorName((prev) => prev || profile.username);
            })
            .catch((err) => console.error("Failed to load profile", err));

        return () => {
            cancelled = true;
        };
    }, []);

    const handleSubmit = async () => {
        const nameErr = validateAuthorName(authorName);
        const bioErr = validateAuthorBio(authorBio);

        setAuthorNameError(nameErr);
        setAuthorBioError(bioErr);

        if (nameErr || bioErr) return;

        setLoading(true);

        try {
            await createAuthorProfile({
                authorName,
                description: authorBio.trim() ? authorBio : null,
            });
            setIsSuccessModalOpen(true);
        } catch (e: any) {
            if (e?.status === 409) {
                showToast("Вы уже являетесь автором", "error");
            } else if (e?.status === 403) {
                showToast("Недостаточно прав для создания профиля автора", "error");
            } else {
                showToast("Не удалось стать автором. Попробуйте позже.", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={`container ${styles.pageInner}`}>

                <nav className={styles.breadcrumbs}>
                    <Link to="/profile" className={styles.breadcrumbLink}>Профиль</Link>
                    <span className={styles.breadcrumbSep}>›</span>
                    <span className={styles.breadcrumbCurrent}>Стать автором</span>
                </nav>

                <div className={styles.content}>
                    <h1 className={styles.title}>Заполните информацию о себе как авторе</h1>

                    <div className={styles.avatarSection}>
                        <div className={styles.avatarWrap}>
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={username}
                                    className={styles.avatar}
                                />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    <img
                                        src={DefaultAvatarSvg}
                                        alt=""
                                        aria-hidden="true"
                                        className={styles.avatarDefault}
                                    />
                                </div>
                            )}
                        </div>

                        <p className={styles.avatarHint}>Аватар автора берется из вашего профиля</p>

                        <Link to="/profile/edit" className={styles.avatarEditLink}>
                            Изменить в профиле →
                        </Link>
                    </div>

                    <div className={styles.form}>
                        <div className={styles.fieldWrap}>
                            <InputField
                                label="Имя автора"
                                hint="Это имя будут видеть все пользователи"
                                labelClassName={styles.inputLabel}
                                name="authorName"
                                value={authorName}
                                onChange={(e) => {
                                    setAuthorName(e.target.value);
                                    if (authorNameError) setAuthorNameError("");
                                }}
                                error={authorNameError}
                                placeholder="Введите ваше имя или псевдоним..."
                            />
                        </div>

                        <div className={styles.fieldWrap}>
                            <TextareaField
                                label="Описание канала"
                                labelClassName={styles.textareaLabel}
                                hint="Расскажите слушателям о чем ваши подкасты"
                                name="authorBio"
                                value={authorBio}
                                onChange={(e) => {
                                    setAuthorBio(e.target.value);
                                    if (authorBioError) setAuthorBioError("");
                                }}
                                error={authorBioError}
                                placeholder="Опишите тематику ваших подкастов, стиль подачи материала..."
                                maxLength={1000}
                                rows={7}
                            />
                        </div>

                        <div className={styles.warning}>
                            <img
                                src={WarningSvg}
                                alt=""
                                aria-hidden="true"
                                className={styles.warningIcon}
                            />
                            <p className={styles.warningText}>
                                После становления автором, вы можете добавлять подкасты, создавать плейлисты и набирать подписчиков.
                            </p>
                        </div>

                        <div className={styles.actions}>
                            <button
                                type="button"
                                className={styles.btnCancel}
                                onClick={() => navigate("/profile")}
                            >
                                Отмена
                            </button>

                            <button
                                type="button"
                                className={styles.btnSubmit}
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? "Сохраняем..." : "Стать автором"}
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {isSuccessModalOpen && (
                <BecomeAuthorSuccessModal
                    onContinue={() => navigate("/profile")}
                />
            )}
        </div>
    );
};

export default BecomeAuthorPage;