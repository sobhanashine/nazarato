import { redirect } from "next/navigation";

type Params = { handle: string };

/**
 * Legacy `/shop/[handle]/write-review` route — now consolidated onto the
 * ReviewSheet wizard (issue #91). Bounces to the shop profile with
 * `?review=1`, which `ReviewSheetAutoOpen` reads to open the sheet with the
 * shop pre-selected.
 */
export default async function ShopWriteReviewLegacyRedirect({
  params,
}: {
  params: Promise<Params>;
}) {
  const { handle } = await params;
  redirect(`/shop/${handle}?review=1`);
}
