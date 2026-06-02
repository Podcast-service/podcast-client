import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import styles from "./PlaylistPage.module.css";

import PlaylistHero from "../../components/PlaylistHero/PlaylistHero";
import PodcastRow from "../../components/PodcastRow/PodcastRow";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal/ConfirmDeleteModal";
import { useToast } from "../../components/Toast/useToast";
import YoutubePublishModal from "../../components/YoutubePublishModal/YoutubePublishModal";
import type { YoutubePublishStatus } from "../../components/YoutubePublishModal/YoutubePublishModal";

import {
  getPlaylist,
  getMyProfile,
  getMyLibraryPlaylists,
  deletePlaylist,
  isAuthenticated,
  removePlaylistFromLibrary,
  savePlaylistToLibrary,
  votePlaylist,
  removePlaylistVote,
  votePodcast,
  removePodcastVote,
  type PlaylistDetailResponse,
  type VoteType,
} from "../../api/podcast";
import { formatRuDate } from "../../utils/format";
import { toPodcastRow, type PodcastRowData } from "../../utils/mappers";

interface MainLayoutContext {
  playPodcast: (podcast: any, queue?: any[]) => void;
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
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [youtubeStatus, setYoutubeStatus] = useState<YoutubePublishStatus>("not_authorized");
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
      playPodcast(podcasts[0], podcasts);
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

  const handlePlaylistVote = async (voteType: VoteType) => {
    if (!playlist) return;
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const previous = playlist.currentUserVote ?? null;
    const shouldRemove = previous === voteType;

    setPlaylist((prev) =>
      prev ? { ...prev, currentUserVote: shouldRemove ? null : voteType } : prev
    );

    try {
      const result = shouldRemove
        ? await removePlaylistVote(playlist.id)
        : await votePlaylist(playlist.id, voteType);
      setPlaylist((prev) =>
        prev
          ? {
              ...prev,
              currentUserVote: result.currentUserVote ?? null,
              likesCount: result.likesCount,
              dislikesCount: result.dislikesCount,
            }
          : prev
      );
    } catch (err) {
      setPlaylist((prev) =>
        prev ? { ...prev, currentUserVote: previous } : prev
      );
      console.error("Failed to vote playlist", err);
      showToast("Не удалось проголосовать. Попробуйте позже.", "error");
    }
  };

  const handlePodcastLike = async (id: string) => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const target = podcasts.find((podcast) => podcast.id === id);
    if (!target) return;
    const wasLiked = target.currentUserVote === "LIKE";

    setPodcasts((prev) =>
      prev.map((podcast) =>
        podcast.id === id
          ? {
              ...podcast,
              isLiked: !wasLiked,
              currentUserVote: wasLiked ? null : "LIKE",
            }
          : podcast
      )
    );

    try {
      const result = wasLiked
        ? await removePodcastVote(id)
        : await votePodcast(id, "LIKE");
      setPodcasts((prev) =>
        prev.map((podcast) =>
          podcast.id === id
            ? {
                ...podcast,
                isLiked: result.currentUserVote === "LIKE",
                currentUserVote: result.currentUserVote ?? null,
              }
            : podcast
        )
      );
    } catch (err) {
      setPodcasts((prev) =>
        prev.map((podcast) =>
          podcast.id === id
            ? {
                ...podcast,
                isLiked: wasLiked,
                currentUserVote: wasLiked ? "LIKE" : null,
              }
            : podcast
        )
      );
      console.error("Failed to vote podcast", err);
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

  const totalMinutes = Math.round(
    (playlist.podcasts ?? []).reduce(
      (sum, item) => sum + (item.durationSeconds ?? 0),
      0
    ) / 60
  );

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
          isAuthenticated={isAuthenticated()}
          likesCount={playlist.likesCount}
          dislikesCount={playlist.dislikesCount}
          isLiked={playlist.currentUserVote === "LIKE"}
          isDisliked={playlist.currentUserVote === "DISLIKE"}
          onPlayAll={handlePlayAll}
          onAddClick={handleToggleSave}
          onEdit={handleEdit}
          onDelete={() => setIsDeleteModalOpen(true)}
          onLikeClick={() => handlePlaylistVote("LIKE")}
          onDislikeClick={() => handlePlaylistVote("DISLIKE")}
          onPublishToYoutube={() => setIsYoutubeModalOpen(true)}
        />

        <div className={styles.list}>
          {podcasts.map((podcast, index) => (
            <div key={podcast.id} className={styles.listItem}>
              <span className={styles.listNumber}>{index + 1}</span>
              <PodcastRow
                {...podcast}
                onPlayClick={() => playPodcast(podcast, podcasts)}
                onLikeClick={() => handlePodcastLike(podcast.id)}
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

      {isYoutubeModalOpen && (
        <YoutubePublishModal
          status={youtubeStatus}
          onClose={() => setIsYoutubeModalOpen(false)}
          onLoginWithGoogle={() => setYoutubeStatus("authorized")}
          onPublish={() => setYoutubeStatus("processing")}
          onLogoutGoogle={() => setYoutubeStatus("not_authorized")}
          onSwitchAccount={() => console.log("switch account")}
          onRetry={() => setYoutubeStatus("processing")}
          onOpenYoutube={() => window.open("https://music.youtube.com", "_blank")}
        />
      )}
    </div>
  );
};

export default PlaylistPage;
