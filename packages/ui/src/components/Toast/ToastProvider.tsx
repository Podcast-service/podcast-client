import React, { useCallback, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { ToastContext } from "./useToast";
import type { ToastType } from "./useToast";
import styles from "./Toast.module.css";
import checkIcon from "../../assets/icons/checkCircle.svg";
import errorIcon from "../../assets/icons/errorCircle.svg";

interface ToastItem {
    id: number;
    message: string;
    type: ToastType;
    exiting: boolean;
}

const TOAST_DURATION = 4500;
const EXIT_DURATION = 300;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const counterRef = useRef(0);

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = ++counterRef.current;

        setToasts((prev) => [...prev, { id, message, type, exiting: false }]);

        setTimeout(() => {
            setToasts((prev) =>
                prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
            );
        }, TOAST_DURATION);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, TOAST_DURATION + EXIT_DURATION);
    }, []);

    const portal = ReactDOM.createPortal(
        <div className={styles.container} aria-live="polite" aria-atomic="false">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`${styles.toast} ${styles[toast.type]} ${toast.exiting ? styles.exiting : ""}`}
                    role="status"
                >
                    <img
                        src={toast.type === "success" ? checkIcon : errorIcon}
                        alt=""
                        aria-hidden="true"
                        className={styles.icon}
                    />
                    <span className={styles.message}>{toast.message}</span>
                </div>
            ))}
        </div>,
        document.body
    );

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {portal}
        </ToastContext.Provider>
    );
};