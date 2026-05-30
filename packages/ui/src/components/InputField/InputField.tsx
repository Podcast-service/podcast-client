import React, { useId, useState } from "react";
import styles from "./InputField.module.css";
import eyeOpen from "../../assets/icons/eyeOpen.svg";
import eyeClosed from "../../assets/icons/eyeClose.svg";

interface InputFieldProps {
    label: string;
    hint?: string;
    labelClassName?: string;
    type?: "text" | "email" | "password";
    name?: string;
    autoComplete?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: () => void;
    onFocus?: () => void;
    placeholder?: string;
    error?: string;
}

const InputField: React.FC<InputFieldProps> = ({
    label,
    hint,
    labelClassName,
    type = "text",
    name,
    autoComplete,
    value,
    onChange,
    onBlur,
    onFocus,
    placeholder,
    error,
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = useId();

    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    const togglePassword = () => setShowPassword(!showPassword);

    return (
        <div className={styles.field}>
            <label htmlFor={inputId} className={`${styles.label} ${labelClassName ?? ""}`}>
                {label}
            </label>
            {hint && <p className={styles.hint}>{hint}</p>}
            <div className={`${styles.inputWrapper} ${error ? styles.error : ""}`}>
                <input
                    id={inputId}
                    name={name}
                    autoComplete={autoComplete}
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    onFocus={onFocus}
                    placeholder={placeholder}
                    className={styles.input}
                />

                {isPassword && (
                    <button
                        type="button"
                        className={styles.eyeButton}
                        onClick={togglePassword}
                        tabIndex={-1}
                    >
                        <img
                            src={showPassword ? eyeClosed : eyeOpen}
                            alt={showPassword ? "Скрыть пароль" : "Показать пароль"}
                        />
                    </button>
                )}
            </div>

            <div className={styles.bottomRow}>
                <div className={styles.errorMessage}>
                    {error && <span>{error}</span>}
                </div>
            </div>
        </div>
    );
};

export default InputField;