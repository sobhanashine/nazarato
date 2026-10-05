import { canApproveOsmPublication } from "./osm-publication";
import type { OsmReviewCandidate } from "./osm-review";

type PreviewContactItem = {
  label: "تلفن" | "نشانی" | "وب‌سایت" | "اینستاگرام";
  value: string;
  direction: "rtl" | "ltr";
};

export type OsmPublicationPreview =
  | {
      status: "ready";
      identity: {
        name: string;
        category: "کافه" | "رستوران";
        city: "رشت";
        latitude: number;
        longitude: number;
      };
      contact: PreviewContactItem[];
      attribution: {
        text: string;
        sourceUrl: string;
        licenseName: string;
        licenseUrl: string;
      };
      excluded: string[];
    }
  | { status: "blocked"; reason: string };

const CATEGORY_LABELS = {
  cafe: "کافه",
  restaurant: "رستوران",
} as const;

const EXCLUDED_PUBLIC_FIELDS = [
  "نظرها و امتیازهای پلتفرم‌های دیگر",
  "تصویر یا توضیحات تبلیغاتی منبع ثالث",
  "نشان مالکیت یا تأیید کسب‌وکار",
];

export function buildOsmPublicationPreview(
  candidate: OsmReviewCandidate,
): OsmPublicationPreview {
  if (candidate.reviewState !== "ready_for_approval") {
    return {
      status: "blocked",
      reason: "این گزینه هنوز برای پیش‌نمایش قبل از انتشار آماده نیست.",
    };
  }

  if (
    candidate.sourceWarning !== null ||
    candidate.sourceUrl === null ||
    candidate.licenseUrl === null
  ) {
    return {
      status: "blocked",
      reason:
        "پیش‌نمایش امن ساخته نشد؛ لینک منبع OSM یا مجوز ODbL معتبر نیست.",
    };
  }

  if (candidate.latitude === null || candidate.longitude === null) {
    return {
      status: "blocked",
      reason: "پیش‌نمایش امن ساخته نشد؛ مختصات کسب‌وکار کامل نیست.",
    };
  }

  if (!canApproveOsmPublication(candidate)) {
    return {
      status: "blocked",
      reason:
        "پیش‌نمایش امن ساخته نشد؛ داده با قرارداد فعلی انتشار OSM تطابق ندارد.",
    };
  }

  const contact: PreviewContactItem[] = [];
  if (candidate.contact.phone) {
    contact.push({
      label: "تلفن",
      value: candidate.contact.phone,
      direction: "ltr",
    });
  }
  if (candidate.contact.address) {
    contact.push({
      label: "نشانی",
      value: candidate.contact.address,
      direction: "rtl",
    });
  }
  if (candidate.contact.website) {
    contact.push({
      label: "وب‌سایت",
      value: candidate.contact.website,
      direction: "ltr",
    });
  }
  if (candidate.contact.instagram) {
    contact.push({
      label: "اینستاگرام",
      value: `@${candidate.contact.instagram.replace(/^@/, "")}`,
      direction: "ltr",
    });
  }

  return {
    status: "ready",
    identity: {
      name: candidate.name,
      category: CATEGORY_LABELS[candidate.category],
      city: candidate.city,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
    },
    contact,
    attribution: {
      text: candidate.attributionText,
      sourceUrl: candidate.sourceUrl,
      licenseName: candidate.licenseName,
      licenseUrl: candidate.licenseUrl,
    },
    excluded: [...EXCLUDED_PUBLIC_FIELDS],
  };
}
