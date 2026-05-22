import Link from "next/link";
import { FacebookIcon, InstagramIcon, LinkedInIcon, TwitterIcon } from "@/components/icons";

export function Footer() {
  return (
    <footer className="mt-16 relative bg-[rgba(8,11,20,0.6)] backdrop-blur-[20px] backdrop-saturate-[160%] border-t border-glass-border">
      <div className="flex flex-col px-5 py-5 md:flex-row-reverse md:justify-between md:items-center md:max-w-[1280px] md:mx-auto md:px-12 xl:px-16">
        <div className="flex items-center justify-center md:justify-end gap-6 pb-4 mb-4 border-b border-glass-border md:border-b-0 md:pb-0 md:mb-0">
          <h5 className="text-strong text-[15px] font-medium whitespace-nowrap">
            مارا دنبال کنید
          </h5>
          <div className="flex gap-[0.2rem]">
            <a href="#" className="flex items-center justify-center w-10 h-10 rounded-full text-strong transition-colors duration-200 hover:bg-glass-hover hover:text-mint" aria-label="اینستاگرام"><InstagramIcon /></a>
            <a href="#" className="flex items-center justify-center w-10 h-10 rounded-full text-strong transition-colors duration-200 hover:bg-glass-hover hover:text-mint" aria-label="توییتر"><TwitterIcon /></a>
            <a href="#" className="flex items-center justify-center w-10 h-10 rounded-full text-strong transition-colors duration-200 hover:bg-glass-hover hover:text-mint" aria-label="فیسبوک"><FacebookIcon /></a>
            <a href="#" className="flex items-center justify-center w-10 h-10 rounded-full text-strong transition-colors duration-200 hover:bg-glass-hover hover:text-mint" aria-label="لینکدین"><LinkedInIcon /></a>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 md:flex-row md:gap-6">
          <p className="text-sm text-muted text-center">
            © تمامی حقوق برای nazarato.ir محفوظ است.
          </p>
          <div className="flex items-center gap-4 text-[13px] text-muted font-medium">
            <Link href="/terms" className="hover:text-mint transition-colors duration-200">
              قوانین و مقررات
            </Link>
            <span className="text-glass-border" aria-hidden>·</span>
            <Link href="/privacy" className="hover:text-mint transition-colors duration-200">
              حریم خصوصی
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
