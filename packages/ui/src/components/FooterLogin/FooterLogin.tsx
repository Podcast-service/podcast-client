import React from "react";
import styles from "./FooterLogin.module.css";

const FooterLogin = () => {
    return (
        <footer className={styles.footerLogin}>
            <div className="container">
                <div className={styles.footerLoginWrap}>
                    <span className={styles.text}>©Podcast. Все права защищены</span>
                </div>
            </div>
        </footer>
    )
}

export default FooterLogin;