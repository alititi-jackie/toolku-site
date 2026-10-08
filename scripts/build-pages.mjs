import { readFile, writeFile, mkdir, copyFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

// Follow the real tool registry, so unregistered upstream tools are not published.
const visited = new Set();
const routes = new Map();
const categories = new Set();
const escape = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
async function visit(file, inheritedCategory = null, prefix = '') {
  if (visited.has(file)) return;
  visited.add(file);
  const source = await readFile(file, 'utf8');
  if (file.endsWith('/generic-calc/meta.ts')) { await visit(resolve(dirname(file), 'data/index.ts'), 'number', 'generic-calc/'); return; }
  const category = source.match(/defineTool\(\s*['"]([^'"]+)['"]/ ) || (inheritedCategory && /\bpath:/.test(source) ? [null, inheritedCategory] : null);
  if (category) {
    const slug = source.match(/\bpath:\s*['"]([^'"]+)['"]/);
    const name = source.match(/\bname:\s*['"]([^'"]+)['"]/);
    if (!slug || !name) throw new Error(`Cannot read tool metadata: ${file}`);
    const [ns, key] = name[1].split(':');
    const locale = JSON.parse(await readFile(`public/locales/en/${ns}.json`, 'utf8'));
    const title = key.split('.').reduce((value, part) => value?.[part], locale);
    if (typeof title !== 'string') throw new Error(`Missing English title: ${name[1]}`);
    const path = `${category[1]}/${prefix}${slug[1]}`;
    if (routes.has(path)) throw new Error(`Duplicate route: ${path}`);
    routes.set(path, title);
    categories.add(category[1]);
    return;
  }
  for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const spec = match[1];
    if (!spec.startsWith('.') && !spec.startsWith('pages/')) continue;
    const base = spec.startsWith('.') ? resolve(dirname(file), spec) : resolve('src', spec);
    for (const candidate of [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) {
      if (await stat(candidate).then(s => s.isFile()).catch(() => false)) { await visit(candidate, inheritedCategory, prefix); break; }
    }
  }
}
await visit(resolve('src/tools/index.ts'));
for (const category of categories) routes.set(`categories/${category}`, `${category} tools`);
if (routes.size < 50) throw new Error('Tool registry unexpectedly small');
const shell = await readFile('dist/index.html', 'utf8');
const home = shell.replace('</head>', '<link rel="canonical" href="https://toolku.com/" /></head>');
await writeFile('dist/index.html', home);
for (const [path, title] of routes) {
  const directory = `dist/${path}`;
  await mkdir(directory, { recursive: true });
  const html = shell.replace(/<title>.*?<\/title>/s, `<title>${escape(title)} - ToolKu</title>`)
    .replace('</head>', `<link rel="canonical" href="https://toolku.com/${path}/" /></head>`);
  await writeFile(`${directory}/index.html`, html);
}
await writeFile('dist/404.html', shell.replace('</head>', '<meta name="robots" content="noindex" /></head>'));
await writeFile('dist/.nojekyll', '');
const urls = ['https://toolku.com/', ...[...routes.keys()].map(path => `https://toolku.com/${path}/`)];
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `<url><loc>${escape(url)}</loc></url>`).join('\n')}\n</urlset>\n`);
await writeFile('dist/release.json', JSON.stringify({ brand: 'ToolKu', commit: process.env.GITHUB_SHA || 'local', tools: routes.size - categories.size }));
console.log(`Generated ${routes.size - categories.size} tool routes and ${categories.size} category routes for GitHub Pages.`);
