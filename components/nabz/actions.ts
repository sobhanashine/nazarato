"use server";

import { getSession } from "@/lib/auth/session";
import {
  parseStoredTasteProfile,
  parseTasteProfileInput,
  rebuildTasteProfileSession,
  TASTE_PROFILE_MODEL,
  type TasteProfileView,
} from "../../lib/nabz/taste-profile-input";
import { supabaseAdmin } from "@/lib/supabase/server";

export type TasteProfileSaveResult =
  | { ok: true; profile: TasteProfileView }
  | {
      ok: false;
      reason: "unauthenticated" | "invalid" | "unavailable";
      message: string;
    };

export type TasteProfileLoadResult =
  | { ok: true; profile: TasteProfileView | null }
  | {
      ok: false;
      reason: "unauthenticated" | "unavailable";
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

  const updatedAt = new Date().toISOString();
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
          updated_at: updatedAt,
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

  return {
    ok: true,
    profile: {
      modelId: TASTE_PROFILE_MODEL.id,
      modelVersion: TASTE_PROFILE_MODEL.version,
      scores: rebuilt.scores,
      evidenceCount: rebuilt.choices.length,
      updatedAt,
    },
  };
}

/** Read only the signed-in user's current, active aggregate Taste Graph. */
export async function loadTasteProfile(): Promise<TasteProfileLoadResult> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      reason: "unauthenticated",
      message: "برای بازیابی سلیقه باید وارد حساب شوی.",
    };
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from("taste_profiles")
      .select(
        "model_id,model_version,dimension_weights,evidence_count,updated_at",
      )
      .eq("user_id", session.id)
      .eq("model_id", TASTE_PROFILE_MODEL.id)
      .eq("model_version", TASTE_PROFILE_MODEL.version)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("[nabz] taste profile read failed", {
        userId: session.id,
        modelId: TASTE_PROFILE_MODEL.id,
        modelVersion: TASTE_PROFILE_MODEL.version,
        error: error.message,
      });
      return {
        ok: false,
        reason: "unavailable",
        message: "بازیابی سلیقه فعلاً ممکن نیست.",
      };
    }

    if (!data) {
      return { ok: true, profile: null };
    }

    const parsed = parseStoredTasteProfile(data);
    if (!parsed.ok) {
      console.error("[nabz] stored taste profile failed validation", {
        userId: session.id,
        modelId: TASTE_PROFILE_MODEL.id,
        modelVersion: TASTE_PROFILE_MODEL.version,
        error: parsed.error,
      });
      return {
        ok: false,
        reason: "unavailable",
        message: "پروفایل ذخیره‌شده قابل بازیابی نیست.",
      };
    }

    return { ok: true, profile: parsed.value };
  } catch (error) {
    console.error("[nabz] taste profile read threw", {
      userId: session.id,
      modelId: TASTE_PROFILE_MODEL.id,
      modelVersion: TASTE_PROFILE_MODEL.version,
      error: error instanceof Error ? error.message : "unknown error",
    });
    return {
      ok: false,
      reason: "unavailable",
      message: "بازیابی سلیقه فعلاً ممکن نیست.",
    };
  }
}
