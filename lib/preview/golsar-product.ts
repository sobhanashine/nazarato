import type { Business, BusinessDetail } from "@/lib/data/businesses";
import type { GolsarCafe } from "./golsar";

export function toGolsarBusiness(cafe: GolsarCafe): Business {
  return {
    slug: cafe.id, name: cafe.name, category: "کافه", city: "رشت",
    initial: cafe.name.replace(/کافه/g, "").trim().charAt(0) || "ک",
    color: "#7B89FF", score: "—", reviews: "۰", reviewCount: 0, verified: false,
    searchText: `${cafe.sourceName} ${cafe.address} ${cafe.street}`,
  };
}

export function toGolsarBusinessDetail(cafe: GolsarCafe): BusinessDetail {
  const card = toGolsarBusiness(cafe);
  const instagram = cafe.instagram ? new URL(cafe.instagram).pathname.split("/").filter(Boolean)[0] : undefined;
  return {
    slug: card.slug, name: card.name, category: card.category, city: card.city,
    initial: card.initial, color: card.color, verified: false, claimed: false,
    description: `${cafe.name} در فهرست اولیهٔ کافه‌های گلسار و اطراف قرار دارد. ${cafe.address ? `نشانی ثبت‌شده: ${cafe.address}.` : "نشانی کامل هنوز موجود نیست."} اطلاعات اولیه از Google Maps است و مالک آن را تأیید نکرده است.`,
    contact: {
      ...(cafe.phone ? { phone: cafe.phone } : {}),
      ...(instagram ? { instagram } : {}),
    },
    info: [
      ...(cafe.address ? [{ label: "نشانی", value: cafe.address }] : []),
      ...(cafe.plusCodes.length ? [{ label: "کد موقعیت", value: cafe.plusCodes.join(" / ") }] : []),
      { label: "منبع اطلاعات", value: "Google Maps" },
      { label: "تاریخ برداشت", value: new Date(cafe.capturedAt).toLocaleDateString("fa-IR") },
      ...(cafe.closed ? [{ label: "وضعیت فعالیت", value: "بسته‌بودن در منبع گزارش شده؛ نیازمند بررسی" }] : []),
      ...(cafe.categoryNote ? [{ label: "توضیح دسته‌بندی", value: cafe.categoryNote }] : []),
    ],
    similar: [], reviews: [],
  };
}
