import React, { useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import InputField from "../../components/InputField/InputField";
import StepProgress from "../../components/StepProgress/StepProgress";
import styles from "./ForgotPasswordPage.module.css";
import LogoSvg from "../../assets/icons/logo.svg";
import { requestPasswordReset } from "../../api/auth";

const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const ForgotPasswordPage = () => {
  usePageTitle("Восстановление пароля");
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "Введите электронную почту";
    if (!emailRegex.test(trimmed))
      return "Введите корректный email в формате you@example.com";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextEmailError = validateEmail(email);
    setEmailError(nextEmailError);
    setIsEmailFocused(false);
    if (nextEmailError) return;

    setIsLoading(true);

    try {
      await requestPasswordReset(email.trim());
      navigate("/forgotpassword/verify", { state: { email: email.trim() } });
    } catch {
      setEmailError("Что-то пошло не так. Попробуйте позже");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={`container ${styles.pageContainer}`}>
        <div className={styles.mainWrap}>
          <section className={styles.leftPart}>
            <h1 className={styles.title}>
              <span className={styles.titleMain}>Забыли </span>
              <span className={styles.titleAccent}>пароль?</span>
            </h1>
            <p className={styles.description}>
              Не страшно - бывает с каждым.{" "}
              Введите вашу почту и мы пришлем код для сброса пароля.
            </p>
          </section>

          <section className={styles.rightPart}>
            <div className={styles.tabletLogo}>
              <img src={LogoSvg} alt="Podcast" />
            </div>

            <div className={styles.progressWrap}>
              <StepProgress totalSteps={3} currentStep={1} />
            </div>

            <h2 className={styles.formTitle}>Сброс пароля</h2>
            <p className={styles.formSubtitle}>
              Введите вашу почту - пришлем код для сброса
            </p>

            <div className={styles.divider} />

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <InputField
                label="Электронная почта"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => {
                  setIsEmailFocused(false);
                  setEmailError(validateEmail(email));
                }}
                placeholder="you@example.com"
                error={isEmailFocused ? "" : emailError}
              />

              <div className={styles.submitButton}>
                <Button type="submit" variant="primary" loading={isLoading}>
                  Получить код
                </Button>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/login")}
              >
                Назад
              </Button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
};

export default ForgotPasswordPage;