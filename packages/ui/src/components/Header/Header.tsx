import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Header.module.css";
import LogoSvg from "../../assets/icons/logo.svg";
import SearchSvg from "../../assets/icons/search.svg";
import SettingsSvg from "../../assets/icons/settings.svg";
import DefaultAvatarSvg from "../../assets/icons/defaultAvatar.svg";

interface HeaderProps {
  avatarUrl?: string;
  onSearchClick?: () => void;
}

const NAV_ITEMS = [
  { label: "Главная", path: "/" },
  { label: "Подкасты", path: "/podcasts" },
  { label: "Авторы", path: "/authors" },
  { label: "Плейлисты", path: "/playlists" },
  { label: "Мои рекомендации", path: "/recommendation" },
];

const Header: React.FC<HeaderProps> = ({ avatarUrl, onSearchClick }) => {
  const location = useLocation();
  const [searchValue, setSearchValue] = useState("");

  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerWrap}`}>

        <Link to="/" className={styles.logo}>
          <img src={LogoSvg} alt="Podcast" className={styles.logoIcon} />
          <span className={styles.logoText}>Podcast</span>
        </Link>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navLink} ${
                location.pathname === item.path ? styles.navLinkActive : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.right}>
          <div className={styles.searchWrap}>
            <img src={SearchSvg} alt="" className={styles.searchIcon} aria-hidden="true" />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Поиск подкастов и аудиокниг...."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onClick={onSearchClick}
            />
          </div>

          <button className={styles.settingsBtn} aria-label="Настройки">
            <img src={SettingsSvg} alt="" aria-hidden="true" className={styles.settingsIcon} />
          </button>

          <Link to="/profile" className={styles.avatarWrap}>
            <img
              src={avatarUrl || DefaultAvatarSvg}
              alt="Профиль"
              className={styles.avatar}
            />
          </Link>
        </div>

      </div>
    </header>
  );
};

export default Header;