import React, { useId } from "react";
import styles from "./CheckboxField.module.css";

interface CheckboxFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: boolean;
  children: React.ReactNode;
}

const CheckboxField: React.FC<CheckboxFieldProps> = ({
  checked,
  onChange,
  error = false,
  children,
}) => {
  const inputId = useId();

  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={styles.label}>
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={styles.input}
        />

        <span
          className={`${styles.box} ${
            checked ? styles.checked : ""
            } ${error ? styles.error : ""} ${error ? styles.shake : ""}`}
          aria-hidden="true"
        />

        <span className={styles.text}>{children}</span>
      </label>
    </div>
  );
};

export default CheckboxField;