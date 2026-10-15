import type { TasteProfileView } from "@/lib/nabz/taste-profile-input";
import { summarizeTaste } from "./nabz-engine";

export type TasteProfileLoadStatus = "idle" | "loading" | "ready" | "error";

function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  }).format(new Date(value));
}

export function SavedTasteProfileCard({
  status,
  profile,
}: {
  status: TasteProfileLoadStatus;
  profile: TasteProfileView | null;
}) {
  if (status === "idle") {
    return null;
  }

  if (status === "loading") {
    return (
      <div
        aria-busy="true"
        aria-label="در حال بازیابی پروفایل سلیقه"
        className="mt-5 max-w-[500px] rounded-[20px] border border-mint/15 bg-mint/[0.035] p-4"
      >
        <div className="h-3 w-36 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none" />
        <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-white/[0.07] motion-reduce:animate-none" />
        <div className="mt-2 h-2 w-4/5 animate-pulse rounded-full bg-white/[0.07] motion-reduce:animate-none" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        role="status"
        className="mt-5 max-w-[500px] rounded-[20px] border border-saffron/20 bg-saffron/[0.045] px-4 py-3 text-xs leading-6 text-[#e8d7ad]"
      >
        پروفایل قبلی فعلاً در دسترس نیست؛ بازی و پیشنهادهای همین دستگاه همچنان کار می‌کنند.
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        role="status"
        className="mt-5 max-w-[500px] rounded-[20px] border border-mint/15 bg-mint/[0.035] px-4 py-3 text-xs leading-6 text-[#cbd2dc]"
      >
        <strong className="block text-strong">هنوز پروفایلی روی حسابت نیست.</strong>
        با اولین انتخاب، نسخه‌ی خصوصی و قابل‌بازیابی سلیقه‌ات ساخته می‌شود.
      </div>
    );
  }

  const topDimensions = summarizeTaste(profile.scores).ordered.slice(0, 3);
  const maxScore = Math.max(1, ...topDimensions.map((item) => item.score));

  return (
    <aside
      aria-label="پروفایل ذخیره‌شده سلیقه"
      className="mt-5 max-w-[500px] overflow-hidden rounded-[22px] border border-mint/20 bg-[linear-gradient(145deg,rgba(91,230,178,0.08),rgba(8,12,22,0.48))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.08em] text-mint">
            پروفایل ذخیره‌شده روی حساب
          </p>
          <p className="mt-1 text-xs leading-6 text-muted">
            {profile.evidenceCount.toLocaleString("fa-IR")} انتخاب · به‌روزرسانی {formatUpdatedAt(profile.updatedAt)}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full border border-mint/20 bg-mint/[0.08] px-2.5 py-1 text-[10px] font-bold text-[#b8f7df]"
          dir="ltr"
        >
          v{profile.modelVersion}
        </span>
      </div>

      <ol className="mt-3 space-y-2.5">
        {topDimensions.map((item) => (
          <li key={item.dimension}>
            <div className="mb-1 flex items-center justify-between gap-3 text-[11px]">
              <span className="font-bold text-[#d8dee7]">{item.label}</span>
              <span className="text-muted">{item.score.toLocaleString("fa-IR")}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#5BE6B2,#F5B544)]"
                style={{ width: `${Math.max(4, (item.score / maxScore) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-3 border-t border-white/[0.07] pt-3 text-[10px] leading-5 text-muted">
        فقط وزن‌های تجمیعی بین دستگاه‌ها بازیابی می‌شوند؛ دلیل‌های متنی روی حساب ذخیره نمی‌شوند.
      </p>
    </aside>
  );
}
