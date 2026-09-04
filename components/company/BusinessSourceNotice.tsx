import type { BusinessSourceAttribution } from "@/lib/data/businesses";

type BusinessSourceNoticeProps = {
  attributions: BusinessSourceAttribution[];
  className?: string;
};

/** Visible credit for profile facts imported from an approved open dataset. */
export function BusinessSourceNotice({
  attributions,
  className = "",
}: BusinessSourceNoticeProps) {
  if (attributions.length === 0) return null;

  return (
    <aside
      aria-label="منبع اطلاعات کسب‌وکار"
      className={`relative overflow-hidden rounded-glass border border-lapis/25 bg-[linear-gradient(135deg,rgba(123,137,255,0.09),rgba(12,16,28,0.45))] p-5 sm:p-6 ${className}`}
    >
      <div
        aria-hidden
        className="absolute -left-10 -top-12 h-28 w-28 rounded-full bg-lapis/15 blur-3xl"
      />
      <div className="relative">
        <p className="text-[0.7rem] font-black tracking-[0.11em] text-[#aeb7ff]">
          شناسنامه‌ی داده
        </p>
        <h2 className="mt-1 text-[1.05rem] font-extrabold text-strong">
          منبع اطلاعات این صفحه
        </h2>
        <p className="mt-2 text-[0.82rem] leading-7 text-muted">
          اطلاعات پایه از منبع باز گرفته شده؛ امتیازها و نظرهای نظراتو از این
          منبع کپی نشده‌اند.
        </p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {attributions.map((attribution) => (
            <li
              key={`${attribution.sourceUrl}|${attribution.licenseUrl}`}
              className="flex flex-col gap-2 rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="text-[0.8rem] font-bold text-strong">
                {attribution.attributionText}
              </span>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem]">
                <a
                  href={attribution.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-mint underline-offset-4 hover:underline"
                >
                  مشاهده منبع
                </a>
                <a
                  href={attribution.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#aeb7ff] underline-offset-4 hover:underline"
                >
                  مجوز {attribution.licenseName}
                </a>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
