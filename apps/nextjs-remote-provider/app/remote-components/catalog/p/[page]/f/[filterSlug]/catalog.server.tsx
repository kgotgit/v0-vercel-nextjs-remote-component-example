import { CatalogClient } from "./catalog.client";

type FilterSlug = "all" | "ct" | "mri" | "xray";

type FilterOption = {
  slug: FilterSlug;
  label: string;
};

type Product = {
  id: string;
  name: string;
  modality: Exclude<FilterSlug, "all">;
  score: number;
};

const FILTER_OPTIONS: FilterOption[] = [
  { slug: "all", label: "All" },
  { slug: "ct", label: "CT" },
  { slug: "mri", label: "MRI" },
  { slug: "xray", label: "X-Ray" },
];

const PAGE_SIZE = 6;

const PRODUCTS: Product[] = Array.from({ length: 42 }, (_, index) => {
  const modalities: Array<Product["modality"]> = ["ct", "mri", "xray"];
  const modality = modalities[index % modalities.length];
  return {
    id: `scan-${index + 1}`,
    name: `Study #${String(index + 1).padStart(2, "0")}`,
    modality,
    score: 60 + ((index * 7) % 39),
  };
});

function toFilterSlug(filterSlug: string): FilterSlug {
  const match = FILTER_OPTIONS.find((option) => option.slug === filterSlug);
  return match?.slug ?? "all";
}

export function CatalogServer({
  page,
  filterSlug,
}: {
  page: number;
  filterSlug: string;
}) {
  const selectedFilter = toFilterSlug(filterSlug);
  const filteredProducts =
    selectedFilter === "all"
      ? PRODUCTS
      : PRODUCTS.filter((item) => item.modality === selectedFilter);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageItems = filteredProducts.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Catalog (Remote RSC)</h2>
          <p className="text-sm text-gray-500 mt-1">
            Path-based page and modality filter are rendered on the provider.
          </p>
        </div>
        <div className="text-xs text-gray-500 text-right">
          <div>Filter: {selectedFilter.toUpperCase()}</div>
          <div>
            Page {safePage} / {totalPages}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {pageItems.map((item) => (
          <div key={item.id} className="rounded-lg border border-gray-200 p-3 bg-gray-50">
            <p className="text-sm font-medium text-gray-900">{item.name}</p>
            <p className="text-xs text-gray-600 mt-1">Modality: {item.modality.toUpperCase()}</p>
            <p className="text-xs text-gray-600">Confidence: {item.score}%</p>
          </div>
        ))}
      </div>

      <CatalogClient
        page={safePage}
        totalPages={totalPages}
        filterSlug={selectedFilter}
        filters={FILTER_OPTIONS}
      />
    </div>
  );
}
