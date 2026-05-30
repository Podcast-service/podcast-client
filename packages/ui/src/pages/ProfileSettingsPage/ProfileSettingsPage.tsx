import React, { useState } from "react";
import styles from "./ProfileSettingsPage.module.css";

import ProfileSettingsHero from "../../components/ProfileSettingsHero/ProfileSettingsHero";
import InputField from "../../components/InputField/InputField";
import TextareaField from "../../components/TextareaField/TextareaField";
import ActiveSessions from "../../components/ActiveSessions/ActiveSessions";
import OtpEmailModal from "../../components/OtpEmailModal/OtpEmailModal";
import { useToast } from "../../components/Toast/useToast";

import PersonalInfoSvg from "../../assets/icons/personalInfo.svg";
import SafetySvg from "../../assets/icons/safety.svg";
import TickSvg from "../../assets/icons/tick.svg";
import CrossSvg from "../../assets/icons/cros.svg";


const MOCK_USER = {
    username: "alex_johnson",
    email: "alex@example.com",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400",
    isEmailVerified: false,
    isAuthor: true,
    authorName: "Александр Соколов",
    authorBio: "",
};

const MOCK_SESSIONS = [
    {
        id: "1",
        deviceName: "Chrome on macOS",
        deviceInfo: "macOS 14 · Safari 17",
        ipAddress: "92.168.1.1",
        lastActivity: "Сейчас",
        isCurrent: true,
    },
    {
        id: "2",
        deviceName: "Firefox on Windows",
        deviceInfo: "Windows 11 · Firefox 120",
        ipAddress: "192.168.0.55",
        lastActivity: "2 часа назад",
    },
    {
        id: "3",
        deviceName: "Safari on iPhone",
        deviceInfo: "iOS 17 · Safari",
        ipAddress: "10.0.0.12",
        lastActivity: "Вчера, 18:42",
    },
];


const validateUsername = (value: string): string => {
    if (!value.trim()) return "Имя пользователя обязательно";
    if (value.length < 3) return "Минимум 3 символа";
    if (value.length > 50) return "Максимум 50 символов";
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Можно использовать только буквы, цифры и знак _";
    return "";
};

const validateCurrentPassword = (value: string): string => {
    if (!value) return "Текущий пароль обязателен";
    return "";
};

const validateNewPassword = (value: string): string => {
    if (!value) return "Пароль обязателен";
    if (value.length < 8) return "Минимум 8 символов";
    if (/[а-яёА-ЯЁ]/.test(value)) return "Пароль не может содержать кириллицу";
    return "";
};

const validateConfirmPassword = (newPassword: string, confirm: string): string => {
    if (confirm !== newPassword) return "Пароли не совпадают";
    return "";
};

const validateAuthorName = (value: string): string => {
    if (!value.trim()) return "Имя автора обязательно";
    if (value.length < 3) return "Минимум 3 символа";
    return "";
};

const validateAuthorBio = (value: string): string => {
    if (value.length > 1000) return "Максимум 1000 символов";
    return "";
};


