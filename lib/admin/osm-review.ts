export type OsmReviewCategory = "cafe" | "restaurant";
export type OsmReviewCompleteness = "all" | "complete" | "incomplete";

export type OsmReviewContact = {
  phone?: string;
  website?: string;
  instagram?: string;
  address?: string;
};

export type OsmReviewCandidate = {
  sourceId: string;
  businessId: string;
  name: string;
  slug: string;
  category: OsmReviewCategory;
  city: "رشت";
  businessStatus: "pending";
  sourceStatus: "quarantined";
  sourceUrl: string | null;
  licenseName: string;
  licenseUrl: string | null;
  attributionText: string;
  sourceWarning: string | null;
  capturedAt: string;
  latitude: number | null;
  longitude: number | null;
  contact: OsmReviewContact;
  completenessScore: number;
  completenessTotal: 4;
  missingFields: string[];
};

export type OsmReviewFilters = {
  query: string;
  category: "all" | OsmReviewCategory;
  completeness: OsmReviewCompleteness;
};

export type OsmReviewSummary = {
  total: number;
  cafes: number;
  restaurants: number;
  complete: number;
  withPhone: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("unexpected OSM review row");
  }
  return value.trim();
}

function nullableCoordinate(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("unexpected OSM review row");
  }
  return value;
}

function oneBusiness(value: unknown): Record<string, unknown> {
  if (isRecord(value)) return value;
  if (Array.isArray(value) && value.length === 1 && isRecord(value[0])) {
    return value[0];
  }
  throw new Error("unexpected OSM review row");
}

function readContact(fieldPayload: unknown): OsmReviewContact {
  if (!isRecord(fieldPayload)) throw new Error("unexpected OSM review row");
  const rawContact = fieldPayload.contact;
  if (!isRecord(rawContact)) return {};

  const contact: OsmReviewContact = {};
  for (const key of ["phone", "website", "instagram", "address"] as const) {
    const value = rawContact[key];
    if (typeof value === "string" && value.trim().length > 0) {
      contact[key] = value.trim();
    }
  }
  return contact;
}

function safeOsmLinks(
  sourceRef: string,
  licenseUrl: string,
): { sourceUrl: string | null; licenseUrl: string | null; warning: string | null } {
  try {
    const source = new URL(sourceRef);
    const license = new URL(licenseUrl);
    const sourceIsAllowed =
      source.protocol === "https:" &&
      source.hostname === "www.openstreetmap.org" &&
      /^\/(node|way|relation)\/[1-9][0-9]*$/.test(source.pathname) &&
      source.search === "" &&
      source.hash === "";
    const licenseIsAllowed =
      license.href === "https://www.openstreetmap.org/copyright";
    if (sourceIsAllowed && licenseIsAllowed) {
      return { sourceUrl: source.href, licenseUrl: license.href, warning: null };
    }
  } catch {
    // Invalid URLs are represented as a warning and are never rendered as links.
  }
  return {
    sourceUrl: null,
    licenseUrl: null,
    warning: "لینک منبع یا مجوز با قرارداد OSM تطابق ندارد",
  };
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFKC")
    .replaceAll("ي", "ی")
    .replaceAll("ك", "ک")
    .replace(/[\u200c\u200d]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("fa-IR");
}

export function parseOsmReviewRows(value: unknown): OsmReviewCandidate[] {
  if (!Array.isArray(value)) throw new Error("unexpected OSM review response");

  return value.map((rawRow) => {
    if (!isRecord(rawRow)) throw new Error("unexpected OSM review row");
    const business = oneBusiness(rawRow.businesses);
    const sourceType = requiredString(rawRow.source_type);
    const permissionBasis = requiredString(rawRow.permission_basis);
    const sourceStatus = requiredString(rawRow.status);
    const businessStatus = requiredString(business.status);
    const category = requiredString(business.category_slug);
    const city = requiredString(business.city);

    if (
      sourceType !== "open_dataset" ||
      permissionBasis !== "open_license" ||
      sourceStatus !== "quarantined" ||
      businessStatus !== "pending" ||
      (category !== "cafe" && category !== "restaurant") ||
      city !== "رشت"
    ) {
      throw new Error("unexpected OSM review row");
    }

    const sourceRef = requiredString(rawRow.source_ref);
    const licenseUrlValue = requiredString(rawRow.license_url);
    const links = safeOsmLinks(sourceRef, licenseUrlValue);
    const contact = readContact(rawRow.field_payload);
    const fieldChecks = [
      { label: "شماره تماس", present: Boolean(contact.phone) },
      { label: "نشانی", present: Boolean(contact.address) },
      { label: "اینستاگرام", present: Boolean(contact.instagram) },
      { label: "وب‌سایت", present: Boolean(contact.website) },
    ];

    return {
      sourceId: requiredString(rawRow.id),
      businessId: requiredString(business.id),
      name: requiredString(business.name),
      slug: requiredString(business.slug),
      category,
      city: "رشت",
      businessStatus: "pending",
      sourceStatus: "quarantined",
      sourceUrl: links.sourceUrl,
      licenseName: requiredString(rawRow.license_name),
      licenseUrl: links.licenseUrl,
      attributionText: requiredString(rawRow.attribution_text),
      sourceWarning: links.warning,
      capturedAt: requiredString(rawRow.captured_at),
      latitude: nullableCoordinate(business.latitude),
      longitude: nullableCoordinate(business.longitude),
      contact,
      completenessScore: fieldChecks.filter((field) => field.present).length,
      completenessTotal: 4,
      missingFields: fieldChecks
        .filter((field) => !field.present)
        .map((field) => field.label),
    } satisfies OsmReviewCandidate;
  });
}

export function filterOsmReviewCandidates(
  candidates: OsmReviewCandidate[],
  filters: OsmReviewFilters,
): OsmReviewCandidate[] {
  const query = normalizeSearch(filters.query);
  return candidates.filter((candidate) => {
    if (filters.category !== "all" && candidate.category !== filters.category) {
      return false;
    }
    const complete = candidate.completenessScore === candidate.completenessTotal;
    if (filters.completeness === "complete" && !complete) return false;
    if (filters.completeness === "incomplete" && complete) return false;
    if (!query) return true;

    const searchable = normalizeSearch(
      [
        candidate.name,
        candidate.slug,
        candidate.contact.phone,
        candidate.contact.website,
        candidate.contact.instagram,
        candidate.contact.address,
      ]
        .filter((part): part is string => typeof part === "string")
        .join(" "),
    );
    return searchable.includes(query);
  });
}

export function summarizeOsmReviewCandidates(
  candidates: OsmReviewCandidate[],
): OsmReviewSummary {
  return {
    total: candidates.length,
    cafes: candidates.filter((candidate) => candidate.category === "cafe").length,
    restaurants: candidates.filter(
      (candidate) => candidate.category === "restaurant",
    ).length,
    complete: candidates.filter(
      (candidate) => candidate.completenessScore === candidate.completenessTotal,
    ).length,
    withPhone: candidates.filter((candidate) => Boolean(candidate.contact.phone)).length,
  };
}
