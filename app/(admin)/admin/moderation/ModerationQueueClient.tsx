"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { GLASS, CONTAINER, BTN_PRIMARY, TAG_BADGE } from "@/components/ui/styles";
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

  return (
    <>
      <Header />
      <div className={CONTAINER + " py-8 min-h-[70vh]"}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-strong mb-2">پنل مدیریت نظرات</h1>
            <p className="text-muted text-sm">صف بررسی، تأیید و رد نظرات در انتظار</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`${GLASS} px-4 py-2 text-sm font-bold text-mint rounded-full`}>
              {faNum(reviews.length)} نظر در انتظار بررسی
            </span>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className={`${GLASS} flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl border border-glass-border`}>
            <div className="w-16 h-16 rounded-full bg-mint/10 text-mint flex items-center justify-center mb-4">
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
                  className={`${GLASS} p-6 border border-glass-border rounded-2xl flex flex-col md:flex-row gap-6 justify-between transition-all duration-300 hover:border-glass-border-hi`}
                >
                  <div className="flex-1 min-w-0">
                    {/* Top Row: Business and Author */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
                      <span className="text-sm font-extrabold text-mint bg-mint/5 px-2.5 py-1 rounded-md border border-mint/20">
                        برای: {review.business_name}
                      </span>
                      <div className="text-xs text-muted flex items-center gap-1.5">
                        <span className="font-semibold text-strong">{review.author_name}</span>
                        <span className="opacity-60">|</span>
                        <span className="tabular-nums font-mono">{review.author_phone}</span>
                      </div>
                      <span className="text-[10px] text-muted mr-auto tabular-nums">
                        {formatDate(review.created_at)}
                      </span>
                    </div>

                    {/* Rating and Title */}
                    <div className="flex items-center gap-3 mb-3">
                      <RatingStars rating={review.rating} />
                      {review.title && (
                        <h3 className="text-base font-bold text-strong">{review.title}</h3>
                      )}
                    </div>

                    {/* Review Body */}
                    <p className="text-sm leading-8 text-strong opacity-[0.88] mb-4 whitespace-pre-wrap">
                      {review.body}
                    </p>

                    {/* Proof Meta (if any) */}
                    {isProof && (
                      <div className="flex items-center gap-3 mt-2 p-3 rounded-lg bg-glass-border/10 border border-glass-border/30 max-w-fit">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-mint" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                        <div className="text-xs">
                          <span className="text-muted">مدرک ضمیمه شده: </span>
                          <span className="font-bold text-strong">
                            {review.proof_type ? PROOF_LABELS[review.proof_type] || review.proof_type : "نامشخص"}
                          </span>
                          {review.purchase_date && (
                            <span className="text-muted mr-2 tabular-nums">
                              (تاریخ خرید: {formatDate(review.purchase_date + "T00:00:00")})
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleViewProof(review)}
                          disabled={loadingProofId !== null || isPending}
                          className={`${TAG_BADGE} cursor-pointer text-xs mr-3 py-1 px-3`}
                        >
                          {loadingProofId === review.id ? "در حال بارگیری..." : "مشاهده مدرک خرید"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex md:flex-col justify-end gap-3 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => handleApprove(review.id)}
                      disabled={isPending}
                      className={`${BTN_PRIMARY} px-6 py-2.5 text-xs text-[#06231b] cursor-pointer`}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      تأیید نظر
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectingId(review.id)}
                      disabled={isPending}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10 text-red-400 font-bold px-6 py-2.5 text-xs transition-all duration-200 cursor-pointer disabled:opacity-50"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      رد نظر
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Proof Modal Viewer */}
      {viewingProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`${GLASS} w-full max-w-4xl max-h-[85vh] flex flex-col p-6 rounded-2xl border border-glass-border overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-glass-border pb-4 mb-4">
              <h3 className="text-lg font-black text-strong">بررسی مدرک خرید</h3>
              <button
                type="button"
                onClick={() => setViewingProof(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-glass-border/30 hover:bg-glass-border/50 text-strong cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto bg-black/30 rounded-lg flex items-center justify-center p-2 min-h-[50vh]">
              {viewingProof.url.toLowerCase().includes(".pdf") ? (
                <iframe
                  src={viewingProof.url}
                  className="w-full h-full min-h-[50vh] rounded-md border-0"
                  title="PDF Proof"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={viewingProof.url}
                  alt="Proof Document"
                  className="max-w-full max-h-[60vh] object-contain rounded-md"
                />
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-glass-border flex justify-end gap-3">
              <Link
                href={viewingProof.url}
                target="_blank"
                className={`${TAG_BADGE} py-2 px-4 cursor-pointer`}
              >
                باز کردن در تب جدید
              </Link>
              <button
                type="button"
                onClick={() => setViewingProof(null)}
                className="px-5 py-2 rounded-full border border-glass-border hover:bg-glass-border/30 text-strong font-bold text-xs cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Dialog */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleRejectSubmit}
            className={`${GLASS} w-full max-w-md p-6 rounded-2xl border border-glass-border flex flex-col`}
          >
            <h3 className="text-lg font-black text-strong mb-4">رد کردن نظر</h3>
            
            <label className="text-xs text-muted mb-2 block font-medium">
              دلیل رد کردن نظر (اختیاری - در صفحه پروفایل کاربر نمایش داده می‌شود):
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="bg-black/30 border border-glass-border rounded-lg p-3 text-sm text-strong focus:outline-none focus:border-mint min-h-[120px] resize-none mb-6 leading-7"
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
                className="px-5 py-2.5 rounded-full border border-glass-border hover:bg-glass-border/30 text-strong font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
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
