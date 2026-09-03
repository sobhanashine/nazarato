"use client";

import { useActionState, useState } from "react";
import {
  ASPECT_LABELS,
  ISSUE_CLUSTER_LABELS,
  type SupportedInsight,
} from "@/lib/data/owner-action-insights";
import type { CorrectionChoice } from "@/lib/data/owner-decision-workspace";
import {
  createImprovementAction,
  submitAnalysisCorrection,
  type InsightActionState,
} from "./actions";

const INITIAL_STATE: InsightActionState = { status: "idle" };

const SENTIMENT_OPTIONS = [
  { value: "positive", label: "مثبت" },
  { value: "negative", label: "منفی" },
  { value: "mixed", label: "ترکیبی" },
  { value: "neutral", label: "خنثی" },
] as const;

const FIELD =
  "min-h-11 w-full rounded-xl border border-glass-border bg-black/20 px-3.5 text-[0.84rem] text-strong outline-none transition focus:border-mint/60 focus:ring-2 focus:ring-mint/10";

export function OwnerDecisionControls({
  businessId,
  correctionChoices,
  supportedIssues,
  actionStoreAvailable,
  hasActiveAction,
  hasUnversionedEvidence,
}: {
  businessId: string;
  correctionChoices: CorrectionChoice[];
  supportedIssues: SupportedInsight[];
  actionStoreAvailable: boolean;
  hasActiveAction: boolean;
  hasUnversionedEvidence: boolean;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <CorrectionForm
        businessId={businessId}
        correctionChoices={correctionChoices}
      />
      <ImprovementForm
        businessId={businessId}
        supportedIssues={supportedIssues}
        actionStoreAvailable={actionStoreAvailable}
        hasActiveAction={hasActiveAction}
        hasUnversionedEvidence={hasUnversionedEvidence}
      />
    </div>
  );
}

