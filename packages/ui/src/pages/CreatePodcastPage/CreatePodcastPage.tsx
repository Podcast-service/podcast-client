import React, { useEffect, useRef, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import styles from "./CreatePodcastPage.module.css";

import CreatePodcastForm from "../../components/CreatePodcastForm/CreatePodcastForm";
import AudioUploadBlock from "../../components/AudioUploadBlock/AudioUploadBlock";
import TextUploadBlock from "../../components/TextUploadBlock/TextUploadBlock";
import PodcastPublishStatus from "../../components/PodcastPublishStatus/PodcastPublishStatus";
import { useToast } from "../../components/Toast/useToast";
import {
    createPodcast,
    getCategories,
    getPodcast,
    publishPodcast,
    updatePodcast,
    type CategoryResponse,
    type PodcastDetailResponse,
} from "../../api/podcast";
import { toPublishStatus, type PublishStatus } from "../../utils/mappers";
import { uploadPodcastAudio, uploadPodcastCover } from "../../api/mediaUpload";
import { generateTts } from "../../api/tts";

import LeftSvg from "../../assets/icons/left.svg";
import WarningSvg from "../../assets/icons/warning.svg";

type FileType = "audio" | "text";

/** Интервал опроса статуса подкаста, пока media worker обрабатывает аудио. */
const STATUS_POLL_INTERVAL_MS = 3000;

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

const isFileType = (value: string | null): value is FileType =>
    value === "audio" || value === "text";

/** Подкаст с бэкенда → данные формы создания. Тип файла на бэкенде не хранится,
 *  поэтому берём его из URL, а без подсказки открываем в режиме «Аудиофайл». */
const toFormData = (
    p: PodcastDetailResponse,
    fileType: FileType = "audio"
): PodcastFormData => ({
    title: p.title,
    description: p.description ?? "",
    categoryId: p.category?.id ?? "",
    speakersCount: p.num_speakers,
    fileType,
});

/** Статусы, при которых исходный аудиофайл уже загружен на бэкенд. */
const AUDIO_UPLOADED_STATUSES = ["UPLOADED", "PROCESSING", "PROCESSED", "PUBLISHED"];

const CreatePodcastPage: React.FC = () => {
  usePageTitle("Создание подкаста");
    const navigate = useNavigate();
    const { podcastId } = useParams<{ podcastId?: string }>();
    const [searchParams] = useSearchParams();
    const { showToast } = useToast();
    const urlFileType = searchParams.get("fileType");

    const [categories, setCategories] = useState<CategoryResponse[]>([]);
    const [formData, setFormData] = useState<PodcastFormData | null>(null);
    const [podcast, setPodcast] = useState<PodcastDetailResponse | null>(null);
    const [publishStatus, setPublishStatus] = useState<PublishStatus>("draft");
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    // Загрузка нужна только при открытии существующего черновика по :podcastId.
    const [isInitialLoading, setIsInitialLoading] = useState<boolean>(Boolean(podcastId));
    const [loadError, setLoadError] = useState<string | null>(null);

    const pollRef = useRef<number | null>(null);

    const rememberPodcastInUrl = (id: string, fileType?: FileType) => {
        const params = new URLSearchParams();
        if (fileType) {
            params.set("fileType", fileType);
        }
        const query = params.toString();
        navigate(`/podcasts/create/${id}${query ? `?${query}` : ""}`, {
            replace: true,
        });
    };

    const stopPolling = () => {
        if (pollRef.current !== null) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };

    /**
     * Опрашивает GET /podcasts/{id}, пока статус не станет терминальным
     * (по умолчанию — готов к публикации / опубликован / ошибка), и держит
     * блок статуса в синхроне с реальным состоянием на бэкенде.
     */
    const startPolling = (
        id: string,
        terminal: PublishStatus[] = ["ready", "published", "error"]
    ) => {
        stopPolling();
        pollRef.current = window.setInterval(async () => {
            try {
                const fresh = await getPodcast(id);
                setPodcast(fresh);
                const next = toPublishStatus(fresh.status);
                setPublishStatus(next);
                if (terminal.includes(next)) stopPolling();
            } catch (err) {
                console.error("Failed to poll podcast status", err);
            }
        }, STATUS_POLL_INTERVAL_MS);
    };

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

    // Останавливаем опрос при размонтировании страницы.
    useEffect(() => stopPolling, []);

    // Открытие существующего черновика по адресу /podcasts/create/:podcastId —
    // подгружаем подкаст, заполняем форму и сразу показываем нижнюю часть.
    useEffect(() => {
        if (!podcastId) return;
        // Уже загружен (например, только что создан и сделан replace в URL) —
        // не дёргаем бэкенд повторно и не показываем лоадер.
        if (podcast?.id === podcastId) {
            setIsInitialLoading(false);
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                setIsInitialLoading(true);
                setLoadError(null);

                const fresh = await getPodcast(podcastId);
                if (cancelled) return;

                setPodcast(fresh);
                setFormData(
                    toFormData(fresh, isFileType(urlFileType) ? urlFileType : "audio")
                );
                const status = toPublishStatus(fresh.status);
                setPublishStatus(status);
                // Если файл ещё обрабатывается — продолжаем следить за статусом.
                if (status === "processing") startPolling(podcastId);
            } catch (err: any) {
                if (!cancelled) {
                    setLoadError(
                        err?.status === 404
                            ? "Подкаст не найден."
                            : "Не удалось загрузить подкаст. Попробуйте позже."
                    );
                    console.error("Failed to load podcast draft", err);
                }
            } finally {
                if (!cancelled) setIsInitialLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [podcastId, urlFileType]);

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
                rememberPodcastInUrl(updated.id, data.fileType);
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
            setPublishStatus(toPublishStatus(created.status));
            showToast("Черновик подкаста создан", "success");
            // Запоминаем id в URL: при перезагрузке черновик подтянется целиком.
            rememberPodcastInUrl(created.id, data.fileType);
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
            showToast("Аудиофайл загружен, идёт обработка", "success");
            rememberPodcastInUrl(podcast.id, formData?.fileType);
            // Дальше статус двигает media worker (UPLOADED → PROCESSING →
            // PROCESSED): опрашиваем бэкенд, пока подкаст не будет готов.
            startPolling(podcast.id);
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

    const handleGenerate = async (data: {
        speakers: string[];
        blocks: { speakerId: string; text: string }[];
        coverFile: File | null;
    }) => {
        if (!podcast) {
            showToast("Сначала сохраните данные подкаста", "error");
            return;
        }

        const text = data.blocks
            .filter((block) => block.text.trim() !== "")
            .map((block) => ({
                text: block.text.trim(),
                voice: data.speakers[Number(block.speakerId)]?.trim() || "",
            }));

        if (text.length === 0) {
            showToast("Добавьте хотя бы одну реплику с текстом", "error");
            return;
        }

        setPublishStatus("processing");
        try {
            const result = await generateTts({ id_podcast: podcast.id, text });
            const generatedPodcastId = result.id_podcast || podcast.id;
            showToast("Текст отправлен на генерацию", "success");
            rememberPodcastInUrl(generatedPodcastId, formData?.fileType ?? "text");
            startPolling(generatedPodcastId);
        } catch (err: any) {
            console.error("Failed to start TTS generation", err);
            setPublishStatus("error");
            showToast(
                err?.status === 422
                    ? "Проверьте текст и спикеров: данные не прошли валидацию."
                    : "Не удалось запустить генерацию. Попробуйте позже.",
                "error"
            );
        }
    };

    const handlePublish = async () => {
        if (!podcast) {
            showToast("Сначала сохраните данные подкаста", "error");
            return;
        }

        setIsPublishing(true);
        try {
            const published = await publishPodcast(podcast.id);
            setPodcast(published);
            const next = toPublishStatus(published.status);
            setPublishStatus(next);

            if (next === "published") {
                stopPolling();
                showToast("Подкаст опубликован", "success");
                navigate(`/podcasts/${published.id}`);
            } else {
                // 202: бэкенд принял в обработку — ждём перехода в PUBLISHED.
                showToast("Подкаст отправлен на публикацию", "success");
                startPolling(published.id, ["published", "error"]);
            }
        } catch (err) {
            console.error("Failed to publish podcast", err);
            showToast("Не удалось опубликовать подкаст. Попробуйте позже.", "error");
        } finally {
            setIsPublishing(false);
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

    if (loadError) {
        return (
            <div className={styles.page}>
                <div className={`container ${styles.pageInner}`}>
                    <p style={{ padding: "40px 0" }}>{loadError}</p>
                </div>
            </div>
        );
    }

    const audioUploaded = Boolean(
        podcast &&
            (AUDIO_UPLOADED_STATUSES.includes(podcast.status) ||
                podcast.audio_url_file)
    );

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
                                key={podcast?.id ?? "new"}
                                categories={categories.map(toCategoryOption)}
                                initialTitle={formData?.title}
                                initialDescription={formData?.description}
                                initialCategoryId={formData?.categoryId}
                                initialSpeakersCount={formData?.speakersCount}
                                initialFileType={formData?.fileType ?? null}
                                lockSpeakers={Boolean(podcast)}
                                onSave={handleFormSave}
                                onCancel={() => navigate(-1)}
                                loading={isSaving}
                            />

                            {formData && (
                                <>
                                    <div className={styles.divider} />

                                    {formData.fileType === "audio" ? (
                                        <AudioUploadBlock
                                            key={podcast?.id ?? "new"}
                                            publishStatus={publishStatus}
                                            publishing={isPublishing}
                                            initialCoverUrl={podcast?.coverImageUrl ?? null}
                                            audioUploaded={audioUploaded}
                                            audioUrl={podcast?.audioUrl ?? null}
                                            onAudioChange={handleAudioChange}
                                            onCoverChange={handleCoverChange}
                                            onPublish={handlePublish}
                                            onCancel={() => navigate(-1)}
                                        />
                                    ) : (
                                        <TextUploadBlock
                                            speakersCount={formData.speakersCount}
                                            publishStatus={publishStatus}
                                            publishing={isPublishing}
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

                        <PodcastPublishStatus
                            status={publishStatus}
                            publishedAt={podcast?.publishedAt ?? undefined}
                        />

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
