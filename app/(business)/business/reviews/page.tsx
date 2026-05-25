import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { getSession } from "@/lib/auth/session";
import {
  getOwnedBusinesses,
  getReviewsForOwner,
  type OwnerInboxFilter,
} from "@/lib/data/owner";
import { ReviewInbox } from "./ReviewInbox";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "صندوق نظرات — پنل کسب‌وکار | نظراتو",
  description: "همه‌ی نظرات کسب‌وکار شما، با امکان پاسخ و گزارش.",
  robots: { index: false },
};

type SearchParams = { b?: string; filter?: string; page?: string };

function asFilter(v: string | undefined): OwnerInboxFilter {
  return v === "unanswered" || v === "answered" ? v : "all";
}

export default async function OwnerReviewsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/business/reviews");

  const owned = await getOwnedBusinesses(session.id);
  if (owned.length === 0) redirect("/for-business");

  const sp = await searchParams;
  const active = (sp.b && owned.find((o) => o.slug === sp.b)) || owned[0];
  const filter = asFilter(sp.filter);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const inbox = await getReviewsForOwner(active.id, {
    filter,
    page,
    pageSize: 10,
  });

  return (
    <main className="space-y-6">
      <Breadcrumb
        items={[
          { label: "خانه", href: "/" },
          { label: "پنل کسب‌وکار", href: "/business" },
          { label: "صندوق نظرات" },
        ]}
      />

      <header className="space-y-2">
        <h1 className="text-[1.5rem] font-black text-strong sm:text-[1.85rem]">
          صندوق نظرات «{active.name}»
        </h1>
        <p className="text-[0.9rem] leading-[1.9] text-muted">
          پاسخ شما در زیر هر نظر برای همه‌ی بازدیدکنندگان نمایش داده می‌شود.
          گزارش‌های نامعتبر پس از بررسی تیم نظراتو از صفحه‌ی{" "}
          <Link href={`/company/${active.slug}`} className="text-mint hover:underline">
            عمومی
          </Link>{" "}
          حذف می‌شوند.
        </p>
      </header>

      <ReviewInbox
        reviews={inbox.reviews}
        total={inbox.total}
        page={inbox.page}
        pageSize={inbox.pageSize}
        filter={filter}
        slug={active.slug}
      />
    </main>
  );
}
