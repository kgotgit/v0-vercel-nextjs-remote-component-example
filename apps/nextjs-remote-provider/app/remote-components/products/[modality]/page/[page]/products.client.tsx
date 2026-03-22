"use client";

type Modality = "all" | "ct" | "mri" | "xray";

const MODALITIES: Modality[] = ["all", "ct", "mri", "xray"];

function navigateRemote(path: string) {
  window.dispatchEvent(new CustomEvent("remote:navigate", { detail: { path } }));
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
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {MODALITIES.map((value) => (
          <button
            key={value}
            onClick={() => navigateRemote(`/products/${value}/page/1`)}
            className={`px-3 py-1.5 rounded-full text-xs border ${
              modality === value
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {value.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigateRemote(`/products/${modality}/page/${Math.max(1, currentPage - 1)}`)}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => navigateRemote(`/products/${modality}/page/${Math.min(totalPages, currentPage + 1)}`)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
