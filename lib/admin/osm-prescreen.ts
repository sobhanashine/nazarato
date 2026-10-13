import type { OsmReviewContact } from "./osm-review";

export const OSM_PRESCREEN_VERSION = "nazarato-osm-prescreen/0.1.0";

export const OSM_PRESCREEN_RECOMMENDATIONS = [
  "low_risk_review",
  "needs_completion",
  "high_risk_exception",
] as const;

export type OsmPrescreenRecommendation =
  (typeof OSM_PRESCREEN_RECOMMENDATIONS)[number];

export const OSM_PRESCREEN_REASON_CODES = [
  "valid_provenance",
  "invalid_provenance",
  "source_identity_mismatch",
  "rasht_coordinates",
  "missing_coordinates",
  "outside_rasht_bounds",
  "phone_present",
  "missing_phone",
  "invalid_phone",
  "address_present",
  "missing_address",
  "digital_channel_present",
  "missing_digital_channel",
  "missing_context",
] as const;

export type OsmPrescreenReasonCode =
  (typeof OSM_PRESCREEN_REASON_CODES)[number];

export type OsmPrescreenResult = {
  version: typeof OSM_PRESCREEN_VERSION;
  recommendation: OsmPrescreenRecommendation;
  score: number;
  reasonCodes: OsmPrescreenReasonCode[];
};

export type OsmPrescreenInput = {
  slug: string;
  sourceUrl: string | null;
  licenseName: string;
  licenseUrl: string | null;
  attributionText: string;
  latitude: number | null;
  longitude: number | null;
  contact: OsmReviewContact;
};

export const OSM_PRESCREEN_REASON_LABELS: Record<
  OsmPrescreenReasonCode,
  string
> = {
  valid_provenance: "منبع، مجوز و انتساب معتبر است",
  invalid_provenance: "منبع، مجوز یا انتساب معتبر نیست",
  source_identity_mismatch: "شناسه پروفایل با شناسه منبع یکسان نیست",
  rasht_coordinates: "مختصات داخل محدوده رشت است",
  missing_coordinates: "مختصات ثبت نشده است",
  outside_rasht_bounds: "مختصات خارج از محدوده رشت است",
  phone_present: "شماره تماس ساختاریافته موجود است",
  missing_phone: "شماره تماس موجود نیست",
  invalid_phone: "ساختار شماره تماس معتبر نیست",
  address_present: "نشانی موجود است",
  missing_address: "نشانی موجود نیست",
  digital_channel_present: "وب‌سایت یا اینستاگرام موجود است",
  missing_digital_channel: "کانال دیجیتال موجود نیست",
  missing_context: "نه نشانی و نه کانال دیجیتال موجود است",
};

const RASHT_BOUNDS = {
  minLatitude: 37.22,
  minLongitude: 49.5,
  maxLatitude: 37.36,
  maxLongitude: 49.69,
} as const;

const IRAN_PHONE_PATTERN = /^\+98[0-9]{10}$/;

export function isOsmPrescreenRecommendation(
  value: unknown,
): value is OsmPrescreenRecommendation {
  return (
    typeof value === "string" &&
    OSM_PRESCREEN_RECOMMENDATIONS.some(
      (recommendation) => recommendation === value,
    )
  );
}

export function isOsmPrescreenReasonCode(
  value: unknown,
): value is OsmPrescreenReasonCode {
  return (
    typeof value === "string" &&
    OSM_PRESCREEN_REASON_CODES.some((reasonCode) => reasonCode === value)
  );
}

function hasValidPhone(contact: OsmReviewContact): boolean {
  if (!contact.phone) return false;
  const phones = contact.phone.split(";").map((phone) => phone.trim());
  return (
    phones.length > 0 &&
    phones.length <= 3 &&
    phones.every((phone) => IRAN_PHONE_PATTERN.test(phone))
  );
}

function sourceIdentity(sourceUrl: string): string | null {
  try {
    const url = new URL(sourceUrl);
    const match = url.pathname.match(/^\/(node|way|relation)\/([1-9][0-9]*)$/);
    if (!match) return null;
    return `rasht-osm-${match[1]}-${match[2]}`;
  } catch {
    return null;
  }
}

export function evaluateOsmPrescreen(
  candidate: OsmPrescreenInput,
): OsmPrescreenResult {
  const reasonCodes: OsmPrescreenReasonCode[] = [];
  const hardFailures: OsmPrescreenReasonCode[] = [];
  let score = 0;

  const identity = candidate.sourceUrl
    ? sourceIdentity(candidate.sourceUrl)
    : null;
  const validProvenance =
    identity !== null &&
    candidate.licenseName === "ODbL-1.0" &&
    candidate.licenseUrl === "https://www.openstreetmap.org/copyright" &&
    candidate.attributionText.includes("OpenStreetMap contributors");
  if (validProvenance) {
    score += 35;
    reasonCodes.push("valid_provenance");
  } else {
    reasonCodes.push("invalid_provenance");
    hardFailures.push("invalid_provenance");
  }
  if (identity !== null && identity !== candidate.slug) {
    reasonCodes.push("source_identity_mismatch");
    hardFailures.push("source_identity_mismatch");
  }

  const { latitude, longitude } = candidate;
  if (
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude)
  ) {
    reasonCodes.push("missing_coordinates");
    hardFailures.push("missing_coordinates");
  } else {
    const inRasht =
      latitude >= RASHT_BOUNDS.minLatitude &&
      latitude <= RASHT_BOUNDS.maxLatitude &&
      longitude >= RASHT_BOUNDS.minLongitude &&
      longitude <= RASHT_BOUNDS.maxLongitude;
    if (inRasht) {
      score += 20;
      reasonCodes.push("rasht_coordinates");
    } else {
      reasonCodes.push("outside_rasht_bounds");
      hardFailures.push("outside_rasht_bounds");
    }
  }

  const validPhone = hasValidPhone(candidate.contact);
  if (validPhone) {
    score += 20;
    reasonCodes.push("phone_present");
  } else if (candidate.contact.phone) {
    reasonCodes.push("invalid_phone");
    hardFailures.push("invalid_phone");
  } else {
    reasonCodes.push("missing_phone");
  }

  const hasAddress = Boolean(candidate.contact.address);
  const hasDigitalChannel = Boolean(
    candidate.contact.website || candidate.contact.instagram,
  );
  if (hasAddress) {
    score += 15;
    reasonCodes.push("address_present");
  }
  if (hasDigitalChannel) {
    score += 10;
    reasonCodes.push("digital_channel_present");
  }
  if (!hasAddress && !hasDigitalChannel) {
    reasonCodes.push("missing_context");
  } else {
    if (!hasAddress) reasonCodes.push("missing_address");
    if (!hasDigitalChannel) reasonCodes.push("missing_digital_channel");
  }

  let recommendation: OsmPrescreenRecommendation = "needs_completion";
  if (hardFailures.length > 0) {
    recommendation = "high_risk_exception";
  } else if (score >= 75 && validPhone && (hasAddress || hasDigitalChannel)) {
    recommendation = "low_risk_review";
  }

  return {
    version: OSM_PRESCREEN_VERSION,
    recommendation,
    score,
    reasonCodes,
  };
}
