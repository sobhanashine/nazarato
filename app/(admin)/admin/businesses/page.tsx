import { listAdminBusinesses } from "@/lib/data/admin";
import { BusinessesAdminClient } from "./BusinessesAdminClient";

export const dynamic = "force-dynamic";

// Auth + admin-role gate lives in app/(admin)/layout.tsx.
export default async function AdminBusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const businesses = await listAdminBusinesses(q);
  return <BusinessesAdminClient initialBusinesses={businesses} query={q ?? ""} />;
}
