import React from "react";
import styles from "./PodcastSummary.module.css";

import SparkleSvg from "../../assets/icons/sparkle.svg";

interface PodcastSummaryProps {
  text: string;
  title?: string;
}

/**
 * Чистим дефект вёрстки из исходного текста: местами после точки/!/? нет
 * пробела перед следующим предложением («дипфейков.В этом» → «дипфейков. В этом»).
 * Цель — заглавная буква (рус/лат) сразу за знаком конца предложения, чтобы не
 * трогать сокращения и числа.
 */
const fixMissingSpaces = (text: string): string =>
  text.replace(/([.!?])([A-ZА-ЯЁ])/g, "$1 $2");

const PodcastSummary: React.FC<PodcastSummaryProps> = ({
  text,
  title = "AI Summary",
}) => {
  return (
    <section className={styles.summary}>
      <div className={styles.header}>
        <img
          src={SparkleSvg}
          alt=""
          aria-hidden="true"
          className={styles.icon}
        />

        <h2 className={styles.title}>{title}</h2>
      </div>

      <p className={styles.body}>{fixMissingSpaces(text)}</p>
    </section>
  );
};

export default PodcastSummary;
