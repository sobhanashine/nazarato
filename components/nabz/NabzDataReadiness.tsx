import type { NabzBusinessPoolLoadResult } from "../../lib/nabz/business-pool";

export type NabzDataReadinessStatus = Pick<
  NabzBusinessPoolLoadResult,
  "status" | "summary" | "message"
>;

const formatFaNumber = (value: number) => value.toLocaleString("fa-IR");

function statusCopy(status: NabzDataReadinessStatus): {
  eyebrow: string;
  title: string;
  accent: string;
  dot: string;
} {
  if (status.status === "ready") {
    return {
      eyebrow: "دروازه داده واقعی باز است",
      title: `دوئل واقعی آماده است · ${formatFaNumber(status.summary.duelReadyBusinessCount)} کسب‌وکار`,
      accent: "border-mint/25 bg-mint/[0.075]",
      dot: "bg-mint shadow-[0_0_12px_rgba(91,230,178,0.8)]",
    };
  }
  if (status.status === "unavailable") {
    return {
      eyebrow: "بررسی زنده ناموفق",
      title: "استخر واقعی قابل بررسی نیست",
      accent: "border-pomegr/25 bg-pomegr/[0.065]",
      dot: "bg-pomegr",
    };
  }
  return {
    eyebrow: "دروازه داده واقعی بسته است",
    title: "داده کافی نداریم",
    accent: "border-saffron/25 bg-saffron/[0.065]",
    dot: "bg-saffron",
  };
}

function ReadinessMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <strong className="block text-sm font-black tabular-nums text-strong">
        {value}
      </strong>
      <span className="mt-1 block text-[10px] leading-5 text-muted">
        {label}
      </span>
    </div>
  );
}

/** A compact, client-safe projection of the server-side publication gate. */
export function NabzDataReadiness({
  status,
}: {
  status: NabzDataReadinessStatus;
}) {
  const copy = statusCopy(status);
  const { summary } = status;

  return (
    <section
      aria-label="وضعیت داده‌های واقعی نبض رشت"
      className={`mt-6 overflow-hidden rounded-[20px] border ${copy.accent}`}
    >
      <div className="flex items-start gap-3 border-b border-white/[0.07] px-4 py-3.5">
        <span
          aria-hidden
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${copy.dot}`}
        />
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.12em] text-muted">
            {copy.eyebrow}
          </p>
          <p className="mt-1 text-sm font-extrabold leading-6 text-strong">
            {copy.title}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-[#aeb7c4]">
            {status.message}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-x-reverse divide-white/[0.07] px-4 py-3 text-center">
        <ReadinessMetric
          label="منبع تأییدشده"
          value={formatFaNumber(summary.eligibleBusinessCount)}
        />
        <ReadinessMetric
          label="آماده دوئل"
          value={`${formatFaNumber(summary.duelReadyBusinessCount)} از ${formatFaNumber(summary.requiredDuelBusinesses)}`}
        />
        <ReadinessMetric
          label="آماده توصیه"
          value={formatFaNumber(summary.recommendationReadyBusinessCount)}
        />
      </div>
    </section>
  );
}
