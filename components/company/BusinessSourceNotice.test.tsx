import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BusinessSourceNotice } from "./BusinessSourceNotice";

describe("BusinessSourceNotice", () => {
  it("renders a readable source and licence credit", () => {
    const html = renderToStaticMarkup(
      createElement(BusinessSourceNotice, {
        attributions: [
          {
            sourceType: "open_dataset",
            sourceUrl: "https://www.openstreetmap.org/node/1",
            licenseName: "ODbL-1.0",
            licenseUrl:
              "https://opendatacommons.org/licenses/odbl/1-0/",
            attributionText: "© OpenStreetMap contributors",
          },
        ],
      }),
    );

    expect(html).toContain("منبع اطلاعات این صفحه");
    expect(html).toContain("© OpenStreetMap contributors");
    expect(html).toContain("https://www.openstreetmap.org/node/1");
    expect(html).toContain("مجوز ODbL-1.0");
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("renders nothing when there is no public attribution", () => {
    expect(
      renderToStaticMarkup(
        createElement(BusinessSourceNotice, { attributions: [] }),
      ),
    ).toBe("");
  });
});
