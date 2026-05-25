"use client";

import { useActionState, useId, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { StarIcon } from "@/components/icons";
import { BTN_PRIMARY, GLASS } from "@/components/ui/styles";
import {
  flagReviewForRemoval,
  submitOwnerResponse,
  type OwnerActionState,
} from "./actions";
import type { OwnerReviewPreview } from "@/lib/data/owner";

const FLAG_REASONS = [
  "نظر جعلی است",
  "محتوای توهین‌آمیز",
  "تبلیغ یا اسپم",
  "افشای اطلاعات شخصی",
  "نامرتبط با کسب‌وکار",
];

const RESPONSE_MIN = 10;
const RESPONSE_MAX = 1500;

const faNum = (n: number) => n.toLocaleString("fa-IR");

interface ReviewInboxProps {
  reviews: OwnerReviewPreview[];
  total: number;
  page: number;
  pageSize: number;
  filter: "all" | "unanswered" | "answered";
  slug: string;
}

export function ReviewInbox({
  reviews,
  total,
  page,
  pageSize,
  filter,
  slug,
}: ReviewInboxProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTx] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const setFilter = (next: "all" | "unanswered" | "answered") => {
    const sp = new URLSearchParams(params?.toString());
    if (next === "all") sp.delete("filter");
    else sp.set("filter", next);
    sp.delete("page");
    startTx(() => router.push(`/business/reviews?${sp.toString()}`));
  };

  const setPage = (next: number) => {
    const sp = new URLSearchParams(params?.toString());
    if (next <= 1) sp.delete("page");
    else sp.set("page", String(next));
    startTx(() => router.push(`/business/reviews?${sp.toString()}`));
  };

  return (
    <div className="space-y-4">
      <FilterTabs current={filter} onChange={setFilter} />

      {reviews.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <ReviewRow key={r.id} review={r} slug={slug} />
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      ) : null}
    </div>
  );
}

function FilterTabs({
  current,
  onChange,
}: {
  current: "all" | "unanswered" | "answered";
  onChange: (next: "all" | "unanswered" | "answered") => void;
}) {
  const tabs = [
    { key: "all" as const, label: "همه" },
    { key: "unanswered" as const, label: "بدون پاسخ" },
    { key: "answered" as const, label: "پاسخ‌داده‌شده" },
  ];
  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = current === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={`rounded-full border px-4 py-1.5 text-[0.82rem] font-semibold transition-colors duration-200 ${
              active
                ? "border-mint/45 bg-mint/12 text-mint"
                : "border-glass-border bg-glass text-muted hover:text-strong"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
}) {
  return (
    <nav aria-label="صفحه‌بندی" className="flex items-center justify-between gap-3 pt-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-full border border-glass-border bg-glass px-4 py-1.5 text-[0.82rem] font-semibold text-muted hover:text-strong disabled:cursor-not-allowed disabled:opacity-50"
      >
        قبلی
      </button>
      <span className="text-[0.82rem] text-muted">
        صفحه‌ی {faNum(page)} از {faNum(totalPages)}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded-full border border-glass-border bg-glass px-4 py-1.5 text-[0.82rem] font-semibold text-muted hover:text-strong disabled:cursor-not-allowed disabled:opacity-50"
      >
        بعدی
      </button>
    </nav>
  );
}

function EmptyState({ filter }: { filter: "all" | "unanswered" | "answered" }) {
  const copy =
    filter === "unanswered"
      ? "همه‌ی نظرات پاسخ داده‌شده‌اند. کار خوبی است."
      : filter === "answered"
        ? "هنوز به هیچ نظری پاسخ نداده‌اید."
        : "هنوز هیچ نظری برای این کسب‌وکار ثبت نشده.";
  return (
    <div className={`${GLASS} p-8 text-center`}>
      <span aria-hidden className="text-3xl">💬</span>
      <p className="mt-3 text-[0.9rem] leading-[1.9] text-muted">{copy}</p>
    </div>
  );
}

function ReviewRow({
  review,
  slug,
}: {
  review: OwnerReviewPreview;
  slug: string;
}) {
  const [mode, setMode] = useState<"view" | "compose" | "flag">("view");

  return (
    <li id={`review-${review.id}`} className={`${GLASS} p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[0.85rem] font-black text-black"
            style={{ background: review.author.color }}
          >
            {review.author.initial}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[0.92rem] font-bold text-strong">
              {review.author.name}
            </div>
            <div className="text-[0.72rem] text-muted">{review.createdAtLabel}</div>
          </div>
        </div>
        <span
          aria-label={`امتیاز ${review.rating} از ۵`}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-mint/30 bg-mint/10 px-2 py-1 text-[0.75rem] font-bold text-mint"
        >
          <StarIcon className="h-3 w-3" />
          {faNum(review.rating)}
        </span>
      </div>

      <p className="mt-3 whitespace-pre-line text-[0.9rem] leading-[1.95] text-strong">
        {review.body}
      </p>

      {review.ownerResponse ? (
        <OwnerResponseDisplay
          review={review}
          onEdit={() => setMode("compose")}
        />
      ) : null}

      {mode === "compose" ? (
        <ReplyComposer
          reviewId={review.id}
          initial={review.ownerResponse?.body ?? ""}
          onCancel={() => setMode("view")}
        />
      ) : mode === "flag" ? (
        <FlagComposer reviewId={review.id} onCancel={() => setMode("view")} />
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <Link
            href={`/company/${slug}/reviews#review-${review.id}`}
            className="text-[0.78rem] font-semibold text-muted hover:text-strong"
          >
            مشاهده در صفحه عمومی
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("flag")}
              className="rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-[0.78rem] font-bold text-rose-300 hover:bg-rose-400/15"
            >
              گزارش نظر
            </button>
            {!review.ownerResponse ? (
              <button
                type="button"
                onClick={() => setMode("compose")}
                className={`${BTN_PRIMARY} px-3.5 py-1.5 text-[0.78rem]`}
              >
                پاسخ
              </button>
            ) : null}
          </div>
        </div>
      )}
    </li>
  );
}

