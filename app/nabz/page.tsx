import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { RealNabzJourney } from "@/components/nabz/RealNabzJourney";
export const metadata: Metadata = {title:"نبض رشت — انتخاب با شاهد",robots:{index:false,follow:false}};
export default function NabzPage() { return <><Header/><main id="main-content" className="py-8 sm:py-12"><Container><h1 className="text-3xl font-extrabold leading-[1.6]">نبض رشت؛ انتخاب با شاهد</h1><p className="mb-7 mt-3 max-w-2xl text-base leading-8 text-muted">پنج مقایسهٔ کوتاه، سپس پیشنهاد اولیه با تجربه‌های منتشرشده. وقتی داده کافی نباشد، نتیجه‌ای ساخته نمی‌شود.</p><RealNabzJourney/></Container></main><Footer/></>; }
