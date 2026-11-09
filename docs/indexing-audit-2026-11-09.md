# بررسی ایندکس نظرآتو — ۹ نوامبر ۲۰۲۶

این سند، بررسی اولیهٔ پیش از مجوز انتشار را ثبت می‌کند: اصلاح خطای سرور به‌صورت محلی آماده و در runtime واقعی Cloudflare آزمایش شد و **در آن مرحله هیچ commit، push، انتشار production یا تغییر در Search Console انجام نشده بود.** فهرست کامل Examples و وضعیت Validation گزارش 5xx به اسکرین‌شات/خروجی صاحب پروژه نیاز داشت؛ کارت بررسی تا دریافت این شاهد در `Needs You` ماند.

صاحب پروژه پس از این بررسی، انتشار اصلاح را با «لایوش کن» مجاز کرد و بررسی ایمیل تازه را هم خواست. پیگیری انتشار محدود نظرآتو، commit/PR، نسخهٔ فعال Worker و نتایج HTTP زنده در [کارت انتشار](https://trello.com/c/ejnJS4mg) ثبت می‌شود؛ وضعیت قبل از انتشار در بخش‌های زیر، شاهد تاریخی است.

- کارت: https://trello.com/c/KlClL65X
- شاخه: `codex/seo-indexing-20261109`
- worktree: `/Users/sobhan/.codex/worktrees/golsar-dev-review-flow/nazarato`
- مبنای کد: `main` و `origin/main` برابر `86b70d41d2fb93c690a3d8d9d42aa9cd692b5b45`، مطابق remote در این بررسی.
- Worker اصلی: `nazarato`؛ نسخهٔ فعال پیش از بررسی `058428d8-913e-44ec-863f-7312ddd9c69f` با ۱۰۰٪ ترافیک. اصلاح این گزارش هنوز روی آن نیست.
- تغییرات ازقبل‌موجود checkout دسکتاپ وارد این شاخه نشدند.

## شواهد Search Console

مالکیت `sc-domain:nazarato.ir` از API با سطح `siteOwner` تأیید شد. ایمیل Google Search Console در `2026-11-09T08:58:36Z` نیز هشدار جدید `Server error (5xx)` را تأیید می‌کند؛ ایمیل، URLهای خطادار را ندارد.

همهٔ زمان‌های جدول UTC هستند و از URL Inspection گرفته شده‌اند؛ تاریخ هشدار با تاریخ خزش یکی نیست.

| مسیر | نتیجهٔ ذخیره‌شده در Google | آخرین خزش |
| --- | --- | --- |
| `/` | Submitted and indexed؛ PASS؛ دریافت موفق | `2026-11-03 11:04:51` |
| `/categories/food` | Server error (5xx)؛ SERVER_ERROR | `2026-11-03 08:29:02` |
| `/categories` | Excluded by noindex؛ دریافت موفق | `2026-10-01 09:51:47` |
| `/categories/clothing` | Excluded by noindex؛ دریافت موفق | `2026-10-01 18:47:11` |
| `/about` | Excluded by noindex؛ دریافت موفق | `2026-10-01 04:18:06` |
| `/categories/digital` | URL is unknown to Google | زمان خزش ندارد |
| `/categories/health` | URL is unknown to Google | زمان خزش ندارد |
| `/categories/sports` | URL is unknown to Google | زمان خزش ندارد |

این جدول فهرست کامل خطاهای گزارش Page indexing نیست. API رسمی Search Console سرویس‌های Sites، Sitemaps، Search Analytics و URL Inspection را ارائه می‌کند، اما endpoint گزارش Examples/Validation ندارد. دسترسی UI به‌علت قفل macOS در دسترس نبود. از صاحب پروژه اسکرین‌شات یا export مسیر `Page indexing → Server error (5xx)` شامل URL، Last crawled و وضعیت/تاریخ Validation درخواست شد. Validation در این بررسی **نامشخص** است؛ Started، Passed یا Not started فرض نشده است.

گزارش sitemap: `https://nazarato.ir/sitemap.xml`، یک URL ارسالی، صفر error و warning، `isPending=false`، آخرین دانلود `2026-11-05T07:10:18.725Z`. شمارندهٔ `contents.indexed=0` این API با URL Inspection فعلی خانه همخوان نیست؛ برای وضعیت واقعی خانه، نتیجهٔ صریح `Submitted and indexed` ملاک گزارش است.

## علت قطعی 500

GET مستقیم تمام ۱۶ صفحهٔ دسته‌بندی موجود در `/categories` بررسی شد. چهار مسیر زیر روی production به‌صورت تکرارپذیر 500 دادند:

| مسیر | HTTP زنده پیش از اصلاح | HTTP Worker محلی پس از اصلاح |
| --- | --- | --- |
| `/categories/food` | 500 | 200 |
| `/categories/digital` | 500 | 200 |
| `/categories/health` | 500 | 200 |
| `/categories/sports` | 500 | 200 |

URL فیلترشدهٔ `food?sort=newest&sub=کافه&page=2` نیز پیش از اصلاح 500 و پس از اصلاح 200 شد. دوازده دستهٔ دیگر، خانه، فهرست دسته‌ها، about و blog در بررسی زنده 200 داشتند.

لاگ لحظه‌ای سرور production از `wrangler tail nazarato --format json` با درخواست‌های GET همین بررسی تطبیق داده شد. خطای هر چهار دسته از یک منشأ است:

```text
Attempted to call categoryHref() from the server but categoryHref is on the client.
```

`app/categories/[slug]/page.tsx` یک Server Component است. این فایل `categoryHref` را از `components/categories/CategoryDetailClient.tsx` که با `"use client"` شروع می‌شود import کرده و هنگام ساخت لینک‌های زیردسته/صفحه‌بندی اجرا می‌کند. React این export را در سمت سرور یک مرجع کلاینت می‌بیند و اجرای مستقیم آن خطا می‌دهد.

فقط چهار کلید `food/digital/health/sports` در `categorySubcategories` بیش از یک زیردسته دارند؛ بنابراین حتی با کاتالوگ خالی، مسیر ساخت لینک فعال می‌شود و همین چهار صفحه خراب می‌شوند. این تطبیق، تفاوت با `clothing` سالم را توضیح می‌دهد. اگر بعداً نتایج صفحه‌بندی‌شده فراهم شود، همان import اشتباه لینک‌های pagination را هم خراب می‌کند.

این یک exception رندر برنامه در Worker است؛ لاگ به خطای شبکهٔ Cloudflare یا عدم اتصال به origin اشاره نمی‌کند. در رویداد tail، `response.status=500` و `console.error` وجود دارد، ولی `outcome=ok` و `exceptions=[]` است؛ فیلترکردن صرفاً بر اساس uncaught exceptions این خطا را پنهان می‌کند. لاگ تاریخی خود درخواست Google بازیابی نشده؛ علت با خطای زندهٔ همسان و خزش ناموفق food تطبیق داده شده است.

اتصال Cloudflare در Composio خطای 400 مربوط به قالب `X-Auth-Key` داشت. دسترسی OAuth موجود Wrangler بدون تغییر حساب/مجوز، هم نسخهٔ production و هم لاگ زنده را خواند. تنظیمات خوانده‌شده `logpush=false`، بدون tail consumer دائمی و بدون observability صریح بود؛ در این تسک تنظیمات لاگ‌گیری یا هزینهٔ سرویس تغییر نکرد.

## تصمیم ایندکس، پیش از اصلاح

سیاست فعلی، عمدی و متناسب با محتوای موجود است:

| صفحات | تصمیم فعلی | دلیل / شرط بازشدن ایندکس |
| --- | --- | --- |
| `/` | index؛ در sitemap | معرفی واقعی نسخهٔ در حال توسعه؛ canonical دامنهٔ اصلی؛ Google نیز ایندکس آن را تأیید کرده |
| `/categories` | حفظ noindex | کاتالوگ عمومیِ آماده برای عرضهٔ این دسته‌ها مشاهده نشد؛ صفحه عمدتاً ناوبری است |
| `/categories/clothing` و سایر دسته‌ها | حفظ noindex | صفحه‌های عمومی فعلی empty state دارند؛ حذف 500 آن‌ها را به صفحهٔ مناسب ایندکس تبدیل نمی‌کند |
| `/about` | حفظ noindex | آمار ثابت ۱۲٬۴۲۸ نظر، ۳٬۴۲۰ کسب‌وکار، ۹۸٪ رضایت و ادعاهای تأیید/بررسی خودکار بدون شاهد در کد وجود دارد؛ ابتدا محتوا باید با واقعیت محصول تطبیق داده شود |
| blog، نتایج جستجو، پروفایل‌های نمونه و دیگر صفحات ناتمام | حفظ noindex؛ خارج از sitemap | ارزیابی و آماده‌سازی محتوا/منبع هر URL پیش از بازکردن ایندکس لازم است |
| login، profile، admin، preview و e2e-test | noindex؛ خارج از sitemap | صفحات حساب، خصوصی یا آزمایشی؛ preview/e2e ناموجود در Worker محلی 404 دادند |

منشأ noindex سه صفحهٔ مورد پرسش، ارث‌بری `robots: { index: false, follow: true }` از `app/layout.tsx` و هدر `X-Robots-Tag: noindex, follow` برای مسیرهای غیرریشه در `next.config.ts` است. فقط تغییر metadata یک صفحه برای بازکردن ایندکس کافی نیست؛ سیاست هدر هم باید در یک تغییر بعدیِ مبتنی بر محتوای آماده، هماهنگ شود.

`app/sitemap.ts` از ابتدا صریحاً فقط خانه را فهرست می‌کند. `app/robots.ts` اجازهٔ خزش سندها را می‌دهد تا Google noindex را ببیند و `/api/` را مستثنا می‌کند. XML و robots.txt هر دو 200 و sitemap در Search Console بدون خطا هستند. در نتیجه در این اصلاح، **metadata، robots و sitemap تغییر داده نشدند**. برای about و دسته‌ها canonical خانه ساخته نشد؛ با این کار سیگنال نادرستِ یکسان‌بودن محتوا ایجاد نمی‌شود.

## تغییرات و تأیید

- `lib/category-url.ts`: انتقال همان تابع ساخت URL به یک ماژول خالص مشترک و قابل import توسط سرور و کلاینت؛ رفتار فیلتر/صفحه‌بندی تغییر نکرد.
- `app/categories/[slug]/page.tsx`: import تابع از ماژول مشترک؛ component مرتب‌سازی همچنان از فایل کلاینت import می‌شود.
- `components/categories/CategoryDetailClient.tsx`: مصرف همان تابع مشترک در `router.push`؛ حذف تعریف تکراری از مرز کلاینت.
- `lib/category-url.test.ts`: چهار تست برای حذف پیش‌فرض‌ها، حفظ فیلتر در pagination، reset صفحه با تغییر مرتب‌سازی و encoding متن فارسی/کاراکترهای query.
- `scripts/check-indexing.mjs`: تست واقعی HTTP/RSC بدون write، کشف لینک‌های دسته‌ها از HTML و بررسی 200، metadata، noindex، canonical خانه، robots و sitemap تک‌URL.
- `docs/PROJECT.md` و همین گزارش: ثبت علت، قرارداد و شواهد محلی.

| بررسی | نتیجه |
| --- | --- |
| تست HTTP قبل از اصلاح، روی نسخهٔ اصلیِ بدون تغییر | ۵ شکست از ۲۸ بررسی: چهار دسته و food فیلترشده؛ شاهد regression |
| `npm test` | ۱۳۱ تست پاس در ۲۳ فایل؛ ۴ تست جدید، صفر تست قبلی تغییر داده شد |
| `npx tsc --noEmit` | پاس |
| `npm run lint` | پاس |
| `npm run build:cloudflare` | Next و OpenNext build پاس؛ Worker در خروجی محلی ساخته شد |
| `node scripts/check-indexing.mjs http://127.0.0.1:3020` | هر ۲۸ بررسی پاس؛ تمام ۱۶ دسته 200؛ خانه index/canonical درست؛ سایر صفحات منتخب noindex؛ robots و XML سالم و فقط خانه در sitemap |
| `node scripts/check-public-profiles.mjs http://127.0.0.1:3020` | پروفایل ناموجود company/shop: branded not-found و noindex؛ بدون 5xx |
| بازبینی کد و `git diff --check` | تابع مشترک بدون تکرار، import سرور صحیح و patch بدون خطای whitespace |

HTTP پس از اصلاح در **Worker محلی production build** اجرا شد؛ تست روی `next dev` جایگزین runtime Cloudflare نشده است. مرورگر UI در این جلسه به‌علت قفل مک در دسترس نبود و browser binary آزمایش محلی هم نصب نبود؛ بررسی بصری ادعا نمی‌شود. تغییری در ظاهر صفحه ایجاد نشده است. سرور اعتبارسنجی و tail موقت در پایان بسته می‌شوند؛ سرویس‌های ازقبل‌موجود متوقف نمی‌شوند.

شواهد خام/لاگ‌ها در مسیر gitignored `data/private/seo-indexing-20261109/` همان worktree نگه داشته شدند. فایل تنظیمات محیطی، کلید، دادهٔ خصوصی یا خروجی build وارد patch نمی‌شود.

## ادامهٔ لازم در Search Console و انتشار

1. خروجی یا اسکرین‌شات گزارش `Server error (5xx)` را دریافت کنیم؛ تمام Examples، Last crawled و وضعیت/تاریخ Validation را با این گزارش تطبیق دهیم. فقط food از API به‌طور قطعی عضو خطای ثبت‌شده در Google است؛ سه دستهٔ دیگر، خطای زندهٔ هم‌علت دارند و در URL Inspection ناشناخته‌اند.
2. صاحب پروژه اصلاح محلی را بررسی کند. **انتشار production فقط پس از هماهنگی تازه انجام می‌شود**؛ تا آن زمان 500 زنده رفع‌شده محسوب نمی‌شود.
3. پس از انتشار هماهنگ‌شده، همین تست HTTP را روی `https://nazarato.ir` اجرا و نسخهٔ فعال Worker را جداگانه تأیید کنیم؛ تمام URLهای export را نیز بررسی کنیم.
4. برای URLهای اصلاح‌شده در Search Console، `Test live URL` را بررسی و سپس برای issue 5xx، `Validate fix` را شروع کنیم. این مرحله تا انتشار انجام نمی‌شود.
5. انتظار فعلی food پس از خزش موفق، خروج از گروه 5xx و باقی‌ماندن در `Excluded by noindex` است؛ هدف این اصلاح ایندکس‌کردن صفحهٔ خالی نیست. برای صفحات ناتمام `Request indexing` انجام نمی‌شود.
6. sitemap فعلی نیاز به ارسال دوباره ندارد. فقط بعد از آماده‌شدن محتوای واقعیِ یک صفحه، title/description و canonical مستقل، metadata و هدر index و sitemap را با هم اصلاح و آن صفحه را جداگانه برای ایندکس بررسی کنیم. پذیرفته‌شدن Validation یا درخواست ایندکس، تضمین نمایش در نتایج نیست.

## منابع رسمی

- [Search Console API reference](https://developers.google.com/webmaster-tools/v1/api_reference_index)
- [URL Inspection API: نسخهٔ ذخیره‌شده در Google](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect)
- [Page indexing و اعتبارسنجی اصلاح](https://support.google.com/webmasters/answer/7440203)
- [اثر HTTP 5xx بر crawlerهای Google](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes)
- [عیب‌یابی exceptionهای Worker](https://developers.cloudflare.com/workers/observability/errors/)
- راهنمای نصب‌شدهٔ Next 16.3.8: `node_modules/next/dist/docs/01-app/02-guides/server-and-client-boundary.md`؛ راهنماهای metadata/robots/sitemap نیز در همان بسته خوانده شدند.
