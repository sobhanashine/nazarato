import { createHash } from "node:crypto";
import { parseGolsarExport } from "../preview/golsar.ts";

function identity(placeId: string): string {
  const hex = createHash("sha256").update(`nazarato:staging:golsar:${placeId}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/** Project factual fields only. Approval here is scoped to the isolated staging schema. */
export function prepareStagingGolsar(input: unknown) {
  return parseGolsarExport(input).map(cafe => {
    const contact = {
      address: cafe.address || cafe.street,
      ...(cafe.phone ? { phone: cafe.phone } : {}),
      ...(cafe.instagram ? { instagram: new URL(cafe.instagram).pathname.split("/").filter(Boolean)[0] } : {}),
    };
    const fieldPayload = {
      name: cafe.name, category_slug: "cafe", city: "رشت", contact,
      latitude: cafe.latitude, longitude: cafe.longitude,
      source_provider: "google_maps_via_apify", source_place_id: cafe.id,
      publication_status: "not_approved", permission_basis: "unknown",
      usage_scope: "staging_only", owner_verified: false,
      source_name: cafe.sourceName, captured_at: cafe.capturedAt,
      reported_closed: cafe.closed,
    };
    return {
      id: identity(cafe.id), slug: cafe.id, name: cafe.name,
      type: "company", category_slug: "cafe", city: "رشت",
      initial: cafe.name.replace(/کافه/g, "").trim().charAt(0) || "ک",
      color: "#7B89FF", contact,
      latitude: cafe.latitude, longitude: cafe.longitude,
      description: `${cafe.name} در فهرست منتخب گلسار و اطراف برای بررسی نسخهٔ آزمایشی است. اطلاعات اولیه از Google Maps گرفته شده و مالک آن را تأیید نکرده است.${cafe.closed ? " بسته‌بودن این کافه در منبع گزارش شده؛ پیش از مراجعه بررسی کنید." : ""}${cafe.categoryNote ? ` ${cafe.categoryNote}` : ""}`,
      info: [
        { label: "نشانی", value: cafe.address || cafe.street },
        { label: "منبع اطلاعات", value: "Google Maps؛ فهرست اولیهٔ بررسی staging" },
        { label: "تاریخ برداشت", value: new Date(cafe.capturedAt).toLocaleDateString("fa-IR") },
        ...(cafe.closed ? [{ label: "وضعیت فعالیت", value: "بسته‌بودن در منبع گزارش شده؛ نیازمند بررسی" }] : []),
        ...(cafe.categoryNote ? [{ label: "توضیح دسته‌بندی", value: cafe.categoryNote }] : []),
      ],
      source_ref: cafe.sourceUrl, captured_at: cafe.capturedAt,
      field_payload: fieldPayload,
      payload_hash: createHash("sha256").update(JSON.stringify(fieldPayload)).digest("hex"),
      priority: cafe.priority,
    };
  });
}
