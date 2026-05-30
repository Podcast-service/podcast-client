import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import styles from "./ProfilePage.module.css";
import ProfileHero from "../../components/ProfileHero/ProfileHero";
import ProfileAuthorHero from "../../components/ProfileAuthorHero/ProfileAuthorHero";
import ProfileNav from "../../components/ProfileNav/ProfileNav";


const MOCK_USER = {
    username: "Alex Johnson",
    authorName: "Александр Соколов",
    email: "alex@example.com",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
    isAuthor: true,
    bio: "Практикующий психолог и исследователь человеческого поведения. В своих подкастах Александр исследует глубины сознания и когнитивные искажения.",
    subscribers: 124000,
};


const ProfilePage: React.FC = () => {
    const { isAuthor } = MOCK_USER;

    return (
        <div className={styles.page}>
            <div className={`container ${styles.pageInner}`}>

                <div className={styles.hero}>
                    {isAuthor ? (
                        <ProfileAuthorHero
                            authorName={MOCK_USER.authorName}
                            email={MOCK_USER.email}
                            avatarUrl={MOCK_USER.avatarUrl}
                            bio={MOCK_USER.bio}
                            subscribers={MOCK_USER.subscribers}
                            onShareClick={() => {}}
                        />
                    ) : (
                        <ProfileHero
                            username={MOCK_USER.username}
                            email={MOCK_USER.email}
                            avatarUrl={MOCK_USER.avatarUrl}
                            isAuthor={false}
                        />
                    )}
                </div>

                <ProfileNav isAuthor={isAuthor} />

                <div className={styles.content}>
                    <Outlet />
                </div>

            </div>
        </div>
    );
};

export default ProfilePage;