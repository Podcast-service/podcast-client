import React from "react";
import PodcastRow from "../../components/PodcastRow/PodcastRow";
import styles from "./ProfileLikesPage.module.css";

const COVER =
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=400&auto=format&fit=crop";

const MOCK_LIKES = [
    {
        id: "1",
        title: "Как перестать выгорать",
        author: "Анна Миронова",
        date: "12 окт 2024",
        duration: "48:12",
        category: "Психология",
        coverUrl: COVER,
        isLiked: true,
    },
    {
        id: "2",
        title: "Будущее AI в медицине",
        author: "Tech Talks",
        date: "5 сен 2024",
        duration: "1:04:18",
        category: "Технологии",
        coverUrl: COVER,
        isLiked: true,
    },
];

const ProfileLikesPage: React.FC = () => {
    return (
        <div className={styles.list}>
            {MOCK_LIKES.map((podcast) => (
                <PodcastRow key={podcast.id} {...podcast} />
            ))}
        </div>
    );
};

export default ProfileLikesPage;