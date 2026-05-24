import { invoke } from "@tauri-apps/api/core";
import { runQuery, setupCefListeners, waitForLoadEnd } from "./cefSession";

export interface GoogleUser {
  email: string;
  name: string | null;
}

// myaccount.google.com is the most stable "who am I" surface:
//   - Signed in  → stays on myaccount.google.com and renders the account chip
//                  (top-right avatar) with aria-label "Google Account: Name (email)"
//                  in some locale.
//   - Signed out → 302 to accounts.google.com/ServiceLogin (or /signin/...).
//
// We pick this over the ListAccounts JSON endpoint because Google now returns
// HTTP 400 to that endpoint outside Chromium's internal context, even when a
// valid SAPISID cookie is present.
const MYACCOUNT_URL = "https://myaccount.google.com/";

// Run inside the loaded page. Polls the DOM for up to ~6s waiting for the
// account chip to render (it's hydrated client-side after first paint), then
// falls back to scanning innerText. Returns { email, name } or null.
//
// We rely on the aria-label pattern because:
//   - It contains both the display name and the email reliably.
//   - It's localized but the email-in-parens shape ("(x@y.z)") is consistent.
const EXTRACT_SCRIPT = `
  function tryFromAria() {
    const labeled = document.querySelectorAll('[aria-label]');
    for (const el of labeled) {
      const a = el.getAttribute('aria-label') || '';
      if (!a.includes('@')) continue;
      const emailMatch = a.match(/([\\w.+-]+@[\\w.-]+\\.[a-zA-Z]{2,})/);
      if (!emailMatch) continue;
      let name = null;
      const colon = a.match(/[:\\u2013\\u2014\\-]\\s*([^()]+?)\\s*\\(/);
      const lead = a.match(/^([^()@:]+?)\\s*\\(/);
      if (colon) name = colon[1].trim();
      else if (lead) name = lead[1].trim();
      return { email: emailMatch[1], name: name || null };
    }
    return null;
  }

  function tryFromBody() {
    const text = (document.body && document.body.innerText) || '';
    const m = text.match(/[\\w.+-]+@[\\w.-]+\\.[a-zA-Z]{2,}/);
    if (m) return { email: m[0], name: null };
    return null;
  }

  for (let i = 0; i < 30; i++) {
    const r = tryFromAria();
    if (r) return r;
    await new Promise(res => setTimeout(res, 200));
  }
  return tryFromBody();
`;

/**
 * Drives an existing CEF browser to myaccount.google.com and extracts the
 * signed-in account. Caller owns the browser lifecycle — useful when piggy-
 * backing on a session that's already authenticated (e.g. right after a
 * successful publish flow).
 */
export async function readGoogleUserInBrowser(
  browserId: number,
): Promise<GoogleUser | null> {
  await invoke("cef_navigate", { browserId, url: MYACCOUNT_URL });
  const { url } = await waitForLoadEnd(browserId, undefined, 60_000);
  if (!/myaccount\.google\.com/i.test(url)) return null;
  const result = (await runQuery(
    browserId,
    EXTRACT_SCRIPT,
    15_000,
  )) as GoogleUser | null;
  return result ?? null;
}

/**
 * Opens a hidden CEF window and reads the email (and display name, if
 * available) of the currently signed-in Google account. Returns `null` if no
 * account is signed in. Shuts the sidecar down before returning either way.
 */
export async function getCurrentGoogleUser(): Promise<GoogleUser | null> {
  await setupCefListeners();
  try {
    const open = await invoke<{ browser_id: number }>("cef_open", {
      url: MYACCOUNT_URL,
    });
    const { url } = await waitForLoadEnd(open.browser_id, undefined, 60_000);
    if (!/myaccount\.google\.com/i.test(url)) return null;
    const result = (await runQuery(
      open.browser_id,
      EXTRACT_SCRIPT,
      15_000,
    )) as GoogleUser | null;
    return result ?? null;
  } finally {
    await invoke("cef_shutdown").catch(() => {});
  }
}
