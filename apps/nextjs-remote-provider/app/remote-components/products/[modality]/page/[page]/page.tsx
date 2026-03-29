import { RemoteComponent } from "remote-components/next";
import { ProductsServer } from "./products.server";

type PageProps = {
  params: Promise<{ modality: string; page: string }>;
};

// Note: revalidate and dynamicParams route segment configs are not compatible
// with cacheComponents. Use "use cache" + cacheTag() for caching instead.

export default async function ProductsPage({ params }: PageProps) {
  const { modality, page } = await params;
  const currentPage = Number.parseInt(page, 10) || 1;

  return (
    <RemoteComponent>
      <ProductsServer modality={modality} page={Math.max(1, currentPage)} />
    </RemoteComponent>
  );
}
