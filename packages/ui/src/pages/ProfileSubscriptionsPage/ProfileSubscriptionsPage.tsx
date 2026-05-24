import React from "react";
import AuthorRow from "../../components/AuthorRow/AuthorRow";
import styles from "./ProfileSubscriptionsPage.module.css";

const AVATAR =
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop";

const MOCK_AUTHORS = [
    {
        id: "1",
        name: "Александр Соколов",
        description:
            "Подкасты о технологиях, будущем и искусственном интеллекте.",
        subscribers: 12400,
        avatarUrl: AVATAR,
        isSubscribed: true,
    },
    {
        id: "2",
        name: "Мария Смирнова",
        description:
            "Психология, привычки и внутреннее состояние.",
        subscribers: 8900,
        avatarUrl: AVATAR,
        isSubscribed: true,
    },
];

const ProfileSubscriptionsPage: React.FC = () => {
    return (
        <div className={styles.list}>
            {MOCK_AUTHORS.map((author) => (
                <AuthorRow
                    key={author.id}
                    {...author}
                    onSubscribeClick={() => {}}
                />
            ))}
        </div>
    );
};

export default ProfileSubscriptionsPage;