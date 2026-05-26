import { describe, expect, test } from "vitest";

/**
 * Co-located test for the recorder-capability gate in `VoiceDictateButton`.
 *
 * The component renders nothing when `MediaRecorder` is missing OR none of
 * the codecs it tries are supported by the browser. That gate is what
 * protects users on insecure HTTP origins / locked-down WebViews from a
 * non-functional mic icon. The full record→POST→Gemini round-trip is
 * covered in `e2e/voice-dictation.spec.ts`.
 */

const CANDIDATE_MIMES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/aac",
];

function pickMime(
  Recorder: { isTypeSupported: (m: string) => boolean } | undefined,
): string | null {
  if (!Recorder) return null;
  for (const m of CANDIDATE_MIMES) {
    if (Recorder.isTypeSupported(m)) return m;
  }
  return null;
}

describe("VoiceDictateButton — MIME pick", () => {
  test("returns null when MediaRecorder is undefined", () => {
    expect(pickMime(undefined)).toBeNull();
  });

  test("returns null when no candidate MIME is supported", () => {
    expect(pickMime({ isTypeSupported: () => false })).toBeNull();
  });

  test("returns the first supported MIME (webm/opus preferred)", () => {
    expect(pickMime({ isTypeSupported: () => true })).toBe(
      "audio/webm;codecs=opus",
    );
  });

  test("falls through to mp4 when only Safari MIMEs are supported", () => {
    expect(
      pickMime({
        isTypeSupported: (m) => m === "audio/mp4" || m === "audio/aac",
      }),
    ).toBe("audio/mp4");
  });
});
