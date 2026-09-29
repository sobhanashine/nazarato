"use client";

import { useCallback, useEffect, useState } from "react";
import {
  experienceKey, filterGolsarCafes, parseLocalExperience, submitLocalPreviewReview,
  type GolsarCafe, type LocalExperience,
} from "@/lib/preview/golsar";

import { ReviewSheet } from "@/components/review/ReviewSheet";

const fa = (n: number) => n.toLocaleString("fa-IR");
const areas = ["", "توحید", "امام علی", "گلسار", "دیلمان"];
const focus = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint";
const button = `min-h-11 rounded-2xl border border-white/15 px-4 py-2 text-sm transition-colors hover:bg-white/10 ${focus}`;
const primary = `min-h-12 rounded-2xl bg-mint px-6 py-3 font-bold text-[#062a20] transition-colors hover:bg-[#8af1ca] ${focus}`;

function CafeMark({ name, large = false }: { name: string; large?: boolean }) {
  const letter = name.replace(/کافه|coffee|cafe/gi, "").replace(/[^\p{L}\p{N}]/gu, "").charAt(0) || "ک";
  return <div aria-hidden="true" className={`${large ? "h-24 w-24 rounded-[28px] text-5xl" : "h-14 w-14 rounded-2xl text-2xl"} grid shrink-0 place-items-center border border-mint/20 bg-mint/10 font-black text-mint`}>{letter}</div>;
}

function ExperiencePanel({ cafe }: { cafe: GolsarCafe }) {
  const [saved, setSaved] = useState<LocalExperience | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [openKey, setOpenKey] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const closeSheet = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(experienceKey(cafe.id));
      const value = parseLocalExperience(raw, cafe.id);
      setSaved(value);
      if (raw && !value) setError("نسخهٔ ذخیره‌شده قابل خواندن نیست؛ می‌توانی تجربهٔ تازه‌ای جایگزینش کنی.");
    } catch {
      setError("مرورگر دسترسی به ذخیره‌سازی را نمی‌دهد. برای نگه‌داشتن تجربه، این دسترسی لازم است.");
    }
    setLoaded(true);
  }, [cafe.id]);

  function openSheet() {
    setOpenKey(key => key + 1); setIsOpen(true); setNotice(""); setConfirmDelete(false);
  }

  async function submit(_previous: { ok: boolean }, data: FormData) {
    try {
      const result = submitLocalPreviewReview(window.localStorage, cafe.id, data);
      if (!result.ok) return result;
      setSaved(result.value); setError("");
      setNotice("تجربه‌ات در همین مرورگر ذخیره شد؛ عمومی نشده است.");
      return { ok: true };
    } catch {
      return { ok: false, error: "ذخیره انجام نشد؛ فضای مرورگر یا دسترسی ذخیره‌سازی را بررسی کن. متن تو هنوز اینجاست." };
    }
  }

  function remove() {
    try {
      window.localStorage.removeItem(experienceKey(cafe.id));
      setSaved(null); setConfirmDelete(false); setError("");
      setNotice("تجربهٔ ذخیره‌شدهٔ این کافه از مرورگر حذف شد.");
    } catch { setError("حذف انجام نشد؛ مرورگر اجازهٔ تغییر ذخیره‌سازی را نمی‌دهد."); }
  }

  return <section aria-labelledby="experience-title" className="rounded-[28px] border border-white/10 bg-[#101b21] p-6 sm:p-8">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div><p className="mb-2 text-xs font-bold text-mint">صدای تو در نظراتو</p><h2 id="experience-title" className="text-2xl font-bold">تجربه‌ات از این کافه</h2></div>
      <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300">فقط در این مرورگر</span>
    </div>
    {error && <p role="alert" className="mb-5 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm leading-7 text-amber-100">{error}</p>}
    {notice && <p role="status" className="mb-5 text-sm leading-7 text-mint">{notice}</p>}
    {!loaded ? <p className="text-slate-400">در حال خواندن تجربهٔ ذخیره‌شده…</p> : saved ? <div>
      <div className="mb-4 flex flex-wrap items-center gap-3"><span className="rounded-xl bg-mint/10 px-3 py-2 text-mint">امتیاز تو: {fa(saved.rating)} از ۵</span><span className="text-xs text-slate-400">{new Date(saved.updatedAt).toLocaleDateString("fa-IR")}</span></div>
      <p className="whitespace-pre-wrap break-words leading-8 text-slate-100">{saved.body}</p>
      <div className="mt-6 flex flex-wrap gap-3"><button className={button} onClick={openSheet}>ویرایش تجربه</button><button className={`${button} text-rose-200`} onClick={() => setConfirmDelete(true)}>حذف تجربه</button></div>
      {confirmDelete && <div className="mt-5 rounded-xl border border-rose-200/20 p-4"><p className="mb-3 text-sm">تجربهٔ این کافه از همین مرورگر حذف شود؟</p><div className="flex gap-3"><button className={button} onClick={remove}>بله، حذف کن</button><button className={button} onClick={() => setConfirmDelete(false)}>نگه دار</button></div></div>}
    </div> : <div>
      <p className="max-w-lg leading-8 text-slate-300">اگر اینجا رفته‌ای، از تجربه‌ات بنویس. جزئیات کوچک می‌توانند به انتخاب بعدی کمک کنند.</p>
      <button className={`${primary} mt-6`} onClick={openSheet}>نوشتن تجربه</button>
      <p className="mt-4 text-xs leading-6 text-slate-400">هنوز تجربه‌ای برای این کافه در این مرورگر ذخیره نکرده‌ای.</p>
    </div>}
    {openKey > 0 && <ReviewSheet key={openKey} isOpen={isOpen} onClose={closeSheet} prefill={{ slug: cafe.id, name: cafe.name }} businesses={[]} localPreview={{ initialValue: saved ?? undefined, submit }} />}
  </section>;
}

