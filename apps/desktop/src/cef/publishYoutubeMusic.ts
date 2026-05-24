import { invoke } from "@tauri-apps/api/core";
import { runQuery, setupCefListeners, waitForLoadEnd } from "./cefSession";

export type PublishStage =
  | "opening"
  | "loading"
  | "checking-login"
  | "awaiting-login"
  | "adding"
  | "done"
  | "error";

export interface PublishOptions {
  onStage?: (stage: PublishStage, message: string) => void;
  signal?: AbortSignal;
}

const YT_MUSIC_LIBRARY_URL = "https://music.youtube.com/library/podcasts";
const GOOGLE_SIGNIN_URL =
  "https://accounts.google.com/ServiceLogin?service=youtube&continue=" +
  encodeURIComponent(YT_MUSIC_LIBRARY_URL);

// Login signal: only trust ytcfg.LOGGED_IN. The SAPISID cookie has Domain=.google.com,
// so it's visible from accounts.google.com mid-signin — we'd falsely think login is done
// and try to navigate, racing with Google's redirect and hanging the browser.
const CHECK_LOGIN_SCRIPT = `
  const yt = window.ytcfg;
  return !!(yt && yt.get && yt.get('LOGGED_IN') === true);
`;

// Installed once per page after load_end. Hooks fetch + XMLHttpRequest to capture
// the Authorization header from any YT-initiated request — so we don't have to
// reverse-engineer the SAPISIDHASH `_u` salt ourselves.
const INSTALL_AUTH_HOOK_SCRIPT = `
  if (!window.__cefAuthHookInstalled) {
    window.__cefAuthHookInstalled = true;
    window.__cefCapturedAuth = null;
    window.__cefCapturedClientName = null;
    window.__cefCapturedClientVersion = null;
    function capture(headers) {
      try {
        const a = headers.get ? headers.get('authorization') : (headers.authorization || headers.Authorization);
        if (a && /SAPISIDHASH/.test(a)) window.__cefCapturedAuth = a;
        const cn = headers.get ? headers.get('x-youtube-client-name') : null;
        const cv = headers.get ? headers.get('x-youtube-client-version') : null;
        if (cn) window.__cefCapturedClientName = cn;
        if (cv) window.__cefCapturedClientVersion = cv;
      } catch (e) {}
    }
    const origFetch = window.fetch.bind(window);
    window.fetch = function(input, init) {
      try {
        if (init && init.headers) capture(new Headers(init.headers));
        else if (input && input.headers && input.headers.get) capture(input.headers);
      } catch (e) {}
      return origFetch(input, init);
    };
    const origSet = XMLHttpRequest.prototype.setRequestHeader;
    XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
      try {
        const lname = String(name).toLowerCase();
        if (lname === 'authorization' && /SAPISIDHASH/.test(String(value))) {
          window.__cefCapturedAuth = String(value);
        } else if (lname === 'x-youtube-client-name') {
          window.__cefCapturedClientName = String(value);
        } else if (lname === 'x-youtube-client-version') {
          window.__cefCapturedClientVersion = String(value);
        }
      } catch (e) {}
      return origSet.apply(this, arguments);
    };
  }
  return true;
`;

