import React from "react";
import { Link } from "react-router-dom";
import styles from './HeaderLogin.module.css';
import LogoSvg from '../../assets/icons/logo.svg';

const HeaderLogin = () => {
    return (
        <header className={styles.headerLogin}>
            <div className="container">
                <Link to="/" className={styles.headerLoginWrap} aria-label="На главную">
                    <img src={LogoSvg} alt="Logo Podcast" className={styles.icon} />
                    <span className={styles.text}>Podcast</span>
                </Link>
            </div>
        </header>
    )
}

export default HeaderLogin;