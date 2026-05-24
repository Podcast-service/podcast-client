import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./ProfileNav.module.css";

const NAV_ITEMS = [
    { label: "Мои лайки", path: "likes" },
    { label: "Мои плейлисты", path: "playlists" },
    { label: "Подписки", path: "subscriptions" },
    { label: "История", path: "history" },
];

const ProfileNav: React.FC = () => {
    return (
        <nav className={styles.nav}>
            <div className={styles.list}>
                {NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `${styles.item} ${isActive ? styles.itemActive : ""}`
                        }
                    >
                        <span className={styles.itemText}>
                            {item.label}
                        </span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default ProfileNav;