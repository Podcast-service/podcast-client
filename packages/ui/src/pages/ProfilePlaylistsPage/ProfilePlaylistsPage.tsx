import React from "react";
import { useNavigate } from "react-router-dom";
import PlaylistCard from "../../components/PlaylistCard/PlaylistCard";
import styles from "./ProfilePlaylistsPage.module.css";

const COVER =
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop";

const MOCK_PLAYLISTS = [
    {
        id: "1",
        title: "Вдохновение",
        author: "Вы",
        episodesCount: 12,
        coverUrl: COVER,
        listeners: 12400,
        likes: 2400,
        dislikes: 120,
        isPrivate: true,
        isOwner: true,
    },
    {
        id: "2",
        title: "Лучшие интервью",
        author: "Вы",
        episodesCount: 8,
        coverUrl: COVER,
        listeners: 8900,
        likes: 1300,
        dislikes: 52,
        isOwner: true,
    },
];

const ProfilePlaylistsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <button
                    type="button"
                    className={styles.createBtn}
                    onClick={() => navigate("/playlists/create")}
                >
                    Создать плейлист
                </button>
            </div>

            <div className={styles.grid}>
                {MOCK_PLAYLISTS.map((playlist) => (
                    <PlaylistCard
                        key={playlist.id}
                        {...playlist}
                        onEditClick={() => navigate(`/playlists/${playlist.id}/edit`)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ProfilePlaylistsPage;