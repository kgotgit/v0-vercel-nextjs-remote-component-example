import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRemoteNavigate } from "remote-components/host/react";

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

  useRemoteNavigate(() => {
    setIsLoading(true);
    setRemotePath(getUrlPathWithSearch());
  });

  useEffect(() => {
    const onPopState = () => {
      setIsLoading(true);
      setRemotePath(getUrlPathWithSearch());
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

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
