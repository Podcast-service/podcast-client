import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import styles from "./ProfilePage.module.css";
import ProfileHero from "../../components/ProfileHero/ProfileHero";
import ProfileNav from "../../components/ProfileNav/ProfileNav";

const MOCK_USER = {
    username: "Alex Johnson",
    email: "alex@example.com",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
    isAuthor: false,
};

const ProfilePage: React.FC = () => {
    return (
        <div className={styles.page}>
            <div className={`container ${styles.pageInner}`}>
                <div className={styles.hero}>
                    <ProfileHero
                        username={MOCK_USER.username}
                        email={MOCK_USER.email}
                        avatarUrl={MOCK_USER.avatarUrl}
                        isAuthor={MOCK_USER.isAuthor}
                    />
                </div>

                <ProfileNav />

                <div className={styles.content}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;