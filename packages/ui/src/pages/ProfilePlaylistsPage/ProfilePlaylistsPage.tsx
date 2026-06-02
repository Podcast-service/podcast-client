import React, { useEffect, useState } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import PlaylistCard from "../../components/PlaylistCard/PlaylistCard";
import styles from "./ProfilePlaylistsPage.module.css";

import {
  getMyLibraryPlaylists,
  getMyPlaylists,
  removePlaylistFromLibrary,
  type PlaylistCard as ApiPlaylistCard,
} from "../../api/podcast";

interface ProfilePlaylistItem extends ApiPlaylistCard {
  isOwner: boolean;
}

const ProfilePlaylistsPage: React.FC = () => {
  usePageTitle("Мои плейлисты");
  const navigate = useNavigate();

  const [playlists, setPlaylists] = useState<ProfilePlaylistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getMyPlaylists({ size: 50 }),
      getMyLibraryPlaylists({ size: 50 }).catch(() => null),
    ])
      .then(([ownPage, libraryPage]) => {
        if (!cancelled) {
          setPlaylists([
            ...ownPage.items.map((item) => ({ ...item, isOwner: true })),
            ...(libraryPage?.items.map((item) => ({
              ...item,
              isOwner: false,
            })) ?? []),
          ]);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError("Не удалось загрузить плейлисты.");
          console.error("Failed to load my playlists", err);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRemoveSaved = async (playlistId: string) => {
    const snapshot = playlists;
    setPlaylists((prev) => prev.filter((playlist) => playlist.id !== playlistId));

    try {
      await removePlaylistFromLibrary(playlistId);
    } catch (err) {
      setPlaylists(snapshot);
      console.error("Failed to remove saved playlist", err);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.createBtn}
          onClick={() => navigate("/playlists/create")}
        >
          Создать плейлист
        </button>
      </div>

      {isLoading ? (
        <p style={{ padding: "24px 0" }}>Загрузка…</p>
      ) : error ? (
        <p style={{ padding: "24px 0" }}>{error}</p>
      ) : playlists.length === 0 ? (
        <p style={{ padding: "24px 0" }}>У вас пока нет плейлистов.</p>
      ) : (
        <div className={styles.grid}>
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              id={playlist.id}
              title={playlist.title}
              author={playlist.owner.username}
              episodesCount={playlist.podcastsCount}
              coverUrl={playlist.coverImageUrl ?? undefined}
              likes={playlist.likesCount}
              dislikes={playlist.dislikesCount}
              isOwner={playlist.isOwner}
              isAdded={!playlist.isOwner}
              isPrivate={!playlist.isPublic}
              onEditClick={() => navigate(`/playlists/${playlist.id}/edit`)}
              onAddClick={() => handleRemoveSaved(playlist.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilePlaylistsPage;
