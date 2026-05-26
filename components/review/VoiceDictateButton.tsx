"use client";

/**
 * VoiceDictateButton — fa-IR dictation for the ReviewSheet body textarea.
 *
 * Records mic audio via `MediaRecorder` and POSTs it to `/api/transcribe`,
 * which forwards to Gemini 2.5 Flash. We moved off `webkitSpeechRecognition`
 * because Chrome's fa-IR endpoint is blocked from inside Iran (surfaced as
 * `network` errors). Gemini's `generativelanguage.googleapis.com` is
 * reachable from the same region — see route comment for the why.
 *
 * State machine:
 *   idle      ─ click ─►  recording    ─ click ─►  processing  ─ result ─►  idle
 *                                      (stop)      (upload + STT)  └ error ─► idle
 *
 * Visual states:
 *  - idle:        muted mic icon
 *  - recording:   red mic + animated ping ring
 *  - processing:  spinning ring (no ping — recording has stopped)
 *
 * Fallback: when neither `MediaRecorder` nor `navigator.mediaDevices` is
 * available (Firefox in some configs, locked-down WebViews, insecure HTTP
 * origins), the button renders nothing — no broken affordance.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export type VoiceMode = "idle" | "recording" | "processing";

type Props = {
  /** Receives the recognized transcript. Parent merges into its text state. */
  onAppend: (text: string) => void;
  /** Notified on every state transition so the parent can mirror it (e.g.
   * swap an inline counter for a "tap again to stop" hint while recording). */
  onModeChange?: (mode: VoiceMode) => void;
};

type Mode = VoiceMode;

/**
 * Pick a MIME the browser can record AND that we accept on the server.
 * Order matters — first hit wins. Chrome/Firefox give us webm/opus; Safari
 * gives us mp4/aac. Both are accepted by `/api/transcribe`.
 */
const CANDIDATE_MIMES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/aac",
];

function pickMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const m of CANDIDATE_MIMES) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return null;
}

function supportsRecorder(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    pickMime() !== null
  );
}

