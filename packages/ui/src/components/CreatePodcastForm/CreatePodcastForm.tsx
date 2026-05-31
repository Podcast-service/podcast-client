import React, { useState } from "react";
import styles from "./CreatePodcastForm.module.css";
import SelectField from "../SelectField/SelectField";


type FileType = "audio" | "text";

interface Category {
    id: string;
    label: string;
}

interface CreatePodcastFormProps {
    categories: Category[];
    onSave: (data: {
        title: string;
        description: string;
        categoryId: string;
        speakersCount: number;
        fileType: FileType;
    }) => void;
    onCancel: () => void;
    loading?: boolean;
}


const CreatePodcastForm: React.FC<CreatePodcastFormProps> = ({
    categories,
    onSave,
    onCancel,
    loading = false,
}) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [speakersCount, setSpeakersCount] = useState<string>("");
    const [fileType, setFileType] = useState<FileType | null>(null);

    const [titleError, setTitleError] = useState("");
    const [descriptionError, setDescriptionError] = useState("");
    const [speakersError, setSpeakersError] = useState("");


    const validateTitle = (value: string): string => {
        if (!value.trim()) return "Название обязательно";
        if (value.length < 2) return "Минимум 2 символа";
        return "";
    };

    const validateDescription = (value: string): string => {
        if (!value.trim()) return "Описание обязательно";
        if (value.length > 1000) return "Максимум 1000 символов";
        return "";
    };

    const validateSpeakers = (value: string, type: FileType | null): string => {
        if (!value) return "Укажите количество спикеров";
        const num = parseInt(value);
        if (isNaN(num) || num < 1) return "Минимум 1 спикер";
        if (type === "text" && num > 4) return "Максимум 4 спикера для текстового файла";
        return "";
    };


    const isFormFilled =
        title.trim().length >= 2 &&
        description.trim().length > 0 &&
        description.length <= 1000 &&
        categoryId !== "" &&
        speakersCount !== "" &&
        parseInt(speakersCount) >= 1 &&
        (fileType !== "text" || parseInt(speakersCount) <= 4) &&
        fileType !== null;


    const handleSpeakersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, "");
        setSpeakersCount(val);
        if (speakersError) setSpeakersError("");
    };

    const handleFileTypeChange = (type: FileType) => {
        setFileType(type);
        if (speakersError) setSpeakersError("");
        if (type === "text" && parseInt(speakersCount) > 4) {
            setSpeakersCount("4");
        }
    };

    const handleSave = () => {
        const titleErr = validateTitle(title);
        const descErr = validateDescription(description);
        const speakersErr = validateSpeakers(speakersCount, fileType);

        setTitleError(titleErr);
        setDescriptionError(descErr);
        setSpeakersError(speakersErr);

        if (titleErr || descErr || speakersErr || !categoryId || !fileType) return;

        onSave({
            title,
            description,
            categoryId,
            speakersCount: parseInt(speakersCount),
            fileType: fileType!,
        });
    };


    return (
        <div className={styles.form}>

            <div className={styles.fieldWrap}>
                <label className={styles.label}>Название подкаста *</label>
                <div className={`${styles.inputWrap} ${titleError ? styles.inputError : ""}`}>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="Введите название"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            if (titleError) setTitleError("");
                        }}
                    />
                </div>
                {titleError && <p className={styles.errorText}>{titleError}</p>}
            </div>

            <div className={styles.fieldWrap}>
                <div className={styles.labelRow}>
                    <label className={styles.label}>Описание *</label>
                    <span className={styles.counter}>{description.length}/1000</span>
                </div>
                <div className={`${styles.textareaWrap} ${descriptionError ? styles.inputError : ""}`}>
                    <textarea
                        className={styles.textarea}
                        placeholder="Расскажите о чем ваш подкаст"
                        value={description}
                        maxLength={1000}
                        rows={4}
                        onChange={(e) => {
                            setDescription(e.target.value);
                            if (descriptionError) setDescriptionError("");
                        }}
                    />
                </div>
                {descriptionError && <p className={styles.errorText}>{descriptionError}</p>}
            </div>

            <div className={styles.rowDouble}>

                <SelectField
                    label="Категория *"
                    options={categories}
                    value={categoryId}
                    onChange={setCategoryId}
                    placeholder="Выберите категорию"
                />

                <div className={styles.fieldWrap}>
                    <label className={styles.label}>
                        Количество спикеров *
                        {fileType === "text" && (
                            <span className={styles.labelHint}> (макс. 4)</span>
                        )}
                    </label>
                    <div className={`${styles.inputWrap} ${speakersError ? styles.inputError : ""}`}>
                        <input
                            type="text"
                            inputMode="numeric"
                            className={styles.input}
                            placeholder="Например: 2"
                            value={speakersCount}
                            onChange={handleSpeakersChange}
                        />
                    </div>
                    {speakersError && <p className={styles.errorText}>{speakersError}</p>}
                </div>
            </div>

            <div className={styles.fieldWrap}>
                <label className={styles.label}>Какой тип файла вы планируете загружать? *</label>
                <div className={styles.fileTypeToggle}>
                    <button
                        type="button"
                        className={`${styles.fileTypeBtn} ${fileType === "audio" ? styles.fileTypeBtnActive : ""}`}
                        onClick={() => handleFileTypeChange("audio")}
                    >
                        Аудиофайл
                    </button>
                    <button
                        type="button"
                        className={`${styles.fileTypeBtn} ${fileType === "text" ? styles.fileTypeBtnActive : ""}`}
                        onClick={() => handleFileTypeChange("text")}
                    >
                        Текстовый файл
                    </button>
                </div>
            </div>

            <div className={styles.actions}>
                <button
                    type="button"
                    className={styles.btnCancel}
                    onClick={onCancel}
                >
                    Отмена
                </button>

                <button
                    type="button"
                    className={styles.btnSave}
                    onClick={handleSave}
                    disabled={!isFormFilled || loading}
                >
                    {loading ? "Сохраняем..." : "Сохранить"}
                </button>
            </div>

        </div>
    );
};

export default CreatePodcastForm;