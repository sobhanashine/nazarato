"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { loadLiveNabzDuel, submitLiveNabzVote, type LiveNabzDuel, type LiveNabzBusiness } from "@/lib/nabz/live-duel-client";
import { REAL_ASPECT_LABELS, parseRealTasteProfile, type RealResult, type RealTasteProfile } from "@/lib/nabz/real-recommendation";
import type { ComparisonScenario } from "@/lib/nabz/vote-contract";
import { BTN_PRIMARY, GLASS } from "@/components/ui/styles";

const SCENARIOS: {id:ComparisonScenario;label:string}[] = [{id:"date",label:"قرار دونفره"},{id:"laptop",label:"کار با لپ‌تاپ"},{id:"budget",label:"انتخاب اقتصادی"},{id:"local-food",label:"غذای محلی"}];
type Phase = "scenario" | "loading" | "voting" | "duel" | "result" | "error";
export function RealNabzJourney({ initialScenario = "date" }: { initialScenario?: ComparisonScenario }) {
  const [scenario,setScenario] = useState<ComparisonScenario>(initialScenario);
  const [phase,setPhase] = useState<Phase>("scenario");
  const [round,setRound] = useState(0);
  const [duel,setDuel] = useState<LiveNabzDuel | null>(null);
  const [reason,setReason] = useState("");
  const [error,setError] = useState("");
  const [result,setResult] = useState<RealResult | null>(null);
  const [restored,setRestored] = useState<RealTasteProfile | null>(null);
  const [restoreMessage,setRestoreMessage] = useState("");
  const [saved,setSaved] = useState(false);
  const [saving,setSaving] = useState(false);
  const operation = useRef(0);

  useEffect(() => {
    let current = true;
    fetch("/api/nabz/result",{cache:"no-store"}).then(async response => {
      if (response.status === 401) return;
      if (!response.ok) throw new Error();
      const body = await response.json() as {profile?:unknown};
      if (current) setRestored(parseRealTasteProfile(body.profile));
    }).catch(() => { if (current) setRestoreMessage("بازیابی سلیقه فعلاً ممکن نیست؛ می‌توانی جلسهٔ تازه‌ای شروع کنی."); });
    return () => {current=false; operation.current += 1;};
  },[]);

  async function load(nextRound:number, selected = scenario) {
    const current = ++operation.current;
    setPhase("loading"); setError("");
    const response = await loadLiveNabzDuel(selected,nextRound);
    if (current !== operation.current) return;
    if (!response.ok) {setPhase("error");setError(response.reason === "insufficient_supply" ? "داده کافی نداریم؛ برای پنج انتخاب بدون تکرار حداقل چهار مکان تأییدشده لازم است." : "دریافت مکان‌ها فعلاً ممکن نیست؛ دوباره تلاش کن.");return;}
    setDuel(response.duel);setRound(nextRound);setPhase("duel");
  }
  async function payoff(save = false) {
    setError(""); if (save) setSaving(true); else setPhase("loading");
    try {
      const response = await fetch("/api/nabz/result",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({scenario,save}),cache:"no-store"});
      const body = await response.json() as {ok?:boolean;message?:string;result?:RealResult;saved?:boolean};
      if (!response.ok || !body.ok || !body.result || !parseRealTasteProfile(body.result.profile)) throw new Error(body.message || "نتیجه فعلاً در دسترس نیست؛ انتخاب‌ها محفوظ‌اند.");
      setResult(body.result);setSaved(body.saved === true);setPhase("result");
    } catch (cause) {setError(cause instanceof Error ? cause.message : "دریافت نتیجه ممکن نیست."); if (!save) setPhase("error");}
    finally {setSaving(false);}
  }
  async function choose(winner:LiveNabzBusiness) {
    if (!duel || phase !== "duel") return;
    const loser = duel.options.find(b => b.id !== winner.id);if (!loser) return;
    setPhase("voting");setError("");
    const response = await submitLiveNabzVote({scenario,winnerBusinessId:winner.id,loserBusinessId:loser.id,...(reason.trim()?{reasonText:reason.trim()}:{})});
    if (!response.ok) {setError("ثبت نشد؛ متن و انتخاب این مرحله محفوظ است. دوباره تلاش کن.");setPhase("duel");return;}
    setReason("");const next=round+1;setRound(next);
    if (next === 5) await payoff();else await load(next);
  }

  return <section className="max-w-3xl" aria-label="انتخاب و پیشنهاد محلی">
    {restored && phase === "scenario" && <div className={`${GLASS} mb-5 p-5`}><h2 className="text-lg font-bold">سلیقهٔ خصوصی ذخیره‌شده</h2><p className="mt-2 text-base leading-8 text-muted">بر اساس پنج انتخاب در {SCENARIOS.find(s=>s.id===restored.scenario)?.label} · فقط برای حساب تو. برای پیشنهاد تازه، یک جلسهٔ تازه شروع کن.</p></div>}
    {restoreMessage && <p className="mb-4 text-base leading-8 text-muted" role="status">{restoreMessage}</p>}
    {phase === "scenario" && <><h2 className="text-xl font-bold">برای چه موقعیتی انتخاب می‌کنی؟</h2><div className="mt-4 grid grid-cols-2 gap-3">{SCENARIOS.map(s=><button type="button" key={s.id} aria-pressed={scenario === s.id} className={`${GLASS} min-h-20 px-4 py-4 text-base font-semibold transition-colors hover:border-mint/50 ${scenario === s.id ? "border-mint/40 bg-mint/10 text-mint" : "text-strong"}`} onClick={()=>{setScenario(s.id);setRound(0);setSaved(false);setResult(null);void load(0,s.id);}}>{s.label}</button>)}</div><p className="mt-4 text-base leading-8 text-muted">فقط بین مکان‌هایی انتخاب کن که می‌شناسی. برای شروع نیاز به ورود نیست؛ سلیقه و رأی خام برای مالکان نمایش داده نمی‌شود.</p></>}
    {phase === "loading" && <p role="status" className="py-8 text-lg leading-9">{round === 5 ? "ساخت نتیجه از شواهد واقعی…" : "آماده‌سازی انتخاب بعد…"}</p>}
    {(phase === "duel" || phase === "voting") && duel && <>
      <p className="text-sm text-muted">انتخاب {(round+1).toLocaleString("fa-IR")} از ۵ · {SCENARIOS.find(s=>s.id===scenario)?.label}</p>
      <h2 className="mt-2 text-xl font-bold leading-9">{duel.prompt}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">{duel.options.map(place=><button data-testid="real-duel-option" key={place.id} type="button" disabled={phase === "voting"} onClick={()=>void choose(place)} className={`${GLASS} min-h-32 p-5 text-right hover:border-forest disabled:opacity-60`}><span className="block text-sm text-muted">{place.kind}</span><strong className="mt-2 block text-lg">{place.name}</strong><span className="mt-3 block text-sm font-semibold text-forest">انتخاب می‌کنم</span></button>)}</div>
      <label className="mt-5 block text-base leading-8" htmlFor="real-choice-reason">دلیل کوتاه (اختیاری)</label><textarea id="real-choice-reason" maxLength={120} value={reason} disabled={phase === "voting"} onChange={event=>setReason(event.target.value)} rows={2} className="w-full rounded-xl border border-glass-border bg-paper px-4 py-3 text-base"/>
    </>}
    {phase === "result" && result && <>
      <h2 className="text-xl font-bold">پنج انتخاب کامل شد؛ سلیقهٔ اولیهٔ تو</h2>
      <p className="mt-3 text-base leading-8 text-muted">{result.profile.signalCount ? "وزن‌ها از موقعیت و تفاوتِ شواهد مکان‌های انتخاب‌شده ساخته شدند." : "فعلاً فقط موقعیت و انتخاب‌ها مشخص‌اند؛ هنوز نمی‌توان ویژگی‌های سلیقه را از شاهد کافی یاد گرفت."}</p>
      <p className="mt-3 text-base leading-8" role="status">{result.message}</p>
      <div className="mt-5 space-y-4">{result.recommendations.map(recommendation=><article key={recommendation.businessId} className={`${GLASS} p-5`}><h3 className="text-lg font-bold">{recommendation.name}</h3>{recommendation.signals.map(signal=><div key={signal.aspect} className="mt-3"><p className="text-base leading-8">{REAL_ASPECT_LABELS[signal.aspect]} · {signal.authorCount.toLocaleString("fa-IR")} تجربهٔ مستقل · اطمینان اولیه {(signal.confidence*100).toLocaleString("fa-IR",{maximumFractionDigits:0})}٪</p><ul className="mt-2 space-y-2">{signal.citations.map(citation=><li key={citation.reviewId} className="border-s-2 border-glass-border ps-3 text-sm leading-7"><q>{citation.excerpt}</q> <Link className="text-mint underline underline-offset-4" href={`/company/${recommendation.slug}?review=${citation.reviewId}`}>بررسی تجربه</Link></li>)}</ul></div>)}<p className="mt-3 text-sm leading-7 text-muted">از این شواهد، امکاناتی مثل وای‌فای یا اصالت غذای محلی را نتیجه نمی‌گیریم؛ اطلاعات لازم را پیش از رفتن بررسی کن.</p></article>)}</div>
      <button type="button" className={`${BTN_PRIMARY} mt-5 px-5 py-3`} disabled={saving || saved} onClick={()=>void payoff(true)}>{saved ? "در حساب خصوصی ذخیره شد" : saving ? "در حال ذخیره…" : "ذخیرهٔ سلیقه در حساب"}</button>
    </>}
    {error && <p role="alert" className="mt-4 text-base leading-8 text-pomegr">{error}</p>}
    {phase === "error" && <button type="button" className={`${BTN_PRIMARY} mt-4 px-5 py-3`} onClick={()=>{if(round===5) void payoff();else void load(round);}}>تلاش دوباره</button>}
    {phase !== "scenario" && phase !== "loading" && phase !== "voting" && <button type="button" className="ms-3 mt-4 min-h-11 rounded-xl border border-glass-border px-5 text-base" onClick={()=>{operation.current+=1;setPhase("scenario");setError("");}}>انتخاب موقعیت دیگر</button>}
  </section>;
}
