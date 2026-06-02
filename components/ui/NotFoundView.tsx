import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";
import { BTN_PRIMARY } from "@/components/ui/styles";

/**
 * Branded, RTL "not found" page body. Used by the root `app/not-found.tsx`
 * (which Next also serves for any unmatched URL) and by every segment-level
 * `not-found.tsx` that wants tailored copy + a back-link to its list page.
 *
 * Server component on purpose — no client hooks needed, so it composes into
 * the (server) `not-found.tsx` files directly. The root layout does NOT render
 * Header/Footer, so each page brings its own (matches the rest of the app).
 */
export function NotFoundView({
  code = "۴۰۴",
  title = "صفحه پیدا نشد",
  message = "صفحه‌ای که دنبالش می‌گردی وجود ندارد یا جابه‌جا شده.",
  backHref = "/",
  backLabel = "بازگشت به خانه",
}: {
  /** Big decorative status number. Empty string hides it. */
  code?: string;
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <>
      <Header />
      <Container>
        <main className="flex flex-col items-center gap-4 py-24 text-center">
          {code ? (
            <p
              className="text-[3.5rem] font-black leading-none text-mint/80"
              aria-hidden
            >
              {code}
            </p>
          ) : null}
          <h1 className="text-[1.5rem] font-black text-strong">{title}</h1>
          <p className="max-w-[42ch] text-[0.9rem] leading-[1.9] text-muted">
            {message}
          </p>
          <Link
            href={backHref}
            className={`${BTN_PRIMARY} mt-2 px-7 py-3 text-[0.95rem]`}
          >
            {backLabel}
          </Link>
        </main>
      </Container>
      <Footer />
    </>
  );
}
