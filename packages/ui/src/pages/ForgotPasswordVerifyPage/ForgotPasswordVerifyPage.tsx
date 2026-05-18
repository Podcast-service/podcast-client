import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import StepProgress from "../../components/StepProgress/StepProgress";
import OtpCodeInput from "../../components/OtpCodeInput/OtpCodeInput";
import styles from "./ForgotPasswordVerifyPage.module.css";
import MailIcon from "../../assets/icons/mail.svg";
import LogoSvg from "../../assets/icons/logo.svg";
import { requestPasswordReset } from "../../api/auth";

const INITIAL_TIMER = 60;

const ForgotPasswordVerifyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_TIMER);
  const [isCodeError, setIsCodeError] = useState(false);
  const [isShakeActive, setIsShakeActive] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const userEmail = location.state?.email || "you@example.com";

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  useEffect(() => {
    if (!isShakeActive) return;
    const timeout = window.setTimeout(() => setIsShakeActive(false), 250);
    return () => window.clearTimeout(timeout);
  }, [isShakeActive]);

  const triggerShake = () => {
    setIsShakeActive(false);
    requestAnimationFrame(() => setIsShakeActive(true));
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (isCodeError) setIsCodeError(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length < 6) {
      setIsCodeError(true);
      triggerShake();
      return;
    }

    navigate("/forgotpassword/reset", {
      state: { email: userEmail, code },
    });
  };

  const handleResendCode = async () => {
    if (secondsLeft > 0 || isResending) return;

    setIsResending(true);
    try {
      await requestPasswordReset(userEmail);
    } catch {

    } finally {
      setIsResending(false);
      setSecondsLeft(INITIAL_TIMER);
      setCode("");
      setIsCodeError(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <main className={styles.main}>
      <div className={`container ${styles.pageContainer}`}>
        <div className={styles.mainWrap}>
          <section className={styles.leftPart}>
            <h1 className={styles.title}>
              <span className={styles.titleMain}>Введите </span>
              <span className={styles.titleAccent}>код.</span>
            </h1>
          </section>

          <section className={styles.rightPart}>
            <div className={styles.tabletLogo}>
              <img src={LogoSvg} alt="Podcast" />
            </div>

            <div className={styles.progressWrap}>
              <StepProgress totalSteps={3} currentStep={2} />
            </div>

            <h2 className={styles.formTitle}>Введите код</h2>
            <p className={styles.formSubtitle}>
              Мы отправили 6-значный код вам на почту
            </p>

            <div className={styles.infoBox}>
              <img src={MailIcon} alt="Почта" className={styles.infoIcon} />
              <div className={styles.infoText}>
                <span className={styles.infoLabel}>Отправлено на:</span>
                <span className={styles.infoEmail}>{userEmail}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div
                className={`${styles.codeWrap} ${
                  isCodeError ? styles.codeWrapError : ""
                } ${isShakeActive ? styles.codeWrapShake : ""}`}
              >
                <OtpCodeInput value={code} onChange={handleCodeChange} />
              </div>

              <div className={styles.confirmButton}>
                <Button type="submit" variant="primary">
                  Подтвердить
                </Button>
              </div>

              <div className={styles.backButton}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate("/forgotpassword")}
                >
                  Назад
                </Button>
              </div>
            </form>

            <div className={styles.resendBlock}>
              <span className={styles.resendText}>Не получили письмо?</span>{" "}
              {secondsLeft > 0 ? (
                <span className={styles.resendTimerText}>
                  Отправить повторно через {formatTime(secondsLeft)}
                </span>
              ) : (
                <button
                  type="button"
                  className={styles.resendButton}
                  onClick={handleResendCode}
                  disabled={isResending}
                >
                  {isResending ? "Отправляем..." : "Отправить код повторно"}
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default ForgotPasswordVerifyPage;