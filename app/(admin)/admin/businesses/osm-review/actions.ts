"use server";

import { revalidatePath } from "next/cache";
import {
  recordAdminOsmSourceReviewDecision,
  type RecordOsmSourceReviewResult,
} from "@/lib/data/admin-osm-source-review";
import {
  recordAdminOsmCompletionProposal,
  type RecordOsmCompletionProposalResult,
} from "@/lib/data/admin-osm-completion";

export async function recordOsmSourceReviewDecision(
  input: unknown,
): Promise<RecordOsmSourceReviewResult> {
  try {
    const result = await recordAdminOsmSourceReviewDecision(input);
    if (result.ok && !result.noAction) {
      revalidatePath("/admin/businesses/osm-review");
    }
    return result;
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "unauthorized") {
      return { ok: false, error: "غیرمجاز" };
    }
    console.error("[admin/osm-review] decision action failed", {
      route: "/admin/businesses/osm-review",
      error,
    });
    return { ok: false, error: "ثبت تصمیم فعلاً ممکن نیست." };
  }
}

export async function recordOsmCompletionProposal(
  input: unknown,
): Promise<RecordOsmCompletionProposalResult> {
  try {
    const result = await recordAdminOsmCompletionProposal(input);
    if (result.ok && !result.noAction) {
      revalidatePath("/admin/businesses/osm-review");
    }
    return result;
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "unauthorized") {
      return { ok: false, error: "غیرمجاز" };
    }
    console.error("[admin/osm-review] completion action failed", {
      route: "/admin/businesses/osm-review",
      error,
    });
    return { ok: false, error: "ثبت پیشنهاد تکمیل فعلاً ممکن نیست." };
  }
}