// Add RSS via direct /youtubei/v1/flow POST, using the auth header captured from
// YT's own fetch traffic.
const ADD_RSS_SCRIPT = (rssUrl: string) => `
  async function waitForAuth(timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (window.__cefCapturedAuth) return window.__cefCapturedAuth;
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('scroll'));
      await new Promise(r => setTimeout(r, 250));
    }
    return null;
  }

  if (!window.__cefAuthHookInstalled) {
    throw new Error('Auth hook was not installed; reload the page');
  }
  const auth = await waitForAuth(15000);
  if (!auth) throw new Error('Could not capture an Authorization header within 15s');

  const yt = window.ytcfg;
  if (!yt || !yt.get) throw new Error('ytcfg unavailable');
  const ctx = yt.get('INNERTUBE_CONTEXT') || {};
  const client = ctx.client || {};
  const visitorId = client.visitorData || yt.get('VISITOR_DATA') || '';
  const clientVersion = window.__cefCapturedClientVersion || client.clientVersion || yt.get('INNERTUBE_CLIENT_VERSION');
  const clientName = client.clientName || yt.get('INNERTUBE_CLIENT_NAME_STRING') || 'WEB_REMIX';
  const clientNumeric = window.__cefCapturedClientName || String(yt.get('INNERTUBE_CONTEXT_CLIENT_NAME') || 67);
  const origin = 'https://music.youtube.com';

  const body = {
    context: {
      client: {
        clientName: clientName,
        clientVersion: clientVersion,
        hl: client.hl || 'en',
        gl: client.gl || 'US',
        visitorData: visitorId,
        originalUrl: origin + '/library/podcasts',
        platform: 'DESKTOP',
      },
      user: ctx.user || { lockedSafetyMode: false },
      request: { useSsl: true, internalExperimentFlags: [] },
    },
    flowId: 'FEmusic_podcasts_add_by_url',
    targetId: 'add-by-url-target-id',
    flowState: {
      currentStepId: 'add_by_url-step1',
      addPodcastByUrlFlowState: { rssFeedUrl: ${JSON.stringify(rssUrl)} },
    },
    flowStateEntityKey: 'Eh9hZGQtYnktdXJsLWZsb3ctc3RhdGUtZW50aXR5LWlkIPwBKAE%3D',
  };

  const r = await fetch(origin + '/youtubei/v1/flow?prettyPrint=false', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'authorization': auth,
      'content-type': 'application/json',
      'x-origin': origin,
      'x-goog-authuser': '0',
      'x-goog-visitor-id': visitorId,
      'x-youtube-client-name': clientNumeric,
      'x-youtube-client-version': clientVersion,
    },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) {
    throw new Error('HTTP ' + r.status + ' authPrefix=' + auth.slice(0, 30) + '... body=' + (data ? JSON.stringify(data) : '<no body>'));
  }
  const toast =
    data && data.updateFlowCommand &&
    data.updateFlowCommand.addToToastAction &&
    data.updateFlowCommand.addToToastAction.item &&
    data.updateFlowCommand.addToToastAction.item.notificationActionRenderer &&
    data.updateFlowCommand.addToToastAction.item.notificationActionRenderer.responseText &&
    data.updateFlowCommand.addToToastAction.item.notificationActionRenderer.responseText.runs;
  return { status: r.status, toast: toast ? toast.map(r => r.text).join('') : null };
`;

export interface PublishResult {
  status: number;
  toast: string | null;
}

/**
 * Publishes an RSS feed to YouTube Music by driving the CEF sidecar.
 * Reuses an already-signed-in profile from `<app-data>/cef-profile`; if the user
 * is not logged in, the browser becomes visible so they can sign in to Google,
 * then hides again and finishes silently.
 */
export async function publishToYoutubeMusic(
  rssUrl: string,
  options: PublishOptions = {},
): Promise<PublishResult> {
  if (!rssUrl) throw new Error("rssUrl is required");

  const stage = (s: PublishStage, m: string) => options.onStage?.(s, m);
  let browserId: number | null = null;

  try {
    await setupCefListeners();

    stage("opening", "Launching browser");
    const open = await invoke<{ browser_id: number }>("cef_open", {
      url: YT_MUSIC_LIBRARY_URL,
    });
    browserId = open.browser_id;

    stage("loading", "Loading YouTube Music");
    await waitForLoadEnd(browserId, (url) => url.includes("music.youtube.com"));
    await runQuery(browserId, INSTALL_AUTH_HOOK_SCRIPT);

    stage("checking-login", "Checking login");
    let loggedIn = (await runQuery(browserId, CHECK_LOGIN_SCRIPT)) as boolean;

    if (!loggedIn) {
      // Jump straight to Google sign-in with a continue= back to YT Music — saves
      // the user a click hunting for the "Sign in" button on the YT Music page.
      await invoke("cef_navigate", { browserId, url: GOOGLE_SIGNIN_URL });
      await invoke("cef_show", { browserId });
      stage(
        "awaiting-login",
        "Sign in to Google in the opened window, then this will continue",
      );
      // Don't poll JS while the user is on accounts.google.com — it can race with
      // Google's redirects. Wait for load_end; once back on music.youtube.com,
      // re-check ytcfg.LOGGED_IN.
      while (!loggedIn) {
        await waitForLoadEnd(
          browserId,
          (url) => /^https?:\/\/music\.youtube\.com\//.test(url),
          10 * 60_000,
        );
        await new Promise((r) => window.setTimeout(r, 500));
        try {
          loggedIn = (await runQuery(browserId, CHECK_LOGIN_SCRIPT, 5000)) as boolean;
        } catch {
          /* retry on next load_end */
        }
      }
      await invoke("cef_hide", { browserId });
    }

    stage("adding", "Adding RSS feed");
    await invoke("cef_navigate", { browserId, url: YT_MUSIC_LIBRARY_URL });
    await waitForLoadEnd(browserId, (url) => url.includes("/library/podcasts"));
    await runQuery(browserId, INSTALL_AUTH_HOOK_SCRIPT);
    const result = (await runQuery(browserId, ADD_RSS_SCRIPT(rssUrl), 30000)) as PublishResult;

    await invoke("cef_shutdown").catch(() => {});
    stage("done", "Podcast added to YouTube Music");
    return result;
  } catch (err) {
    stage("error", err instanceof Error ? err.message : String(err));
    await invoke("cef_shutdown").catch(() => {});
    throw err;
  }
}
