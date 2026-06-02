import React, { useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import InputField from "../../components/InputField/InputField";
import StepProgress from "../../components/StepProgress/StepProgress";
import styles from "./ForgotPasswordResetPage.module.css";
import LogoSvg from "../../assets/icons/logo.svg";
import { confirmPasswordReset } from "../../api/auth";

const cyrillicRegex = /[А-Яа-яЁё]/;

const ForgotPasswordResetPage = () => {
  usePageTitle("Новый пароль");
  const navigate = useNavigate();
  const location = useLocation();

  const userEmail = location.state?.email || "";
  const resetCode = location.state?.code || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "Введите пароль";
    if (trimmed.length < 8) return "Пароль должен содержать минимум 8 символов";
    if (cyrillicRegex.test(trimmed))
      return "Пароль не должен содержать кириллицу";
    return "";
  };

  const validateConfirmPassword = (value: string, original: string): string => {
    if (!value.trim()) return "Подтвердите пароль";
    if (value !== original) return "Пароли не совпадают";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextPasswordError = validatePassword(password);
    const nextConfirmError = validateConfirmPassword(confirmPassword, password);

    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmError);
    setIsPasswordFocused(false);
    setIsConfirmPasswordFocused(false);

    if (nextPasswordError || nextConfirmError) return;

    setIsLoading(true);

    try {
      await confirmPasswordReset(userEmail, resetCode, password);
      navigate("/login");
    } catch (err: any) {
      if (err.status === 400 || err.status === 422) {
        navigate("/forgotpassword/verify", {
          state: { email: userEmail, codeError: true },
        });
      } else {
        setPasswordError("Что-то пошло не так. Попробуйте позже");
      }
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
              <span className={styles.titleMain}>Новый </span>
              <span className={styles.titleAccent}>пароль.</span>
            </h1>
            <p className={styles.description}>Придумайте надежный пароль.</p>
          </section>

          <section className={styles.rightPart}>
            <div className={styles.tabletLogo}>
              <img src={LogoSvg} alt="Podcast" />
            </div>

            <div className={styles.progressWrap}>
              <StepProgress totalSteps={3} currentStep={3} />
            </div>

            <h2 className={styles.formTitle}>Придумайте пароль</h2>
            <p className={styles.formSubtitle}>Минимум 8 символов</p>

            <div className={styles.divider} />

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <InputField
                label="Новый пароль"
                type="password"
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => {
                  setIsPasswordFocused(false);
                  setPasswordError(validatePassword(password));
                }}
                placeholder="Минимум 8 символов"
                error={isPasswordFocused ? "" : passwordError}
              />

              <InputField
                label="Подтвердите пароль"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) setConfirmPasswordError("");
                }}
                onFocus={() => setIsConfirmPasswordFocused(true)}
                onBlur={() => {
                  setIsConfirmPasswordFocused(false);
                  setConfirmPasswordError(
                    validateConfirmPassword(confirmPassword, password)
                  );
                }}
                placeholder="Минимум 8 символов"
                error={isConfirmPasswordFocused ? "" : confirmPasswordError}
              />

              <div className={styles.submitButton}>
                <Button type="submit" variant="primary" loading={isLoading}>
                  Подтвердить
                </Button>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  navigate("/forgotpassword/verify", {
                    state: { email: userEmail },
                  })
                }
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

export default ForgotPasswordResetPage;