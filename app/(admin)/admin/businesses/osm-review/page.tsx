import type { Metadata } from "next";
import { listAdminOsmReviewCandidates } from "@/lib/data/admin-osm-review";
import { countAdminPublishedOsmSources } from "@/lib/data/admin-osm-publication";
import { OsmReviewQueue } from "./OsmReviewQueue";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "صف بررسی داده OSM | نظراتو",
  robots: { index: false, follow: false },
};

export default async function AdminOsmReviewPage() {
  const [candidates, publishedCount] = await Promise.all([
    listAdminOsmReviewCandidates(),
    countAdminPublishedOsmSources(),
  ]);
  return (
    <OsmReviewQueue
      initialCandidates={candidates}
      publishedCount={publishedCount}
    />
  );
}
