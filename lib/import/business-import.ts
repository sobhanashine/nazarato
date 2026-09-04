import { createHash } from "node:crypto";

export const BUSINESS_SOURCE_TYPES = [
  "owner_submission",
  "manual_public_facts",
  "open_dataset",
  "written_permission",
  "development_fixture",
] as const;

export const PERMISSION_BASES = [
  "owner_consent",
  "public_factual_contact",
  "open_license",
  "written_permission",
  "unknown",
] as const;

export type BusinessSourceType = (typeof BUSINESS_SOURCE_TYPES)[number];
export type PermissionBasis = (typeof PERMISSION_BASES)[number];

export type BusinessImportIssue = {
  path: string;
  message: string;
};

export type PreparedBusinessRow = {
  slug: string;
  type: "company" | "ig_shop";
  name: string;
  category_slug: string;
  city: string;
  neighborhood_slug: string | null;
  latitude: number | null;
  longitude: number | null;
  price_band: number | null;
  initial: string;
  color: string;
  contact: Record<string, string>;
  status: "active" | "pending";
};

export type PreparedBusinessSourceRow = {
  source_type: BusinessSourceType;
  source_ref: string;
  permission_basis: PermissionBasis;
  license_name: string | null;
  license_url: string | null;
  attribution_text: string | null;
  field_payload: Record<string, unknown>;
  payload_hash: string;
  captured_at: string;
  status: "approved" | "quarantined";
};

export type BusinessImportPlan = {
  business: PreparedBusinessRow;
  source: PreparedBusinessSourceRow;
  publishable: boolean;
};

export type PrepareBusinessImportResult =
  | { ok: true; value: BusinessImportPlan }
  | { ok: false; issues: BusinessImportIssue[] };

export type BusinessImportPersistenceResult = {
  businessId: string;
  sourceId: string;
  businessCreated: boolean;
  sourceCreated: boolean;
  /** Existing identities stay unchanged until a human reconciles their fields. */
  requiresManualReview: boolean;
};

export interface BusinessImportRepository {
  /** New rows must be persisted as pending until their source row succeeds. */
  upsertBusiness(
    business: PreparedBusinessRow,
  ): Promise<{ id: string; created: boolean }>;
  upsertSource(
    source: PreparedBusinessSourceRow & { business_id: string },
  ): Promise<{ id: string; created: boolean }>;
  markBusinessPublishable(businessId: string): Promise<void>;
}

export type ExecuteBusinessImportResult =
  | {
      ok: true;
      value: BusinessImportPlan & BusinessImportPersistenceResult;
    }
  | { ok: false; issues: BusinessImportIssue[] };

const BUSINESS_KEYS = new Set([
  "slug",
  "type",
  "name",
  "categorySlug",
  "city",
  "neighborhoodSlug",
  "latitude",
  "longitude",
  "priceBand",
  "initial",
  "color",
  "contact",
]);

const SOURCE_KEYS = new Set([
  "sourceType",
  "sourceRef",
  "permissionBasis",
  "licenseName",
  "licenseUrl",
  "attributionText",
  "publicationApproved",
  "capturedAt",
]);

const CONTACT_KEYS = new Set(["phone", "website", "instagram", "address"]);

const PERMISSIONS_BY_SOURCE: Record<BusinessSourceType, PermissionBasis[]> = {
  owner_submission: ["owner_consent", "unknown"],
  manual_public_facts: ["public_factual_contact", "unknown"],
  open_dataset: ["open_license", "unknown"],
  written_permission: ["written_permission", "unknown"],
  development_fixture: ["unknown"],
};

const DEFAULT_COLORS = [
  "#19A77E",
  "#3B82F6",
  "#8B5CF6",
  "#F59E0B",
  "#EC4899",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addUnexpectedKeyIssues(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  path: string,
  issues: BusinessImportIssue[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      issues.push({
        path: `${path}.${key}`,
        message: "Unsupported field; imported profiles may contain factual allowlisted fields only.",
      });
    }
  }
}

function readRequiredString(
  value: unknown,
  path: string,
  issues: BusinessImportIssue[],
  maxLength: number,
): string | undefined {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push({ path, message: "Required non-empty string." });
    return undefined;
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    issues.push({ path, message: `Must be at most ${maxLength} characters.` });
    return undefined;
  }
  return normalized;
}

function readOptionalString(
  value: unknown,
  path: string,
  issues: BusinessImportIssue[],
  maxLength: number,
): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return readRequiredString(value, path, issues, maxLength);
}

function readOptionalNumber(
  value: unknown,
  path: string,
  issues: BusinessImportIssue[],
  min: number,
  max: number,
): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    issues.push({ path, message: `Must be a number between ${min} and ${max}.` });
    return undefined;
  }
  return value;
}

