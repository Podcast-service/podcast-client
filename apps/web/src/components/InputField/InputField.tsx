import React, { useState } from "react";
import styles from './InputField.module.css';
import eyeOpen from '../../assets/icons/eyeOpen.svg';
import eyeClosed from '../../assets/icons/eyeClose.svg';
import { Link } from "react-router-dom";

interface InputFieldProps {
    label: string;
    type?: 'text' | 'email' | 'password';
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    error?: string;
    showForgotLink?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
    label,
    type='text',
    value,
    onChange,
    placeholder,
    error,
    showForgotLink = false
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const togglePassword = () => {
        setShowPassword(!showPassword);
    }

    return (
       <div className={styles.field}>
            <label className={styles.label}>{label}</label>

            <div className={`${styles.inputWrapper} ${error ? styles.error : ''}`}>
                <input
                    type={inputType}
                    value={value}
                    onChange={onChange}
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
                        {showPassword ? (
                            <img src={eyeClosed} alt="Скрыть пароль"/>
                        ) : (
                            <img src={eyeOpen} alt="Показать пароль"/>
                        )}
                    </button>
                )}
            </div>

            <div className={styles.bottomRow}>
                <div className={styles.errorMessage}>
                    {error && <span>{error}</span>}
                </div>
                {showForgotLink && isPassword && (
                    <Link to="/forgotpassword" className={styles.forgotlink}>Забыли пароль?</Link>
                )}
            </div>
       </div>
    )
}

export default InputField;