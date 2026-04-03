import React from "react";
import styles from './Logo.module.css';
import LogoSvg from '../../assets/icons/logo.svg';

const Logo = () => {
    return (
        <div className={styles.logo}>
            <img src={LogoSvg} alt="Podcast" className={styles.icon} />
            <span className={styles.text}>Podcast</span>
        </div>
    )
}

export default Logo;