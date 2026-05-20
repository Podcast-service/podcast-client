import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import StepProgress from "../../components/StepProgress/StepProgress";
import OtpCodeInput from "../../components/OtpCodeInput/OtpCodeInput";
import styles from "./VerifyEmailPage.module.css";
import MailIcon from "../../assets/icons/mail.svg";
import LogoSvg from "../../assets/icons/logo.svg";
import { verifyEmail, resendVerification, saveTokens } from "../../api/auth";

const INITIAL_TIMER = 60;

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_TIMER);
  const [isCodeError, setIsCodeError] = useState(false);
  const [isShakeActive, setIsShakeActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const userEmail = location.state?.email;

  useEffect(() => {
    if (!userEmail) navigate("/register");
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length < 6) {
      setIsCodeError(true);
      triggerShake();
      return;
    }

    setIsLoading(true);

    try {
      const tokens = await verifyEmail(userEmail, code);
      saveTokens(tokens);
      navigate("/login");
    } catch (err: any) {
      setIsCodeError(true);
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate("/register");
  };

  const handleResendCode = async () => {
    if (secondsLeft > 0 || isResending) return;

    setIsResending(true);
    try {
      await resendVerification(userEmail);
    } catch {
      
    } finally {
      setIsResending(false);
      setSecondsLeft(INITIAL_TIMER);
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
          <div className={styles.leftPart}>
            <div className={styles.leftWrap}>
              <div className={styles.leftTextGroup}>
                <h5 className={styles.title}>Почти готово!</h5>
                <p className={styles.description}>
                  Проверьте почту - там кое-что важное от нас.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.rightPart}>
            <div className={styles.tabLogo}>
              <img src={LogoSvg} alt="Podcast" />
            </div>

            <div className={styles.rightWrap}>
              <div className={styles.progressWrap}>
                <StepProgress totalSteps={2} currentStep={2} />
              </div>

              <h2 className={styles.formTitle}>Подтвердите почту</h2>
              <p className={styles.formSubtitle}>
                Мы отправили код вам на почту
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
                  <Button type="submit" variant="primary" loading={isLoading}>
                    Подтвердить
                  </Button>
                </div>

                <div className={styles.backButton}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleBackClick}
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

              <div className={styles.laterBlock}>
                <Link to="/login" className={styles.laterLink}>
                  Подтвердить позже
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default VerifyEmailPage;