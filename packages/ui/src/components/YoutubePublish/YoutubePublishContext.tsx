import React, { createContext, useContext } from "react";

export interface YoutubeGoogleUser {
  email: string;
  name: string | null;
}

export interface YoutubePublishTarget {
  id: string;
  title?: string;
}

/**
 * Возможности публикации на YouTube Music. Реализуются только в desktop-версии
 * (через CEF-сайдкар), поэтому в web/mobile провайдер не подключается и
 * `useYoutubePublish()` возвращает null — по этому признаку прячем кнопку.
 */
export interface YoutubePublishApi {
  /**
   * Проверить, есть ли в CEF-сессии уже вошедший Google-аккаунт.
   * Возвращает аккаунт или null, если вход не выполнен.
   */
  getCurrentUser(): Promise<YoutubeGoogleUser | null>;
  /**
   * Опубликовать плейлист (его RSS-ленту) на YouTube Music. Если пользователь
   * ещё не вошёл в Google, по ходу откроется окно входа. Возвращает аккаунт,
   * под которым прошла публикация (если удалось определить).
   */
  publish(
    target: YoutubePublishTarget,
    options?: { onStage?: (stage: string, message: string) => void },
  ): Promise<{ user: YoutubeGoogleUser | null }>;
  /** Выйти из Google в сессии публикации. */
  logout(): Promise<void>;
  /** Открыть YouTube Music во внешнем браузере. */
  openYoutube(): Promise<void> | void;
}

const YoutubePublishContext = createContext<YoutubePublishApi | null>(null);

export const YoutubePublishProvider: React.FC<{
  value: YoutubePublishApi;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <YoutubePublishContext.Provider value={value}>
    {children}
  </YoutubePublishContext.Provider>
);

/**
 * Доступ к публикации на YouTube Music. Возвращает null вне desktop-версии —
 * вызывающий код должен это учитывать (например, не показывать кнопку).
 */
export const useYoutubePublish = (): YoutubePublishApi | null =>
  useContext(YoutubePublishContext);
