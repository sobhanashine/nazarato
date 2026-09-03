"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/ui/Container";
import {
  createEmptyNabzSession,
  findDemoPlace,
  getNabzRecommendations,
  recordDuelChoice,
  summarizeTaste,
  type NabzSession,
} from "./nabz-engine";
import {
  NABZ_DEMO_PLACES,
  NABZ_SCENARIOS,
  TASTE_DIMENSION_LABELS,
  type NabzPlace,
  type NabzScenario,
  type NabzScenarioId,
  type TasteDimension,
} from "./nabz-demo-data";

const scenarioStyles: Record<
  NabzScenarioId,
  { border: string; glow: string; icon: string }
> = {
  date: {
    border: "hover:border-pomegr/55 focus-visible:ring-pomegr",
    glow: "from-pomegr/20 via-pomegr/[0.04] to-transparent",
    icon: "bg-pomegr/15 text-pomegr border-pomegr/25",
  },
  laptop: {
    border: "hover:border-lapis/55 focus-visible:ring-lapis",
    glow: "from-lapis/20 via-lapis/[0.04] to-transparent",
    icon: "bg-lapis/15 text-[#aeb7ff] border-lapis/25",
  },
  budget: {
    border: "hover:border-saffron/55 focus-visible:ring-saffron",
    glow: "from-saffron/20 via-saffron/[0.04] to-transparent",
    icon: "bg-saffron/15 text-saffron border-saffron/25",
  },
  "local-food": {
    border: "hover:border-mint/55 focus-visible:ring-mint",
    glow: "from-mint/20 via-mint/[0.04] to-transparent",
    icon: "bg-mint/15 text-mint border-mint/25",
  },
};

const dimensionColors: Record<TasteDimension, string> = {
  cozy: "bg-pomegr",
  quiet: "bg-lapis",
  value: "bg-saffron",
  local: "bg-mint",
  social: "bg-[#ff8a5b]",
  service: "bg-[#75d7ff]",
};

const formatFaNumber = (value: number) => value.toLocaleString("fa-IR");

