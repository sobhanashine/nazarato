import { redirect } from "next/navigation";

type Params = { slug: string };

/**
 * Legacy `/company/[slug]/write-review` route — now consolidated onto the
 * ReviewSheet wizard (issue #91). Bounces to the company profile with
 * `?review=1`, which `ReviewSheetAutoOpen` reads to open the sheet with the
 * business pre-selected.
 */
export default async function CompanyWriteReviewLegacyRedirect({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  redirect(`/company/${slug}?review=1`);
}