function CorrectionForm({
  businessId,
  correctionChoices,
}: {
  businessId: string;
  correctionChoices: CorrectionChoice[];
}) {
  const [state, formAction, pending] = useActionState(
    submitAnalysisCorrection,
    INITIAL_STATE,
  );
  const [sentiment, setSentiment] = useState("negative");
  const needsIssueCluster = sentiment === "negative" || sentiment === "mixed";

  return (
    <form
      action={formAction}
      className="relative overflow-hidden rounded-3xl border border-lapis/25 bg-lapis/[0.055] p-5 sm:p-6"
    >
      <div
        aria-hidden
        className="absolute -start-10 -top-14 h-32 w-32 rounded-full bg-lapis/10 blur-2xl"
      />
      <div className="relative">
        <span className="text-[0.7rem] font-black tracking-[0.12em] text-lapis">
          انسان در حلقه
        </span>
        <h3 className="mt-2 text-[1.05rem] font-black text-strong">
          برداشت سیستم را اصلاح کن
        </h3>
        <p className="mt-1 text-[0.78rem] leading-[1.85] text-muted">
          خروجی قبلی پاک نمی‌شود؛ اصلاح تو کنار نسخه مدل می‌ماند و برای ارزیابی بعدی استفاده می‌شود.
        </p>

        {correctionChoices.length === 0 ? (
          <p className="mt-5 rounded-xl border border-glass-border bg-black/15 p-3 text-[0.78rem] text-muted">
            هنوز نظر قابل‌اصلاحی وجود ندارد.
          </p>
        ) : (
          <>
            <input type="hidden" name="businessId" value={businessId} />
            <div className="mt-5 space-y-3">
              <label className="block space-y-1.5 text-[0.76rem] font-bold text-muted">
                <span>نظر مرجع</span>
                <select name="reviewId" required className={FIELD}>
                  {correctionChoices.map((review) => (
                    <option key={review.id} value={review.id}>
                      {review.corrected ? "اصلاح‌شده — " : ""}{review.excerpt}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5 text-[0.76rem] font-bold text-muted">
                  <span>حس درست</span>
                  <select
                    name="sentiment"
                    value={sentiment}
                    onChange={(event) => setSentiment(event.target.value)}
                    className={FIELD}
                  >
                    {SENTIMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5 text-[0.76rem] font-bold text-muted">
                  <span>موضوع درست</span>
                  <select name="aspect" defaultValue="service" className={FIELD}>
                    {Object.entries(ASPECT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-1.5 text-[0.76rem] font-bold text-muted">
                <span>خوشه مسئله</span>
                <select
                  name="issueCluster"
                  defaultValue="service_experience"
                  disabled={!needsIssueCluster}
                  required={needsIssueCluster}
                  className={`${FIELD} disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  {Object.entries(ISSUE_CLUSTER_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5 text-[0.76rem] font-bold text-muted">
                <span>توضیح کوتاه <span className="font-normal">(اختیاری)</span></span>
                <textarea
                  name="note"
                  maxLength={500}
                  rows={2}
                  className={`${FIELD} py-3 leading-[1.8]`}
                  placeholder="چرا این برچسب دقیق‌تر است؟"
                />
              </label>
            </div>
            <SubmitResult state={state} />
            <button
              type="submit"
              disabled={pending}
              className="mt-4 min-h-11 w-full rounded-xl border border-lapis/35 bg-lapis/15 px-4 text-[0.82rem] font-black text-lapis transition hover:bg-lapis/20 disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? "در حال ثبت…" : "ثبت اصلاح با حفظ تاریخچه"}
            </button>
          </>
        )}
      </div>
    </form>
  );
}

function ImprovementForm({
  businessId,
  supportedIssues,
  actionStoreAvailable,
  hasActiveAction,
  hasUnversionedEvidence,
}: {
  businessId: string;
  supportedIssues: SupportedInsight[];
  actionStoreAvailable: boolean;
  hasActiveAction: boolean;
  hasUnversionedEvidence: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    createImprovementAction,
    INITIAL_STATE,
  );
  const leading = supportedIssues[0];
  const [selectedKey, setSelectedKey] = useState(
    leading ? `${leading.aspect}:${leading.issueCluster ?? "general_dissatisfaction"}` : "",
  );
  const selectedIssue =
    supportedIssues.find(
      (issue) =>
        `${issue.aspect}:${issue.issueCluster ?? "general_dissatisfaction"}` === selectedKey,
    ) ?? leading;

  return (
    <form
      action={formAction}
      className="relative overflow-hidden rounded-3xl border border-mint/25 bg-mint/[0.055] p-5 sm:p-6"
    >
      <div
        aria-hidden
        className="absolute -end-12 -top-12 h-36 w-36 rounded-full bg-mint/10 blur-2xl"
      />
      <div className="relative">
        <span className="text-[0.7rem] font-black tracking-[0.12em] text-mint">
          چرخه اقدام
        </span>
        <h3 className="mt-2 text-[1.05rem] font-black text-strong">
          یک تغییر قابل‌اندازه‌گیری تعریف کن
        </h3>
        <p className="mt-1 text-[0.78rem] leading-[1.85] text-muted">
          «قبل» از ۹۰ روز اخیر ثبت می‌شود؛ در تاریخ انتخابی دوباره همان متریک را می‌سنجیم.
        </p>

        {!actionStoreAvailable ? (
          <p className="mt-5 rounded-xl border border-amber-300/25 bg-amber-300/[0.07] p-3 text-[0.78rem] leading-[1.8] text-amber-200">
            دیتامدل این قابلیت آماده است، اما لایه ذخیره‌سازی هنوز روی دیتابیس این محیط فعال نشده.
          </p>
        ) : hasActiveAction ? (
          <p className="mt-5 rounded-xl border border-mint/20 bg-black/15 p-3 text-[0.78rem] leading-[1.8] text-muted">
            یک چرخه فعال داری. بعد از سنجش یا لغو آن می‌توانی اقدام تازه بسازی.
          </p>
        ) : hasUnversionedEvidence ? (
          <p className="mt-5 rounded-xl border border-amber-300/25 bg-amber-300/[0.07] p-3 text-[0.78rem] leading-[1.8] text-amber-100">
            برای یک خط پایه قابل‌بازتولید، ابتدا باید همه تحلیل‌های بازه در دیتابیس نسخه‌دار ذخیره شوند.
          </p>
        ) : !leading || !selectedIssue ? (
          <p className="mt-5 rounded-xl border border-glass-border bg-black/15 p-3 text-[0.78rem] leading-[1.8] text-muted">
            هنوز سه شاهد مستقل و قابل‌اعتماد برای ساخت یک اقدام نداریم.
          </p>
        ) : (
          <>
            <input type="hidden" name="businessId" value={businessId} />
            <input type="hidden" name="targetAspect" value={selectedIssue.aspect} />
            <input
              type="hidden"
              name="targetIssueCluster"
              value={selectedIssue.issueCluster ?? "general_dissatisfaction"}
            />
            <div className="mt-5 space-y-3">
              <label className="block space-y-1.5 text-[0.76rem] font-bold text-muted">
                <span>عنوان اقدام</span>
                <input
                  name="title"
                  required
                  minLength={5}
                  maxLength={160}
                  className={FIELD}
                  defaultValue={`کاهش مشکل ${ISSUE_CLUSTER_LABELS[leading.issueCluster ?? "general_dissatisfaction"]}`}
                />
              </label>
              <label className="block space-y-1.5 text-[0.76rem] font-bold text-muted">
                <span>مسئله هدف</span>
                <select
                  value={selectedKey}
                  onChange={(event) => setSelectedKey(event.target.value)}
                  className={FIELD}
                >
                  {supportedIssues.map((issue) => {
                    const cluster = issue.issueCluster ?? "general_dissatisfaction";
                    const key = `${issue.aspect}:${cluster}`;
                    return (
                      <option key={key} value={key}>
                        {ASPECT_LABELS[issue.aspect]} — {ISSUE_CLUSTER_LABELS[cluster]}
                      </option>
                    );
                  })}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5 text-[0.76rem] font-bold text-muted">
                  <span>هدف کاهش</span>
                  <div className="relative">
                    <input
                      name="targetReductionPct"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={90}
                      defaultValue={25}
                      required
                      className={`${FIELD} ps-10`}
                    />
                    <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[0.75rem] text-muted">٪</span>
                  </div>
                </label>
                <label className="block space-y-1.5 text-[0.76rem] font-bold text-muted">
                  <span>تاریخ سنجش مجدد</span>
                  <input
                    name="followUpDate"
                    type="date"
                    required
                    className={FIELD}
                  />
                </label>
              </div>
            </div>
            <SubmitResult state={state} />
            <button
              type="submit"
              disabled={pending}
              className="mt-4 min-h-11 w-full rounded-xl bg-mint px-4 text-[0.82rem] font-black text-[#03130e] transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? "در حال ساخت چرخه…" : "ثبت اقدام و خط پایه"}
            </button>
          </>
        )}
      </div>
    </form>
  );
}

function SubmitResult({ state }: { state: InsightActionState }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <p
      aria-live="polite"
      className={`mt-3 rounded-xl border px-3 py-2 text-[0.76rem] leading-[1.7] ${
        state.status === "ok"
          ? "border-mint/25 bg-mint/[0.08] text-mint"
          : "border-rose-400/25 bg-rose-400/[0.08] text-rose-200"
      }`}
    >
      {state.message}
    </p>
  );
}
