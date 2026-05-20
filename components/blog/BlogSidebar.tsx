import Image from "next/image";
import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { GLASS } from "@/components/ui/styles";
import { getLatestPosts } from "@/lib/data/blog-posts";
import { blogCategories, blogTags } from "@/lib/data/blog-taxonomies";

// Checkbox — appearance-none square with a CSS-drawn tick on :checked.
const checkbox =
  "appearance-none w-[18px] h-[18px] rounded-[5px] border-[1.5px] border-white/25 bg-glass " +
  "cursor-pointer relative shrink-0 transition-all duration-200 " +
  "checked:border-transparent checked:bg-[linear-gradient(135deg,#5BE6B2,#3FBF92)] " +
  "checked:shadow-[0_0_12px_rgba(91,230,178,0.45)] " +
  "checked:after:content-[''] checked:after:absolute checked:after:left-[5px] checked:after:top-px " +
  "checked:after:w-[5px] checked:after:h-[10px] checked:after:border-solid checked:after:border-[#06231b] " +
  "checked:after:border-r-2 checked:after:border-b-2 checked:after:rotate-45";

function CheckList({ items, idPrefix }: { items: string[]; idPrefix: string }) {
  return (
    <ul className="flex flex-col gap-[0.85rem] list-none">
      {items.map((item, i) => (
        <li key={item} className="flex justify-between items-center px-2">
          <label
            htmlFor={`${idPrefix}-${i}`}
            className="text-[14.5px] leading-[1.75] text-strong opacity-[0.86] font-normal cursor-pointer"
          >
            {item}
          </label>
          <input id={`${idPrefix}-${i}`} type="checkbox" className={checkbox} />
        </li>
      ))}
    </ul>
  );
}

export function BlogSidebar() {
  const latest = getLatestPosts(3);

  return (
    <aside className="w-full hidden lg:flex lg:w-[33%] flex-col gap-8">
      <div className={`${GLASS} relative h-14 px-4`}>
        <input
          type="text"
          placeholder="جستجو"
          className="w-full h-full border-0 outline-none bg-transparent text-[15px] text-strong pl-10 placeholder:text-[#6b7385]"
        />
        <button
          type="button"
          aria-label="جستجو"
          className="absolute top-0 left-2 w-8 h-full border-0 bg-transparent cursor-pointer text-muted flex items-center justify-center hover:text-mint"
        >
          <SearchIcon />
        </button>
      </div>

      <div className={`${GLASS} p-7 max-h-72 overflow-y-auto`}>
        <h4 className="text-[1.15rem] font-bold text-strong mb-5 -tracking-[0.015em]">
          دسته‌بندی‌ها
        </h4>
        <CheckList items={blogCategories} idPrefix="cat" />
      </div>

      <div className={`${GLASS} p-7 max-h-72 overflow-y-auto`}>
        <h4 className="text-[1.15rem] font-bold text-strong mb-5 -tracking-[0.015em]">
          تگ‌ها
        </h4>
        <CheckList items={blogTags} idPrefix="tag" />
      </div>

      <div className={`${GLASS} p-7`}>
        <h4 className="text-[1.15rem] font-bold text-strong mb-5 -tracking-[0.015em]">
          جدیدترین‌های بلاگ
        </h4>
        <div className="flex flex-col gap-4">
          {latest.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="flex items-center gap-4 p-2 rounded-[10px] transition-[background] duration-200 hover:bg-glass-hover"
            >
              <div className="relative w-16 h-16 rounded-[10px] overflow-hidden shrink-0 border border-glass-border">
                <Image src={p.image} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h6 className="text-[14.5px] font-medium leading-[1.45] text-strong mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                  {p.title}
                </h6>
                <span className="text-[0.78rem] text-muted font-normal tabular-nums">
                  {p.date}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
