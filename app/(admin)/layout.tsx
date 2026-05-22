import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getUserById } from "@/lib/data/users";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect(`/login?next=/admin/moderation`);
  }

  const user = await getUserById(session.id);
  if (!user || user.role !== "admin") {
    notFound();
  }

  return <>{children}</>;
}
