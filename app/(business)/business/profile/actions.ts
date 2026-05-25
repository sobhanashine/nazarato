"use server";

/**
 * Profile editor for the owner shell — `/business/profile`.
 *
 * One server action handles the whole form (description + contact + hours +
 * optional logo/cover upload). Hours and contact are jsonb on `businesses`,
 * but the form-level shape is flat for ergonomics; we serialize on save.
 *
 * Hours are entered as one line per row in the format `day | value`. The
 * separator is `|` because Persian commas/colons are common inside hour
 * strings (e.g. «۸:۰۰ تا ۲۳:۰۰»). Parsing rejects garbage but tolerates
 * extra whitespace and empty lines.
 *
 * Photo uploads go to the public `business-photos` bucket (migration 0009);
 * the public URL is stored on `businesses.logo_url` / `cover_url`. The old
 * object, when it lives in our bucket, is deleted after a successful swap to
 * avoid orphaned storage.
 */
import { revalidatePath } from "next/cache";
import { Buffer } from "node:buffer";
import { getSession } from "@/lib/auth/session";
import { assertOwnsBusiness } from "@/lib/data/owner";
import { supabaseAdmin } from "@/lib/supabase/server";

const BUCKET = "business-photos";
const MAX_PHOTO_BYTES = 3 * 1024 * 1024; // 3 MB; matches the bucket-level limit
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const DESCRIPTION_MAX = 1500;
const CONTACT_MAX = 200;

type ContactJson = { website?: string; phone?: string; instagram?: string };
type HoursJson = { day: string; value: string }[];

export type ProfileActionState = {
  status: "idle" | "ok" | "error";
  message?: string;
  /** Field-level errors keyed by input name. */
  fieldErrors?: Partial<Record<"description" | "website" | "phone" | "instagram" | "hours" | "logo" | "cover", string>>;
};

function sanitizeOpt(v: FormDataEntryValue | null, max: number): string | null {
  const s = (typeof v === "string" ? v : "").trim();
  if (s.length === 0) return null;
  if (s.length > max) return null; // caller treats null as "too long"
  return s;
}

function parseHours(raw: string): HoursJson | null {
  if (raw.trim().length === 0) return [];
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: HoursJson = [];
  for (const line of lines) {
    const idx = line.indexOf("|");
    if (idx < 1 || idx === line.length - 1) return null;
    const day = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!day || !value) return null;
    if (day.length > 60 || value.length > 60) return null;
    out.push({ day, value });
  }
  return out;
}

