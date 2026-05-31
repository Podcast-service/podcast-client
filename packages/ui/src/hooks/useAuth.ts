import { useSyncExternalStore } from "react";
import { AUTH_CHANGE_EVENT, getAccessToken } from "../api/auth";

function subscribe(callback: () => void): () => void {
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useIsAuthenticated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => Boolean(getAccessToken()),
    () => false
  );
}
