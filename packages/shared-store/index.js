import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// Why window events?
// remote-components injects the Next.js app's JS chunks into the SPA's DOM.
// Those chunks are a separate JS bundle — module federation singletons can't
// reach across that boundary. BUT both bundles share the same `window`, so
// Custom Events are the reliable cross-bundle state channel.
// ---------------------------------------------------------------------------

const COUNTER_EVENT = "rc:counter-change";
const THEME_EVENT = "rc:theme-change";

function getSnap(key, fallback) {
  if (typeof window === "undefined") return fallback;
  return window[key] ?? fallback;
}

function emit(eventName, windowKey, nextState) {
  if (typeof window === "undefined") return;
  window[windowKey] = nextState;
  window.dispatchEvent(new CustomEvent(eventName, { detail: nextState }));
}

/**
 * Cross-bundle counter store backed by window Custom Events.
 * Both the SPA host and the Next.js remote import this hook.
 * Any change from either side is reflected everywhere on the same page.
 */
export function useCounterStore() {
  const [state, setState] = useState(() => getSnap("__rcCounter", { count: 0 }));

  useEffect(() => {
    setState(getSnap("__rcCounter", { count: 0 }));
    const handler = (e) => setState(e.detail);
    window.addEventListener(COUNTER_EVENT, handler);
    return () => window.removeEventListener(COUNTER_EVENT, handler);
  }, []);

  const update = (next) => emit(COUNTER_EVENT, "__rcCounter", next);

  return {
    ...state,
    increment: () => update({ count: (window.__rcCounter?.count ?? 0) + 1 }),
    decrement: () => update({ count: (window.__rcCounter?.count ?? 0) - 1 }),
    reset:     () => update({ count: 0 }),
    setCount:  (value) => update({ count: value }),
  };
}

/**
 * Cross-bundle theme store backed by window Custom Events.
 */
export function useThemeStore() {
  const [state, setState] = useState(() => getSnap("__rcTheme", { theme: "light" }));

  useEffect(() => {
    setState(getSnap("__rcTheme", { theme: "light" }));
    const handler = (e) => setState(e.detail);
    window.addEventListener(THEME_EVENT, handler);
    return () => window.removeEventListener(THEME_EVENT, handler);
  }, []);

  const update = (next) => emit(THEME_EVENT, "__rcTheme", next);

  return {
    ...state,
    setTheme:    (theme) => update({ theme }),
    toggleTheme: () => update({ theme: getSnap("__rcTheme", { theme: "light" }).theme === "light" ? "dark" : "light" }),
  };
}
