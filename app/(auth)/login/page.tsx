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
  // Already signed in → nothing to do here.
  if (await getSession()) redirect("/");

  const next = (await searchParams).next;
  return <LoginForm next={typeof next === "string" ? next : ""} />;
}
