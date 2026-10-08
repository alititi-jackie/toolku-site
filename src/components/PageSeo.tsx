import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { tools } from '../tools';
import { validNamespaces } from '../i18n';
import { createSeo } from '../config/seo.mjs';
import { ToolCategory } from '../tools/defineTool';

export default function PageSeo() {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation(validNamespaces);
  const path = pathname.replace(/^\/+|\/+$/g, '');
  const tool = tools.find((item) => item.path === path);
  const category = path.startsWith('categories/')
    ? path.slice('categories/'.length)
    : '';
  const isCategory = tools.some((item) => item.type === category);
  const categoryName = (type: string) =>
    t(`translation:categories.${type as ToolCategory}.title`);
  const options = tool
    ? {
        path,
        name: t(tool.name),
        description: t(tool.description),
        kind: 'tool',
        category: {
          name: categoryName(tool.type),
          path: `categories/${tool.type}`
        }
      }
    : isCategory
      ? {
          path,
          name: categoryName(category),
          description: t(
            `translation:categories.${category as ToolCategory}.description`
          ),
          kind: 'category'
        }
      : { description: t('translation:hero.description') };
  const found = !path || Boolean(tool) || isCategory;
  const seo = createSeo({
    ...options,
    language: i18n.resolvedLanguage || 'en'
  });
  return (
    <Helmet defer={false}>
      <title>{found ? seo.title : 'Page not found - ToolKu'}</title>
      <meta
        name="description"
        content={
          found
            ? seo.description
            : 'The requested ToolKu page could not be found.'
        }
      />
      <meta name="robots" content={found ? 'index,follow' : 'noindex,follow'} />
      {found && <link rel="canonical" href={seo.url} />}
      {found && <meta property="og:type" content="website" />}
      {found && <meta property="og:site_name" content="ToolKu" />}
      {found && <meta property="og:title" content={seo.title} />}
      {found && <meta property="og:description" content={seo.description} />}
      {found && <meta property="og:url" content={seo.url} />}
      {found && <meta property="og:image" content={seo.image} />}
      {found && <meta property="og:image:alt" content="ToolKu" />}
      {found && <meta name="twitter:card" content="summary" />}
      {found && <meta name="twitter:title" content={seo.title} />}
      {found && <meta name="twitter:description" content={seo.description} />}
      {found && <meta name="twitter:image" content={seo.image} />}
      {found && (
        <script type="application/ld+json">
          {JSON.stringify(seo.jsonLd).replace(/</g, '\\u003c')}
        </script>
      )}
    </Helmet>
  );
}
