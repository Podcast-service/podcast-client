import React from "react";
import styles from "./CopyLinkModal.module.css";

import CloseSvg from "../../assets/icons/close.svg";
import CopySvg from "../../assets/icons/copy.svg";

interface CopyLinkModalProps {
    link: string;
    onClose: () => void;
}

const CopyLinkModal: React.FC<CopyLinkModalProps> = ({ link, onClose }) => {
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            onClose();
        } catch (error) {
            console.error("Copy failed", error);
        }
    };
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={styles.modal}
                onClick={(event) => event.stopPropagation()}
            >
                <div className={styles.header}>
                    <h2 className={styles.title}>Скопируйте ссылку</h2>

                    <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        <img src={CloseSvg} alt="" aria-hidden="true" />
                    </button>
                </div>

                <div className={styles.content}>
                    <p className={styles.description}>
                        Скопируйте эту ссылку, чтобы поделиться со своими близкими.
                    </p>

                    <div className={styles.fieldGroup}>
                        <span className={styles.label}>Episode Link</span>

                        <div className={styles.linkField}>
                            <span className={styles.linkText}>{link}</span>

                            <button
                                type="button"
                                className={styles.copyIconBtn}
                                onClick={handleCopy}
                                aria-label="Скопировать ссылку"
                            >
                                <img src={CopySvg} alt="" aria-hidden="true" />
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        className={styles.copyBtn}
                        onClick={handleCopy}
                    >
                        Копировать
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CopyLinkModal;