import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ShieldCheckIcon } from "@/components/icons";
import { GLASS } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "حریم خصوصی – نظراتو",
  description:
    "سیاست حفظ حریم خصوصی پلتفرم نظراتو. ما چگونه داده‌های کاربران را جمع‌آوری، استفاده و حفاظت می‌کنیم.",
};

const sections = [
  { id: "collection", title: "۱. جمع‌آوری اطلاعات کاربران" },
  { id: "usage", title: "۲. نحوه استفاده از اطلاعات" },
  { id: "security", title: "۳. امنیت و حفاظت از داده‌ها" },
  { id: "sharing", title: "۴. عدم افشا و اشتراک‌گذاری با ثالث" },
  { id: "user-rights", title: "۵. حقوق کاربران بر روی داده‌ها" },
  { id: "cookies", title: "۶. کوکی‌ها و لاگ‌های فنی" },
  { id: "updates", title: "۷. تغییرات در بیانیه حریم خصوصی" },
];

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <Container>
        <div className="pt-4">
          <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "حریم خصوصی" }]} />
        </div>

        <main className="pb-24">
          {/* ── Hero Section ── */}
          <section className="relative pt-10 pb-12 text-center lg:pt-16">
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-mint/25 bg-mint/[0.07] px-4 py-1.5 backdrop-blur-md">
              <ShieldCheckIcon className="w-5 h-5 text-mint" />
              <span className="text-[13px] font-bold text-mint">امنیت داده‌ها</span>
            </div>
            <h1 className="text-[2.25rem] font-black leading-[1.2] tracking-tight text-white sm:text-[3rem]">
              سیاست حفظ حریم خصوصی
            </h1>
            <p className="mx-auto mt-4 max-w-[50ch] text-[15px] leading-[1.95] text-muted sm:text-[17px]">
              ما در نظراتو متعهد به حفاظت از امنیت اطلاعات شخصی شما هستیم. جزئیات رفتار ما با داده‌هایتان را در زیر بخوانید. آخرین به‌روزرسانی: خرداد ۱۴۰۵
            </p>
          </section>

          {/* ── Page Layout: Sidebar + Content ── */}
          <div className="grid gap-8 lg:grid-cols-[280px_1fr] items-start">
            
            {/* Sidebar Navigation */}
            <aside className={`hidden lg:block sticky top-24 p-6 ${GLASS}`}>
              <h4 className="mb-4 text-[15px] font-black text-white border-b border-glass-border pb-3">
                فهرست مطالب
              </h4>
              <nav className="flex flex-col gap-1.5">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="text-[13px] font-medium text-muted hover:text-mint transition-colors duration-200 py-1"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
            </aside>

            {/* Main Content Card */}
            <article className={`p-6 sm:p-10 ${GLASS} space-y-10 text-[15px] leading-[2.1] text-muted-more font-medium`}>
              
              {/* Section 1 */}
              <section id="collection" className="scroll-mt-24 space-y-4">
                <h2 className="text-[20px] font-black text-white flex items-center gap-2 border-b border-glass-border pb-2">
                  <span className="text-mint">#</span> ۱. جمع‌آوری اطلاعات کاربران
                </h2>
                <p>
                  نظراتو برای ارائه خدمات خود و جلوگیری از سوءاستفاده، اطلاعات محدودی را از کاربران دریافت می‌کند:
                </p>
                <ul className="list-disc list-inside me-4 space-y-2 text-muted">
                  <li><strong>شماره تلفن همراه:</strong> به عنوان شناسه اصلی حساب کاربری جهت احراز هویت با پیامک (OTP).</li>
                  <li><strong>اطلاعات حساب کاربری:</strong> نام نمایشی انتخاب‌شده توسط کاربر (که می‌تواند مستعار باشد) و تصویر آواتار در صورت تنظیم.</li>
                  <li><strong>محتوای تولیدشده توسط کاربر:</strong> نظرات ثبت‌شده، امتیازها، زمان ثبت نظر و پاسخ‌ها.</li>
                  <li><strong>اسناد اثبات خرید:</strong> تصاویر فاکتور، رسید یا تصاویری که کاربر برای دریافت نشان نقد تأییدشده به صورت اختیاری بارگذاری می‌کند.</li>
                </ul>
              </section>

              {/* Section 2 */}
              <section id="usage" className="scroll-mt-24 space-y-4">
                <h2 className="text-[20px] font-black text-white flex items-center gap-2 border-b border-glass-border pb-2">
                  <span className="text-mint">#</span> ۲. نحوه استفاده از اطلاعات
                </h2>
                <p>
                  داده‌های جمع‌آوری‌شده در پلتفرم صرفاً در راستای اهداف زیر مورد استفاده قرار می‌گیرند:
                </p>
                <ul className="list-disc list-inside me-4 space-y-2 text-muted">
                  <li>نمایش عمومی نظرات و امتیازها به دیگر کاربران جهت شفاف‌سازی و کمک به تصمیم‌گیری خرید.</li>
                  <li>احراز هویت و تأمین امنیت حساب‌های کاربری و جلوگیری از ثبت نظرات اسپم یا فیک توسط ربات‌ها.</li>
                  <li>ارزیابی و بررسی مدارک خرید توسط کارشناسان نظراتو جهت اعمال نشان «نقد تأییدشده».</li>
                  <li>ارتباط با شما در خصوص پشتیبانی، پیگیری گزارش‌ها یا ارسال هشدارهای امنیتی حساب کاربری.</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section id="security" className="scroll-mt-24 space-y-4">
                <h2 className="text-[20px] font-black text-white flex items-center gap-2 border-b border-glass-border pb-2">
                  <span className="text-mint">#</span> ۳. امنیت و حفاظت از داده‌ها
                </h2>
                <p>
                  امنیت اطلاعات کاربران اولویت اول ماست. ما از پروتکل‌ها و ابزارهای استانداردی برای حفاظت از داده‌های شما استفاده می‌کنیم:
                </p>
                <p>
                  دسترسی به اطلاعات حساس (مانند فاکتورهای اثبات خرید و شماره تلفن همراه کاربران) تنها در اختیار تعداد محدودی از ناظران مجاز و آموزش‌دیده نظراتو قرار دارد. انتقال داده‌ها بین مرورگر شما و سرورهای ما تماماً با پروتکل رمزگذاری‌شده HTTPS انجام می‌شود. جلسات کاربری نیز با استفاده از کوکی‌های دارای امضای رمزنگاری‌شده (HMAC) محافظت می‌شوند.
                </p>
              </section>

              {/* Section 4 */}
              <section id="sharing" className="scroll-mt-24 space-y-4">
                <h2 className="text-[20px] font-black text-white flex items-center gap-2 border-b border-glass-border pb-2">
                  <span className="text-mint">#</span> ۴. عدم افشا و اشتراک‌گذاری با ثالث
                </h2>
                <p>
                  سیاست قطعی نظراتو حفاظت از حریم شخصی کاربران است:
                </p>
                <ul className="list-disc list-inside me-4 space-y-2 text-muted">
                  <li>شماره تلفن همراه شما به هیچ عنوان به صورت عمومی یا در اختیار کسب‌وکارهایی که برایشان نظر ثبت کرده‌اید قرار نخواهد گرفت.</li>
                  <li>اسناد اثبات خرید بارگذاری‌شده (مانند فاکتورها) کاملاً محرمانه هستند و تحت هیچ شرایطی برای عموم نمایش داده نشده یا به کسب‌وکارها ارسال نمی‌شوند.</li>
                  <li>ما اطلاعات شخصی شما را به سازمان‌ها یا شرکت‌های بازاریابی شخص ثالث نمی‌فروشیم و به اشتراک نمی‌گذاریم، مگر اینکه بر اساس احکام قضایی صالحه ملزم به ارائه اطلاعات به مراجع قانونی باشیم.</li>
                </ul>
              </section>

              {/* Section 5 */}
              <section id="user-rights" className="scroll-mt-24 space-y-4">
                <h2 className="text-[20px] font-black text-white flex items-center gap-2 border-b border-glass-border pb-2">
                  <span className="text-mint">#</span> ۵. حقوق کاربران بر روی داده‌ها
                </h2>
                <p>
                  شما کنترل کاملی روی اطلاعات خود دارید:
                </p>
                <ul className="list-disc list-inside me-4 space-y-2 text-muted">
                  <li>شما می‌توانید در هر زمان نظرات گذشته خود را از طریق پنل کاربری مشاهده، ویرایش یا حذف کنید.</li>
                  <li>امکان ویرایش مشخصات ظاهری حساب کاربری مانند نام نمایشی برای شما فراهم است.</li>
                  <li>در صورت تمایل به حذف کامل حساب کاربری و سوابق خود، می‌توانید درخواست خود را به تیم پشتیبانی نظراتو ارسال کنید تا اقدامات لازم در کوتاه‌ترین زمان انجام شود.</li>
                </ul>
              </section>

              {/* Section 6 */}
              <section id="cookies" className="scroll-mt-24 space-y-4">
                <h2 className="text-[20px] font-black text-white flex items-center gap-2 border-b border-glass-border pb-2">
                  <span className="text-mint">#</span> ۶. کوکی‌ها و لاگ‌های فنی
                </h2>
                <p>
                  نظراتو از کوکی‌های ضروری فنی برای حفظ وضعیت ورود شما به حساب کاربری استفاده می‌کند. این کوکی‌ها فاقد اطلاعات شخصی هویتی بوده و امنیت حساب شما را تضمین می‌کنند.
                </p>
                <p>
                  همچنین لاگ‌های فنی سرور (مانند آدرس IP و مشخصات کلی مرورگر) صرفاً برای تحلیل الگوهای ترافیکی، بهبود عملکرد سرورها و ردیابی تلاش‌های ناموفق جهت نفوذ یا اسپم ذخیره می‌شوند.
                </p>
              </section>

              {/* Section 7 */}
              <section id="updates" className="scroll-mt-24 space-y-4">
                <h2 className="text-[20px] font-black text-white flex items-center gap-2 border-b border-glass-border pb-2">
                  <span className="text-mint">#</span> ۷. تغییرات در بیانیه حریم خصوصی
                </h2>
                <p>
                  ممکن است این بیانیه به دلیل به‌روزرسانی سرویس‌ها یا تغییر در قوانین کشور ویرایش شود. هرگونه تغییر در این سیاست در همین صفحه منتشر خواهد شد و ادامه استفاده شما از نظراتو به منزله تایید بیانیه جدید خواهد بود.
                </p>
              </section>

            </article>
          </div>
        </main>
      </Container>
      <Footer />
    </>
  );
}
