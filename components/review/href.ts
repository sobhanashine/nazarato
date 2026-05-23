/** Generates global reviews feed URLs maintaining filter and page state. */
export function reviewsHref(params: {
  rating?: number;
  category?: string;
  ig?: boolean;
  sort?: string;
  page?: number;
}) {
  const search = new URLSearchParams();
  if (params.rating && params.rating > 0) {
    search.set("rating", params.rating.toString());
  }
  if (params.category && params.category !== "all") {
    search.set("category", params.category);
  }
  if (params.ig) {
    search.set("ig", "1");
  }
  if (params.sort && params.sort !== "newest") {
    search.set("sort", params.sort);
  }
  if (params.page && params.page !== 1) {
    search.set("page", params.page.toString());
  }
  const qs = search.toString();
  return qs ? `/reviews?${qs}` : "/reviews";
}
