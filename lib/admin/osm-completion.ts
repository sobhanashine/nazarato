import { createHash } from "node:crypto";
import type { OsmReviewCandidate, OsmReviewContact } from "./osm-review";

export const OSM_COMPLETION_PERMISSION_BASES = [
  "public_factual_contact",
  "unknown",
] as const;

export type OsmCompletionPermissionBasis =
  (typeof OSM_COMPLETION_PERMISSION_BASES)[number];

export type OsmCompletionContact = Partial<
  Pick<OsmReviewContact, "phone" | "address" | "website" | "instagram">
>;

export type PreparedOsmCompletionProposal = {
  sourceId: string;
  sourceRef: string;
  permissionBasis: OsmCompletionPermissionBasis;
  contact: OsmCompletionContact;
  payloadHash: string;
};

export type OsmCompletionProposal = {
  id: string;
  businessId: string;
  sourceUrl: string | null;
  sourceWarning: string | null;
  permissionBasis: OsmCompletionPermissionBasis;
  contact: OsmCompletionContact;
  capturedAt: string;
  createdBy: string | null;
};

export type PrepareOsmCompletionProposalResult =
  | { ok: true; value: PreparedOsmCompletionProposal }
  | { ok: false; error: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INPUT_KEYS = new Set([
  "sourceId",
  "sourceRef",
  "permissionBasis",
  "contact",
]);
const CONTACT_KEYS = ["phone", "address", "website", "instagram"] as const;
const CONTACT_KEY_SET: ReadonlySet<string> = new Set(CONTACT_KEYS);
const STORED_PAYLOAD_KEYS = new Set(["contact"]);
const THIRD_PARTY_DIRECTORY_HOSTS = [
  "google.com",
  "goo.gl",
  "neshan.org",
  "nshn.ir",
  "balad.ir",
  "digikala.com",
  "basalam.com",
  "torob.com",
  "snapp.ir",
  "bilbooard.ir",
] as const;
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

function isOsmCompletionPermissionBasis(
  value: unknown,
): value is OsmCompletionPermissionBasis {
  return OSM_COMPLETION_PERMISSION_BASES.some((basis) => basis === value);
}

function asciiDigits(value: string): string {
  return Array.from(value, (character) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(character);
    if (persianIndex >= 0) return String(persianIndex);
    const arabicIndex = ARABIC_DIGITS.indexOf(character);
    return arabicIndex >= 0 ? String(arabicIndex) : character;
  }).join("");
}

function normalizeOneIranianPhone(value: string): string | null {
  let phone = asciiDigits(value).replace(/[^\d+]/g, "");
  if (phone.startsWith("0098")) phone = `+98${phone.slice(4)}`;
  if (phone.startsWith("98") && !phone.startsWith("+")) phone = `+${phone}`;
  if (phone.startsWith("0")) phone = `+98${phone.slice(1)}`;
  return /^\+98\d{10}$/.test(phone) ? phone : null;
}

function normalizePhones(value: string): string | null {
  const supplied = value.split(/[;,/]/).map((phone) => phone.trim());
  if (
    supplied.length === 0 ||
    supplied.length > 3 ||
    supplied.some((phone) => phone.length === 0)
  ) {
    return null;
  }
  const normalized = supplied.map(normalizeOneIranianPhone);
  if (normalized.some((phone) => phone === null)) return null;
  const values = normalized.filter((phone): phone is string => phone !== null);
  const unique = [...new Set(values)];
  return unique.length > 0 && unique.length <= 3 ? unique.join(";") : null;
}

function normalizeAddress(value: string): string | null {
  const normalized = value.normalize("NFKC").replace(/\s+/g, " ").trim();
  return normalized.length >= 3 && normalized.length <= 300 ? normalized : null;
}

