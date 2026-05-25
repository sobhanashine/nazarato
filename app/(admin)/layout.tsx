import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { getUserById } from "@/lib/data/users";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    // Preserve which admin page the user was trying to reach.
    const h = await headers();
    const path = h.get("x-invoke-path") || h.get("x-pathname") || "/admin/moderation";
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }

  const user = await getUserById(session.id);
  if (!user || user.role !== "admin") {
    notFound();
  }

  return <>{children}</>;
}
