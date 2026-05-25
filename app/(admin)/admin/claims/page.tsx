import { listPendingClaims } from "@/lib/data/claims";
import { ClaimsQueueClient } from "./ClaimsQueueClient";

export const dynamic = "force-dynamic";

export default async function AdminClaimsPage() {
  // Auth + role gate is in app/(admin)/layout.tsx.
  const claims = await listPendingClaims();
  return <ClaimsQueueClient initialClaims={claims} />;
}
