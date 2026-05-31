import React, { useEffect, useRef, useState } from "react";
import styles from "./SelectField.module.css";

interface SelectOption {
    id: string;
    label: string;
}

interface SelectFieldProps {
    label: string;
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({
    label,
    options,
    value,
    onChange,
    placeholder = "Выберите...",
    error,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement | null>(null);

    const selectedOption = options.find((o) => o.id === value);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (id: string) => {
        onChange(id);
        setIsOpen(false);
    };

    return (
        <div className={styles.field}>
            <label className={styles.label}>{label}</label>

            <div
                ref={wrapRef}
                className={`${styles.selectWrap} ${error ? styles.selectError : ""} ${isOpen ? styles.selectOpen : ""}`}
            >
                <button
                    type="button"
                    className={styles.trigger}
                    onClick={() => setIsOpen((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    <span className={selectedOption ? styles.triggerValue : styles.triggerPlaceholder}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <span className={`${styles.arrow} ${isOpen ? styles.arrowUp : ""}`} />
                </button>

                {isOpen && (
                    <ul className={styles.dropdown} role="listbox">
                        {options.map((option) => (
                            <li
                                key={option.id}
                                role="option"
                                aria-selected={option.id === value}
                                className={`${styles.option} ${option.id === value ? styles.optionSelected : ""}`}
                                onClick={() => handleSelect(option.id)}
                            >
                                {option.label}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {error && <p className={styles.errorText}>{error}</p>}
        </div>
    );
};

export default SelectField;