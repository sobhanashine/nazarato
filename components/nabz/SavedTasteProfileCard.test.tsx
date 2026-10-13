import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SavedTasteProfileCard } from "./SavedTasteProfileCard";

describe("SavedTasteProfileCard", () => {
  it("renders a compact account aggregate without raw choice evidence", () => {
    const html = renderToStaticMarkup(
      <SavedTasteProfileCard
        status="ready"
        profile={{
          modelId: "nazarato-taste-graph",
          modelVersion: "0.1.0",
          scores: {
            cozy: 14,
            quiet: 9,
            value: 4,
            local: 3,
            social: 1,
            service: 8,
          },
          evidenceCount: 5,
          updatedAt: "2026-09-06T10:30:00.000Z",
        }}
      />,
    );

    expect(html).toContain("پروفایل ذخیره‌شده روی حساب");
    expect(html).toContain("فضای دنج");
    expect(html).toContain("۵ انتخاب");
    expect(html).toContain("دلیل‌های متنی");
    expect(html).not.toContain("selectedPlaceId");
  });

  it("keeps the game available when an account has no saved profile", () => {
    const html = renderToStaticMarkup(
      <SavedTasteProfileCard status="ready" profile={null} />,
    );

    expect(html).toContain("هنوز پروفایلی روی حسابت نیست");
    expect(html).toContain("اولین انتخاب");
  });
});
