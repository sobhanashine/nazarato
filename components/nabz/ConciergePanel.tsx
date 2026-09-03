"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useSessionStatus } from "@/components/layout/useSessionStatus";
import {
  parseConciergeInput,
  rankConciergePlaces,
  type ConciergeBudget,
  type ConciergeGroup,
  type ConciergeInput,
} from "./concierge-engine";
import {
  NABZ_SCENARIOS,
  TASTE_DIMENSION_LABELS,
  TASTE_DIMENSIONS,
  type NabzPlace,
  type TasteDimension,
} from "./nabz-demo-data";
import type { NabzSession } from "./nabz-engine";

const budgetOptions: readonly { value: ConciergeBudget; label: string }[] = [
  { value: "any", label: "هر بودجه‌ای" },
  { value: "اقتصادی", label: "اقتصادی" },
  { value: "متوسط", label: "متوسط" },
  { value: "ویژه", label: "ویژه" },
];

const groupOptions: readonly { value: ConciergeGroup; label: string }[] = [
  { value: "solo", label: "تنهایی" },
  { value: "pair", label: "دو نفر" },
  { value: "small", label: "۳ تا ۵ نفر" },
  { value: "large", label: "بیشتر از ۵ نفر" },
];

const selectClassName =
  "min-h-11 w-full rounded-xl border border-glass-border bg-[#0a101b] px-3 text-sm text-strong outline-none transition-colors focus:border-mint/55 focus:ring-2 focus:ring-mint/15";

function defaultConciergeInput(session: NabzSession): ConciergeInput {
  return {
    occasion: session.scenarioId,
    budget: "any",
    group: session.scenarioId === "date" ? "pair" : "small",
    neighborhood: "any",
    priorities: [],
  };
}

