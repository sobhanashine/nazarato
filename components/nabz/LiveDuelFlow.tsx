"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadLiveNabzDuel,
  submitLiveNabzVote,
  type LiveNabzBusiness,
  type LiveNabzDuel,
} from "@/lib/nabz/live-duel-client";
import type { NabzScenario } from "./nabz-demo-data";

type LivePhase = "loading" | "ready" | "submitting" | "load-error" | "complete";

const formatFaNumber = (value: number) => value.toLocaleString("fa-IR");

function displayNeighborhood(value: string | null): string {
  return value ? value.replaceAll("-", " ") : "محله ثبت نشده";
}

function displayPriceBand(value: LiveNabzBusiness["priceBand"]): string {
  return value
    ? `بازه قیمت ${formatFaNumber(value)} از ۴`
    : "بازه قیمت ثبت نشده";
}

function LivePlaceOption({
  place,
  disabled,
  onChoose,
}: {
  place: LiveNabzBusiness;
  disabled: boolean;
  onChoose: () => void;
}) {
  return (
    <button
      type="button"
      data-testid="duel-option"
      disabled={disabled}
      aria-busy={disabled}
      onClick={onChoose}
      className="group relative flex min-h-[210px] flex-col overflow-hidden rounded-[24px] border border-mint/25 bg-[linear-gradient(145deg,rgba(13,28,30,.96),rgba(10,18,28,.94))] p-5 text-right shadow-[0_18px_45px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)] transition-[transform,border-color,box-shadow,opacity] duration-200 hover:-translate-y-1 hover:border-mint/55 hover:shadow-[0_24px_60px_rgba(0,0,0,0.38),0_0_35px_rgba(91,230,178,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b14] disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
    >
      <span
        aria-hidden
        className="absolute -left-12 -top-14 h-36 w-36 rounded-full bg-mint/10 blur-3xl transition-transform duration-500 group-hover:scale-125"
      />
      <span className="relative mb-7 flex items-center justify-between gap-3 text-xs">
        <span className="rounded-full border border-mint/25 bg-mint/[0.08] px-3 py-1.5 font-bold text-mint">
          {place.kind}
        </span>
        <span className="text-muted">{displayNeighborhood(place.neighborhoodSlug)}</span>
      </span>
      <strong className="relative text-xl font-black leading-8 text-strong">
        {place.name}
      </strong>
      <span className="relative mt-3 text-xs leading-6 text-muted">
        اطلاعات نمایشی این کارت فقط از فیلدهای تأییدشده ساخته شده است.
      </span>
      <span className="relative mt-auto flex items-center justify-between border-t border-white/[0.07] pt-5 text-xs">
        <span className="text-muted">{displayPriceBand(place.priceBand)}</span>
        <span className="font-extrabold text-mint transition-transform group-hover:-translate-x-1">
          انتخاب می‌کنم ←
        </span>
      </span>
    </button>
  );
}

function LoadingStage() {
  return (
    <div
      data-testid="live-duel-loading"
      className="animate-[nabz-rise_300ms_ease-out_both] motion-reduce:animate-none"
      aria-live="polite"
    >
      <p className="mb-2 text-xs font-bold tracking-[0.12em] text-mint">
        بررسی supply واقعی
      </p>
      <h2 className="text-xl font-black leading-8 text-strong sm:text-2xl">
        داریم پنج انتخاب واقعی و بدون تکرار را آماده می‌کنیم…
      </h2>
      <p className="mt-2 text-sm leading-7 text-muted">
        اگر داده تأییدشده کافی نباشد، نسخه نمایشی با برچسب روشن باز می‌شود.
      </p>
      <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
        <div
          className="min-h-[210px] animate-pulse rounded-[24px] border border-glass-border bg-white/[0.035] p-5 motion-reduce:animate-none"
          aria-hidden
        >
          <div className="h-7 w-20 rounded-full bg-white/[0.08]" />
          <div className="mt-8 h-7 w-3/5 rounded-lg bg-white/[0.08]" />
          <div className="mt-4 h-4 w-full rounded bg-white/[0.05]" />
        </div>
        <span className="z-10 mx-auto -my-5 hidden h-11 w-11 place-items-center self-center rounded-full border border-mint/20 bg-[#141522] text-xs font-black text-mint sm:order-none sm:mx-[-9px] sm:my-0 sm:grid">
          یا
        </span>
        <div
          className="min-h-[210px] animate-pulse rounded-[24px] border border-glass-border bg-white/[0.035] p-5 motion-reduce:animate-none"
          aria-hidden
        >
          <div className="h-7 w-20 rounded-full bg-white/[0.08]" />
          <div className="mt-8 h-7 w-3/5 rounded-lg bg-white/[0.08]" />
          <div className="mt-4 h-4 w-full rounded bg-white/[0.05]" />
        </div>
      </div>
    </div>
  );
}