function normalizeWebsite(value: string): string | null {
  const raw = value.trim();
  if (!raw || raw.length > 160) return null;
  const candidate = /^https:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (
      url.protocol !== "https:" ||
      !url.hostname.includes(".") ||
      url.username ||
      url.password
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeInstagram(value: string): string | null {
  const raw = value.trim();
  let candidate = raw.replace(/^@/, "");
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      if (
        url.protocol !== "https:" ||
        !["instagram.com", "www.instagram.com"].includes(url.hostname)
      ) {
        return null;
      }
      candidate = url.pathname.split("/").filter(Boolean)[0] ?? "";
    } catch {
      return null;
    }
  }
  return /^[a-z0-9._]{1,30}$/i.test(candidate) ? candidate : null;
}

function parseHttpsSource(value: unknown): URL | null {
  if (typeof value !== "string" || value.trim().length > 500) return null;
  try {
    const url = new URL(value.trim());
    if (
      url.protocol !== "https:" ||
      !url.hostname.includes(".") ||
      url.username ||
      url.password
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function requiredStoredString(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("unexpected OSM completion proposal");
  }
  return value.trim();
}

function readStoredContact(value: unknown): OsmCompletionContact {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, STORED_PAYLOAD_KEYS) ||
    !isRecord(value.contact) ||
    !hasOnlyKeys(value.contact, CONTACT_KEY_SET)
  ) {
    throw new Error("unexpected OSM completion proposal");
  }
  const contact: OsmCompletionContact = {};
  for (const key of CONTACT_KEYS) {
    const stored = value.contact[key];
    if (stored === undefined) continue;
    if (typeof stored !== "string" || stored.trim().length === 0) {
      throw new Error("unexpected OSM completion proposal");
    }
    contact[key] = stored.trim();
  }
  if (Object.keys(contact).length === 0) {
    throw new Error("unexpected OSM completion proposal");
  }
  return contact;
}

function isKnownThirdPartyDirectory(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return THIRD_PARTY_DIRECTORY_HOSTS.some(
    (host) => normalized === host || normalized.endsWith(`.${host}`),
  );
}

function stableJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJson);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stableJson(value[key])]),
  );
}

function payloadHash(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stableJson(value)))
    .digest("hex");
}

export function prepareOsmCompletionProposal(
  value: unknown,
): PrepareOsmCompletionProposalResult {
  if (!isRecord(value) || !hasOnlyKeys(value, INPUT_KEYS)) {
    return { ok: false, error: "اطلاعات پیشنهاد تکمیل معتبر نیست." };
  }
  if (typeof value.sourceId !== "string" || !UUID_PATTERN.test(value.sourceId)) {
    return { ok: false, error: "اطلاعات پیشنهاد تکمیل معتبر نیست." };
  }
  if (
    typeof value.permissionBasis !== "string" ||
    !isOsmCompletionPermissionBasis(value.permissionBasis)
  ) {
    return { ok: false, error: "مبنای استفاده از منبع معتبر نیست." };
  }
  if (!isRecord(value.contact) || !hasOnlyKeys(value.contact, CONTACT_KEY_SET)) {
    return {
      ok: false,
      error: "فقط تلفن، نشانی، وب‌سایت یا اینستاگرام قابل ثبت است.",
    };
  }

  const sourceUrl = parseHttpsSource(value.sourceRef);
  if (!sourceUrl) {
    return { ok: false, error: "آدرس منبع باید یک لینک HTTPS معتبر باشد." };
  }
  if (
    value.permissionBasis === "public_factual_contact" &&
    isKnownThirdPartyDirectory(sourceUrl.hostname)
  ) {
    return {
      ok: false,
      error: "برای منبع دایرکتوری، مبنای مجوز را «نامشخص» انتخاب کن.",
    };
  }

  const contact: OsmCompletionContact = {};
  for (const key of CONTACT_KEYS) {
    const raw = value.contact[key];
    if (raw === undefined || raw === null || raw === "") continue;
    if (typeof raw !== "string") {
      return { ok: false, error: "یکی از فیلدهای تکمیل معتبر نیست." };
    }
    const normalized =
      key === "phone"
        ? normalizePhones(raw)
        : key === "address"
          ? normalizeAddress(raw)
          : key === "website"
            ? normalizeWebsite(raw)
            : normalizeInstagram(raw);
    if (!normalized) {
      return { ok: false, error: "یکی از فیلدهای تکمیل معتبر نیست." };
    }
    contact[key] = normalized;
  }
  if (Object.keys(contact).length === 0) {
    return { ok: false, error: "حداقل یک فیلد معتبر برای تکمیل لازم است." };
  }

  const prepared = {
    sourceId: value.sourceId,
    sourceRef: sourceUrl.toString(),
    permissionBasis: value.permissionBasis,
    contact,
  } satisfies Omit<PreparedOsmCompletionProposal, "payloadHash">;
  return {
    ok: true,
    value: {
      ...prepared,
      payloadHash: payloadHash({
        source_type: "manual_public_facts",
        source_ref: prepared.sourceRef,
        permission_basis: prepared.permissionBasis,
        field_payload: { contact: prepared.contact },
      }),
    },
  };
}

