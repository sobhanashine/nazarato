"use client";

import { useOptimistic, useTransition } from "react";
import toast from "react-hot-toast";
import { toggleBookmark } from "@/app/(user)/saved/actions";
import { BookmarkIcon } from "@/components/icons/BookmarkIcon";
import { BookmarkFilledIcon } from "@/components/icons/BookmarkFilledIcon";

type Props = {
  businessSlug: string;
  initialIsBookmarked: boolean;
  className?: string;
  label?: string; // Optional text next to icon
};

export function BookmarkButton({ businessSlug, initialIsBookmarked, className = "", label }: Props) {
  const [isPending, startTransition] = useTransition();
  
  // React 19 useOptimistic
  const [optimisticBookmarked, addOptimisticBookmark] = useOptimistic(
    initialIsBookmarked,
    (state: boolean, update: boolean) => update
  );

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // prevent card clicks
    
    startTransition(async () => {
      const nextState = !optimisticBookmarked;
      addOptimisticBookmark(nextState);
      
      const result = await toggleBookmark(businessSlug);
      if (!result.ok) {
        toast.error(result.error);
        // useOptimistic will automatically revert to initialIsBookmarked when the action finishes
        // if the action didn't mutate the underlying server state (since the server re-renders initialIsBookmarked on next load,
        // but wait, if it fails we don't have a revalidation, so React handles reverting the optimistic state because the transition finishes without server state change).
      } else {
        if (result.bookmarked) {
          toast.success("ذخیره شد");
        } else {
          toast.success("از ذخیره‌ها حذف شد");
        }
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`flex items-center justify-center gap-2 rounded-full transition-colors ${className}`}
      aria-label={optimisticBookmarked ? "حذف از ذخیره‌ها" : "ذخیره"}
    >
      {optimisticBookmarked ? (
        <BookmarkFilledIcon className="w-5 h-5 text-mint-400" />
      ) : (
        <BookmarkIcon className="w-5 h-5 text-white/70 hover:text-white" />
      )}
      {label && <span>{label}</span>}
    </button>
  );
}