function CafeProfile({ cafe }: { cafe: GolsarCafe }) {
  return <>
    <a href="#" className={`mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-slate-300 hover:text-mint ${focus}`}><span aria-hidden="true">→</span> برگشت به کافه‌ها</a>
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,.8fr)] lg:gap-12">
      <div>
        <div className="flex items-center gap-5"><CafeMark name={cafe.name} large /><div className="min-w-0"><p className="mb-2 text-sm text-mint">رشت · فهرست منتخب گلسار</p><h1 tabIndex={-1} id="cafe-title" className="break-words text-3xl leading-normal font-black outline-none sm:text-4xl">{cafe.name}</h1></div></div>
        <p className="mt-6 text-sm leading-7 text-slate-400">اطلاعات اولیه؛ مالک این صفحه را تأیید نکرده است.</p>
        {cafe.closed && <p className="mt-4 rounded-xl bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">در منبع، بسته‌بودن این مکان گزارش شده؛ وضعیت فعلی نیاز به بررسی دارد.</p>}
        <dl className="mt-8 space-y-6 border-t border-white/10 pt-7">
          <div><dt className="mb-2 text-xs text-slate-400">نشانی ثبت‌شده</dt><dd dir="auto" className="text-start leading-8 text-slate-100">{cafe.address || "نشانی کامل در دادهٔ فعلی موجود نیست."}</dd></div>
          {cafe.phone && <div><dt className="mb-2 text-xs text-slate-400">تلفن ثبت‌شده</dt><dd><a dir="ltr" href={`tel:${cafe.phone}`} className={`inline-block min-h-11 py-2 text-lg hover:text-mint ${focus}`}>{cafe.phone}</a></dd></div>}
        </dl>
        <div className="mt-6 flex flex-wrap gap-3"><a className={button} href={`https://www.google.com/maps/search/?api=1&query=${cafe.latitude},${cafe.longitude}`} target="_blank" rel="noopener noreferrer">نمایش روی نقشه ↗</a>{cafe.instagram && <a className={button} href={cafe.instagram} target="_blank" rel="noopener noreferrer">اینستاگرام ↗</a>}</div>
        <details className="mt-9 rounded-2xl border border-white/10 p-5 text-sm">
          <summary className={`cursor-pointer text-slate-300 ${focus}`}>دربارهٔ اطلاعات این صفحه</summary>
          <div className="mt-4 space-y-3 leading-7 text-slate-400"><p>دادهٔ اولیه از Google Maps از طریق Apify؛ برداشت {new Date(cafe.capturedAt).toLocaleDateString("fa-IR")}.</p><p>این پیش‌نمایش خصوصی است. ساعت کار، قیمت، عکس و امتیاز مشتریان به این صفحه اضافه نشده‌اند.</p>{cafe.categoryNote && <p>{cafe.categoryNote}</p>}{cafe.plusCodes.length > 0 && <p>کد موقعیت <span dir="ltr" className="inline-block text-slate-200">{cafe.plusCodes.join(" / ")}</span> به‌همراه شهر رشت محل را مشخص می‌کند؛ کدپستی نیست.</p>}<a href={cafe.sourceUrl} target="_blank" rel="noopener noreferrer" className={`inline-block text-mint underline underline-offset-4 ${focus}`}>دیدن رکورد منبع ↗</a></div>
        </details>
      </div>
      <div><ExperiencePanel key={cafe.id} cafe={cafe} /></div>
    </div>
  </>;
}

