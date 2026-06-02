import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import styles from "./YoutubePublishModal.module.css";

import CloseSvg from "../../assets/icons/close.svg";
import RedProfileSvg from "../../assets/icons/redProfile.svg";
import AttentionSvg from "../../assets/icons/attention.svg";
import GoogleSvg from "../../assets/icons/google.svg";
import YoutubeSvg from "../../assets/icons/youtube2.svg";
import ExitSvg from "../../assets/icons/exit.svg";
import ProcessingSvg from "../../assets/icons/processing.svg";
import LoadCrugSvg from "../../assets/icons/loadCrug.svg";
import DarkCheckSvg from "../../assets/icons/darkCheck.svg";
import DarkErrorSvg from "../../assets/icons/darkError.svg";


export type YoutubePublishStatus =
    | "checking"
    | "not_authorized"
    | "authorized"
    | "processing"
    | "success"
    | "error";

interface GoogleAccount {
    name: string;
    email: string;
    avatarUrl?: string;
}

export interface YoutubePublishModalProps {
    status: YoutubePublishStatus;
    googleAccount?: GoogleAccount;
    youtubeUrl?: string;
    onClose: () => void;
    onLoginWithGoogle: () => void;
    onPublish: () => void;
    onLogoutGoogle: () => void;
    onSwitchAccount: () => void;
    onRetry: () => void;
    onOpenYoutube: () => void;
}


const GoogleAccountBlock: React.FC<{
    account: GoogleAccount;
    showSwitch?: boolean;
    onSwitch?: () => void;
}> = ({ account, showSwitch = false, onSwitch }) => (
    <div className={styles.accountBlock}>
        <span className={styles.accountLabel}>Google аккаунт</span>
        <div className={styles.accountRow}>
            {account.avatarUrl ? (
                <img src={account.avatarUrl} alt={account.name} className={styles.accountAvatar} />
            ) : (
                <div className={styles.accountAvatarPlaceholder}>
                    {account.name.charAt(0).toUpperCase()}
                </div>
            )}
            <div className={styles.accountInfo}>
                <span className={styles.accountName}>{account.name}</span>
                <span className={styles.accountEmail}>{account.email}</span>
            </div>
            {showSwitch && (
                <button type="button" className={styles.switchBtn} onClick={onSwitch}>
                    <img src={ProcessingSvg} alt="" aria-hidden="true" className={styles.switchIcon} />
                    Сменить
                </button>
            )}
            <img src={DarkCheckSvg} alt="" aria-hidden="true" className={styles.accountCheck} />
        </div>
    </div>
);


