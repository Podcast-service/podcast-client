import { invoke } from "@tauri-apps/api/core";
import { setupCefListeners, waitForLoadEnd } from "./cefSession";

export type LogoutStage = "opening" | "logging-out" | "done" | "error";

export interface LogoutOptions {
  onStage?: (stage: LogoutStage, message: string) => void;
}

// Google's /Logout endpoint clears the SAPISID + other auth cookies for the
// whole .google.com group, which is what we want — next publish run will see
// LOGGED_IN === false and prompt for sign-in again. The continue= param skips
// the post-logout "Choose an account" / "Sign in again" screen.
const GOOGLE_LOGOUT_URL =
  "https://accounts.google.com/Logout?continue=https://www.google.com/";

/**
 * Opens a hidden CEF window, hits Google's logout endpoint to clear the
 * persisted session cookies, then shuts the sidecar down.
 */
export async function logoutFromGoogle(
  options: LogoutOptions = {},
): Promise<void> {
  const stage = (s: LogoutStage, m: string) => options.onStage?.(s, m);

  try {
    await setupCefListeners();

    stage("opening", "Запуск браузера");
    const open = await invoke<{ browser_id: number }>("cef_open", {
      url: GOOGLE_LOGOUT_URL,
    });

    stage("logging-out", "Выход из Google");
    // /Logout redirects through one or more intermediate URLs before landing on
    // the continue= target. Wait until we've left the Logout endpoint itself.
    await waitForLoadEnd(
      open.browser_id,
      (url) => !/accounts\.google\.com\/Logout/i.test(url),
      60_000,
    );

    await invoke("cef_shutdown").catch(() => {});
    stage("done", "Выход выполнен");
  } catch (err) {
    stage("error", err instanceof Error ? err.message : String(err));
    await invoke("cef_shutdown").catch(() => {});
    throw err;
  }
}
