import { readFile } from "node:fs/promises";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  classifyOsmRemoteState,
  executeOsmQuarantinedBatch,
  planOsmQuarantinedBatch,
  type OsmBatchPlan,
  type RemoteOsmBusiness,
  type RemoteOsmSource,
} from "../lib/import/osm-quarantine-batch.ts";
import { createSupabaseBusinessImportRepository } from "../lib/import/supabase-business-import.ts";

type RunMode = "dry-run" | "apply-quarantined";

type RemoteSnapshot = {
  businesses: RemoteOsmBusiness[];
  sources: RemoteOsmSource[];
};

const snapshotUrl = new URL("../data/rasht-osm-businesses.json", import.meta.url);

function parseMode(args: string[]): RunMode {
  if (args.length === 0 || (args.length === 1 && args[0] === "--dry-run")) {
    return "dry-run";
  }
  if (args.length === 1 && args[0] === "--apply-quarantined") {
    return "apply-quarantined";
  }
  throw new Error("Use either --dry-run (default) or --apply-quarantined.");
}

function readString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Unexpected remote ${field}.`);
  }
  return value;
}

function parseRemoteBusinesses(value: unknown): RemoteOsmBusiness[] {
  if (!Array.isArray(value)) throw new Error("Unexpected remote businesses response.");
  return value.map((row) => {
    if (typeof row !== "object" || row === null || Array.isArray(row)) {
      throw new Error("Unexpected remote business row.");
    }
    const record = row as Record<string, unknown>;
    return {
      id: readString(record.id, "business id"),
      slug: readString(record.slug, "business slug"),
      status: readString(record.status, "business status"),
    };
  });
}

function parseRemoteSources(value: unknown): RemoteOsmSource[] {
  if (!Array.isArray(value)) throw new Error("Unexpected remote sources response.");
  return value.map((row) => {
    if (typeof row !== "object" || row === null || Array.isArray(row)) {
      throw new Error("Unexpected remote source row.");
    }
    const record = row as Record<string, unknown>;
    return {
      business_id: readString(record.business_id, "source business id"),
      payload_hash: readString(record.payload_hash, "source payload hash"),
      status: readString(record.status, "source status"),
    };
  });
}

async function readRemoteSnapshot(
  client: SupabaseClient,
  plan: OsmBatchPlan,
): Promise<RemoteSnapshot> {
  const slugs = plan.items.map((item) => item.plan.business.slug);
  const { data: businessData, error: businessError } = await client
    .from("businesses")
    .select("id,slug,status")
    .in("slug", slugs);
  if (businessError) {
    console.error("OSM import preflight failed", {
      stage: "business-read",
      code: businessError.code,
      message: businessError.message,
    });
    throw new Error("Could not read existing business identities.");
  }

  const businesses = parseRemoteBusinesses(businessData);
  const businessIds = businesses.map((business) => business.id);
  if (businessIds.length === 0) return { businesses, sources: [] };

  const { data: sourceData, error: sourceError } = await client
    .from("business_sources")
    .select("business_id,payload_hash,status")
    .in("business_id", businessIds);
  if (sourceError) {
    console.error("OSM import preflight failed", {
      stage: "source-read",
      code: sourceError.code,
      message: sourceError.message,
    });
    throw new Error("Could not read existing source provenance.");
  }

  return { businesses, sources: parseRemoteSources(sourceData) };
}

function assertSafeState(plan: OsmBatchPlan, remote: RemoteSnapshot) {
  const state = classifyOsmRemoteState(plan, remote.businesses, remote.sources);
  if (!state.safe) {
    console.error("OSM import stopped by collision guard", { issues: state.issues });
    throw new Error("Remote rows do not satisfy the quarantined import contract.");
  }
  return state;
}

async function main(): Promise<void> {
  const mode = parseMode(process.argv.slice(2));
  const rawSnapshot: unknown = JSON.parse(await readFile(snapshotUrl, "utf8"));
  const planned = planOsmQuarantinedBatch(rawSnapshot);
  if (!planned.ok) {
    console.error("OSM snapshot validation failed", { issues: planned.issues });
    throw new Error("The reviewed OSM snapshot is invalid.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server credentials are missing from .env.local.");
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const before = assertSafeState(
    planned.value,
    await readRemoteSnapshot(client, planned.value),
  );

  if (mode === "dry-run") {
    console.log(
      JSON.stringify(
        {
          mode,
          snapshot: planned.value.summary,
          remote: before,
          writesPerformed: 0,
          publicRecords: 0,
        },
        null,
        2,
      ),
    );
    return;
  }

  const executed = await executeOsmQuarantinedBatch(
    rawSnapshot,
    createSupabaseBusinessImportRepository(client),
  );
  if (!executed.ok) {
    console.error("OSM quarantine execution failed", { issues: executed.issues });
    throw new Error("The quarantined import did not complete.");
  }

  const remoteAfter = await readRemoteSnapshot(client, planned.value);
  const after = assertSafeState(planned.value, remoteAfter);
  const expected = planned.value.summary.planned;
  const approvedSources = remoteAfter.sources.filter(
    (source) => source.status === "approved",
  ).length;
  const activeBusinesses = remoteAfter.businesses.filter(
    (business) => business.status === "active",
  ).length;
  if (
    remoteAfter.businesses.length !== expected ||
    remoteAfter.sources.length !== expected ||
    after.newCount !== 0 ||
    after.resumableCount !== 0 ||
    after.idempotentCount !== expected ||
    approvedSources !== 0 ||
    activeBusinesses !== 0
  ) {
    throw new Error("Post-import verification did not prove a fully quarantined batch.");
  }

  console.log(
    JSON.stringify(
      {
        mode,
        snapshot: planned.value.summary,
        before,
        execution: executed.value,
        verification: {
          pendingBusinesses: remoteAfter.businesses.length,
          quarantinedSources: remoteAfter.sources.length,
          activeBusinesses,
          approvedSources,
          publicRecords: 0,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error("Rasht OSM quarantine runner failed", {
    script: "scripts/import-rasht-osm-quarantine.mts",
    error: error instanceof Error ? error.message : "Unknown error",
  });
  process.exitCode = 1;
});
