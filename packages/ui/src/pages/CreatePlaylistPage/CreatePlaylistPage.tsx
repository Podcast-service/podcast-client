import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DragEndEvent } from "@dnd-kit/core";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";

import styles from "./CreatePlaylistPage.module.css";
import CreatePlaylistHeader from "../../components/CreatePlaylistHeader/CreatePlaylistHeader";
import PlaylistPodcastRow from "../../components/PlaylistPodcastRow/PlaylistPodcastRow";
import { useToast } from "../../components/Toast/useToast";

import SearchSvg from "../../assets/icons/search.svg";
import LeftSvg from "../../assets/icons/left.svg";
import YoutubeSvg from "../../assets/icons/youtube.svg";
import WarningSvg from "../../assets/icons/warning.svg";

// ─── типы ────────────────────────────────────────────────────────────────────

interface Podcast {
    id: string;
    authorUsername: string;
    title: string;
    author: string;
    coverUrl?: string;
}

// ─── моки ────────────────────────────────────────────────────────────────────

const COVER = "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=400&auto=format&fit=crop";

const CURRENT_USERNAME = "alex_johnson"; // заменить на реальный username из контекста авторизации

const MOCK_LIKED: Podcast[] = [
    { id: "1", authorUsername: "other_user", title: "Как справиться с прокрастинацией", author: "Виктор Соколов", coverUrl: COVER },
    { id: "2", authorUsername: "other_user", title: "Искусство глубокого сна", author: "Виктор Соколов", coverUrl: COVER },
    { id: "3", authorUsername: "other_user2", title: "Почему мы забываем важное?", author: "Мария Смирнова", coverUrl: COVER },
];

const MOCK_ALL: Podcast[] = [
    { id: "1", authorUsername: "other_user", title: "Как справиться с прокрастинацией", author: "Виктор Соколов", coverUrl: COVER },
    { id: "2", authorUsername: "other_user", title: "Искусство глубокого сна", author: "Виктор Соколов", coverUrl: COVER },
    { id: "3", authorUsername: "other_user2", title: "Почему мы забываем важное?", author: "Мария Смирнова", coverUrl: COVER },
    { id: "4", authorUsername: "other_user", title: "Эмпатия в цифровой век", author: "Виктор Соколов", coverUrl: COVER },
    { id: "5", authorUsername: "alex_johnson", title: "Квантовый мир", author: "Александр Соколов", coverUrl: COVER },
];

const MOCK_MINE: Podcast[] = [
    { id: "6", authorUsername: "alex_johnson", title: "Мой первый подкаст", author: "Александр Соколов", coverUrl: COVER },
    { id: "7", authorUsername: "alex_johnson", title: "Размышления о будущем", author: "Александр Соколов", coverUrl: COVER },
];

const MOCK_USER = {
    isAuthor: true,
};


const CreatePlaylistPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [name, setName] = useState("");
    const [nameError, setNameError] = useState("");
    const [description, setDescription] = useState("");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [isPrivate, setIsPrivate] = useState(!MOCK_USER.isAuthor);

    const defaultTab = MOCK_USER.isAuthor ? "mine" : "likes";
    const [activeTab, setActiveTab] = useState<"likes" | "all" | "mine">(defaultTab as any);
    const [searchQuery, setSearchQuery] = useState("");

    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
    const [addedList, setAddedList] = useState<Podcast[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );


    const allPodcastsAreOwn = addedList.length > 0 && addedList.every((p) => p.authorUsername === CURRENT_USERNAME);
    const canPublishToYoutube = MOCK_USER.isAuthor && allPodcastsAreOwn;


    const getSourceList = (): Podcast[] => {
        if (activeTab === "likes") return MOCK_LIKED;
        if (activeTab === "mine") return MOCK_MINE;
        return MOCK_ALL;
    };

    const filteredList = getSourceList().filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.author.toLowerCase().includes(searchQuery.toLowerCase())
    );


    const handleAdd = (podcast: Podcast) => {
        if (addedIds.has(podcast.id)) {
            setAddedIds((prev) => { const next = new Set(prev); next.delete(podcast.id); return next; });
            setAddedList((prev) => prev.filter((p) => p.id !== podcast.id));
        } else {
            setAddedIds((prev) => new Set(prev).add(podcast.id));
            setAddedList((prev) => [...prev, podcast]);
        }
    };

    const handleRemove = (id: string) => {
        setAddedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
        setAddedList((prev) => prev.filter((p) => p.id !== id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setAddedList((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            setNameError("Название обязательно");
            return;
        }
        if (addedList.length === 0) {
            showToast("Добавьте хотя бы один подкаст", "error");
            return;
        }

        try {
            showToast("Плейлист создан", "success");
            navigate("/profile/playlists");
        } catch {
            showToast("Не удалось создать плейлист. Попробуйте позже.", "error");
        }
    };

    const handlePublishToYoutube = async () => {
        try {
            showToast("Плейлист создан и опубликован на YouTube Music", "success");
            navigate("/profile/playlists");
        } catch {
            showToast("Не удалось опубликовать плейлист. Попробуйте позже.", "error");
        }
    };


    return (
        <div className={styles.page}>
            <div className={`container ${styles.pageInner}`}>

                <div className={styles.topBar}>
                    <button type="button" className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Назад">
                        <img src={LeftSvg} alt="" aria-hidden="true" className={styles.backIcon} />
                    </button>

                    <nav className={styles.breadcrumbs}>
                        <button type="button" className={styles.breadcrumbLink} onClick={() => navigate("/profile")}>
                            Профиль
                        </button>
                        <span className={styles.breadcrumbSep}>›</span>
                        <button type="button" className={styles.breadcrumbLink} onClick={() => navigate("/profile/playlists")}>
                            Мои плейлисты
                        </button>
                        <span className={styles.breadcrumbSep}>›</span>
                        <span className={styles.breadcrumbCurrent}>Создать плейлист</span>
                    </nav>
                </div>

                <h1 className={styles.pageTitle}>Создать плейлист</h1>
                <p className={styles.pageDesc}>Объедините опубликованные подкасты в свою тематическую подборку</p>

                <div className={styles.layout}>

                    <div className={styles.leftBlock}>
                        <CreatePlaylistHeader
                            isAuthor={MOCK_USER.isAuthor}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            name={name}
                            onNameChange={(v) => { setName(v); if (nameError) setNameError(""); }}
                            nameError={nameError}
                            description={description}
                            onDescriptionChange={setDescription}
                            isPrivate={isPrivate}
                            onPrivacyChange={setIsPrivate}
                            onCoverChange={setCoverFile}
                        />

                        <div className={styles.searchWrap}>
                            <img src={SearchSvg} alt="" aria-hidden="true" className={styles.searchIcon} />
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Поиск подкастов..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className={styles.podcastList}>
                            {filteredList.map((podcast) => (
                                <PlaylistPodcastRow
                                    key={podcast.id}
                                    id={podcast.id}
                                    title={podcast.title}
                                    author={podcast.author}
                                    coverUrl={podcast.coverUrl}
                                    variant="selector"
                                    isAdded={addedIds.has(podcast.id)}
                                    onAddClick={() => handleAdd(podcast)}
                                    onPlayClick={() => {}}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={styles.rightColumn}>
                        <div className={styles.rightBlock}>
                            <h2 className={styles.addedTitle}>Добавленные подкасты</h2>

                            {addedList.length === 0 ? (
                                <p className={styles.emptyText}>Пока что нет добавленных подкастов :(</p>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={addedList.map((p) => p.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className={styles.addedList}>
                                            {addedList.map((podcast, index) => (
                                                <div key={podcast.id} className={styles.addedItem}>
                                                    <span className={styles.addedNumber}>{index + 1}</span>
                                                    <PlaylistPodcastRow
                                                        id={podcast.id}
                                                        title={podcast.title}
                                                        author={podcast.author}
                                                        coverUrl={podcast.coverUrl}
                                                        variant="added"
                                                        onRemoveClick={() => handleRemove(podcast.id)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}

                            <div className={styles.actions}>
                                <button type="button" className={styles.btnCreate} onClick={handleCreate}>
                                    Создать плейлист
                                </button>

                                {canPublishToYoutube && (
                                    <button type="button" className={styles.btnYoutube} onClick={handlePublishToYoutube}>
                                        <img src={YoutubeSvg} alt="" aria-hidden="true" className={styles.youtubeIcon} />
                                        Опубликовать на YouTube Music
                                    </button>
                                )}

                                <button type="button" className={styles.btnCancel} onClick={() => navigate("/profile/playlists")}>
                                    Отмена
                                </button>
                            </div>
                        </div>

                        <div className={styles.youtubeHint}>
                            <img src={WarningSvg} alt="" aria-hidden="true" className={styles.youtubeHintIcon} />
                            <p className={styles.youtubeHintText}>
                                Публикование плейлиста на Youtube Music доступно при следующих условиях: вы являетесь автором, а также ваш плейлист состоит только из подкастов, загруженных вами.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CreatePlaylistPage;