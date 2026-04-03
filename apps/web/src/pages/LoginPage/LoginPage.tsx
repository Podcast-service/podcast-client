import React, { useState } from "react";
import Button from "../../components/Button/Button";
import InputField from "../../components/InputField/InputField";
import styles from './LoginPage.module.css';
import { Link } from "react-router-dom";

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const validateEmail = (value: string) => {
        if (!value) return 'Обязательное поле';
        if (!value.includes('@')) return 'Введите корректный email';
        return '';
    }

    const validatePassword = (value: string) => {
        if (!value) return 'Обязательное поле';
        if (value.length < 8) return "Минимум 8 символов";
        return '';
    }

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        setEmailError(validateEmail(value));
    }

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        setPasswordError(validatePassword(value));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault;

        const emailErr = validateEmail(email);
        const passwordErr = validatePassword(password);

        setEmailError(emailErr);
        setPasswordError(passwordErr);

        if (!emailErr && !passwordErr) {
            console.log('Вход успешен');
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.left_part}>
                    <h2 className={styles.title}>С возвращением!</h2>
                    <p className={styles.description}>
                        Подкасты ждут вас!<br />
                        Войдите и продолжайте создавать контент, который слушают.
                    </p>
                </div>

                <div className={styles.right_part}>
                    <form onSubmit={handleSubmit}>
                        <h3 className={styles.formTitle}>Войти в аккаунт</h3>
                        <p className={styles.formSubtitle}>Введите свои данные для входа</p>

                        <InputField 
                            label="Электронная почта"
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="you@example.com"
                            error={emailError}
                        />

                        <InputField 
                            label="Пароль"
                            type="password"
                            value={password}
                            onChange={handlePasswordChange}
                            placeholder="Введите пароль"
                            error={passwordError}
                            showForgotLink={true}
                        />


                        <div className={styles.submitButton}>
                            <Button type="submit" variant="primary">Войти</Button>
                        </div>

                        <div className={styles.register}>
                            <span>У вас нет аккаунта? </span>
                            <Link to="/register" className={styles.link}>Зарегистрироваться</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default LoginPage;