const ProfileSettingsPage: React.FC = () => {
    const { showToast } = useToast();

    const [username, setUsername] = useState(MOCK_USER.username);
    const [usernameError, setUsernameError] = useState("");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [currentPasswordError, setCurrentPasswordError] = useState("");
    const [newPasswordError, setNewPasswordError] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");

    const [isEmailVerified, setIsEmailVerified] = useState(MOCK_USER.isEmailVerified);
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

    const [authorName, setAuthorName] = useState(MOCK_USER.authorName);
    const [authorNameError, setAuthorNameError] = useState("");
    const [authorBio, setAuthorBio] = useState(MOCK_USER.authorBio);
    const [authorBioError, setAuthorBioError] = useState("");


    const handleSaveUsername = async () => {
        const error = validateUsername(username);
        setUsernameError(error);
        if (error) return;

        try {
            showToast("Изменения сохранены", "success");
        } catch (e: any) {
            if (e?.status === 409) {
                setUsernameError("Такое имя пользователя уже занято");
            } else {
                showToast("Не удалось сохранить изменения. Попробуйте позже.", "error");
            }
        }
    };

    const handleChangePassword = async () => {
        const currentErr = validateCurrentPassword(currentPassword);
        const newErr = validateNewPassword(newPassword);
        const confirmErr = validateConfirmPassword(newPassword, confirmPassword);

        setCurrentPasswordError(currentErr);
        setNewPasswordError(newErr);
        setConfirmPasswordError(confirmErr);

        if (currentErr || newErr || confirmErr) return;

        try {
            showToast("Пароль успешно изменён", "success");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (e: any) {
            if (e?.status === 401) {
                setCurrentPasswordError("Неверный текущий пароль");
            } else {
                showToast("Не удалось сменить пароль. Попробуйте позже.", "error");
            }
        }
    };

    const handleSendVerificationCode = async () => {
        try {
            setIsOtpModalOpen(true);
        } catch {
            showToast("Не удалось отправить код. Попробуйте позже.", "error");
        }
    };

    const handleConfirmEmail = async (code: string) => {
        console.log("confirm code:", code);
        setIsEmailVerified(true);
        setIsOtpModalOpen(false);
        showToast("Электронный адрес подтверждён", "success");
    };

    const handleResendCode = async () => {
    };

    const handleSaveAuthorName = async () => {
        const error = validateAuthorName(authorName);
        setAuthorNameError(error);
        if (error) return;

        try {
            showToast("Изменения сохранены", "success");
        } catch {
            showToast("Не удалось сохранить изменения. Попробуйте позже.", "error");
        }
    };

    const handleSaveAuthorBio = async () => {
        const error = validateAuthorBio(authorBio);
        setAuthorBioError(error);
        if (error) return;

        try {
            showToast("Изменения сохранены", "success");
        } catch {
            showToast("Не удалось сохранить изменения. Попробуйте позже.", "error");
        }
    };

    const handleLogout = async () => {
        try {
        } catch {
            showToast("Не удалось выйти из системы. Попробуйте позже.", "error");
        }
    };

    const handleLogoutAll = async () => {
        try {
        } catch {
            showToast("Не удалось выйти со всех устройств. Попробуйте позже.", "error");
        }
    };

    const handleDeleteAccount = async () => {
        try {
        } catch {
            showToast("Не удалось удалить аккаунт. Попробуйте позже.", "error");
        }
    };


    return (
        <div className={styles.page}>
            <div className={`container ${styles.pageInner}`}>

                <ProfileSettingsHero
                    username={MOCK_USER.username}
                    email={MOCK_USER.email}
                    avatarUrl={MOCK_USER.avatarUrl}
                    onPhotoChange={(file) => console.log("photo:", file)}
                />

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <img src={PersonalInfoSvg} alt="" aria-hidden="true" className={styles.sectionIcon} />
                        <h2 className={styles.sectionTitle}>Личная информация</h2>
                    </div>

                    <div className={styles.sectionBody}>
                        <div className={styles.fieldRow}>
                            <InputField
                                label="Имя пользователя"
                                name="username"
                                autoComplete="username"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    if (usernameError) setUsernameError("");
                                }}
                                error={usernameError}
                                placeholder="username"
                            />
                        </div>

                        <button type="button" className={styles.btnPrimary} onClick={handleSaveUsername}>
                            Сохранить
                        </button>
                    </div>
                </section>

                {MOCK_USER.isAuthor && (
                    <>
                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <img src={PersonalInfoSvg} alt="" aria-hidden="true" className={styles.sectionIcon} />
                                <h2 className={styles.sectionTitle}>Информация автора</h2>
                            </div>

                            <div className={styles.sectionBody}>
                                <div className={styles.fieldRow}>
                                    <InputField
                                        label="Имя автора"
                                        name="authorName"
                                        value={authorName}
                                        onChange={(e) => {
                                            setAuthorName(e.target.value);
                                            if (authorNameError) setAuthorNameError("");
                                        }}
                                        error={authorNameError}
                                        placeholder="Ваше имя как автора"
                                    />
                                </div>

                                <button type="button" className={styles.btnPrimary} onClick={handleSaveAuthorName}>
                                    Сохранить
                                </button>
                            </div>
                        </section>

                        <section className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <img src={PersonalInfoSvg} alt="" aria-hidden="true" className={styles.sectionIcon} />
                                <h2 className={styles.sectionTitle}>Описание профиля</h2>
                            </div>

                            <div className={styles.sectionBody}>
                                <div className={styles.fieldRow}>
                                    <TextareaField
                                        label="Описание"
                                        name="authorBio"
                                        value={authorBio}
                                        onChange={(e) => {
                                            setAuthorBio(e.target.value);
                                            if (authorBioError) setAuthorBioError("");
                                        }}
                                        error={authorBioError}
                                        placeholder="Расскажите о себе"
                                        maxLength={1000}
                                        rows={5}
                                    />
                                </div>

                                <button type="button" className={styles.btnPrimary} onClick={handleSaveAuthorBio}>
                                    Сохранить
                                </button>
                            </div>
                        </section>
                    </>
                )}

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <img src={SafetySvg} alt="" aria-hidden="true" className={styles.sectionIcon} />
                        <h2 className={styles.sectionTitle}>Безопасность и пароль</h2>
                    </div>

                    <div className={styles.sectionBody}>
                        <div className={styles.fieldRow}>
                            <InputField
                                label="Текущий пароль"
                                type="password"
                                name="current-password"
                                autoComplete="current-password"
                                value={currentPassword}
                                onChange={(e) => {
                                    setCurrentPassword(e.target.value);
                                    if (currentPasswordError) setCurrentPasswordError("");
                                }}
                                error={currentPasswordError}
                                placeholder="Введите текущий пароль"
                            />
                        </div>

                        <div className={styles.fieldRowDouble}>
                            <InputField
                                label="Новый пароль"
                                type="password"
                                name="new-password"
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    if (newPasswordError) setNewPasswordError("");
                                }}
                                error={newPasswordError}
                                placeholder="Минимум 8 символов"
                            />

                            <InputField
                                label="Подтвердите пароль"
                                type="password"
                                name="confirm-password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (confirmPasswordError) setConfirmPasswordError("");
                                }}
                                error={confirmPasswordError}
                                placeholder="Повторите новый пароль"
                            />
                        </div>

                        <button type="button" className={styles.btnPrimary} onClick={handleChangePassword}>
                            Сменить пароль
                        </button>
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.emailVerifyBlock}>
                        <div className={styles.emailVerifyStatus}>
                            <img
                                src={isEmailVerified ? TickSvg : CrossSvg}
                                alt=""
                                aria-hidden="true"
                                className={styles.emailVerifyIcon}
                            />
                            <span className={isEmailVerified ? styles.emailVerifiedLabel : styles.emailNotVerifiedLabel}>
                                {isEmailVerified ? "Подтверждён" : "Не подтверждён"}
                            </span>
                        </div>

                        <p className={styles.emailVerifyText}>
                            {isEmailVerified
                                ? "Ваш электронный адрес подтверждён"
                                : "Ваш электронный адрес не подтверждён"}
                        </p>

                        {!isEmailVerified && (
                            <div className={styles.emailVerifyAction}>
                                <button
                                    type="button"
                                    className={styles.btnSecondary}
                                    onClick={handleSendVerificationCode}
                                >
                                    Подтвердить
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                <ActiveSessions sessions={MOCK_SESSIONS} />

                <div className={styles.accountActions}>
                    <button type="button" className={styles.btnSecondary} onClick={handleLogout}>
                        Выйти из системы
                    </button>

                    <button type="button" className={styles.btnSecondary} onClick={handleLogoutAll}>
                        Выйти со всех устройств
                    </button>

                    <button type="button" className={styles.deleteBtn} onClick={handleDeleteAccount}>
                        Удалить аккаунт
                    </button>
                </div>

            </div>

            {isOtpModalOpen && (
                <OtpEmailModal
                    email={MOCK_USER.email}
                    onConfirm={handleConfirmEmail}
                    onClose={() => setIsOtpModalOpen(false)}
                    onResend={handleResendCode}
                />
            )}
        </div>
    );
};

export default ProfileSettingsPage;