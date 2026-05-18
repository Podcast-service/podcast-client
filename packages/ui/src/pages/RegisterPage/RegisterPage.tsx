import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import InputField from "../../components/InputField/InputField";
import StepProgress from "../../components/StepProgress/StepProgress";
import CheckboxField from "../../components/CheckboxField/CheckboxField";
import styles from "./RegisterPage.module.css";
import LogoSvg from "../../assets/icons/logo.svg";
import { register } from "../../api/auth";

const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const cyrillicRegex = /[А-Яа-яЁё]/;

const RegisterPage = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [checkboxError, setCheckboxError] = useState(false);

  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [serverError, setServerError] = useState("");

  const validateUsername = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "Введите имя пользователя";
    if (trimmed.length < 2) return "Минимум 2 символа";
    return "";
  };

  const validateEmail = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "Введите email";
    if (!emailRegex.test(trimmed))
      return "Введите корректный email в формате you@example.com";
    return "";
  };

  const validatePassword = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "Введите пароль";
    if (trimmed.length < 8) return "Пароль должен содержать минимум 8 символов";
    if (cyrillicRegex.test(trimmed))
      return "Пароль не должен содержать кириллицу";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextUsernameError = validateUsername(username);
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);
    const nextCheckboxError = !accepted;

    setUsernameError(nextUsernameError);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setCheckboxError(nextCheckboxError);
    setIsUsernameFocused(false);
    setIsEmailFocused(false);
    setIsPasswordFocused(false);

    if (
      nextUsernameError ||
      nextEmailError ||
      nextPasswordError ||
      nextCheckboxError
    ) {
      return;
    }

    setIsLoading(true);

    try {
      await register(username.trim(), email.trim(), password);
      navigate("/verify-email", { state: { email: email.trim() } });
    } catch (err: any) {
      if (err.status === 409) {
        setServerError("Имя пользователя или email уже заняты");
      } else {
        setServerError("Что-то пошло не так. Попробуйте позже");
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
            <div className={styles.leftTextGroup}>
              <h5 className={styles.titleBlock}>
                <span className={styles.titleMain}>Один upload.</span>
                <span className={styles.titleAccent}>Все платформы.</span>
              </h5>

              <p className={styles.description}>
                Загрузите один раз — Podcast сам разошлет его на другие
                платформы
              </p>
            </div>
          </section>

          <section className={styles.rightPart}>
            <div className={styles.tabletLogo}>
              <img src={LogoSvg} alt="Podcast" />
            </div>
            <div className={styles.progressWrap}>
              <StepProgress totalSteps={2} currentStep={1} />
            </div>

            <h1 className={styles.formTitle}>Создайте аккаунт</h1>
            <p className={styles.formSubtitle}>
              Заполните данные — это займет меньше минуты
            </p>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <InputField
                label="Имя пользователя"
                type="text"
                name="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (usernameError) setUsernameError("");
                  if (serverError) setServerError("");
                }}
                onFocus={() => setIsUsernameFocused(true)}
                onBlur={() => {
                  setIsUsernameFocused(false);
                  setUsernameError(validateUsername(username));
                }}
                placeholder="Введите имя пользователя"
                error={isUsernameFocused ? "" : usernameError}
              />

              <InputField
                label="Электронная почта"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                  if (serverError) setServerError("");
                }}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => {
                  setIsEmailFocused(false);
                  setEmailError(validateEmail(email));
                }}
                placeholder="Введите почту"
                error={isEmailFocused ? "" : emailError}
              />

              <InputField
                label="Пароль"
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
                placeholder="Введите пароль"
                error={isPasswordFocused ? "" : passwordError}
              />

              <div className={styles.checkboxWrap}>
                <CheckboxField
                  checked={accepted}
                  onChange={(checked) => {
                    setAccepted(checked);
                    if (checked && checkboxError) setCheckboxError(false);
                  }}
                  error={checkboxError}
                >
                  Я согласен с{" "}
                  <Link to="/privacy-policy">Политикой конфиденциальности</Link>{" "}
                  и <Link to="/terms-of-use">Условиями пользования</Link>
                </CheckboxField>
              </div>

              {serverError && (
                <span className={styles.serverError}>{serverError}</span>
              )}

              <div className={styles.submitButton}>
                <Button type="submit" variant="primary" loading={isLoading}>
                  Зарегистрироваться
                </Button>
              </div>
            </form>

            <div className={styles.loginBlock}>
              <span className={styles.loginText}>У вас уже есть аккаунт?</span>
              <Link to="/login" className={styles.loginLink}>
                Войти
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;