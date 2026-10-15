"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { GLASS } from "@/components/ui/styles";
import { RatingStars, type Rating } from "@/components/ui/RatingStars";
import type { ReportedReview } from "@/lib/data/admin";
import { dismissReports, removeReportedReview } from "./actions";

const faNum = (n: number) => n.toLocaleString("fa-IR");

export function ReportsAdminClient({
  initialReports,
}: {
  initialReports: ReportedReview[];
}) {
  const [reports, setReports] = useState<ReportedReview[]>(initialReports);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function run(
    id: string,
    fn: (id: string) => Promise<{ ok: boolean; error?: string }>,
    okMsg: string,
  ) {
    setPendingId(id);
    startTransition(async () => {
      const res = await fn(id);
      setPendingId(null);
      if (res.ok) {
        setReports((list) => list.filter((r) => r.id !== id));
        toast.success(okMsg);
      } else {
        toast.error(res.error ?? "خطا");
      }
    });
  }

  return (
    <>
      <Header />
      <Container>
        <main className="space-y-6 py-8">
          <header className="space-y-1">
            <h1 className="text-[1.6rem] font-black text-strong">نظرات گزارش‌شده</h1>
            <p className="text-[0.85rem] text-muted">
              {faNum(reports.length)} نظر گزارش‌شده — بیشترین گزارش بالاتر
            </p>
          </header>

          {reports.length === 0 ? (
            <div className={`${GLASS} p-10 text-center text-muted`}>
              گزارشی برای بررسی نیست. 🎉
            </div>
          ) : (
            <ul className="space-y-3">
              {reports.map((r) => {
                const busy = pendingId === r.id;
                const href = `/${r.business_type === "ig_shop" ? "shop" : "company"}/${r.business_slug}`;
                return (
                  <li key={r.id} className={`${GLASS} space-y-3 p-4`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <RatingStars rating={r.rating as Rating} />
                        <span className="rounded-full border border-pomegr/45 px-2 py-0.5 text-[0.72rem] font-bold text-pomegr">
                          {faNum(r.report_count)} گزارش
                        </span>
                        {r.status !== "published" && (
                          <span className="rounded-full border border-glass-border px-2 py-0.5 text-[0.72rem] font-bold text-muted">
                            {r.status}
                          </span>
                        )}
                      </div>
                      <Link href={href} className="text-[0.8rem] text-mint hover:underline">
                        {r.business_name}
                      </Link>
                    </div>

                    {r.title && (
                      <p className="font-bold text-strong">{r.title}</p>
                    )}
                    <p className="text-[0.9rem] leading-[1.9] text-muted">{r.body}</p>
                    <p className="text-[0.75rem] text-muted/70">
                      نویسنده: {r.author_name}
                    </p>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => run(r.id, dismissReports, "گزارش‌ها رد شد")}
                        disabled={busy}
                        className="rounded-lg border border-glass-border bg-white/5 px-3.5 py-2 text-[13px] font-bold text-white transition-colors hover:bg-white/10 disabled:opacity-50"
                      >
                        رد گزارش (نگه‌داشتن نظر)
                      </button>
                      <button
                        type="button"
                        onClick={() => run(r.id, removeReportedReview, "نظر حذف شد")}
                        disabled={busy}
                        className="rounded-lg border border-pomegr/45 px-3.5 py-2 text-[13px] font-bold text-pomegr transition-colors hover:bg-pomegr/10 disabled:opacity-50"
                      >
                        حذف نظر
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </main>
      </Container>
      <Footer />
    </>
  );
}
