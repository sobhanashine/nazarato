import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ProfileNav } from "@/components/profile/ProfileNav";
import { Container } from "@/components/ui/Container";
import { getSession } from "@/lib/auth/session";

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
  if (!session) redirect("/login?next=/profile");

  return (
    <>
      <Header />
      <Container>
        {/* Content track is capped + the whole grid is centred, so the cards
            don't stretch sparse on wide screens. */}
        <div className="grid gap-5 py-6 lg:grid-cols-[200px_minmax(0,640px)] lg:justify-center lg:gap-8 lg:py-10">
          <aside className="lg:pt-1">
            <ProfileNav />
          </aside>
          <div className="min-w-0 pb-16 lg:pb-24">{children}</div>
        </div>
      </Container>
      <Footer />
    </>
  );
}
