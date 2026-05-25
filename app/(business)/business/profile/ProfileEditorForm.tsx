"use client";

import { useActionState, useId, useState } from "react";
import Image from "next/image";
import { BTN_PRIMARY, GLASS } from "@/components/ui/styles";
import {
  updateBusinessProfile,
  type ProfileActionState,
} from "./actions";

interface ProfileEditorFormProps {
  business: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    contact: { website?: string; phone?: string; instagram?: string };
    hours: { day: string; value: string }[];
    logoUrl: string | null;
    coverUrl: string | null;
  };
}

const DESCRIPTION_MAX = 1500;

export function ProfileEditorForm({ business }: ProfileEditorFormProps) {
  const [state, formAction, pending] = useActionState<ProfileActionState, FormData>(
    updateBusinessProfile,
    { status: "idle" },
  );

  const [description, setDescription] = useState(business.description ?? "");
  const [logoPreview, setLogoPreview] = useState<string | null>(business.logoUrl);
  const [coverPreview, setCoverPreview] = useState<string | null>(business.coverUrl);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeCover, setRemoveCover] = useState(false);

  const hoursDefault = business.hours.map((h) => `${h.day} | ${h.value}`).join("\n");

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setRemoveLogo(false);
    setLogoPreview(URL.createObjectURL(f));
  };
  const onCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setRemoveCover(false);
    setCoverPreview(URL.createObjectURL(f));
  };

  return (
    <form action={formAction} className="space-y-6" encType="multipart/form-data">
      <input type="hidden" name="businessId" value={business.id} />

      {/* Description ------------------------------------------------------ */}
      <Section title="درباره‌ی کسب‌وکار">
        <Field
          label="توضیحات صفحه"
          hint={`${(DESCRIPTION_MAX - description.length).toLocaleString("fa-IR")} کاراکتر باقی‌مانده`}
          error={state.fieldErrors?.description}
        >
          {(id) => (
            <textarea
              id={id}
              name="description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={DESCRIPTION_MAX}
              placeholder="چه می‌فروشید، چه چیزی شما را خاص می‌کند، و مخاطب شما کیست؟"
              className="w-full rounded-2xl border border-glass-border bg-glass/60 p-3 text-[0.92rem] leading-[1.95] text-strong placeholder:text-muted/70 focus:border-mint/40 focus:outline-none"
            />
          )}
        </Field>
      </Section>

      {/* Contact ---------------------------------------------------------- */}
      <Section title="راه‌های تماس">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="وب‌سایت" error={state.fieldErrors?.website}>
            {(id) => (
              <input
                id={id}
                type="text"
                name="website"
                defaultValue={business.contact.website ?? ""}
                placeholder="example.com"
                dir="ltr"
                className="w-full rounded-2xl border border-glass-border bg-glass/60 px-3 py-2.5 text-[0.92rem] text-strong placeholder:text-muted/70 focus:border-mint/40 focus:outline-none"
              />
            )}
          </Field>
          <Field label="تلفن" error={state.fieldErrors?.phone}>
            {(id) => (
              <input
                id={id}
                type="text"
                name="phone"
                defaultValue={business.contact.phone ?? ""}
                placeholder="۰۲۱۱۲۳۴۵۶۷۸"
                className="w-full rounded-2xl border border-glass-border bg-glass/60 px-3 py-2.5 text-[0.92rem] text-strong placeholder:text-muted/70 focus:border-mint/40 focus:outline-none"
              />
            )}
          </Field>
          <Field label="اینستاگرام" hint="بدون @" error={state.fieldErrors?.instagram}>
            {(id) => (
              <input
                id={id}
                type="text"
                name="instagram"
                defaultValue={business.contact.instagram ?? ""}
                placeholder="your_handle"
                dir="ltr"
                className="w-full rounded-2xl border border-glass-border bg-glass/60 px-3 py-2.5 text-[0.92rem] text-strong placeholder:text-muted/70 focus:border-mint/40 focus:outline-none"
              />
            )}
          </Field>
        </div>
      </Section>

      {/* Hours ------------------------------------------------------------ */}
      <Section title="ساعات کاری" subtitle="هر خط یک ردیف، با قالب «روز | ساعت». مثال: شنبه تا چهارشنبه | ۸ تا ۲۳">
        <Field label="جدول ساعات" error={state.fieldErrors?.hours}>
          {(id) => (
            <textarea
              id={id}
              name="hours"
              rows={4}
              defaultValue={hoursDefault}
              placeholder={"شنبه تا چهارشنبه | ۸ تا ۲۳\nپنجشنبه و جمعه | ۹ تا ۲۴"}
              className="w-full rounded-2xl border border-glass-border bg-glass/60 p-3 text-[0.92rem] leading-[1.95] text-strong placeholder:text-muted/70 focus:border-mint/40 focus:outline-none"
            />
          )}
        </Field>
      </Section>

      {/* Photos ----------------------------------------------------------- */}
      <Section
        title="تصاویر"
        subtitle="JPEG، PNG یا WebP — حداکثر ۳ مگابایت."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <PhotoSlot
            kind="logo"
            label="لوگو"
            preview={logoPreview}
            removeFlagName="removeLogo"
            removed={removeLogo}
            onRemove={() => {
              setRemoveLogo(true);
              setLogoPreview(null);
            }}
            onChange={onLogoChange}
          />
          <PhotoSlot
            kind="cover"
            label="بنر صفحه"
            preview={coverPreview}
            removeFlagName="removeCover"
            removed={removeCover}
            onRemove={() => {
              setRemoveCover(true);
              setCoverPreview(null);
            }}
            onChange={onCoverChange}
          />
        </div>
      </Section>

      {state.status === "error" && state.message ? (
        <p role="alert" className="text-[0.85rem] text-rose-300">{state.message}</p>
      ) : null}
      {state.status === "ok" && state.message ? (
        <p role="status" className="text-[0.85rem] text-mint">{state.message}</p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className={`${BTN_PRIMARY} px-5 py-2.5 text-[0.92rem] disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {pending ? "در حال ذخیره…" : "ذخیره تغییرات"}
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${GLASS} space-y-4 p-5 sm:p-6`}>
      <header>
        <h2 className="text-[1.05rem] font-black text-strong">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-[0.78rem] leading-[1.85] text-muted">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[0.82rem] font-semibold text-strong">
        {label}
      </label>
      {children(id)}
      {error ? (
        <p role="alert" className="text-[0.72rem] text-rose-300">{error}</p>
      ) : hint ? (
        <p className="text-[0.72rem] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function PhotoSlot({
  kind,
  label,
  preview,
  removeFlagName,
  removed,
  onRemove,
  onChange,
}: {
  kind: "logo" | "cover";
  label: string;
  preview: string | null;
  removeFlagName: string;
  removed: boolean;
  onRemove: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const inputId = useId();
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-[0.82rem] font-semibold text-strong">
        {label}
      </label>
      <div
        className={`relative flex items-center justify-center overflow-hidden rounded-2xl border border-glass-border bg-glass/50 ${
          kind === "cover" ? "h-32" : "h-32"
        }`}
      >
        {preview ? (
          <Image
            src={preview}
            alt={label}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <span className="text-[0.78rem] text-muted">بدون تصویر</span>
        )}
      </div>
      <input
        id={inputId}
        type="file"
        name={kind}
        accept="image/jpeg,image/png,image/webp"
        onChange={onChange}
        className="block w-full text-[0.78rem] text-muted file:me-3 file:rounded-full file:border-0 file:bg-mint/15 file:px-3 file:py-1.5 file:text-[0.78rem] file:font-bold file:text-mint hover:file:bg-mint/25"
      />
      {preview ? (
        <button
          type="button"
          onClick={onRemove}
          className="text-[0.72rem] font-semibold text-rose-300 hover:text-rose-200"
        >
          حذف تصویر فعلی
        </button>
      ) : null}
      <input type="hidden" name={removeFlagName} value={removed ? "1" : "0"} />
    </div>
  );
}
