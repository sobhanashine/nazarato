import { prepareBusinessImport } from "./business-import.ts";

type JsonRecord = Record<string, unknown>;

export type LegacyBusinessStatus =
  | "positive"
  | "negative"
  | "needs_review"
  | "unmarked";

type RashtDriveCategory = "cafe" | "restaurant";

type BusinessImportInput = {
  business: {
    slug: string;
    name: string;
    categorySlug: RashtDriveCategory;
    city: "رشت";
    contact: Record<string, string>;
  };
  source: {
    sourceType: "manual_public_facts";
    sourceRef: string;
    permissionBasis: "unknown";
    publicationApproved: false;
    capturedAt: string;
  };
};

export type RashtDriveRecord = {
  legacyStatus: LegacyBusinessStatus;
  sourceLocation: {
    spreadsheetId: string;
    sheetId: number;
    sheetTitle: string;
    rowNumber: number;
  };
  importInput: BusinessImportInput;
};

export type RashtDriveSnapshot = {
  manifest: {
    source: "Shared Google Drive research sheet";
    spreadsheetId: string;
    spreadsheetTitle: string;
    sourceModifiedAt: string;
    capturedAt: string;
    selection: string;
    permissionBasis: "unknown";
    publicationApproved: false;
    excludedSourceFields: readonly ["rating", "reviewCount"];
    selectedCount: number;
  };
  records: RashtDriveRecord[];
};

export type RashtDriveSnapshotIssue = {
  path: string;
  message: string;
};

export type BuildRashtDriveSnapshotResult =
  | { ok: true; value: RashtDriveSnapshot }
  | { ok: false; issues: RashtDriveSnapshotIssue[] };

export type RashtDriveMatch = {
  driveName: string;
  osmName: string;
  categorySlug: RashtDriveCategory;
  driveSourceRef: string;
  osmSourceRef: string;
};

export type RashtDriveReviewCandidate = RashtDriveMatch & {
  similarity: number;
};

export type RashtDriveMatchReport = {
  driveCount: number;
  osmCount: number;
  exactMatches: RashtDriveMatch[];
  reviewCandidates: RashtDriveReviewCandidate[];
  unmatchedDriveCount: number;
  autoMergedCount: 0;
};

const ROW_KEYS = new Set([
  "sheetId",
  "sheetTitle",
  "rowNumber",
  "categorySlug",
  "name",
  "instagram",
  "phone",
  "address",
  "website",
  "rating",
  "reviewCount",
]);

const MANIFEST_KEYS = new Set([
  "spreadsheetId",
  "spreadsheetTitle",
  "sourceModifiedAt",
  "capturedAt",
  "selection",
]);

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function addUnexpectedKeyIssues(
  value: JsonRecord,
  allowed: ReadonlySet<string>,
  path: string,
  issues: RashtDriveSnapshotIssue[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      issues.push({ path: `${path}.${key}`, message: "Unsupported field." });
    }
  }
}

function requiredString(
  value: unknown,
  path: string,
  issues: RashtDriveSnapshotIssue[],
  maxLength: number,
): string | undefined {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push({ path, message: "Required non-empty string." });
    return undefined;
  }
  const normalized = normalizeText(value);
  if (normalized.length > maxLength) {
    issues.push({ path, message: `Must be at most ${maxLength} characters.` });
    return undefined;
  }
  return normalized;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? normalizeText(value)
    : undefined;
}

function validIsoDate(
  value: unknown,
  path: string,
  issues: RashtDriveSnapshotIssue[],
): string | undefined {
  const raw = requiredString(value, path, issues, 40);
  if (!raw) return undefined;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    issues.push({ path, message: "Must be a valid ISO date-time." });
    return undefined;
  }
  return date.toISOString();
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

function legacyStatus(name: string): LegacyBusinessStatus {
  if (/❌/u.test(name)) return "negative";
  if (/⚠/u.test(name)) return "needs_review";
  if (/✅/u.test(name)) return "positive";
  return "unmarked";
}

