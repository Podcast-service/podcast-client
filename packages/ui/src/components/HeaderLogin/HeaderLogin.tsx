import React from "react";
import styles from './HeaderLogin.module.css';
import LogoSvg from '../../assets/icons/logo.svg';

const HeaderLogin = () => {
    return (
        <header className={styles.headerLogin}>
            <div className="container">
                <div className={styles.headerLoginWrap}>
                    <img src={LogoSvg} alt="Logo Podcast" className={styles.icon}></img>
                    <span className={styles.text}>Podcast</span>
                </div>
            </div>
        </header>
    )
}

export default HeaderLogin;