function OwnerResponseDisplay({
  review,
  onEdit,
}: {
  review: OwnerReviewPreview;
  onEdit: () => void;
}) {
  if (!review.ownerResponse) return null;
  return (
    <div className="mt-3 rounded-2xl border border-mint/25 bg-mint/[0.06] p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[0.78rem] font-bold text-mint">
          <span className="h-1.5 w-1.5 rounded-full bg-mint" />
          پاسخ شما
          <span className="text-[0.7rem] font-medium text-muted">
            · {review.ownerResponse.atLabel}
          </span>
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="text-[0.78rem] font-semibold text-mint hover:underline"
        >
          ویرایش
        </button>
      </div>
      <p className="mt-2 whitespace-pre-line text-[0.88rem] leading-[1.95] text-strong">
        {review.ownerResponse.body}
      </p>
    </div>
  );
}

function ReplyComposer({
  reviewId,
  initial,
  onCancel,
}: {
  reviewId: string;
  initial: string;
  onCancel: () => void;
}) {
  const fieldId = useId();
  const [body, setBody] = useState(initial);
  const [state, formAction, pending] = useActionState<OwnerActionState, FormData>(
    submitOwnerResponse,
    { status: "idle" },
  );
  const remaining = RESPONSE_MAX - body.length;
  const tooShort = body.trim().length < RESPONSE_MIN;
  const tooLong = body.length > RESPONSE_MAX;
  const disabled = pending || tooShort || tooLong;

  return (
    <form action={formAction} className="mt-3 space-y-3">
      <input type="hidden" name="reviewId" value={reviewId} />
      <label htmlFor={fieldId} className="block text-[0.82rem] font-semibold text-strong">
        پاسخ عمومی شما
      </label>
      <textarea
        id={fieldId}
        name="body"
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={RESPONSE_MAX}
        required
        minLength={RESPONSE_MIN}
        placeholder="پاسخ شما در زیر این نظر برای همه نمایش داده می‌شود. صادقانه و کوتاه باشد."
        className="w-full rounded-2xl border border-glass-border bg-glass/60 p-3 text-[0.9rem] leading-[1.95] text-strong placeholder:text-muted/70 focus:border-mint/40 focus:outline-none"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 text-[0.72rem]">
        <span className={tooLong ? "text-rose-300" : "text-muted"}>
          {faNum(remaining)} کاراکتر باقی‌مانده
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-glass-border bg-glass px-3.5 py-1.5 text-[0.78rem] font-semibold text-muted hover:text-strong"
          >
            انصراف
          </button>
          {initial ? (
            <button
              type="submit"
              name="intent"
              value="delete"
              disabled={pending}
              className="rounded-full border border-rose-400/30 bg-rose-400/10 px-3.5 py-1.5 text-[0.78rem] font-bold text-rose-300 hover:bg-rose-400/15 disabled:opacity-50"
            >
              حذف پاسخ
            </button>
          ) : null}
          <button
            type="submit"
            name="intent"
            value="save"
            disabled={disabled}
            className={`${BTN_PRIMARY} px-3.5 py-1.5 text-[0.78rem] disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {pending ? "در حال ارسال…" : initial ? "ذخیره تغییرات" : "ارسال پاسخ"}
          </button>
        </div>
      </div>
      {state.status === "error" && state.message ? (
        <p role="alert" className="text-[0.78rem] text-rose-300">{state.message}</p>
      ) : null}
      {state.status === "ok" && state.message ? (
        <p role="status" className="text-[0.78rem] text-mint">{state.message}</p>
      ) : null}
    </form>
  );
}

function FlagComposer({
  reviewId,
  onCancel,
}: {
  reviewId: string;
  onCancel: () => void;
}) {
  const fieldId = useId();
  const [state, formAction, pending] = useActionState<OwnerActionState, FormData>(
    flagReviewForRemoval,
    { status: "idle" },
  );
  return (
    <form action={formAction} className="mt-3 space-y-3 rounded-2xl border border-rose-400/25 bg-rose-400/[0.05] p-4">
      <input type="hidden" name="reviewId" value={reviewId} />
      <div>
        <label className="block text-[0.82rem] font-semibold text-strong">دلیل گزارش</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {FLAG_REASONS.map((r) => (
            <label key={r} className="cursor-pointer">
              <input type="radio" name="reason" value={r} required className="peer sr-only" />
              <span className="inline-flex rounded-full border border-glass-border bg-glass px-3 py-1.5 text-[0.78rem] font-semibold text-muted peer-checked:border-rose-400/40 peer-checked:bg-rose-400/10 peer-checked:text-rose-200">
                {r}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor={fieldId} className="block text-[0.82rem] font-semibold text-strong">
          توضیحات (اختیاری)
        </label>
        <textarea
          id={fieldId}
          name="notes"
          rows={3}
          maxLength={500}
          placeholder="چه چیزی این نظر را غیرمعتبر می‌کند؟"
          className="mt-2 w-full rounded-2xl border border-glass-border bg-glass/60 p-3 text-[0.88rem] leading-[1.9] text-strong placeholder:text-muted/70 focus:border-rose-400/40 focus:outline-none"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-glass-border bg-glass px-3.5 py-1.5 text-[0.78rem] font-semibold text-muted hover:text-strong"
        >
          انصراف
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-rose-400/40 bg-rose-400/15 px-3.5 py-1.5 text-[0.78rem] font-bold text-rose-200 hover:bg-rose-400/25 disabled:opacity-50"
        >
          {pending ? "در حال ارسال…" : "ارسال گزارش"}
        </button>
      </div>
      {state.status === "error" && state.message ? (
        <p role="alert" className="text-[0.78rem] text-rose-300">{state.message}</p>
      ) : null}
      {state.status === "ok" && state.message ? (
        <p role="status" className="text-[0.78rem] text-mint">{state.message}</p>
      ) : null}
    </form>
  );
}
