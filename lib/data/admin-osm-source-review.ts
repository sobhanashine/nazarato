import { requireAdmin } from "@/lib/auth/admin";
import {
  criteriaSnapshotForCandidate,
  validateOsmSourceReviewInput,
} from "../admin/osm-source-review";
import { parseOsmReviewRows } from "../admin/osm-review";
import { supabaseAdmin } from "@/lib/supabase/server";
import { OSM_REVIEW_SELECT } from "./admin-osm-review";

export type RecordOsmSourceReviewResult =
  | { ok: true; noAction: boolean }
  | { ok: false; error: string };

export async function recordAdminOsmSourceReviewDecision(
  rawInput: unknown,
): Promise<RecordOsmSourceReviewResult> {
  const admin = await requireAdmin();
  const validation = validateOsmSourceReviewInput(rawInput);
  if (!validation.ok) return validation;
  const input = validation.value;
  const database = supabaseAdmin();

  const { data: source, error: sourceError } = await database
    .from("business_sources")
    .select(OSM_REVIEW_SELECT)
    .eq("id", input.sourceId)
    .eq("source_type", "open_dataset")
    .eq("permission_basis", "open_license")
    .eq("status", "quarantined")
    .eq("businesses.status", "pending")
    .eq("businesses.city", "رشت")
    .like("source_ref", "https://www.openstreetmap.org/%")
    .maybeSingle();

  if (sourceError || !source) {
    console.error("[admin/osm-review] source decision target unavailable", {
      route: "/admin/businesses/osm-review",
      userId: admin.id,
      sourceId: input.sourceId,
      code: sourceError?.code,
      message: sourceError?.message,
    });
    return { ok: false, error: "این رکورد برای بررسی در دسترس نیست." };
  }

  let candidate;
  try {
    [candidate] = parseOsmReviewRows([source]);
  } catch (error: unknown) {
    console.error("[admin/osm-review] source decision target invalid", {
      route: "/admin/businesses/osm-review",
      userId: admin.id,
      sourceId: input.sourceId,
      error,
    });
    return { ok: false, error: "این رکورد برای بررسی در دسترس نیست." };
  }

  const { data: latest, error: latestError } = await database
    .from("business_source_review_events")
    .select("decision,note")
    .eq("source_id", input.sourceId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    console.error("[admin/osm-review] latest source decision read failed", {
      route: "/admin/businesses/osm-review",
      userId: admin.id,
      sourceId: input.sourceId,
      code: latestError.code,
      message: latestError.message,
    });
    return { ok: false, error: "ثبت تصمیم فعلاً ممکن نیست." };
  }
  if (latest?.decision === input.decision && latest.note === input.note) {
    return { ok: true, noAction: true };
  }

  const { error: insertError } = await database
    .from("business_source_review_events")
    .insert({
      source_id: input.sourceId,
      reviewer_id: admin.id,
      decision: input.decision,
      note: input.note,
      criteria_snapshot: criteriaSnapshotForCandidate(candidate),
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[admin/osm-review] source decision insert failed", {
      route: "/admin/businesses/osm-review",
      userId: admin.id,
      sourceId: input.sourceId,
      code: insertError.code,
      message: insertError.message,
    });
    return { ok: false, error: "ثبت تصمیم فعلاً ممکن نیست." };
  }

  return { ok: true, noAction: false };
}
