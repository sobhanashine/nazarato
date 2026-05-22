import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ScaleIcon } from "@/components/icons";
import { GLASS } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "قوانین و مقررات – نظراتو",
  description:
    "قوانین و مقررات استفاده از پلتفرم نظراتو. ضوابط عضویت، قوانین ثبت نظر، مدارک خرید و تعهدات متقابل کاربران و کسب‌وکارها.",
};

const sections = [
  { id: "intro", title: "۱. مقدمه و پذیرش قوانین" },
  { id: "account", title: "۲. شرایط عضویت و حساب کاربری" },
  { id: "reviews", title: "۳. ضوابط و قوانین ثبت نظر" },
  { id: "proof", title: "۴. اسناد اثبات خرید (نقد تأییدشده)" },
  { id: "reply", title: "۵. حق پاسخ‌گویی کسب‌وکارها" },
  { id: "copyright", title: "۶. مالکیت فکری و معنوی" },
  { id: "liability", title: "۷. سلب مسئولیت و قوانین حاکم" },
];

export default function TermsPage() {
  return (
    <>
      <Header />
      <Container>
        <div className="pt-4">
          <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "قوانین و مقررات" }]} />
        </div>

        <main className="pb-24">
          {/* ── Hero Section ── */}
          <section className="relative pt-10 pb-12 text-center lg:pt-16">
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-mint/25 bg-mint/[0.07] px-4 py-1.5 backdrop-blur-md">
              <ScaleIcon className="w-5 h-5 text-mint" />
              <span className="text-[13px] font-bold text-mint">قوانین و تعهدات</span>
            </div>
            <h1 className="text-[2.25rem] font-black leading-[1.2] tracking-tight text-white sm:text-[3rem]">
              قوانین و مقررات استفاده
            </h1>
            <p className="mx-auto mt-4 max-w-[50ch] text-[15px] leading-[1.95] text-muted sm:text-[17px]">
              لطفاً پیش از ثبت‌نام و استفاده از نظراتو، قوانین و ضوابط زیر را به دقت مطالعه فرمایید. آخرین به‌روزرسانی: خرداد ۱۴۰۵
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
              <section id="intro" className="scroll-mt-24 space-y-4">
                <h2 className="text-[20px] font-black text-white flex items-center gap-2 border-b border-glass-border pb-2">
                  <span className="text-mint">#</span> ۱. مقدمه و پذیرش قوانین
                </h2>
                <p>
                  به پلتفرم مستقل نقد و بررسی <strong>نظراتو (nazarato.ir)</strong> خوش آمدید. نظراتو بستری مستقل برای اشتراک‌گذاری تجربه‌های واقعی خرید و استفاده از خدمات کسب‌وکارهای ایرانی و فروشگاه‌های اینستاگرامی است.
                </p>
                <p>
                  ورود به وب‌سایت، ثبت‌نام، و استفاده از خدمات نظراتو به معنی پذیرش آگاهانه و بدون قید و شرط تمامی بندهای این توافق‌نامه است. در صورتی که با هریک از این قوانین موافق نیستید، حق استفاده از خدمات پلتفرم را ندارید.
                </p>
              </section>

              {/* Section 2 */}
              <section id="account" className="scroll-mt-24 space-y-4">
                <h2 className="text-[20px] font-black text-white flex items-center gap-2 border-b border-glass-border pb-2">
                  <span className="text-mint">#</span> ۲. شرایط عضویت و حساب کاربری
                </h2>
                <p>
                  جهت ثبت نظر یا استفاده از بخش‌های خاص پلتفرم، کاربر ملزم به ایجاد حساب کاربری است:
                </p>
                <ul className="list-disc list-inside me-4 space-y-2 text-muted">
                  <li>ثبت‌نام در پلتفرم از طریق شماره تلفن همراه فعال و ارسال رمز یک‌بارمصرف (OTP) صورت می‌گیرد.</li>
                  <li>هر شماره تلفن همراه شناسه منحصر‌به‌فرد یک کاربر در سیستم است و مسئولیت قانونی تمامی فعالیت‌های انجام‌شده با حساب کاربری بر عهده مالک شماره همراه خواهد بود.</li>
                  <li>کاربر متعهد می‌شود اطلاعات حساب کاربری خود، از جمله نام نمایشی را مطابق با قوانین عمومی و بدون استفاده از اسامی غیرمجاز، هتاکانه یا برندهای ثبت‌شده دیگران انتخاب کند.</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section id="reviews" className="scroll-mt-24 space-y-4">
                <h2 className="text-[20px] font-black text-white flex items-center gap-2 border-b border-glass-border pb-2">
                  <span className="text-mint">#</span> ۳. ضوابط و قوانین ثبت نظر
                </h2>
                <p>
                  نظراتو پلتفرمی برای بازتاب حقیقت است. برای حفظ اعتبار جامعه کاربری، رعایت اصول زیر در ثبت هرگونه نظر، امتیازدهی یا نقد الزامی است:
                </p>
                <ul className="list-disc list-inside me-4 space-y-2 text-muted">
                  <li><strong>تجربه شخصی و واقعی:</strong> نظر ثبت‌شده باید صرفاً بازتاب‌دهنده تجربه شخصی و مستقیم خود کاربر در معامله با کسب‌وکار مربوطه باشد. نگارش نظر بر اساس شنیده‌ها، شایعات یا تبلیغات ممنوع است.</li>
                  <li><strong>لحن محترمانه و بی‌طرفی:</strong> استفاده از واژه‌های توهین‌آمیز، فحاشی، تهمت، افترا، القاب نامناسب و توهین به قومیت‌ها، مذاهب یا جنسیت‌ها منجر به حذف فوری نظر خواهد شد.</li>
                  <li><strong>عدم ثبت تبلیغات یا اسپم:</strong> درج لینک به سایت‌های دیگر، شماره تلفن شخصی، کدهای تخفیف، تبلیغ مستقیم برای رقبا یا هرگونه محتوای اسپم در بخش نظرات ممنوع است.</li>
                  <li><strong>مسئولیت حقوقی:</strong> بر اساس قانون جرایم رایانه‌ای ایران، مسئولیت کیفری و حقوقی محتوای منتشرشده در قالب نظر به طور کامل بر عهده کاربر نویسنده است و نظراتو هیچ‌گونه مسئولیتی در قبال ادعاهای مطرح‌شده ندارد.</li>
                </ul>
              </section>

              {/* Section 4 */}
              <section id="proof" className="scroll-mt-24 space-y-4">
                <h2 className="text-[20px] font-black text-white flex items-center gap-2 border-b border-glass-border pb-2">
                  <span className="text-mint">#</span> ۴. اسناد اثبات خرید (نقد تأییدشده)
                </h2>
                <p>
                  کاربران می‌توانند برای افزایش اعتبار نقد خود، مدارکی نظیر تصویر فاکتور، رسید تراکنش بانکی، اسکرین‌شات چت نهایی خرید یا برگه گارانتی را بارگذاری کنند:
                </p>
                <ul className="list-disc list-inside me-4 space-y-2 text-muted">
                  <li>اسناد بارگذاری‌شده به عنوان مدرک اثبات خرید توسط تیم تعدیل نظراتو بررسی می‌شوند و در صورت انطباق، نشان <strong>«نقد تأییدشده»</strong> به نظر تعلق می‌گیرد.</li>
                  <li>بارگذاری هرگونه مدرک جعلی، دستکاری‌شده یا متعلق به دیگران تخلف سنگین محسوب شده و منجر به مسدودسازی دائمی حساب کاربری خواهد شد.</li>
                  <li>تمام اسناد و فاکتورهای آپلودشده کاملاً محرمانه بوده و هرگز به صورت عمومی یا در اختیار کسب‌وکارها قرار داده نخواهند شد.</li>
                </ul>
              </section>

              {/* Section 5 */}
              <section id="reply" className="scroll-mt-24 space-y-4">
                <h2 className="text-[20px] font-black text-white flex items-center gap-2 border-b border-glass-border pb-2">
                  <span className="text-mint">#</span> ۵. حق پاسخ‌گویی کسب‌وکارها
                </h2>
                <p>
                  نظراتو فضایی برای گفت‌وگوی دوطرفه و حل چالش‌هاست:
                </p>
                <ul className="list-disc list-inside me-4 space-y-2 text-muted">
                  <li>صاحبان کسب‌وکارها پس از احراز هویت رسمی و ادعای مالکیت صفحه خود در نظراتو، حق پاسخ‌گویی به نظرات کاربران را دارند.</li>
                  <li>پاسخ کسب‌وکارها باید محترمانه، سازنده و در راستای حل مشکل باشد. کسب‌وکارها مجاز به استفاده از لحن تهدیدآمیز یا افشای اطلاعات خصوصی کاربر (مانند آدرس یا تلفن مشتری) در پاسخ‌ها نیستند.</li>
                  <li>نظراتو به هیچ عنوان امکان حذف یا ویرایش نظرات منفی کاربران را در ازای دریافت وجه به کسب‌وکارها نخواهد داد.</li>
                </ul>
              </section>

              {/* Section 6 */}
              <section id="copyright" className="scroll-mt-24 space-y-4">
                <h2 className="text-[20px] font-black text-white flex items-center gap-2 border-b border-glass-border pb-2">
                  <span className="text-mint">#</span> ۶. مالکیت فکری و معنوی
                </h2>
                <p>
                  حقوق مالکیت فکری شامل علائم تجاری، کدهای برنامه‌نویسی، طراحی رابط کاربری (UI)، هویت بصری و پایگاه داده نظراتو منحصراً متعلق به این پلتفرم است.
                </p>
                <p>
                  هرگونه کپی‌برداری، داده‌کاوی (Scraping) یا استفاده تجاری از اطلاعات و محتوای سایت بدون کسب مجوز مکتوب از مدیریت نظراتو ممنوع بوده و پیگرد قانونی دارد.
                </p>
              </section>

              {/* Section 7 */}
              <section id="liability" className="scroll-mt-24 space-y-4">
                <h2 className="text-[20px] font-black text-white flex items-center gap-2 border-b border-glass-border pb-2">
                  <span className="text-mint">#</span> ۷. سلب مسئولیت و قوانین حاکم
                </h2>
                <p>
                  نظراتو پلتفرم واسط است و محتوای نظرات منعکس‌کننده دیدگاه شخصی کاربران است. ما صحت ادعاهای کاربران یا کیفیت خدمات کسب‌وکارهای معرفی‌شده را تضمین نمی‌کنیم.
                </p>
                <p>
                  این توافق‌نامه تحت قوانین جمهوری اسلامی ایران (به‌ویژه قانون تجارت الکترونیکی و قانون جرایم رایانه‌ای) تفسیر می‌شود. هرگونه اختلاف ناشی از خدمات نظراتو در مراجع صالح قضایی تهران رسیدگی خواهد شد.
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
