import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Expand only after the content of each destination is ready for indexing.
  return [{ url: `${SITE_URL}/` }];
}
