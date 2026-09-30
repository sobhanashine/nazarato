/** A local-only projection. Never feed this catalog into public business reads. */
export type GolsarCafe = {
  id: string;
  name: string;
  sourceName: string;
  address: string;
  street: string;
  phone: string | null;
  instagram: string | null;
  latitude: number;
  longitude: number;
  plusCodes: string[];
  sourceUrl: string;
  capturedAt: string;
  priority: number;
  categoryNote: string;
  closed: boolean;
};

export type LocalExperience = {
  version: 1;
  cafeId: string;
  rating: number;
  body: string;
  updatedAt: string;
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function shortText(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeUrl(value: unknown, hosts: string[]): string | null {
  if (typeof value !== "string" || value.length > 1500) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && hosts.includes(url.hostname) &&
      !url.username && !url.password && !url.port ? url.href : null;
  } catch { return null; }
}

export function normalizeGolsarText(value: string): string {
  return value.normalize("NFKC").toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/ي|ى/g, "ی").replace(/ك/g, "ک").replace(/آ|أ|إ/g, "ا")
    .replace(/tohid|toh[e]?ed/g, "توحید").replace(/deylaman|deilaman/g, "دیلمان")
    .replace(/golsar/g, "گلسار").replace(/imam\s*ali|emam\s*ali/g, "امام علی")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}

export function isLocalGolsarPreview(environment: string | undefined, enabled: string | undefined, host: string | null): boolean {
  return environment === "development" && enabled === "true" &&
    /^(localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/.test(host ?? "");
}

export function parseGolsarExport(value: unknown): GolsarCafe[] {
  if (!record(value) || !Array.isArray(value.items) || value.items.length < 1 || value.items.length > 100) {
    throw new Error("Invalid Golsar snapshot");
  }
  const seen = new Set<string>();
  return value.items.map((row: unknown) => {
    if (!record(row)) throw new Error("Invalid cafe");
    const id = shortText(row.google_place_id, 150);
    const name = shortText(row.user_requested_name, 200) || shortText(row.name, 200);
    const sourceUrl = safeUrl(row.source_url, ["www.google.com", "google.com"]);
    const { latitude, longitude } = row;
    if (!/^[\w-]{10,150}$/.test(id) || seen.has(id) || !name || !sourceUrl ||
      row.source_provider !== "google_maps_via_apify" || row.permission_basis !== "unknown" ||
      row.publication_status !== "not_approved" || row.pilot_category_proposed !== "cafe" ||
      typeof latitude !== "number" || !Number.isFinite(latitude) || latitude < 37.1 || latitude > 37.5 ||
      typeof longitude !== "number" || !Number.isFinite(longitude) || longitude < 49.3 || longitude > 49.9 ||
      typeof row.captured_at !== "string" || !Number.isFinite(Date.parse(row.captured_at))) {
      throw new Error("Invalid cafe boundary");
    }
    seen.add(id);
    return {
      id, name, sourceName: shortText(row.name, 200),
      address: shortText(row.address_readable), street: shortText(row.street_readable),
      phone: typeof row.phone === "string" && /^\+98\d{10}$/.test(row.phone) ? row.phone : null,
      instagram: safeUrl(row.instagram, ["www.instagram.com", "instagram.com"]),
      latitude, longitude,
      plusCodes: Array.isArray(row.plus_codes) ? row.plus_codes.filter((x): x is string => typeof x === "string" && /^[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]{2,3}$/.test(x)).slice(0, 3) : [],
      sourceUrl, capturedAt: row.captured_at,
      priority: typeof row.pilot_priority === "number" && [1, 2, 3].includes(row.pilot_priority) ? row.pilot_priority : 4,
      categoryNote: shortText(row.category_note),
      closed: row.permanently_closed === true || row.temporarily_closed === true,
    };
  }).sort((a, b) => a.priority - b.priority);
}

export function filterGolsarCafes(cafes: GolsarCafe[], query: string, area: string): GolsarCafe[] {
  const words = normalizeGolsarText(query).split(" ").filter(Boolean);
  const areaQuery = normalizeGolsarText(area);
  return cafes.filter(cafe => {
    const haystack = normalizeGolsarText(`${cafe.name} ${cafe.sourceName} ${cafe.address} ${cafe.street}`);
    return words.every(word => haystack.includes(word)) && (!areaQuery || normalizeGolsarText(`${cafe.address} ${cafe.street}`).includes(areaQuery));
  });
}

export function experienceKey(cafeId: string): string {
  return `nazarato:golsar-preview:v1:${cafeId}`;
}

export function validateExperience(rating: number, body: string): string | null {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return "اول امتیازت را از ۱ تا ۵ انتخاب کن.";
  if (body.trim().length < 10) return "تجربه‌ات را در حداقل ۱۰ نویسه بنویس.";
  if (body.trim().length > 2000) return "متن تجربه باید حداکثر ۲۰۰۰ نویسه باشد.";
  return null;
}

export function parseLocalExperience(raw: string | null, cafeId: string): LocalExperience | null {
  if (!raw || raw.length > 10000) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!record(value) || value.version !== 1 || value.cafeId !== cafeId ||
      typeof value.rating !== "number" || typeof value.body !== "string" ||
      validateExperience(value.rating, value.body) !== null ||
      typeof value.updatedAt !== "string" || !Number.isFinite(Date.parse(value.updatedAt))) return null;
    return { version: 1, cafeId, rating: value.rating, body: value.body.trim(), updatedAt: value.updatedAt };
  } catch { return null; }
}

export function saveLocalExperience(
  storage: Pick<Storage, "setItem">,
  cafeId: string,
  rating: number,
  body: string,
): { ok: true; value: LocalExperience } | { ok: false; error: string } {
  const error = validateExperience(rating, body);
  if (error) return { ok: false, error };
  const value: LocalExperience = { version: 1, cafeId, rating, body: body.trim(), updatedAt: new Date().toISOString() };
  try {
    storage.setItem(experienceKey(cafeId), JSON.stringify(value));
    return { ok: true, value };
  } catch {
    return { ok: false, error: "ذخیره انجام نشد؛ فضای مرورگر یا دسترسی ذخیره‌سازی را بررسی کن. متن تو هنوز اینجاست." };
  }
}


/** Adapt the existing wizard payload without invoking a public server action. */
export function submitLocalPreviewReview(
  storage: Pick<Storage, "setItem">,
  cafeId: string,
  formData: FormData,
): ReturnType<typeof saveLocalExperience> {
  if (formData.get("slug") !== cafeId) {
    return { ok: false, error: "کافهٔ انتخاب‌شده تغییر کرده؛ صفحه را دوباره باز کن." };
  }
  const rating = formData.get("rating");
  const body = formData.get("body");
  if (typeof rating !== "string" || typeof body !== "string") {
    return { ok: false, error: "امتیاز و متن تجربه را کامل کن." };
  }
  return saveLocalExperience(storage, cafeId, Number(rating), body);
}
