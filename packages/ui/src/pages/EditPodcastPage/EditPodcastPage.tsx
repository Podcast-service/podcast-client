import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./EditPodcastPage.module.css";

import EditPodcastForm from "../../components/EditPodcastForm/EditPodcastForm";
import PodcastPublishStatus from "../../components/PodcastPublishStatus/PodcastPublishStatus";
import { useToast } from "../../components/Toast/useToast";

import LeftSvg from "../../assets/icons/left.svg";

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

const MOCK_PODCAST = {
    title: "Стратегия тишины",
    description: "Прежде чем говорить, что долго молчать вредно, послушайте мой подкаст и убедитесь что это не так",
    categoryId: "tech",
    coverUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
};

const EditPodcastPage: React.FC = () => {
    const navigate = useNavigate();
    const { podcastId } = useParams<{ podcastId: string }>();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(false);

    const handleSave = async (data: {
        title: string;
        description: string;
        categoryId: string;
        coverFile: File | null;
    }) => {
        setLoading(true);
        try {
            console.log("save:", data);
            showToast("Изменения сохранены", "success");
            navigate(`/podcasts/${podcastId}`);
        } catch {
            showToast("Не удалось сохранить изменения. Попробуйте позже.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            showToast("Подкаст удален", "success");
            navigate("/profile/podcasts");
        } catch {
            showToast("Не удалось удалить подкаст. Попробуйте позже.", "error");
        }
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
                                initialTitle={MOCK_PODCAST.title}
                                initialDescription={MOCK_PODCAST.description}
                                initialCategoryId={MOCK_PODCAST.categoryId}
                                initialCoverUrl={MOCK_PODCAST.coverUrl}
                                categories={CATEGORIES}
                                loading={loading}
                                onSave={handleSave}
                                onDelete={handleDelete}
                                onCancel={() => navigate(-1)}
                            />
                        </div>
                    </div>

                    <div className={styles.rightBlock}>
                        <PodcastPublishStatus status="published" />
                    </div>

                </div>

            </div>
        </div>
    );
};

export default EditPodcastPage;