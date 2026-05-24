import React from "react";
import { Link } from "react-router-dom";
import styles from "./AuthorPodcastDraftRow.module.css";

import DefaultBookSvg from "../../assets/icons/defaultBook.svg";
import ProcessingSvg from "../../assets/icons/processing.svg";
import ReadySvg from "../../assets/icons/ready.svg";

type AuthorPodcastDraftStatus = "processing" | "ready";

interface AuthorPodcastDraftRowProps {
    id: string;
    title: string;
    category?: string;
    status: AuthorPodcastDraftStatus;
}

const AuthorPodcastDraftRow: React.FC<AuthorPodcastDraftRowProps> = ({
    id,
    title,
    category,
    status,
}) => {
    const isProcessing = status === "processing";

    return (
        <article className={styles.row}>
            <Link to={`/podcasts/create/${id}`} className={styles.rowLink}>
                <div className={styles.coverWrap}>
                    <div className={styles.coverPlaceholder} aria-hidden="true">
                        <img
                            src={DefaultBookSvg}
                            alt=""
                            aria-hidden="true"
                            className={styles.defaultCover}
                        />
                    </div>
                </div>

                <div className={styles.info}>
                    <h3 className={styles.title}>{title}</h3>

                    {category && (
                        <span className={styles.tag}>
                            {category}
                        </span>
                    )}

                    <div className={styles.status}>
                        <img
                            src={isProcessing ? ProcessingSvg : ReadySvg}
                            alt=""
                            aria-hidden="true"
                            className={`${styles.statusIcon} ${
                                isProcessing ? styles.processingIcon : ""
                            }`}
                        />

                        <span>
                            {isProcessing
                                ? "В обработке......."
                                : "Готов к публикации"}
                        </span>
                    </div>
                </div>
            </Link>
        </article>
    );
};

export default AuthorPodcastDraftRow;