import React from "react";
import styles from "./DownloadAppPage.module.css";

import DownloadImg from "../../assets/modalka/download.png";
import ComputerSvg from "../../assets/icons/computer.svg";
import MacSvg from "../../assets/icons/mac.svg";
import AndroidSvg from "../../assets/icons/android.svg";
import IphoneSvg from "../../assets/icons/iphone.svg";
import NoInternetSvg from "../../assets/icons/noInternet.svg";
import FlashSvg from "../../assets/icons/flashh.svg";

const DownloadAppPage: React.FC = () => {
    return (
        <div className={styles.page}>
            <div className={`container ${styles.pageInner}`}>

                <img
                    src={DownloadImg}
                    alt="Podcast приложение"
                    className={styles.image}
                />

                <h1 className={styles.title}>Podcast для компьютера</h1>

                <p className={styles.description}>
                    Слушайте подкасты без браузера. Быстро, удобно и всегда под рукой.
                    Наслаждайтесь кристально чистым звуком и интуитивным управлением
                    прямо с рабочего стола.
                </p>

                <div className={styles.desktopButtons}>
                    <a href="#" className={`${styles.downloadBtn} ${styles.downloadBtnPrimary}`}>
                        <img src={ComputerSvg} alt="" aria-hidden="true" className={styles.btnIcon} />
                        <span className={styles.btnText}>
                            <span className={styles.btnLabel}>Скачать для</span>
                            <span className={styles.btnOs}>Windows</span>
                        </span>
                    </a>
                    <a href="#" className={`${styles.downloadBtn} ${styles.downloadBtnSecondary}`}>
                        <img src={MacSvg} alt="" aria-hidden="true" className={styles.btnIcon} />
                        <span className={styles.btnText}>
                            <span className={styles.btnLabel}>Скачать для</span>
                            <span className={styles.btnOs}>MacOS</span>
                        </span>
                    </a>
                </div>

                <div className={styles.mobileButtons}>
                    <a href="#" className={`${styles.downloadBtn} ${styles.downloadBtnPrimary}`}>
                        <img src={AndroidSvg} alt="" aria-hidden="true" className={styles.btnIcon} />
                        <span className={styles.btnText}>
                            <span className={styles.btnLabel}>Скачать для</span>
                            <span className={styles.btnOs}>Android</span>
                        </span>
                    </a>
                    <a href="#" className={`${styles.downloadBtn} ${styles.downloadBtnSecondary}`}>
                        <img src={IphoneSvg} alt="" aria-hidden="true" className={styles.btnIcon} />
                        <span className={styles.btnText}>
                            <span className={styles.btnLabel}>Скачать для</span>
                            <span className={styles.btnOs}>iPhone</span>
                        </span>
                    </a>
                </div>

                <div className={styles.features}>
                    <div className={styles.feature}>
                        <img src={NoInternetSvg} alt="" aria-hidden="true" className={styles.featureIcon} />
                        <span className={styles.featureText}>Работает без браузера</span>
                    </div>
                    <div className={styles.feature}>
                        <img src={FlashSvg} alt="" aria-hidden="true" className={styles.featureIcon} />
                        <span className={styles.featureText}>Быстрый запуск</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DownloadAppPage;