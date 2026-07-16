import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://www.pulari.ie';
const DEFAULT_IMAGE = 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1200';
const DEFAULT_IMAGE_ALT = 'Pulari Restaurant — Authentic Kerala & South Indian cuisine in Dublin';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string;
  ogImage?: string;
  ogImageAlt?: string;
  /** 'website' for most pages, 'article' for blog posts */
  type?: 'website' | 'article';
  articleDate?: string;       // ISO 8601, e.g. "2026-06-12"
  articleAuthor?: string;
  /** One or more JSON-LD schema objects to inject as <script type="application/ld+json"> */
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  /** Breadcrumb trail after Home. e.g. [{name:'Menu', url:'/menu'}] */
  breadcrumbs?: Array<{ name: string; url: string }>;
  noIndex?: boolean;
}

export default function SEO({
  title,
  description,
  canonical,
  keywords,
  ogImage,
  ogImageAlt,
  type = 'website',
  articleDate,
  articleAuthor,
  jsonLd,
  breadcrumbs,
  noIndex = false,
}: SEOProps) {
  const fullTitle = `${title} | Pulari Restaurant Dublin`;
  const url = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
  const image = ogImage || DEFAULT_IMAGE;
  const imageAlt = ogImageAlt || DEFAULT_IMAGE_ALT;

  // Build BreadcrumbList schema whenever breadcrumbs are supplied
  const breadcrumbSchema: Record<string, unknown> | null =
    breadcrumbs && breadcrumbs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
            ...breadcrumbs.map((crumb, i) => ({
              '@type': 'ListItem',
              position: i + 2,
              name: crumb.name,
              item: `${BASE_URL}${crumb.url}`,
            })),
          ],
        }
      : null;

  const allSchemas: Array<Record<string, unknown>> = [
    ...(Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []),
    ...(breadcrumbSchema ? [breadcrumbSchema] : []),
  ];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Pulari Restaurant" />
      <meta property="og:locale" content="en_IE" />

      {/* Article-specific Open Graph */}
      {type === 'article' && articleDate && (
        <meta property="article:published_time" content={articleDate} />
      )}
      {type === 'article' && articleAuthor && (
        <meta property="article:author" content={articleAuthor} />
      )}
      {type === 'article' && (
        <meta property="article:section" content="Food & Dining" />
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={imageAlt} />

      {/* Per-page JSON-LD blocks */}
      {allSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
