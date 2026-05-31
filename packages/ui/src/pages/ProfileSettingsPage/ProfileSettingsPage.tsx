import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProfileSettingsPage.module.css";

import ProfileSettingsHero from "../../components/ProfileSettingsHero/ProfileSettingsHero";
import InputField from "../../components/InputField/InputField";
import TextareaField from "../../components/TextareaField/TextareaField";
import OtpEmailModal from "../../components/OtpEmailModal/OtpEmailModal";
import { useToast } from "../../components/Toast/useToast";

import {
  getMyProfile,
  getMyAuthorProfile,
  updateMyProfile,
  updateMyAuthorProfile,
} from "../../api/podcast";
import { clearTokens, getTokenClaims } from "../../api/auth";
import { uploadProfileCover } from "../../api/mediaUpload";

import PersonalInfoSvg from "../../assets/icons/personalInfo.svg";
import SafetySvg from "../../assets/icons/safety.svg";
import TickSvg from "../../assets/icons/tick.svg";
import CrossSvg from "../../assets/icons/cros.svg";

const validateUsername = (value: string): string => {
  if (!value.trim()) return "Имя пользователя обязательно";
  if (value.length < 3) return "Минимум 3 символа";
  if (value.length > 50) return "Максимум 50 символов";
  if (!/^[a-zA-Z0-9_]+$/.test(value))
    return "Можно использовать только буквы, цифры и знак _";
  return "";
};

const validateNewPassword = (value: string): string => {
  if (!value) return "Пароль обязателен";
  if (value.length < 8) return "Минимум 8 символов";
  if (/[а-яёА-ЯЁ]/.test(value)) return "Пароль не может содержать кириллицу";
  return "";
};

const validateAuthorName = (value: string): string => {
  if (!value.trim()) return "Имя автора обязательно";
  if (value.length < 2) return "Минимум 2 символа";
  return "";
};

const validateAuthorBio = (value: string): string => {
  if (value.length > 1000) return "Максимум 1000 символов";
  return "";
};

const ProfileSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const email = (getTokenClaims()?.email as string) ?? "";

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [isAuthor, setIsAuthor] = useState(false);

  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const [isEmailVerified] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  const [authorName, setAuthorName] = useState("");
  const [authorNameError, setAuthorNameError] = useState("");
  const [authorBio, setAuthorBio] = useState("");
  const [authorBioError, setAuthorBioError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const me = await getMyProfile();
        if (cancelled) return;
        setUsername(me.username);
        setAvatarUrl(me.avatarUrl ?? undefined);

        const author = await getMyAuthorProfile().catch(() => null);
        if (cancelled) return;
        if (author) {
          setIsAuthor(true);
          setAuthorName(author.authorName);
          setAuthorBio(author.description ?? "");
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveUsername = async () => {
    const error = validateUsername(username);
    setUsernameError(error);
    if (error) return;

    try {
      await updateMyProfile({ username });
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
    const newErr = validateNewPassword(newPassword);
    const confirmErr =
      confirmPassword !== newPassword ? "Пароли не совпадают" : "";
    const currentErr = !currentPassword ? "Текущий пароль обязателен" : "";

    setCurrentPasswordError(currentErr);
    setNewPasswordError(newErr);
    setConfirmPasswordError(confirmErr);

    if (currentErr || newErr || confirmErr) return;

    // Смена пароля — ручка auth-service, в podcast-core её нет.
    showToast("Смена пароля будет доступна позже", "error");
  };

  const handleSaveAuthorName = async () => {
    const error = validateAuthorName(authorName);
    setAuthorNameError(error);
    if (error) return;

    try {
      await updateMyAuthorProfile({ authorName });
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
      await updateMyAuthorProfile({ description: authorBio });
      showToast("Изменения сохранены", "success");
    } catch {
      showToast("Не удалось сохранить изменения. Попробуйте позже.", "error");
    }
  };

  const handlePhotoChange = async (file: File) => {
    try {
      const upload = await uploadProfileCover(file);
      await updateMyProfile({ avatarUrl: upload.url });
      setAvatarUrl(upload.url);
      showToast("Фото профиля обновлено", "success");
    } catch (err) {
      console.error("Failed to upload profile photo", err);
      showToast("Не удалось загрузить фото. Попробуйте позже.", "error");
    }
  };

  const handleLogout = () => {
    clearTokens();
    showToast("Вы вышли из системы", "success");
    navigate("/login");
  };

  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <ProfileSettingsHero
          username={username}
          email={email}
          avatarUrl={avatarUrl}
          onPhotoChange={handlePhotoChange}
        />

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <img
              src={PersonalInfoSvg}
              alt=""
              aria-hidden="true"
              className={styles.sectionIcon}
            />
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

            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleSaveUsername}
            >
              Сохранить
            </button>
          </div>
        </section>

        {isAuthor && (
          <>
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <img
                  src={PersonalInfoSvg}
                  alt=""
                  aria-hidden="true"
                  className={styles.sectionIcon}
                />
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

                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleSaveAuthorName}
                >
                  Сохранить
                </button>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <img
                  src={PersonalInfoSvg}
                  alt=""
                  aria-hidden="true"
                  className={styles.sectionIcon}
                />
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

                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleSaveAuthorBio}
                >
                  Сохранить
                </button>
              </div>
            </section>
          </>
        )}

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <img
              src={SafetySvg}
              alt=""
              aria-hidden="true"
              className={styles.sectionIcon}
            />
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

            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleChangePassword}
            >
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
              <span
                className={
                  isEmailVerified
                    ? styles.emailVerifiedLabel
                    : styles.emailNotVerifiedLabel
                }
              >
                {isEmailVerified ? "Подтверждён" : "Не подтверждён"}
              </span>
            </div>

            <p className={styles.emailVerifyText}>
              {isEmailVerified
                ? "Ваш электронный адрес подтверждён"
                : "Ваш электронный адрес не подтверждён"}
            </p>
          </div>
        </section>

        <div className={styles.accountActions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleLogout}
          >
            Выйти из системы
          </button>
        </div>
      </div>

      {isOtpModalOpen && (
        <OtpEmailModal
          email={email}
          onConfirm={async () => setIsOtpModalOpen(false)}
          onClose={() => setIsOtpModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ProfileSettingsPage;
