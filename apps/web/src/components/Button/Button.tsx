import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary';
    type?: 'button' | 'submit';
    disabled?: boolean;
    loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    children,
    onClick,
    variant = 'primary',
    type = 'button',
    disabled=false,
    loading=false
}) => {
    const isDisabled = disabled || loading;

    return (
        <button
        type={type}
        onClick={isDisabled ? undefined : onClick}
        disabled={isDisabled}
        className={`${styles.button} ${styles[variant]} ${isDisabled ? styles.disabled : ''} ${loading ? styles.loading : ''}`}
        >
            {children}
        </button>
    )
}

export default Button;