export function VoiceDictateButton({ onAppend, onModeChange }: Props) {
  // `null` on the server / first client render → button hidden until the
  // post-mount detection runs. Prevents hydration mismatch.
  const [supported, setSupported] = useState<boolean | null>(null);
  const [mode, setMode] = useState<Mode>("idle");

  // Mirror the latest onModeChange in a ref so callers can pass an inline
  // arrow without forcing every effect to re-run on parent re-render.
  const onModeChangeRef = useRef(onModeChange);
  useEffect(() => {
    onModeChangeRef.current = onModeChange;
  }, [onModeChange]);
  useEffect(() => {
    onModeChangeRef.current?.(mode);
  }, [mode]);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  // Re-entrancy guard: `startRecording` awaits `getUserMedia` (which can hang
  // on the permission prompt). A second click during that window would start
  // a SECOND session and leak the first stream — this ref serialises starts.
  const startingRef = useRef(false);
  // `transcribe` is wrapped in a ref so the `stop` handler always sees the
  // current `onAppend` closure without re-creating the recorder on every
  // parent re-render.
  const transcribeRef = useRef<(blob: Blob) => Promise<void>>(async () => {});

  useEffect(() => {
    setSupported(supportsRecorder());
  }, []);

  // Stop and release the microphone if the wizard unmounts mid-recording.
  useEffect(() => {
    return () => {
      stopTracks(streamRef.current);
      streamRef.current = null;
      try {
        recorderRef.current?.stop();
      } catch {
        /* already inactive */
      }
      recorderRef.current = null;
    };
  }, []);

  const transcribe = useCallback(
    async (blob: Blob) => {
      try {
        const res = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "content-type": blob.type || "audio/webm" },
          body: blob,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          const msg =
            (data && typeof data === "object" && "error" in data
              ? String((data as { error: unknown }).error)
              : null) ?? "خطا در دیکته صوتی.";
          toast.error(msg);
          return;
        }
        const data = (await res.json()) as { text?: unknown };
        const text = typeof data.text === "string" ? data.text.trim() : "";
        if (!text) {
          toast.error("صدایی شناسایی نشد — دوباره تلاش کن.");
          return;
        }
        onAppend(text);
      } catch (err) {
        console.error("[voice] transcribe request failed", err);
        toast.error("ارتباط با سرویس دیکته برقرار نشد.");
      }
    },
    [onAppend],
  );

  // Keep the ref pointing at the freshest closure so the `onstop` handler
  // installed when recording started can call it without going stale.
  useEffect(() => {
    transcribeRef.current = transcribe;
  }, [transcribe]);

  const startRecording = useCallback(async () => {
    // Guard re-entry — a second click while the permission prompt is open
    // must not start a parallel session.
    if (startingRef.current || recorderRef.current) return;
    startingRef.current = true;

    const mime = pickMime();
    if (!mime) {
      startingRef.current = false;
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      // Most browsers throw `NotAllowedError` on permission denial; treat any
      // failure as denial for the user-facing message.
      console.error("[voice] getUserMedia failed", err);
      toast.error("دسترسی به میکروفون داده نشد.");
      startingRef.current = false;
      return;
    }

    // Construct + start inside try/finally — if either throws we must
    // release the freshly-acquired stream or the mic indicator stays on.
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: mime });
    } catch (err) {
      console.error("[voice] MediaRecorder constructor failed", err);
      toast.error("راه‌اندازی ضبط ممکن نشد.");
      stopTracks(stream);
      startingRef.current = false;
      return;
    }

    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      stopTracks(streamRef.current);
      streamRef.current = null;
      const blob = new Blob(chunksRef.current, { type: mime });
      chunksRef.current = [];
      recorderRef.current = null;
      if (blob.size === 0) {
        setMode("idle");
        return;
      }
      setMode("processing");
      void transcribeRef.current(blob).finally(() => setMode("idle"));
    };
    recorder.onerror = (e) => {
      console.error("[voice] MediaRecorder error", e);
      toast.error("خطا در ضبط صدا.");
      stopTracks(streamRef.current);
      streamRef.current = null;
      recorderRef.current = null;
      setMode("idle");
    };

    try {
      recorder.start();
    } catch (err) {
      console.error("[voice] recorder.start failed", err);
      toast.error("راه‌اندازی ضبط ممکن نشد.");
      stopTracks(stream);
      startingRef.current = false;
      return;
    }

    streamRef.current = stream;
    recorderRef.current = recorder;
    setMode("recording");
    startingRef.current = false;
  }, []);

  const stopRecording = useCallback(() => {
    try {
      recorderRef.current?.stop();
    } catch {
      /* already inactive — `onstop` handles cleanup */
    }
  }, []);

  const onClick = useCallback(() => {
    if (mode === "idle") void startRecording();
    else if (mode === "recording") stopRecording();
    // While processing, the button is disabled — no-op.
  }, [mode, startRecording, stopRecording]);

  if (supported !== true) return null;

  const label =
    mode === "recording"
      ? "توقف دیکته صوتی"
      : mode === "processing"
        ? "در حال پردازش دیکته"
        : "دیکته صوتی";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={mode === "processing"}
      aria-label={label}
      aria-pressed={mode === "recording"}
      aria-busy={mode === "processing"}
      data-testid="voice-dictate"
      data-state={mode}
      className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
        mode === "recording"
          ? "bg-pomegr/20 text-pomegr"
          : mode === "processing"
            ? "bg-white/[0.06] text-mint cursor-wait"
            : "bg-white/[0.06] text-muted hover:bg-mint/15 hover:text-mint"
      }`}
    >
      {mode === "recording" && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border border-pomegr animate-ping motion-reduce:hidden"
        />
      )}
      {mode === "processing" ? (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-mint/30 border-t-mint motion-reduce:animate-none"
        />
      ) : (
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
      )}
    </button>
  );
}

function stopTracks(stream: MediaStream | null): void {
  if (!stream) return;
  for (const t of stream.getTracks()) t.stop();
}
