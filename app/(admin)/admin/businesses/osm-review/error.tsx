"use client";

import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { GLASS } from "@/components/ui/styles";

export default function AdminOsmReviewError({ reset }: { reset: () => void }) {
  return (
    <>
      <Header />
      <Container>
        <main className="flex min-h-[70vh] items-center justify-center py-8">
          <section className={`${GLASS} w-full max-w-xl p-8 text-center sm:p-10`}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-pomegr/30 bg-pomegr/10 text-pomegr">
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 9v4m0 4h.01M10.3 3.6 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
              </svg>
            </div>
            <h1 className="mt-5 text-xl font-black text-strong">
              صف داده فعلاً در دسترس نیست
            </h1>
            <p className="mt-2 text-sm leading-7 text-muted">
              هیچ تغییری روی داده‌ها انجام نشده. اتصال را دوباره بررسی می‌کنیم.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={reset}
                className="min-h-11 rounded-full border border-mint/40 bg-mint/10 px-5 text-sm font-bold text-mint transition-colors hover:bg-mint/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
              >
                تلاش دوباره
              </button>
              <Link
                href="/admin/businesses"
                className="inline-flex min-h-11 items-center rounded-full border border-glass-border px-5 text-sm font-bold text-muted transition-colors hover:text-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
              >
                بازگشت به کسب‌وکارها
              </Link>
            </div>
          </section>
        </main>
      </Container>
      <Footer />
    </>
  );
}
