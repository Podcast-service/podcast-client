import React, { type ReactNode } from "react";
import { Link } from "react-router-dom";
import styles from "./SectionRow.module.css";

interface SectionRowProps {
  title: string;
  actionText?: string;
  actionTo?: string;
  children: ReactNode;
}

const SectionRow: React.FC<SectionRowProps> = ({
  title,
  actionText,
  actionTo,
  children,
}) => {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>

        {actionText && actionTo && (
          <Link to={actionTo} className={styles.actionLink}>
            {actionText}
          </Link>
        )}
      </div>

      <div className={styles.content}>{children}</div>
    </section>
  );
};

export default SectionRow;