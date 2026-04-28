"use client";

import { useRouter } from "next/navigation";

type FilterSlug = "all" | "ct" | "mri" | "xray";

type FilterOption = {
  slug: FilterSlug;
  label: string;
};

export function CatalogClient({
  page,
  totalPages,
  filterSlug,
  filters,
}: {
  page: number;
  totalPages: number;
  filterSlug: FilterSlug;
  filters: FilterOption[];
}) {
  const router = useRouter();
  const toPath = (p: number, f: FilterSlug) => `/remote-components/catalog/p/${p}/f/${f}`;

  return (
    <div className="mt-5 border-t border-gray-200 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => router.push(toPath(Math.max(1, page - 1), filterSlug))}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => router.push(toPath(Math.min(totalPages, page + 1), filterSlug))}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {filters.map((option) => (
          <button
            key={option.slug}
            onClick={() => router.push(toPath(1, option.slug))}
            className={`px-2.5 py-1 rounded-full text-xs border ${
              option.slug === filterSlug
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
