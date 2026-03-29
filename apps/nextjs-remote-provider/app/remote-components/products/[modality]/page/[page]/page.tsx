import { Suspense } from "react";
import { RemoteComponent } from "remote-components/next";
import { ProductsServer } from "./products.server";

type PageProps = {
  params: Promise<{ modality: string; page: string }>;
};

// Note: request data like `params` must be read inside a Suspense boundary when
// cacheComponents/PPR is enabled.

async function ProductsRouteContent({ params }: PageProps) {
  const { modality, page } = await params;
  const currentPage = Number.parseInt(page, 10) || 1;

  return (
    <ProductsServer modality={modality} page={Math.max(1, currentPage)} />
  );
}

export default function ProductsPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500">Loading products...</div>}>
      <RemoteComponent>
        <ProductsRouteContent params={params} />
      </RemoteComponent>
    </Suspense>
  );
}
