import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import styles from "./ConfirmDeleteModal.module.css";

import DeleteSvg from "../../assets/icons/delete.svg";

interface ConfirmDeleteModalProps {
    onConfirm: () => void;
    onClose: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    onConfirm,
    onClose,
}) => {
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

    return ReactDOM.createPortal(
        <div
            className={styles.overlay}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
        >
            <div className={styles.modal}>
                <div className={styles.iconWrap}>
                    <img
                        src={DeleteSvg}
                        alt=""
                        aria-hidden="true"
                        className={styles.icon}
                    />
                </div>

                <h2 id="confirm-delete-title" className={styles.title}>
                    Вы уверены?
                </h2>

                <p className={styles.subtitle}>
                    Это действие необратимо. После удаления восстановить данные будет невозможно.
                </p>

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.btnCancel}
                        onClick={onClose}
                    >
                        Отмена
                    </button>

                    <button
                        type="button"
                        className={styles.btnDelete}
                        onClick={onConfirm}
                    >
                        Удалить
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmDeleteModal;