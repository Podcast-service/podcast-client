import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HeaderLogin, LoginPage, RegisterPage, FooterLogin, VerifyEmailPage, ForgotPasswordPage, ForgotPasswordVerifyPage, ForgotPasswordResetPage } from "@podcast/ui";
import "./styles/global.css";

function Frontend() {
  return (
    <div className="app">
      <div className="desktopHeader">
        <HeaderLogin />
      </div>

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgotpassword" element={<ForgotPasswordPage />} />
        <Route path="/forgotpassword/verify" element={<ForgotPasswordVerifyPage />} />
        <Route path="/forgotpassword/reset" element={<ForgotPasswordResetPage />} />
      </Routes>

      <FooterLogin />
    </div>
  );
}

const rootElement = document.getElementById("root")!;

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <Frontend />
    </BrowserRouter>
  </StrictMode>
);

export default Frontend;