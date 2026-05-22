import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { getSession } from "@/lib/auth/session";
import { featuredBusinesses } from "@/lib/data/businesses";
import { WriteReviewPicker } from "./WriteReviewPicker";

export const metadata: Metadata = {
  title: "نوشتن نظر — نظراتو",
  description: "کسب‌وکاری که می‌خواهی نقدش کنی را انتخاب کن.",
};

/**
 * `/write-review` — the universal "start a review" entry.
 *
 * Where the mobile tab-bar FAB lands when no business is pre-selected: the
 * visitor searches for a business, then hands off to
 * `/company/[slug]/write-review`. Auth-gated — there is no `loading.tsx` in
 * this segment, so an unauthenticated visit commits a clean redirect.
 */
export default async function WriteReviewEntryPage() {
  if (!(await getSession())) redirect("/login?next=/write-review");

  return (
    <>
      <Header />
      <Container>
        <Breadcrumb
          items={[{ label: "خانه", href: "/" }, { label: "نوشتن نظر" }]}
        />
        <main className="flex justify-center pb-12 lg:pb-20">
          <div className="w-full max-w-[640px]">
            <WriteReviewPicker businesses={featuredBusinesses} />
          </div>
        </main>
      </Container>
      <Footer />
    </>
  );
}
