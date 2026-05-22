import React from "react";
import styles from "./LoadMoreButton.module.css";

interface LoadMoreButtonProps {
  onClick: () => void;
  loading?: boolean;
}

const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({ onClick, loading = false }) => {
  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.btn}
        onClick={onClick}
        disabled={loading}
      >
        {loading ? "Загрузка..." : "Смотреть еще"}
      </button>
    </div>
  );
};

export default LoadMoreButton;