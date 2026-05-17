import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { blogPosts } from "@/lib/data/blog-posts";

export function Blog() {
  return (
    <section className="section-wrap">
      <div className="container">
        <div className="section-head">
          <h2>بلاگ ما</h2>
          <div className="section-meta">
            <p>ببین این مطالب بدردت میخوره یا نه.</p>
            <Link href="/blog" className="see-all">
              <span>تمامی بلاگ‌ها</span>
              <ArrowLeftIcon />
            </Link>
          </div>
        </div>
      </div>

      <div className="blog-scroll hide-scroll">
        <div className="blog-scroll-inner">
          {blogPosts.map((b) => (
            <Link key={b.href} href={b.href} className="blog-card">
              <div className="blog-img">
                <Image src={b.image} alt={b.title} width={400} height={300} />
              </div>
              <div className="blog-body">
                <p className="blog-date">{b.date}</p>
                <h5 className="blog-title">{b.title}</h5>
                <p className="blog-excerpt">{b.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
