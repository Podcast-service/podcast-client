import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import styles from "./PlaylistPage.module.css";

import PlaylistHero from "../../components/PlaylistHero/PlaylistHero";
import PodcastRow from "../../components/PodcastRow/PodcastRow";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal/ConfirmDeleteModal";
import { useToast } from "../../components/Toast/useToast";

import {
  getPlaylist,
  getMyProfile,
  getMyLibraryPlaylists,
  deletePlaylist,
  isAuthenticated,
  removePlaylistFromLibrary,
  savePlaylistToLibrary,
  type PlaylistDetailResponse,
} from "../../api/podcast";
import { formatRuDate } from "../../utils/format";
import { toPodcastRow, type PodcastRowData } from "../../utils/mappers";

interface MainLayoutContext {
  playPodcast: (podcast: any) => void;
}

const PlaylistPage: React.FC = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { playPodcast } = useOutletContext<MainLayoutContext>();
  const { showToast } = useToast();

  const [playlist, setPlaylist] = useState<PlaylistDetailResponse | null>(null);
  const [podcasts, setPodcasts] = useState<PodcastRowData[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playlistId) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Профиль грузим параллельно, чтобы понять, владелец ли пользователь.
        const [detail, profile] = await Promise.all([
          getPlaylist(playlistId),
          isAuthenticated()
            ? getMyProfile().catch(() => null)
            : Promise.resolve(null),
        ]);
        if (cancelled) {
          return;
        }

        setPlaylist(detail);
        setPodcasts((detail.podcasts ?? []).map(toPodcastRow));
        const owner = Boolean(
          profile &&
            (detail.owner.id === profile.id || detail.owner.id === profile.userId)
        );
        setIsOwner(owner);

        if (isAuthenticated() && !owner) {
          const library = await getMyLibraryPlaylists({ size: 50 }).catch(
            () => null
          );
          if (!cancelled) {
            setIsSaved(
              Boolean(library?.items.some((item) => item.id === detail.id))
            );
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.status === 404
              ? "Плейлист не найден."
              : err?.status === 403
                ? "Этот плейлист приватный."
                : "Не удалось загрузить плейлист. Попробуйте позже."
          );
          console.error("Failed to load playlist", err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [playlistId]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={`container ${styles.pageInner}`}>
          <p style={{ padding: "40px 0" }}>Загрузка…</p>
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className={styles.page}>
        <div className={`container ${styles.pageInner}`}>
          <p style={{ padding: "40px 0" }}>{error ?? "Плейлист не найден."}</p>
        </div>
      </div>
    );
  }

  const handlePlayAll = () => {
    if (podcasts.length > 0) {
      playPodcast(podcasts[0]);
    }
  };

  const handleEdit = () => {
    navigate(`/playlists/${playlist.id}/edit`);
  };

  const handleConfirmDelete = async () => {
    setIsDeleteModalOpen(false);
    try {
      await deletePlaylist(playlist.id);
      showToast("Плейлист удалён", "success");
      navigate("/profile/playlists");
    } catch (err) {
      console.error("Failed to delete playlist", err);
      showToast("Не удалось удалить плейлист. Попробуйте позже.", "error");
    }
  };

  const handleToggleSave = async () => {
    if (!playlist) return;
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const wasSaved = isSaved;
    setIsSaved(!wasSaved);

    try {
      const result = wasSaved
        ? await removePlaylistFromLibrary(playlist.id)
        : await savePlaylistToLibrary(playlist.id);
      setIsSaved(result.isSaved);
    } catch (err) {
      setIsSaved(wasSaved);
      console.error("Failed to toggle playlist save", err);
      showToast("Не удалось обновить библиотеку. Попробуйте позже.", "error");
    }
  };

  // Суммарная длительность плейлиста в минутах.
  const totalMinutes = Math.round(
    (playlist.podcasts ?? []).reduce(
      (sum, item) => sum + (item.durationSeconds ?? 0),
      0
    ) / 60
  );

  // Прослушивания как сумма просмотров входящих подкастов (proxy-метрика).
  const totalListeners = (playlist.podcasts ?? []).reduce(
    (sum, item) => sum + (item.viewsCount ?? 0),
    0
  );

  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <PlaylistHero
          title={playlist.title}
          author={playlist.owner.username}
          description={playlist.description ?? undefined}
          coverUrl={playlist.coverImageUrl ?? undefined}
          isPrivate={!playlist.isPublic}
          isOwner={isOwner}
          episodesCount={playlist.podcastsCount}
          totalDuration={String(totalMinutes)}
          createdAt={formatRuDate(playlist.createdAt)}
          listeners={totalListeners}
          isAdded={isSaved}
          onPlayAll={handlePlayAll}
          onAddClick={handleToggleSave}
          onEdit={handleEdit}
          onDelete={() => setIsDeleteModalOpen(true)}
        />

        <div className={styles.list}>
          {podcasts.map((podcast, index) => (
            <div key={podcast.id} className={styles.listItem}>
              <span className={styles.listNumber}>{index + 1}</span>
              <PodcastRow
                {...podcast}
                onPlayClick={() => playPodcast(podcast)}
                onAddClick={() => {}}
              />
            </div>
          ))}
        </div>
      </div>

      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          onConfirm={handleConfirmDelete}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}
    </div>
  );
};

export default PlaylistPage;
