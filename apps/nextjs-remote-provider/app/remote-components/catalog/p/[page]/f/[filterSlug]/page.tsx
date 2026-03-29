import { RemoteComponent } from "remote-components/next";
import { CatalogServer } from "./catalog.server";

// Note: revalidate route segment config is not compatible with cacheComponents.
// Use "use cache" + cacheTag() for caching instead.

type CatalogPageParams = {
  page: string;
  filterSlug: string;
};

export default async function CatalogRemotePage({
  params,
}: {
  params: Promise<CatalogPageParams>;
}) {
  const resolvedParams = await params;
  const parsedPage = Number.parseInt(resolvedParams.page, 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  return (
    <RemoteComponent>
      <CatalogServer page={page} filterSlug={resolvedParams.filterSlug} />
    </RemoteComponent>
  );
}
