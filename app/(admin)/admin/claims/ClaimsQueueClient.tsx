"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { GLASS, CONTAINER } from "@/components/ui/styles";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import type { PendingClaim } from "@/lib/data/claims";
import {
  approveClaim,
  getSignedClaimProofUrl,
  rejectClaim,
} from "./actions";

const PROOF_LABELS: Record<string, string> = {
  domain_email: "ایمیل کاری روی دامنه",
  document: "سند رسمی پیوست‌شده",
  other: "روش دیگر",
};

const REJECTION_TEMPLATES = [
  "ایمیل ارائه‌شده روی دامنه‌ی رسمی کسب‌وکار نیست",
  "سند بارگذاری‌شده نامعتبر یا ناخواناست",
  "ارتباط متقاضی با کسب‌وکار اثبات نشد",
  "اطلاعات تماس قابل پیگیری نبود",
];

const faNum = (n: number) => n.toLocaleString("fa-IR");

function formatDate(isoString: string) {
  try {
    return new Date(isoString).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "نامشخص";
  }
}

export function ClaimsQueueClient({
  initialClaims,
}: {
  initialClaims: PendingClaim[];
}) {
  const [claims, setClaims] = useState<PendingClaim[]>(initialClaims);
  const [isPending, startTransition] = useTransition();

  const [viewingProof, setViewingProof] = useState<{ url: string } | null>(null);
  const [loadingProofId, setLoadingProofId] = useState<string | null>(null);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  function handleApprove(claimId: string) {
    if (isPending) return;
    startTransition(async () => {
      const res = await approveClaim(claimId);
      if (res.ok) {
        toast.success("ادعای مالکیت تأیید شد.");
        setClaims((prev) => prev.filter((c) => c.id !== claimId));
      } else {
        toast.error(res.error || "خطایی رخ داد.");
      }
    });
  }

  function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectingId || isPending) return;
    const claimId = rejectingId;
    const reason = rejectionReason.trim();
    startTransition(async () => {
      const res = await rejectClaim(claimId, reason || undefined);
      if (res.ok) {
        toast.success("درخواست رد شد.");
        setClaims((prev) => prev.filter((c) => c.id !== claimId));
        setRejectingId(null);
        setRejectionReason("");
      } else {
        toast.error(res.error || "خطایی رخ داد.");
      }
    });
  }

  async function handleViewProof(claim: PendingClaim) {
    if (!claim.proof_url || loadingProofId) return;
    setLoadingProofId(claim.id);
    try {
      const res = await getSignedClaimProofUrl(claim.proof_url);
      if (res.ok && res.url) {
        setViewingProof({ url: res.url });
      } else {
        toast.error(res.error || "خطا در دریافت فایل.");
      }
    } catch {
      toast.error("خطای غیرمنتظره.");
    } finally {
      setLoadingProofId(null);
    }
  }

  return (
    <>
      <Header />
      <div className={CONTAINER + " py-8 min-h-[70vh]"}>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-strong mb-2">
              صف ادعای مالکیت کسب‌وکارها
            </h1>
            <p className="text-muted text-sm">
              درخواست‌های در انتظار بررسی برای ادعای مالکیت صفحه‌ی کسب‌وکار.
            </p>
          </div>
          <Link
            href="/admin/moderation"
            className="inline-flex items-center justify-center rounded-full border border-glass-border bg-glass px-4 py-2 text-xs font-bold text-muted transition-colors hover:border-mint/45 hover:text-strong"
          >
            صف نظرات →
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={`${GLASS} p-4 flex items-center justify-between`}>
            <div>
              <p className="text-xs text-muted font-bold mb-1">
                کل درخواست‌های در انتظار
              </p>
              <h3 className="text-xl font-black text-strong tabular-nums">
                {faNum(claims.length)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-mint/10 text-mint flex items-center justify-center border border-mint/20">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>
          <div className={`${GLASS} p-4 flex items-center justify-between`}>
            <div>
              <p className="text-xs text-muted font-bold mb-1">دارای سند پیوست</p>
              <h3 className="text-xl font-black text-blue-400 tabular-nums">
                {faNum(claims.filter((c) => c.proof_url).length)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-400/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
          </div>
        </div>

        {claims.length === 0 ? (
          <div className={`${GLASS} flex flex-col items-center justify-center py-16 px-6 text-center`}>
            <div className="w-16 h-16 rounded-full bg-mint/10 text-mint flex items-center justify-center mb-4 border border-mint/20">
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-strong mb-2">
              همه درخواست‌ها بررسی شده‌اند
            </h2>
            <p className="text-muted max-w-sm">
              فعلاً درخواست ادعای مالکیتی در صف انتظار نیست.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {claims.map((claim) => {
              const hasFile = claim.proof_url !== null;
              return (
                <div
                  key={claim.id}
                  className={`${GLASS} p-6 lg:grid lg:grid-cols-4 gap-6 transition-colors hover:border-mint/30`}
                >
                  <div className="lg:col-span-3 flex flex-col min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <Link
                        href={`/${claim.business_type === "ig_shop" ? "shop" : "company"}/${claim.business_slug}`}
                        target="_blank"
                        className="text-xs font-black text-mint bg-mint/8 px-3 py-1.5 rounded-xl border border-mint/25 hover:bg-mint/15 transition-colors"
                      >
                        برای: {claim.business_name}
                      </Link>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 text-[0.72rem] font-bold text-blue-400">
                        {PROOF_LABELS[claim.proof_type] || claim.proof_type}
                      </span>
                    </div>

                    {claim.proof_email && (
                      <div className="mb-4 rounded-xl border border-glass-border bg-black/20 px-4 py-3">
                        <p className="text-[0.72rem] font-bold text-muted mb-1">
                          ایمیل کاری ارائه‌شده
                        </p>
                        <p dir="ltr" className="text-sm font-bold text-strong">
                          {claim.proof_email}
                        </p>
                      </div>
                    )}

                    {claim.notes && (
                      <div className="mb-4">
                        <p className="text-[0.72rem] font-bold text-muted mb-1">
                          توضیحات متقاضی
                        </p>
                        <p className="text-sm leading-7 text-strong/90 whitespace-pre-wrap">
                          {claim.notes}
                        </p>
                      </div>
                    )}

                    {hasFile && (
                      <div className="mt-auto p-4 rounded-xl bg-glass-border/8 border border-glass-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-mint/10 text-mint flex items-center justify-center border border-mint/15 shrink-0">
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </div>
                          <p className="text-xs font-bold text-strong">
                            سند پیوست‌شده آماده‌ی بررسی
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleViewProof(claim)}
                          disabled={loadingProofId !== null || isPending}
                          className="inline-flex items-center gap-1.5 rounded-full border border-mint/45 bg-mint/10 hover:bg-mint/20 text-mint font-bold px-4 py-2.5 min-h-11 text-xs cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {loadingProofId === claim.id ? "در حال بارگیری..." : "مشاهده مدرک"}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-r border-glass-border pt-5 lg:pt-0 lg:pr-5 flex flex-col justify-between gap-5">
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-bold text-muted">متقاضی</p>
                      <div className="bg-black/20 rounded-xl p-3 border border-glass-border/25 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center text-[10px] text-strong font-black border border-glass-border/40 shrink-0">
                            {claim.user_display_name.trim().charAt(0) || "؟"}
                          </div>
                          <span className="text-xs font-black text-strong truncate">
                            {claim.user_display_name}
                          </span>
                        </div>
                        <p dir="ltr" className="text-xs text-muted tabular-nums font-mono text-right">
                          {claim.contact_phone}
                        </p>
                        {claim.user_phone !== claim.contact_phone && (
                          <p dir="ltr" className="text-[10px] text-muted/70 tabular-nums">
                            حساب: {claim.user_phone}
                          </p>
                        )}
                        <p className="text-[10px] text-muted">
                          {formatDate(claim.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-row lg:flex-col gap-2.5 w-full mt-auto">
                      <button
                        type="button"
                        onClick={() => handleApprove(claim.id)}
                        disabled={isPending}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-mint hover:bg-mint-hi text-[#06231b] font-black px-5 py-3 min-h-11 text-xs cursor-pointer disabled:opacity-50"
                      >
                        تأیید
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingId(claim.id)}
                        disabled={isPending}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10 text-red-400 font-bold px-5 py-3 min-h-11 text-xs cursor-pointer disabled:opacity-50"
                      >
                        رد
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {viewingProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className={`${GLASS} w-full max-w-4xl max-h-[90vh] flex flex-col p-5 overflow-hidden shadow-2xl`}>
            <div className="flex items-center justify-between border-b border-glass-border pb-4 mb-4">
              <h3 className="text-base font-black text-strong">
                بررسی سند ادعای مالکیت
              </h3>
              <button
                type="button"
                onClick={() => setViewingProof(null)}
                className="w-11 h-11 rounded-full flex items-center justify-center bg-glass-border/30 hover:bg-glass-border/60 text-strong hover:text-red-400 cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-black/50 rounded-xl flex items-center justify-center p-3 min-h-[50vh]">
              {viewingProof.url.toLowerCase().includes(".pdf") ? (
                <iframe
                  src={viewingProof.url}
                  className="w-full h-full min-h-[55vh] rounded-md border-0"
                  title="Claim Proof"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={viewingProof.url}
                  alt="Claim proof"
                  className="max-w-full max-h-[65vh] object-contain rounded-lg"
                />
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-glass-border flex justify-end">
              <Link
                href={viewingProof.url}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-full border border-glass-border hover:border-mint/45 px-4 py-2.5 min-h-11 text-xs font-bold text-muted hover:text-mint cursor-pointer"
              >
                باز کردن در تب جدید
              </Link>
            </div>
          </div>
        </div>
      )}

      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleRejectSubmit}
            className={`${GLASS} w-full max-w-md p-6 flex flex-col shadow-2xl`}
          >
            <h3 className="text-lg font-black text-strong mb-4">
              رد درخواست ادعای مالکیت
            </h3>

            <label className="text-xs text-muted mb-2 block font-medium">
              دلیل رد (اختیاری — به متقاضی نمایش داده می‌شود):
            </label>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {REJECTION_TEMPLATES.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectionReason(reason)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border text-right transition-all cursor-pointer select-none ${
                    rejectionReason === reason
                      ? "bg-red-500/20 border-red-500 text-red-300"
                      : "bg-glass-border/20 border-glass-border text-muted hover:border-glass-border-hi hover:text-strong"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="bg-black/30 border border-glass-border rounded-lg p-3 text-sm text-strong focus:outline-none focus:border-mint min-h-[120px] resize-none mb-6 leading-7"
              placeholder="مثال: مدرک ارائه‌شده ارتباط متقاضی با کسب‌وکار را اثبات نمی‌کند..."
              maxLength={300}
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRejectingId(null);
                  setRejectionReason("");
                }}
                disabled={isPending}
                className="px-5 py-2.5 min-h-11 rounded-full border border-glass-border hover:bg-glass-border/30 text-strong font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 min-h-11 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                {isPending ? "در حال ثبت..." : "تأیید و رد"}
              </button>
            </div>
          </form>
        </div>
      )}

      <Footer />
    </>
  );
}
