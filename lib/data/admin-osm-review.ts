/**
 * Server-side read model for the private Rasht OSM review queue.
 * Authorization is repeated here because the service-role client bypasses RLS.
 */
import { requireAdmin } from "@/lib/auth/admin";
import {
  attachOsmSourceReviewEvents,
  parseOsmReviewRows,
  type OsmReviewCandidate,
} from "../admin/osm-review";
import { attachOsmCompletionProposals } from "../admin/osm-completion";
import { supabaseAdmin } from "@/lib/supabase/server";

export const OSM_REVIEW_SELECT = `
  id,
  source_type,
  source_ref,
  permission_basis,
  license_name,
  license_url,
  attribution_text,
  field_payload,
  captured_at,
  status,
  businesses!inner (
    id,
    name,
    slug,
    category_slug,
    city,
    status,
    latitude,
    longitude
  )
`;

export async function listAdminOsmReviewCandidates(): Promise<
  OsmReviewCandidate[]
> {
  const admin = await requireAdmin();
  const { data, error } = await supabaseAdmin()
    .from("business_sources")
    .select(OSM_REVIEW_SELECT)
    .eq("source_type", "open_dataset")
    .eq("permission_basis", "open_license")
    .eq("status", "quarantined")
    .eq("businesses.status", "pending")
    .eq("businesses.city", "رشت")
    .like("source_ref", "https://www.openstreetmap.org/%")
    .order("captured_at", { ascending: true });

  if (error) {
    console.error("[admin/osm-review] failed to read quarantined candidates", {
      route: "/admin/businesses/osm-review",
      userId: admin.id,
      code: error.code,
      message: error.message,
    });
    throw new Error("admin OSM review list failed");
  }

  const candidates = parseOsmReviewRows(data ?? []);
  if (candidates.length === 0) return candidates;

  const { data: reviewEvents, error: reviewError } = await supabaseAdmin()
    .from("business_source_review_events")
    .select("id,source_id,decision,note,criteria_snapshot,created_at")
    .in(
      "source_id",
      candidates.map((candidate) => candidate.sourceId),
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (reviewError) {
    console.error("[admin/osm-review] failed to read decision history", {
      route: "/admin/businesses/osm-review",
      userId: admin.id,
      code: reviewError.code,
      message: reviewError.message,
    });
    throw new Error("admin OSM review history failed");
  }

  const reviewedCandidates = attachOsmSourceReviewEvents(
    candidates,
    reviewEvents ?? [],
  );
  const businessIds = [
    ...new Set(candidates.map((candidate) => candidate.businessId)),
  ];
  const { data: completionProposals, error: completionError } =
    await supabaseAdmin()
      .from("business_sources")
      .select(
        "id,business_id,source_type,source_ref,permission_basis,field_payload,captured_at,status,created_by",
      )
      .in("business_id", businessIds)
      .eq("source_type", "manual_public_facts")
      .eq("status", "quarantined")
      .order("captured_at", { ascending: false });

  if (completionError) {
    console.error("[admin/osm-review] failed to read completion history", {
      route: "/admin/businesses/osm-review",
      userId: admin.id,
      code: completionError.code,
      message: completionError.message,
    });
    throw new Error("admin OSM completion history failed");
  }

  return attachOsmCompletionProposals(
    reviewedCandidates,
    completionProposals ?? [],
  );
}
