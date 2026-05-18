import React from "react";
import styles from "./StepProgress.module.css";

interface StepProgressProps {
  totalSteps: number;
  currentStep: number;
}

const StepProgress: React.FC<StepProgressProps> = ({
  totalSteps,
  currentStep,
}) => {
  const steps = Array.from({ length: totalSteps }, (_, index) => index + 1);

  return (
    <div
      className={styles.stepProgress}
      aria-label={`Шаг ${currentStep} из ${totalSteps}`}
    >
      {steps.map((step) => (
        <div
          key={step}
          className={`${styles.step} ${
            step === currentStep ? styles.active : styles.inactive
          }`}
        />
      ))}
    </div>
  );
};

export default StepProgress;