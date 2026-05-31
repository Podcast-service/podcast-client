import React, { useRef, useState } from "react";
import styles from "./AudioUploadBlock.module.css";

import AddCoverSvg from "../../assets/icons/addCover.svg";
import CircleMPSvg from "../../assets/icons/circleMP.svg";

interface AudioUploadBlockProps {
    publishStatus: "draft" | "processing" | "ready" | "published" | "error";
    onAudioChange: (file: File) => void;
    onCoverChange?: (file: File) => void;
    onPublish: () => void;
    onCancel: () => void;
}

const AudioUploadBlock: React.FC<AudioUploadBlockProps> = ({
    publishStatus,
    onAudioChange,
    onCoverChange,
    onPublish,
    onCancel,
}) => {
    const audioInputRef = useRef<HTMLInputElement | null>(null);
    const coverInputRef = useRef<HTMLInputElement | null>(null);

    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [audioFileName, setAudioFileName] = useState<string | null>(null);

    const canPublish = publishStatus === "ready";

    const handleCoverClick = () => coverInputRef.current?.click();

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setCoverPreview(url);
        onCoverChange?.(file);
    };

    const handleAudioClick = () => audioInputRef.current?.click();

    const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAudioFileName(file.name);
        onAudioChange(file);
    };

    return (
        <div className={styles.block}>

            <div className={styles.section}>
                <p className={styles.sectionLabel}>Обложка</p>

                <button
                    type="button"
                    className={styles.coverBtn}
                    onClick={handleCoverClick}
                    aria-label="Загрузить обложку"
                >
                    {coverPreview ? (
                        <img src={coverPreview} alt="Обложка" className={styles.coverPreview} />
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

            <div className={styles.section}>
                <p className={styles.sectionLabel}>Аудиофайл*</p>

                <div className={styles.audioField} onClick={handleAudioClick}>
                    <img src={CircleMPSvg} alt="" aria-hidden="true" className={styles.audioIcon} />

                    <div className={styles.audioInfo}>
                        <p className={styles.audioTitle}>
                            {audioFileName ?? "Загрузите аудиофайл"}
                        </p>
                        <p className={styles.audioHint}>MP3, WAV, OGG, FLAC, OPUS, M4A, AAC до 50 MB</p>
                    </div>

                    <button
                        type="button"
                        className={styles.chooseBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            audioInputRef.current?.click();
                        }}
                    >
                        Выбрать файл
                    </button>
                </div>

                <input
                    ref={audioInputRef}
                    type="file"
                    accept=".mp3,.wav,.ogg,.flac,.opus,.m4a,.aac,audio/mpeg,audio/wav,audio/ogg,audio/flac,audio/aac"
                    className={styles.hiddenInput}
                    onChange={handleAudioChange}
                />
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
                    className={styles.btnPublish}
                    onClick={onPublish}
                    disabled={!canPublish}
                >
                    Опубликовать
                </button>
            </div>

        </div>
    );
};

export default AudioUploadBlock;
