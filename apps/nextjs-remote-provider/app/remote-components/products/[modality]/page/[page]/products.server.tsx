import { ProductsClient } from "./products.client";

type Modality = "all" | "ct" | "mri" | "xray";

type Product = {
  id: string;
  name: string;
  modality: Exclude<Modality, "all">;
  price: number;
};

const MODALITIES: Modality[] = ["all", "ct", "mri", "xray"];
const PAGE_SIZE = 12;

const PRODUCTS: Product[] = Array.from({ length: 84 }, (_, index) => {
  const modalities: Array<Exclude<Modality, "all">> = ["ct", "mri", "xray"];
  const modality = modalities[index % modalities.length];
  return {
    id: `prod-${index + 1}`,
    name: `Imaging Product ${index + 1}`,
    modality,
    price: 80 + ((index * 17) % 340),
  };
});

function normalizeModality(modality: string): Modality {
  return MODALITIES.includes(modality as Modality) ? (modality as Modality) : "all";
}

export function ProductsServer({ modality, page }: { modality: string; page: number }) {
  const normalizedModality = normalizeModality(modality);
  const filteredProducts =
    normalizedModality === "all"
      ? PRODUCTS
      : PRODUCTS.filter((product) => product.modality === normalizedModality);

  const totalCount = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const products = filteredProducts.slice(start, start + PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Remote Products (RSC)</h2>
        <p className="text-sm text-gray-500">
          Path-based URL: /products/{normalizedModality}/page/{currentPage}
        </p>
      </div>

      <ProductsClient
        modality={normalizedModality}
        currentPage={currentPage}
        totalPages={totalPages}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {products.map((product) => (
          <article key={product.id} className="rounded-lg border border-gray-200 bg-white p-3">
            <h3 className="font-medium text-gray-900">{product.name}</h3>
            <p className="text-xs text-gray-600 mt-1 uppercase">{product.modality}</p>
            <p className="text-sm text-gray-700 mt-2">${product.price}</p>
          </article>
        ))}
      </div>

      <p className="text-sm text-gray-600">
        Showing page {currentPage} of {totalPages} ({totalCount} total products)
      </p>
    </div>
  );
}