function cleanBusinessName(name: string): string {
  return normalizeText(name.replace(/[✅⚠❌]\uFE0F?/gu, ""));
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

function normalizePhones(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const phones = value
    .split(/[;,/]/)
    .map(normalizeOneIranianPhone)
    .filter((phone): phone is string => phone !== null);
  const unique = [...new Set(phones)];
  return unique.length > 0 ? unique.join(";") : undefined;
}

function normalizeInstagram(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const urlMatch = value.match(/instagram\.com\/([^/?#]+)/i);
  const candidate = (urlMatch?.[1] ?? value).trim().replace(/^@/, "");
  return /^[a-z0-9._]{1,30}$/i.test(candidate) ? candidate : undefined;
}

function normalizeWebsite(value: string | undefined): string | undefined {
  if (!value || /^(?:-|_)+$/.test(value.trim())) return undefined;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".")) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function normalizeAddress(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return normalizeText(value).replace(/\s*-+\s*/g, "، ");
}

function sourceRef(
  spreadsheetId: string,
  sheetId: number,
  rowNumber: number,
): string {
  return `gdrive-spreadsheet:${spreadsheetId}:sheet:${sheetId}:row:${rowNumber}`;
}

function duplicateKey(value: string): string {
  return cleanBusinessName(value)
    .replace(
      /^(?:بیزینس\s+کافه|کافه\s+و\s+رستوران|کافه\s+رستوران|کافی\s+شاپ|تراس\s+رستوران|گروه\s+رستوران|رستوران\s+(?:محلی|سنتی)|کافه|رستوران)\s+/u,
      "",
    )
    .replace(/\s+رشت$/u, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLocaleLowerCase("fa-IR");
}

function bigrams(value: string): string[] {
  if (value.length < 2) return value ? [value] : [];
  return Array.from({ length: value.length - 1 }, (_, index) =>
    value.slice(index, index + 2),
  );
}

function diceSimilarity(left: string, right: string): number {
  const leftPairs = bigrams(left);
  const rightPairs = bigrams(right);
  if (leftPairs.length === 0 || rightPairs.length === 0) return 0;
  const remaining = new Map<string, number>();
  for (const pair of rightPairs) remaining.set(pair, (remaining.get(pair) ?? 0) + 1);
  let overlap = 0;
  for (const pair of leftPairs) {
    const count = remaining.get(pair) ?? 0;
    if (count === 0) continue;
    overlap += 1;
    remaining.set(pair, count - 1);
  }
  return (2 * overlap) / (leftPairs.length + rightPairs.length);
}

export function buildRashtDriveSnapshot(
  input: unknown,
): BuildRashtDriveSnapshotResult {
  const issues: RashtDriveSnapshotIssue[] = [];
  if (!isRecord(input)) {
    return { ok: false, issues: [{ path: "$", message: "Expected an object." }] };
  }
  const manifestValue = input.manifest;
  const rowsValue = input.rows;
  if (!isRecord(manifestValue)) {
    issues.push({ path: "manifest", message: "Required object." });
  }
  if (!Array.isArray(rowsValue)) {
    issues.push({ path: "rows", message: "Required array." });
  }
  if (!isRecord(manifestValue) || !Array.isArray(rowsValue)) {
    return { ok: false, issues };
  }

  addUnexpectedKeyIssues(manifestValue, MANIFEST_KEYS, "manifest", issues);
  const spreadsheetId = requiredString(
    manifestValue.spreadsheetId,
    "manifest.spreadsheetId",
    issues,
    200,
  );
  const spreadsheetTitle = requiredString(
    manifestValue.spreadsheetTitle,
    "manifest.spreadsheetTitle",
    issues,
    200,
  );
  const sourceModifiedAt = validIsoDate(
    manifestValue.sourceModifiedAt,
    "manifest.sourceModifiedAt",
    issues,
  );
  const capturedAt = validIsoDate(
    manifestValue.capturedAt,
    "manifest.capturedAt",
    issues,
  );
  const selection = requiredString(
    manifestValue.selection,
    "manifest.selection",
    issues,
    500,
  );

  const records: RashtDriveRecord[] = [];
  const sourceLocations = new Set<string>();
  for (const [index, rowValue] of rowsValue.entries()) {
    const rowPath = `rows.${index}`;
    if (!isRecord(rowValue)) {
      issues.push({ path: rowPath, message: "Expected an object." });
      continue;
    }
    addUnexpectedKeyIssues(rowValue, ROW_KEYS, rowPath, issues);
    const sheetId = rowValue.sheetId;
    const rowNumber = rowValue.rowNumber;
    if (!Number.isInteger(sheetId) || Number(sheetId) <= 0) {
      issues.push({ path: `${rowPath}.sheetId`, message: "Required positive integer." });
    }
    if (!Number.isInteger(rowNumber) || Number(rowNumber) < 2) {
      issues.push({ path: `${rowPath}.rowNumber`, message: "Required row number >= 2." });
    }
    const sheetTitle = requiredString(
      rowValue.sheetTitle,
      `${rowPath}.sheetTitle`,
      issues,
      160,
    );
    const rawName = requiredString(rowValue.name, `${rowPath}.name`, issues, 180);
    const categorySlug =
      rowValue.categorySlug === "cafe" || rowValue.categorySlug === "restaurant"
        ? rowValue.categorySlug
        : undefined;
    if (!categorySlug) {
      issues.push({
        path: `${rowPath}.categorySlug`,
        message: "Must be cafe or restaurant.",
      });
    }

    const numericSheetId = Number(sheetId);
    const numericRowNumber = Number(rowNumber);
    const locationKey = `${numericSheetId}:${numericRowNumber}`;
    if (sourceLocations.has(locationKey)) {
      issues.push({ path: rowPath, message: "Duplicate source sheet and row." });
    }
    sourceLocations.add(locationKey);

    if (
      !spreadsheetId ||
      !capturedAt ||
      !Number.isInteger(sheetId) ||
      numericSheetId <= 0 ||
      !Number.isInteger(rowNumber) ||
      numericRowNumber < 2 ||
      !sheetTitle ||
      !rawName ||
      !categorySlug
    ) {
      continue;
    }

    const name = cleanBusinessName(rawName);
    if (!name) {
      issues.push({ path: `${rowPath}.name`, message: "Name is empty after cleanup." });
      continue;
    }
    const contact = Object.fromEntries(
      Object.entries({
        instagram: normalizeInstagram(optionalString(rowValue.instagram)),
        phone: normalizePhones(optionalString(rowValue.phone)),
        address: normalizeAddress(optionalString(rowValue.address)),
        website: normalizeWebsite(optionalString(rowValue.website)),
      }).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
    const ref = sourceRef(spreadsheetId, numericSheetId, numericRowNumber);
    const importInput: BusinessImportInput = {
      business: {
        slug: `rasht-drive-${numericSheetId}-${numericRowNumber}`,
        name,
        categorySlug,
        city: "رشت",
        contact,
      },
      source: {
        sourceType: "manual_public_facts",
        sourceRef: ref,
        permissionBasis: "unknown",
        publicationApproved: false,
        capturedAt,
      },
    };
    const prepared = prepareBusinessImport(importInput);
    if (!prepared.ok) {
      issues.push(
        ...prepared.issues.map((issue) => ({
          path: `${rowPath}.importInput.${issue.path}`,
          message: issue.message,
        })),
      );
      continue;
    }
    records.push({
      legacyStatus: legacyStatus(rawName),
      sourceLocation: {
        spreadsheetId,
        sheetId: numericSheetId,
        sheetTitle,
        rowNumber: numericRowNumber,
      },
      importInput,
    });
  }

  if (
    issues.length > 0 ||
    !spreadsheetId ||
    !spreadsheetTitle ||
    !sourceModifiedAt ||
    !capturedAt ||
    !selection
  ) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      manifest: {
        source: "Shared Google Drive research sheet",
        spreadsheetId,
        spreadsheetTitle,
        sourceModifiedAt,
        capturedAt,
        selection,
        permissionBasis: "unknown",
        publicationApproved: false,
        excludedSourceFields: ["rating", "reviewCount"],
        selectedCount: records.length,
      },
      records,
    },
  };
}

type OsmMatchCandidate = {
  name: string;
  categorySlug: RashtDriveCategory;
  sourceRef: string;
};

function osmCandidates(value: unknown): OsmMatchCandidate[] {
  if (!isRecord(value) || !Array.isArray(value.imports)) return [];
  const candidates: OsmMatchCandidate[] = [];
  for (const item of value.imports) {
    if (!isRecord(item) || !isRecord(item.business) || !isRecord(item.source)) continue;
    const name = item.business.name;
    const categorySlug = item.business.categorySlug;
    const sourceRefValue = item.source.sourceRef;
    if (
      typeof name !== "string" ||
      (categorySlug !== "cafe" && categorySlug !== "restaurant") ||
      typeof sourceRefValue !== "string"
    ) {
      continue;
    }
    candidates.push({ name, categorySlug, sourceRef: sourceRefValue });
  }
  return candidates;
}

export function buildRashtDriveMatchReport(
  snapshot: RashtDriveSnapshot,
  osmSnapshot: unknown,
): RashtDriveMatchReport {
  const osm = osmCandidates(osmSnapshot);
  const exactMatches: RashtDriveMatch[] = [];
  const reviewCandidates: RashtDriveReviewCandidate[] = [];
  const exactDriveRefs = new Set<string>();

  for (const record of snapshot.records) {
    const business = record.importInput.business;
    const driveKey = duplicateKey(business.name);
    const exact = osm.find(
      (candidate) =>
        candidate.categorySlug === business.categorySlug &&
        duplicateKey(candidate.name) === driveKey,
    );
    if (!exact) continue;
    exactDriveRefs.add(record.importInput.source.sourceRef);
    exactMatches.push({
      driveName: business.name,
      osmName: exact.name,
      categorySlug: business.categorySlug,
      driveSourceRef: record.importInput.source.sourceRef,
      osmSourceRef: exact.sourceRef,
    });
  }

  for (const record of snapshot.records) {
    const driveSourceRef = record.importInput.source.sourceRef;
    if (exactDriveRefs.has(driveSourceRef)) continue;
    const business = record.importInput.business;
    const driveKey = duplicateKey(business.name);
    if (driveKey.length < 4) continue;
    const candidates = osm
      .filter((candidate) => candidate.categorySlug === business.categorySlug)
      .map((candidate) => ({
        candidate,
        similarity: diceSimilarity(driveKey, duplicateKey(candidate.name)),
      }))
      .filter(({ similarity }) => similarity >= 0.65)
      .sort(
        (left, right) =>
          right.similarity - left.similarity ||
          left.candidate.sourceRef.localeCompare(right.candidate.sourceRef),
      );
    const best = candidates[0];
    if (!best) continue;
    reviewCandidates.push({
      driveName: business.name,
      osmName: best.candidate.name,
      categorySlug: business.categorySlug,
      driveSourceRef,
      osmSourceRef: best.candidate.sourceRef,
      similarity: Number(best.similarity.toFixed(3)),
    });
  }

  exactMatches.sort((left, right) =>
    left.driveSourceRef.localeCompare(right.driveSourceRef),
  );
  reviewCandidates.sort((left, right) =>
    left.driveSourceRef.localeCompare(right.driveSourceRef),
  );

  return {
    driveCount: snapshot.records.length,
    osmCount: osm.length,
    exactMatches,
    reviewCandidates,
    unmatchedDriveCount:
      snapshot.records.length - exactMatches.length - reviewCandidates.length,
    autoMergedCount: 0,
  };
}
