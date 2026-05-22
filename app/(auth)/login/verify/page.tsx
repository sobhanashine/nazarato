import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BTN_PRIMARY, GLASS } from "@/components/ui/styles";
import { DEV_OTP, formatPhone } from "@/lib/auth/otp";
import { getOtpChallenge, getSession } from "@/lib/auth/session";
import { VerifyForm } from "./VerifyForm";

export const metadata: Metadata = {
  title: "تأیید کد — نظراتو",
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawNext = typeof params.next === "string" ? params.next : "";

  // Already signed in → honour the ?next destination rather than always "/".
  if (await getSession()) {
    const dest =
      rawNext.startsWith("/") &&
      !rawNext.startsWith("//") &&
      !rawNext.startsWith("/\\")
        ? rawNext
        : "/";
    redirect(dest);
  }

  const challenge = await getOtpChallenge();

  // No challenge → the page was opened directly, or the 5-minute code expired.
  if (!challenge) {
    return (
      <div className={`${GLASS} p-6 text-center sm:p-8`}>
        <h1 className="text-[1.3rem] font-black text-strong">
          کد منقضی شده است
        </h1>
        <p className="mt-2 text-[14px] leading-[1.9] text-muted">
          برای دریافت کد تازه، دوباره شماره موبایلت را وارد کن.
        </p>
        <Link
          href="/login"
          className={`${BTN_PRIMARY} mt-5 w-full py-3 text-[14px]`}
        >
          بازگشت به ورود
        </Link>
      </div>
    );
  }

  return (
    <VerifyForm
      phone={formatPhone(challenge.phone)}
      next={rawNext}
      devCode={process.env.NODE_ENV !== "production" ? DEV_OTP : null}
    />
  );
}
