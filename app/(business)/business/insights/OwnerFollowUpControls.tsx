"use client";
import { useActionState } from "react";
import { cancelImprovementAction, measureImprovementAction } from "./actions";
import type { OwnerImprovementAction } from "@/lib/data/owner-decision-workspace";
import { BTN_PRIMARY, GLASS } from "@/components/ui/styles";

export function OwnerFollowUpControls({businessId,action}: {businessId:string;action:OwnerImprovementAction}) {
  const [measurement,measure,pending] = useActionState(measureImprovementAction,{status:"idle" as const});
  const [cancellation,cancel,cancelling] = useActionState(cancelImprovementAction,{status:"idle" as const});
  return <div className={`${GLASS} p-5`}>
    <p className="text-base leading-8 text-muted">در تاریخ سنجش، تجربه‌های معتبرِ بازهٔ بعد با همان نسخهٔ تحلیل مقایسه می‌شوند. کمتر از سه تجربه به نتیجه تبدیل نمی‌شود.</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <form action={measure}><input type="hidden" name="businessId" value={businessId}/><input type="hidden" name="actionId" value={action.id}/><button className={`${BTN_PRIMARY} px-5 py-3`} disabled={pending || cancelling}>{pending ? "در حال سنجش…" : "سنجش و ثبت مشاهده"}</button></form>
      <form action={cancel}><input type="hidden" name="businessId" value={businessId}/><input type="hidden" name="actionId" value={action.id}/><button className="min-h-11 rounded-xl border border-glass-border px-5 text-base text-muted" disabled={pending || cancelling}>لغو اقدام</button></form>
    </div>
    {measurement.message && <p role={measurement.status === "error" ? "alert" : "status"} className="mt-3 text-base leading-8">{measurement.message}</p>}
    {cancellation.message && <p role={cancellation.status === "error" ? "alert" : "status"} className="mt-3 text-base leading-8">{cancellation.message}</p>}
  </div>;
}

export function OwnerMeasuredResult({action}: {action:OwnerImprovementAction}) {
  const observation = action.measurement;
  if (!observation) return null;
  const percent = (n:number) => `${(n*100).toLocaleString("fa-IR",{maximumFractionDigits:1})}٪`;
  return <article className={`${GLASS} p-5`} aria-label="مشاهدهٔ بعد از اقدام">
    <h3 className="text-lg font-bold">{action.title} — مشاهده ثبت شد</h3>
    <p className="mt-2 text-base leading-8">قبل: {percent(action.baselineNegativeRate)} · بعد: {percent(observation.negativeRate)} · هدف: {percent(action.targetNegativeRate)}</p>
    <p className="text-base leading-8 text-muted">بعد: {observation.negativeMentions.toLocaleString("fa-IR")} اشارهٔ منفی در {observation.reviewCount.toLocaleString("fa-IR")} تجربهٔ معتبر. {observation.negativeRate <= action.targetNegativeRate ? "هدف مشاهده‌شده به دست آمد." : "هدف مشاهده‌شده به دست نیامد."}</p>
    <p className="mt-2 text-sm leading-7 text-muted">این تفاوت می‌تواند از ترکیب مشتریان و حجم داده هم تأثیر بگیرد؛ اثر قطعی اقدام را ثابت نمی‌کند. نسخهٔ تحلیل: {action.modelVersion}</p>
  </article>;
}
