import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import styles from "./BecomeAuthorSuccessModal.module.css";

import CheckSvg from "../../assets/icons/check.svg";

interface BecomeAuthorSuccessModalProps {
    onContinue: () => void;
}

const BecomeAuthorSuccessModal: React.FC<BecomeAuthorSuccessModalProps> = ({
    onContinue,
}) => {
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    return ReactDOM.createPortal(
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="become-author-title">
            <div className={styles.modal}>
                <div className={styles.iconWrap}>
                    <img
                        src={CheckSvg}
                        alt=""
                        aria-hidden="true"
                        className={styles.icon}
                    />
                </div>

                <h2 id="become-author-title" className={styles.title}>
                    Поздравляем, вы теперь автор!
                </h2>

                <p className={styles.text}>
                    Добро пожаловать в сообщество авторов Podcast!
                    Теперь вам доступен кабинет автора - создавайте подкасты,
                    публикуйте плейлисты и делитесь своими идеями со всем миром.
                </p>

                <button
                    type="button"
                    className={styles.btnContinue}
                    onClick={onContinue}
                >
                    Продолжить
                </button>
            </div>
        </div>,
        document.body
    );
};

export default BecomeAuthorSuccessModal;