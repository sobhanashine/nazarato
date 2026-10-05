import {
  executeBusinessImport,
  prepareBusinessImport,
  type BusinessImportIssue,
  type BusinessImportPlan,
  type BusinessImportRepository,
} from "./business-import.ts";

export type OsmBatchIssue = BusinessImportIssue;

export type OsmBatchPlan = {
  items: Array<{
    index: number;
    input: unknown;
    plan: BusinessImportPlan;
  }>;
  summary: {
    planned: number;
    cafes: number;
    restaurants: number;
  };
};

export type PlanOsmBatchResult =
  | { ok: true; value: OsmBatchPlan }
  | { ok: false; issues: OsmBatchIssue[] };

export type ExecuteOsmBatchResult =
  | {
      ok: true;
      value: {
        planned: number;
        businessesCreated: number;
        sourcesCreated: number;
        existingBusinesses: number;
        existingSources: number;
        manualReviewRequired: number;
      };
    }
  | { ok: false; issues: OsmBatchIssue[] };

export type RemoteOsmBusiness = {
  id: string;
  slug: string;
  status: string;
};

export type RemoteOsmSource = {
  business_id: string;
  payload_hash: string;
  status: string;
};

export type OsmRemoteState = {
  safe: boolean;
  newCount: number;
  resumableCount: number;
  idempotentCount: number;
  issues: Array<{ slug: string; message: string }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function prefixedIssue(index: number, issue: BusinessImportIssue): OsmBatchIssue {
  return {
    path: `imports[${index}].${issue.path}`,
    message: issue.message,
  };
}

function validateOsmIdentity(
  index: number,
  plan: BusinessImportPlan,
): OsmBatchIssue[] {
  const issues: OsmBatchIssue[] = [];
  const source = plan.source;
  const business = plan.business;

  if (plan.publishable || business.status !== "pending" || source.status !== "quarantined") {
    issues.push({
      path: `imports[${index}].source.publicationApproved`,
      message: "This runner accepts quarantined imports only; publication must stay false.",
    });
  }
  if (source.source_type !== "open_dataset" || source.permission_basis !== "open_license") {
    issues.push({
      path: `imports[${index}].source`,
      message: "This runner accepts OpenStreetMap open-dataset sources only.",
    });
  }
  if (
    source.license_name !== "ODbL-1.0" ||
    source.license_url !== "https://www.openstreetmap.org/copyright" ||
    source.attribution_text !== "© OpenStreetMap contributors"
  ) {
    issues.push({
      path: `imports[${index}].source.licenseName`,
      message: "OpenStreetMap ODbL attribution metadata must match the reviewed snapshot.",
    });
  }
  if (business.city !== "رشت") {
    issues.push({
      path: `imports[${index}].business.city`,
      message: "The Rasht pilot runner accepts city=رشت only.",
    });
  }
  if (business.category_slug !== "cafe" && business.category_slug !== "restaurant") {
    issues.push({
      path: `imports[${index}].business.categorySlug`,
      message: "The Rasht pilot runner accepts cafe and restaurant only.",
    });
  }

  let sourcePath = "";
  try {
    const sourceUrl = new URL(source.source_ref);
    if (sourceUrl.protocol !== "https:" || sourceUrl.hostname !== "www.openstreetmap.org") {
      throw new Error("Unexpected source origin");
    }
    sourcePath = sourceUrl.pathname;
  } catch {
    issues.push({
      path: `imports[${index}].source.sourceRef`,
      message: "Source reference must be a direct HTTPS OpenStreetMap element URL.",
    });
    return issues;
  }

  const element = sourcePath.match(/^\/(node|way|relation)\/([1-9][0-9]*)$/);
  if (!element) {
    issues.push({
      path: `imports[${index}].source.sourceRef`,
      message: "Source reference must identify one OpenStreetMap node, way, or relation.",
    });
    return issues;
  }

  const expectedSlug = `rasht-osm-${element[1]}-${element[2]}`;
  if (business.slug !== expectedSlug) {
    issues.push({
      path: `imports[${index}].business.slug`,
      message: `Slug must match its OpenStreetMap identity (${expectedSlug}).`,
    });
  }

  return issues;
}

export function planOsmQuarantinedBatch(snapshot: unknown): PlanOsmBatchResult {
  if (!isRecord(snapshot) || !Array.isArray(snapshot.imports)) {
    return {
      ok: false,
      issues: [{ path: "imports", message: "Snapshot must contain an imports array." }],
    };
  }
  if (snapshot.imports.length === 0) {
    return {
      ok: false,
      issues: [{ path: "imports", message: "Snapshot must contain at least one import." }],
    };
  }

  const issues: OsmBatchIssue[] = [];
  if (!isRecord(snapshot.manifest)) {
    issues.push({ path: "manifest", message: "Snapshot manifest is required." });
  } else {
    if (snapshot.manifest.source !== "OpenStreetMap contributors") {
      issues.push({
        path: "manifest.source",
        message: "Snapshot source must be OpenStreetMap contributors.",
      });
    }
    if (snapshot.manifest.selectedCount !== snapshot.imports.length) {
      issues.push({
        path: "manifest.selectedCount",
        message: "Manifest count must match the imports array length.",
      });
    }
  }

  const items: OsmBatchPlan["items"] = [];
  const slugs = new Set<string>();
  const hashes = new Set<string>();

  snapshot.imports.forEach((input, index) => {
    const prepared = prepareBusinessImport(input);
    if (!prepared.ok) {
      issues.push(...prepared.issues.map((issue) => prefixedIssue(index, issue)));
      return;
    }

    issues.push(...validateOsmIdentity(index, prepared.value));
    if (slugs.has(prepared.value.business.slug)) {
      issues.push({
        path: `imports[${index}].business.slug`,
        message: "Duplicate business slug inside the snapshot.",
      });
    }
    if (hashes.has(prepared.value.source.payload_hash)) {
      issues.push({
        path: `imports[${index}].source`,
        message: "Duplicate source payload inside the snapshot.",
      });
    }
    slugs.add(prepared.value.business.slug);
    hashes.add(prepared.value.source.payload_hash);
    items.push({ index, input, plan: prepared.value });
  });

  if (issues.length > 0) return { ok: false, issues };

  return {
    ok: true,
    value: {
      items,
      summary: {
        planned: items.length,
        cafes: items.filter((item) => item.plan.business.category_slug === "cafe").length,
        restaurants: items.filter(
          (item) => item.plan.business.category_slug === "restaurant",
        ).length,
      },
    },
  };
}

export async function executeOsmQuarantinedBatch(
  snapshot: unknown,
  repository: BusinessImportRepository,
): Promise<ExecuteOsmBatchResult> {
  const planned = planOsmQuarantinedBatch(snapshot);
  if (!planned.ok) return planned;

  let businessesCreated = 0;
  let sourcesCreated = 0;
  let manualReviewRequired = 0;

  for (const item of planned.value.items) {
    const result = await executeBusinessImport(item.input, repository);
    if (!result.ok) {
      return {
        ok: false,
        issues: result.issues.map((issue) => prefixedIssue(item.index, issue)),
      };
    }
    if (
      result.value.publishable ||
      result.value.business.status !== "pending" ||
      result.value.source.status !== "quarantined"
    ) {
      throw new Error("OSM quarantine invariant changed between planning and execution.");
    }
    businessesCreated += Number(result.value.businessCreated);
    sourcesCreated += Number(result.value.sourceCreated);
    manualReviewRequired += Number(result.value.requiresManualReview);
  }

  return {
    ok: true,
    value: {
      planned: planned.value.summary.planned,
      businessesCreated,
      sourcesCreated,
      existingBusinesses: planned.value.summary.planned - businessesCreated,
      existingSources: planned.value.summary.planned - sourcesCreated,
      manualReviewRequired,
    },
  };
}

export function classifyOsmRemoteState(
  plan: OsmBatchPlan,
  businesses: RemoteOsmBusiness[],
  sources: RemoteOsmSource[],
): OsmRemoteState {
  const businessBySlug = new Map(businesses.map((business) => [business.slug, business]));
  const sourcesByBusiness = new Map<string, RemoteOsmSource[]>();
  for (const source of sources) {
    const current = sourcesByBusiness.get(source.business_id) ?? [];
    current.push(source);
    sourcesByBusiness.set(source.business_id, current);
  }

  let newCount = 0;
  let resumableCount = 0;
  let idempotentCount = 0;
  const issues: OsmRemoteState["issues"] = [];

  for (const item of plan.items) {
    const slug = item.plan.business.slug;
    const business = businessBySlug.get(slug);
    if (!business) {
      newCount += 1;
      continue;
    }
    if (business.status !== "pending") {
      issues.push({
        slug,
        message: "Existing business is not a safe pending OSM import row.",
      });
      continue;
    }

    const businessSources = sourcesByBusiness.get(business.id) ?? [];
    const exactSource = businessSources.find(
      (source) => source.payload_hash === item.plan.source.payload_hash,
    );
    if (exactSource?.status === "quarantined" && businessSources.length === 1) {
      idempotentCount += 1;
      continue;
    }
    if (businessSources.length === 0) {
      resumableCount += 1;
      continue;
    }
    issues.push({
      slug,
      message: "Existing pending business has unmatched or non-quarantined provenance.",
    });
  }

  return {
    safe: issues.length === 0,
    newCount,
    resumableCount,
    idempotentCount,
    issues,
  };
}
