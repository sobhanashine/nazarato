import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { categories } from "@/lib/data/categories";

export function Categories() {
  return (
    <section className="section-wrap section-wrap--lead">
      <div className="container">
        <div className="section-head">
          <h2>دسته‌بندی‌ها</h2>
          <div className="section-meta">
            <p>مشاهده دسته‌بندی‌های پربازدید.</p>
            <Link href="/categories" className="see-all">
              <span>تمامی دسته‌بندی‌ها</span>
              <ArrowLeftIcon />
            </Link>
          </div>
        </div>

        <div className="grid-4">
          {categories.map((c) => (
            <Link key={c.href} href={c.href} className="cat-card">
              <div className="cat-icon-wrap">
                {c.icon}
                <div className="cat-icon-bg" />
              </div>
              <h5>{c.title}</h5>
              <p>{c.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
