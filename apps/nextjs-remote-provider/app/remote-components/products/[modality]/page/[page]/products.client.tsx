"use client";

import Link from "next/link";

type Modality = "all" | "ct" | "mri" | "xray";

const MODALITIES: Modality[] = ["all", "ct", "mri", "xray"];

export function ProductsClient({
  modality,
  currentPage,
  totalPages,
}: {
  modality: Modality;
  currentPage: number;
  totalPages: number;
}) {
  const toHref = (path: string) => `/remote-components${path}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {MODALITIES.map((value) => (
          <Link
            key={value}
            href={toHref(`/products/${value}/page/1`)}
            className={`px-3 py-1.5 rounded-full text-xs border ${
              modality === value
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {value.toUpperCase()}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={toHref(`/products/${modality}/page/${Math.max(1, currentPage - 1)}`)}
          aria-disabled={currentPage <= 1}
          className={`px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 ${
            currentPage <= 1 ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          Previous
        </Link>
        <Link
          href={toHref(`/products/${modality}/page/${Math.min(totalPages, currentPage + 1)}`)}
          aria-disabled={currentPage >= totalPages}
          className={`px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 ${
            currentPage >= totalPages ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
