import assert from "node:assert/strict";

// Read-only HTTP regression: run against the local production Worker before release.
const base = new URL(process.argv[2] ?? "http://127.0.0.1:3020");
const canonical = "https://nazarato.ir/";
const failures = [];
let checks = 0;

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"))?.[1];
}

function meta(body, name) {
  return [...body.matchAll(/<meta\b[^>]*>/gi)]
    .filter(([tag]) => attribute(tag, "name") === name)
    .map(([tag]) => attribute(tag, "content") ?? "");
}

function noindex(response, body) {
  assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/i);
  if (response.status === 200) {
    assert.ok(meta(body, "robots").some(value => /noindex/i.test(value)), "missing robots noindex metadata");
  }
}

async function check(path, verify) {
  checks += 1;
  try {
    const response = await fetch(new URL(path, base), {
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    });
    const body = await response.text();
    assert.ok(response.status < 500, `HTTP ${response.status}`);
    await verify(response, body);
    console.log(`PASS ${path}: HTTP ${response.status}`);
    return body;
  } catch (error) {
    failures.push(`${path}: ${error.message}`);
    console.error(`FAIL ${failures.at(-1)}`);
    return "";
  }
}

function document(response, body) {
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/i);
  assert.ok(meta(body, "description").some(value => value.trim()), "missing description");
  assert.doesNotMatch(body.replaceAll('\\"', '"'), /:E\{"digest":"(?!NEXT_HTTP_ERROR_FALLBACK;404)/, "server rendering error in streamed HTML");
}

await check("/", (response, body) => {
  document(response, body);
  assert.doesNotMatch(response.headers.get("x-robots-tag") ?? "", /noindex/i);
  assert.ok(meta(body, "robots").some(value => /\bindex\b/.test(value) && !/noindex/.test(value)));
  const link = [...body.matchAll(/<link\b[^>]*>/gi)].find(([tag]) => attribute(tag, "rel") === "canonical");
  assert.equal(new URL(attribute(link?.[0] ?? "", "href")).href, canonical);
});

const categoryIndex = await check("/categories", (response, body) => {
  document(response, body);
  noindex(response, body);
});
const categories = new Set([
  "/categories/food", "/categories/digital", "/categories/health", "/categories/sports", "/categories/clothing",
  ...[...categoryIndex.matchAll(/href=["'](\/categories\/[a-z-]+)["']/g)].map(match => match[1]),
]);
for (const path of categories) {
  await check(path, (response, body) => {
    document(response, body);
    noindex(response, body);
    if (["food", "digital", "health", "sports"].some(slug => path === `/categories/${slug}`)) {
      assert.ok([...body.matchAll(/<a\b[^>]*>/gi)].some(([tag]) => attribute(tag, "href")?.startsWith(`${path}?sub=`)), "missing server-rendered subcategory links");
    }
  });
}

await check("/categories/food?sort=newest&sub=%DA%A9%D8%A7%D9%81%D9%87&page=2", (response, body) => {
  document(response, body);
  noindex(response, body);
  const links = [...body.matchAll(/<a\b[^>]*>/gi)].map(([tag]) => attribute(tag, "href")?.replaceAll("&amp;", "&"));
  assert.ok(links.some(href => href?.startsWith("/categories/food?sort=newest&sub=") && !href.includes("page=")), "subcategory links must preserve sort and reset pagination");
});

for (const path of ["/about", "/blog"]) {
  await check(path, (response, body) => {
    document(response, body);
    noindex(response, body);
  });
}
for (const path of ["/login", "/admin", "/profile", "/e2e-test/review-sheet", "/preview/golsar"]) {
  await check(path, noindex);
}

await check("/robots.txt", (response, body) => {
  assert.equal(response.status, 200);
  assert.match(body, /^Allow:\s*\/\s*$/m);
  assert.match(body, /^Disallow:\s*\/api\/\s*$/m);
  assert.doesNotMatch(body, /^Disallow:\s*\/\s*$/m);
  assert.match(body, /^Sitemap:\s*https:\/\/nazarato\.ir\/sitemap\.xml\s*$/m);
});
await check("/sitemap.xml", (response, body) => {
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /(?:application|text)\/xml/i);
  assert.deepEqual([...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]), [canonical]);
});

assert.equal(failures.length, 0, `${failures.length}/${checks} checks failed:\n${failures.join("\n")}`);
console.log(`PASS ${checks} HTTP/indexing checks; ${categories.size} categories; sitemap remains home-only.`);