function readEnum<T extends readonly string[]>(
  value: unknown,
  path: string,
  allowed: T,
  issues: BusinessImportIssue[],
): T[number] | undefined {
  if (typeof value !== "string" || !allowed.includes(value as T[number])) {
    issues.push({ path, message: `Must be one of: ${allowed.join(", ")}.` });
    return undefined;
  }
  return value as T[number];
}

function normalizeContact(
  value: unknown,
  issues: BusinessImportIssue[],
): Record<string, string> {
  if (value === undefined || value === null) return {};
  if (!isRecord(value)) {
    issues.push({ path: "business.contact", message: "Must be an object." });
    return {};
  }

  addUnexpectedKeyIssues(value, CONTACT_KEYS, "business.contact", issues);
  const contact: Record<string, string> = {};
  for (const key of CONTACT_KEYS) {
    const normalized = readOptionalString(
      value[key],
      `business.contact.${key}`,
      issues,
      key === "address" ? 300 : 160,
    );
    if (normalized) contact[key] = normalized;
  }
  return contact;
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

function sha256(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stableJson(value)))
    .digest("hex");
}

function defaultColor(slug: string): string {
  const firstByte = Number.parseInt(sha256(slug).slice(0, 2), 16);
  return DEFAULT_COLORS[firstByte % DEFAULT_COLORS.length];
}

/**
 * Validate untrusted importer input and reduce it to the factual allowlist.
 * Unsupported content is rejected instead of being silently copied.
 */
