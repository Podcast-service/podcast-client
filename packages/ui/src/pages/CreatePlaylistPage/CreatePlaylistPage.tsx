import React, { useEffect, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
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
import YoutubePublishModal from "../../components/YoutubePublishModal/YoutubePublishModal";
import type { YoutubePublishStatus } from "../../components/YoutubePublishModal/YoutubePublishModal";
import {
    addPodcastToPlaylist,
    createPlaylist,
    getMyAuthorPodcasts,
    getMyAuthorProfile,
    getMyLikedPodcasts,
    getPodcasts,
    updatePlaylist,
    type PodcastCard,
} from "../../api/podcast";
import { uploadPlaylistCover } from "../../api/mediaUpload";

interface Podcast {
    id: string;
    authorId: string;
    title: string;
    author: string;
    coverUrl?: string;
}

const mapPodcast = (podcast: PodcastCard): Podcast => ({
    id: podcast.id,
    authorId: podcast.author.id,
    title: podcast.title,
    author: podcast.author.authorName,
    coverUrl: podcast.coverImageUrl ?? undefined,
});

const CreatePlaylistPage: React.FC = () => {
  usePageTitle("Создание плейлиста");
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [name, setName] = useState("");
    const [nameError, setNameError] = useState("");
    const [description, setDescription] = useState("");
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [isPrivate, setIsPrivate] = useState(true);

    const [isAuthor, setIsAuthor] = useState(false);
    const [activeTab, setActiveTab] = useState<"likes" | "all" | "mine">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [allPodcasts, setAllPodcasts] = useState<Podcast[]>([]);
    const [myPodcasts, setMyPodcasts] = useState<Podcast[]>([]);
    const [likedPodcasts, setLikedPodcasts] = useState<Podcast[]>([]);
    const [isLoadingPodcasts, setIsLoadingPodcasts] = useState(true);

    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
    const [addedList, setAddedList] = useState<Podcast[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setIsLoadingPodcasts(true);
                const [allPage, author] = await Promise.all([
                    getPodcasts({ sort: "DATE_DESC", size: 50 }),
                    getMyAuthorProfile().catch(() => null),
                ]);
                if (cancelled) return;

                setAllPodcasts(allPage.items.map(mapPodcast));

                const likedPage = await getMyLikedPodcasts({ size: 50 }).catch(() => null);
                if (!cancelled && likedPage) {
                    setLikedPodcasts(likedPage.items.map(mapPodcast));
                }

                if (author) {
                    setIsAuthor(true);
                    setIsPrivate(false);
                    setActiveTab("mine");

                    const minePage = await getMyAuthorPodcasts({
                        sort: "DATE_DESC",
                        size: 50,
                    });
                    if (!cancelled) {
                        setMyPodcasts(minePage.items.map(mapPodcast));
                    }
                }
            } catch (err) {
                console.error("Failed to load podcasts for playlist", err);
                showToast("Не удалось загрузить подкасты. Попробуйте позже.", "error");
            } finally {
                if (!cancelled) setIsLoadingPodcasts(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [showToast]);

    const canPublishToYoutube = false;

    const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
    const [youtubeStatus, setYoutubeStatus] = useState<YoutubePublishStatus>("not_authorized");


    const getSourceList = (): Podcast[] => {
        if (activeTab === "likes") return likedPodcasts;
        if (activeTab === "mine") return myPodcasts;
        return allPodcasts;
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
            const playlist = await createPlaylist({
                title: name.trim(),
                description: description.trim() ? description.trim() : null,
                coverImageUrl: null,
                isPublic: !isPrivate,
            });

            if (coverFile) {
                const upload = await uploadPlaylistCover(playlist.id, coverFile);
                await updatePlaylist(playlist.id, {
                    coverImageUrl: upload.url,
                });
            }

            for (const podcast of addedList) {
                await addPodcastToPlaylist(playlist.id, podcast.id);
            }

            showToast("Плейлист создан", "success");
            navigate("/profile/playlists");
        } catch {
            showToast("Не удалось создать плейлист. Попробуйте позже.", "error");
        }
    };

    const handlePublishToYoutube = () => {
        setIsYoutubeModalOpen(true);
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
                            isAuthor={isAuthor}
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
                            {isLoadingPodcasts ? (
                                <p style={{ padding: "16px 0" }}>Загрузка…</p>
                            ) : filteredList.length === 0 ? (
                                <p style={{ padding: "16px 0" }}>Подкасты не найдены.</p>
                            ) : filteredList.map((podcast) => (
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

            {isYoutubeModalOpen && (
                <YoutubePublishModal
                    status={youtubeStatus}
                    onClose={() => setIsYoutubeModalOpen(false)}
                    onLoginWithGoogle={() => setYoutubeStatus("authorized")}
                    onPublish={() => setYoutubeStatus("processing")}
                    onLogoutGoogle={() => setYoutubeStatus("not_authorized")}
                    onSwitchAccount={() => console.log("switch account")}
                    onRetry={() => setYoutubeStatus("processing")}
                    onOpenYoutube={() => window.open("https://music.youtube.com", "_blank")}
                />
            )}
        </div>
    );
};

export default CreatePlaylistPage;