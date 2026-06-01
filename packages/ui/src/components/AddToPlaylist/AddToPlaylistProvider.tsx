import React, { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";

import styles from "./AddToPlaylist.module.css";
import { AddToPlaylistContext } from "./useAddToPlaylist";
import { useToast } from "../Toast/useToast";
import {
  addPodcastToPlaylist,
  getMyPlaylists,
  isAuthenticated,
  type PlaylistCard,
} from "../../api/podcast";

import DefaultBookSvg from "../../assets/icons/defaultBook.svg";
import CloseSvg from "../../assets/icons/close.svg";
import CirclePlusSvg from "../../assets/icons/circlePlus.svg";

export const AddToPlaylistProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [podcastId, setPodcastId] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const isOpen = podcastId !== null;

  const open = useCallback(
    (id: string) => {
      // Добавлять в плейлист может только авторизованный пользователь.
      if (!isAuthenticated()) {
        navigate("/login");
        return;
      }
      setPodcastId(id);
    },
    [navigate]
  );

  const close = useCallback(() => {
    setPodcastId(null);
    setSavingId(null);
  }, []);

  // Подтягиваем плейлисты пользователя при открытии модалки.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getMyPlaylists({ size: 50 })
      .then((page) => {
        if (!cancelled) setPlaylists(page.items);
      })
      .catch((err) => {
        if (!cancelled) {
          setPlaylists([]);
          showToast("Не удалось загрузить плейлисты. Попробуйте позже.", "error");
          console.error("Failed to load playlists", err);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, showToast]);

  // Закрытие по Escape.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  const handlePick = async (playlistId: string) => {
    if (!podcastId || savingId) {
      return;
    }

    setSavingId(playlistId);
    try {
      await addPodcastToPlaylist(playlistId, podcastId);
      showToast("Подкаст добавлен в плейлист", "success");
      close();
    } catch (err: any) {
      if (err?.status === 409) {
        showToast("Подкаст уже есть в этом плейлисте", "error");
      } else if (err?.status === 422) {
        showToast("В плейлист можно добавить только опубликованный подкаст", "error");
      } else if (err?.status === 403) {
        showToast("Можно добавлять только в свои плейлисты", "error");
      } else {
        showToast("Не удалось добавить подкаст. Попробуйте позже.", "error");
      }
      console.error("Failed to add podcast to playlist", err);
      setSavingId(null);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) close();
  };

  const modal =
    isOpen &&
    ReactDOM.createPortal(
      <div
        className={styles.overlay}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-playlist-title"
      >
        <div className={styles.modal}>
          <div className={styles.header}>
            <h2 id="add-to-playlist-title" className={styles.title}>
              Добавить в плейлист
            </h2>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={close}
              aria-label="Закрыть"
            >
              <img src={CloseSvg} alt="" aria-hidden="true" />
            </button>
          </div>

          {isLoading ? (
            <p className={styles.stateText}>Загрузка…</p>
          ) : playlists.length === 0 ? (
            <p className={styles.stateText}>
              У вас пока нет плейлистов.
            </p>
          ) : (
            <ul className={styles.list}>
              {playlists.map((playlist) => (
                <li key={playlist.id}>
                  <button
                    type="button"
                    className={styles.item}
                    onClick={() => handlePick(playlist.id)}
                    disabled={savingId !== null}
                  >
                    <img
                      src={playlist.coverImageUrl || DefaultBookSvg}
                      alt=""
                      aria-hidden="true"
                      className={styles.cover}
                    />
                    <span className={styles.itemText}>
                      <span className={styles.itemTitle}>{playlist.title}</span>
                      <span className={styles.itemMeta}>
                        {playlist.podcastsCount} подк. ·{" "}
                        {playlist.isPublic ? "Публичный" : "Приватный"}
                      </span>
                    </span>
                    {savingId === playlist.id && (
                      <span className={styles.itemSaving}>…</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            className={styles.createBtn}
            onClick={() => {
              close();
              navigate("/playlists/create");
            }}
          >
            <img src={CirclePlusSvg} alt="" aria-hidden="true" />
            Создать новый плейлист
          </button>
        </div>
      </div>,
      document.body
    );

  return (
    <AddToPlaylistContext.Provider value={{ open }}>
      {children}
      {modal}
    </AddToPlaylistContext.Provider>
  );
};

export default AddToPlaylistProvider;
