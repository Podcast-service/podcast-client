import React from "react";
import { useNavigate } from "react-router-dom";

import styles from "./NotFoundPage.module.css";

import ErrorPageImage from "../../assets/modalka/errorPage.png";

const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <img
                    src={ErrorPageImage}
                    alt=""
                    aria-hidden="true"
                    className={styles.image}
                />

                <h1 className={styles.title}>
                    Страница не найдена
                </h1>

                <p className={styles.description}>
                    Кажется, этот подкаст еще не выложен или ссылка устарела.
                    Давайте вернемся к прослушиванию на главную.
                </p>

                <button
                    type="button"
                    className={styles.homeButton}
                    onClick={() => navigate("/")}
                >
                    На главную
                </button>
            </div>
        </div>
    );
};

export default NotFoundPage;