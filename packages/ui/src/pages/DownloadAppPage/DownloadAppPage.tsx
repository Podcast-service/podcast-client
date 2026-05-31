import React from "react";
import styles from "./DownloadAppPage.module.css";

import DownloadImage from "../../assets/modalka/download.png";
import ComputerSvg from "../../assets/icons/computer.svg";
import MacSvg from "../../assets/icons/mac.svg";
import NoInternetSvg from "../../assets/icons/noInternet.svg";
import FlashSvg from "../../assets/icons/flash.svg";

const DownloadAppPage: React.FC = () => {
    return (
        <div className={styles.page}>
            <div className={`container ${styles.pageInner}`}>
                <section className={styles.hero}>
                    <div className={styles.content}>
                        <span className={styles.badge}>
                            Десктопное приложение
                        </span>

                        <h1 className={styles.title}>
                            Слушайте подкасты удобнее на компьютере
                        </h1>

                        <p className={styles.description}>
                            Скачайте приложение для Windows или macOS, чтобы слушать выпуски,
                            управлять библиотекой и продолжать прослушивание даже без браузера.
                        </p>

                        <div className={styles.downloadGrid}>
                            <a
                                href="/downloads/podcast-app-windows.exe"
                                download
                                className={styles.downloadCard}
                            >
                                <img
                                    src={ComputerSvg}
                                    alt=""
                                    aria-hidden="true"
                                    className={styles.downloadIcon}
                                />

                                <div className={styles.downloadInfo}>
                                    <span className={styles.downloadLabel}>
                                        Скачать для
                                    </span>
                                    <span className={styles.downloadTitle}>
                                        Windows
                                    </span>
                                </div>
                            </a>

                            <a
                                href="/downloads/podcast-app-macos.dmg"
                                download
                                className={styles.downloadCard}
                            >
                                <img
                                    src={MacSvg}
                                    alt=""
                                    aria-hidden="true"
                                    className={styles.downloadIcon}
                                />

                                <div className={styles.downloadInfo}>
                                    <span className={styles.downloadLabel}>
                                        Скачать для
                                    </span>
                                    <span className={styles.downloadTitle}>
                                        macOS
                                    </span>
                                </div>
                            </a>
                        </div>
                    </div>

                    <div className={styles.imageWrap}>
                        <img
                            src={DownloadImage}
                            alt=""
                            aria-hidden="true"
                            className={styles.image}
                        />
                    </div>
                </section>

                <section className={styles.features}>
                    <div className={styles.featureCard}>
                        <img
                            src={NoInternetSvg}
                            alt=""
                            aria-hidden="true"
                            className={styles.featureIcon}
                        />

                        <div className={styles.featureInfo}>
                            <h2 className={styles.featureTitle}>
                                Работает без интернета
                            </h2>

                            <p className={styles.featureText}>
                                Скачивайте выпуски заранее и слушайте их в любое время.
                            </p>
                        </div>
                    </div>

                    <div className={styles.featureCard}>
                        <img
                            src={FlashSvg}
                            alt=""
                            aria-hidden="true"
                            className={styles.featureIcon}
                        />

                        <div className={styles.featureInfo}>
                            <h2 className={styles.featureTitle}>
                                Быстрый запуск
                            </h2>

                            <p className={styles.featureText}>
                                Открывайте приложение одним кликом и продолжайте с того же места.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default DownloadAppPage;