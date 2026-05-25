import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { GLASS } from "@/components/ui/styles";
import { getSession } from "@/lib/auth/session";
import { getBusiness } from "@/lib/data/businesses";
import { getClaimForUserAndBusiness } from "@/lib/data/claims";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ClaimForm } from "./ClaimForm";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusiness(slug);
  return {
    title: business ? `ادعای مالکیت ${business.name} — نظراتو` : "ادعای مالکیت — نظراتو",
    description: "صفحه‌ی کسب‌وکار خود را در نظراتو ادعا کنید و به نظرات پاسخ دهید.",
    robots: { index: false },
  };
}

export default async function ClaimPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;

  const business = await getBusiness(slug);
  if (!business) notFound();

  const session = await getSession();
  if (!session) {
    redirect(`/login?next=/company/${slug}/claim`);
  }

  // Already-claimed → friendly redirect to the public profile.
  if (business.claimed) {
    redirect(`/company/${slug}`);
  }

  const supabase = supabaseAdmin();
  const [{ data: businessRow }, { data: userRow }] = await Promise.all([
    supabase.from("businesses").select("id").eq("slug", slug).single(),
    supabase.from("users").select("phone").eq("id", session.id).single(),
  ]);

  const existingClaim = businessRow
    ? await getClaimForUserAndBusiness(session.id, businessRow.id)
    : null;
  const pendingClaim =
    existingClaim && existingClaim.status === "pending" ? existingClaim : null;

  return (
    <>
      <Header />
      <Container>
        <Breadcrumb
          items={[
            { label: "خانه", href: "/" },
            { label: business.name, href: `/company/${slug}` },
            { label: "ادعای مالکیت" },
          ]}
        />
        <main className="flex justify-center pb-12 lg:pb-20">
          <div className="w-full max-w-[640px]">
            <header className="mb-6">
              <h1 className="text-[1.6rem] font-black text-strong sm:text-[1.9rem]">
                ادعای مالکیت «{business.name}»
              </h1>
              <p className="mt-2 text-[0.9rem] leading-[1.9] text-muted">
                ثابت کن صاحب این کسب‌وکار هستی تا بتوانی به نظرات پاسخ بدهی و
                اطلاعات صفحه را مدیریت کنی. درخواست‌ها معمولاً ظرف ۲۴ تا ۷۲ ساعت
                کاری بررسی می‌شوند.
              </p>
            </header>

            {pendingClaim ? (
              <div className={`${GLASS} p-6 sm:p-8`}>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[0.78rem] font-bold text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
                  در حال بررسی
                </div>
                <h2 className="text-[1.05rem] font-black text-strong">
                  درخواست شما ثبت شد.
                </h2>
                <p className="mt-2 text-[0.9rem] leading-[1.9] text-muted">
                  تیم بازبینی نظراتو در حال بررسی مدرک شماست. نتیجه از طریق
                  اعلان‌های حساب کاربری به شما اطلاع داده می‌شود.
                </p>
              </div>
            ) : (
              <ClaimForm
                slug={slug}
                businessName={business.name}
                defaultPhone={(userRow?.phone as string | undefined) ?? ""}
                previousRejection={
                  existingClaim?.status === "rejected"
                    ? existingClaim.rejection_reason ?? null
                    : null
                }
              />
            )}
          </div>
        </main>
      </Container>
      <Footer />
    </>
  );
}
