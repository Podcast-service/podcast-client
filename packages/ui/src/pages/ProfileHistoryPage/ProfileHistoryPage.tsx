import React from "react";
import PodcastRow from "../../components/PodcastRow/PodcastRow";
import styles from "./ProfileHistoryPage.module.css";

const COVER =
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=400&auto=format&fit=crop";

const MOCK_HISTORY = [
    {
        id: "1",
        title: "Этика искусственного интеллекта",
        author: "Future Talks",
        date: "14 окт 2024",
        duration: "54:12",
        category: "Технологии",
        coverUrl: COVER,
        progress: 42,
    },
    {
        id: "2",
        title: "Как работает память",
        author: "MindLab",
        date: "10 окт 2024",
        duration: "39:20",
        category: "Наука",
        coverUrl: COVER,
        isCompleted: true,
    },
];

const ProfileHistoryPage: React.FC = () => {
    return (
        <div className={styles.list}>
            {MOCK_HISTORY.map((podcast) => (
                <PodcastRow key={podcast.id} {...podcast} />
            ))}
        </div>
    );
};

export default ProfileHistoryPage;