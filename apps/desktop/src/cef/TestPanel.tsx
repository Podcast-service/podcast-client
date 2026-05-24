import { useState } from "react";
import {
  publishToYoutubeMusic,
  type PublishStage,
} from "./publishYoutubeMusic";
import { logoutFromGoogle, type LogoutStage } from "./logoutGoogle";
import { getCurrentGoogleUser, type GoogleUser } from "./getCurrentGoogleUser";

type Stage = PublishStage | LogoutStage;

const STAGE_LABELS: Record<Stage, string> = {
  opening: "Запуск браузера",
  loading: "Загрузка YouTube Music",
  "checking-login": "Проверка авторизации",
  "awaiting-login": "Ожидание входа в Google",
  adding: "Добавление RSS",
  "logging-out": "Выход из Google",
  done: "Готово",
  error: "Ошибка",
};

const STAGE_COLORS: Record<Stage, string> = {
  opening: "#3b82f6",
  loading: "#3b82f6",
  "checking-login": "#3b82f6",
  "awaiting-login": "#f59e0b",
  adding: "#3b82f6",
  "logging-out": "#3b82f6",
  done: "#10b981",
  error: "#ef4444",
};

export function TestPanel() {
  const [rssUrl, setRssUrl] = useState("https://castapp.ru/feed/");
  const [stage, setStage] = useState<Stage | null>(null);
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<GoogleUser | null | undefined>(
    undefined,
  );

  async function handlePublish() {
    if (!rssUrl.trim()) {
      setStage("error");
      setMessage("Введите RSS URL");
      return;
    }
    setRunning(true);
    setResult("");
    setStage(null);
    setMessage("");
    try {
      const res = await publishToYoutubeMusic(rssUrl.trim(), {
        onStage: (s, m) => {
          setStage(s);
          setMessage(m);
        },
      });
      setResult(
        `HTTP ${res.status}${res.toast ? ` — ${res.toast}` : ""}`,
      );
      setCurrentUser(res.user);
    } catch (err) {
      setResult(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  async function handleLogout() {
    setRunning(true);
    setResult("");
    setStage(null);
    setMessage("");
    try {
      await logoutFromGoogle({
        onStage: (s, m) => {
          setStage(s);
          setMessage(m);
        },
      });
      setCurrentUser(null);
    } catch (err) {
      setResult(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  async function handleWhoAmI() {
    setRunning(true);
    setResult("");
    setStage(null);
    setMessage("");
    setCurrentUser(undefined);
    try {
      const user = await getCurrentGoogleUser();
      setCurrentUser(user);
    } catch (err) {
      setResult(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 96,
        width: 360,
        padding: 16,
        background: "rgba(20, 20, 24, 0.95)",
        color: "#fff",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: 13,
        zIndex: 9999,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <strong style={{ fontSize: 14 }}>CEF Test · YouTube Music</strong>
        <span style={{ opacity: 0.5, fontSize: 11 }}>dev</span>
      </div>

      <input
        type="text"
        value={rssUrl}
        onChange={(e) => setRssUrl(e.target.value)}
        placeholder="https://castapp.ru/feed/<id>"
        disabled={running}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 6,
          border: "1px solid #333",
          background: "#0f0f12",
          color: "#fff",
          fontSize: 12,
          marginBottom: 10,
          boxSizing: "border-box",
        }}
      />

      <button
        type="button"
        onClick={handlePublish}
        disabled={running}
        style={{
          width: "100%",
          padding: "9px 12px",
          borderRadius: 6,
          border: "none",
          background: running ? "#444" : "#ef4444",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: running ? "not-allowed" : "pointer",
        }}
      >
        {running ? "Выполняется…" : "Опубликовать в YouTube Music"}
      </button>

      <button
        type="button"
        onClick={handleWhoAmI}
        disabled={running}
        style={{
          width: "100%",
          marginTop: 8,
          padding: "9px 12px",
          borderRadius: 6,
          border: "1px solid #444",
          background: running ? "#1a1a1f" : "transparent",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: running ? "not-allowed" : "pointer",
        }}
      >
        Кто авторизован
      </button>

      <button
        type="button"
        onClick={handleLogout}
        disabled={running}
        style={{
          width: "100%",
          marginTop: 8,
          padding: "9px 12px",
          borderRadius: 6,
          border: "1px solid #444",
          background: running ? "#1a1a1f" : "transparent",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: running ? "not-allowed" : "pointer",
        }}
      >
        Выйти из Google
      </button>

      {currentUser !== undefined && (
        <div
          style={{
            marginTop: 12,
            padding: "8px 10px",
            borderRadius: 6,
            background: "#1a1a1f",
            borderLeft: `3px solid ${currentUser ? "#10b981" : "#888"}`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              color: currentUser ? "#10b981" : "#888",
              fontWeight: 600,
              marginBottom: 2,
            }}
          >
            Google аккаунт
          </div>
          {currentUser ? (
            <>
              <div style={{ fontSize: 12, wordBreak: "break-word" }}>
                {currentUser.email}
              </div>
              {currentUser.name && (
                <div style={{ fontSize: 11, opacity: 0.6 }}>
                  {currentUser.name}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              Не авторизован
            </div>
          )}
        </div>
      )}

      {stage && (
        <div
          style={{
            marginTop: 12,
            padding: "8px 10px",
            borderRadius: 6,
            background: "#1a1a1f",
            borderLeft: `3px solid ${STAGE_COLORS[stage]}`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              color: STAGE_COLORS[stage],
              fontWeight: 600,
              marginBottom: 2,
            }}
          >
            {STAGE_LABELS[stage]}
          </div>
          <div style={{ fontSize: 12, opacity: 0.85, wordBreak: "break-word" }}>
            {message}
          </div>
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 10px",
            borderRadius: 6,
            background: "#0f0f12",
            fontSize: 11,
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            wordBreak: "break-word",
            opacity: 0.85,
          }}
        >
          {result}
        </div>
      )}
    </div>
  );
}
