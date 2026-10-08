import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
assert(urls.length > 100, 'Expected complete tool sitemap');
const descriptions = new Set();
for (const url of urls) {
  const path = new URL(url).pathname;
  const html = await readFile(`dist${path}index.html`, 'utf8');
  assert.equal([...html.matchAll(/<title\b/g)].length, 1, `${path}: duplicate title`);
  assert.equal([...html.matchAll(/name="description"/g)].length, 1, `${path}: duplicate description`);
  assert.equal([...html.matchAll(/rel="canonical"/g)].length, 1, `${path}: duplicate canonical`);
  assert(html.includes(`rel="canonical" href="${url}"`), `${path}: incorrect canonical`);
  const title = html.match(/<title[^>]*>(.*?)<\/title>/s)?.[1];
  assert(title?.includes('ToolKu'), `${path}: title missing ToolKu`);
  const description = html.match(/name="description" content="([^"]+)"/)?.[1];
  assert(description && description.length > 10, `${path}: missing description`);
  descriptions.add(description);
  for (const key of ['og:title', 'og:description', 'og:url', 'og:image', 'twitter:card']) assert(html.includes(`="${key}"`), `${path}: missing ${key}`);
  const graph = JSON.parse(html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/s)[1]);
  assert.equal(graph['@graph'][0].url, url, `${path}: incorrect structured data URL`);
  assert(!/omni.?tools|omnitools\.app|\/usa\//i.test(html), `${path}: old brand or old content`);
}
assert(descriptions.size > urls.length * 0.9, 'Page descriptions must be specific to their content');
const missing = await readFile('dist/404.html', 'utf8');
assert(missing.includes('noindex,follow'));
assert(!missing.includes('rel="canonical"'));
console.log(`SEO verified: ${urls.length} URLs, ${descriptions.size} distinct descriptions, canonical/social/schema tags and noindex 404.`);
