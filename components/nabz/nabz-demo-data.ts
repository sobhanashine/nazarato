export const TASTE_DIMENSIONS = [
  "cozy",
  "quiet",
  "value",
  "local",
  "social",
  "service",
] as const;

export type TasteDimension = (typeof TASTE_DIMENSIONS)[number];

export type NabzPlaceId =
  | "baran"
  | "kaghaz"
  | "roshan"
  | "gil-khorak"
  | "narenj"
  | "moj"
  | "toranj"
  | "istgah";

export type NabzScenarioId = "date" | "laptop" | "budget" | "local-food";

export interface NabzPlace {
  id: NabzPlaceId;
  name: string;
  kind: "کافه" | "رستوران" | "کافه‌رستوران";
  neighborhood: string;
  vignette: string;
  price: "اقتصادی" | "متوسط" | "ویژه";
  tags: readonly string[];
  signals: Record<TasteDimension, number>;
}

export interface NabzDuel {
  id: string;
  prompt: string;
  options: readonly [NabzPlaceId, NabzPlaceId];
}

export interface NabzScenario {
  id: NabzScenarioId;
  title: string;
  shortTitle: string;
  icon: string;
  description: string;
  duels: readonly NabzDuel[];
}

export const TASTE_DIMENSION_LABELS: Record<TasteDimension, string> = {
  cozy: "فضای دنج",
  quiet: "آرامش",
  value: "ارزش خرید",
  local: "حال‌وهوای گیلانی",
  social: "انرژی جمعی",
  service: "سرویس مطمئن",
};

