import { useSyncExternalStore } from "react";
import {
  AUTH_CHANGE_EVENT,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getTokenClaims,
  isAccessTokenExpired,
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
      // Пока есть refresh-токен, считаем пользователя залогиненным: даже если
      // access истёк, его проактивно обновит планировщик/следующий запрос.
      // Разлогиниваем только когда восстановить сессию уже нечем.
      if (getRefreshToken()) {
        return true;
      }

      const token = getAccessToken();
      if (!token) {
        return false;
      }

      const claims = getTokenClaims();
      if (!claims || isAccessTokenExpired(0)) {
        // Битый или истёкший access без refresh — сессии конец.
        clearTokens();
        return false;
      }

      return true;
    },
    () => false
  );
}
