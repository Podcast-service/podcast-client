import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProfileSettingsPage.module.css";

import ProfileSettingsHero from "../../components/ProfileSettingsHero/ProfileSettingsHero";
import ActiveSessions from "../../components/ActiveSessions/ActiveSessions";
import InputField from "../../components/InputField/InputField";

import PersonalInfoSvg from "../../assets/icons/personalInfo.svg";
import SafetySvg from "../../assets/icons/safety.svg";
import TickSvg from "../../assets/icons/tick.svg";
import CrosSvg from "../../assets/icons/cros.svg";

const cyrillicRegex = /[А-Яа-яЁё]/;

const MOCK_USER = {
    username: "Alex Johnson",
    email: "alex@example.com",
    avatarUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
    isEmailVerified: true,
};

const MOCK_SESSIONS = [
    {
        id: "1",
        deviceName: 'MacBook Pro 16"',
        deviceInfo: "Chrome • MacOS",
        ipAddress: "172.20.0.1",
        lastActivity: "Сейчас онлайн",
        isCurrent: true,
    },
    {
        id: "2",
        deviceName: "iPhone 15 Pro",
        deviceInfo: "Safari • iOS",
        ipAddress: "91.122.45.10",
        lastActivity: "2 часа назад",
        isCurrent: false,
    },
];

