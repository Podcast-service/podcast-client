import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import styles from "./ProfilePage.module.css";
import ProfileHero from "../../components/ProfileHero/ProfileHero";
import ProfileAuthorHero from "../../components/ProfileAuthorHero/ProfileAuthorHero";
import ProfileNav from "../../components/ProfileNav/ProfileNav";

import {
  getMyProfile,
  getMyAuthorProfile,
  type UserProfilePrivateResponse,
  type AuthorProfileResponse,
} from "../../api/podcast";
import { getTokenClaims } from "../../api/auth";

const ProfilePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Контекст из MainLayout (playPodcast) пробрасываем во вложенные страницы.
  const outletContext = useOutletContext();
  const [profile, setProfile] = useState<UserProfilePrivateResponse | null>(
    null
  );
  const [authorProfile, setAuthorProfile] =
    useState<AuthorProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const email = (getTokenClaims()?.email as string) ?? "";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setIsLoading(true);
        const me = await getMyProfile();
        if (cancelled) return;
        setProfile(me);

        const author = await getMyAuthorProfile().catch(() => null);
        if (!cancelled) {
          setAuthorProfile(author);
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isAuthor = Boolean(authorProfile);
  const isProfileRoot = location.pathname.replace(/\/+$/, "") === "/profile";

  useEffect(() => {
    if (!isLoading && isProfileRoot) {
      navigate(isAuthor ? "podcasts" : "likes", { replace: true });
    }
  }, [isAuthor, isLoading, isProfileRoot, navigate]);

  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <div className={styles.hero}>
          {isLoading ? (
            <p style={{ padding: "24px 0" }}>Загрузка…</p>
          ) : isAuthor && authorProfile ? (
            <ProfileAuthorHero
              authorName={authorProfile.authorName}
              email={email}
              avatarUrl={authorProfile.avatarUrl ?? profile?.avatarUrl ?? undefined}
              bio={authorProfile.description ?? undefined}
              subscribers={authorProfile.subscribersCount}
              onShareClick={() => {}}
            />
          ) : (
            <ProfileHero
              username={profile?.username ?? ""}
              email={email}
              avatarUrl={profile?.avatarUrl ?? undefined}
              isAuthor={false}
            />
          )}
        </div>

        <ProfileNav isAuthor={isAuthor} />

        <div className={styles.content}>
          {isProfileRoot ? null : <Outlet context={outletContext} />}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
