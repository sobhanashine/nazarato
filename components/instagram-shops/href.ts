/** Generates Instagram shops URLs maintaining current state. */
export function instagramShopsHref(params: {
  niche?: string;
  sort?: string;
  page?: number;
}) {
  const search = new URLSearchParams();
  if (params.niche && params.niche !== "all") {
    search.set("niche", params.niche);
  }
  if (params.sort && params.sort !== "rating") {
    search.set("sort", params.sort);
  }
  if (params.page && params.page !== 1) {
    search.set("page", params.page.toString());
  }
  const qs = search.toString();
  return qs ? `/instagram-shops?${qs}` : "/instagram-shops";
}
