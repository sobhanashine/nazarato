export type Company = {
  href: string;
  name: string;
  initial: string;
  color: string;
  score: string;
  reviews: string;
  city: string;
};

export const companies: Company[] = [
  { href: "/company/digikala", name: "دیجی‌کالا", initial: "د", color: "#D6304C", score: "۴.۵", reviews: "۱٬۲۸۴", city: "تهران" },
  { href: "/company/snappfood", name: "اسنپ‌فود", initial: "ا", color: "#E65100", score: "۴.۳", reviews: "۹۶۷", city: "تهران" },
  { href: "/company/tapsi", name: "تپسی", initial: "ت", color: "#1565C0", score: "۴.۱", reviews: "۷۴۲", city: "تهران" },
  { href: "/company/alibaba", name: "علی‌بابا", initial: "ع", color: "#2E7D32", score: "۴.۲", reviews: "۸۹۱", city: "تهران" },
];
