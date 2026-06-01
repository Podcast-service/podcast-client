import { createContext, useContext } from "react";

export interface AddToPlaylistContextValue {
  /** Открыть модалку выбора плейлиста для указанного подкаста. */
  open: (podcastId: string) => void;
}

export const AddToPlaylistContext =
  createContext<AddToPlaylistContextValue | null>(null);

/**
 * Доступ к модалке «Добавить в плейлист».
 * Возвращает null, если компонент отрисован вне AddToPlaylistProvider
 * (например, на демо-странице) — вызывающий код должен это учитывать.
 */
export const useAddToPlaylist = (): AddToPlaylistContextValue | null =>
  useContext(AddToPlaylistContext);
