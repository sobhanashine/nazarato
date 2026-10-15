"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { GLASS } from "@/components/ui/styles";
import type {
  AdminBusinessListItem,
  AdminBusinessStatus,
} from "@/lib/data/admin";
import { setBusinessStatus, setBusinessVerified } from "./actions";

const faNum = (n: number) => n.toLocaleString("fa-IR");

const STATUS_LABELS: Record<AdminBusinessStatus, string> = {
  active: "فعال",
  pending: "در انتظار",
  merged: "ادغام‌شده",
  hidden: "پنهان",
};

const STATUS_ORDER: AdminBusinessStatus[] = ["active", "pending", "merged", "hidden"];

export function BusinessesAdminClient({
  initialBusinesses,
  query,
}: {
  initialBusinesses: AdminBusinessListItem[];
  query: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<AdminBusinessListItem[]>(initialBusinesses);
  const [term, setTerm] = useState(query);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = term.trim();
    router.push(q ? `/admin/businesses?q=${encodeURIComponent(q)}` : "/admin/businesses");
  }

  function changeStatus(biz: AdminBusinessListItem, status: AdminBusinessStatus) {
    if (status === biz.status) return;
    setPendingId(biz.id);
    startTransition(async () => {
      const res = await setBusinessStatus(biz.id, status);
      setPendingId(null);
      if (res.ok) {
        setItems((list) =>
          list.map((b) => (b.id === biz.id ? { ...b, status } : b)),
        );
        toast.success("وضعیت بروزرسانی شد");
      } else {
        toast.error(res.error);
      }
    });
  }

  function toggleVerified(biz: AdminBusinessListItem) {
    const next = !biz.verified;
    setPendingId(biz.id);
    startTransition(async () => {
      const res = await setBusinessVerified(biz.id, next);
      setPendingId(null);
      if (res.ok) {
        setItems((list) =>
          list.map((b) => (b.id === biz.id ? { ...b, verified: next } : b)),
        );
        toast.success(next ? "تأیید شد" : "تأیید برداشته شد");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <Header />
      <Container>
        <main className="space-y-6 py-8">
          <header className="space-y-1">
            <h1 className="text-[1.6rem] font-black text-strong">مدیریت کسب‌وکارها</h1>
            <p className="text-[0.85rem] text-muted">
              {faNum(items.length)} کسب‌وکار — وضعیت و تأیید.{" "}
              <Link href="/admin/claims" className="text-mint hover:underline">
                درخواست‌های مالکیت
              </Link>
            </p>
          </header>

          <form onSubmit={onSearch} className="flex gap-2">
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="جستجو با نام، نشانی یا شهر…"
              className="w-full rounded-xl border border-glass-border bg-white/[0.03] px-4 py-2.5 text-[15px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-mint"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl border border-glass-border bg-white/5 px-5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-white/10"
            >
              جستجو
            </button>
          </form>

          {items.length === 0 ? (
            <div className={`${GLASS} p-10 text-center text-muted`}>
              کسب‌وکاری پیدا نشد.
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((biz) => {
                const busy = pendingId === biz.id;
                const href = `/${biz.type === "ig_shop" ? "shop" : "company"}/${biz.slug}`;
                return (
                  <li
                    key={biz.id}
                    className={`${GLASS} flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={href} className="font-bold text-strong hover:text-mint">
                          {biz.name}
                        </Link>
                        {biz.verified && (
                          <span className="rounded-full border border-mint/40 px-2 py-0.5 text-[0.7rem] font-bold text-mint">
                            تأییدشده
                          </span>
                        )}
                        {biz.claimed && (
                          <span className="rounded-full border border-lapis/40 px-2 py-0.5 text-[0.7rem] font-bold text-lapis">
                            دارای مالک
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-[0.78rem] text-muted">
                        <span>{biz.category_slug}</span>
                        {biz.city && <span>{biz.city}</span>}
                        <span>{faNum(biz.review_count)} نظر</span>
                        {biz.rating_avg != null && (
                          <span>میانگین {biz.rating_avg.toLocaleString("fa-IR")}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <select
                        value={biz.status}
                        disabled={busy}
                        onChange={(e) =>
                          changeStatus(biz, e.target.value as AdminBusinessStatus)
                        }
                        aria-label="وضعیت کسب‌وکار"
                        className="rounded-lg border border-glass-border bg-white/5 px-3 py-2 text-[13px] font-bold text-white outline-none focus:border-mint disabled:opacity-50"
                      >
                        {STATUS_ORDER.map((s) => (
                          <option key={s} value={s} className="bg-[#0a0e18]">
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => toggleVerified(biz)}
                        disabled={busy}
                        className={`rounded-lg border px-3.5 py-2 text-[13px] font-bold transition-colors disabled:opacity-50 ${
                          biz.verified
                            ? "border-glass-border text-muted hover:bg-white/10"
                            : "border-mint/40 text-mint hover:bg-mint/10"
                        }`}
                      >
                        {biz.verified ? "حذف تأیید" : "تأیید"}
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
