import { useSyncExternalStore } from "react";
import { AUTH_CHANGE_EVENT, getAccessToken } from "../api/auth";

function subscribe(callback: () => void): () => void {
  // Реагируем на логин/логаут в текущей вкладке (auth-change)
  // и на изменения localStorage из других вкладок (storage).
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** Реактивный флаг авторизации: true, если в localStorage есть access token. */
export function useIsAuthenticated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => Boolean(getAccessToken()),
    () => false
  );
}
