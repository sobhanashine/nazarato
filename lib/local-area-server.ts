import { cookies } from "next/headers";
import { AREA_COOKIE, resolveArea } from "./local-area";
export async function getPreferredArea(explicit?: string | string[]) {
  const value = Array.isArray(explicit) ? explicit[0] : explicit;
  if (explicit !== undefined) return resolveArea(value);
  return resolveArea(undefined, (await cookies()).get(AREA_COOKIE)?.value);
}
