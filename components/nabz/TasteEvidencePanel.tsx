import type { TasteEvidenceItem } from "./nabz-engine";
import type { TasteDimension } from "./nabz-demo-data";

const dimensionColors: Record<TasteDimension, string> = {
  cozy: "bg-pomegr",
  quiet: "bg-lapis",
  value: "bg-saffron",
  local: "bg-mint",
  social: "bg-[#ff8a5b]",
  service: "bg-[#75d7ff]",
};

const formatFaNumber = (value: number) => value.toLocaleString("fa-IR");

export function TasteEvidencePanel({
  evidence,
}: {
  evidence: readonly TasteEvidenceItem[];
}) {
  const visibleEvidence = evidence;
  const maxScore = Math.max(...visibleEvidence.map((item) => item.score), 1);

  return (
    <div
      id="nabz-taste-evidence"
      className="mb-7 rounded-[22px] border border-glass-border bg-black/15 p-4"
      aria-label="اثر انگشت سلیقه و شواهد آن"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <strong className="text-sm font-extrabold text-strong">
          اثر انگشت سلیقه تو
        </strong>
        <span className="text-[11px] text-muted">هر نوار قابل بررسی است</span>
      </div>

      <div className="space-y-3">
        {visibleEvidence.map((item) => (
          <details
            id={`taste-evidence-${item.dimension}`}
            key={item.dimension}
            className="group scroll-mt-28 rounded-xl border border-transparent open:border-white/[0.07] open:bg-white/[0.025]"
          >
            <summary className="grid min-h-11 cursor-pointer list-none grid-cols-[92px_1fr_28px] items-center gap-3 rounded-xl px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint [&::-webkit-details-marker]:hidden">
              <span className="text-[#cbd2dc]">{item.label}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <span
                  className={`block h-full rounded-full ${dimensionColors[item.dimension]}`}
                  style={{ width: `${Math.round((item.score / maxScore) * 100)}%` }}
                />
              </span>
              <span className="text-left font-bold text-muted">
                {formatFaNumber(item.score)}
              </span>
            </summary>

            <ul className="space-y-2 border-t border-white/[0.06] px-3 py-3">
              {item.sources.map((source) => (
                <li key={`${item.dimension}-${source.duelId}`} className="text-[11px] leading-6 text-muted">
                  <span className="font-bold text-[#d8dee8]">{source.placeName}</span>
                  <span aria-hidden> · </span>
                  {source.prompt}
                  {source.reason ? (
                    <span className="mt-1 block border-r-2 border-mint/30 pr-2 text-[#b8c2cf]">
                      دلیل تو: «{source.reason}»
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </div>
  );
}
