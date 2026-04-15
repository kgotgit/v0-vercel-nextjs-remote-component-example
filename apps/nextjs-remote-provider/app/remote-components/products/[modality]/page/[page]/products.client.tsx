"use client";

import type { MouseEvent } from "react";

type Modality = "all" | "ct" | "mri" | "xray";

const MODALITIES: Modality[] = ["all", "ct", "mri", "xray"];

// Host uses capture + stopPropagation when it sees this link; this path is for closed shadow / retargeted clicks.
function emitRemoteNavigate(event: MouseEvent<HTMLAnchorElement>) {
  const remotePath = event.currentTarget.getAttribute("data-remote-path");
  if (!remotePath) return;

  event.preventDefault();
  event.currentTarget.dispatchEvent(
    new CustomEvent("remote-navigate", {
      bubbles: true,
      composed: true,
      detail: { path: remotePath },
    })
  );
}

export function ProductsClient({
  modality,
  currentPage,
  totalPages,
}: {
  modality: Modality;
  currentPage: number;
  totalPages: number;
}) {
  const toStandaloneHref = (path: string) => `/remote-components${path}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {MODALITIES.map((value) => (
          <a
            key={value}
            href={toStandaloneHref(`/products/${value}/page/1`)}
            data-remote-path={`/products/${value}/page/1`}
            onClick={emitRemoteNavigate}
            className={`px-3 py-1.5 rounded-full text-xs border ${
              modality === value
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {value.toUpperCase()}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <a
          href={toStandaloneHref(`/products/${modality}/page/${Math.max(1, currentPage - 1)}`)}
          data-remote-path={`/products/${modality}/page/${Math.max(1, currentPage - 1)}`}
          onClick={emitRemoteNavigate}
          aria-disabled={currentPage <= 1}
          className={`px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 ${
            currentPage <= 1 ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          Previous
        </a>
        <a
          href={toStandaloneHref(`/products/${modality}/page/${Math.min(totalPages, currentPage + 1)}`)}
          data-remote-path={`/products/${modality}/page/${Math.min(totalPages, currentPage + 1)}`}
          onClick={emitRemoteNavigate}
          aria-disabled={currentPage >= totalPages}
          className={`px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 ${
            currentPage >= totalPages ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          Next
        </a>
      </div>
    </div>
  );
}
