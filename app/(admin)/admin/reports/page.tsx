import { listReportedReviews } from "@/lib/data/admin";
import { ReportsAdminClient } from "./ReportsAdminClient";

export const dynamic = "force-dynamic";

// Auth + admin-role gate lives in app/(admin)/layout.tsx.
export default async function AdminReportsPage() {
  const reviews = await listReportedReviews();
  return <ReportsAdminClient initialReports={reviews} />;
}
