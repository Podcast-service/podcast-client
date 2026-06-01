import React from "react";
import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerWrap}`}>
        <div className={styles.left}>
          <span className={styles.logo}>Podcast</span>
          <span className={styles.copy}>© 2026 Podcast. Все права защищены.</span>
        </div>
        <nav className={styles.links}>
          <Link to="/about" className={styles.link}>О НАС</Link>
          <Link to="/privacy" className={styles.link}>КОНФИДЕНЦИАЛЬНОСТЬ</Link>
          <Link to="/terms" className={styles.link}>УСЛОВИЯ</Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;