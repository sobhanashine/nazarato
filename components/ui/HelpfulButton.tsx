"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { toggleHelpfulVote } from "@/app/reviews/actions";

interface HelpfulButtonProps {
  reviewId: string;
  initialCount: number;
  initialVoted: boolean;
}

const faNum = (n: number) => n.toLocaleString("fa-IR");

export function HelpfulButton({ reviewId, initialCount, initialVoted }: HelpfulButtonProps) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [hasVoted, setHasVoted] = useState(initialVoted);
  // `busy` is observable from the DOM (`data-busy`) for tests that need to
  // wait on persistence — the button itself never disables, so users always
  // get instant feedback.
  const [busy, setBusy] = useState(false);
  // Plain ref guard — see comment in handleVote on why we don't useTransition.
  const inflightRef = useRef(false);

  const handleVote = () => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    setBusy(true);

    const prevHasVoted = hasVoted;
    const prevCount = count;
    const nextHasVoted = !hasVoted;
    const nextCount = nextHasVoted ? count + 1 : Math.max(0, count - 1);

    // Commit the optimistic state immediately so the button updates without
    // waiting on the server. This IS the user-visible feedback — server
    // confirmation rolls back on failure, but doesn't gate the click.
    setHasVoted(nextHasVoted);
    setCount(nextCount);

    // Plain Promise — NOT inside `useTransition`. The server action's
    // built-in post-action RSC refresh otherwise extends the transition
    // until the current route re-renders, which on data-heavy pages (the
    // home page in particular) holds the button disabled long enough that
    // users perceive it as stuck. Using a ref guard for double-click
    // prevention sidesteps that without losing the safety.
    toggleHelpfulVote(reviewId).then(
      (res) => {
        if (!res.ok) {
          setHasVoted(prevHasVoted);
          setCount(prevCount);
          if (res.error === "auth_required") {
            toast.error("برای ثبت رأی مفید بودن، ابتدا باید وارد حساب خود شوید.");
            router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
          } else {
            toast.error(res.error || "خطایی در ثبت رأی رخ داد.");
          }
        } else {
          toast.success(nextHasVoted ? "نظر برای شما مفید بود" : "رأی شما حذف شد");
        }
      },
      (err) => {
        // Network blip — roll back and tell the user.
        setHasVoted(prevHasVoted);
        setCount(prevCount);
        console.error("[HelpfulButton] action failed", err);
        toast.error("خطایی در ثبت رأی رخ داد.");
      },
    ).finally(() => {
      inflightRef.current = false;
      setBusy(false);
    });
  };

  return (
    <button
      type="button"
      onClick={handleVote}
      aria-pressed={hasVoted}
      data-voted={hasVoted ? "true" : "false"}
      data-busy={busy ? "true" : "false"}
      className={`inline-flex items-center gap-[0.3rem] text-[0.72rem] sm:text-[0.75rem] font-medium whitespace-nowrap bg-transparent border border-transparent rounded-full cursor-pointer [&>svg]:w-[12px] [&>svg]:h-[12px] sm:[&>svg]:w-[13px] sm:[&>svg]:h-[13px] [&>svg]:shrink-0 transition-all duration-200 active:scale-95 ${
        hasVoted
          ? "text-mint font-bold drop-shadow-[0_0_8px_rgba(91,230,178,0.2)]"
          : "text-muted hover:text-strong"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill={hasVoted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={hasVoted ? "1" : "1.7"}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="transition-transform duration-200 hover:-translate-y-[1px]"
      >
        <path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z" />
        <path d="M7 11l4-8a2 2 0 0 1 3 1.7V9h5a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 17.6 20H7" />
      </svg>
      <span>مفید بود</span>
      {count > 0 && <span className="opacity-90 tabular-nums">({faNum(count)})</span>}
    </button>
  );
}
