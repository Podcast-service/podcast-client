import React, { useState } from "react";
import styles from "./DownloadAppBanner.module.css";
import { useNavigate } from "react-router-dom";

import ComputerSvg from "../../assets/icons/computer.svg";


interface DownloadAppBannerProps {
    isPlayerVisible?: boolean;
    onDownloadClick?: () => void;
}

const DownloadAppBanner: React.FC<DownloadAppBannerProps> = ({
    isPlayerVisible = false,

}) => {
    const [isVisible, setIsVisible] = useState(true);
    const navigate = useNavigate();


    if (!isVisible) {
        return null;
    }

    return (
        <aside
            className={`${styles.banner} ${
                isPlayerVisible ? styles.bannerWithPlayer : ""
            }`}
        >
            <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsVisible(false)}
                aria-label="Закрыть"
            >
                ×
            </button>

            <div className={styles.top}>
                <img
                    src={ComputerSvg}
                    alt=""
                    aria-hidden="true"
                    className={styles.icon}
                />

                <p className={styles.text}>
                    Попробуйте наше приложение для Windows и MacOS
                </p>
            </div>

            <button
                type="button"
                className={styles.downloadBtn}
                onClick={() => {
                    setIsVisible(false);
                    navigate("/download");
                }}
            >
                Скачать
            </button>
        </aside>
    );
};

export default DownloadAppBanner;