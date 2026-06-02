import { openUrl } from "@tauri-apps/plugin-opener";
import type { YoutubePublishApi } from "@podcast/ui";
import { publishToYoutubeMusic } from "./publishYoutubeMusic";
import { logoutFromGoogle } from "./logoutGoogle";
import { getCurrentGoogleUser } from "./getCurrentGoogleUser";

// RSS-лента плейлиста, которую добавляем в YouTube Music.
// TODO: подтвердить реальный путь фида на бэкенде castapp.ru — здесь
// предполагается схема `<base>/<playlistId>`. Меняется в одном месте.
const PLAYLIST_RSS_BASE = "https://castapp.ru/feed";

const YT_MUSIC_URL = "https://music.youtube.com/library/podcasts";

const playlistRssUrl = (playlistId: string) =>
  `${PLAYLIST_RSS_BASE}/${playlistId}`;

/**
 * Desktop-реализация публикации на YouTube Music поверх CEF-сайдкара.
 * Подключается в main.tsx через <YoutubePublishProvider>. В web/mobile
 * провайдер не подключается, поэтому кнопка публикации там не появляется.
 */
export const youtubePublishApi: YoutubePublishApi = {
  async getCurrentUser() {
    return await getCurrentGoogleUser();
  },
  async publish(target, options) {
    const result = await publishToYoutubeMusic(playlistRssUrl(target.id), {
      onStage: options?.onStage,
    });
    return { user: result.user };
  },
  async logout() {
    await logoutFromGoogle();
  },
  async openYoutube() {
    await openUrl(YT_MUSIC_URL);
  },
};
