import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompanyProfile } from "@/components/company/CompanyProfile";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import {
  averageLabel,
  businessDetails,
  getBusiness,
  getSimilarBusinesses,
  ratingStats,
  toReviews,
} from "@/lib/data/businesses";
import { getBookmarkStatus } from "@/lib/data/bookmarks";
import { getSession } from "@/lib/auth/session";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return businessDetails.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusiness(slug);
  if (!business) return { title: "کسب‌وکار – نظراتو" };
  return {
    title: `${business.name} – نظراتو`,
    description: business.description,
  };
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const session = await getSession();
  const business = await getBusiness(slug, session?.id);
  if (!business) notFound();

  const isBookmarked = session?.id
    ? await getBookmarkStatus(session.id, business.slug)
    : false;

  return (
    <>
      <Header />
      <Container>
        <Breadcrumb
          items={[{ label: "خانه", href: "/" }, { label: business.name }]}
        />
        <main>
          <CompanyProfile
            business={business}
            reviews={toReviews(business)}
            stats={ratingStats(business.reviews)}
            averageLabel={averageLabel(business.reviews)}
            similar={await getSimilarBusinesses(business)}
            isBookmarked={isBookmarked}
          />
        </main>
      </Container>
      <Footer />
    </>
  );
}
