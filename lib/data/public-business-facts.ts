/** Public JSON projection. Type assertions alone must never ship internal keys. */
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

const PUBLIC_INFO_LABELS = new Set([
  "نشانی", "آدرس", "محله", "محدوده", "نوع", "نوع فعالیت", "نوع فضا",
  "نوع فروشگاه", "خدمات", "روش ارسال", "ارسال", "روش پرداخت", "ساعات کاری",
  "سال تأسیس", "سال تاسیس", "وب‌سایت", "وبسایت", "تلفن",
]);

export function toPublicBusinessContact(value: unknown): { website?: string; phone?: string; instagram?: string } {
  if (!record(value)) return {};
  const website = text(value.website, 500);
  const phone = text(value.phone, 80);
  const instagram = text(value.instagram, 100);
  return {
    ...(website ? { website } : {}),
    ...(phone ? { phone } : {}),
    ...(instagram ? { instagram } : {}),
  };
}

export function toPublicBusinessInfo(value: unknown): { label: string; value: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(entry => {
    if (!record(entry)) return [];
    const label = text(entry.label, 80), detail = text(entry.value, 500);
    return PUBLIC_INFO_LABELS.has(label) && detail ? [{ label, value: detail }] : [];
  }).slice(0, 20);
}

export function toPublicBusinessHours(value: unknown): { day: string; value: string }[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.flatMap(entry => {
    if (!record(entry)) return [];
    const day = text(entry.day, 40), detail = text(entry.value, 160);
    return day && detail ? [{ day, value: detail }] : [];
  }).slice(0, 7);
}
