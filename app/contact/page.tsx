import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { ContactForm } from "@/components/contact/ContactForm";
import { GLASS } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "ارتباط با نظراتو",
  description: "معرفی کافه یا رستوران در رشت، اصلاح اطلاعات، بازخورد محصول و گفت‌وگو دربارهٔ پایلوت نظراتو.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <Container>
        <Breadcrumb items={[{ label: "خانه", href: "/" }, { label: "ارتباط با نظراتو" }]} />
        <main className="pb-20 pt-6 sm:pt-10 lg:pb-28">
          <section className="max-w-2xl pb-8 sm:pb-10">
            <p className="mb-4 text-sm font-semibold text-mint">نظراتو را با هم بهتر می‌کنیم</p>
            <h1 className="text-[2.1rem] font-extrabold leading-[1.45] text-strong sm:text-5xl">از تجربه‌ات بگو.</h1>
            <p className="mt-5 text-base leading-8 text-muted">کافه‌ای را معرفی می‌کنی، اطلاعاتی نیاز به اصلاح دارد یا پیشنهادی برای محصول داری؟ پیامت را از همین فرم بفرست.</p>
          </section>
          <div className="grid items-start gap-7 lg:grid-cols-[1.25fr_0.75fr] lg:gap-12">
            <section id="contact-form" className={`${GLASS} scroll-mt-24 p-5 sm:p-8`} aria-labelledby="contact-form-title">
              <h2 id="contact-form-title" className="text-xl font-bold text-strong">پیام شما</h2>
              <p className="mb-7 mt-2 text-sm leading-7 text-muted">نام، ایمیل و متن پیام لازم‌اند؛ موضوع اختیاری است.</p>
              <ContactForm />
            </section>
            <aside aria-labelledby="contact-guide">
              <h2 id="contact-guide" className="mb-5 text-lg font-bold text-strong">چه چیزی کمک می‌کند؟</h2>
              <div className="divide-y divide-glass-border border-y border-glass-border">
                {[
                  { title: "معرفی کافه یا رستوران", text: "نام، محله یا نشانی و راه تماس عمومی را بنویس. معرفی یک مکان به معنی تأیید مالکیت آن نیست." },
                  { title: "اصلاح اطلاعات یک صفحه", text: "لینک صفحه، اطلاعات نادرست و منبع پیشنهادی برای اصلاح را بفرست." },
                  { title: "بازخورد یا همکاری در پایلوت", text: "بگو چه مسیری را امتحان کرده‌ای یا دوست داری کدام مسئلهٔ کسب‌وکارت را بررسی کنیم." },
                ].map(item => (
                  <div key={item.title} className="py-5">
                    <h3 className="text-base font-semibold text-strong">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted">{item.text}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 rounded-xl border border-glass-border bg-glass p-4 text-sm leading-7 text-muted">برای این پیام، رمز، مدرک هویتی یا اطلاعات خصوصی مشتریان را نفرست. اگر بررسی به اطلاعات بیشتری نیاز داشته باشد، مسیر مناسب آن جدا مشخص می‌شود.</p>
            </aside>
          </div>
        </main>
      </Container>
      <Footer />
    </>
  );
}
