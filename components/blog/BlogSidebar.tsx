import Image from "next/image";
import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { getLatestPosts } from "@/lib/data/blog-posts";
import { blogCategories, blogTags } from "@/lib/data/blog-taxonomies";

export function BlogSidebar() {
  const latest = getLatestPosts(3);

  return (
    <aside className="blog-side">
      <div className="sb-search">
        <input type="text" placeholder="جستجو" />
        <button type="button" aria-label="جستجو">
          <SearchIcon />
        </button>
      </div>

      <div className="sb-box scroll">
        <h4>دسته‌بندی‌ها</h4>
        <ul className="sb-list">
          {blogCategories.map((c, i) => (
            <li key={c}>
              <label htmlFor={`cat-${i}`}>{c}</label>
              <input id={`cat-${i}`} type="checkbox" className="cb" />
            </li>
          ))}
        </ul>
      </div>

      <div className="sb-box scroll">
        <h4>تگ‌ها</h4>
        <ul className="sb-list">
          {blogTags.map((t, i) => (
            <li key={t}>
              <label htmlFor={`tag-${i}`}>{t}</label>
              <input id={`tag-${i}`} type="checkbox" className="cb" />
            </li>
          ))}
        </ul>
      </div>

      <div className="sb-box">
        <h4>جدیدترین‌های بلاگ</h4>
        <div className="sb-latest-list">
          {latest.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="sb-latest-card">
              <div className="thumb">
                <Image src={p.image} alt="" fill sizes="64px" />
              </div>
              <div className="meta">
                <h6>{p.title}</h6>
                <span className="date">{p.date}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
