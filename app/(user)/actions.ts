"use server";

/**
 * Server actions for the consumer account area.
 */
import { redirect } from "next/navigation";
import { clearSession } from "@/lib/auth/session";

/**
 * Sign the user out — drop the session cookie and return home.
 *
 * Wired to a `<form action={logout}>` so it works without JS. After the
 * redirect the header re-fetches `/api/auth/me` and falls back to «ورود».
 */
export async function logout() {
  await clearSession();
  redirect("/");
}