export function LiveDuelFlow({
  scenario,
  onBack,
  onUseDemo,
}: {
  scenario: NabzScenario;
  onBack: () => void;
  onUseDemo: (message: string) => void;
}) {
  const [round, setRound] = useState(0);
  const [duel, setDuel] = useState<LiveNabzDuel | null>(null);
  const [phase, setPhase] = useState<LivePhase>("loading");
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storedVotes, setStoredVotes] = useState(0);
  const operationRef = useRef(0);

  const loadRound = useCallback(
    async (nextRound: number, initial: boolean) => {
      const operation = ++operationRef.current;
      setPhase("loading");
      setError(null);
      const result = await loadLiveNabzDuel(scenario.id, nextRound);
      if (operation !== operationRef.current) return;

      if (!result.ok) {
        if (initial) {
          onUseDemo(
            result.reason === "insufficient_supply"
              ? "هنوز پنج زوج واقعیِ تأییدشده نداریم؛ نسخه نمایشی باز شد."
              : "ارتباط با داده واقعی برقرار نشد؛ نسخه نمایشی باز شد.",
          );
          return;
        }
        setPhase("load-error");
        setError(
          result.reason === "insufficient_supply"
            ? "داده واقعی در میانه جلسه تغییر کرد و زوج بعدی آماده نیست."
            : "زوج بعدی بارگذاری نشد؛ رأی قبلی از بین نرفته است.",
        );
        return;
      }

      setRound(nextRound);
      setDuel(result.duel);
      setPhase("ready");
    },
    [onUseDemo, scenario.id],
  );

  useEffect(() => {
    void loadRound(0, true);
    return () => {
      operationRef.current += 1;
    };
  }, [loadRound]);

  const choose = async (winner: LiveNabzBusiness) => {
    if (!duel || phase !== "ready") return;
    const loser = duel.options.find((option) => option.id !== winner.id);
    if (!loser) return;

    const operation = ++operationRef.current;
    setPhase("submitting");
    setError(null);
    const result = await submitLiveNabzVote({
      scenario: scenario.id,
      winnerBusinessId: winner.id,
      loserBusinessId: loser.id,
      ...(reason.trim() ? { reasonText: reason.trim() } : {}),
    });
    if (operation !== operationRef.current) return;

    if (!result.ok) {
      setPhase("ready");
      setError("رأی ثبت نشد؛ دوباره تلاش کن. تا ثبت موفق، مرحله عوض نمی‌شود.");
      return;
    }

    if (result.stored) setStoredVotes((value) => value + 1);
    setReason("");
    setFeedback(
      result.duplicate
        ? "این مقایسه قبلاً ثبت شده بود؛ رفتیم سراغ انتخاب بعدی."
        : `رأی «${winner.name}» ثبت شد؛ انتخاب بعدی آماده می‌شود.`,
    );

    const nextRound = round + 1;
    if (nextRound >= 5) {
      setDuel(null);
      setPhase("complete");
      return;
    }
    setRound(nextRound);
    await loadRound(nextRound, false);
  };

  if (phase === "loading") return <LoadingStage />;

  if (phase === "load-error") {
    return (
      <div className="animate-[nabz-rise_300ms_ease-out_both] motion-reduce:animate-none">
        <p className="mb-2 text-xs font-bold tracking-[0.12em] text-pomegr">
          جلسه واقعی متوقف شد
        </p>
        <h2 className="text-2xl font-black leading-9 text-strong">
          رأی قبلی محفوظ است؛ این مرحله دوباره بارگذاری می‌شود.
        </h2>
        <p className="mt-3 rounded-2xl border border-pomegr/25 bg-pomegr/[0.08] px-4 py-3 text-sm leading-7 text-[#ffb4c8]" role="alert">
          {error}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void loadRound(round, false)}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-mint px-5 text-sm font-extrabold text-[#07130f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b14]"
          >
            تلاش دوباره
          </button>
          <button
            type="button"
            onClick={() => onUseDemo("جلسه واقعی متوقف شد؛ نسخه نمایشی جداگانه باز شد.")}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-glass-border px-5 text-sm font-bold text-muted hover:text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
          >
            رفتن به نسخه نمایشی
          </button>
        </div>
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div className="animate-[nabz-rise_420ms_ease-out_both] motion-reduce:animate-none">
        <p className="mb-2 text-xs font-bold tracking-[0.12em] text-mint">
          کالیبراسیون واقعی کامل شد
        </p>
        <h2 className="text-2xl font-black leading-9 text-strong sm:text-3xl">
          {storedVotes === 5
            ? "پنج انتخاب واقعی ثبت شد"
            : "پنج انتخاب واقعی تکمیل شد"}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-8 text-muted">
          از این جلسه {formatFaNumber(storedVotes)} رأی تازه وارد مجموعه شواهد شد.
          برای ساخت Taste Graph و توصیه شخصی واقعی هنوز به شواهد بیشتری نیاز داریم؛
          بنابراین اینجا هیچ نتیجه یا رتبه‌بندی ساختگی نمایش داده نمی‌شود.
        </p>
        <div className="mt-7 rounded-[22px] border border-mint/20 bg-mint/[0.07] p-5">
          <p className="text-sm font-extrabold text-[#c8f9e6]">بعدش چه می‌شود؟</p>
          <p className="mt-2 text-xs leading-7 text-[#9bc8ba]">
            رأی‌های پذیرفته‌شده پس از کنترل کیفیت، به مدل سلیقه و مقایسه محلی کمک
            می‌کنند. توصیه فقط وقتی باز می‌شود که حداقل شواهد لازم واقعاً جمع شده باشد.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-mint/30 bg-mint/[0.08] px-5 text-xs font-extrabold text-mint transition-colors hover:bg-mint/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
        >
          انتخاب یک موقعیت دیگر
        </button>
      </div>
    );
  }

  if (!duel) return <LoadingStage />;
  const progress = (round / 5) * 100;

  return (
    <div
      data-testid="live-duel"
      className="animate-[nabz-rise_360ms_ease-out_both] motion-reduce:animate-none"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={phase === "submitting"}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-glass-border px-3.5 text-xs font-bold text-muted transition-colors hover:border-glass-border-hi hover:text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint disabled:opacity-50"
        >
          <span aria-hidden>→</span>
          تغییر موقعیت
        </button>
        <span className="text-xs font-bold text-strong">
          انتخاب {formatFaNumber(round + 1)} از ۵
        </span>
      </div>

      <div
        className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"
        role="progressbar"
        aria-label="پیشرفت انتخاب‌های واقعی"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={round}
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#5BE6B2,#F5B544)] transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-mint/30 bg-mint/[0.09] px-3 py-1.5 text-[11px] font-extrabold text-mint">
          پایلوت واقعی
        </span>
        <span className="text-xs text-muted">فقط فیلدهای factual تأییدشده</span>
      </div>

      {feedback ? (
        <p className="mb-5 rounded-2xl border border-mint/20 bg-mint/[0.07] px-4 py-3 text-sm leading-6 text-[#b8f7df]" aria-live="polite">
          {feedback}
        </p>
      ) : null}
      {error ? (
        <p className="mb-5 rounded-2xl border border-pomegr/25 bg-pomegr/[0.08] px-4 py-3 text-sm leading-7 text-[#ffb4c8]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mb-5">
        <p className="mb-1 text-xs font-bold tracking-[0.12em] text-saffron">
          دوئل واقعی · {scenario.title}
        </p>
        <h2 className="text-xl font-black leading-8 text-strong sm:text-2xl">
          {duel.prompt}
        </h2>
      </div>

      <div className="relative grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
        <LivePlaceOption
          place={duel.options[0]}
          disabled={phase === "submitting"}
          onChoose={() => void choose(duel.options[0])}
        />
        <span className="z-10 mx-auto -my-5 grid h-11 w-11 place-items-center self-center rounded-full border border-saffron/35 bg-[#141522] text-xs font-black text-saffron shadow-[0_8px_24px_rgba(0,0,0,0.45)] sm:mx-[-9px] sm:my-0">
          یا
        </span>
        <LivePlaceOption
          place={duel.options[1]}
          disabled={phase === "submitting"}
          onChoose={() => void choose(duel.options[1])}
        />
      </div>

      <div className="mt-5">
        <label htmlFor="nabz-live-reason" className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-[#cbd2dc]">
          <span>
            اگر دلیل کوتاهی داری بنویس <span className="font-normal text-muted">(اختیاری)</span>
          </span>
          <span className="font-normal text-muted">{formatFaNumber(reason.length)}/۱۲۰</span>
        </label>
        <textarea
          id="nabz-live-reason"
          value={reason}
          maxLength={120}
          rows={2}
          disabled={phase === "submitting"}
          onChange={(event) => setReason(event.target.value)}
          placeholder="مثلاً: برای حرف‌زدن آرام‌تره…"
          className="w-full resize-none rounded-2xl border border-glass-border bg-black/20 px-4 py-3 text-sm leading-6 text-strong outline-none transition-colors placeholder:text-muted/60 focus:border-mint/55 focus:ring-2 focus:ring-mint/15 disabled:opacity-60"
        />
      </div>
    </div>
  );
}
