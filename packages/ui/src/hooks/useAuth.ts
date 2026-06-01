import { useSyncExternalStore } from "react";
import {
  AUTH_CHANGE_EVENT,
  clearTokens,
  getAccessToken,
  getTokenClaims,
} from "../api/auth";

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
    () => {
      if (!getAccessToken()) {
        return false;
      }

      const claims = getTokenClaims();
      if (!claims) {
        clearTokens();
        return false;
      }

      if (typeof claims.exp === "number" && claims.exp * 1000 <= Date.now()) {
        clearTokens();
        return false;
      }

      return true;
    },
    () => false
  );
}
