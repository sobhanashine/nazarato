"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { GLASS } from "@/components/ui/styles";
import {
  filterOsmReviewCandidates,
  sortOsmReviewCandidatesForReview,
  summarizeOsmReviewCandidates,
  type OsmReviewCandidate,
  type OsmReviewCategory,
  type OsmReviewCompleteness,
  type OsmPrescreenRecommendation,
  type OsmSourceReviewDecision,
} from "@/lib/admin/osm-review";
import { OSM_PRESCREEN_REASON_LABELS } from "@/lib/admin/osm-prescreen";
import type {
  OsmCompletionContact,
  OsmCompletionPermissionBasis,
} from "@/lib/admin/osm-completion";
import { canApproveOsmPublication } from "@/lib/admin/osm-publication";
import { buildOsmPublicationPreview } from "@/lib/admin/osm-publication-preview";
import {
  approveOsmSourcePublication,
  recordOsmCompletionProposal,
  recordOsmSourceReviewDecision,
} from "./actions";

const faNum = (value: number) => value.toLocaleString("fa-IR");

const CATEGORY_LABELS: Record<OsmReviewCategory, string> = {
  cafe: "کافه",
  restaurant: "رستوران",
};

const REVIEW_LABELS: Record<OsmSourceReviewDecision, string> = {
  unreviewed: "بررسی‌نشده",
  needs_correction: "نیازمند اصلاح",
  ready_for_approval: "آماده بررسی انتشار",
  rejected: "ردشده",
};

const REVIEW_TONES: Record<OsmSourceReviewDecision, string> = {
  unreviewed: "border-white/15 bg-white/[0.04] text-muted",
  needs_correction: "border-[#f4c66b]/30 bg-[#f4c66b]/[0.08] text-[#f4c66b]",
  ready_for_approval: "border-mint/30 bg-mint/[0.08] text-mint",
  rejected: "border-pomegr/30 bg-pomegr/[0.08] text-pomegr",
};

const PRESCREEN_LABELS: Record<OsmPrescreenRecommendation, string> = {
  low_risk_review: "کم‌ریسک برای بررسی",
  needs_completion: "نیازمند تکمیل",
  high_risk_exception: "استثنای پرریسک",
};

const PRESCREEN_TONES: Record<OsmPrescreenRecommendation, string> = {
  low_risk_review: "border-mint/30 bg-mint/[0.08] text-mint",
  needs_completion: "border-[#f4c66b]/30 bg-[#f4c66b]/[0.08] text-[#f4c66b]",
  high_risk_exception: "border-pomegr/30 bg-pomegr/[0.08] text-pomegr",
};

const PRESCREEN_BAR_TONES: Record<OsmPrescreenRecommendation, string> = {
  low_risk_review: "bg-mint",
  needs_completion: "bg-[#f4c66b]",
  high_risk_exception: "bg-pomegr",
};

const PRESCREEN_DESCRIPTIONS: Record<OsmPrescreenRecommendation, string> = {
  low_risk_review: "منبع و اطلاعات پایه برای بررسی انسانی کافی است.",
  needs_completion: "پیش از تصمیم انسانی، اطلاعات زمینه‌ای باید تکمیل شود.",
  high_risk_exception: "یک قاعده سخت شکست خورده؛ ابتدا منبع یا هویت بررسی شود.",
};

function formatCapturedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "نامشخص";
  return date.toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function CompletenessMeter({ candidate }: { candidate: OsmReviewCandidate }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[0.68rem]">
        <span className="font-bold text-muted">کامل‌بودن اطلاعات</span>
        <span className="font-black text-strong">
          {faNum(candidate.completenessScore)} از {faNum(candidate.completenessTotal)}
        </span>
      </div>
      <div
        className="mt-2 grid grid-cols-4 gap-1"
        aria-label={`کامل‌بودن اطلاعات: ${candidate.completenessScore} از ${candidate.completenessTotal}`}
      >
        {Array.from({ length: candidate.completenessTotal }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 rounded-full ${
              index < candidate.completenessScore ? "bg-mint" : "bg-white/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function PrescreenPanel({ candidate }: { candidate: OsmReviewCandidate }) {
  const { prescreen } = candidate;
  return (
    <section className="rounded-2xl border border-white/[0.09] bg-black/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[0.58rem] font-bold text-white/35">
            پیش‌غربالگری توضیح‌پذیر
          </p>
          <p className="mt-0.5 text-[0.58rem] text-white/30" dir="ltr">
            {prescreen.version}
          </p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[0.62rem] font-black ${PRESCREEN_TONES[prescreen.recommendation]}`}
        >
          {PRESCREEN_LABELS[prescreen.recommendation]}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <strong className="text-lg font-black tabular-nums text-strong">
          {faNum(prescreen.score)}
        </strong>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${PRESCREEN_BAR_TONES[prescreen.recommendation]}`}
            style={{ width: `${prescreen.score}%` }}
          />
        </div>
        <span className="text-[0.58rem] text-white/35">از ۱۰۰</span>
      </div>
      <p className="mt-2 text-[0.64rem] leading-5 text-muted">
        {PRESCREEN_DESCRIPTIONS[prescreen.recommendation]}
      </p>
      <ul className="mt-3 space-y-1.5">
        {prescreen.reasonCodes.map((reasonCode) => (
          <li
            key={reasonCode}
            className="flex items-start gap-2 text-[0.62rem] leading-5 text-muted"
          >
            <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/35" />
            {OSM_PRESCREEN_REASON_LABELS[reasonCode]}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CriteriaSnapshot({ candidate }: { candidate: OsmReviewCandidate }) {
  const criteria = [
    ["تلفن", Boolean(candidate.contact.phone)],
    ["نشانی", Boolean(candidate.contact.address)],
    ["وب‌سایت", Boolean(candidate.contact.website)],
    ["اینستاگرام", Boolean(candidate.contact.instagram)],
    ["منبع و مجوز", Boolean(candidate.sourceUrl && candidate.licenseUrl)],
  ] as const;
  return (
    <ul className="grid grid-cols-2 gap-1.5 text-[0.64rem] sm:grid-cols-3">
      {criteria.map(([label, present]) => (
        <li
          key={label}
          className={`rounded-lg border px-2 py-1.5 font-bold ${
            present
              ? "border-mint/20 bg-mint/[0.06] text-mint"
              : "border-white/10 bg-white/[0.03] text-white/35"
          }`}
        >
          {present ? "✓" : "—"} {label}
        </li>
      ))}
    </ul>
  );
}

const COMPLETION_FIELDS = [
  {
    key: "phone",
    label: "تلفن",
    placeholder: "مثلاً ۰۱۳ ۳۳۱۱ ۲۲۳۳",
    direction: "ltr",
  },
  {
    key: "address",
    label: "نشانی",
    placeholder: "نشانی عمومی کسب‌وکار",
    direction: "rtl",
  },
  {
    key: "website",
    label: "وب‌سایت",
    placeholder: "https://example.ir",
    direction: "ltr",
  },
  {
    key: "instagram",
    label: "اینستاگرام",
    placeholder: "@business",
    direction: "ltr",
  },
] as const;

const COMPLETION_LABELS: Record<keyof OsmCompletionContact, string> = {
  phone: "تلفن",
  address: "نشانی",
  website: "وب‌سایت",
  instagram: "اینستاگرام",
};

function CompletionProposalPanel({ candidate }: { candidate: OsmReviewCandidate }) {
  const router = useRouter();
  const [contact, setContact] = useState<OsmCompletionContact>({});
  const [sourceRef, setSourceRef] = useState("");
  const [permissionBasis, setPermissionBasis] =
    useState<OsmCompletionPermissionBasis>("unknown");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const missingFields = COMPLETION_FIELDS.filter(
    ({ key }) => !candidate.contact[key],
  );
  const hasContactValue = Object.values(contact).some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-[#f4c66b]/25 bg-[#f4c66b]/[0.045]">
      <div className="border-b border-[#f4c66b]/15 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-[0.72rem] font-black text-[#f4c66b]">
              پیشنهاد تکمیل منبع‌دار
            </h3>
            <p className="mt-1 text-[0.62rem] leading-5 text-muted">
              یک مدرک جدا و قرنطینه ثبت می‌شود؛ داده‌ی OSM، امتیاز ماشین و وضعیت
              انتشار تغییر نمی‌کند.
            </p>
          </div>
          <span className="rounded-full border border-[#f4c66b]/25 px-2.5 py-1 text-[0.58rem] font-black text-[#f4c66b]">
            {faNum(candidate.completionProposals.length)} مدرک
          </span>
        </div>
      </div>

      {candidate.completionProposals.length > 0 && (
        <ol className="space-y-2 border-b border-[#f4c66b]/15 p-3 sm:p-4">
          {candidate.completionProposals.map((proposal) => (
            <li
              key={proposal.id}
              className="rounded-xl border border-white/[0.08] bg-black/20 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`rounded-full border px-2 py-1 text-[0.58rem] font-black ${
                    proposal.permissionBasis === "public_factual_contact"
                      ? "border-mint/25 bg-mint/[0.06] text-mint"
                      : "border-pomegr/25 bg-pomegr/[0.06] text-pomegr"
                  }`}
                >
                  {proposal.permissionBasis === "public_factual_contact"
                    ? "اطلاعات عمومی رسمی · هنوز قرنطینه"
                    : "مجوز نامشخص · غیرقابل استفاده"}
                </span>
                <time className="text-[0.58rem] text-white/35">
                  {formatCapturedAt(proposal.capturedAt)}
                </time>
              </div>
              <dl className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {Object.entries(proposal.contact).map(([key, value]) => (
                  <div key={key} className="rounded-lg bg-white/[0.035] px-2.5 py-2">
                    <dt className="text-[0.56rem] text-white/35">
                      {COMPLETION_LABELS[key as keyof OsmCompletionContact]}
                    </dt>
                    <dd className="mt-0.5 break-words text-[0.64rem] text-strong">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                {proposal.sourceWarning ? (
                  <span className="text-[0.6rem] text-pomegr">
                    {proposal.sourceWarning}؛ لینک نمایش داده نشد.
                  </span>
                ) : (
                  <a
                    href={proposal.sourceUrl ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.62rem] font-bold text-[#aeb7ff] underline decoration-[#aeb7ff]/35 underline-offset-4"
                  >
                    مشاهده منبع مدرک
                  </a>
                )}
                <span className="text-[0.56rem] text-white/30">
                  {proposal.createdBy ? "ثبت‌شده توسط ادمین" : "ثبت‌کننده نامشخص"}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}

      {candidate.prescreen.recommendation === "needs_completion" &&
      missingFields.length > 0 ? (
        <form
          className="space-y-3 p-3 sm:p-4"
          onSubmit={(event) => {
            event.preventDefault();
            setFeedback(null);
            startTransition(async () => {
              const result = await recordOsmCompletionProposal({
                sourceId: candidate.sourceId,
                sourceRef,
                permissionBasis,
                contact,
              });
              if (!result.ok) {
                setFeedback(result.error);
                return;
              }
              setFeedback(
                result.noAction
                  ? "این مدرک قبلاً ثبت شده است."
                  : "مدرک در قرنطینه ثبت شد؛ هنوز در داده کسب‌وکار استفاده نشده است.",
              );
              if (!result.noAction) {
                setContact({});
                setSourceRef("");
                setPermissionBasis("unknown");
                router.refresh();
              }
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {missingFields.map(({ key, label, placeholder, direction }) => (
              <label key={key} className="block">
                <span className="mb-1.5 block text-[0.62rem] font-bold text-muted">
                  {label} گمشده
                </span>
                <input
                  type={key === "website" ? "url" : "text"}
                  value={contact[key] ?? ""}
                  disabled={isPending}
                  dir={direction}
                  onChange={(event) =>
                    setContact((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  placeholder={placeholder}
                  className="min-h-11 w-full rounded-xl border border-glass-border bg-[#0a0e18] px-3 text-[0.7rem] text-strong outline-none placeholder:text-white/25 focus:border-[#f4c66b] disabled:opacity-60"
                />
              </label>
            ))}
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[0.62rem] font-bold text-muted">
              لینک دقیق منبع · اجباری
            </span>
            <input
              type="url"
              required
              value={sourceRef}
              disabled={isPending}
              dir="ltr"
              onChange={(event) => setSourceRef(event.target.value)}
              placeholder="https://business.example/contact"
              className="min-h-11 w-full rounded-xl border border-glass-border bg-[#0a0e18] px-3 text-[0.7rem] text-strong outline-none placeholder:text-white/25 focus:border-[#f4c66b] disabled:opacity-60"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[0.62rem] font-bold text-muted">
              مبنای استفاده از منبع
            </span>
            <select
              value={permissionBasis}
              disabled={isPending}
              onChange={(event) =>
                setPermissionBasis(
                  event.target.value as OsmCompletionPermissionBasis,
                )
              }
              className="min-h-11 w-full rounded-xl border border-glass-border bg-[#0a0e18] px-3 text-[0.7rem] font-bold text-strong outline-none focus:border-[#f4c66b] disabled:opacity-60"
            >
              <option value="unknown">نامشخص · فقط سرنخ، غیرقابل استفاده</option>
              <option value="public_factual_contact">
                صفحه رسمی کسب‌وکار · اطلاعات عمومی factual
              </option>
            </select>
          </label>
          <p className="rounded-xl border border-pomegr/20 bg-pomegr/[0.05] p-2.5 text-[0.61rem] leading-5 text-muted">
            Google Maps، نشان، بلد، دیجی‌کالا، باسلام، ترب، اسنپ و دایرکتوری‌های
            مشابه را «نامشخص» ثبت کن. نظر، امتیاز، تصویر و توضیح تبلیغاتی اینجا
            مجاز نیست.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[0.58rem] text-white/35">
              فقط فیلدهای خالی OSM قابل پیشنهادند.
            </span>
            <button
              type="submit"
              disabled={isPending || !hasContactValue || sourceRef.trim().length === 0}
              className="min-h-11 rounded-full border border-[#f4c66b]/35 bg-[#f4c66b]/10 px-4 text-[0.68rem] font-black text-[#f4c66b] transition-colors hover:bg-[#f4c66b]/15 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isPending ? "در حال ثبت…" : "ثبت مدرک در قرنطینه"}
            </button>
          </div>
          {feedback && (
            <p
              className={`rounded-xl border p-2.5 text-[0.64rem] leading-5 ${
                feedback.includes("قرنطینه") || feedback.includes("قبلاً")
                  ? "border-mint/20 bg-mint/[0.06] text-mint"
                  : "border-pomegr/25 bg-pomegr/[0.07] text-pomegr"
              }`}
              role="status"
            >
              {feedback}
            </p>
          )}
        </form>
      ) : (
        <p className="p-3 text-[0.64rem] leading-5 text-muted sm:p-4">
          {candidate.prescreen.recommendation === "needs_completion"
            ? "OSM هر چهار فیلد اصلی را دارد؛ فرم تکمیل برای جلوگیری از بازنویسی بسته است."
            : "این رکورد در صف نیازمند تکمیل نیست؛ فرم ثبت مدرک برای جلوگیری از تغییر خارج از صف بسته است."}
        </p>
      )}
    </section>
  );
}

function ReviewDecisionPanel({ candidate }: { candidate: OsmReviewCandidate }) {
  const router = useRouter();
  const [decision, setDecision] = useState<OsmSourceReviewDecision>(
    candidate.reviewState,
  );
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const requiresNote =
    decision === "needs_correction" || decision === "rejected";

  return (
    <section className="mt-4 rounded-2xl border border-white/[0.09] bg-black/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[0.72rem] font-black text-strong">تصمیم بررسی داخلی</h3>
        <span
          className={`rounded-full border px-2.5 py-1 text-[0.62rem] font-black ${REVIEW_TONES[candidate.reviewState]}`}
        >
          {REVIEW_LABELS[candidate.reviewState]}
        </span>
      </div>

      <div className="mt-3">
        <p className="mb-2 text-[0.62rem] font-bold text-white/40">
          snapshot معیارهای فعلی
        </p>
        <CriteriaSnapshot candidate={candidate} />
      </div>

      <div className="mt-3">
        <PrescreenPanel candidate={candidate} />
      </div>

      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setFeedback(null);
          startTransition(async () => {
            const result = await recordOsmSourceReviewDecision({
              sourceId: candidate.sourceId,
              decision,
              note,
            });
            if (!result.ok) {
              setFeedback(result.error);
              return;
            }
            setFeedback(
              result.noAction
                ? "این تصمیم قبلاً به‌عنوان آخرین وضعیت ثبت شده است."
                : "تصمیم ثبت شد؛ وضعیت انتشار همچنان قرنطینه است.",
            );
            if (!result.noAction) {
              setNote("");
              router.refresh();
            }
          });
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-[0.65rem] font-bold text-muted">
            وضعیت بررسی
          </span>
          <select
            value={decision}
            disabled={isPending}
            onChange={(event) =>
              setDecision(event.target.value as OsmSourceReviewDecision)
            }
            className="min-h-11 w-full rounded-xl border border-glass-border bg-[#0a0e18] px-3 text-[0.72rem] font-bold text-strong outline-none focus:border-mint disabled:opacity-60"
          >
            <option value="unreviewed">بررسی‌نشده</option>
            <option value="needs_correction">نیازمند اصلاح</option>
            <option value="ready_for_approval">آماده بررسی انتشار</option>
            <option value="rejected">ردشده</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[0.65rem] font-bold text-muted">
            توضیح {requiresNote ? "(اجباری)" : "(اختیاری)"}
          </span>
          <textarea
            value={note}
            required={requiresNote}
            maxLength={500}
            disabled={isPending}
            onChange={(event) => setNote(event.target.value)}
            placeholder="دلیل تصمیم یا موردی که باید بررسی شود…"
            className="min-h-20 w-full resize-y rounded-xl border border-glass-border bg-black/20 px-3 py-2 text-[0.72rem] leading-6 text-strong outline-none placeholder:text-white/25 focus:border-mint disabled:opacity-60"
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[0.6rem] text-white/35">
            {faNum(note.length)} از {faNum(500)}
          </span>
          <button
            type="submit"
            disabled={isPending || (requiresNote && note.trim().length === 0)}
            className="min-h-11 rounded-full border border-mint/35 bg-mint/10 px-4 text-[0.7rem] font-black text-mint transition-colors hover:bg-mint/15 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isPending ? "در حال ثبت…" : "ثبت تصمیم داخلی"}
          </button>
        </div>
        {feedback && (
          <p
            className={`rounded-xl border p-2.5 text-[0.66rem] leading-5 ${
              feedback.startsWith("تصمیم ثبت شد") || feedback.startsWith("این تصمیم")
                ? "border-mint/20 bg-mint/[0.06] text-mint"
                : "border-pomegr/25 bg-pomegr/[0.07] text-pomegr"
            }`}
            role="status"
          >
            {feedback}
          </p>
        )}
      </form>

      <details className="group/history mt-4 border-t border-white/[0.08] pt-2">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-[0.66rem] font-bold text-muted [&::-webkit-details-marker]:hidden">
          <span>تاریخچه تصمیم‌ها ({faNum(candidate.reviewHistory.length)})</span>
          <span aria-hidden className="transition-transform group-open/history:rotate-45">
            +
          </span>
        </summary>
        {candidate.reviewHistory.length > 0 ? (
          <ol className="space-y-2 pb-1 pt-2">
            {candidate.reviewHistory.map((event) => (
              <li key={event.id} className="rounded-xl border border-white/[0.08] p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-[0.64rem] text-strong">
                    {REVIEW_LABELS[event.decision]}
                  </strong>
                  <time className="text-[0.58rem] text-white/35">
                    {formatCapturedAt(event.createdAt)}
                  </time>
                </div>
                {event.note && (
                  <p className="mt-1.5 text-[0.64rem] leading-5 text-muted">
                    {event.note}
                  </p>
                )}
                {event.criteriaSnapshot.prescreen && (
                  <p className="mt-1.5 text-[0.58rem] leading-5 text-white/35">
                    snapshot ماشین: {PRESCREEN_LABELS[event.criteriaSnapshot.prescreen.recommendation]}
                    {" · "}امتیاز {faNum(event.criteriaSnapshot.prescreen.score)}
                    {" · "}
                    <span dir="ltr">{event.criteriaSnapshot.prescreen.version}</span>
                  </p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="pb-2 pt-1 text-[0.64rem] text-white/35">
            هنوز تصمیمی ثبت نشده است.
          </p>
        )}
      </details>
    </section>
  );
}

function PublicationPayloadPreview({
  candidate,
}: {
  candidate: OsmReviewCandidate;
}) {
  const preview = buildOsmPublicationPreview(candidate);
  const headingId = `publication-preview-${candidate.slug}`;

  if (preview.status === "blocked") {
    return (
      <section
        className="mt-4 rounded-2xl border border-pomegr/25 bg-pomegr/[0.055] p-3 sm:p-4"
        aria-labelledby={headingId}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id={headingId} className="text-[0.74rem] font-black text-pomegr">
            پیش‌نمایش قبل از انتشار مسدود است
          </h3>
          <span className="rounded-full border border-pomegr/25 bg-pomegr/[0.08] px-2.5 py-1 text-[0.58rem] font-black text-pomegr">
            خصوصی · بدون انتشار
          </span>
        </div>
        <p className="mt-2 text-[0.64rem] leading-5 text-muted">
          {preview.reason}
        </p>
      </section>
    );
  }

  const identityFields = [
    { label: "نام عمومی", value: preview.identity.name, direction: "rtl" },
    { label: "دسته", value: preview.identity.category, direction: "rtl" },
    { label: "شهر", value: preview.identity.city, direction: "rtl" },
    {
      label: "مختصات",
      value: `${preview.identity.latitude}, ${preview.identity.longitude}`,
      direction: "ltr",
    },
  ] as const;

  return (
    <section
      className="mt-4 overflow-hidden rounded-2xl border border-[#88d8bd]/25 bg-[linear-gradient(145deg,rgba(110,231,183,0.07),rgba(8,14,20,0.76))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      aria-labelledby={headingId}
    >
      <div className="border-b border-white/[0.08] px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[0.56rem] font-black tracking-[0.16em] text-mint/70">
              PUBLIC PAYLOAD RECEIPT
            </p>
            <h3 id={headingId} className="mt-1 text-[0.82rem] font-black text-strong">
              آنچه کاربر خواهد دید
            </h3>
            <p className="mt-1 text-[0.62rem] leading-5 text-muted">
              این فقط بازنماییِ خواندنیِ دادهٔ مجاز است و هیچ رکوردی را منتشر
              نمی‌کند.
            </p>
          </div>
          <span className="rounded-full border border-[#f4c66b]/30 bg-[#f4c66b]/[0.08] px-2.5 py-1 text-[0.58rem] font-black text-[#f4c66b]">
            پیش‌نمایش · هنوز خصوصی
          </span>
        </div>
      </div>

      <div className="space-y-4 p-3 sm:p-4">
        <dl className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
          {identityFields.map((field) => (
            <div
              key={field.label}
              className="min-w-0 rounded-xl border border-white/[0.08] bg-black/20 p-2.5"
            >
              <dt className="text-[0.56rem] font-bold text-white/35">
                {field.label}
              </dt>
              <dd
                className="mt-1 break-words text-[0.68rem] font-bold leading-5 text-strong [overflow-wrap:anywhere]"
                dir={field.direction}
              >
                {field.value}
              </dd>
            </div>
          ))}
        </dl>

        <div>
          <h4 className="text-[0.62rem] font-black text-strong">اطلاعات تماس موجود</h4>
          {preview.contact.length > 0 ? (
            <dl className="mt-2 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
              {preview.contact.map((item) => (
                <div
                  key={item.label}
                  className="min-w-0 rounded-xl border border-white/[0.08] bg-black/20 p-2.5"
                >
                  <dt className="text-[0.56rem] font-bold text-white/35">
                    {item.label}
                  </dt>
                  <dd
                    className="mt-1 break-words text-[0.66rem] leading-5 text-strong [overflow-wrap:anywhere]"
                    dir={item.direction}
                  >
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-2 rounded-xl border border-white/[0.08] bg-black/20 p-2.5 text-[0.62rem] text-white/40">
              هیچ اطلاعات تماسی در منبع مجاز موجود نیست.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-lapis/25 bg-lapis/[0.06] p-3">
          <h4 className="text-[0.62rem] font-black text-[#c6ccff]">
            انتساب منبع در نمای عمومی
          </h4>
          <p className="mt-1 break-words text-[0.64rem] leading-5 text-muted [overflow-wrap:anywhere]" dir="ltr">
            {preview.attribution.text}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={preview.attribution.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-full border border-mint/30 px-3 text-[0.62rem] font-bold text-mint transition-colors hover:bg-mint/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
            >
              منبع OSM
            </a>
            <a
              href={preview.attribution.licenseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-full border border-lapis/30 px-3 text-[0.62rem] font-bold text-[#c6ccff] transition-colors hover:bg-lapis/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis"
            >
              مجوز {preview.attribution.licenseName}
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-[#f4c66b]/20 bg-[#f4c66b]/[0.045] p-3">
          <h4 className="text-[0.62rem] font-black text-[#f4c66b]">
            عمداً در این پروفایل منتشر نمی‌شود
          </h4>
          <ul className="mt-2 space-y-1.5">
            {preview.excluded.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-[0.62rem] leading-5 text-muted"
              >
                <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#f4c66b]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function PublicationApprovalPanel({
  candidate,
}: {
  candidate: OsmReviewCandidate;
}) {
  const router = useRouter();
  const [confirmationSlug, setConfirmationSlug] = useState("");
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const [scopeConfirmed, setScopeConfirmed] = useState(false);
  const [attributionConfirmed, setAttributionConfirmed] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const eligible = canApproveOsmPublication(candidate);
  const checklistComplete =
    identityConfirmed && scopeConfirmed && attributionConfirmed;
  const slugMatches =
    confirmationSlug.trim().toLocaleLowerCase("en-US") === candidate.slug;

  if (!eligible) {
    return (
      <section className="mt-4 rounded-2xl border border-pomegr/25 bg-pomegr/[0.055] p-3 sm:p-4">
        <h3 className="text-[0.72rem] font-black text-pomegr">
          انتشار این رکورد مسدود است
        </h3>
        <p className="mt-1 text-[0.64rem] leading-5 text-muted">
          «آماده بررسی انتشار» به‌تنهایی کافی نیست. نسخه فعلی پیش‌غربالگری باید
          کم‌ریسک، امتیاز حداقل ۷۵، مختصات معتبر و لینک‌های دقیق OSM/ODbL داشته
          باشد. ابتدا تصمیم داخلی یا منبع را اصلاح کن.
        </p>
      </section>
    );
  }

  const confirmations = [
    {
      label: "نام، دسته، شهر و مختصات با همان کسب‌وکار تطابق دارد.",
      checked: identityConfirmed,
      setChecked: setIdentityConfirmed,
    },
    {
      label:
        "فقط داده‌های factual منتشر می‌شود؛ نظر، امتیاز، تصویر یا توضیح کپی نشده است.",
      checked: scopeConfirmed,
      setChecked: setScopeConfirmed,
    },
    {
      label:
        "نمایش انتساب © OpenStreetMap contributors و لینک ODbL در محصول آماده است.",
      checked: attributionConfirmed,
      setChecked: setAttributionConfirmed,
    },
  ];

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-mint/30 bg-mint/[0.055]">
      <div className="border-b border-mint/20 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-[0.76rem] font-black text-mint">
              دروازه انتشار واقعی
            </h3>
            <p className="mt-1 text-[0.62rem] leading-5 text-muted">
              این عملیات فقط همین منبع را تأیید و کسب‌وکار متناظر را فعال
              می‌کند؛ همه رکوردهای دیگر خصوصی می‌مانند.
            </p>
          </div>
          <span className="rounded-full border border-mint/30 bg-mint/[0.08] px-2.5 py-1 text-[0.58rem] font-black text-mint">
            تک‌به‌تک · قابل ممیزی
          </span>
        </div>
      </div>

      <form
        className="space-y-3 p-3 sm:p-4"
        onSubmit={(event) => {
          event.preventDefault();
          setFeedback(null);
          startTransition(async () => {
            const result = await approveOsmSourcePublication({
              sourceId: candidate.sourceId,
              confirmationSlug,
              identityConfirmed,
              scopeConfirmed,
              attributionConfirmed,
            });
            if (!result.ok) {
              setFeedback(result.error);
              return;
            }
            setFeedback(
              result.noAction
                ? "این رکورد قبلاً با مدرک ممیزی منتشر شده است."
                : "منبع تأیید و کسب‌وکار فعال شد؛ رکورد از صف خصوصی خارج می‌شود.",
            );
            if (!result.noAction) router.refresh();
          });
        }}
      >
        <fieldset className="space-y-2" disabled={isPending}>
          <legend className="mb-2 text-[0.62rem] font-black text-strong">
            تأییدهای اجباری
          </legend>
          {confirmations.map((item) => (
            <label
              key={item.label}
              className="flex min-h-11 cursor-pointer items-start gap-2.5 rounded-xl border border-white/[0.08] bg-black/20 p-2.5 text-[0.63rem] leading-5 text-muted"
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(event) => item.setChecked(event.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[#6ee7b7]"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </fieldset>

        <label className="block">
          <span className="mb-1.5 block text-[0.62rem] font-bold text-muted">
            برای تأیید نهایی این شناسه را تایپ کن
          </span>
          <span
            className="mb-2 block break-all rounded-lg border border-white/[0.08] bg-black/20 px-2.5 py-2 font-mono text-[0.62rem] text-mint"
            dir="ltr"
          >
            {candidate.slug}
          </span>
          <input
            type="text"
            value={confirmationSlug}
            disabled={isPending}
            dir="ltr"
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setConfirmationSlug(event.target.value)}
            placeholder={candidate.slug}
            className="min-h-11 w-full rounded-xl border border-glass-border bg-[#0a0e18] px-3 font-mono text-[0.68rem] text-strong outline-none placeholder:text-white/20 focus:border-mint disabled:opacity-60"
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[0.58rem] leading-5 text-white/35">
            سرور قبل از تراکنش، مجوز، هویت و آخرین تصمیم را دوباره می‌خواند.
          </span>
          <button
            type="submit"
            disabled={isPending || !checklistComplete || !slugMatches}
            className="min-h-11 rounded-full border border-mint/40 bg-mint/15 px-4 text-[0.68rem] font-black text-mint transition-colors hover:bg-mint/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? "در حال ثبت تراکنش…" : "تأیید و انتشار همین رکورد"}
          </button>
        </div>
        {feedback && (
          <p
            className={`rounded-xl border p-2.5 text-[0.64rem] leading-5 ${
              feedback.includes("فعال شد") || feedback.includes("قبلاً")
                ? "border-mint/25 bg-mint/[0.07] text-mint"
                : "border-pomegr/25 bg-pomegr/[0.07] text-pomegr"
            }`}
            role="status"
          >
            {feedback}
          </p>
        )}
      </form>
    </section>
  );
}

function CandidateCard({ candidate }: { candidate: OsmReviewCandidate }) {
  return (
    <article
      className={`${GLASS} flex min-w-0 flex-col overflow-hidden border-white/[0.08] bg-[linear-gradient(160deg,rgba(18,33,30,0.8),rgba(7,10,18,0.92))] p-3.5 has-[details[open]]:col-span-2 sm:p-5 lg:has-[details[open]]:col-span-2`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full border border-mint/25 bg-mint/[0.08] px-2.5 py-1 text-[0.65rem] font-black text-mint">
          {CATEGORY_LABELS[candidate.category]}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-bold text-[#f4c66b]">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#f4c66b]" />
          خصوصی · قرنطینه
        </span>
      </div>

      <h2 className="mt-3 line-clamp-2 min-h-12 text-[0.92rem] font-black leading-6 text-strong sm:text-base">
        {candidate.name}
      </h2>
      <p className="mt-1 truncate text-[0.62rem] text-white/35" dir="ltr">
        {candidate.slug}
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span
          className={`rounded-full border px-2 py-1 text-[0.58rem] font-black ${PRESCREEN_TONES[candidate.prescreen.recommendation]}`}
        >
          {PRESCREEN_LABELS[candidate.prescreen.recommendation]}
        </span>
        <span className="text-[0.62rem] font-black tabular-nums text-strong">
          امتیاز {faNum(candidate.prescreen.score)} از ۱۰۰
        </span>
      </div>

      <div className="my-4 border-t border-dashed border-white/[0.09]" />
      <CompletenessMeter candidate={candidate} />

      {candidate.missingFields.length > 0 ? (
        <p className="mt-3 line-clamp-2 text-[0.66rem] leading-5 text-[#d7a753]">
          ناقص: {candidate.missingFields.join("، ")}
        </p>
      ) : (
        <p className="mt-3 text-[0.66rem] font-bold text-mint">چهار فیلد اصلی موجود است</p>
      )}

      <details className="group mt-4 border-t border-white/[0.08] pt-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-[0.72rem] font-bold text-muted outline-none transition-colors hover:text-strong focus-visible:text-mint [&::-webkit-details-marker]:hidden">
          <span>جزئیات و شناسنامه</span>
          <span aria-hidden className="text-base transition-transform group-open:rotate-45">+</span>
        </summary>
        <div className="space-y-3 pb-1 pt-2 text-[0.68rem] leading-5 text-muted">
          <dl className="space-y-2">
            {candidate.contact.phone && (
              <div>
                <dt className="text-white/35">تلفن</dt>
                <dd className="break-all text-strong" dir="ltr">
                  {candidate.contact.phone}
                </dd>
              </div>
            )}
            {candidate.contact.address && (
              <div>
                <dt className="text-white/35">نشانی منبع</dt>
                <dd className="text-strong">{candidate.contact.address}</dd>
              </div>
            )}
            {candidate.contact.instagram && (
              <div>
                <dt className="text-white/35">اینستاگرام</dt>
                <dd className="break-all text-strong" dir="ltr">
                  @{candidate.contact.instagram.replace(/^@/, "")}
                </dd>
              </div>
            )}
            {candidate.contact.website && (
              <div>
                <dt className="text-white/35">وب‌سایت ثبت‌شده</dt>
                <dd className="break-all text-strong" dir="ltr">
                  {candidate.contact.website}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-white/35">مختصات</dt>
              <dd className="text-strong" dir="ltr">
                {candidate.latitude ?? "—"}, {candidate.longitude ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-white/35">تاریخ برداشت</dt>
              <dd className="text-strong">{formatCapturedAt(candidate.capturedAt)}</dd>
            </div>
          </dl>

          {candidate.sourceWarning ? (
            <p className="rounded-xl border border-pomegr/25 bg-pomegr/[0.08] p-2.5 text-pomegr">
              {candidate.sourceWarning}؛ هیچ لینکی نمایش داده نشد.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <a
                href={candidate.sourceUrl ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-full border border-mint/30 px-3 font-bold text-mint transition-colors hover:bg-mint/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
              >
                مشاهده در OSM
              </a>
              <a
                href={candidate.licenseUrl ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-full border border-lapis/30 px-3 font-bold text-[#aeb7ff] transition-colors hover:bg-lapis/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis"
              >
                مجوز {candidate.licenseName}
              </a>
            </div>
          )}
          <CompletionProposalPanel candidate={candidate} />
          <ReviewDecisionPanel candidate={candidate} />
          {candidate.reviewState === "ready_for_approval" && (
            <>
              <PublicationPayloadPreview candidate={candidate} />
              <PublicationApprovalPanel candidate={candidate} />
            </>
          )}
        </div>
      </details>
    </article>
  );
}

export function OsmReviewQueue({
  initialCandidates,
  publishedCount,
}: {
  initialCandidates: OsmReviewCandidate[];
  publishedCount: number;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | OsmReviewCategory>("all");
  const [completeness, setCompleteness] =
    useState<OsmReviewCompleteness>("all");
  const [reviewState, setReviewState] = useState<"all" | OsmSourceReviewDecision>(
    "all",
  );
  const [prescreen, setPrescreen] = useState<"all" | OsmPrescreenRecommendation>(
    "all",
  );
  const summary = useMemo(
    () => summarizeOsmReviewCandidates(initialCandidates),
    [initialCandidates],
  );
  const visibleCandidates = useMemo(
    () =>
      sortOsmReviewCandidatesForReview(
        filterOsmReviewCandidates(initialCandidates, {
          query,
          category,
          completeness,
          prescreen,
          reviewState,
        }),
      ),
    [category, completeness, initialCandidates, prescreen, query, reviewState],
  );

  return (
    <>
      <Header />
      <Container>
        <main className="min-h-[70vh] space-y-6 py-8">
          <header className="relative overflow-hidden rounded-[1.75rem] border border-mint/20 bg-[linear-gradient(125deg,rgba(19,53,44,0.88),rgba(8,12,20,0.94)_60%)] p-5 sm:p-7">
            <div aria-hidden className="absolute -left-10 -top-16 h-48 w-48 rounded-full bg-mint/10 blur-3xl" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <Link
                  href="/admin/businesses"
                  className="text-[0.7rem] font-bold text-mint underline-offset-4 hover:underline"
                >
                  مدیریت کسب‌وکارها / صف داده
                </Link>
                <p className="mt-4 text-[0.68rem] font-black tracking-[0.12em] text-[#f4c66b]">
                  اتاق کنترل داده رشت
                </p>
                <h1 className="mt-1 text-2xl font-black leading-10 text-strong sm:text-3xl">
                  صف بررسی ورودی‌های OSM
                </h1>
                <p className="mt-2 text-[0.82rem] leading-7 text-muted">
                  موتور قطعی، نسخه‌دار و قابل‌توضیح، موارد ناقص و استثناها را
                  جلو می‌آورد؛ تصمیم انسانی و انتشار همچنان کاملاً جداست.
                </p>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-[#f4c66b]/25 bg-[#f4c66b]/[0.07] px-4 py-3 text-xs font-bold text-[#f4c66b]">
                <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                انتشار عمومی: {faNum(publishedCount)}
              </div>
            </div>
          </header>

          <section aria-label="خلاصه پیش‌غربالگری" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "کل رکوردها", value: summary.total, accent: "text-strong" },
              { label: "کم‌ریسک برای بررسی", value: summary.lowRiskReview, accent: "text-mint" },
              { label: "نیازمند تکمیل", value: summary.needsCompletion, accent: "text-[#f4c66b]" },
              { label: "استثنای پرریسک", value: summary.highRiskException, accent: "text-pomegr" },
            ].map((metric) => (
              <div key={metric.label} className={`${GLASS} p-4 sm:p-5`}>
                <p className="text-[0.68rem] font-bold text-muted">{metric.label}</p>
                <p className={`mt-2 text-2xl font-black tabular-nums ${metric.accent}`}>
                  {faNum(metric.value)}
                </p>
              </div>
            ))}
          </section>

          <section aria-label="فیلتر صف" className={`${GLASS} p-4 sm:p-5`}>
            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_175px_170px_170px_180px]">
              <label className="block">
                <span className="mb-1.5 block text-[0.7rem] font-bold text-muted">
                  جست‌وجوی نام، نشانی یا تماس
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="مثلاً گلسار یا کافه…"
                  className="min-h-11 w-full rounded-xl border border-glass-border bg-black/20 px-4 text-sm text-strong outline-none placeholder:text-white/25 focus:border-mint focus-visible:ring-2 focus-visible:ring-mint/20"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[0.7rem] font-bold text-muted">
                  پیشنهاد ماشین
                </span>
                <select
                  value={prescreen}
                  onChange={(event) =>
                    setPrescreen(
                      event.target.value as "all" | OsmPrescreenRecommendation,
                    )
                  }
                  className="min-h-11 w-full rounded-xl border border-glass-border bg-[#0a0e18] px-3 text-sm font-bold text-strong outline-none focus:border-mint"
                >
                  <option value="all">همه پیشنهادها</option>
                  <option value="high_risk_exception">استثنای پرریسک</option>
                  <option value="needs_completion">نیازمند تکمیل</option>
                  <option value="low_risk_review">کم‌ریسک برای بررسی</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[0.7rem] font-bold text-muted">
                  وضعیت بررسی
                </span>
                <select
                  value={reviewState}
                  onChange={(event) =>
                    setReviewState(
                      event.target.value as "all" | OsmSourceReviewDecision,
                    )
                  }
                  className="min-h-11 w-full rounded-xl border border-glass-border bg-[#0a0e18] px-3 text-sm font-bold text-strong outline-none focus:border-mint"
                >
                  <option value="all">همه تصمیم‌ها</option>
                  <option value="unreviewed">بررسی‌نشده</option>
                  <option value="needs_correction">نیازمند اصلاح</option>
                  <option value="ready_for_approval">آماده بررسی انتشار</option>
                  <option value="rejected">ردشده</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[0.7rem] font-bold text-muted">دسته‌بندی</span>
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as "all" | OsmReviewCategory)
                  }
                  className="min-h-11 w-full rounded-xl border border-glass-border bg-[#0a0e18] px-3 text-sm font-bold text-strong outline-none focus:border-mint"
                >
                  <option value="all">همه</option>
                  <option value="cafe">کافه‌ها</option>
                  <option value="restaurant">رستوران‌ها</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[0.7rem] font-bold text-muted">کیفیت اطلاعات</span>
                <select
                  value={completeness}
                  onChange={(event) =>
                    setCompleteness(event.target.value as OsmReviewCompleteness)
                  }
                  className="min-h-11 w-full rounded-xl border border-glass-border bg-[#0a0e18] px-3 text-sm font-bold text-strong outline-none focus:border-mint"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="complete">کامل</option>
                  <option value="incomplete">نیازمند تکمیل</option>
                </select>
              </label>
            </div>
          </section>

          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-black text-strong">رکوردهای قابل بررسی</h2>
            <span className="text-xs text-muted" aria-live="polite">
              نمایش {faNum(visibleCandidates.length)} از {faNum(summary.total)}
            </span>
          </div>

          {visibleCandidates.length > 0 ? (
            <section
              aria-label="رکوردهای OSM"
              className="grid grid-cols-2 items-start gap-3 lg:grid-cols-3 lg:gap-4"
            >
              {visibleCandidates.map((candidate) => (
                <CandidateCard key={candidate.sourceId} candidate={candidate} />
              ))}
            </section>
          ) : (
            <section className={`${GLASS} p-8 text-center sm:p-12`}>
              <h2 className="text-lg font-black text-strong">رکوردی با این فیلتر پیدا نشد</h2>
              <p className="mt-2 text-sm text-muted">عبارت جست‌وجو یا فیلترها را تغییر بده.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                  setCompleteness("all");
                  setPrescreen("all");
                  setReviewState("all");
                }}
                className="mt-5 min-h-11 rounded-full border border-mint/35 bg-mint/10 px-5 text-sm font-bold text-mint transition-colors hover:bg-mint/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
              >
                پاک‌کردن فیلترها
              </button>
            </section>
          )}

          <aside className="rounded-2xl border border-lapis/20 bg-lapis/[0.06] p-4 text-[0.72rem] leading-6 text-muted">
            <strong className="text-[#aeb7ff]">مرز تصمیم:</strong> پیشنهاد ماشین فقط
            صف را مرتب می‌کند و هیچ تصمیم انسانی، تأیید منبع یا انتشار ایجاد
            نمی‌کند. اطلاعات پایه
            از OpenStreetMap تحت ODbL آمده است. امتیاز، نظر، تصویر، منو یا توضیح
            تجاری از منبع دیگری وارد نشده است. انتشار فقط داخل دروازه سبز، برای
            یک رکورد آماده و پس از تأییدهای صریح انجام می‌شود.
          </aside>
        </main>
      </Container>
      <Footer />
    </>
  );
}
