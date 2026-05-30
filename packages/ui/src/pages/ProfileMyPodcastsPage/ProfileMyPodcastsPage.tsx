import React, { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import styles from "./ProfileMyPodcastsPage.module.css";

import PodcastRow from "../../components/PodcastRow/PodcastRow";
import AuthorPodcastDraftRow from "../../components/AuthorPodcastDraftRow/AuthorPodcastDraftRow";


const COVER = "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=400&auto=format&fit=crop";

const MOCK_DRAFTS = [
    {
        id: "draft-1",
        title: "Как справиться с прокрастинацией",
        category: "Саморазвитие",
        status: "processing" as const,
    },
    {
        id: "draft-2",
        title: "Квантовый мир: за пределами воображения",
        category: "Наука",
        status: "ready" as const,
    },
];

const MOCK_PUBLISHED = [
    {
        id: "1",
        title: "Искусство глубокого сна",
        author: "Вы",
        authorId: "user_123",
        date: "5 окт 2023",
        duration: "38:00",
        category: "Здоровье",
        coverUrl: COVER,
    },
    {
        id: "2",
        title: "Эмпатия в цифровой век",
        author: "Вы",
        authorId: "user_123",
        date: "20 сент 2023",
        duration: "41:00",
        category: "Общество",
        coverUrl: COVER,
    },
];


const ProfileMyPodcastsPage: React.FC = () => {
    const navigate = useNavigate();
    const context = useOutletContext<{ playPodcast?: (podcast: any) => void } | null>();
    const playPodcast = context?.playPodcast ?? (() => {});
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

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

            <div className={styles.header}>
                <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => navigate("/podcasts/create")}
                >
                    Добавить подкаст
                </button>
            </div>

            {MOCK_DRAFTS.length > 0 && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Черновики</h2>
                    <div className={styles.list}>
                        {MOCK_DRAFTS.map((draft) => (
                            <AuthorPodcastDraftRow
                                key={draft.id}
                                id={draft.id}
                                title={draft.title}
                                category={draft.category}
                                status={draft.status}
                            />
                        ))}
                    </div>
                </section>
            )}

            {MOCK_PUBLISHED.length > 0 && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Опубликованные</h2>
                    <div className={styles.list}>
                        {MOCK_PUBLISHED.map((podcast) => (
                            <PodcastRow
                                key={podcast.id}
                                {...podcast}
                                isOwner={true}
                                isLiked={likedIds.has(podcast.id)}
                                onPlayClick={() => playPodcast(podcast)}
                                onLikeClick={() => handleLike(podcast.id)}
                                onAddClick={() => {}}
                                onEditClick={() => navigate(`/podcasts/${podcast.id}/edit`)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {MOCK_DRAFTS.length === 0 && MOCK_PUBLISHED.length === 0 && (
                <p className={styles.empty}>У вас пока нет подкастов</p>
            )}

        </div>
    );
};

export default ProfileMyPodcastsPage;