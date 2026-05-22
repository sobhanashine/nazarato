import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { getSession } from "@/lib/auth/session";
import { getBusiness } from "@/lib/data/businesses";
import { WriteReviewForm } from "./WriteReviewForm";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusiness(slug);
  return {
    title: business ? `نوشتن نظر برای ${business.name} — نظراتو` : "نوشتن نظر — نظراتو",
    description: "تجربه‌ات از این کسب‌وکار را ثبت کن.",
  };
}

/**
 * `/company/[slug]/write-review` — auth-gated review submission form.
 *
 * The slug 404 is committed in `../layout.tsx` (above the loading boundary).
 * The auth gate lives here: a `company/[slug]/loading.tsx` boundary sits above
 * this segment, so an unauthenticated visit can't yield a 307 — it streams the
 * skeleton, then `redirect()` bounces to `/login` on the client. Fine for an
 * auth-gated, non-indexed page; `submitReview` re-checks the session anyway.
 */
export default async function WriteReviewPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const business = await getBusiness(slug);
  if (!business) notFound();

  if (!(await getSession())) {
    redirect(`/login?next=/company/${slug}/write-review`);
  }

  return (
    <>
      <Header />
      <Container>
        <Breadcrumb
          items={[
            { label: "خانه", href: "/" },
            { label: business.name, href: `/company/${slug}` },
            { label: "نوشتن نظر" },
          ]}
        />
        <main className="flex justify-center pb-12 lg:pb-20">
          <div className="w-full max-w-[640px]">
            <WriteReviewForm slug={slug} businessName={business.name} />
          </div>
        </main>
      </Container>
      <Footer />
    </>
  );
}
