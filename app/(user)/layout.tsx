import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ProfileNav } from "@/components/profile/ProfileNav";
import { Container } from "@/components/ui/Container";
import { getSession } from "@/lib/auth/session";
import { getUnreadCount } from "@/lib/data/notifications";
import { getOwnedBusinesses } from "@/lib/data/owner";
import { getUserById } from "@/lib/data/users";

/**
 * Consumer account shell — the `(user)` route group.
 *
 * Auth is gated here, once, for every page in the group: no session → bounce
 * to `/login` with a `?next` so the user lands back here after signing in.
 * Layout: account nav as a sidebar on desktop, a tab strip on mobile.
 */
export default async function UserLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  const [user, unreadCount, ownedBusinesses] = session
    ? await Promise.all([
        getUserById(session.id),
        getUnreadCount(session.id),
        getOwnedBusinesses(session.id),
      ])
    : [null, 0, []];
  const isOwner = ownedBusinesses.length > 0;

  return (
    <>
      <Header />
      <Container>
        {/* `grid-cols-1` (= minmax(0,1fr)) is load-bearing: without an explicit
            mobile column the implicit `auto` track sizes to content and blows
            past the viewport. At `lg` the content track is capped + centred so
            the cards don't stretch sparse on wide screens. */}
        <div className="grid grid-cols-1 gap-5 py-6 lg:grid-cols-[200px_minmax(0,640px)] lg:justify-center lg:gap-8 lg:py-10">
          <aside className="lg:pt-1">
            <ProfileNav userRole={user?.role} unreadCount={unreadCount} isOwner={isOwner} />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </Container>
      <Footer />
    </>
  );
}