export function GolsarPreview({ cafes }: { cafes: GolsarCafe[] }) {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [invalidLink, setInvalidLink] = useState(false);
  const selected = cafes.find(cafe => cafe.id === selectedId);
  const filtered = filterGolsarCafes(cafes, query, area);

  useEffect(() => {
    function syncHash() {
      let id = "";
      try { id = decodeURIComponent(window.location.hash.replace(/^#cafe\//, "")); } catch { /* Invalid hash has no matching record. */ }
      if (window.location.hash === "" || window.location.hash === "#") id = "";
      const valid = cafes.some(cafe => cafe.id === id);
      setSelectedId(valid ? id : ""); setInvalidLink(Boolean(id) && !valid);
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    syncHash(); window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [cafes]);
  useEffect(() => { if (selectedId) document.getElementById("cafe-title")?.focus({ preventScroll: true }); }, [selectedId]);

  return <div className="relative z-10 min-h-screen bg-[#091317] text-[#f1f3ed]">
    <div className="border-b border-mint/15 bg-mint/5 px-5 py-3 text-center text-xs leading-6 text-[#bbd8cf]">پیش‌نمایش محلی نظراتو · اطلاعات اولیهٔ کافه‌ها · تجربه‌ها فقط در همین مرورگر ذخیره می‌شوند</div>
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 border-b border-white/10 px-5 py-6 sm:px-8"><a href="#" className={`text-2xl font-black tracking-tight ${focus}`} aria-label="نظراتو؛ فهرست کافه‌ها">نظراتو<span className="text-mint">.</span></a><span className="rounded-full border border-white/15 px-4 py-2 text-xs text-slate-300">رشت / گلسار</span></header>
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      {selected ? <CafeProfile cafe={selected} /> : <>
        <section className="mb-10 grid items-end gap-7 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div><p className="mb-4 text-sm font-bold text-mint">از همین حوالی شروع کنیم</p><h1 className="max-w-2xl text-3xl leading-[1.6] font-black sm:text-5xl">کافه‌های گلسار،<br />از نگاه تو.</h1><p className="mt-4 max-w-xl text-sm leading-8 text-slate-300 sm:text-base">کافه را پیدا کن، اطلاعاتش را ببین و تجربه‌ات را بنویس.<br className="hidden sm:block" /> شروع ما با سایه، وک و آوند است.</p></div>
          <div className="flex items-center gap-4 border-s border-mint/30 ps-5 sm:block sm:ps-8"><span className="block text-5xl font-light text-[#d6e8c9]">{fa(cafes.length)}</span><p className="text-xs leading-6 text-slate-400 sm:mt-3">کافه در فهرست اولیه<br />پوشش محله هنوز کامل نیست</p></div>
        </section>
        <section aria-label="پیداکردن کافه" className="mb-8 rounded-[24px] border border-white/10 bg-[#101b21] p-5 sm:p-6">
          <label htmlFor="cafe-search" className="mb-3 block text-sm font-bold">دنبال کدام کافه‌ای؟</label>
          <div className="relative"><input id="cafe-search" type="search" autoComplete="off" value={query} onChange={event => setQuery(event.target.value)} placeholder="نام کافه یا خیابان؛ مثلاً وک یا توحید" className={`min-h-14 w-full rounded-2xl border border-white/20 bg-[#091317] px-4 text-sm placeholder:text-slate-500 sm:text-base ${focus}`} /></div>
          <div aria-label="محدودهٔ نشانی" className="mt-4 flex flex-wrap gap-2">{areas.map(value => <button key={value} type="button" aria-pressed={area === value} onClick={() => setArea(value)} className={`min-h-11 rounded-full border px-4 text-xs ${focus} ${area === value ? "border-mint/50 bg-mint/10 text-mint" : "border-white/10 text-slate-300 hover:border-white/30"}`}>{value || "همهٔ محدوده‌ها"}</button>)}</div>
        </section>
        {invalidLink && <p role="alert" className="mb-6 text-sm text-amber-100">این کافه در پیش‌نمایش پیدا نشد؛ از فهرست انتخاب کن.</p>}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">{query || area ? "نتیجهٔ جست‌وجو" : "کافه‌ها را ببین"}</h2><p role="status" className="text-xs text-slate-400">{fa(filtered.length)} کافه · ترتیب شروع، بدون رتبه‌بندی</p></div>
        {filtered.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filtered.map(cafe => <a key={cafe.id} href={`#cafe/${encodeURIComponent(cafe.id)}`} aria-label={`دیدن ${cafe.name}`} className={`group flex min-h-56 flex-col rounded-[24px] border border-white/10 bg-[#101b21] p-6 transition-colors hover:border-mint/50 hover:bg-[#122329] ${focus}`}>
          <div className="mb-5 flex items-center justify-between gap-3"><CafeMark name={cafe.name} />{cafe.priority <= 3 ? <span className="rounded-full bg-[#d6e8c9]/10 px-3 py-1.5 text-xs text-[#d6e8c9]">برای شروع</span> : <span className="text-xs text-slate-500">گلسار و اطراف</span>}</div>
          <h3 className="text-lg leading-8 font-bold group-hover:text-mint">{cafe.name}</h3><p dir="auto" className="mt-2 line-clamp-2 text-start text-xs leading-7 text-slate-400">{cafe.street || cafe.address || "نشانی نیاز به تکمیل دارد"}</p>
          <div className="mt-auto flex items-center justify-between gap-2 pt-6 text-xs"><span className="text-slate-400">{cafe.closed ? "وضعیت فعالیت نیازمند بررسی" : "اطلاعات و تجربهٔ تو"}</span><span aria-hidden="true" className="text-lg text-mint">↖</span></div>
        </a>)}</div> : <div className="rounded-[24px] border border-dashed border-white/20 p-10 text-center"><h3 className="text-xl font-bold">کافه‌ای با این جست‌وجو پیدا نشد</h3><p className="mt-3 text-sm leading-7 text-slate-400">املای دیگری را امتحان کن یا محدوده را تغییر بده.</p><button className={`${button} mt-6`} onClick={() => { setQuery(""); setArea(""); }}>پاک‌کردن جست‌وجو و فیلتر</button></div>}
      </>}
    </main>
    <footer className="mx-auto mt-8 max-w-6xl border-t border-white/10 px-5 py-7 text-xs leading-7 text-slate-500 sm:px-8">نظراتو · یک شروع محلی برای شناختن تجربه‌ها. این نسخه برای بررسی جریان محصول روی همین دستگاه است.</footer>
  </div>;
}
