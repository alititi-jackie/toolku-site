import { createSeo } from '../src/config/seo.mjs';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

// Follow the real tool registry, so unregistered upstream tools are not published.
const visited = new Set();
const routes = new Map();
const categories = new Set();
const translations = JSON.parse(
  await readFile('public/locales/en/translation.json', 'utf8')
);
async function translate(key) {
  const [ns, path] = key.split(':');
  const locale = JSON.parse(
    await readFile(`public/locales/en/${ns}.json`, 'utf8')
  );
  const text = path.split('.').reduce((value, part) => value?.[part], locale);
  if (typeof text !== 'string' || !text.trim())
    throw new Error(`Missing English metadata: ${key}`);
  return text;
}
const escape = (s) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
async function visit(file, inheritedCategory = null, prefix = '') {
  if (visited.has(file)) return;
  visited.add(file);
  const source = await readFile(file, 'utf8');
  if (file.endsWith('/generic-calc/meta.ts')) {
    await visit(
      resolve(dirname(file), 'data/index.ts'),
      'number',
      'generic-calc/'
    );
    return;
  }
  const category =
    source.match(/defineTool\(\s*['"]([^'"]+)['"]/) ||
    (inheritedCategory && /\bpath:/.test(source)
      ? [null, inheritedCategory]
      : null);
  if (category) {
    const slug = source.match(/\bpath:\s*['"]([^'"]+)['"]/);
    const name = source.match(/\bname:\s*['"]([^'"]+)['"]/);
    if (!slug || !name) throw new Error(`Cannot read tool metadata: ${file}`);
    const title = await translate(name[1]);
    const descriptionKey = source.match(/\bdescription:\s*['"]([^'"]+)['"]/);
    if (!descriptionKey) throw new Error(`Missing description: ${file}`);
    const description = await translate(descriptionKey[1]);
    const path = `${category[1]}/${prefix}${slug[1]}`;
    if (routes.has(path)) throw new Error(`Duplicate route: ${path}`);
    routes.set(path, {
      name: title,
      description,
      kind: 'tool',
      category: {
        name: translations.categories[category[1]].title,
        path: `categories/${category[1]}`
      }
    });
    categories.add(category[1]);
    return;
  }
  for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const spec = match[1];
    if (!spec.startsWith('.') && !spec.startsWith('pages/')) continue;
    const base = spec.startsWith('.')
      ? resolve(dirname(file), spec)
      : resolve('src', spec);
    for (const candidate of [
      `${base}.ts`,
      `${base}.tsx`,
      `${base}/index.ts`,
      `${base}/index.tsx`
    ]) {
      if (
        await stat(candidate)
          .then((s) => s.isFile())
          .catch(() => false)
      ) {
        await visit(candidate, inheritedCategory, prefix);
        break;
      }
    }
  }
}
await visit(resolve('src/tools/index.ts'));
for (const category of categories)
  routes.set(`categories/${category}`, {
    name: translations.categories[category].title,
    description: translations.categories[category].description,
    kind: 'category'
  });
if (routes.size < 50) throw new Error('Tool registry unexpectedly small');
const shell = await readFile('dist/index.html', 'utf8');
function renderHead(seo, noindex = false) {
  const marker = 'data-react-helmet="true"';
  const meta = (key, value, property = false) =>
    `<meta ${marker} ${
      property ? 'property' : 'name'
    }="${key}" content="${escape(value)}" />`;
  if (noindex)
    return `<title ${marker}>Page not found - ToolKu</title>${meta(
      'robots',
      'noindex,follow'
    )}${meta('description', 'The requested ToolKu page could not be found.')}`;
  return [
    `<title ${marker}>${escape(seo.title)}</title>`,
    meta('description', seo.description),
    meta('robots', 'index,follow'),
    `<link ${marker} rel="canonical" href="${escape(seo.url)}" />`,
    meta('og:type', 'website', true),
    meta('og:site_name', 'ToolKu', true),
    meta('og:title', seo.title, true),
    meta('og:description', seo.description, true),
    meta('og:url', seo.url, true),
    meta('og:image', seo.image, true),
    meta('og:image:alt', 'ToolKu', true),
    meta('twitter:card', 'summary'),
    meta('twitter:title', seo.title),
    meta('twitter:description', seo.description),
    meta('twitter:image', seo.image),
    `<script ${marker} type="application/ld+json">${JSON.stringify(
      seo.jsonLd
    ).replace(/</g, '\\u003c')}</script>`
  ].join('\n');
}
const homeSeo = createSeo({ description: translations.hero.description });
await writeFile(
  'dist/index.html',
  shell.replace('</head>', `${renderHead(homeSeo)}\n</head>`)
);
for (const [path, data] of routes) {
  const directory = `dist/${path}`;
  await mkdir(directory, { recursive: true });
  const seo = createSeo({ path, ...data });
  const html = shell.replace('</head>', `${renderHead(seo)}\n</head>`);
  await writeFile(`${directory}/index.html`, html);
}
await writeFile(
  'dist/404.html',
  shell.replace('</head>', `${renderHead(null, true)}\n</head>`)
);
await writeFile('dist/.nojekyll', '');
const urls = [
  'https://toolku.com/',
  ...[...routes.keys()].map((path) => `https://toolku.com/${path}/`)
];
await writeFile(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `<url><loc>${escape(url)}</loc></url>`)
    .join('\n')}\n</urlset>\n`
);
await writeFile(
  'dist/release.json',
  JSON.stringify({
    brand: 'ToolKu',
    commit: process.env.GITHUB_SHA || 'local',
    tools: routes.size - categories.size
  })
);
console.log(
  `Generated ${routes.size - categories.size} tool routes and ${
    categories.size
  } category routes with ToolKu SEO.`
);
