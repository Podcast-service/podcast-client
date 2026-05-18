import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import InputField from "../../components/InputField/InputField";
import styles from "./LoginPage.module.css";
import LogoSvg from "../../assets/icons/logo.svg";
import { login, saveTokens } from "../../api/auth";

const LoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (authError) setAuthError("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (authError) setAuthError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setAuthError("Введите почту и пароль");
      return;
    }

    setIsLoading(true);
    setAuthError("");

    try {
      const tokens = await login(email.trim(), password);
      console.log("tokens:", tokens);
      saveTokens(tokens);
      console.log("saved!");
      navigate("/");
    } catch (err: any) {
      if (err.status === 403 && err.error === "email_not_verified") {
        navigate("/verify-email", { state: { email: email.trim() } });
      } else if (err.status === 401) {
        setAuthError("Неверная почта или пароль");
      } else {
        setAuthError("Что-то пошло не так. Попробуйте позже");
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
            <h1 className={styles.title}>С возвращением!</h1>

            <p className={styles.description}>
              <span>Подкасты ждут вас!</span>
              <span>
                Войдите и продолжайте создавать контент, который слушают.
              </span>
            </p>
          </section>

          <section className={styles.rightPart}>
            <div className={styles.tabletLogo}>
              <img src={LogoSvg} alt="Podcast" />
            </div>
            <h2 className={styles.formTitle}>Войти в аккаунт</h2>
            <p className={styles.formSubtitle}>Введите свои данные для входа</p>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <InputField
                label="Электронная почта"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Введите почту"
              />

              <InputField
                label="Пароль"
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Введите пароль"
              />

              {authError && (
                <span className={styles.authErrorText}>{authError}</span>
              )}

              <div className={styles.submitButton}>
                <Button type="submit" variant="primary" loading={isLoading}>
                  Войти
                </Button>
              </div>
            </form>

            <div className={styles.formFooter}>
              <div className={styles.register}>
                <span>У вас нет аккаунта? </span>
                <Link to="/register" className={styles.link}>
                  Зарегистрироваться
                </Link>
              </div>

              <div className={styles.forgotAccess}>
                <Link to="/forgotpassword" className={styles.forgotLink}>
                  Не получается войти?
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;