import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CreatePodcastPage.module.css";

import CreatePodcastForm from "../../components/CreatePodcastForm/CreatePodcastForm";
import AudioUploadBlock from "../../components/AudioUploadBlock/AudioUploadBlock";
import TextUploadBlock from "../../components/TextUploadBlock/TextUploadBlock";
import PodcastPublishStatus from "../../components/PodcastPublishStatus/PodcastPublishStatus";
import { useToast } from "../../components/Toast/useToast";
import {
    createPodcast,
    getCategories,
    updatePodcast,
    type CategoryResponse,
    type PodcastDetailResponse,
} from "../../api/podcast";
import { uploadPodcastAudio, uploadPodcastCover } from "../../api/mediaUpload";

import LeftSvg from "../../assets/icons/left.svg";
import WarningSvg from "../../assets/icons/warning.svg";

type FileType = "audio" | "text";
type PublishStatus = "draft" | "processing" | "ready" | "published" | "error";

interface PodcastFormData {
    title: string;
    description: string;
    categoryId: string;
    speakersCount: number;
    fileType: FileType;
}

const toCategoryOption = (category: CategoryResponse) => ({
    id: category.id,
    label: category.name,
});

const CreatePodcastPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [formData, setFormData] = useState<PodcastFormData | null>(null);
    const [podcast, setPodcast] = useState<PodcastDetailResponse | null>(null);
    const [publishStatus, setPublishStatus] = useState<PublishStatus>("draft");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;

        getCategories()
            .then((items) => {
                if (!cancelled) setCategories(items);
            })
            .catch((err) => {
                console.error("Failed to load podcast categories", err);
                showToast("Не удалось загрузить категории. Попробуйте позже.", "error");
            });

        return () => {
            cancelled = true;
        };
    }, [showToast]);

    const handleFormSave = async (data: PodcastFormData) => {
        setIsSaving(true);

        try {
            if (podcast) {
                const updated = await updatePodcast(podcast.id, {
                    title: data.title.trim(),
                    description: data.description.trim() || null,
                    categoryId: data.categoryId,
                });
                setPodcast(updated);
                setFormData(data);
                showToast("Черновик обновлён", "success");
                return;
            }

            const created = await createPodcast({
                title: data.title.trim(),
                description: data.description.trim() || null,
                categoryId: data.categoryId,
                coverImageUrl: null,
                num_speakers: data.speakersCount,
            });

            setPodcast(created);
            setFormData(data);
            setPublishStatus("draft");
            showToast("Черновик подкаста создан", "success");
        } catch (err) {
            console.error("Failed to save podcast draft", err);
            showToast("Не удалось сохранить черновик. Попробуйте позже.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAudioChange = async (file: File) => {
        if (!podcast) {
            showToast("Сначала сохраните данные подкаста", "error");
            return;
        }

        setPublishStatus("processing");
        try {
            await uploadPodcastAudio(podcast.id, file);
            setPublishStatus("ready");
            showToast("Аудиофайл загружен", "success");
        } catch (err) {
            console.error("Failed to upload podcast audio", err);
            setPublishStatus("error");
            showToast("Не удалось загрузить аудио. Попробуйте позже.", "error");
        }
    };

    const handleCoverChange = async (file: File) => {
        if (!podcast) {
            showToast("Сначала сохраните данные подкаста", "error");
            return;
        }

        try {
            const upload = await uploadPodcastCover(podcast.id, file);
            const updated = await updatePodcast(podcast.id, {
                coverImageUrl: upload.url,
            });
            setPodcast(updated);
            showToast("Обложка загружена", "success");
        } catch (err) {
            console.error("Failed to upload podcast cover", err);
            showToast("Не удалось загрузить обложку. Попробуйте позже.", "error");
        }
    };

    const handleGenerate = (_data: {
        speakers: string[];
        blocks: { speakerId: string; text: string }[];
        coverFile: File | null;
    }) => {
        setPublishStatus("error");
        showToast("Генерация подкаста из текста пока не подключена к API.", "error");
    };

    const handlePublish = () => {
        showToast("Публикацию подключим отдельным шагом.", "error");
    };

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
                            <img
                                src={LeftSvg}
                                alt=""
                                aria-hidden="true"
                                className={styles.backIcon}
                            />
                        </button>

                        <nav className={styles.breadcrumbs}>
                            <button
                                type="button"
                                className={styles.breadcrumbLink}
                                onClick={() => navigate("/profile")}
                            >
                                Профиль
                            </button>
                            <span className={styles.breadcrumbSep}>›</span>
                            <button
                                type="button"
                                className={styles.breadcrumbLink}
                                onClick={() => navigate("/profile/podcasts")}
                            >
                                Мои подкасты
                            </button>
                            <span className={styles.breadcrumbSep}>›</span>
                            <span className={styles.breadcrumbCurrent}>
                                Создать подкаст
                            </span>
                        </nav>
                    </div>

                    <h1 className={styles.pageTitle}>Создать подкаст</h1>
                    <p className={styles.pageDesc}>Заполните информацию и загрузите файл</p>
                </div>

                <div className={styles.columns}>

                    <div className={styles.leftBlock}>
                        <div className={styles.card}>

                            <CreatePodcastForm
                                categories={categories.map(toCategoryOption)}
                                onSave={handleFormSave}
                                onCancel={() => navigate(-1)}
                                loading={isSaving}
                            />

                            {formData && (
                                <>
                                    <div className={styles.divider} />

                                    {formData.fileType === "audio" ? (
                                        <AudioUploadBlock
                                            publishStatus={publishStatus}
                                            onAudioChange={handleAudioChange}
                                            onCoverChange={handleCoverChange}
                                            onPublish={handlePublish}
                                            onCancel={() => navigate(-1)}
                                        />
                                    ) : (
                                        <TextUploadBlock
                                            speakersCount={formData.speakersCount}
                                            publishStatus={publishStatus}
                                            onCoverChange={handleCoverChange}
                                            onGenerate={handleGenerate}
                                            onPublish={handlePublish}
                                            onCancel={() => navigate(-1)}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className={styles.rightBlock}>

                        <PodcastPublishStatus status={publishStatus} />

                        <div className={styles.warningCard}>
                            <img
                                src={WarningSvg}
                                alt=""
                                aria-hidden="true"
                                className={styles.warningIcon}
                            />
                            <p className={styles.warningText}>
                                Подкаст будет доступен для прослушивания сразу после
                                нажатия кнопки «Опубликовать». Вы сможете отредактировать
                                детали позже.
                            </p>
                        </div>

                        {formData?.fileType === "audio" && (
                            <div className={styles.warningCard}>
                                <img
                                    src={WarningSvg}
                                    alt=""
                                    aria-hidden="true"
                                    className={styles.warningIcon}
                                />
                                <p className={styles.warningText}>
                                    Мы начнем готовить транскрипт, как только вы опубликуете
                                    подкаст — он появится на странице подкаста автоматически.
                                </p>
                            </div>
                        )}

                        {formData?.fileType === "text" && (
                            <div className={styles.warningCard}>
                                <img
                                    src={WarningSvg}
                                    alt=""
                                    aria-hidden="true"
                                    className={styles.warningIcon}
                                />
                                <p className={styles.warningText}>
                                    Когда все реплики спикеров будут заполнены — нажмите
                                    «Генерация подкаста». Мы озвучим текст и подготовим
                                    готовый аудиофайл для ваших слушателей.
                                </p>
                            </div>
                        )}

                    </div>

                </div>

            </div>
        </div>
    );
};

export default CreatePodcastPage;