async function maybeUploadPhoto(
  file: File,
  businessId: string,
  kind: "logo" | "cover",
): Promise<string | null> {
  if (file.size === 0) return null;
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("photo_too_large");
  }
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("photo_bad_mime");
  }

  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${businessId}/${kind}-${Date.now()}.${ext}`;

  const arrayBuf = await file.arrayBuffer();
  const supabase = supabaseAdmin();
  const { error } = await supabase.storage.from(BUCKET).upload(path, Buffer.from(arrayBuf), {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    console.error("[owner] photo upload failed", { kind, error: error.message });
    throw new Error("photo_upload_failed");
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete the previous photo when it lives in our public bucket — older mock
 * data may hold an external URL we don't own, so leave anything not pointing
 * at the bucket untouched.
 */
async function deletePhotoIfOurs(url: string | null): Promise<void> {
  if (!url) return;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length);
  await supabaseAdmin().storage.from(BUCKET).remove([path]).catch((err) => {
    console.warn("[owner] failed to remove old photo", { path, err });
  });
}

export async function updateBusinessProfile(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await getSession();
  if (!session) return { status: "error", message: "ابتدا وارد حساب شو." };

  const businessId = String(formData.get("businessId") ?? "").trim();
  if (!businessId) {
    return { status: "error", message: "شناسه کسب‌وکار معتبر نیست." };
  }

  const business = await assertOwnsBusiness(session.id, businessId);
  if (!business) {
    return { status: "error", message: "این کسب‌وکار در دامنه‌ی شما نیست." };
  }

  const description = (formData.get("description")?.toString() ?? "").trim();
  if (description.length > DESCRIPTION_MAX) {
    return {
      status: "error",
      fieldErrors: {
        description: `توضیحات نباید از ${DESCRIPTION_MAX.toLocaleString("fa-IR")} کاراکتر بیشتر باشد.`,
      },
    };
  }

  const website = sanitizeOpt(formData.get("website"), CONTACT_MAX);
  const phone = sanitizeOpt(formData.get("phone"), CONTACT_MAX);
  const instagram = sanitizeOpt(formData.get("instagram"), CONTACT_MAX);

  const websiteRaw = formData.get("website")?.toString() ?? "";
  const phoneRaw = formData.get("phone")?.toString() ?? "";
  const instagramRaw = formData.get("instagram")?.toString() ?? "";
  const fieldErrors: ProfileActionState["fieldErrors"] = {};
  if (websiteRaw.trim().length > CONTACT_MAX) fieldErrors.website = "این فیلد خیلی بلند است.";
  if (phoneRaw.trim().length > CONTACT_MAX) fieldErrors.phone = "این فیلد خیلی بلند است.";
  if (instagramRaw.trim().length > CONTACT_MAX) fieldErrors.instagram = "این فیلد خیلی بلند است.";

  const contact: ContactJson = {};
  if (website) contact.website = website;
  if (phone) contact.phone = phone;
  if (instagram) contact.instagram = instagram.replace(/^@/, "");

  const hoursRaw = formData.get("hours")?.toString() ?? "";
  const hours = parseHours(hoursRaw);
  if (hours === null) {
    fieldErrors.hours = "هر خط باید به‌صورت «روز | ساعت» باشد، مثال: شنبه تا چهارشنبه | ۸ تا ۲۳";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", fieldErrors, message: "بعضی فیلدها نیاز به اصلاح دارند." };
  }

  // Pull current photo URLs so we can clean them up after swap.
  const supabase = supabaseAdmin();
  const { data: current } = await supabase
    .from("businesses")
    .select("logo_url, cover_url")
    .eq("id", businessId)
    .single();

  const logoFile = formData.get("logo") as File | null;
  const coverFile = formData.get("cover") as File | null;

  let nextLogoUrl: string | null | undefined = undefined; // undefined = leave unchanged
  let nextCoverUrl: string | null | undefined = undefined;

  try {
    if (logoFile && logoFile.size > 0) {
      nextLogoUrl = await maybeUploadPhoto(logoFile, businessId, "logo");
    }
    if (coverFile && coverFile.size > 0) {
      nextCoverUrl = await maybeUploadPhoto(coverFile, businessId, "cover");
    }
  } catch (err) {
    const code = err instanceof Error ? err.message : "unknown";
    const map: Record<string, string> = {
      photo_too_large: "تصویر بیش از حد بزرگ است (حداکثر ۳ مگابایت).",
      photo_bad_mime: "فقط JPEG، PNG و WebP پذیرفته می‌شود.",
      photo_upload_failed: "بارگذاری تصویر ناموفق بود.",
    };
    return { status: "error", message: map[code] ?? "خطا در بارگذاری تصویر." };
  }

  // Honor explicit "remove" intents for each photo.
  const removeLogo = formData.get("removeLogo") === "1";
  const removeCover = formData.get("removeCover") === "1";
  if (removeLogo && nextLogoUrl === undefined) nextLogoUrl = null;
  if (removeCover && nextCoverUrl === undefined) nextCoverUrl = null;

  const updates: Record<string, unknown> = {
    description: description || null,
    contact,
    hours: hours && hours.length > 0 ? hours : null,
    updated_at: new Date().toISOString(),
  };
  if (nextLogoUrl !== undefined) updates.logo_url = nextLogoUrl;
  if (nextCoverUrl !== undefined) updates.cover_url = nextCoverUrl;

  const { error } = await supabase.from("businesses").update(updates).eq("id", businessId);
  if (error) {
    console.error("[owner] updateBusinessProfile failed", {
      businessId,
      error: error.message,
    });
    return { status: "error", message: "ذخیره تغییرات ناموفق بود." };
  }

  if (nextLogoUrl !== undefined && current?.logo_url && current.logo_url !== nextLogoUrl) {
    await deletePhotoIfOurs(current.logo_url as string);
  }
  if (nextCoverUrl !== undefined && current?.cover_url && current.cover_url !== nextCoverUrl) {
    await deletePhotoIfOurs(current.cover_url as string);
  }

  revalidatePath("/business/profile");
  revalidatePath("/business");
  revalidatePath(`/company/${business.slug}`);

  return { status: "ok", message: "تغییرات ذخیره شد." };
}
