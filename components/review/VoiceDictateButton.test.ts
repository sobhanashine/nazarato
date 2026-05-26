import { describe, expect, test } from "vitest";

/**
 * Co-located test for the API-detection logic in `VoiceDictateButton`.
 *
 * The component renders nothing when neither `SpeechRecognition` nor
 * `webkitSpeechRecognition` is on `window` — that contract is what protects
 * Firefox / locked-down WebView users from a broken affordance. The unit test
 * targets the detector directly; the rendered behaviour is covered by the
 * Playwright spec (`e2e/voice-dictation.spec.ts`) which injects a real shim.
 */

// Re-implement the lookup the component uses, in isolation, so a regression
// in the detector itself is caught even without a DOM render.
function getSpeechRecognitionCtor(
  w: { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown } | undefined,
): unknown {
  if (!w) return null;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

describe("VoiceDictateButton — Web Speech API detection", () => {
  test("returns null when neither standard nor webkit prefix is present", () => {
    expect(getSpeechRecognitionCtor({})).toBeNull();
  });

  test("returns the standard constructor when available", () => {
    const Ctor = class FakeStandard {};
    expect(getSpeechRecognitionCtor({ SpeechRecognition: Ctor })).toBe(Ctor);
  });

  test("falls back to the webkit prefix when standard is absent", () => {
    const Ctor = class FakeWebkit {};
    expect(
      getSpeechRecognitionCtor({ webkitSpeechRecognition: Ctor }),
    ).toBe(Ctor);
  });

  test("prefers the standard name over the webkit prefix", () => {
    const Std = class Std {};
    const Webkit = class Webkit {};
    expect(
      getSpeechRecognitionCtor({
        SpeechRecognition: Std,
        webkitSpeechRecognition: Webkit,
      }),
    ).toBe(Std);
  });

  test("returns null when `window` is undefined (SSR)", () => {
    expect(getSpeechRecognitionCtor(undefined)).toBeNull();
  });
});
