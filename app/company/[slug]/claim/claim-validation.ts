import { normalizePhone } from "../../../../lib/auth/otp";

export const CLAIM_NOTES_MAX = 1_000;
export const CLAIM_PROOF_MAX_BYTES = 5 * 1024 * 1024;
export const CLAIM_PROOF_TYPES = [
  "domain_email",
  "document",
  "other",
] as const;

export type ClaimProofType = (typeof CLAIM_PROOF_TYPES)[number];

export function validateClaimEmail(
  raw: string,
): { ok: true; email: string } | { ok: false; error: string } {
  const email = raw.trim().toLowerCase();
  if (
    email.length > 254 ||
    !/^[^\s@]{1,64}@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return { ok: false, error: "ایمیل وارد شده معتبر نیست." };
  }
  return { ok: true, email };
}

export function validateClaimContactPhone(
  raw: string,
): { ok: true; phone: string } | { ok: false; error: string } {
  const phone = normalizePhone(raw);
  return phone
    ? { ok: true, phone }
    : { ok: false, error: "شماره تماس معتبر نیست." };
}

type ProofKind = {
  mime: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  extension: "jpg" | "png" | "webp" | "pdf";
  matches: (header: Uint8Array) => boolean;
};

const PROOF_KINDS: ProofKind[] = [
  {
    mime: "image/jpeg",
    extension: "jpg",
    matches: (h) => h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff,
  },
  {
    mime: "image/png",
    extension: "png",
    matches: (h) =>
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
        (byte, index) => h[index] === byte,
      ),
  },
  {
    mime: "image/webp",
    extension: "webp",
    matches: (h) =>
      [0x52, 0x49, 0x46, 0x46].every((byte, index) => h[index] === byte) &&
      [0x57, 0x45, 0x42, 0x50].every(
        (byte, index) => h[index + 8] === byte,
      ),
  },
  {
    mime: "application/pdf",
    extension: "pdf",
    matches: (h) =>
      [0x25, 0x50, 0x44, 0x46, 0x2d].every(
        (byte, index) => h[index] === byte,
      ),
  },
];

export type InspectedClaimProof = {
  buffer: Buffer;
  contentType: ProofKind["mime"];
  extension: ProofKind["extension"];
};

export async function inspectClaimProof(
  file: File,
): Promise<
  | ({ ok: true } & InspectedClaimProof)
  | { ok: false; error: string }
> {
  if (file.size > CLAIM_PROOF_MAX_BYTES) {
    return { ok: false, error: "حجم فایل باید کمتر از ۵ مگابایت باشد." };
  }
  if (file.size === 0) {
    return { ok: false, error: "فایل مدرک خالی است." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const header = buffer.subarray(0, 16);
  const detected = PROOF_KINDS.find((kind) => kind.matches(header));
  if (!detected || detected.mime !== file.type) {
    return {
      ok: false,
      error: "محتوای فایل با نوع اعلام‌شده هم‌خوانی ندارد.",
    };
  }

  return {
    ok: true,
    buffer,
    contentType: detected.mime,
    extension: detected.extension,
  };
}
