import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/server";
import { validateOsmPublicationApprovalInput } from "../admin/osm-publication";

export type ApproveAdminOsmPublicationResult =
  | {
      ok: true;
      noAction: boolean;
      sourceId: string;
      businessId: string;
      eventId: string;
    }
  | { ok: false; error: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseApprovalResponse(
  value: unknown,
): Extract<ApproveAdminOsmPublicationResult, { ok: true }> | null {
  if (!isRecord(value)) return null;
  const noAction = value.noAction;
  const sourceId = value.sourceId;
  const businessId = value.businessId;
  const eventId = value.eventId;
  if (
    typeof noAction !== "boolean" ||
    typeof sourceId !== "string" ||
    !UUID_PATTERN.test(sourceId) ||
    typeof businessId !== "string" ||
    !UUID_PATTERN.test(businessId) ||
    typeof eventId !== "string" ||
    !UUID_PATTERN.test(eventId)
  ) {
    return null;
  }
  return { ok: true, noAction, sourceId, businessId, eventId };
}

export async function approveAdminOsmPublication(
  rawInput: unknown,
): Promise<ApproveAdminOsmPublicationResult> {
  const admin = await requireAdmin();
  const validation = validateOsmPublicationApprovalInput(rawInput);
  if (!validation.ok) return validation;
  const input = validation.value;

  const { data, error } = await supabaseAdmin().rpc(
    "approve_osm_business_source_for_publication",
    {
      p_source_id: input.sourceId,
      p_reviewer_id: admin.id,
      p_confirmation_slug: input.confirmationSlug,
    },
  );

  if (error) {
    console.error("[admin/osm-publication] atomic approval failed", {
      route: "/admin/businesses/osm-review",
      userId: admin.id,
      sourceId: input.sourceId,
      code: error.code,
      message: error.message,
    });
    return {
      ok: false,
      error: "این رکورد دیگر شرایط انتشار را ندارد؛ صفحه را تازه کن و دوباره بررسی کن.",
    };
  }

  const parsed = parseApprovalResponse(data);
  if (!parsed) {
    console.error("[admin/osm-publication] invalid approval response", {
      route: "/admin/businesses/osm-review",
      userId: admin.id,
      sourceId: input.sourceId,
      payloadShape: Array.isArray(data) ? "array" : typeof data,
    });
    return { ok: false, error: "پاسخ ثبت انتشار معتبر نبود." };
  }
  return parsed;
}

export async function countAdminPublishedOsmSources(): Promise<number> {
  const admin = await requireAdmin();
  const { count, error } = await supabaseAdmin()
    .from("business_sources")
    .select("id,businesses!inner(id)", { count: "exact", head: true })
    .eq("source_type", "open_dataset")
    .eq("permission_basis", "open_license")
    .eq("status", "approved")
    .eq("businesses.status", "active")
    .eq("businesses.city", "رشت")
    .like("source_ref", "https://www.openstreetmap.org/%");

  if (error) {
    console.error("[admin/osm-publication] published count failed", {
      route: "/admin/businesses/osm-review",
      userId: admin.id,
      code: error.code,
      message: error.message,
    });
    throw new Error("admin OSM publication count failed");
  }
  return count ?? 0;
}
