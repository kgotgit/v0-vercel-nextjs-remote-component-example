import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type RemoteComponentContextValue = {
  remotePath: string;
  navigateRemote: (path: string) => void;
  refresh: () => void;
  isLoading: boolean;
  refreshKey: number;
};

const RemoteComponentContext = createContext<RemoteComponentContextValue | null>(null);

function normalizeHostPath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") {
    return "/products/all/page/1";
  }

  if (normalized.startsWith("/remote-components/")) {
    const stripped = normalized.slice("/remote-components".length);
    return stripped.startsWith("/") ? stripped : `/${stripped}`;
  }

  return normalized;
}

function getUrlPathWithSearch() {
  if (typeof window === "undefined") {
    return "/products/all/page/1";
  }
  const path = normalizeHostPath(window.location.pathname);
  return `${path}${window.location.search}`;
}

export function RemoteComponentProvider({ children }: { children: ReactNode }) {
  const [remotePath, setRemotePath] = useState(() => getUrlPathWithSearch());
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const navigateRemote = useCallback((path: string) => {
    const normalized = normalizeHostPath(path);
    setIsLoading(true);
    window.history.pushState(null, "", normalized);
    setRemotePath(normalized);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setIsLoading(true);
      setRemotePath(getUrlPathWithSearch());
    };

    // Open shadow DOM / regular DOM: composedPath lets us see the <a> directly.
    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const path = typeof event.composedPath === "function" ? event.composedPath() : [];
      const anchorFromPath = path.find(
        (node) => node instanceof HTMLAnchorElement && node.hasAttribute("data-remote-path")
      ) as HTMLAnchorElement | undefined;

      const target = event.target;
      const anchorFromTarget =
        target instanceof Element
          ? (target.closest("a[data-remote-path]") as HTMLAnchorElement | null)
          : null;

      const anchor = anchorFromPath ?? anchorFromTarget;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;

      const remotePath = anchor.getAttribute("data-remote-path");
      if (!remotePath) return;

      event.preventDefault();
      navigateRemote(remotePath);
    };

    // Closed shadow DOM: the remote's RemoteNavigationBridge intercepts the
    // click inside the shadow root and dispatches a composed CustomEvent that
    // crosses the shadow boundary. Works in all browsers.
    const onRemoteNavigate = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.path) {
        navigateRemote(detail.path);
      }
    };

    window.addEventListener("popstate", onPopState);
    document.addEventListener("click", onDocumentClick, true);
    document.addEventListener("remote-navigate", onRemoteNavigate);

    return () => {
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("click", onDocumentClick, true);
      document.removeEventListener("remote-navigate", onRemoteNavigate);
    };
  }, [navigateRemote]);

  useEffect(() => {
    if (!isLoading) {
      return;
    }
    const timeoutId = window.setTimeout(() => setIsLoading(false), 150);
    return () => window.clearTimeout(timeoutId);
  }, [isLoading, remotePath, refreshKey]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setRefreshKey((value) => value + 1);
  }, []);

  const contextValue = useMemo(
    () => ({
      remotePath,
      navigateRemote,
      refresh,
      isLoading,
      refreshKey,
    }),
    [isLoading, navigateRemote, refresh, refreshKey, remotePath]
  );

  return <RemoteComponentContext.Provider value={contextValue}>{children}</RemoteComponentContext.Provider>;
}

export function useRemoteComponent() {
  const context = useContext(RemoteComponentContext);
  if (!context) {
    throw new Error("useRemoteComponent must be used within RemoteComponentProvider");
  }
  return context;
}
