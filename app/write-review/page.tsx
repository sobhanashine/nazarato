import { redirect } from "next/navigation";

/**
 * Legacy `/write-review` route — now consolidated onto the ReviewSheet wizard
 * (issue #91). Lands on the homepage with `?review=1`, which
 * `ReviewSheetAutoOpen` reads to open the sheet's business-picker step.
 */
export default function WriteReviewLegacyRedirect() {
  redirect("/?review=1");
}
