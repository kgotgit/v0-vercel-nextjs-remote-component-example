import { useMemo } from "react";
import { RemoteComponent } from "remote-components/react";
import { getRemoteProviderUrl } from "@repo/config";
import { APP_COPY } from "@repo/ui";
import { RemoteComponentProvider, useRemoteComponent } from "./components/remote-component-provider";

const REMOTE_PROVIDER_URL = getRemoteProviderUrl(import.meta.env.VITE_REMOTE_PROVIDER_URL);

function normalizeRemotePath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized.startsWith("/remote-components/")) {
    const stripped = normalized.slice("/remote-components".length);
    return stripped.startsWith("/") ? stripped : `/${stripped}`;
  }
  return normalized;
}

function ProductsHostShell() {
  const { remotePath, navigateRemote, refresh, isLoading, refreshKey } = useRemoteComponent();

  const normalizedPath = normalizeRemotePath(remotePath);
  const remoteSrc = useMemo(
    () => `${REMOTE_PROVIDER_URL}/remote-components${normalizedPath}`,
    [normalizedPath]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">{APP_COPY.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Dynamic RSC + Soft Navigation (path-based products example)
          </p>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigateRemote("/products/all/page/1")}
            className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            All
          </button>
          <button
            onClick={() => navigateRemote("/products/ct/page/1")}
            className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            CT
          </button>
          <button
            onClick={() => navigateRemote("/products/mri/page/1")}
            className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            MRI
          </button>
          <button
            onClick={() => navigateRemote("/products/xray/page/1")}
            className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            X-RAY
          </button>
          <button
            onClick={refresh}
            className="ml-auto px-3 py-1.5 rounded-md text-sm bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500">Host path</p>
              <p className="text-sm text-gray-700">{normalizedPath}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Remote fetch src</p>
              <p className="text-sm text-gray-700 break-all">{remoteSrc}</p>
            </div>
            <span className={`text-xs font-medium ${isLoading ? "text-indigo-600" : "text-green-600"}`}>
              {isLoading ? "Loading RSC..." : "Ready"}
            </span>
          </div>

          <div className="border border-dashed border-gray-300 rounded-lg p-4 min-h-[280px]">
            <RemoteComponent src={remoteSrc} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <RemoteComponentProvider>
      <ProductsHostShell />
    </RemoteComponentProvider>
  );
}
