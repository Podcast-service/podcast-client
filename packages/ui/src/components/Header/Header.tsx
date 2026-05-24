import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styles from "./Header.module.css";
import LogoSvg from "../../assets/icons/logo.svg";
import SearchSvg from "../../assets/icons/search.svg";
import SettingsSvg from "../../assets/icons/settings.svg";
import DefaultAvatarSvg from "../../assets/icons/defaultAvatar.svg";
import LoginPromptModal from "../LoginPromptModal/LoginPromptModal";

interface HeaderProps {
  avatarUrl?: string;
  onSearchClick?: () => void;
  isAuthenticated?: boolean;
}

const NAV_ITEMS = [
  { label: "Главная", path: "/" },
  { label: "Подкасты", path: "/podcasts" },
  { label: "Авторы", path: "/authors" },
  { label: "Плейлисты", path: "/playlists" },
  { label: "Мои рекомендации", path: "/recommendation" },
];

const Header: React.FC<HeaderProps> = ({
  avatarUrl,
  onSearchClick,
  isAuthenticated = true,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAvatarClick = () => {
    if (isAuthenticated) {
      navigate("/profile");
    } else {
      setIsModalOpen(true);
    }
  };

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

          <button
            type="button"
            className={styles.avatarWrap}
            onClick={handleAvatarClick}
            aria-label="Профиль"
          >
            <img
              src={avatarUrl || DefaultAvatarSvg}
              alt="Профиль"
              className={styles.avatar}
            />
          </button>
        </div>

      </div>

      {isModalOpen && (
        <LoginPromptModal onClose={() => setIsModalOpen(false)} />
      )}
    </header>
  );
};

export default Header;