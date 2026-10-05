import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { BTN_PRIMARY } from "@/components/ui/styles";

const steps = [
  { title: "همان مکان را پیدا کن", text: "نام و محدوده را در جستجو انتخاب کن. نشانی را با جایی که رفته‌ای تطبیق بده تا تجربه به صفحهٔ درست وصل شود." },
  { title: "زمان و دلیل رفتنت را بگو", text: "برای کار رفتی، گفت‌وگو یا غذا؟ چه زمانی؟ همین زمینه باعث می‌شود نفر بعد بفهمد تجربه برای انتخاب او چقدر مرتبط است." },
  { title: "چیزی که دیدی را بنویس", text: "از برخورد، کیفیت سفارش یا زمان انتظار مثال مشخص بزن. اگر چیزی خوب نبود، توضیح بده چه اتفاقی افتاد و چه انتظاری داشتی." },
  { title: "متن را مرور کن", text: "تجربهٔ شخصی خودت را بنویس و اطلاعات خصوصی دیگران را اضافه نکن. ثبت یک تجربه، با انتشار عمومی آن یکسان نیست." },
];

export function HowToReview() {
  return <section aria-labelledby="how-to-review-title" className="py-8">
    <Container>
      <h2 id="how-to-review-title" className="text-2xl font-bold leading-9 text-strong">یک تجربهٔ مفید، جزئیات دارد.</h2>
      <ol className="mt-6 grid border-t border-glass-border md:grid-cols-2 md:gap-x-10">
        {steps.map((step, index) => <li key={step.title} className="border-b border-glass-border py-6">
          <span aria-hidden className="text-sm font-bold text-pomegr">{(index + 1).toLocaleString("fa-IR", { minimumIntegerDigits: 2 })}</span>
          <h3 className="mt-2 text-lg font-bold text-strong">{step.title}</h3>
          <p className="mt-2 max-w-[60ch] text-base leading-8 text-muted">{step.text}</p>
        </li>)}
      </ol>
      <p className="mt-6 max-w-[65ch] text-sm leading-7 text-muted">در نسخهٔ عمومی، ثبت تجربه تا آماده‌شدن ورود پیامکی فعال نیست. تجربهٔ پیش‌نمایش محلی فقط در همان مرورگر ذخیره می‌شود و نظر عمومی محسوب نمی‌شود.</p>
      <Link href="/search" className={`${BTN_PRIMARY} mt-5 px-5 py-3 text-sm`}>پیدا کردن کافه و رستوران</Link>
    </Container>
  </section>;
}
