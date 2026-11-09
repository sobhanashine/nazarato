/** Shared by server-rendered links and the client-side sort control. */
export function categoryHref(
  slug: string,
  params: { sort?: string; sub?: string; page?: number }
) {
  const url = new URL(`/categories/${slug}`, "http://localhost");
  if (params.sort && params.sort !== "rating") {
    url.searchParams.set("sort", params.sort);
  }
  if (params.sub && params.sub !== "همه") {
    url.searchParams.set("sub", params.sub);
  }
  if (params.page && params.page !== 1) {
    url.searchParams.set("page", params.page.toString());
  }
  return `${url.pathname}${url.search}`;
}
