import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CreatePodcastPage.module.css";

import CreatePodcastForm from "../../components/CreatePodcastForm/CreatePodcastForm";
import AudioUploadBlock from "../../components/AudioUploadBlock/AudioUploadBlock";
import TextUploadBlock from "../../components/TextUploadBlock/TextUploadBlock";
import PodcastPublishStatus from "../../components/PodcastPublishStatus/PodcastPublishStatus";

import LeftSvg from "../../assets/icons/left.svg";
import WarningSvg from "../../assets/icons/warning.svg";

type FileType = "audio" | "text";
type PublishStatus = "draft" | "processing" | "ready" | "published" | "error";

interface FormData {
    title: string;
    description: string;
    categoryId: string;
    speakersCount: number;
    fileType: FileType;
}

const CATEGORIES = [
    { id: "psychology", label: "Психология" },
    { id: "science", label: "Наука" },
    { id: "tech", label: "Технологии" },
    { id: "business", label: "Бизнес" },
    { id: "health", label: "Здоровье" },
    { id: "design", label: "Дизайн" },
    { id: "entertainment", label: "Развлечения" },
    { id: "sport", label: "Спорт" },
];

const CreatePodcastPage: React.FC = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState<FormData | null>(null);
    const [publishStatus, setPublishStatus] = useState<PublishStatus>("draft");

    const handleFormSave = (data: {
        title: string;
        description: string;
        categoryId: string;
        speakersCount: number;
        fileType: FileType;
    }) => {
        setFormData(data);
        setPublishStatus("draft");
    };

    const handleAudioChange = (file: File) => {
        console.log("audio file:", file.name);
        setPublishStatus("processing");
    };

    const handleGenerate = (data: {
        speakers: string[];
        blocks: { speakerId: string; text: string }[];
        coverFile: File | null;
    }) => {
        console.log("generate:", data);
        setPublishStatus("processing");
    };

    const handlePublish = () => {
        setPublishStatus("published");
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
                                categories={CATEGORIES}
                                onSave={handleFormSave}
                                onCancel={() => navigate(-1)}
                            />

                            {formData && (
                                <>
                                    <div className={styles.divider} />

                                    {formData.fileType === "audio" ? (
                                        <AudioUploadBlock
                                            publishStatus={publishStatus}
                                            onAudioChange={handleAudioChange}
                                            onCoverChange={(file) =>
                                                console.log("cover:", file.name)
                                            }
                                            onPublish={handlePublish}
                                            onCancel={() => navigate(-1)}
                                        />
                                    ) : (
                                        <TextUploadBlock
                                            speakersCount={formData.speakersCount}
                                            publishStatus={publishStatus}
                                            onCoverChange={(file) =>
                                                console.log("cover:", file.name)
                                            }
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