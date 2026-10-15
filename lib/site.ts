// This public flag is fixed at build time, so staging needs its own build.
export const IS_STAGING = process.env.NEXT_PUBLIC_NAZARATO_ENV === "staging";
export const SITE_URL = IS_STAGING
  ? "https://staging.nazarato.ir"
  : "https://nazarato.ir";
export const HOME_TITLE = "نظراتو | تجربه‌های محلی، انتخاب‌های بهتر در رشت";
export const HOME_DESCRIPTION =
  "کافه و رستوران‌های رشت را پیدا کن؛ نظراتو را برای انتخاب با اطلاعات روشن، تجربهٔ دست اول و بهتر شدن کسب‌وکارها می‌سازیم.";
