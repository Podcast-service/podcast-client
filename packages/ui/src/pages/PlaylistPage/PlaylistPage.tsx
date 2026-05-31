import React, { useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import styles from "./PlaylistPage.module.css";

import PlaylistHero from "../../components/PlaylistHero/PlaylistHero";
import PodcastRow from "../../components/PodcastRow/PodcastRow";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal/ConfirmDeleteModal";
import { useToast } from "../../components/Toast/useToast";


interface Podcast {
    id: string;
    authorUsername: string;
    title: string;
    author: string;
    date: string;
    duration: string;
    category?: string;
    coverUrl?: string;
    progress?: number;
    isCompleted?: boolean;
    isLiked?: boolean;
}

interface MainLayoutContext {
    playPodcast: (podcast: any) => void;
}

const COVER = "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=400&auto=format&fit=crop";

const CURRENT_USERNAME = "alex_johnson";

const MOCK_PLAYLIST = {
    id: "1",
    title: "Стратегия тишины",
    author: "Александр Соколов",
    description: "A curated selection of the most compelling investigative journalism and atmospheric storytelling pieces.",
    coverUrl: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=800&auto=format&fit=crop",
    isPrivate: false,
    isOwner: true,
    isAuthor: true,
    episodesCount: 12,
    totalDuration: "54",
    createdAt: "14 Октября 2024",
    listeners: 12450,
};

const MOCK_PODCASTS: Podcast[] = [
    {
        id: "1",
        authorUsername: "alex_johnson",
        title: "Как справиться с прокрастинацией",
        author: "Александр Соколов",
        date: "12 окт 2023",
        duration: "45:00",
        category: "Саморазвитие",
        coverUrl: COVER,
    },
    {
        id: "2",
        authorUsername: "alex_johnson",
        title: "Искусство глубокого сна",
        author: "Александр Соколов",
        date: "5 окт 2023",
        duration: "38:00",
        category: "Здоровье",
        coverUrl: COVER,
        progress: 66,
    },
    {
        id: "3",
        authorUsername: "other_user",
        title: "Почему мы забываем важное?",
        author: "Мария Смирнова",
        date: "28 сент 2023",
        duration: "52:00",
        category: "Психология",
        coverUrl: COVER,
        isLiked: true,
    },
];

const PlaylistPage: React.FC = () => {
    const { playlistId } = useParams<{ playlistId: string }>();
    const navigate = useNavigate();
    const { playPodcast } = useOutletContext<MainLayoutContext>();
    const { showToast } = useToast();

    const [isAdded, setIsAdded] = useState(false);
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const { isOwner, isAuthor } = MOCK_PLAYLIST;

    const canPublishToYoutube = isOwner && isAuthor && MOCK_PODCASTS.every(p => p.authorUsername === CURRENT_USERNAME);

    const handlePlayAll = () => {
        if (MOCK_PODCASTS.length > 0) {
            playPodcast(MOCK_PODCASTS[0]);
        }
    };

    const handleAddClick = async () => {
        try {
            if (isAdded) {
                setIsAdded(false);
                showToast("Плейлист удален из ваших плейлистов", "success");
            } else {
                setIsAdded(true);
                showToast("Плейлист добавлен к вам", "success");
            }
        } catch {
            showToast("Не удалось выполнить действие. Попробуйте позже.", "error");
        }
    };

    const handleEdit = () => {
        navigate(`/playlists/${playlistId}/edit`);
    };

    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        setIsDeleteModalOpen(false);
        try {
            showToast("Плейлист удален", "success");
            navigate("/profile/playlists");
        } catch {
            showToast("Не удалось удалить плейлист. Попробуйте позже.", "error");
        }
    };

    const handlePublishToYoutube = async () => {
        try {
            showToast("Плейлист опубликован на YouTube Music", "success");
        } catch {
            showToast("Не удалось опубликовать плейлист. Попробуйте позже.", "error");
        }
    };

    const handleLike = (id: string) => {
        setLikedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className={styles.page}>
            <div className={`container ${styles.pageInner}`}>

                <PlaylistHero
                    title={MOCK_PLAYLIST.title}
                    author={MOCK_PLAYLIST.author}
                    description={MOCK_PLAYLIST.description}
                    coverUrl={MOCK_PLAYLIST.coverUrl}
                    isPrivate={MOCK_PLAYLIST.isPrivate}
                    isOwner={isOwner}
                    isAuthor={isAuthor}
                    canPublishToYoutube={canPublishToYoutube}
                    episodesCount={MOCK_PLAYLIST.episodesCount}
                    totalDuration={MOCK_PLAYLIST.totalDuration}
                    createdAt={MOCK_PLAYLIST.createdAt}
                    listeners={MOCK_PLAYLIST.listeners}
                    isAdded={isAdded}
                    onPlayAll={handlePlayAll}
                    onAddClick={handleAddClick}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    onPublishToYoutube={handlePublishToYoutube}
                />

                <div className={styles.list}>
                    {MOCK_PODCASTS.map((podcast, index) => (
                        <div key={podcast.id} className={styles.listItem}>
                            <span className={styles.listNumber}>{index + 1}</span>
                            <PodcastRow
                                {...podcast}
                                isLiked={likedIds.has(podcast.id) || podcast.isLiked}
                                onPlayClick={() => playPodcast(podcast)}
                                onLikeClick={() => handleLike(podcast.id)}
                                onAddClick={() => {}}
                            />
                        </div>
                    ))}
                </div>

            </div>

            {isDeleteModalOpen && (
                <ConfirmDeleteModal
                    onConfirm={handleConfirmDelete}
                    onClose={() => setIsDeleteModalOpen(false)}
                />
            )}
        </div>
    );
};

export default PlaylistPage;