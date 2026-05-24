import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export type CefEventPayload = {
  browser_id?: number;
  url?: unknown;
  http_status?: unknown;
  [key: string]: unknown;
};

type JsCallback = {
  browser_id?: number;
  payload: { tag: string; ok?: unknown; err?: string };
};

const pendingJsCallbacks = new Map<string, (cb: JsCallback) => void>();
let loadEndListeners: Array<(payload: CefEventPayload) => void> = [];
let cefListenersUnlisten: UnlistenFn[] = [];
let setupPromise: Promise<void> | null = null;

// Register the global cef://load_end and cef://js_callback listeners once per
// module load. Per-call helpers (waitForLoadEnd, runQuery) just hook into the
// in-memory dispatch lists, so multiple concurrent CEF flows share a single
// pair of Tauri listeners.
export function setupCefListeners(): Promise<void> {
  if (setupPromise) return setupPromise;
  setupPromise = (async () => {
    const unlistenLoad = await listen<CefEventPayload>("cef://load_end", (e) => {
      for (const listener of loadEndListeners) listener(e.payload);
    });
    const unlistenJs = await listen<JsCallback>("cef://js_callback", (e) => {
      const tag = e.payload.payload?.tag;
      if (!tag) return;
      const resolver = pendingJsCallbacks.get(tag);
      if (resolver) {
        pendingJsCallbacks.delete(tag);
        resolver(e.payload);
      }
    });
    cefListenersUnlisten.push(unlistenLoad, unlistenJs);
  })();
  return setupPromise;
}

export function waitForLoadEnd(
  browserId: number,
  urlMatch?: (url: string) => boolean,
  timeoutMs = 30000,
): Promise<{ url: string; http_status: number }> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      loadEndListeners = loadEndListeners.filter((l) => l !== listener);
      reject(new Error("load_end timeout"));
    }, timeoutMs);
    const listener = (payload: CefEventPayload) => {
      if (payload.browser_id !== browserId) return;
      const url = String(payload.url ?? "");
      if (urlMatch && !urlMatch(url)) return;
      loadEndListeners = loadEndListeners.filter((l) => l !== listener);
      window.clearTimeout(timer);
      resolve({ url, http_status: Number(payload.http_status ?? 0) });
    };
    loadEndListeners.push(listener);
  });
}

export async function runQuery(
  browserId: number,
  code: string,
  timeoutMs = 30000,
): Promise<unknown> {
  const tag = `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const promise = new Promise<JsCallback>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      pendingJsCallbacks.delete(tag);
      reject(new Error("js_callback timeout"));
    }, timeoutMs);
    pendingJsCallbacks.set(tag, (cb) => {
      window.clearTimeout(timer);
      resolve(cb);
    });
  });
  await invoke("cef_query", { browserId, code, tag });
  const result = await promise;
  if (result.payload?.err) throw new Error(result.payload.err);
  return result.payload?.ok ?? null;
}