const YoutubePublishModal: React.FC<YoutubePublishModalProps> = ({
    status,
    googleAccount,
    youtubeUrl,
    onClose,
    onLoginWithGoogle,
    onPublish,
    onLogoutGoogle,
    onSwitchAccount,
    onRetry,
    onOpenYoutube,
}) => {
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    const getTitle = () => {
        if (status === "checking") return "Проверка авторизации";
        if (status === "processing") return "Подключение RSS";
        if (status === "success") return "YouTube Music Integration";
        return "Публикация контента";
    };

    return ReactDOM.createPortal(
        <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true">
            <div className={styles.modal}>

                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{getTitle()}</h2>
                    <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        <img src={CloseSvg} alt="" aria-hidden="true" className={styles.closeIcon} />
                    </button>
                </div>

                {status === "checking" && (
                    <div className={styles.processingBlock}>
                        <img
                            src={LoadCrugSvg}
                            alt=""
                            aria-hidden="true"
                            className={styles.loadingSpinner}
                        />
                        <p className={styles.processingTitle}>
                            Проверяем авторизацию...
                        </p>
                        <p className={styles.processingHint}>
                            Секундочку, проверяем вход в Google.
                        </p>
                    </div>
                )}

                {status === "not_authorized" && (
                    <>
                        <p className={styles.subtitle}>Авторизация платформы</p>

                        <div className={styles.notAuthBlock}>
                            <div className={styles.notAuthRow}>
                                <img src={RedProfileSvg} alt="" aria-hidden="true" className={styles.notAuthIcon} />
                                <div className={styles.notAuthStatus}>
                                    <span className={styles.notAuthName}>Google аккаунт</span>
                                    <span className={styles.notAuthError}>
                                        <img src={AttentionSvg} alt="" aria-hidden="true" className={styles.attentionIcon} />
                                        Не авторизован
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button type="button" className={styles.btnGoogle} onClick={onLoginWithGoogle}>
                            <img src={GoogleSvg} alt="" aria-hidden="true" className={styles.btnIconLeft} />
                            Войти и опубликовать на YouTube Music
                        </button>

                        <p className={styles.redirectHint}>
                            Вы будете перенаправлены на страницу входа Google
                        </p>
                    </>
                )}

                {status === "authorized" && googleAccount && (
                    <>
                        <GoogleAccountBlock account={googleAccount} />

                        <p className={styles.connectedText}>
                            Ваш аккаунт успешно подключен. Теперь вы можете
                            опубликовать эпизод напрямую в YouTube Music.
                        </p>

                        <button type="button" className={styles.btnYoutube} onClick={onPublish}>
                            <img src={YoutubeSvg} alt="" aria-hidden="true" className={styles.btnIconLeft} />
                            Опубликовать на YouTube Music
                        </button>

                        <button type="button" className={styles.btnLogout} onClick={onLogoutGoogle}>
                            <img src={ExitSvg} alt="" aria-hidden="true" className={styles.btnIconLeft} />
                            Выйти из Google
                        </button>
                    </>
                )}

                {status === "processing" && (
                    <>
                        {googleAccount && (
                            <GoogleAccountBlock
                                account={googleAccount}
                                showSwitch
                                onSwitch={onSwitchAccount}
                            />
                        )}

                        <span className={styles.sectionLabel}>Добавление RSS</span>

                        <div className={styles.processingBlock}>
                            <img
                                src={LoadCrugSvg}
                                alt=""
                                aria-hidden="true"
                                className={styles.loadingSpinner}
                            />
                            <p className={styles.processingTitle}>
                                Добавляем плейлист в YouTube Music...
                            </p>
                            <p className={styles.processingHint}>
                                Это может занять несколько секунд. Пожалуйста, не закрывайте окно.
                            </p>
                        </div>

                        <button type="button" className={styles.btnDisabled} disabled>
                            Выполняется...
                        </button>
                    </>
                )}

                {status === "success" && (
                    <>
                        {googleAccount && (
                            <GoogleAccountBlock
                                account={googleAccount}
                                showSwitch
                                onSwitch={onSwitchAccount}
                            />
                        )}

                        <div className={styles.successBlock}>
                            <div className={styles.successHeader}>
                                <img src={DarkCheckSvg} alt="" aria-hidden="true" className={styles.statusIcon} />
                                <span className={styles.successLabel}>Готово</span>
                            </div>
                            <p className={styles.successText}>
                                Плейлист успешно добавлен на YouTube Music
                            </p>
                        </div>

                        <div className={styles.actionRow}>
                            <button type="button" className={styles.btnClose} onClick={onClose}>
                                Закрыть
                            </button>
                            <button type="button" className={styles.btnOpenYoutube} onClick={onOpenYoutube}>
                                Открыть на YouTube Music
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={styles.externalIcon}>
                                    <path d="M2 12L12 2M12 2H6M12 2V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    </>
                )}

                {status === "error" && (
                    <>
                        {googleAccount && (
                            <GoogleAccountBlock
                                account={googleAccount}
                                showSwitch
                                onSwitch={onSwitchAccount}
                            />
                        )}

                        <div className={styles.errorBlock}>
                            <div className={styles.errorHeader}>
                                <img src={DarkErrorSvg} alt="" aria-hidden="true" className={styles.statusIcon} />
                                <span className={styles.errorLabel}>Ошибка</span>
                            </div>
                            <p className={styles.errorText}>
                                Не удалось добавить плейлист. Попробуйте снова.
                            </p>
                        </div>

                        <div className={styles.actionRow}>
                            <button type="button" className={styles.btnClose} onClick={onClose}>
                                Закрыть
                            </button>
                            <button type="button" className={styles.btnRetry} onClick={onRetry}>
                                Попробовать снова
                            </button>
                        </div>
                    </>
                )}

            </div>
        </div>,
        document.body
    );
};

export default YoutubePublishModal;