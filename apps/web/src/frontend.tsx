import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";

import {
  HeaderLogin,
  FooterLogin,
  LoginPage,
  RegisterPage,
  VerifyEmailPage,
  ForgotPasswordPage,
  ForgotPasswordVerifyPage,
  ForgotPasswordResetPage,
  Header,
  Footer,
  Player,
  MainPage,
  FilterTabs,
  AuthorRow,
  AuthorsPage,
  PlaylistRow,
  PlaylistsPage,
  ScrollToTop,
  PodcastHero,
  PodcastPage,
  AuthorPage,
  ProfileHero,
  ProfilePage,
  ProfileLikesPage,
  ProfilePlaylistsPage,
  ProfileSubscriptionsPage,
  ProfileHistoryPage,
  ActiveSessions,
  ProfileSettingsPage,
  OtpEmailModal,
  ToastProvider,
  PlaylistPage,
  BecomeAuthorSuccessModal,
  BecomeAuthorPage,
  ProfileMyPodcastsPage,
  CreatePlaylistPage,
  EditPlaylistPage,
  PodcastPublishStatus,
  CreatePodcastPage,
  EditPodcastPage,
  DownloadAppBanner,
  PodcastsPage,
  DownloadAppPage,
} from "@podcast/ui";

import "./styles/global.css";

interface ActivePodcast {
  id: string;
  title: string;
  author: string;
  duration: string;
  coverUrl?: string;
}

function AuthLayout() {
  return (
    <div className="app appAuth">
      <div className="desktopHeader">
        <HeaderLogin />
      </div>
      <main className="authMain">
        <Outlet />
      </main>
      <FooterLogin />
    </div>
  );
}

function MainLayout() {
  const [activePodcast, setActivePodcast] = useState<ActivePodcast | null>(null);

  return (
    <ToastProvider>
      <div className="app appMain">
        <Header />
        <main className="mainContent">
          <Outlet context={{ playPodcast: setActivePodcast }} />
        </main>
        <DownloadAppBanner
          isPlayerVisible={Boolean(activePodcast)}
          onDownloadClick={() => {}}
        />

        <Player
          isVisible={Boolean(activePodcast)}
          title={activePodcast?.title}
          episode={activePodcast?.author}
          totalTime={activePodcast?.duration}
          coverUrl={activePodcast?.coverUrl}
          currentTime="0:00"
          progress={0}
          volume={80}
          downloadStatus="idle"
        />
        <Footer />
      </div>
    </ToastProvider>
  );
}

const MOCK_CATEGORIES = [
  { id: "all", label: "Все подкасты" },
  { id: "design", label: "Дизайн" },
  { id: "business", label: "Бизнес" },
  { id: "psychology", label: "Психология" },
  { id: "science", label: "Наука" },
  { id: "entertainment", label: "Развлечения" },
  { id: "tech", label: "Технологии" },
  { id: "sport", label: "Спорт" },
  { id: "health", label: "Здоровье" },
];

const AUTHOR_PLAYLISTS = [
  {
    id: "1",
    title: "Эмоциональный интеллект",
    author: "Мария Смирнова",
    episodesCount: 24,
    coverUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
    listeners: 12300,
    likes: 2500,
    dislikes: 243,
    isAdded: true,
  },
  {
    id: "2",
    title: "Лидерство и Рост",
    author: "Мария Смирнова",
    episodesCount: 24,
    coverUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
    listeners: 12300,
    likes: 2500,
    dislikes: 243,
    isAdded: false,
  },
  {
    id: "3",
    title: "Осознанность",
    author: "Мария Смирнова",
    episodesCount: 18,
    coverUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
    listeners: 8700,
    likes: 1400,
    dislikes: 96,
    isAdded: false,
  },
  {
    id: "4",
    title: "Мышление лидера",
    author: "Мария Смирнова",
    episodesCount: 31,
    coverUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
    listeners: 18700,
    likes: 5400,
    dislikes: 221,
    isAdded: false,
  },
];

const RECOMMENDED_PODCASTS = [
  {
    id: "1",
    title: "Квантовый мир: За пределами воображения",
    category: "Наука",
    duration: "48 мин",
    coverUrl:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Урбанистика будущего: Города для людей",
    category: "Общество",
    duration: "32 мин",
    coverUrl:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Web 3.0: Миф или новая реальность?",
    category: "Технологии",
    duration: "55 мин",
    coverUrl:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=400&auto=format&fit=crop",
  },
  {
    id: "4",
    title: "Web 3.0: Миф или новая реальность?",
    category: "Технологии",
    duration: "55 мин",
    coverUrl:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=400&auto=format&fit=crop",
  },
];

const MOCK_SORT = [
  { id: "popular", label: "Популярные" },
  { id: "new", label: "Новые" },
  { id: "old", label: "Старые" },
];

