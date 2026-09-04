/**
 * Server-side read model for the private Rasht OSM review queue.
 * Authorization is repeated here because the service-role client bypasses RLS.
 */
import { requireAdmin } from "@/lib/auth/admin";
import {
  parseOsmReviewRows,
  type OsmReviewCandidate,
} from "../admin/osm-review";
import { supabaseAdmin } from "@/lib/supabase/server";

const OSM_REVIEW_SELECT = `
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

  return parseOsmReviewRows(data ?? []);
}