function ScenarioPicker({ onSelect }: { onSelect: (id: NabzScenarioId) => void }) {
  return (
    <div className="animate-[nabz-rise_420ms_ease-out_both] motion-reduce:animate-none">
      <div className="mb-6">
        <p className="mb-2 text-xs font-bold tracking-[0.12em] text-mint">اول حال‌وهواتو بگو</p>
        <h2 className="text-2xl font-black leading-[1.45] text-strong sm:text-[1.7rem]">
          الان برای چه موقعیتی می‌گردی؟
        </h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          فقط پنج انتخاب؛ بدون ثبت‌نام و بدون فرم طولانی.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2" aria-label="موقعیت‌های پیشنهادی">
        {NABZ_SCENARIOS.map((scenario) => {
          const styles = scenarioStyles[scenario.id];
          return (
            <li key={scenario.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onSelect(scenario.id)}
                className={`group relative h-full min-h-[136px] w-full overflow-hidden rounded-[22px] border border-glass-border bg-[#0c111d]/80 p-4 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#101725] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b14] ${styles.border}`}
              >
                <span
                  aria-hidden
                  className={`absolute inset-0 bg-gradient-to-bl opacity-70 transition-opacity group-hover:opacity-100 ${styles.glow}`}
                />
                <span className="relative flex h-full flex-col items-start">
                  <span className={`mb-4 inline-grid h-10 w-10 place-items-center rounded-xl border text-lg font-black ${styles.icon}`}>
                    {scenario.icon}
                  </span>
                  <strong className="text-base font-extrabold text-strong">{scenario.title}</strong>
                  <span className="mt-1 text-xs leading-6 text-muted">{scenario.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PlaceOption({ place, onChoose }: { place: NabzPlace; onChoose: () => void }) {
  return (
    <button
      type="button"
      data-testid="duel-option"
      onClick={onChoose}
      className="group relative flex min-h-[220px] flex-col overflow-hidden rounded-[24px] border border-glass-border-hi bg-[#0d1421]/90 p-5 text-right shadow-[0_18px_45px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-mint/50 hover:shadow-[0_24px_60px_rgba(0,0,0,0.38),0_0_35px_rgba(91,230,178,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b14]"
    >
      <span aria-hidden className="absolute -left-12 -top-14 h-36 w-36 rounded-full bg-lapis/15 blur-3xl transition-transform duration-500 group-hover:scale-125" />
      <span className="relative mb-6 flex items-center justify-between gap-3 text-xs">
        <span className="rounded-full border border-mint/20 bg-mint/[0.07] px-3 py-1.5 font-bold text-mint">
          {place.kind}
        </span>
        <span className="text-muted">{place.neighborhood}</span>
      </span>
      <strong className="relative text-xl font-black leading-8 text-strong">{place.name}</strong>
      <span className="relative mt-2 text-sm leading-7 text-muted">{place.vignette}</span>
      <span className="relative mt-auto flex flex-wrap gap-1.5 pt-5">
        {place.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-white/[0.055] px-2.5 py-1 text-[11px] font-medium text-[#cbd2dc]">
            {tag}
          </span>
        ))}
      </span>
      <span className="relative mt-4 flex items-center justify-between border-t border-white/[0.07] pt-4 text-xs">
        <span className="text-muted">{place.price}</span>
        <span className="font-extrabold text-mint transition-transform group-hover:-translate-x-1">
          اینو انتخاب می‌کنم ←
        </span>
      </span>
    </button>
  );
}

function DuelStage({
  scenario,
  session,
  reason,
  feedback,
  error,
  onReasonChange,
  onChoose,
  onBack,
}: {
  scenario: NabzScenario;
  session: NabzSession;
  reason: string;
  feedback: string | null;
  error: string | null;
  onReasonChange: (value: string) => void;
  onChoose: (place: NabzPlace) => void;
  onBack: () => void;
}) {
  const round = session.choices.length;
  const duel = scenario.duels[round];
  const firstPlace = findDemoPlace(duel.options[0]);
  const secondPlace = findDemoPlace(duel.options[1]);
  const progress = (round / scenario.duels.length) * 100;

  return (
    <div className="animate-[nabz-rise_360ms_ease-out_both] motion-reduce:animate-none">
      <div className="mb-5 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-glass-border px-3.5 text-xs font-bold text-muted transition-colors hover:border-glass-border-hi hover:text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
        >
          <span aria-hidden>→</span>
          تغییر موقعیت
        </button>
        <span className="text-xs font-bold text-strong">
          انتخاب {formatFaNumber(round + 1)} از {formatFaNumber(scenario.duels.length)}
        </span>
      </div>

      <div
        className="mb-7 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"
        role="progressbar"
        aria-label="پیشرفت انتخاب‌ها"
        aria-valuemin={0}
        aria-valuemax={scenario.duels.length}
        aria-valuenow={round}
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#5BE6B2,#F5B544,#FF6B95)] transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      {feedback ? (
        <p className="mb-5 rounded-2xl border border-mint/20 bg-mint/[0.07] px-4 py-3 text-sm leading-6 text-[#b8f7df]" aria-live="polite">
          <span aria-hidden className="ml-2">↗</span>
          {feedback}
        </p>
      ) : null}

      {error ? (
        <p className="mb-5 rounded-2xl border border-pomegr/25 bg-pomegr/[0.08] px-4 py-3 text-sm text-[#ffb4c8]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mb-5">
        <p className="mb-1 text-xs font-bold tracking-[0.12em] text-saffron">دوئل محلی · {scenario.title}</p>
        <h2 className="text-xl font-black leading-8 text-strong sm:text-2xl">{duel.prompt}</h2>
      </div>

      <div className="relative grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
        <PlaceOption place={firstPlace} onChoose={() => onChoose(firstPlace)} />
        <span className="z-10 mx-auto -my-5 grid h-11 w-11 place-items-center self-center rounded-full border border-saffron/35 bg-[#141522] text-xs font-black text-saffron shadow-[0_8px_24px_rgba(0,0,0,0.45)] sm:mx-[-9px] sm:my-0">
          یا
        </span>
        <PlaceOption place={secondPlace} onChoose={() => onChoose(secondPlace)} />
      </div>

      <div className="mt-5">
        <label htmlFor="nabz-reason" className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-[#cbd2dc]">
          <span>اگر دلیل کوتاهی داری بنویس <span className="font-normal text-muted">(اختیاری)</span></span>
          <span className="font-normal text-muted">{formatFaNumber(reason.length)}/۱۲۰</span>
        </label>
        <textarea
          id="nabz-reason"
          value={reason}
          maxLength={120}
          rows={2}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder="مثلاً: برای حرف‌زدن آرام‌تره…"
          className="w-full resize-none rounded-2xl border border-glass-border bg-black/20 px-4 py-3 text-sm leading-6 text-strong outline-none transition-colors placeholder:text-muted/60 focus:border-mint/55 focus:ring-2 focus:ring-mint/15"
        />
      </div>
    </div>
  );
}

function ResultStage({ scenario, session, onRestart }: { scenario: NabzScenario; session: NabzSession; onRestart: () => void }) {
  const summary = summarizeTaste(session.scores);
  const eligiblePlaceIds = new Set(
    scenario.duels.flatMap((duel) => duel.options),
  );
  const eligiblePlaces = NABZ_DEMO_PLACES.filter((place) =>
    eligiblePlaceIds.has(place.id),
  );
  const recommendations = getNabzRecommendations(eligiblePlaces, session.scores, 3);
  const maxScore = Math.max(...summary.ordered.map((item) => item.score), 1);

  return (
    <div className="animate-[nabz-rise_420ms_ease-out_both] motion-reduce:animate-none">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold tracking-[0.12em] text-mint">۵ انتخاب ثبت شد</p>
          <h2 className="text-2xl font-black leading-9 text-strong sm:text-3xl">سلیقه‌ات لو رفت!</h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            برای «{scenario.shortTitle}»، بیشتر دنبال {summary.primary.label} و {summary.secondary.label} هستی.
          </p>
        </div>
        <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-mint/25 bg-mint/10 text-2xl text-mint shadow-[0_0_28px_rgba(91,230,178,0.12)]">
          ✓
        </span>
      </div>

      <div className="mb-7 rounded-[22px] border border-glass-border bg-black/15 p-4" aria-label="نمودار سلیقه نمایشی">
        <div className="mb-4 flex items-center justify-between gap-3">
          <strong className="text-sm font-extrabold text-strong">اثر انگشت سلیقه تو</strong>
          <span className="text-[11px] text-muted">بر اساس ۵ انتخاب</span>
        </div>
        <div className="space-y-3">
          {summary.ordered.slice(0, 4).map((item) => (
            <div key={item.dimension} className="grid grid-cols-[92px_1fr_22px] items-center gap-3 text-xs">
              <span className="text-[#cbd2dc]">{item.label}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <span
                  className={`block h-full rounded-full ${dimensionColors[item.dimension]}`}
                  style={{ width: `${Math.round((item.score / maxScore) * 100)}%` }}
                />
              </span>
              <span className="text-left font-bold text-muted">{formatFaNumber(item.score)}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.12em] text-saffron">کجابریم؟</p>
            <h3 className="mt-1 text-lg font-black text-strong">سه انتخاب نزدیک به سلیقه تو</h3>
          </div>
          <span className="rounded-full border border-saffron/20 bg-saffron/[0.07] px-2.5 py-1 text-[10px] font-bold text-saffron">نتیجه دمو</span>
        </div>
        <ol className="space-y-2.5" data-testid="nabz-recommendations">
          {recommendations.map((recommendation, index) => (
            <li key={recommendation.place.id} className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-2xl border border-glass-border bg-white/[0.035] p-3.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.06] text-sm font-black text-mint">
                {formatFaNumber(index + 1)}
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-sm font-extrabold text-strong">{recommendation.place.name}</strong>
                <span className="mt-1 block truncate text-[11px] text-muted">
                  مناسب برای {recommendation.reasons.join(" و ")}
                </span>
              </span>
              <span className="text-[11px] font-medium text-muted">{recommendation.place.neighborhood}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-6 text-muted">
          این نتیجه فقط عملکرد الگوریتم را نشان می‌دهد؛ هیچ کسب‌وکار واقعی رتبه‌بندی نشده است.
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-mint/30 bg-mint/[0.08] px-5 text-xs font-extrabold text-mint transition-colors hover:bg-mint/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
        >
          دوباره بازی کن
        </button>
      </div>
    </div>
  );
}

export function NabzRasht() {
  const [scenarioId, setScenarioId] = useState<NabzScenarioId | null>(null);
  const [session, setSession] = useState<NabzSession | null>(null);
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scenario = useMemo(
    () => NABZ_SCENARIOS.find((candidate) => candidate.id === scenarioId) ?? null,
    [scenarioId],
  );

  const startScenario = (nextScenarioId: NabzScenarioId) => {
    setScenarioId(nextScenarioId);
    setSession(createEmptyNabzSession(nextScenarioId));
    setReason("");
    setFeedback(null);
    setError(null);
  };

  const reset = () => {
    setScenarioId(null);
    setSession(null);
    setReason("");
    setFeedback(null);
    setError(null);
  };

  const choosePlace = (place: NabzPlace) => {
    if (!scenario || !session) {
      return;
    }

    const duel = scenario.duels[session.choices.length];
    if (!duel) {
      return;
    }

    const result = recordDuelChoice(session, duel, place.id, reason);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSession(result.session);
    setReason("");
    setError(null);
    setFeedback(
      `انتخاب «${place.name}» سیگنال «${TASTE_DIMENSION_LABELS[result.addedSignal]}» را پررنگ‌تر کرد.`,
    );
  };

  const isComplete = Boolean(
    scenario && session && session.choices.length >= scenario.duels.length,
  );

  return (
    <section className="relative -top-[72px] -mb-[72px] overflow-hidden pb-16 pt-28 sm:-top-20 sm:-mb-20 sm:pb-24 sm:pt-36" aria-labelledby="nabz-title">
      <div aria-hidden className="absolute -right-28 top-10 h-[420px] w-[420px] rounded-full bg-mint/[0.09] blur-[90px]" />
      <div aria-hidden className="absolute -left-24 bottom-0 h-[380px] w-[380px] rounded-full bg-pomegr/[0.08] blur-[100px]" />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.55) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          maskImage: "linear-gradient(to bottom, black, transparent 88%)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent 88%)",
        }}
      />

      <Container>
        <div className="relative z-10 grid items-start gap-8 pt-7 lg:grid-cols-[minmax(0,0.68fr)_minmax(620px,1.32fr)] lg:gap-10 lg:pt-14">
          <div className="lg:sticky lg:top-28 lg:pt-6">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-mint/25 bg-mint/[0.08] px-3 py-1.5 text-xs font-bold text-mint">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-mint shadow-[0_0_12px_rgba(91,230,178,0.9)]" />
                نبض رشت
              </span>
              <span className="rounded-full border border-saffron/25 bg-saffron/[0.07] px-3 py-1.5 text-[11px] font-bold text-saffron">
                نسخه نمایشی · نام‌ها ساختگی‌اند
              </span>
            </div>

            <h1 id="nabz-title" className="max-w-[620px] text-[2.55rem] font-black leading-[1.2] -tracking-[0.035em] text-strong sm:text-5xl lg:text-[3.65rem]">
              با پنج انتخاب بگو
              <span className="mt-2 block bg-[linear-gradient(100deg,#5BE6B2_0%,#F5B544_48%,#FF6B95_100%)] bg-clip-text text-transparent">
                امشب کجا بریم.
              </span>
            </h1>
            <p className="mt-6 max-w-[520px] text-[15px] leading-8 text-[#b1bac7] sm:text-base">
              به‌جای زیرورو کردن ده‌ها صفحه، بین دو انتخاب محلی رأی بده. نظراتو از همین انتخاب‌های کوچک می‌فهمد چه جایی برای موقعیت تو مناسب‌تر است—و دلیلش را هم نشان می‌دهد.
            </p>

            <div className="mt-8 grid max-w-[480px] grid-cols-3 divide-x divide-x-reverse divide-white/[0.09] rounded-[20px] border border-glass-border bg-black/15 px-3 py-4">
              <div className="text-center">
                <strong className="block text-lg font-black text-strong">۵</strong>
                <span className="text-[11px] text-muted">انتخاب</span>
              </div>
              <div className="text-center">
                <strong className="block text-lg font-black text-strong">۴</strong>
                <span className="text-[11px] text-muted">موقعیت</span>
              </div>
              <div className="text-center">
                <strong className="block text-sm font-black text-mint">بدون ورود</strong>
                <span className="text-[11px] text-muted">برای شروع</span>
              </div>
            </div>

            <p className="mt-5 flex max-w-[500px] items-start gap-2 text-xs leading-6 text-muted">
              <span aria-hidden className="mt-1 text-saffron">✦</span>
              داده‌های واقعی Drive و OpenStreetMap هنوز قرنطینه‌اند و در این صفحه استفاده نشده‌اند.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-white/[0.13] bg-[linear-gradient(145deg,rgba(17,24,39,0.94),rgba(8,12,22,0.92))] p-4 shadow-[0_34px_90px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl sm:p-6 lg:p-7">
            <div aria-hidden className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-lapis/[0.12] blur-3xl" />
            <div aria-hidden className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-mint/[0.08] blur-3xl" />
            <div className="relative min-h-[520px]">
              {!scenario || !session ? <ScenarioPicker onSelect={startScenario} /> : null}
              {scenario && session && !isComplete ? (
                <DuelStage
                  scenario={scenario}
                  session={session}
                  reason={reason}
                  feedback={feedback}
                  error={error}
                  onReasonChange={setReason}
                  onChoose={choosePlace}
                  onBack={reset}
                />
              ) : null}
              {scenario && session && isComplete ? (
                <ResultStage scenario={scenario} session={session} onRestart={reset} />
              ) : null}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