const MOCK_SESSIONS = [
  {
    id: "1",
    deviceName: 'MacBook Pro 16"',
    deviceInfo: "Chrome • MacOS",
    ipAddress: "Москва, Россия",
    lastActivity: "Сейчас онлайн",
    isCurrent: true,
  },
  {
    id: "2",
    deviceName: "iPhone 15 Pro",
    deviceInfo: "Safari • iOS",
    ipAddress: "Санкт-Петербург, Россия",
    lastActivity: "2 часа назад",
    isCurrent: false,
  },
];

const TRANSCRIPT_ITEMS = [
  {
    id: "1",
    speakerId: 1,
    time: "00:06",
    text: "Приветствую всех слушателей Lumina Audio. Сегодня мы погружаемся в одну из самых обсуждаемых и в то же время пугающих тем нашего времени — этику искусственного интеллекта.",
  },
  {
    id: "2",
    speakerId: 2,
    time: "00:14",
    text: "Начнем с того, что мы уже не можем доверять своим глазам. Технология дипфейков достигла такого уровня, что отличить реальную запись от сгенерированной практически невозможно.",
  },
  {
    id: "3",
    speakerId: 1,
    time: "00:26",
    text: "Важно понимать, что ИИ — это не просто алгоритм, это зеркало наших собственных предубеждений, заложенных в обучающие выборки.",
  },
  {
    id: "4",
    speakerId: 2,
    time: "00:35",
    text: "Александр, как вы считаете, готовы ли мы к тому, что ИИ начнет принимать решения в судебной системе или медицине в обход человеческого контроля?",
  },
  {
    id: "5",
    speakerId: 3,
    time: "00:48",
    text: "Мне кажется, ключевой вопрос здесь не в скорости развития технологий, а в том, успевают ли общественные институты вырабатывать правила и ограничения.",
  },
  {
    id: "6",
    speakerId: 1,
    time: "01:02",
    text: "Именно поэтому прозрачность алгоритмов становится не технической роскошью, а базовым требованием к системам, которые влияют на жизнь людей.",
  },
];

const COVER =
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=400&auto=format&fit=crop";

const AUTHOR_AVATAR =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop";

function DevPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSort, setActiveSort] = useState("popular");

  const [isAuthorSubscribed, setIsAuthorSubscribed] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  return (
    <div className="container">
      <div
        style={{
          padding: "40px 32px",
          display: "flex",
          flexDirection: "column",
          gap: "48px",
        }}
      >

<section>
  <h2
    style={{
      marginBottom: "16px",
      fontFamily: "var(--font-open-sans)",
      fontSize: "18px",
      fontWeight: 700,
    }}
  >
    ProfileHero
  </h2>

  <ProfileHero
  username="Alex Johnson"
  email="alex@example.com"
  avatarUrl="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop"
  isAuthor={false}
/>

<button onClick={() => setIsOtpOpen(true)}>Открыть OTP модалку</button>

{isOtpOpen && (
    <OtpEmailModal
        email="test@example.com"
        onConfirm={async (code) => {
            if (code !== "123456") {
                throw new Error();
            }
            setIsOtpOpen(false);
        }}
        onClose={() => setIsOtpOpen(false)}
    />
)}

<button onClick={() => setIsSuccessModalOpen(true)}>
    Открыть модалку успеха
</button>

{isSuccessModalOpen && (
    <BecomeAuthorSuccessModal
        onContinue={() => setIsSuccessModalOpen(false)}
    />
)}


<PodcastPublishStatus status="draft" />
<PodcastPublishStatus status="processing" />
<PodcastPublishStatus status="ready" />
<PodcastPublishStatus status="published" publishedAt="2024-10-14T12:20:00" />
<PodcastPublishStatus status="error" />


</section>
        <section>
          <h2
            style={{
              marginBottom: "16px",
              fontFamily: "var(--font-open-sans)",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            FilterTabs
          </h2>

          <FilterTabs
            categories={MOCK_CATEGORIES}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            sortOptions={MOCK_SORT}
            activeSort={activeSort}
            onSortChange={setActiveSort}
          />
        </section>

        <section>
  <h2
    style={{
      marginBottom: "16px",
      fontFamily: "var(--font-open-sans)",
      fontSize: "18px",
      fontWeight: 700,
    }}
  >
    PodcastHero
  </h2>

  <PodcastHero
    title="Этика будущего: Как ИИ меняет наше восприятие реальности"
    author="Александр Соколов"
    category="Искусственный интеллект"
    publishedAt="14 Октября 2024"
    duration="54:12"
    listeners={12450}
    coverUrl="https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=900&auto=format&fit=crop"
    currentTime="15:25"
    progress={28}
    volume={80}
    isPlaying={false}
    isLiked={false}
    isDisliked={false}
    downloadStatus="idle"
    onPlayClick={() => {}}
    onLikeClick={() => {}}
    onDislikeClick={() => {}}
    onShareClick={() => {}}
    onDownloadClick={() => {}}
  />
</section>


<section>
  <h2
    style={{
      marginBottom: "16px",
      fontFamily: "var(--font-open-sans)",
      fontSize: "18px",
      fontWeight: 700,
    }}
  >
    ActiveSessions
  </h2>

  <ActiveSessions sessions={MOCK_SESSIONS} />
</section>

        <section>
          <h2
            style={{
              marginBottom: "16px",
              fontFamily: "var(--font-open-sans)",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            AuthorRow
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <AuthorRow
              id="1"
              name="Алексей Романов"
              description="Исследователь античности и автор цикла «Тени Прошлого». Погружение в забытые детали великих империй и анализ их влияния на современный мир через исторические параллели."
              subscribers={42500}
              avatarUrl={AUTHOR_AVATAR}
              isSubscribed={isAuthorSubscribed}
              onSubscribeClick={() =>
                setIsAuthorSubscribed((prev) => !prev)
              }
            />

            <AuthorRow
              id="2"
              name="Мария Смирнова"
              description="Автор подкастов о психологии, внимании и привычках. Простым языком о том, как лучше понимать себя и людей вокруг."
              subscribers={9800}
              isSubscribed={true}
              onSubscribeClick={() => {}}
            />
          </div>
        </section>







        <section>
  <h2
    style={{
      marginBottom: "16px",
      fontFamily: "var(--font-open-sans)",
      fontSize: "18px",
      fontWeight: 700,
    }}
  >
    PlaylistRow
  </h2>

  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
    <PlaylistRow
      id="1"
      title="Вечерние размышления о будущем"
      author="Артем Николаев"
      podcastsCount={12}
      coverUrl={COVER}
      description="Глубокие интервью с футурологами и учеными о мире через 50 лет. Обсуждаем ИИ, экологию и колонизацию."
      createdAt="14 окт. 2023"
      isAdded={false}
      isPlaying={false}
      onAddClick={() => {}}
      onPlayClick={() => {}}
    />

    <PlaylistRow
      id="2"
      title="История и философия"
      author="Мария Смирнова"
      podcastsCount={24}
      coverUrl={COVER}
      description="Подборка выпусков про античность, мышление, культуру и развитие цивилизаций."
      createdAt="8 нояб. 2023"
      isAdded={true}
      isPlaying={false}
      onAddClick={() => {}}
      onPlayClick={() => {}}
    />

    <PlaylistRow
      id="3"
      title="Ночной плейлист"
      author="Story Voice"
      podcastsCount={9}
      description="Подкасты для спокойного прослушивания перед сном."
      createdAt="2 дек. 2023"
      isAdded={true}
      isPlaying={true}
      onAddClick={() => {}}
      onPlayClick={() => {}}
    />
  </div>
</section>

      </div>
    </div>
  );
}

function Frontend() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgotpassword" element={<ForgotPasswordPage />} />
        <Route
          path="/forgotpassword/verify"
          element={<ForgotPasswordVerifyPage />}
        />
        <Route
          path="/forgotpassword/reset"
          element={<ForgotPasswordResetPage />}
        />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/" element={<MainPage />} />
        <Route path="/download" element={<DownloadAppPage />} />

        <Route path="/podcasts" element={<PodcastsPage />} />
        <Route path="/podcasts/create" element={<CreatePodcastPage />} />
        <Route path="/podcasts/:podcastId/edit" element={<EditPodcastPage />} />
        <Route path="/podcasts/:podcastId" element={<PodcastPage />} />

        <Route path="/authors" element={<AuthorsPage />} />
        <Route path="/authors/:authorId" element={<AuthorPage />} />

        <Route path="/playlists/create" element={<CreatePlaylistPage />} />
        <Route path="/playlists/:playlistId/edit" element={<EditPlaylistPage />} />
        <Route path="/playlists/:playlistId" element={<PlaylistPage />} />
        <Route path="/playlists" element={<PlaylistsPage />} />

        <Route path="/become-author" element={<BecomeAuthorPage />} />

        <Route path="/profile/edit" element={<ProfileSettingsPage />} />
        <Route path="/profile" element={<ProfilePage />}>
          <Route index element={<Navigate to="podcasts" replace />} />
          <Route path="podcasts" element={<ProfileMyPodcastsPage />} />
          <Route path="likes" element={<ProfileLikesPage />} />
          <Route path="playlists" element={<ProfilePlaylistsPage />} />
          <Route path="subscriptions" element={<ProfileSubscriptionsPage />} />
          <Route path="history" element={<ProfileHistoryPage />} />
        </Route>

        <Route path="/dev" element={<DevPage />} />
      </Route>
    </Routes>
  );
}

const rootElement = document.getElementById("root")!;

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Frontend />
    </BrowserRouter>
  </StrictMode>
);

export default Frontend;