export function validateOsmCompletionTargets(
  proposed: OsmCompletionContact,
  existing: OsmReviewContact,
): { ok: true } | { ok: false; error: string } {
  const wouldOverwrite = Object.keys(proposed).some(
    (key) => Boolean(existing[key as keyof OsmReviewContact]),
  );
  return wouldOverwrite
    ? {
        ok: false,
        error: "فقط فیلدهایی که هنوز در منبع OSM خالی‌اند قابل پیشنهاد هستند.",
      }
    : { ok: true };
}

export function parseOsmCompletionProposalRows(
  value: unknown,
): OsmCompletionProposal[] {
  if (!Array.isArray(value)) {
    throw new Error("unexpected OSM completion proposal response");
  }
  return value.map((rawRow) => {
    if (!isRecord(rawRow)) {
      throw new Error("unexpected OSM completion proposal");
    }
    const permissionBasis = rawRow.permission_basis;
    if (
      rawRow.source_type !== "manual_public_facts" ||
      rawRow.status !== "quarantined" ||
      !isOsmCompletionPermissionBasis(permissionBasis) ||
      (rawRow.created_by !== null && typeof rawRow.created_by !== "string")
    ) {
      throw new Error("unexpected OSM completion proposal");
    }
    const rawSourceRef = requiredStoredString(rawRow.source_ref);
    const source = parseHttpsSource(rawSourceRef);
    if (
      permissionBasis === "public_factual_contact" &&
      source &&
      isKnownThirdPartyDirectory(source.hostname)
    ) {
      throw new Error("unexpected OSM completion proposal");
    }
    return {
      id: requiredStoredString(rawRow.id),
      businessId: requiredStoredString(rawRow.business_id),
      sourceUrl: source?.toString() ?? null,
      sourceWarning: source ? null : "لینک منبع تکمیلی معتبر نیست",
      permissionBasis,
      contact: readStoredContact(rawRow.field_payload),
      capturedAt: requiredStoredString(rawRow.captured_at),
      createdBy:
        typeof rawRow.created_by === "string"
          ? requiredStoredString(rawRow.created_by)
          : null,
    };
  });
}

export function attachOsmCompletionProposals(
  candidates: OsmReviewCandidate[],
  rawRows: unknown,
): OsmReviewCandidate[] {
  const proposals = parseOsmCompletionProposalRows(rawRows).sort(
    (left, right) => {
      const dateOrder = right.capturedAt.localeCompare(left.capturedAt);
      return dateOrder || right.id.localeCompare(left.id);
    },
  );
  const byBusiness = new Map<string, OsmCompletionProposal[]>();
  for (const proposal of proposals) {
    const history = byBusiness.get(proposal.businessId) ?? [];
    history.push(proposal);
    byBusiness.set(proposal.businessId, history);
  }
  return candidates.map((candidate) => ({
    ...candidate,
    completionProposals: byBusiness.get(candidate.businessId) ?? [],
  }));
}