export function ConciergePanel({
  session,
  places,
}: {
  session: NabzSession;
  places: readonly NabzPlace[];
}) {
  const initialInput = useMemo(() => defaultConciergeInput(session), [session]);
  const [draft, setDraft] = useState<ConciergeInput>(initialInput);
  const [submitted, setSubmitted] = useState<ConciergeInput>(initialInput);
  const [error, setError] = useState<string | null>(null);
  const sessionStatus = useSessionStatus();
  const neighborhoods = useMemo(
    () => [...new Set(places.map((place) => place.neighborhood))].sort((a, b) => a.localeCompare(b, "fa")),
    [places],
  );
  const ranking = useMemo(
    () => rankConciergePlaces(session, submitted, places, 3),
    [places, session, submitted],
  );

  const togglePriority = (dimension: TasteDimension) => {
    setDraft((current) => {
      const isSelected = current.priorities.includes(dimension);
      if (isSelected) {
        return {
          ...current,
          priorities: current.priorities.filter((item) => item !== dimension),
        };
      }
      if (current.priorities.length >= 3) {
        return current;
      }
      return { ...current, priorities: [...current.priorities, dimension] };
    });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = parseConciergeInput(draft);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setSubmitted(parsed.value);
    setError(null);
  };

  return (
    <div className="rounded-[24px] border border-saffron/20 bg-saffron/[0.035] p-4 sm:p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] text-saffron">کجابریم؟</p>
          <h3 className="mt-1 text-lg font-black text-strong">
            پیشنهاد را برای همین برنامه تنظیم کن
          </h3>
        </div>
        <span className="rounded-full border border-saffron/20 bg-saffron/[0.07] px-2.5 py-1 text-[10px] font-bold text-saffron">
          الگوریتم توضیح‌پذیر · دمو
        </span>
      </div>

      <form onSubmit={submit} className="space-y-4" data-testid="concierge-form">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-xs font-bold text-[#cbd2dc]">
            <span>موقعیت</span>
            <select
              aria-label="موقعیت کجابریم"
              value={draft.occasion}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  occasion: event.target.value as ConciergeInput["occasion"],
                }))
              }
              className={selectClassName}
            >
              {NABZ_SCENARIOS.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.title}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-xs font-bold text-[#cbd2dc]">
            <span>بودجه</span>
            <select
              aria-label="بودجه کجابریم"
              value={draft.budget}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  budget: event.target.value as ConciergeBudget,
                }))
              }
              className={selectClassName}
            >
              {budgetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-xs font-bold text-[#cbd2dc]">
            <span>تعداد نفرات</span>
            <select
              aria-label="تعداد نفرات کجابریم"
              value={draft.group}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  group: event.target.value as ConciergeGroup,
                }))
              }
              className={selectClassName}
            >
              {groupOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-xs font-bold text-[#cbd2dc]">
            <span>محله ترجیحی</span>
            <select
              aria-label="محله کجابریم"
              value={draft.neighborhood}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  neighborhood: event.target.value,
                }))
              }
              className={selectClassName}
            >
              <option value="any">همه محله‌ها</option>
              {neighborhoods.map((neighborhood) => (
                <option key={neighborhood} value={neighborhood}>
                  {neighborhood}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset>
          <legend className="mb-2 text-xs font-bold text-[#cbd2dc]">
            سه اولویت مهم‌تر <span className="font-normal text-muted">(اختیاری)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {TASTE_DIMENSIONS.map((dimension) => {
              const selected = draft.priorities.includes(dimension);
              const disabled = !selected && draft.priorities.length >= 3;
              return (
                <label
                  key={dimension}
                  className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-3.5 text-xs font-bold transition-colors focus-within:ring-2 focus-within:ring-mint ${
                    selected
                      ? "border-mint/45 bg-mint/10 text-mint"
                      : "border-glass-border bg-black/15 text-muted"
                  } ${disabled ? "cursor-not-allowed opacity-45" : "hover:border-glass-border-hi hover:text-strong"}`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={disabled}
                    onChange={() => togglePriority(dimension)}
                    className="sr-only"
                  />
                  {TASTE_DIMENSION_LABELS[dimension]}
                </label>
              );
            })}
          </div>
        </fieldset>

        {error ? (
          <p role="alert" className="text-xs font-bold text-[#ffb4c8]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-saffron px-5 text-sm font-black text-[#191307] transition-[transform,filter] hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a101b] sm:w-auto"
        >
          پیشنهادها را دوباره بچین
        </button>
      </form>

      <div className="my-5 h-px bg-white/[0.07]" />

      {ranking.status === "insufficient_evidence" ? (
        <div className="rounded-2xl border border-white/[0.09] bg-black/15 p-4 text-sm leading-7 text-muted" role="status">
          <strong className="block text-strong">داده کافی نداریم</strong>
          {ranking.message}
        </div>
      ) : (
        <ol className="space-y-2.5" data-testid="nabz-recommendations">
          {ranking.recommendations.map((recommendation, index) => (
            <li
              key={recommendation.place.id}
              className="grid grid-cols-[42px_minmax(0,1fr)] gap-3 rounded-2xl border border-glass-border bg-white/[0.035] p-3.5 sm:grid-cols-[42px_minmax(0,1fr)_auto] sm:items-center"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.06] text-sm font-black text-mint">
                {(index + 1).toLocaleString("fa-IR")}
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-sm font-extrabold text-strong">
                  {recommendation.place.name}
                </strong>
                <span className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-[11px] leading-5 text-muted">
                  {recommendation.reasons.map((reason) =>
                    reason.evidenceHref ? (
                      <a
                        key={`${recommendation.place.id}-${reason.kind}`}
                        href={reason.evidenceHref}
                        className="text-[#b8f7df] underline decoration-mint/35 underline-offset-4 hover:text-mint"
                      >
                        {reason.label}
                      </a>
                    ) : (
                      <span key={`${recommendation.place.id}-${reason.kind}`}>
                        {reason.label}
                      </span>
                    ),
                  )}
                </span>
              </span>
              <span className="col-start-2 text-[11px] font-medium text-muted sm:col-auto">
                {recommendation.place.neighborhood} · {recommendation.place.price}
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-5 rounded-xl border border-white/[0.07] bg-black/15 px-3.5 py-3 text-[11px] leading-6 text-muted">
        جلسه ناشناس حداکثر هفت روز روی همین دستگاه می‌ماند و دلیل‌های متنی در آن ذخیره نمی‌شوند. {" "}
        {sessionStatus?.loggedIn ? (
          <span className="text-[#cbd2dc]">اتصال ذخیره چنددستگاهی پس از راه‌اندازی دیتابیس فعال می‌شود.</span>
        ) : (
          <Link href="/login?next=/" className="font-bold text-mint hover:underline">
            برای ذخیره بین چند دستگاه وارد شو
          </Link>
        )}
      </div>
    </div>
  );
}
