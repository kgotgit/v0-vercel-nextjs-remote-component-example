import { useCallback, useEffect, useMemo, useState } from "react";
import { RemoteComponent } from "remote-components/react";
import { getRemoteProviderUrl } from "@repo/config";
import { APP_COPY } from "@repo/ui";

// URL of the Next.js remote provider app
// In production, replace with your deployed Next.js app URL
const REMOTE_PROVIDER_URL =
  getRemoteProviderUrl(import.meta.env.VITE_REMOTE_PROVIDER_URL);

const CATALOG_PATH_REGEX = /^\/catalog\/p\/(\d+)\/f\/([a-z0-9-]+)$/i;

const FILTER_OPTIONS = [
  { slug: "all", label: "All" },
  { slug: "ct", label: "CT" },
  { slug: "mri", label: "MRI" },
  { slug: "xray", label: "X-Ray" },
] as const;

type FilterSlug = (typeof FILTER_OPTIONS)[number]["slug"];

type CatalogLocation = {
  page: number;
  filterSlug: FilterSlug;
  modalOpen: boolean;
};

const DEFAULT_LOCATION: CatalogLocation = {
  page: 1,
  filterSlug: "all",
  modalOpen: false,
};

function toFilterSlug(raw: string): FilterSlug {
  const match = FILTER_OPTIONS.find((option) => option.slug === raw);
  return match?.slug ?? "all";
}

function toUrl(location: CatalogLocation): string {
  const pathname = `/catalog/p/${location.page}/f/${location.filterSlug}`;
  const search = new URLSearchParams();
  if (location.modalOpen) {
    search.set("modal", "filters");
  }
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function readLocationFromUrl(): CatalogLocation {
  if (typeof window === "undefined") {
    return DEFAULT_LOCATION;
  }

  const match = CATALOG_PATH_REGEX.exec(window.location.pathname);
  const page = match ? Math.max(1, Number.parseInt(match[1] ?? "1", 10) || 1) : 1;
  const filterSlug = toFilterSlug(match?.[2] ?? "all");
  const modalOpen = new URLSearchParams(window.location.search).get("modal") === "filters";

  return { page, filterSlug, modalOpen };
}

function App() {
  const [location, setLocation] = useState<CatalogLocation>(() => readLocationFromUrl());

  const navigate = useCallback((next: CatalogLocation, replace = false) => {
    const normalized: CatalogLocation = {
      page: Math.max(1, next.page),
      filterSlug: toFilterSlug(next.filterSlug),
      modalOpen: Boolean(next.modalOpen),
    };

    if (typeof window !== "undefined") {
      const nextUrl = toUrl(normalized);
      if (replace) {
        window.history.replaceState(null, "", nextUrl);
      } else {
        window.history.pushState(null, "", nextUrl);
      }
    }

    setLocation(normalized);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!CATALOG_PATH_REGEX.test(window.location.pathname)) {
      navigate(DEFAULT_LOCATION, true);
    } else {
      setLocation(readLocationFromUrl());
    }

    const onPopState = () => setLocation(readLocationFromUrl());
    const onCatalogNavigate = (event: Event) => {
      const detail = (event as CustomEvent<{ page?: number; filterSlug?: string }>).detail;
      if (!detail) {
        return;
      }
      navigate(
        {
          page: detail.page ?? location.page,
          filterSlug: toFilterSlug(detail.filterSlug ?? location.filterSlug),
          modalOpen: false,
        },
        false
      );
    };
    const onCatalogModal = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      navigate(
        {
          page: location.page,
          filterSlug: location.filterSlug,
          modalOpen: Boolean(detail?.open),
        },
        false
      );
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("rc:catalog-navigate", onCatalogNavigate as EventListener);
    window.addEventListener("rc:catalog-modal", onCatalogModal as EventListener);

    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("rc:catalog-navigate", onCatalogNavigate as EventListener);
      window.removeEventListener("rc:catalog-modal", onCatalogModal as EventListener);
    };
  }, [location.filterSlug, location.page, navigate]);

  const remoteSrc = useMemo(
    () => `${REMOTE_PROVIDER_URL}/remote-components/catalog/p/${location.page}/f/${location.filterSlug}`,
    [location.filterSlug, location.page]
  );

  const selectedFilter = useMemo(
    () => FILTER_OPTIONS.find((option) => option.slug === location.filterSlug) ?? FILTER_OPTIONS[0],
    [location.filterSlug]
  );

  const goToPage = (nextPage: number) =>
    navigate({ page: Math.max(1, nextPage), filterSlug: location.filterSlug, modalOpen: false });

  const openFilterModal = () =>
    navigate({ page: location.page, filterSlug: location.filterSlug, modalOpen: true });

  const closeFilterModal = () =>
    navigate({ page: location.page, filterSlug: location.filterSlug, modalOpen: false });

  const applyFilter = (filterSlug: FilterSlug) =>
    navigate({ page: 1, filterSlug, modalOpen: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">
            {APP_COPY.title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Catalog demo with soft navigation and path-based remote component URL
          </p>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">Filter:</span>
          <span className="px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
            {selectedFilter.label}
          </span>
          <button
            onClick={openFilterModal}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            Open Filter Modal
          </button>
          <button
            onClick={() => goToPage(location.page - 1)}
            disabled={location.page <= 1}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {location.page}</span>
          <button
            onClick={() => goToPage(location.page + 1)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            Next
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">
              Remote: {remoteSrc}
            </span>
          </div>

          <div className="border border-dashed border-gray-300 rounded-lg p-4 min-h-[200px]">
            <RemoteComponent key={remoteSrc} src={remoteSrc} />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">How it works</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>
                1. Host URL is the source of truth for page and modality filter
              </li>
              <li>
                2. Host performs soft navigation with history API (no full reload)
              </li>
              <li>
                3. Remote path is built as
                <code className="bg-gray-100 px-1 rounded">
                  /remote-components/catalog/p/:page/f/:filter
                </code>
              </li>
              <li>
                4. Next provider serves RSC with ISR for each unique path
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Configuration</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                Remote Provider URL:{" "}
                <code className="bg-gray-100 px-1 rounded">
                  {REMOTE_PROVIDER_URL}
                </code>
              </p>
              <p>
                Current host URL:{" "}
                <code className="bg-gray-100 px-1 rounded">{toUrl(location)}</code>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Set{" "}
                <code className="bg-gray-100 px-1 rounded">
                  VITE_REMOTE_PROVIDER_URL
                </code>{" "}
                environment variable to change the provider URL in production.
              </p>
            </div>
          </div>
        </div>
      </main>

      {location.modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Select Modality Filter</h2>
              <button
                onClick={closeFilterModal}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.slug}
                  onClick={() => applyFilter(option.slug)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                    option.slug === location.filterSlug
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