export function prepareBusinessImport(input: unknown): PrepareBusinessImportResult {
  const issues: BusinessImportIssue[] = [];
  if (!isRecord(input)) {
    return { ok: false, issues: [{ path: "$", message: "Import input must be an object." }] };
  }

  const businessValue = input.business;
  const sourceValue = input.source;
  if (!isRecord(businessValue)) {
    issues.push({ path: "business", message: "Required object." });
  }
  if (!isRecord(sourceValue)) {
    issues.push({ path: "source", message: "Required object." });
  }
  if (!isRecord(businessValue) || !isRecord(sourceValue)) {
    return { ok: false, issues };
  }

  addUnexpectedKeyIssues(businessValue, BUSINESS_KEYS, "business", issues);
  addUnexpectedKeyIssues(sourceValue, SOURCE_KEYS, "source", issues);

  const slug = readRequiredString(businessValue.slug, "business.slug", issues, 120);
  if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    issues.push({
      path: "business.slug",
      message: "Use lowercase ASCII letters, numbers, and single hyphens.",
    });
  }

  const businessType =
    businessValue.type === undefined
      ? "company"
      : readEnum(
          businessValue.type,
          "business.type",
          ["company", "ig_shop"] as const,
          issues,
        );
  const name = readRequiredString(businessValue.name, "business.name", issues, 160);
  const categorySlug = readRequiredString(
    businessValue.categorySlug,
    "business.categorySlug",
    issues,
    80,
  );
  const city = readRequiredString(businessValue.city, "business.city", issues, 100);
  const neighborhoodSlug = readOptionalString(
    businessValue.neighborhoodSlug,
    "business.neighborhoodSlug",
    issues,
    100,
  );
  const latitude = readOptionalNumber(
    businessValue.latitude,
    "business.latitude",
    issues,
    -90,
    90,
  );
  const longitude = readOptionalNumber(
    businessValue.longitude,
    "business.longitude",
    issues,
    -180,
    180,
  );
  const priceBand = readOptionalNumber(
    businessValue.priceBand,
    "business.priceBand",
    issues,
    1,
    4,
  );
  if (priceBand !== undefined && !Number.isInteger(priceBand)) {
    issues.push({ path: "business.priceBand", message: "Must be an integer." });
  }
  const initial = readOptionalString(
    businessValue.initial,
    "business.initial",
    issues,
    2,
  );
  const color = readOptionalString(businessValue.color, "business.color", issues, 7);
  if (color && !/^#[0-9a-f]{6}$/i.test(color)) {
    issues.push({ path: "business.color", message: "Must be a six-digit hex color." });
  }
  const contact = normalizeContact(businessValue.contact, issues);

  const sourceType = readEnum(
    sourceValue.sourceType,
    "source.sourceType",
    BUSINESS_SOURCE_TYPES,
    issues,
  );
  const sourceRef = readRequiredString(
    sourceValue.sourceRef,
    "source.sourceRef",
    issues,
    500,
  );
  const permissionBasis = readEnum(
    sourceValue.permissionBasis,
    "source.permissionBasis",
    PERMISSION_BASES,
    issues,
  );
  const licenseName = readOptionalString(
    sourceValue.licenseName,
    "source.licenseName",
    issues,
    120,
  );
  const licenseUrl = readOptionalString(
    sourceValue.licenseUrl,
    "source.licenseUrl",
    issues,
    500,
  );
  if (licenseUrl) {
    try {
      const parsedLicenseUrl = new URL(licenseUrl);
      if (parsedLicenseUrl.protocol !== "https:") throw new Error("not HTTPS");
    } catch {
      issues.push({ path: "source.licenseUrl", message: "Must be a valid HTTPS URL." });
    }
  }
  const attributionText = readOptionalString(
    sourceValue.attributionText,
    "source.attributionText",
    issues,
    300,
  );
  const publicationApproved = sourceValue.publicationApproved;
  if (typeof publicationApproved !== "boolean") {
    issues.push({
      path: "source.publicationApproved",
      message: "Required boolean; false keeps the source quarantined.",
    });
  }
  const capturedAtValue = readRequiredString(
    sourceValue.capturedAt,
    "source.capturedAt",
    issues,
    40,
  );
  const capturedDate = capturedAtValue ? new Date(capturedAtValue) : null;
  if (capturedDate && Number.isNaN(capturedDate.getTime())) {
    issues.push({ path: "source.capturedAt", message: "Must be a valid ISO date-time." });
  }

  if (
    sourceType &&
    permissionBasis &&
    !PERMISSIONS_BY_SOURCE[sourceType].includes(permissionBasis)
  ) {
    issues.push({
      path: "source.permissionBasis",
      message: `Permission basis ${permissionBasis} does not match source type ${sourceType}.`,
    });
  }
  if (
    permissionBasis === "open_license" &&
    (!licenseName || !licenseUrl || !attributionText)
  ) {
    issues.push({
      path: "source.licenseName",
      message: "Open-license imports require license name, HTTPS URL, and attribution text.",
    });
  }
  if (permissionBasis === "unknown" && publicationApproved === true) {
    issues.push({
      path: "source.publicationApproved",
      message: "Unknown permission can never be approved for publication.",
    });
  }

  if (
    issues.length > 0 ||
    !slug ||
    !businessType ||
    !name ||
    !categorySlug ||
    !city ||
    !sourceType ||
    !sourceRef ||
    !permissionBasis ||
    typeof publicationApproved !== "boolean" ||
    !capturedDate
  ) {
    return { ok: false, issues };
  }

  const publishable =
    permissionBasis !== "unknown" &&
    sourceType !== "development_fixture" &&
    publicationApproved;
  const business: PreparedBusinessRow = {
    slug,
    type: businessType,
    name,
    category_slug: categorySlug,
    city,
    neighborhood_slug: neighborhoodSlug ?? null,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    price_band: priceBand ?? null,
    initial: initial ?? Array.from(name)[0] ?? "؟",
    color: color?.toUpperCase() ?? defaultColor(slug),
    contact,
    status: publishable ? "active" : "pending",
  };
  const fieldPayload: Record<string, unknown> = {
    slug: business.slug,
    type: business.type,
    name: business.name,
    category_slug: business.category_slug,
    city: business.city,
    neighborhood_slug: business.neighborhood_slug,
    latitude: business.latitude,
    longitude: business.longitude,
    price_band: business.price_band,
    initial: business.initial,
    color: business.color,
    contact: business.contact,
  };
  const hashInput = {
    source_type: sourceType,
    source_ref: sourceRef,
    permission_basis: permissionBasis,
    license_name: licenseName ?? null,
    license_url: licenseUrl ?? null,
    attribution_text: attributionText ?? null,
    field_payload: fieldPayload,
  };

  return {
    ok: true,
    value: {
      business,
      source: {
        source_type: sourceType,
        source_ref: sourceRef,
        permission_basis: permissionBasis,
        license_name: licenseName ?? null,
        license_url: licenseUrl ?? null,
        attribution_text: attributionText ?? null,
        field_payload: fieldPayload,
        payload_hash: sha256(hashInput),
        captured_at: capturedDate.toISOString(),
        status: publishable ? "approved" : "quarantined",
      },
      publishable,
    },
  };
}

/** Run a validated, duplicate-safe import through the supplied persistence adapter. */
export async function executeBusinessImport(
  input: unknown,
  repository: BusinessImportRepository,
): Promise<ExecuteBusinessImportResult> {
  const prepared = prepareBusinessImport(input);
  if (!prepared.ok) return prepared;

  const business = await repository.upsertBusiness(prepared.value.business);
  const source = await repository.upsertSource({
    ...prepared.value.source,
    business_id: business.id,
  });
  const requiresManualReview = prepared.value.publishable && !business.created;
  if (prepared.value.publishable && business.created) {
    await repository.markBusinessPublishable(business.id);
  }

  return {
    ok: true,
    value: {
      ...prepared.value,
      businessId: business.id,
      sourceId: source.id,
      businessCreated: business.created,
      sourceCreated: source.created,
      requiresManualReview,
    },
  };
}
