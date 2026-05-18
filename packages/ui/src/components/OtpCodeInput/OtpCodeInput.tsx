import React, { useRef } from "react";
import styles from "./OtpCodeInput.module.css";

interface OtpCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}

const OtpCodeInput: React.FC<OtpCodeInputProps> = ({
  value,
  onChange,
  length = 6,
}) => {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const valueArray = Array.from({ length }, (_, index) => value[index] || "");

  const focusInput = (index: number) => {
    if (index >= 0 && index < length) {
      inputsRef.current[index]?.focus();
    }
  };

  const handleChange = (index: number, inputValue: string) => {
    const digit = inputValue.replace(/\D/g, "").slice(-1);

    const nextValueArray = [...valueArray];
    nextValueArray[index] = digit;

    const nextValue = nextValueArray.join("");
    onChange(nextValue);

    if (digit && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace") {
      if (valueArray[index]) {
        const nextValueArray = [...valueArray];
        nextValueArray[index] = "";
        onChange(nextValueArray.join(""));
        return;
      }

      if (index > 0) {
        const nextValueArray = [...valueArray];
        nextValueArray[index - 1] = "";
        onChange(nextValueArray.join(""));
        focusInput(index - 1);
      }
    }

    if (event.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    onChange(pasted);

    const nextIndex = Math.min(pasted.length, length - 1);
    focusInput(nextIndex);
  };

  return (
    <div className={styles.wrapper}>
      {valueArray.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          className={styles.input}
          aria-label={`Цифра ${index + 1} из ${length}`}
        />
      ))}
    </div>
  );
};

export default OtpCodeInput;