import Image from "next/image";
import Link from "next/link";
import { GLASS } from "@/components/ui/styles";
import { getLatestPosts } from "@/lib/data/blog-posts";

export function BlogSidebar() {
  const guides = getLatestPosts(3);
  return (
    <aside className="hidden min-w-0 flex-col gap-5 lg:flex" aria-label="راهنما و مسیرهای مرتبط">
      <section className={`${GLASS} p-5`}>
        <h2 className="mb-4 text-lg font-bold text-strong">راهنماهای نظراتو</h2>
        <div className="divide-y divide-glass-border">
          {guides.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="flex min-h-11 items-start gap-3 py-4 text-sm font-semibold leading-7 text-strong hover:text-forest">
              {post.image && <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-glass-border"><Image src={post.image} alt="" fill sizes="56px" className="object-cover" /></span>}
              <span className="min-w-0">{post.title}</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="border-t border-glass-border pt-5">
        <h2 className="text-base font-bold text-strong">صاحب یک کافه یا رستورانی؟</h2>
        <p className="mt-2 text-sm leading-7 text-muted">مسیر شنیدن تجربهٔ مشتری و گفت‌وگو دربارهٔ همکاری را ببین.</p>
        <Link href="/for-business" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-forest">برای کسب‌وکارها ←</Link>
      </section>
    </aside>
  );
}
