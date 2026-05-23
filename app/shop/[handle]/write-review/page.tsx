import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { getSession } from "@/lib/auth/session";
import { getShopByHandle } from "@/lib/data/instagram-shops";
import { ShopWriteReviewForm } from "./WriteReviewForm";

type Params = { handle: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { handle } = await params;
  const shop = await getShopByHandle(handle);
  return {
    title: shop ? `نوشتن نظر برای ${shop.name} — نظراتو` : "نوشتن نظر — نظراتو",
    description: "تجربه‌ات از این فروشگاه اینستاگرامی را ثبت کن.",
  };
}

export default async function WriteReviewPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { handle } = await params;
  const shop = await getShopByHandle(handle);
  if (!shop) notFound();

  if (!(await getSession())) {
    redirect(`/login?next=/shop/${handle}/write-review`);
  }

  return (
    <>
      <Header />
      <Container>
        <Breadcrumb
          items={[
            { label: "خانه", href: "/" },
            { label: "فروشگاه‌های اینستاگرامی", href: "/instagram-shops" },
            { label: shop.name, href: `/shop/${handle}` },
            { label: "نوشتن نظر" },
          ]}
        />
        <main className="flex justify-center pb-12 lg:pb-20">
          <div className="w-full max-w-[640px]">
            <ShopWriteReviewForm handle={handle} businessName={shop.name} />
          </div>
        </main>
      </Container>
      <Footer />
    </>
  );
}
