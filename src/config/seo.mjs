export const SITE_URL = 'https://toolku.com';
export const HOME_TITLE = 'ToolKu — Free Everyday Tools';
export const HOME_DESCRIPTION =
  'Free online tools for images, PDFs, video, audio, text, dates and everyday calculations. Available in multiple languages.';

/** @param {{path?: string, name?: string, description?: string, kind?: string, category?: {name: string, path: string}, language?: string}} options */
export function createSeo({
  path = '/',
  name = HOME_TITLE,
  description = HOME_DESCRIPTION,
  kind = 'home',
  category,
  language = 'en'
} = {}) {
  const normalizedPath =
    path === '/' ? '/' : `/${path.replace(/^\/+|\/+$/g, '')}/`;
  const url = SITE_URL + normalizedPath;
  const title = kind === 'home' ? HOME_TITLE : `${name} - ToolKu`;
  const summary = description.replace(/\s+/g, ' ').trim();
  const image = `${SITE_URL}/favicon/android-chrome-512x512.png`;
  const graph = [
    {
      '@type':
        kind === 'home'
          ? 'WebSite'
          : kind === 'category'
            ? 'CollectionPage'
            : 'WebApplication',
      '@id': `${url}#${kind}`,
      name: kind === 'home' ? 'ToolKu' : name,
      url,
      description: summary,
      inLanguage: language,
      ...(kind === 'tool'
        ? {
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
          }
        : {})
    }
  ];
  if (kind !== 'home') {
    const items = [
      { '@type': 'ListItem', position: 1, name: 'ToolKu', item: `${SITE_URL}/` }
    ];
    if (category)
      items.push({
        '@type': 'ListItem',
        position: 2,
        name: category.name,
        item: `${SITE_URL}/${category.path.replace(/^\/+|\/+$/g, '')}/`
      });
    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name,
      item: url
    });
    graph.push({ '@type': 'BreadcrumbList', itemListElement: items });
  }
  return {
    title,
    description: summary,
    url,
    image,
    jsonLd: { '@context': 'https://schema.org', '@graph': graph }
  };
}
