import React, { useId } from "react";
import styles from "./TextareaField.module.css";

interface TextareaFieldProps {
    label: string;
    name?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onBlur?: () => void;
    onFocus?: () => void;
    placeholder?: string;
    hint?: string;
    error?: string;
    maxLength?: number;
    rows?: number;
    labelClassName?: string;
}

const TextareaField: React.FC<TextareaFieldProps> = ({
    label,
    name,
    value,
    onChange,
    onBlur,
    onFocus,
    placeholder,
    hint,
    error,
    maxLength,
    rows = 4,
    labelClassName,
}) => {
    const textareaId = useId();

    return (
        <div className={styles.field}>
            <label htmlFor={textareaId} className={`${styles.label} ${labelClassName ?? ""}`}>
                {label}
            </label>

            {hint && <p className={styles.hint}>{hint}</p>}

            <div className={`${styles.textareaWrapper} ${error ? styles.error : ""}`}>
                <textarea
                    id={textareaId}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    onFocus={onFocus}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    rows={rows}
                    className={styles.textarea}
                />
            </div>

            <div className={styles.bottomRow}>
                <div className={styles.errorMessage}>
                    {error && <span>{error}</span>}
                </div>

                {maxLength && (
                    <span className={styles.counter}>
                        {value.length} / {maxLength}
                    </span>
                )}
            </div>
        </div>
    );
};

export default TextareaField;