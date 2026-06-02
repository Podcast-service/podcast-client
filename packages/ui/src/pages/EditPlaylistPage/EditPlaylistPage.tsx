import React, { useEffect, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
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
import YoutubePublishModal from "../../components/YoutubePublishModal/YoutubePublishModal";
import type { YoutubePublishStatus } from "../../components/YoutubePublishModal/YoutubePublishModal";
import {
    addPodcastToPlaylist,
    getMyAuthorProfile,
    getMyAuthorPodcasts,
    getMyLikedPodcasts,
    getPlaylist,
    getPodcasts,
    removePodcastFromPlaylist,
    reorderPlaylistPodcasts,
    updatePlaylist,
    type PlaylistPodcastItem,
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

const mapPodcast = (podcast: PodcastCard | PlaylistPodcastItem): Podcast => ({
    id: podcast.id,
    authorId: podcast.author.id,
    title: podcast.title,
    author: podcast.author.authorName,
    coverUrl: podcast.coverImageUrl ?? undefined,
});


const EditPlaylistPage: React.FC = () => {
  usePageTitle("Редактирование плейлиста");
    const navigate = useNavigate();
    const { playlistId } = useParams<{ playlistId: string }>();
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
    const [isLoading, setIsLoading] = useState(true);

    const [initialIds, setInitialIds] = useState<Set<string>>(new Set());
    const [addedList, setAddedList] = useState<Podcast[]>([]);
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );


    useEffect(() => {
        if (!playlistId) return;
        let cancelled = false;

        (async () => {
            try {
                setIsLoading(true);
                const [playlist, allPage, author] = await Promise.all([
                    getPlaylist(playlistId),
                    getPodcasts({ sort: "DATE_DESC", size: 50 }),
                    getMyAuthorProfile().catch(() => null),
                ]);
                if (cancelled) return;

                setName(playlist.title);
                setDescription(playlist.description ?? "");
                setIsPrivate(!playlist.isPublic);
                setAllPodcasts(allPage.items.map(mapPodcast));

                const likedPage = await getMyLikedPodcasts({ size: 50 }).catch(() => null);
                if (!cancelled && likedPage) {
                    setLikedPodcasts(likedPage.items.map(mapPodcast));
                }

                const added = (playlist.podcasts ?? []).map(mapPodcast);
                setAddedList(added);
                setAddedIds(new Set(added.map((podcast) => podcast.id)));
                setInitialIds(new Set(added.map((podcast) => podcast.id)));

                if (author) {
                    setIsAuthor(true);
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
                console.error("Failed to load playlist editor", err);
                showToast("Не удалось загрузить плейлист. Попробуйте позже.", "error");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [playlistId, showToast]);

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

    const handleSave = async () => {
        if (!name.trim()) {
            setNameError("Название обязательно");
            return;
        }
        if (addedList.length === 0) {
            showToast("Добавьте хотя бы один подкаст", "error");
            return;
        }

        if (!playlistId) return;

        try {
            let coverImageUrl: string | undefined;
            if (coverFile) {
                const upload = await uploadPlaylistCover(playlistId, coverFile);
                coverImageUrl = upload.url;
            }

            await updatePlaylist(playlistId, {
                title: name.trim(),
                description: description.trim() ? description.trim() : null,
                ...(coverImageUrl ? { coverImageUrl } : {}),
                isPublic: !isPrivate,
            });

            const nextIds = new Set(addedList.map((podcast) => podcast.id));
            const removedIds = [...initialIds].filter((id) => !nextIds.has(id));
            const addedIdsList = addedList
                .map((podcast) => podcast.id)
                .filter((id) => !initialIds.has(id));

            for (const id of removedIds) {
                await removePodcastFromPlaylist(playlistId, id);
            }

            for (const id of addedIdsList) {
                await addPodcastToPlaylist(playlistId, id);
            }

            if (addedList.length > 0) {
                await reorderPlaylistPodcasts(
                    playlistId,
                    addedList.map((podcast, index) => ({
                        podcastId: podcast.id,
                        position: index + 1,
                    }))
                );
            }

            showToast("Изменения сохранены", "success");
            navigate(`/playlists/${playlistId}`);
        } catch {
            showToast("Не удалось сохранить изменения. Попробуйте позже.", "error");
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
                        <span className={styles.breadcrumbCurrent}>Редактировать плейлист</span>
                    </nav>
                </div>

                <h1 className={styles.pageTitle}>Редактировать плейлист</h1>
                <p className={styles.pageDesc}>Обновите информацию о плейлисте или измените состав подкастов внутри него</p>

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
                            {isLoading ? (
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

export default EditPlaylistPage;