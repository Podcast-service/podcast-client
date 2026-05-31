import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";

import styles from "./EditPlaylistPage.module.css";
import CreatePlaylistHeader from "../../components/CreatePlaylistHeader/CreatePlaylistHeader";
import PlaylistPodcastRow from "../../components/PlaylistPodcastRow/PlaylistPodcastRow";
import { useToast } from "../../components/Toast/useToast";

import SearchSvg from "../../assets/icons/search.svg";
import LeftSvg from "../../assets/icons/left.svg";
import YoutubeSvg from "../../assets/icons/youtube.svg";


interface Podcast {
    id: string;
    authorId: string;
    title: string;
    author: string;
    coverUrl?: string;
}


const COVER = "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=400&auto=format&fit=crop";

const CURRENT_AUTHOR_ID = "author_123";

const MOCK_USER = {
    isAuthor: true,
};

const MOCK_PLAYLIST = {
    name: "Стратегия тишины",
    description: "Подборка подкастов для вечернего прослушивания",
    isPrivate: false,
};

const MOCK_LIKED: Podcast[] = [
    { id: "1", authorId: "author_other1", title: "Как справиться с прокрастинацией", author: "Виктор Соколов", coverUrl: COVER },
    { id: "2", authorId: "author_other1", title: "Искусство глубокого сна", author: "Виктор Соколов", coverUrl: COVER },
    { id: "3", authorId: "author_other2", title: "Почему мы забываем важное?", author: "Мария Смирнова", coverUrl: COVER },
];

const MOCK_ALL: Podcast[] = [
    { id: "1", authorId: "author_other1", title: "Как справиться с прокрастинацией", author: "Виктор Соколов", coverUrl: COVER },
    { id: "2", authorId: "author_other1", title: "Искусство глубокого сна", author: "Виктор Соколов", coverUrl: COVER },
    { id: "3", authorId: "author_other2", title: "Почему мы забываем важное?", author: "Мария Смирнова", coverUrl: COVER },
    { id: "4", authorId: "author_other1", title: "Эмпатия в цифровой век", author: "Виктор Соколов", coverUrl: COVER },
    { id: "5", authorId: "author_123", title: "Квантовый мир", author: "Александр Соколов", coverUrl: COVER },
];

const MOCK_MINE: Podcast[] = [
    { id: "6", authorId: "author_123", title: "Мой первый подкаст", author: "Александр Соколов", coverUrl: COVER },
    { id: "7", authorId: "author_123", title: "Размышления о будущем", author: "Александр Соколов", coverUrl: COVER },
];

const INITIAL_ADDED: Podcast[] = [
    { id: "6", authorId: "author_123", title: "Мой первый подкаст", author: "Александр Соколов", coverUrl: COVER },
    { id: "7", authorId: "author_123", title: "Размышления о будущем", author: "Александр Соколов", coverUrl: COVER },
];


const EditPlaylistPage: React.FC = () => {
    const navigate = useNavigate();
    const { playlistId } = useParams<{ playlistId: string }>();
    const { showToast } = useToast();

    const [name, setName] = useState(MOCK_PLAYLIST.name);
    const [nameError, setNameError] = useState("");
    const [description, setDescription] = useState(MOCK_PLAYLIST.description);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [isPrivate, setIsPrivate] = useState(MOCK_PLAYLIST.isPrivate);

    const defaultTab = MOCK_USER.isAuthor ? "mine" : "likes";
    const [activeTab, setActiveTab] = useState<"likes" | "all" | "mine">(defaultTab as any);
    const [searchQuery, setSearchQuery] = useState("");

    const [addedList, setAddedList] = useState<Podcast[]>(INITIAL_ADDED);
    const [addedIds, setAddedIds] = useState<Set<string>>(
        new Set(INITIAL_ADDED.map((p) => p.id))
    );

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );


    const allPodcastsAreOwn = addedList.every((p) => p.authorId === CURRENT_AUTHOR_ID);
    const canPublishToYoutube = MOCK_USER.isAuthor && allPodcastsAreOwn && addedList.length > 0;

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

    const handleSave = async () => {
        if (!name.trim()) {
            setNameError("Название обязательно");
            return;
        }
        if (addedList.length === 0) {
            showToast("Добавьте хотя бы один подкаст", "error");
            return;
        }

        try {
            showToast("Изменения сохранены", "success");
            navigate(`/playlists/${playlistId}`);
        } catch {
            showToast("Не удалось сохранить изменения. Попробуйте позже.", "error");
        }
    };

    const handlePublishToYoutube = async () => {
        try {
            showToast("Плейлист опубликован на YouTube Music", "success");
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
                        <span className={styles.breadcrumbCurrent}>Редактировать плейлист</span>
                    </nav>
                </div>

                <h1 className={styles.pageTitle}>Редактировать плейлист</h1>
                <p className={styles.pageDesc}>Обновите информацию о плейлисте или измените состав подкастов внутри него</p>

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
                            <button type="button" className={styles.btnSave} onClick={handleSave}>
                                Сохранить изменения
                            </button>

                            {canPublishToYoutube && (
                                <button type="button" className={styles.btnYoutube} onClick={handlePublishToYoutube}>
                                    <img src={YoutubeSvg} alt="" aria-hidden="true" className={styles.youtubeIcon} />
                                    Опубликовать на YouTube Music
                                </button>
                            )}

                            <button type="button" className={styles.btnCancel} onClick={() => navigate(`/playlists/${playlistId}`)}>
                                Отмена
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EditPlaylistPage;