"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { GLASS, CONTAINER } from "@/components/ui/styles";
import { RatingStars, type Rating } from "@/components/ui/RatingStars";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { approveReview, rejectReview, getSignedProofUrl } from "./actions";

type PendingReview = {
  id: string;
  rating: Rating;
  title: string | null;
  body: string;
  proof_status: string;
  proof_type: string | null;
  proof_url: string | null;
  purchase_date: string | null;
  created_at: string;
  business_name: string;
  business_slug: string;
  author_name: string;
  author_phone: string;
};

const PROOF_LABELS: Record<string, string> = {
  invoice: "فاکتور خرید",
  sms: "پیامک تأیید خرید",
  tracking: "کد رهگیری پستی",
  receipt: "رسید پرداخت بانک",
  dm: "اسکرین‌شات گفتگو",
};

export function ModerationQueueClient({
  initialReviews,
}: {
  initialReviews: PendingReview[];
}) {
  const [reviews, setReviews] = useState<PendingReview[]>(initialReviews);
  const [isPending, startTransition] = useTransition();

  // Proof viewer modal state
  const [viewingProof, setViewingProof] = useState<{
    url: string;
    type: string | null;
  } | null>(null);
  const [loadingProofId, setLoadingProofId] = useState<string | null>(null);

  // Rejection modal state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const faNum = (n: number) => n.toLocaleString("fa-IR");

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "نامشخص";
    }
  };

  async function handleApprove(reviewId: string) {
    if (isPending) return;

    startTransition(async () => {
      const res = await approveReview(reviewId);
      if (res.ok) {
        toast.success("نظر با موفقیت تأیید و منتشر شد.");
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      } else {
        toast.error(res.error || "خطایی رخ داد.");
      }
    });
  }

  async function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectingId || isPending) return;

    const reviewId = rejectingId;
    const reason = rejectionReason.trim();

    startTransition(async () => {
      const res = await rejectReview(reviewId, reason || undefined);
      if (res.ok) {
        toast.success("نظر با موفقیت رد شد.");
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        setRejectingId(null);
        setRejectionReason("");
      } else {
        toast.error(res.error || "خطایی رخ داد.");
      }
    });
  }

  async function handleViewProof(review: PendingReview) {
    if (!review.proof_url || loadingProofId) return;

    setLoadingProofId(review.id);
    try {
      const res = await getSignedProofUrl(review.proof_url);
      if (res.ok && res.url) {
        setViewingProof({ url: res.url, type: review.proof_type });
      } else {
        toast.error(res.error || "خطا در دریافت فایل مدرک.");
      }
    } catch {
      toast.error("خطای غیرمنتظره در ارتباط با سرور.");
    } finally {
      setLoadingProofId(null);
    }
  }

  const totalPending = reviews.length;
  const pendingWithProof = reviews.filter((r) => r.proof_status === "submitted" && r.proof_url).length;
  const pendingWithoutProof = totalPending - pendingWithProof;

  return (
    <>
      <Header />
      <div className={CONTAINER + " py-8 min-h-[70vh]"}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-strong mb-2">پنل مدیریت نظرات</h1>
            <p className="text-muted text-sm">صف بررسی، تأیید و رد نظرات در انتظار</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className={`${GLASS} p-4 flex items-center justify-between border-glass-border hover:border-mint/35 transition-all duration-300`}>
            <div>
              <p className="text-xs text-muted font-bold mb-1">کل نظرات در انتظار</p>
              <h3 className="text-xl font-black text-strong tabular-nums">{faNum(totalPending)}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-mint/10 text-mint flex items-center justify-center border border-mint/20 shadow-[0_0_15px_rgba(91,187,123,0.15)]">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
          </div>
          <div className={`${GLASS} p-4 flex items-center justify-between hover:border-blue-400/35 transition-all duration-300`}>
            <div>
              <p className="text-xs text-muted font-bold mb-1">همراه با سند خرید</p>
              <h3 className="text-xl font-black text-blue-400 tabular-nums">{faNum(pendingWithProof)}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-400/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
          </div>
          <div className={`${GLASS} p-4 flex items-center justify-between hover:border-amber-400/35 transition-all duration-300`}>
            <div>
              <p className="text-xs text-muted font-bold mb-1">بدون سند خرید</p>
              <h3 className="text-xl font-black text-amber-400 tabular-nums">{faNum(pendingWithoutProof)}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className={`${GLASS} flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl border border-glass-border`}>
            <div className="w-16 h-16 rounded-full bg-mint/10 text-mint flex items-center justify-center mb-4 border border-mint/20 shadow-[0_0_20px_rgba(91,187,123,0.15)] animate-pulse">
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-strong mb-2">همه کارها انجام شده!</h2>
            <p className="text-muted max-w-sm">هیچ نظری در صف انتظار برای بررسی و تایید وجود ندارد.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {reviews.map((review) => {
              const isProof = review.proof_status === "submitted" && review.proof_url;
              return (
                <div
                  key={review.id}
                  className={`${GLASS} group relative p-6 border border-glass-border hover:border-mint/30 rounded-2xl flex flex-col lg:grid lg:grid-cols-4 gap-6 transition-all duration-300 hover:shadow-[0_8px_32px_-6px_rgba(91,187,123,0.12)] bg-slate-950/45`}
                >
                  {/* Right side: Review Body (Col-span 3) */}
                  <div className="lg:col-span-3 flex flex-col min-w-0">
                    {/* Top Row: Business Name & Status Badge */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <Link
                        href={`/company/${review.business_slug}`}
                        target="_blank"
                        className="text-xs font-black text-mint bg-mint/8 px-3 py-1.5 rounded-xl border border-mint/25 hover:bg-mint/15 transition-colors"
                      >
                        برای: {review.business_name}
                      </Link>
                      
                      {review.proof_status === "submitted" && review.proof_url ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 text-[0.72rem] font-bold text-blue-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                          نیاز به بررسی سند
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 border border-slate-500/25 px-2.5 py-1 text-[0.72rem] font-medium text-muted">
                          بدون سند خرید
                        </span>
                      )}
                    </div>

                    {/* Stars and Title */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative inline-flex group/stars">
                        <div className="absolute -inset-1.5 bg-amber-400/15 blur-md rounded-full opacity-40 group-hover/stars:opacity-80 transition-opacity duration-300" />
                        <RatingStars rating={review.rating} />
                      </div>
                      {review.title && (
                        <h3 className="text-base font-black text-strong">{review.title}</h3>
                      )}
                    </div>

                    {/* Review Text */}
                    <p className="text-sm leading-8 text-strong/90 mb-5 whitespace-pre-wrap flex-1">
                      {review.body}
                    </p>

                    {/* Proof Container if submitted */}
                    {isProof && (
                      <div className="mt-auto p-4 rounded-xl bg-glass-border/8 border border-glass-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-mint/10 text-mint flex items-center justify-center border border-mint/15 shrink-0">
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-strong">
                              سند بارگذاری شده: {review.proof_type ? PROOF_LABELS[review.proof_type] || review.proof_type : "نامشخص"}
                            </p>
                            {review.purchase_date && (
                              <p className="text-[0.7rem] text-muted mt-0.5 tabular-nums">
                                تاریخ خرید اعلامی: {formatDate(review.purchase_date + "T00:00:00")}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleViewProof(review)}
                          disabled={loadingProofId !== null || isPending}
                          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-mint/45 bg-mint/10 hover:bg-mint/20 text-mint font-bold px-4 py-2.5 min-h-11 text-xs transition-colors duration-200 cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {loadingProofId === review.id ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5 text-mint" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              در حال بارگیری...
                            </>
                          ) : (
                            <>
                              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              مشاهده فایل مدرک
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Left side: Metadata & Actions (Col-span 1) */}
                  <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-r border-glass-border pt-5 lg:pt-0 lg:pr-5 flex flex-col justify-between gap-5">
                    {/* User Metadata */}
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-bold text-muted">اطلاعات نویسنده</p>
                      <div className="bg-black/20 rounded-xl p-3 border border-glass-border/25 flex flex-col gap-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center text-[10px] text-strong font-black border border-glass-border/40 shrink-0">
                            {review.author_name.trim().charAt(0) || "؟"}
                          </div>
                          <span className="text-xs font-black text-strong truncate">{review.author_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0 opacity-60" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <span className="tabular-nums font-mono">{review.author_phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted mt-0.5">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0 opacity-60" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span className="tabular-nums">{formatDate(review.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row lg:flex-col gap-2.5 w-full mt-auto">
                      <button
                        type="button"
                        onClick={() => handleApprove(review.id)}
                        disabled={isPending}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-mint hover:bg-mint-hi text-[#06231b] font-black px-5 py-3 min-h-11 text-xs transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        تأیید نظر
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingId(review.id)}
                        disabled={isPending}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10 text-red-400 font-bold px-5 py-3 min-h-11 text-xs transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        رد نظر
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Proof Modal Viewer */}
      {viewingProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className={`${GLASS} w-full max-w-4xl max-h-[90vh] flex flex-col p-5 rounded-2xl border border-glass-border-hi/40 overflow-hidden shadow-2xl`}>
            <div className="flex items-center justify-between border-b border-glass-border pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                <h3 className="text-base font-black text-strong">بررسی مدرک بارگذاری‌شده</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingProof(null)}
                className="w-11 h-11 rounded-full flex items-center justify-center bg-glass-border/30 hover:bg-glass-border/60 text-strong hover:text-red-400 transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto bg-black/50 rounded-xl flex items-center justify-center p-3 min-h-[50vh] border border-glass-border/30 relative group">
              {viewingProof.url.toLowerCase().includes(".pdf") ? (
                <iframe
                  src={viewingProof.url}
                  className="w-full h-full min-h-[55vh] rounded-md border-0"
                  title="PDF Proof"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={viewingProof.url}
                  alt="Proof Document"
                  className="max-w-full max-h-[65vh] object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.01]"
                />
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-glass-border flex justify-between items-center gap-3">
              <span className="text-[10px] text-muted">نوع سند: {viewingProof.type ? PROOF_LABELS[viewingProof.type] || viewingProof.type : "نامشخص"}</span>
              <div className="flex gap-2">
                <Link
                  href={viewingProof.url}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-full border border-glass-border hover:border-mint/45 px-4 py-2.5 min-h-11 text-xs font-bold text-muted hover:text-mint transition-colors cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  باز کردن در تب جدید
                </Link>
                <button
                  type="button"
                  onClick={() => setViewingProof(null)}
                  className="px-5 py-2.5 min-h-11 rounded-full border border-glass-border bg-glass-border/10 hover:bg-glass-border/30 text-strong font-bold text-xs cursor-pointer transition-colors"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Dialog */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleRejectSubmit}
            className={`${GLASS} w-full max-w-md p-6 rounded-2xl border border-glass-border flex flex-col shadow-2xl`}
          >
            <h3 className="text-lg font-black text-strong mb-4">رد کردن نظر</h3>
            
            <label className="text-xs text-muted mb-2 block font-medium">
              دلیل رد کردن نظر (اختیاری - در صفحه پروفایل کاربر نمایش داده می‌شود):
            </label>

            {/* Quick Template Chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {[
                "حاوی کلمات توهین‌آمیز یا نامناسب",
                "فاکتور یا مدرک خرید نامعتبر",
                "فاقد تجربه خرید واقعی یا مستند",
                "متن اسپم، تبلیغاتی یا تکراری",
                "نظر غیرمرتبط به کسب‌وکار"
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectionReason(reason)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border text-right transition-all cursor-pointer select-none active:scale-95 ${
                    rejectionReason === reason
                      ? "bg-red-500/20 border-red-500 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
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
              className="bg-black/30 border border-glass-border rounded-lg p-3 text-sm text-strong focus:outline-none focus:border-mint min-h-[120px] resize-none mb-6 leading-7 transition-colors"
              placeholder="مثال: حاوی واژه‌های نامناسب، اطلاعات نامعتبر، فاقد تجربه خرید واقعی..."
              maxLength={200}
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
                className="px-6 py-2.5 min-h-11 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isPending ? "در حال ثبت..." : "تأیید و رد نظر"}
              </button>
            </div>
          </form>
        </div>
      )}
      <Footer />
    </>
  );
}
