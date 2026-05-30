import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import styles from "./OtpEmailModal.module.css";
import OtpCodeInput from "../OtpCodeInput/OtpCodeInput";
import Button from "../Button/Button";

import MailSvg from "../../assets/icons/mail.svg";

interface OtpEmailModalProps {
    email: string;
    onConfirm: (code: string) => Promise<void>;
    onClose: () => void;
    onResend?: () => Promise<void>;
}

const RESEND_COOLDOWN = 60;

const OtpEmailModal: React.FC<OtpEmailModalProps> = ({
    email,
    onConfirm,
    onClose,
    onResend,
}) => {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);

    useEffect(() => {
        const timer = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const triggerError = () => {
        setIsError(true);
        setCode("");
        setTimeout(() => setIsError(false), 600);
    };

    const handleConfirm = async () => {
        if (code.length < 6) {
            triggerError();
            return;
        }

        setLoading(true);

        try {
            await onConfirm(code);
        } catch {
            triggerError();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || !onResend) return;
        await onResend();
        setResendCooldown(RESEND_COOLDOWN);
        setCode("");
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    return ReactDOM.createPortal(
        <div
            className={styles.overlay}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="otp-modal-title"
        >
            <div className={styles.modal}>
                <h2 id="otp-modal-title" className={styles.title}>
                    Подтвердите почту
                </h2>

                <p className={styles.subtitle}>
                    Мы отправили код вам на почту
                </p>

                <div className={styles.emailBlock}>
                    <img
                        src={MailSvg}
                        alt=""
                        aria-hidden="true"
                        className={styles.emailIcon}
                    />
                    <div className={styles.emailText}>
                        <span className={styles.emailLabel}>Отправлено на:</span>
                        <span className={styles.emailValue}>{email}</span>
                    </div>
                </div>

                <div className={`${styles.inputWrap} ${isError ? styles.shake : ""}`}>
                    <OtpCodeInput
                        value={code}
                        onChange={setCode}
                        length={6}
                        
                    />
                </div>

                <div className={styles.actions}>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading || code.length < 6}
                        loading={loading}
                    >
                        Подтвердить
                    </Button>
                </div>

                <div className={styles.resendRow}>
                    <span className={styles.resendLabel}>Не получили письмо?</span>
                    {resendCooldown > 0 ? (
                        <span className={styles.resendCooldown}>
                            Отправить повторно через {formatTime(resendCooldown)}
                        </span>
                    ) : (
                        <button
                            type="button"
                            className={styles.resendBtn}
                            onClick={handleResend}
                        >
                            Отправить повторно
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default OtpEmailModal;