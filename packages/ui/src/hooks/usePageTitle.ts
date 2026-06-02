import { useEffect } from "react";

const APP_NAME = "Podcast";

/**
 * Устанавливает document.title для текущей страницы.
 * Передаём заголовок страницы — к нему добавляется название сервиса:
 * `${title} — Podcast`. Без аргумента (или с пустым/undefined значением,
 * пока грузятся данные) показываем просто «Podcast».
 */
export function usePageTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} — ${APP_NAME}` : APP_NAME;
  }, [title]);
}

export default usePageTitle;