export const NABZ_DEMO_PLACES: readonly NabzPlace[] = [
  {
    id: "baran",
    name: "کافه نمونه باران",
    kind: "کافه",
    neighborhood: "گلسار",
    vignette: "حیاط سبز، میزهای دونفره و نور گرم شب",
    price: "متوسط",
    tags: ["دنج", "قرار", "حیاط"],
    signals: { cozy: 3, quiet: 2, value: 1, local: 1, social: 0, service: 2 },
  },
  {
    id: "kaghaz",
    name: "کافه نمونه کاغذ",
    kind: "کافه",
    neighborhood: "منظریه",
    vignette: "میز کار، پریز کنار صندلی و موسیقی کم‌صدا",
    price: "اقتصادی",
    tags: ["لپ‌تاپ", "آرام", "قهوه"],
    signals: { cozy: 1, quiet: 3, value: 2, local: 0, social: 0, service: 2 },
  },
  {
    id: "roshan",
    name: "کافه نمونه روشن",
    kind: "کافه",
    neighborhood: "علم‌الهدی",
    vignette: "پنجره‌های بلند و فضای پرجنب‌وجوش شهری",
    price: "متوسط",
    tags: ["مرکزی", "گپ", "پرانرژی"],
    signals: { cozy: 1, quiet: 0, value: 1, local: 1, social: 3, service: 2 },
  },
  {
    id: "gil-khorak",
    name: "رستوران نمونه گیل‌خوراک",
    kind: "رستوران",
    neighborhood: "ساغری‌سازان",
    vignette: "منوی کوتاه گیلانی با خوراک روز و مخلفات محلی",
    price: "متوسط",
    tags: ["محلی", "خوراک روز", "خانوادگی"],
    signals: { cozy: 1, quiet: 1, value: 2, local: 3, social: 2, service: 1 },
  },
  {
    id: "narenj",
    name: "سفره نمونه نارنج",
    kind: "رستوران",
    neighborhood: "سبزه‌میدان",
    vignette: "پرس‌های جمع‌وجور و انتخاب‌های اقتصادی برای ناهار",
    price: "اقتصادی",
    tags: ["اقتصادی", "سریع", "مرکزی"],
    signals: { cozy: 0, quiet: 1, value: 3, local: 2, social: 1, service: 2 },
  },
  {
    id: "moj",
    name: "کافه‌رستوران نمونه موج",
    kind: "کافه‌رستوران",
    neighborhood: "بلوار گیلان",
    vignette: "میزهای گروهی، منوی متنوع و شب‌های شلوغ",
    price: "ویژه",
    tags: ["گروهی", "شب", "متنوع"],
    signals: { cozy: 1, quiet: 0, value: 0, local: 1, social: 3, service: 3 },
  },
  {
    id: "toranj",
    name: "غذای محلی نمونه ترنج",
    kind: "رستوران",
    neighborhood: "استادسرا",
    vignette: "دستورهای خانگی، سبزی محلی و چاشنی‌های گیلانی",
    price: "متوسط",
    tags: ["خانگی", "گیلانی", "اصیل"],
    signals: { cozy: 2, quiet: 1, value: 2, local: 3, social: 1, service: 1 },
  },
  {
    id: "istgah",
    name: "کافه نمونه ایستگاه",
    kind: "کافه",
    neighborhood: "لاکانی",
    vignette: "سفارش سریع، میز اشتراکی و قیمت‌های دانشجویی",
    price: "اقتصادی",
    tags: ["دانشجویی", "سریع", "کار"],
    signals: { cozy: 0, quiet: 2, value: 3, local: 0, social: 2, service: 2 },
  },
];
export const NABZ_SCENARIOS: readonly NabzScenario[] = [
  {
    id: "date",
    title: "قرار دونفره",
    shortTitle: "یه قرار خوب",
    icon: "♥",
    description: "جایی که حرف‌زدن و ماندن، از عکس گرفتن مهم‌تر باشد.",
    duels: [
      { id: "date-1", prompt: "برای شروع شب کدام حس را انتخاب می‌کنی؟", options: ["baran", "roshan"] },
      { id: "date-2", prompt: "اگر باران بگیرد، کدام فضا می‌چسبد؟", options: ["toranj", "baran"] },
      { id: "date-3", prompt: "آرام و جمع‌وجور یا زنده و شهری؟", options: ["kaghaz", "moj"] },
      { id: "date-4", prompt: "غذای محلی یا قهوه و گفت‌وگو؟", options: ["gil-khorak", "baran"] },
      { id: "date-5", prompt: "برای پایان شب، انتخاب نهایی تو کدام است؟", options: ["roshan", "toranj"] },
    ],
  },
  {
    id: "laptop",
    title: "کار با لپ‌تاپ",
    shortTitle: "دو ساعت تمرکز",
    icon: "⌁",
    description: "میز مناسب، آرامش و سفارشی که مجبور نباشی زود تمامش کنی.",
    duels: [
      { id: "laptop-1", prompt: "برای دو ساعت تمرکز کدام را برمی‌داری؟", options: ["kaghaz", "istgah"] },
      { id: "laptop-2", prompt: "آرامش بیشتر یا دسترسی مرکزی؟", options: ["baran", "roshan"] },
      { id: "laptop-3", prompt: "میز شخصی یا انرژی یک میز اشتراکی؟", options: ["kaghaz", "istgah"] },
      { id: "laptop-4", prompt: "بودجه مهم‌تر است یا سرویس کامل‌تر؟", options: ["istgah", "moj"] },
      { id: "laptop-5", prompt: "قرار است دوباره برگردی؛ کدام؟", options: ["baran", "kaghaz"] },
    ],
  },
  {
    id: "budget",
    title: "اقتصادی",
    shortTitle: "خوش‌قیمت و خوب",
    icon: "٪",
    description: "انتخابی که آخر ماه هم بشود با خیال راحت تکرارش کرد.",
    duels: [
      { id: "budget-1", prompt: "ناهار جمع‌وجور یا قهوه و کار؟", options: ["narenj", "istgah"] },
      { id: "budget-2", prompt: "طعم محلی یا فضای آرام؟", options: ["gil-khorak", "kaghaz"] },
      { id: "budget-3", prompt: "مرکزی و سریع یا دنج و دور از شلوغی؟", options: ["narenj", "baran"] },
      { id: "budget-4", prompt: "برای یک جمع کوچک کدام به‌صرفه‌تر حس می‌شود؟", options: ["istgah", "gil-khorak"] },
      { id: "budget-5", prompt: "انتخابی که هفته بعد هم تکرار می‌کنی؟", options: ["kaghaz", "narenj"] },
    ],
  },
  {
    id: "local-food",
    title: "غذای محلی",
    shortTitle: "یه مزه گیلانی",
    icon: "✦",
    description: "برای وقتی که غذا باید واقعاً بوی گیلان بدهد.",
    duels: [
      { id: "local-1", prompt: "خانگی و آرام یا خانوادگی و پررفت‌وآمد؟", options: ["toranj", "gil-khorak"] },
      { id: "local-2", prompt: "اصالت غذا یا قیمت تکرارپذیر؟", options: ["toranj", "narenj"] },
      { id: "local-3", prompt: "شام دونفره یا یک دورهمی محلی؟", options: ["baran", "gil-khorak"] },
      { id: "local-4", prompt: "منوی کوتاه روز یا انتخاب‌های متنوع؟", options: ["gil-khorak", "moj"] },
      { id: "local-5", prompt: "آخرین انتخاب؛ کدام مزه در خاطرت می‌ماند؟", options: ["narenj", "toranj"] },
    ],
  },
];
