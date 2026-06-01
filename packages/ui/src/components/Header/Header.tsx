import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styles from "./Header.module.css";
import LogoSvg from "../../assets/icons/logo.svg";
import SearchSvg from "../../assets/icons/search.svg";
import SettingsSvg from "../../assets/icons/settings.svg";
import CloseSvg from "../../assets/icons/close.svg";
import DefaultAvatarSvg from "../../assets/icons/defaultAvatar.svg";
import { useIsAuthenticated } from "../../hooks/useAuth";
import {
  getSearchSuggestions,
  getMyProfile,
  type SearchSuggestItem,
} from "../../api/podcast";

interface HeaderProps {
  avatarUrl?: string;
  onSearchClick?: () => void;
}

const NAV_ITEMS = [
  { label: "Главная", path: "/", authOnly: false },
  { label: "Подкасты", path: "/podcasts", authOnly: false },
  { label: "Авторы", path: "/authors", authOnly: false },
  { label: "Плейлисты", path: "/playlists", authOnly: false },
];

const getSuggestionPath = (item: SearchSuggestItem) => {
  if (item.type === "AUTHOR") return `/authors/${item.id}`;
  if (item.type === "PLAYLIST") return `/playlists/${item.id}`;
  return `/podcasts/${item.id}`;
};

const getSuggestionTypeLabel = (type: SearchSuggestItem["type"]) => {
  if (type === "AUTHOR") return "Автор";
  if (type === "PLAYLIST") return "Плейлист";
  return "Подкаст";
};

const Header: React.FC<HeaderProps> = ({ avatarUrl, onSearchClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestItem[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState<string | undefined>(
    undefined
  );

  const isSearchPage = location.pathname === "/search";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const trimmedSearch = useMemo(() => searchValue.trim(), [searchValue]);

  // Аватар текущего пользователя для шапки (prop avatarUrl имеет приоритет).
  useEffect(() => {
    if (!isAuthenticated) {
      setProfileAvatar(undefined);
      return;
    }

    let cancelled = false;
    getMyProfile()
      .then((profile) => {
        if (!cancelled) setProfileAvatar(profile.avatarUrl ?? undefined);
      })
      .catch((err) => console.error("Failed to load profile avatar", err));

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const effectiveAvatar = avatarUrl ?? profileAvatar;

  useEffect(() => {
    if (trimmedSearch.length < 2) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      getSearchSuggestions(trimmedSearch)
        .then((items) => {
          if (!cancelled) setSuggestions(items);
        })
        .catch((err) => {
          if (!cancelled) {
            setSuggestions([]);
            console.error("Failed to load search suggestions", err);
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [trimmedSearch]);

  const submitSearch = () => {
    if (!trimmedSearch) return;
    setIsSearchFocused(false);
    navigate(`/search?q=${encodeURIComponent(trimmedSearch)}`);
  };

  const showSuggestions = isSearchFocused && suggestions.length > 0;

  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerWrap} ${isSearchPage ? styles.headerWrapSearch : ""}`}>

        <Link to="/" className={styles.logo}>
          <img src={LogoSvg} alt="Podcast" className={styles.logoIcon} />
          <span className={styles.logoText}>Podcast</span>
        </Link>

        <nav className={`${styles.nav} ${isSearchPage ? styles.navCentered : ""}`}>
          {NAV_ITEMS.filter((item) => !item.authOnly || isAuthenticated).map(
            (item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navLink} ${
                  location.pathname === item.path ? styles.navLinkActive : ""
                }`}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className={`${styles.right} ${isSearchPage ? styles.rightSearch : ""}`}>

          {!isSearchPage && (
            <div className={styles.searchBox}>
              <div className={styles.searchWrap}>
                <img
                  src={SearchSvg}
                  alt=""
                  className={styles.searchIcon}
                  aria-hidden="true"
                />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Поиск подкастов и аудиокниг...."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onClick={onSearchClick}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => {
                    window.setTimeout(() => setIsSearchFocused(false), 120);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitSearch();
                    }
                  }}
                />
              </div>

              {showSuggestions && (
                <div className={styles.suggestions}>
                  {suggestions.map((item) => (
                    <Link
                      key={`${item.type}-${item.id}`}
                      to={getSuggestionPath(item)}
                      className={styles.suggestionItem}
                      onClick={() => setIsSearchFocused(false)}
                    >
                      {item.coverUrl ? (
                        <img
                          src={item.coverUrl}
                          alt=""
                          className={styles.suggestionImage}
                        />
                      ) : (
                        <span className={styles.suggestionPlaceholder} />
                      )}

                      <span className={styles.suggestionText}>
                        <span className={styles.suggestionLabel}>{item.label}</span>
                        <span className={styles.suggestionType}>
                          {getSuggestionTypeLabel(item.type)}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isSearchPage && (
            <button
              type="button"
              className={styles.searchIconBtn}
              onClick={() => navigate("/search")}
              aria-label="Поиск"
            >
              <img src={SearchSvg} alt="" aria-hidden="true" className={styles.searchIconBtnIcon} />
            </button>
          )}

          {isAuthenticated ? (
            <>
              <button
                type="button"
                className={styles.settingsBtn}
                aria-label="Настройки"
                onClick={() => navigate("/profile/edit")}
              >
                <img
                  src={SettingsSvg}
                  alt=""
                  aria-hidden="true"
                  className={styles.settingsIcon}
                />
              </button>

              <button
                type="button"
                className={styles.avatarWrap}
                onClick={() => navigate("/profile")}
                aria-label="Профиль"
              >
                <img
                  src={effectiveAvatar || DefaultAvatarSvg}
                  alt="Профиль"
                  className={styles.avatar}
                />
              </button>
            </>
          ) : (
            <div className={styles.authButtons}>
              <Link to="/login" className={styles.loginBtn}>
                Войти
              </Link>
              <Link to="/register" className={styles.registerBtn}>
                Регистрация
              </Link>
            </div>
          )}

          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <img src={CloseSvg} alt="" aria-hidden="true" className={styles.menuBtnIcon} />
            ) : (
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true">
                <rect width="22" height="2" rx="1" fill="currentColor" />
                <rect y="7" width="22" height="2" rx="1" fill="currentColor" />
                <rect y="14" width="22" height="2" rx="1" fill="currentColor" />
              </svg>
            )}
          </button>

        </div>
      </div>

      {isMobileMenuOpen && (
        <nav className={styles.mobileNav}>
          {NAV_ITEMS.filter((item) => !item.authOnly || isAuthenticated).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.mobileNavLink} ${
                location.pathname === item.path ? styles.mobileNavLinkActive : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};

export default Header;