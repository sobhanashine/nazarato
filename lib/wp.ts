import type { Author, BlogPost } from "@/lib/data/blog-posts";

const WP_API_URL = process.env.WP_API_URL?.replace(/\/+$/, "");
const REVALIDATE = Number(process.env.WP_REVALIDATE_SECONDS ?? 60);

export const isWpEnabled = Boolean(WP_API_URL);

type WpRendered = { rendered: string };

type WpEmbeddedTerm = { id: number; name: string; slug: string; taxonomy: string };
type WpEmbeddedAuthor = { id: number; name: string };
type WpEmbeddedMedia = { id: number; source_url: string; alt_text?: string };

type WpPost = {
  id: number;
  slug: string;
  date: string;
  title: WpRendered;
  excerpt: WpRendered;
  content: WpRendered;
  _embedded?: {
    author?: WpEmbeddedAuthor[];
    "wp:featuredmedia"?: WpEmbeddedMedia[];
    "wp:term"?: WpEmbeddedTerm[][];
  };
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)));
}

function formatPersianDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function firstGrapheme(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "؟";
  const seg = new Intl.Segmenter("fa", { granularity: "grapheme" });
  const iter = seg.segment(trimmed)[Symbol.iterator]();
  const first = iter.next();
  return first.value?.segment ?? trimmed[0];
}

function mapTerms(embedded: WpPost["_embedded"]): { categories: string[]; tags: string[] } {
  const groups = embedded?.["wp:term"] ?? [];
  const categories: string[] = [];
  const tags: string[] = [];
  for (const group of groups) {
    for (const term of group) {
      const name = decodeEntities(term.name);
      if (term.taxonomy === "category") categories.push(name);
      else if (term.taxonomy === "post_tag") tags.push(name);
    }
  }
  return { categories, tags };
}

function mapAuthor(embedded: WpPost["_embedded"]): Author {
  const a = embedded?.author?.[0];
  const name = a ? decodeEntities(a.name) : "نظراتو";
  return { name, initial: firstGrapheme(name) };
}

function mapPost(wp: WpPost): BlogPost {
  const media = wp._embedded?.["wp:featuredmedia"]?.[0];
  const { categories, tags } = mapTerms(wp._embedded);
  const title = decodeEntities(stripHtml(wp.title.rendered));
  const excerpt = decodeEntities(stripHtml(wp.excerpt.rendered));
  return {
    slug: wp.slug,
    title,
    excerpt,
    date: formatPersianDate(wp.date),
    image: media?.source_url ?? "/images/real-images/blog-image.png",
    author: mapAuthor(wp._embedded),
    category: categories[0] ?? "عمومی",
    tags: tags.length > 0 ? tags : categories,
    content: [{ type: "html", html: wp.content.rendered }],
  };
}

async function wpFetch<T>(path: string): Promise<T> {
  if (!WP_API_URL) throw new Error("WP_API_URL is not set");
  const url = `${WP_API_URL}/wp-json/wp/v2/${path}`;
  const res = await fetch(url, { next: { revalidate: REVALIDATE } });
  if (!res.ok) {
    throw new Error(`WP fetch failed (${res.status}) for ${url}`);
  }
  return (await res.json()) as T;
}

export async function fetchPostsFromWp(perPage = 20): Promise<BlogPost[]> {
  const posts = await wpFetch<WpPost[]>(
    `posts?_embed=1&per_page=${perPage}&orderby=date&order=desc`,
  );
  return posts.map(mapPost);
}

export async function fetchPostSlugsFromWp(perPage = 100): Promise<string[]> {
  const posts = await wpFetch<Pick<WpPost, "slug">[]>(
    `posts?_fields=slug&per_page=${perPage}`,
  );
  return posts.map((p) => p.slug);
}

export async function fetchPostBySlugFromWp(slug: string): Promise<BlogPost | null> {
  const posts = await wpFetch<WpPost[]>(
    `posts?_embed=1&slug=${encodeURIComponent(slug)}`,
  );
  const first = posts[0];
  return first ? mapPost(first) : null;
}
