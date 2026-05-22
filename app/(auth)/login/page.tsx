import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "ورود یا ثبت‌نام — نظراتو",
  description: "با شماره موبایل وارد نظراتو شو.",
};

export default async function LoginPage({
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

  return <LoginForm next={rawNext} />;
}
