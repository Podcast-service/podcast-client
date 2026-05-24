import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import styles from "./LoginPromptModal.module.css";
import Button from "../Button/Button";
import CloseSvg from "../../assets/icons/close.svg";
import WelcomeImg from "../../assets/modalka/Welcome.png";

interface LoginPromptModalProps {
    onClose: () => void;
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ onClose }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = "hidden";
        document.body.style.paddingRight = `${scrollbarWidth}px`;

        return () => {
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        };
    }, []);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleLogin = () => {
        onClose();
        navigate("/login");
    };

    const handleRegister = () => {
        onClose();
        navigate("/register");
    };

    return ReactDOM.createPortal(
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.modal}>
                <div className={styles.imageWrap}>
                    <img
                        src={WelcomeImg}
                        alt=""
                        aria-hidden="true"
                        className={styles.image}
                    />
                </div>

                <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={onClose}
                    aria-label="Закрыть"
                >
                    <img
                        src={CloseSvg}
                        alt=""
                        aria-hidden="true"
                        className={styles.closeIcon}
                    />
                </button>

                <div className={styles.body}>
                    <h2 className={styles.title}>Добро пожаловать в Podcast!</h2>

                    <p className={styles.description}>
                        Присоединяйтесь к нашему сообществу, чтобы сохранять
                        любимые плейлисты, следить за авторами и получать
                        персональные рекомендации.
                    </p>

                    <div className={styles.actions}>
                        <Button variant="primary" onClick={handleLogin}>
                            Войти
                        </Button>

                        <Button variant="secondary" onClick={handleRegister}>
                            Зарегистрироваться
                        </Button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LoginPromptModal;