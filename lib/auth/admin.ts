/**
 * Admin authorization guard, shared by the `(admin)` server actions.
 *
 * The `(admin)` route-group layout already gates *pages*, but server actions
 * run outside that layout, so each one must re-check. `requireAdmin` throws
 * `"unauthorized"` unless the caller is a signed-in admin; callers turn that
 * into a `{ ok: false }` result.
 */
import { getSession } from "@/lib/auth/session";
import { getUserById, type ProfileUser } from "@/lib/data/users";

export async function requireAdmin(): Promise<ProfileUser> {
  const session = await getSession();
  if (!session) throw new Error("unauthorized");
  const user = await getUserById(session.id);
  if (!user || user.role !== "admin") throw new Error("unauthorized");
  return user;
}
