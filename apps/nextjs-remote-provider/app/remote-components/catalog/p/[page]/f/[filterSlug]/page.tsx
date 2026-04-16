import { Suspense } from "react";
import { ExposeRemoteComponent } from "remote-components/remote/nextjs/app";
import { CatalogServer } from "./catalog.server";

// With cacheComponents enabled, all uncached async data access must be inside Suspense.
// This page uses "use cache" to make the entire page cacheable.

type CatalogPageParams = {
  page: string;
  filterSlug: string;
};

async function CatalogContent({ params }: { params: Promise<CatalogPageParams> }) {
  "use cache"
  const resolvedParams = await params;
  const parsedPage = Number.parseInt(resolvedParams.page, 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  return (
    <ExposeRemoteComponent>
      <CatalogServer page={page} filterSlug={resolvedParams.filterSlug} />
    </ExposeRemoteComponent>
  );
}

export default function CatalogRemotePage({
  params,
}: {
  params: Promise<CatalogPageParams>;
}) {
  return (
    <Suspense fallback={<div className="p-5 text-gray-500">Loading catalog...</div>}>
      <CatalogContent params={params} />
    </Suspense>
  );
}
