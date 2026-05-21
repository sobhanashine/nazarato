import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getBusiness } from "@/lib/data/businesses";

/**
 * Validates the slug *above* the `loading.tsx` Suspense boundary. If the check
 * lived only in `page.tsx`, the 200 loading shell would flush before
 * `notFound()` ran — pinning the response at 200. Here it commits a real 404.
 */
export default async function CompanyLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getBusiness(slug)) notFound();
  return children;
}
