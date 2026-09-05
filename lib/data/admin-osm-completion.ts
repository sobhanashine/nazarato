import { requireAdmin } from "@/lib/auth/admin";
import {
  prepareOsmCompletionProposal,
  validateOsmCompletionTargets,
} from "../admin/osm-completion";
import { parseOsmReviewRows } from "../admin/osm-review";
import { supabaseAdmin } from "@/lib/supabase/server";
import { OSM_REVIEW_SELECT } from "./admin-osm-review";

export type RecordOsmCompletionProposalResult =
  | { ok: true; noAction: boolean }
  | { ok: false; error: string };

export async function recordAdminOsmCompletionProposal(
  rawInput: unknown,
): Promise<RecordOsmCompletionProposalResult> {
  const admin = await requireAdmin();
  const validation = prepareOsmCompletionProposal(rawInput);
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
    console.error("[admin/osm-completion] source target unavailable", {
      route: "/admin/businesses/osm-review",
      userId: admin.id,
      sourceId: input.sourceId,
      code: sourceError?.code,
      message: sourceError?.message,
    });
    return { ok: false, error: "این رکورد برای تکمیل در دسترس نیست." };
  }

  let candidate;
  try {
    [candidate] = parseOsmReviewRows([source]);
  } catch (error: unknown) {
    console.error("[admin/osm-completion] source target invalid", {
      route: "/admin/businesses/osm-review",
      userId: admin.id,
      sourceId: input.sourceId,
      error,
    });
    return { ok: false, error: "این رکورد برای تکمیل در دسترس نیست." };
  }

  if (candidate.prescreen.recommendation !== "needs_completion") {
    return { ok: false, error: "این رکورد در صف نیازمند تکمیل نیست." };
  }

  const targets = validateOsmCompletionTargets(input.contact, candidate.contact);
  if (!targets.ok) return targets;

  const { error: insertError } = await database
    .from("business_sources")
    .insert({
      business_id: candidate.businessId,
      source_type: "manual_public_facts",
      source_ref: input.sourceRef,
      permission_basis: input.permissionBasis,
      license_name: null,
      license_url: null,
      attribution_text: null,
      field_payload: { contact: input.contact },
      payload_hash: input.payloadHash,
      captured_at: new Date().toISOString(),
      status: "quarantined",
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (insertError?.code === "23505") return { ok: true, noAction: true };
  if (insertError) {
    console.error("[admin/osm-completion] proposal insert failed", {
      route: "/admin/businesses/osm-review",
      userId: admin.id,
      sourceId: input.sourceId,
      code: insertError.code,
      message: insertError.message,
    });
    return { ok: false, error: "ثبت پیشنهاد تکمیل فعلاً ممکن نیست." };
  }

  return { ok: true, noAction: false };
}
