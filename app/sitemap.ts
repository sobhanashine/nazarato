import type { MetadataRoute } from "next";
import { IS_STAGING, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  if (IS_STAGING) return [];
  // Expand only after the content of each destination is ready for indexing.
  return [{ url: `${SITE_URL}/` }];
}
