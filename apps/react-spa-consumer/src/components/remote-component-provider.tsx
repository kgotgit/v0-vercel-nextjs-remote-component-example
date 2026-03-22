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

function getUrlPathWithSearch() {
  if (typeof window === "undefined") {
    return "/products/all/page/1";
  }
  const path = `${window.location.pathname}${window.location.search}`;
  return path === "/" ? "/products/all/page/1" : path;
}

export function RemoteComponentProvider({ children }: { children: ReactNode }) {
  const [remotePath, setRemotePath] = useState(() => getUrlPathWithSearch());
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const navigateRemote = useCallback((path: string) => {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    setIsLoading(true);
    window.history.pushState(null, "", normalized);
    setRemotePath(normalized);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setIsLoading(true);
      setRemotePath(getUrlPathWithSearch());
    };

    const onRemoteNavigate = (event: Event) => {
      const detail = (event as CustomEvent<{ path?: string }>).detail;
      if (!detail?.path) {
        return;
      }
      navigateRemote(detail.path);
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("remote:navigate", onRemoteNavigate as EventListener);

    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("remote:navigate", onRemoteNavigate as EventListener);
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
