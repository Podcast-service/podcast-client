import React, { useRef, useState } from "react";
import styles from "./EditPodcastForm.module.css";

import SelectField from "../SelectField/SelectField";
import ConfirmDeleteModal from "../ConfirmDeleteModal/ConfirmDeleteModal";
import AddCoverSvg from "../../assets/icons/addCover.svg";

interface Category {
    id: string;
    label: string;
}

export interface EditPodcastFormProps {
    initialTitle: string;
    initialDescription: string;
    initialCategoryId: string;
    initialCoverUrl?: string;
    categories: Category[];
    loading?: boolean;
    onSave: (data: {
        title: string;
        description: string;
        categoryId: string;
        coverFile: File | null;
    }) => void;
    onDelete: () => void;
    onCancel: () => void;
}


const EditPodcastForm: React.FC<EditPodcastFormProps> = ({
    initialTitle,
    initialDescription,
    initialCategoryId,
    initialCoverUrl,
    categories,
    loading = false,
    onSave,
    onDelete,
    onCancel,
}) => {
    const coverInputRef = useRef<HTMLInputElement | null>(null);

    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);
    const [categoryId, setCategoryId] = useState(initialCategoryId);
    const [coverPreview, setCoverPreview] = useState<string | null>(initialCoverUrl ?? null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [titleError, setTitleError] = useState("");
    const [categoryError, setCategoryError] = useState("");

    const validateTitle = (value: string): string => {
        if (!value.trim()) return "Название обязательно";
        if (value.trim().length < 2) return "Минимум 2 символа";
        return "";
    };

    const handleCoverClick = () => coverInputRef.current?.click();

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCoverPreview(URL.createObjectURL(file));
        setCoverFile(file);
        e.target.value = "";
    };

    const handleSave = () => {
        const titleErr = validateTitle(title);
        const categoryErr = categoryId ? "" : "Выберите категорию";
        setTitleError(titleErr);
        setCategoryError(categoryErr);
        if (titleErr || categoryErr) return;
        onSave({ title: title.trim(), description, categoryId, coverFile });
    };

    return (
        <>
            <div className={styles.form}>

                <div className={styles.topRow}>

                    <div className={styles.coverSection}>
                        <p className={styles.sectionLabel}>Обложка</p>
                        <button
                            type="button"
                            className={styles.coverBtn}
                            onClick={handleCoverClick}
                            aria-label="Загрузить обложку"
                        >
                            {coverPreview ? (
                                <img src={coverPreview} alt="Обложка подкаста" className={styles.coverPreview} />
                            ) : (
                                <div className={styles.coverPlaceholder}>
                                    <img src={AddCoverSvg} alt="" aria-hidden="true" className={styles.coverIcon} />
                                    <span className={styles.coverHint}>Загрузить обложку</span>
                                </div>
                            )}
                        </button>
                        <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            className={styles.hiddenInput}
                            onChange={handleCoverChange}
                        />
                    </div>

                    <div className={styles.fieldsRight}>

                        <div className={styles.fieldWrap}>
                            <div className={styles.labelRow}>
                                <label className={styles.label}>Название подкаста*</label>
                                <span className={styles.counter}>{title.length}/100</span>
                            </div>
                            <div className={`${styles.inputWrap} ${titleError ? styles.inputError : ""}`}>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={title}
                                    maxLength={100}
                                    placeholder="Введите название"
                                    onChange={(e) => {
                                        setTitle(e.target.value);
                                        if (titleError) setTitleError("");
                                    }}
                                />
                            </div>
                            {titleError && <p className={styles.errorText}>{titleError}</p>}
                        </div>

                        <div className={styles.fieldWrap}>
                            <SelectField
                                label="Категория*"
                                options={categories}
                                value={categoryId}
                                onChange={(val) => {
                                    setCategoryId(val);
                                    if (categoryError) setCategoryError("");
                                }}
                                placeholder="Выберите категорию"
                                error={categoryError}
                            />
                        </div>

                    </div>
                </div>

                <div className={styles.fieldWrap}>
                    <div className={styles.labelRow}>
                        <label className={styles.label}>Описание</label>
                        <span className={styles.counter}>{description.length}/1000</span>
                    </div>
                    <div className={styles.textareaWrap}>
                        <textarea
                            className={styles.textarea}
                            value={description}
                            maxLength={1000}
                            rows={4}
                            placeholder="Расскажите о чём ваш подкаст"
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.actions}>
                    <button type="button" className={styles.btnCancel} onClick={onCancel}>
                        Отмена
                    </button>
                    <button type="button" className={styles.btnDelete} onClick={() => setIsDeleteModalOpen(true)}>
                        Удалить
                    </button>
                    <button type="button" className={styles.btnSave} onClick={handleSave} disabled={loading}>
                        {loading ? "Сохраняем..." : "Сохранить"}
                    </button>
                </div>

            </div>

            {isDeleteModalOpen && (
                <ConfirmDeleteModal
                    onConfirm={() => {
                        setIsDeleteModalOpen(false);
                        onDelete();
                    }}
                    onClose={() => setIsDeleteModalOpen(false)}
                />
            )}
        </>
    );
};

export default EditPodcastForm;