const ProfileSettingsPage: React.FC = () => {
    const navigate = useNavigate();

    const [username, setUsername] = useState(MOCK_USER.username);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");

    const [usernameError, setUsernameError] = useState("");
    const [currentPasswordError, setCurrentPasswordError] = useState("");
    const [newPasswordError, setNewPasswordError] = useState("");
    const [repeatPasswordError, setRepeatPasswordError] = useState("");

    const [profileSuccess, setProfileSuccess] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    const [logoutError, setLogoutError] = useState("");
    const [isLogoutLoading, setIsLogoutLoading] = useState(false);

    const isEmailVerified = MOCK_USER.isEmailVerified;

    const validateCurrentPassword = (value: string): string => {
        if (!value.trim()) {
            return "Введите текущий пароль";
        }

        return "";
    };

    const validateNewPassword = (
        value: string,
        currentValue: string
    ): string => {
        const trimmed = value.trim();

        if (!trimmed) {
            return "Введите новый пароль";
        }

        if (trimmed.length < 8) {
            return "Пароль должен содержать минимум 8 символов";
        }

        if (cyrillicRegex.test(trimmed)) {
            return "Пароль не должен содержать кириллицу";
        }

        if (currentValue.trim() && trimmed === currentValue.trim()) {
            return "Новый пароль должен отличаться от текущего";
        }

        return "";
    };

    const validateRepeatPassword = (
        value: string,
        newValue: string
    ): string => {
        if (!value.trim()) {
            return "Подтвердите новый пароль";
        }

        if (value.trim() !== newValue.trim()) {
            return "Пароли не совпадают";
        }

        return "";
    };

    const handleSaveProfile = () => {
        setUsernameError("");
        setProfileSuccess("");

        const trimmedUsername = username.trim();

        if (!trimmedUsername) {
            setUsernameError("Введите имя пользователя");
            return;
        }

        if (trimmedUsername.length < 3) {
            setUsernameError("Имя пользователя должно содержать минимум 3 символа");
            return;
        }

        if (trimmedUsername.toLowerCase() === "admin") {
            setUsernameError("Имя пользователя уже занято");
            return;
        }

        setProfileSuccess("Изменения сохранены");

        window.setTimeout(() => {
            setProfileSuccess("");
        }, 3000);
    };

    const handleChangePassword = () => {
        setPasswordSuccess("");

        const nextCurrentPasswordError =
            validateCurrentPassword(currentPassword);
        const nextNewPasswordError =
            validateNewPassword(newPassword, currentPassword);
        const nextRepeatPasswordError =
            validateRepeatPassword(repeatPassword, newPassword);

        setCurrentPasswordError(nextCurrentPasswordError);
        setNewPasswordError(nextNewPasswordError);
        setRepeatPasswordError(nextRepeatPasswordError);

        if (
            nextCurrentPasswordError ||
            nextNewPasswordError ||
            nextRepeatPasswordError
        ) {
            return;
        }

        if (currentPassword !== "12345678") {
            setCurrentPasswordError("Текущий пароль введен неверно");
            return;
        }

        setPasswordSuccess("Пароль успешно изменен");
        setCurrentPassword("");
        setNewPassword("");
        setRepeatPassword("");

        window.setTimeout(() => {
            setPasswordSuccess("");
        }, 3000);
    };

    const handleLogout = async () => {
        setLogoutError("");
        setIsLogoutLoading(true);

        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");

        try {
            await fetch("http://186.246.30.30/auth/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(accessToken
                        ? { Authorization: `Bearer ${accessToken}` }
                        : {}),
                },
                body: JSON.stringify({
                    refresh_token: refreshToken,
                }),
            });

            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");

            navigate("/login", { replace: true });
        } catch {
            setLogoutError("Не удалось выйти из системы. Попробуйте еще раз.");
        } finally {
            setIsLogoutLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={`container ${styles.pageInner}`}>
                <ProfileSettingsHero
                    username={username}
                    email={MOCK_USER.email}
                    avatarUrl={MOCK_USER.avatarUrl}
                    onPhotoChange={() => {}}
                />

                <section className={styles.section}>
                    <div className={styles.sectionTitleRow}>
                        <img
                            src={PersonalInfoSvg}
                            alt=""
                            className={styles.sectionIcon}
                        />

                        <h2 className={styles.sectionTitle}>
                            Личная информация
                        </h2>
                    </div>

                    <div className={styles.infoForm}>
                        <InputField
                            label="Имя пользователя"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);

                                if (usernameError) {
                                    setUsernameError("");
                                }

                                if (profileSuccess) {
                                    setProfileSuccess("");
                                }
                            }}
                            placeholder="Иван"
                            error={usernameError}
                        />

                        <div className={styles.profileActions}>
                            <button
                                type="button"
                                className={styles.primaryBtn}
                                onClick={handleSaveProfile}
                            >
                                Сохранить
                            </button>

                            {profileSuccess && (
                                <span className={styles.successMessage}>
                                    {profileSuccess}
                                </span>
                            )}
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionTitleRow}>
                        <img
                            src={SafetySvg}
                            alt=""
                            className={styles.sectionIcon}
                        />

                        <h2 className={styles.sectionTitle}>
                            Безопасность и пароль
                        </h2>
                    </div>

                    <div className={styles.passwordForm}>
                        <InputField
                            label="Текущий пароль"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => {
                                setCurrentPassword(e.target.value);

                                if (currentPasswordError) {
                                    setCurrentPasswordError("");
                                }

                                if (passwordSuccess) {
                                    setPasswordSuccess("");
                                }
                            }}
                            placeholder="........"
                            error={currentPasswordError}
                        />

                        <div className={styles.passwordGrid}>
                            <InputField
                                label="Новый пароль"
                                type="password"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);

                                    if (newPasswordError) {
                                        setNewPasswordError("");
                                    }

                                    if (passwordSuccess) {
                                        setPasswordSuccess("");
                                    }
                                }}
                                placeholder="Минимум 8 символов"
                                error={newPasswordError}
                            />

                            <InputField
                                label="Подтвердите пароль"
                                type="password"
                                value={repeatPassword}
                                onChange={(e) => {
                                    setRepeatPassword(e.target.value);

                                    if (repeatPasswordError) {
                                        setRepeatPasswordError("");
                                    }

                                    if (passwordSuccess) {
                                        setPasswordSuccess("");
                                    }
                                }}
                                placeholder="Минимум 8 символов"
                                error={repeatPasswordError}
                            />
                        </div>

                        <button
                            type="button"
                            className={styles.passwordBtn}
                            onClick={handleChangePassword}
                        >
                            Сменить пароль
                        </button>

                        {passwordSuccess && (
                            <span className={styles.successMessage}>
                                {passwordSuccess}
                            </span>
                        )}
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        Подтверждение Email
                    </h2>

                    <div className={styles.emailStatus}>
                        <img
                            src={isEmailVerified ? TickSvg : CrosSvg}
                            alt=""
                            className={styles.emailIcon}
                        />

                        <span
                            className={
                                isEmailVerified
                                    ? styles.emailSuccess
                                    : styles.emailError
                            }
                        >
                            {isEmailVerified
                                ? "Подтвержден"
                                : "Не подтвержден"}
                        </span>
                    </div>

                    <p className={styles.emailText}>
                        {isEmailVerified
                            ? "Ваш адрес электронной почты подтвержден."
                            : "Ваш адрес электронной почты не подтвержден."}
                    </p>

                    {!isEmailVerified && (
                        <button type="button" className={styles.secondaryBtn}>
                            Подтвердить
                        </button>
                    )}
                </section>

                <ActiveSessions sessions={MOCK_SESSIONS} />

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.logoutBtn}
                        onClick={handleLogout}
                        disabled={isLogoutLoading}
                    >
                        {isLogoutLoading ? "Выход..." : "Выйти из системы"}
                    </button>

                    {logoutError && (
                        <span className={styles.errorMessage}>
                            {logoutError}
                        </span>
                    )}

                    <button type="button" className={styles.deleteBtn}>
                        Удалить аккаунт
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettingsPage;