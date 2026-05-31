import React, { useRef, useState } from "react";
import styles from "./TextUploadBlock.module.css";

import AddCoverSvg from "../../assets/icons/addCover.svg";
import CirclePlusSvg from "../../assets/icons/circlePlus.svg";
import CloseSvg from "../../assets/icons/close.svg";
import SelectField from "../SelectField/SelectField";


interface TextBlock {
    id: string;
    speakerId: string;
    text: string;
}

export interface TextUploadBlockProps {
    speakersCount: number;
    publishStatus: "draft" | "processing" | "ready" | "published" | "error";
    onCoverChange?: (file: File) => void;
    onGenerate: (data: {
        speakers: string[];
        blocks: { speakerId: string; text: string }[];
        coverFile: File | null;
    }) => void;
    onPublish: () => void;
    onCancel: () => void;
}


const makeBlock = (): TextBlock => ({
    id: crypto.randomUUID(),
    speakerId: "",
    text: "",
});


const TextUploadBlock: React.FC<TextUploadBlockProps> = ({
    speakersCount,
    publishStatus,
    onCoverChange,
    onGenerate,
    onPublish,
    onCancel,
}) => {
    const coverInputRef = useRef<HTMLInputElement | null>(null);

    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);

    const [speakerNames, setSpeakerNames] = useState<string[]>(
        Array.from({ length: speakersCount }, () => "")
    );

    const [textBlocks, setTextBlocks] = useState<TextBlock[]>([
        makeBlock(),
        makeBlock(),
    ]);


    const isProcessing = publishStatus === "processing";
    const canPublish   = publishStatus === "ready";

    const canGenerate =
        (publishStatus === "draft" || publishStatus === "error") &&
        textBlocks.some((b) => b.speakerId !== "" && b.text.trim() !== "");

    const speakerOptions = speakerNames.map((name, index) => ({
        id: String(index),
        label: name.trim() || `Спикер №${index + 1}`,
    }));


    const handleCoverClick = () => coverInputRef.current?.click();

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCoverPreview(URL.createObjectURL(file));
        setCoverFile(file);
        onCoverChange?.(file);
        e.target.value = "";
    };


    const handleSpeakerNameChange = (index: number, value: string) => {
        const updated = [...speakerNames];
        updated[index] = value;
        setSpeakerNames(updated);
    };


    const handleBlockSpeakerChange = (id: string, speakerId: string) => {
        setTextBlocks((prev) =>
            prev.map((b) => (b.id === id ? { ...b, speakerId } : b))
        );
    };

    const handleBlockTextChange = (id: string, text: string) => {
        setTextBlocks((prev) =>
            prev.map((b) => (b.id === id ? { ...b, text } : b))
        );
    };

    const handleAddBlock = () => {
        setTextBlocks((prev) => [...prev, makeBlock()]);
    };

    const handleRemoveBlock = (id: string) => {
        setTextBlocks((prev) => prev.filter((b) => b.id !== id));
    };


    const handleGenerate = () => {
        if (!canGenerate) return;
        onGenerate({
            speakers: speakerNames,
            blocks: textBlocks.map((b) => ({
                speakerId: b.speakerId,
                text: b.text,
            })),
            coverFile,
        });
    };


    return (
        <div className={styles.block}>

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
                            <img
                                src={coverPreview}
                                alt="Обложка"
                                className={styles.coverPreview}
                            />
                        ) : (
                            <div className={styles.coverPlaceholder}>
                                <img
                                    src={AddCoverSvg}
                                    alt=""
                                    aria-hidden="true"
                                    className={styles.coverIcon}
                                />
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

                <div className={styles.speakersSection}>
                    <p className={styles.sectionLabel}>
                        Спикеры (до 4-х человек):
                    </p>
                    <div className={styles.speakerInputs}>
                        {speakerNames.map((name, index) => (
                            <div key={index} className={styles.speakerInputWrap}>
                                <p className={styles.speakerInputLabel}>
                                    Спикер №{index + 1}
                                </p>
                                <div className={styles.inputWrap}>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="Иван"
                                        value={name}
                                        onChange={(e) =>
                                            handleSpeakerNameChange(index, e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            <div className={styles.textBlocksSection}>
                <p className={styles.sectionLabel}>Текст*</p>

                <div className={styles.textBlocks}>
                    {textBlocks.map((block) => (
                        <div key={block.id} className={styles.textBlock}>

                            {textBlocks.length > 1 && (
                                <button
                                    type="button"
                                    className={styles.removeBlockBtn}
                                    onClick={() => handleRemoveBlock(block.id)}
                                    aria-label="Удалить блок"
                                >
                                    <img
                                        src={CloseSvg}
                                        alt=""
                                        aria-hidden="true"
                                        className={styles.removeBlockIcon}
                                    />
                                </button>
                            )}

                            <SelectField
                                label="Спикер*"
                                options={speakerOptions}
                                value={block.speakerId}
                                onChange={(val) =>
                                    handleBlockSpeakerChange(block.id, val)
                                }
                                placeholder="Выбрать спикера"
                            />

                            <div className={styles.textareaFieldWrap}>
                                <label className={styles.textareaLabel}>Текст*</label>
                                <div className={styles.textareaWrap}>
                                    <textarea
                                        className={styles.textarea}
                                        placeholder="текст......"
                                        value={block.text}
                                        rows={3}
                                        onChange={(e) =>
                                            handleBlockTextChange(block.id, e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    className={styles.addBlockBtn}
                    onClick={handleAddBlock}
                >
                    <img
                        src={CirclePlusSvg}
                        alt=""
                        aria-hidden="true"
                        className={styles.addBlockIcon}
                    />
                    <span>добавить блок текста</span>
                </button>
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
                    className={`${styles.btnGenerate} ${
                        isProcessing ? styles.btnGenerateLoading : ""
                    }`}
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                >
                    {isProcessing ? "Генерация..." : "Генерация подкаста"}
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

export default TextUploadBlock;