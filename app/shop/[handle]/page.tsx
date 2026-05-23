import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopProfile } from "@/components/shop/ShopProfile";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import {
  getShopByHandle,
  getSimilarShops,
  instagramShops,
} from "@/lib/data/instagram-shops";
import { ratingStats, averageLabel, toReviews } from "@/lib/data/businesses";

type Params = { handle: string };

export function generateStaticParams(): Params[] {
  return instagramShops.map((s) => ({ handle: s.handle.replace("@", "") }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { handle } = await params;
  const shop = await getShopByHandle(handle);
  if (!shop) return { title: "فروشگاه اینستاگرامی – نظراتو" };
  return {
    title: `${shop.name} – نظراتو`,
    description: shop.description || `نقد و بررسی و نظرات کاربران درباره فروشگاه اینستاگرامی ${shop.name}`,
  };
}

export default async function ShopPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { handle } = await params;
  const shop = await getShopByHandle(handle);
  if (!shop) notFound();

  // Mapping rating average and counts
  const stats = ratingStats(shop.reviews);
  const avgLabel = averageLabel(shop.reviews);
  const similar = await getSimilarShops(shop);

  return (
    <>
      <Header />
      <Container>
        <Breadcrumb
          items={[
            { label: "خانه", href: "/" },
            { label: "فروشگاه‌های اینستاگرامی", href: "/instagram-shops" },
            { label: shop.name },
          ]}
        />
        <main>
          <ShopProfile
            business={shop}
            reviews={toReviews(shop)}
            stats={stats}
            averageLabel={avgLabel}
            similar={similar}
          />
        </main>
      </Container>
      <Footer />
    </>
  );
}
