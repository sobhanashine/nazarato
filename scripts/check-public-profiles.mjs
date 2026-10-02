import assert from 'node:assert/strict';

// Run against the production Worker runtime, without any auth cookies.
// A streamed not-found can be HTTP 200; the page and noindex boundary must still be present.
const base = new URL(process.argv[2] ?? 'http://127.0.0.1:3020');
const failures = [];
for (const path of ['/company/__unpublished_runtime_check__', '/shop/__unpublished_runtime_check__']) {
  const response = await fetch(new URL(path, base), { redirect: 'error' });
  const body = await response.text();
  try {
    assert.ok(response.status < 500, `${path}: HTTP ${response.status}`);
    assert.ok(body.includes('صفحه پیدا نشد'), `${path}: branded not-found is missing`);
    assert.ok(body.includes('NEXT_HTTP_ERROR_FALLBACK;404') || response.status === 404, `${path}: missing 404 boundary`);
    assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/);
    console.log(`PASS ${path}: HTTP ${response.status}, not-found, noindex`);
  } catch (error) {
    failures.push(error.message);
  }
}
assert.equal(failures.length, 0, failures.join('\n'));
