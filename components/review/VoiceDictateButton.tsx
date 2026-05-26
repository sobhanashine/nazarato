"use client";

/**
 * VoiceDictateButton — fa-IR dictation for the ReviewSheet body textarea (#90).
 *
 * Uses the browser-native Web Speech API (`window.SpeechRecognition` /
 * `webkitSpeechRecognition`). Free, no infra, online-only — the platform's
 * STT does the work. When the API is absent (Firefox desktop, very old
 * browsers, locked-down WebViews) the button renders nothing — no broken
 * affordance.
 *
 * Final results only: interim partials would fight the user's typing as
 * they edit. Each final recognition appends with a separating space so
 * manually-typed content is preserved.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

type Props = {
  /** Receives a freshly-recognized chunk; the parent decides how to merge. */
  onAppend: (text: string) => void;
  /** BCP-47 lang tag. Defaults to Persian (fa-IR) — the app's primary locale. */
  lang?: string;
};

/** Minimal shape of the Web Speech API we use — TS doesn't ship these types. */
type SpeechRecognitionAlternative = { transcript: string };
type SpeechRecognitionResult = ArrayLike<SpeechRecognitionAlternative> & {
  isFinal: boolean;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResult>;
};
type SpeechRecognitionErrorEventLike = { error: string };
type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceDictateButton({ onAppend, lang = "fa-IR" }: Props) {
  // SSR-safe: `null` on the server / first render, then real value once the
  // effect runs. Prevents a hydration mismatch and an SSR `window` access.
  const [supported, setSupported] = useState<boolean | null>(null);
  const [recording, setRecording] = useState(false);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    setSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  // Defensive cleanup — covers the unmount-while-recording case.
  useEffect(() => {
    return () => {
      recRef.current?.stop();
      recRef.current = null;
    };
  }, []);

  const toggle = useCallback(() => {
    if (recording) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    let rec: SpeechRecognitionInstance;
    try {
      rec = new Ctor();
    } catch (err) {
      console.error("[voice] failed to construct SpeechRecognition", err);
      toast.error("راه‌اندازی میکروفون ممکن نشد.");
      return;
    }

    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = false;

    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (!r.isFinal) continue;
        const transcript = r[0]?.transcript?.trim();
        if (transcript) onAppend(transcript);
      }
    };

    rec.onerror = (e) => {
      // Don't toast for "aborted" — that's the normal stop() path.
      if (e.error === "aborted") return;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        toast.error("دسترسی به میکروفون داده نشد.");
      } else if (e.error === "no-speech") {
        toast.error("صدایی شنیده نشد — دوباره تلاش کن.");
      } else if (e.error === "network") {
        toast.error("دیکته صوتی به اینترنت نیاز دارد.");
      } else {
        toast.error("خطا در دیکته صوتی.");
      }
    };

    rec.onend = () => {
      setRecording(false);
      recRef.current = null;
    };

    try {
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch (err) {
      console.error("[voice] failed to start recognition", err);
      toast.error("راه‌اندازی میکروفون ممکن نشد.");
    }
  }, [lang, onAppend, recording]);

  if (supported !== true) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={recording ? "توقف دیکته صوتی" : "دیکته صوتی"}
      aria-pressed={recording}
      data-testid="voice-dictate"
      className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
        recording
          ? "bg-pomegr/20 text-pomegr"
          : "bg-white/[0.06] text-muted hover:bg-mint/15 hover:text-mint"
      }`}
    >
      {recording && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border border-pomegr animate-ping motion-reduce:hidden"
        />
      )}
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <path d="M12 18v3" />
        <path d="M9 21h6" />
      </svg>
    </button>
  );
}
