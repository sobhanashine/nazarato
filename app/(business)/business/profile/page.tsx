import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { getSession } from "@/lib/auth/session";
import { getOwnedBusinesses } from "@/lib/data/owner";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ProfileEditorForm } from "./ProfileEditorForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ویرایش صفحه — پنل کسب‌وکار | نظراتو",
  description: "ویرایش توضیحات، تماس، ساعات و تصاویر صفحه‌ی کسب‌وکار شما.",
  robots: { index: false },
};

type SearchParams = { b?: string };

type BusinessRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  contact: unknown;
  hours: unknown;
  logo_url: string | null;
  cover_url: string | null;
};

function asContact(v: unknown): { website?: string; phone?: string; instagram?: string } {
  if (!v || typeof v !== "object") return {};
  const o = v as Record<string, unknown>;
  return {
    website: typeof o.website === "string" ? o.website : undefined,
    phone: typeof o.phone === "string" ? o.phone : undefined,
    instagram: typeof o.instagram === "string" ? o.instagram : undefined,
  };
}

function asHours(v: unknown): { day: string; value: string }[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is { day: string; value: string } =>
      typeof x === "object" &&
      x !== null &&
      typeof (x as { day?: unknown }).day === "string" &&
      typeof (x as { value?: unknown }).value === "string",
    )
    .map((x) => ({ day: x.day, value: x.value }));
}

export default async function OwnerProfilePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/business/profile");

  const owned = await getOwnedBusinesses(session.id);
  if (owned.length === 0) redirect("/for-business");

  const { b: requested } = await searchParams;
  const active = (requested && owned.find((o) => o.slug === requested)) || owned[0];

  const { data, error } = await supabaseAdmin()
    .from("businesses")
    .select("id, slug, name, description, contact, hours, logo_url, cover_url")
    .eq("id", active.id)
    .single();

  if (error || !data) {
    console.error("[business/profile] load failed", { id: active.id, error: error?.message });
    redirect("/business");
  }
  const row = data as BusinessRow;

  return (
    <main className="space-y-6">
      <Breadcrumb
        items={[
          { label: "خانه", href: "/" },
          { label: "پنل کسب‌وکار", href: "/business" },
          { label: "ویرایش صفحه" },
        ]}
      />

      <header className="space-y-2">
        <h1 className="text-[1.5rem] font-black text-strong sm:text-[1.85rem]">
          ویرایش «{row.name}»
        </h1>
        <p className="text-[0.9rem] leading-[1.9] text-muted">
          تغییرات بلافاصله روی{" "}
          <Link href={`/company/${row.slug}`} className="text-mint hover:underline">
            صفحه‌ی عمومی
          </Link>{" "}
          اعمال می‌شود.
        </p>
      </header>

      <ProfileEditorForm
        business={{
          id: row.id,
          slug: row.slug,
          name: row.name,
          description: row.description,
          contact: asContact(row.contact),
          hours: asHours(row.hours),
          logoUrl: row.logo_url,
          coverUrl: row.cover_url,
        }}
      />
    </main>
  );
}
