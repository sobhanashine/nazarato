import { listAdminUsers } from "@/lib/data/admin";
import { UsersAdminClient } from "./UsersAdminClient";

export const dynamic = "force-dynamic";

// Auth + admin-role gate lives in app/(admin)/layout.tsx.
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const users = await listAdminUsers(q);
  return <UsersAdminClient initialUsers={users} query={q ?? ""} />;
}
