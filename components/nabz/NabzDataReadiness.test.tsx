import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NabzDataReadiness } from "./NabzDataReadiness";

const summary = {
  eligibleBusinessCount: 1,
  duelReadyBusinessCount: 0,
  recommendationReadyBusinessCount: 0,
  requiredDuelBusinesses: 2,
  requiredRecommendationEvidence: 3,
};

describe("NabzDataReadiness", () => {
  it("shows the fail-closed supply count without implying the demo is real", () => {
    const html = renderToStaticMarkup(
      <NabzDataReadiness
        status={{
          status: "insufficient_supply",
          summary,
          message:
            "داده کافی نداریم؛ نسخه نمایشی تا تأیید حداقل دو کسب‌وکار واقعی جدا می‌ماند.",
        }}
      />,
    );

    expect(html).toContain("داده کافی نداریم");
    expect(html).toContain("۰ از ۲");
    expect(html).toContain("نسخه نمایشی");
    expect(html).toContain("aria-label=\"وضعیت داده‌های واقعی نبض رشت\"");
  });

  it("distinguishes duel readiness from recommendation readiness", () => {
    const html = renderToStaticMarkup(
      <NabzDataReadiness
        status={{
          status: "ready",
          summary: {
            ...summary,
            eligibleBusinessCount: 4,
            duelReadyBusinessCount: 4,
            recommendationReadyBusinessCount: 1,
          },
          message: "منبع کسب‌وکارهای واقعی برای ساخت دوئل آماده است.",
        }}
      />,
    );

    expect(html).toContain("دوئل واقعی آماده است");
    expect(html).toContain("۴ کسب‌وکار");
    expect(html).toContain("آماده توصیه");
    expect(html).toContain("۱");
  });
});
