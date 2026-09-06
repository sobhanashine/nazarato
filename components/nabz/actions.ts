"use server";

import { getSession } from "@/lib/auth/session";
import {
  parseTasteProfileInput,
  rebuildTasteProfileSession,
  TASTE_PROFILE_MODEL,
} from "../../lib/nabz/taste-profile-input";
import { supabaseAdmin } from "@/lib/supabase/server";

export type TasteProfileSaveResult =
  | { ok: true; evidenceCount: number }
  | {
      ok: false;
      reason: "unauthenticated" | "invalid" | "unavailable";
      message: string;
    };

/**
 * Save only a server-rebuilt Taste Graph. Raw reasons and client-supplied
 * scores never reach the profile table; the profile is private by design.
 */
export async function saveTasteProfile(
  payload: unknown,
): Promise<TasteProfileSaveResult> {
  const parsed = parseTasteProfileInput(payload);
  if (!parsed.ok) {
    return { ok: false, reason: "invalid", message: parsed.error };
  }

  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      reason: "unauthenticated",
      message: "برای ذخیره‌ی سلیقه بین دستگاه‌ها باید وارد حساب شوی.",
    };
  }

  const rebuilt = rebuildTasteProfileSession(parsed.value);
  if (!rebuilt) {
    return {
      ok: false,
      reason: "invalid",
      message: "انتخاب‌های سلیقه قابل بازسازی نیستند.",
    };
  }

  try {
    const { error } = await supabaseAdmin()
      .from("taste_profiles")
      .upsert(
        {
          user_id: session.id,
          model_id: TASTE_PROFILE_MODEL.id,
          model_version: TASTE_PROFILE_MODEL.version,
          dimension_weights: rebuilt.scores,
          evidence_count: rebuilt.choices.length,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,model_id,model_version" },
      );

    if (error) {
      console.error("[nabz] taste profile upsert failed", {
        userId: session.id,
        modelId: TASTE_PROFILE_MODEL.id,
        modelVersion: TASTE_PROFILE_MODEL.version,
        evidenceCount: rebuilt.choices.length,
        error: error.message,
      });
      return {
        ok: false,
        reason: "unavailable",
        message: "ذخیره‌ی سلیقه فعلاً ممکن نیست؛ دوباره تلاش کن.",
      };
    }
  } catch (error) {
    console.error("[nabz] taste profile persistence threw", {
      userId: session.id,
      modelId: TASTE_PROFILE_MODEL.id,
      modelVersion: TASTE_PROFILE_MODEL.version,
      evidenceCount: rebuilt.choices.length,
      error: error instanceof Error ? error.message : "unknown error",
    });
    return {
      ok: false,
      reason: "unavailable",
      message: "ذخیره‌ی سلیقه فعلاً ممکن نیست؛ دوباره تلاش کن.",
    };
  }

  return { ok: true, evidenceCount: rebuilt.choices.length };
}
