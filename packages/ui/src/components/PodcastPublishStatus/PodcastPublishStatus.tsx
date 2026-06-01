import React from "react";
import styles from "./PodcastPublishStatus.module.css";

import ClaudeSvg from "../../assets/icons/claude.svg";
import ClaudeProcSvg from "../../assets/icons/claudeProc.svg";
import ClaudeRepeatSvg from "../../assets/icons/claudeRepeat.svg";
import ClaudeCheckSvg from "../../assets/icons/claudeCheck.svg";
import ClaudeBigCheckSvg from "../../assets/icons/claudeBigCheck.svg";
import ClaudeErrorSvg from "../../assets/icons/claudeError.svg";
import DarkCheckSvg from "../../assets/icons/darkCheck.svg";
import DarkErrorSvg from "../../assets/icons/darkError.svg";

export type PublishStatus = "draft" | "processing" | "ready" | "published" | "error";

interface PodcastPublishStatusProps {
    status: PublishStatus;
    publishedAt?: string;
}

const formatPublishedAt = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = [
        "января", "февраля", "марта", "апреля", "мая", "июня",
        "июля", "августа", "сентября", "октября", "ноября", "декабря",
    ];
    const month = months[date.getMonth()];
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day} ${month}, ${hours}.${minutes}`;
};

interface StepProps {
    number?: number;
    icon?: string;
    label: string;
    variant: "default" | "active" | "done" | "error";
}

const Step: React.FC<StepProps> = ({ number, icon, label, variant }) => (
    <div className={styles.step}>
        <div className={`${styles.stepBadge} ${styles[`stepBadge_${variant}`]}`}>
            {icon ? (
                <img src={icon} alt="" aria-hidden="true" className={styles.stepIcon} />
            ) : (
                <span className={styles.stepNumber}>{number}</span>
            )}
        </div>
        <span className={`${styles.stepLabel} ${styles[`stepLabel_${variant}`]}`}>
            {label}
        </span>
    </div>
);

const PodcastPublishStatus: React.FC<PodcastPublishStatusProps> = ({
    status,
    publishedAt,
}) => {
    return (
        <div className={styles.card}>
            <h3 className={styles.title}>Статус публикации</h3>
            <div className={styles.divider} />

            {status === "draft" && (
                <div className={styles.body}>
                    <img src={ClaudeSvg} alt="" aria-hidden="true" className={styles.mainIcon} />
                    <p className={styles.mainText}>Загрузите свой файл</p>
                </div>
            )}

            {status === "processing" && (
                <div className={styles.body}>
                    <img src={ClaudeProcSvg} alt="" aria-hidden="true" className={styles.mainIcon} />
                    <p className={styles.mainText}>
                        Вы можете закрыть страницу, обработка продолжится в фоне
                    </p>
                    <div className={styles.processingBlock}>
                        <img
                            src={ClaudeRepeatSvg}
                            alt=""
                            aria-hidden="true"
                            className={`${styles.processingIcon} ${styles.spinning}`}
                        />
                        <span className={styles.processingText}>Обработка файла</span>
                    </div>
                </div>
            )}

            {status === "ready" && (
                <div className={styles.readyBlock}>
                    <img src={ClaudeCheckSvg} alt="" aria-hidden="true" className={styles.mainIcon} />
                    <p className={styles.readyTitle}>Готов к публикации</p>
                    <p className={styles.readyDesc}>
                        Все проверки пройдены. Нажмите «Опубликовать», чтобы выпустить подкаст
                    </p>
                </div>
            )}

            {status === "published" && (
                <div className={styles.publishedBlock}>
                    <img src={ClaudeBigCheckSvg} alt="" aria-hidden="true" className={styles.mainIcon} />
                    <p className={styles.publishedTitle}>Опубликован</p>
                    <p className={styles.publishedDesc}>
                        Подкаст доступен для слушателей.{" "}
                        {publishedAt && <>Опубликовано: {formatPublishedAt(publishedAt)}</>}
                    </p>
                </div>
            )}

            {status === "error" && (
                <div className={styles.body}>
                    <img src={ClaudeErrorSvg} alt="" aria-hidden="true" className={styles.mainIcon} />
                    <p className={styles.errorTitle}>Ошибка</p>
                    <p className={styles.errorDesc}>Попробуйте ещё раз</p>
                </div>
            )}

            <div className={styles.steps}>
                <Step
                    number={
                        status === "draft" || status === "processing" ? 1 : undefined
                    }
                    icon={
                        status === "ready" || status === "published" ? DarkCheckSvg :
                        status === "error" ? DarkErrorSvg : undefined
                    }
                    label="Обработка файла"
                    variant={
                        status === "processing" ? "active" :
                        status === "ready" || status === "published" ? "done" :
                        status === "error" ? "error" :
                        "default"
                    }
                />

                <Step
                    number={
                        status === "published" ? undefined : 2
                    }
                    icon={
                        status === "published" ? DarkCheckSvg : undefined
                    }
                    label="Готов к публикации"
                    variant={
                        status === "ready" ? "active" :
                        status === "published" ? "done" :
                        "default"
                    }
                />

                <Step
                    number={
                        status === "published" ? undefined : 3
                    }
                    icon={
                        status === "published" ? DarkCheckSvg : undefined
                    }
                    label="Опубликован"
                    variant={
                        status === "published" ? "done" : "default"
                    }
                />
            </div>
        </div>
    );
};

export default PodcastPublishStatus;
