import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { OwnerNav } from "@/components/business/OwnerNav";
import { getSession } from "@/lib/auth/session";
import { getOwnedBusinesses } from "@/lib/data/owner";

/**
 * Owner shell — the `(business)` route group.
 *
 * Two gates in order:
 *   1. Auth — no session bounces to `/login?next=/business`.
 *   2. Ownership — "owner" is not a `users.role` value; it's the existence of
 *      at least one row in `businesses` where `owner_id = session.id`. The
 *      claim-approval trigger (`tr_business_claim_approved`, migration 0008)
 *      is what flips that on. No row → bounce to `/for-business`, which is the
 *      marketing page that explains how to claim one.
 *
 * Per-page reads can `await getOwnedBusinesses(session.id)` again; the call is
 * cheap (single indexed query) and avoids smuggling state through context.
 */
export default async function OwnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    const h = await headers();
    const path = h.get("x-invoke-path") || h.get("x-pathname") || "/business";
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }

  const owned = await getOwnedBusinesses(session.id);
  if (owned.length === 0) {
    redirect("/for-business");
  }

  const publicHref = owned.length === 1 ? `/company/${owned[0].slug}` : null;

  return (
    <>
      <Header />
      <Container>
        <div className="grid grid-cols-1 gap-5 py-6 lg:grid-cols-[220px_minmax(0,860px)] lg:justify-center lg:gap-8 lg:py-10">
          <aside className="lg:pt-1">
            <OwnerNav publicHref={publicHref} />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </Container>
      <Footer />
    </>
  );
}
