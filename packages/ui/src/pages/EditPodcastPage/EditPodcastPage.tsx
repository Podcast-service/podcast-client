import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./EditPodcastPage.module.css";

import EditPodcastForm from "../../components/EditPodcastForm/EditPodcastForm";
import PodcastPublishStatus from "../../components/PodcastPublishStatus/PodcastPublishStatus";
import { useToast } from "../../components/Toast/useToast";
import {
    deletePodcast,
    getCategories,
    getPodcast,
    updatePodcast,
    type CategoryResponse,
    type PodcastDetailResponse,
} from "../../api/podcast";
import { toPublishStatus } from "../../utils/mappers";
import { uploadPodcastCover } from "../../api/mediaUpload";

import LeftSvg from "../../assets/icons/left.svg";

const toCategoryOption = (category: CategoryResponse) => ({
    id: category.id,
    label: category.name,
});

const EditPodcastPage: React.FC = () => {
    const navigate = useNavigate();
    const { podcastId } = useParams<{ podcastId: string }>();
    const { showToast } = useToast();

    const [podcast, setPodcast] = useState<PodcastDetailResponse | null>(null);
    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!podcastId) return;

        let cancelled = false;

        (async () => {
            try {
                setIsInitialLoading(true);
                setLoadError(null);

                const [podcastData, categoryItems] = await Promise.all([
                    getPodcast(podcastId),
                    getCategories(),
                ]);

                if (!cancelled) {
                    setPodcast(podcastData);
                    setCategories(categoryItems);
                }
            } catch (err: any) {
                if (!cancelled) {
                    setLoadError(
                        err?.status === 404
                            ? "Подкаст не найден."
                            : "Не удалось загрузить подкаст. Попробуйте позже."
                    );
                    console.error("Failed to load podcast editor", err);
                }
            } finally {
                if (!cancelled) setIsInitialLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [podcastId]);

    const handleSave = async (data: {
        title: string;
        description: string;
        categoryId: string;
        coverFile: File | null;
    }) => {
        if (!podcastId) return;

        setLoading(true);
        try {
            let coverImageUrl: string | undefined;

            if (data.coverFile) {
                const upload = await uploadPodcastCover(podcastId, data.coverFile);
                coverImageUrl = upload.url;
            }

            const updated = await updatePodcast(podcastId, {
                title: data.title,
                description: data.description.trim() ? data.description.trim() : null,
                categoryId: data.categoryId,
                ...(coverImageUrl ? { coverImageUrl } : {}),
            });

            setPodcast(updated);
            showToast("Изменения сохранены", "success");
            navigate(`/podcasts/${podcastId}`);
        } catch (err) {
            console.error("Failed to save podcast", err);
            showToast("Не удалось сохранить изменения. Попробуйте позже.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!podcastId) return;

        try {
            await deletePodcast(podcastId);
            showToast("Подкаст удалён", "success");
            navigate("/profile/podcasts");
        } catch (err) {
            console.error("Failed to delete podcast", err);
            showToast("Не удалось удалить подкаст. Попробуйте позже.", "error");
        }
    };

    if (isInitialLoading) {
        return (
            <div className={styles.page}>
                <div className={`container ${styles.pageInner}`}>
                    <p style={{ padding: "40px 0" }}>Загрузка…</p>
                </div>
            </div>
        );
    }

    if (loadError || !podcast) {
        return (
            <div className={styles.page}>
                <div className={`container ${styles.pageInner}`}>
                    <p style={{ padding: "40px 0" }}>
                        {loadError ?? "Подкаст не найден."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={`container ${styles.pageInner}`}>

                <div className={styles.header}>
                    <div className={styles.topBar}>
                        <button
                            type="button"
                            className={styles.backBtn}
                            onClick={() => navigate(-1)}
                            aria-label="Назад"
                        >
                            <img src={LeftSvg} alt="" aria-hidden="true" className={styles.backIcon} />
                        </button>

                        <nav className={styles.breadcrumbs}>
                            <button type="button" className={styles.breadcrumbLink} onClick={() => navigate("/profile")}>
                                Профиль
                            </button>
                            <span className={styles.breadcrumbSep}>›</span>
                            <button type="button" className={styles.breadcrumbLink} onClick={() => navigate("/profile/podcasts")}>
                                Мои подкасты
                            </button>
                            <span className={styles.breadcrumbSep}>›</span>
                            <span className={styles.breadcrumbCurrent}>Редактировать подкаст</span>
                        </nav>
                    </div>

                    <h1 className={styles.pageTitle}>Редактировать подкаст</h1>
                    <p className={styles.pageDesc}>Обновите информацию о подкасте</p>
                </div>

                <div className={styles.columns}>

                    <div className={styles.leftBlock}>
                        <div className={styles.card}>
                            <EditPodcastForm
                                key={podcast.id}
                                initialTitle={podcast.title}
                                initialDescription={podcast.description ?? ""}
                                initialCategoryId={podcast.category?.id ?? ""}
                                initialCoverUrl={podcast.coverImageUrl ?? undefined}
                                categories={categories.map(toCategoryOption)}
                                loading={loading}
                                onSave={handleSave}
                                onDelete={handleDelete}
                                onCancel={() => navigate(-1)}
                            />
                        </div>
                    </div>

                    <div className={styles.rightBlock}>
                        <PodcastPublishStatus
                            status={toPublishStatus(podcast.status)}
                            publishedAt={podcast.publishedAt ?? undefined}
                        />
                    </div>

                </div>

            </div>
        </div>
    );
};

export default EditPodcastPage;
