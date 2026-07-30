import type { Metadata } from 'next'
import { articles, type BlogArticle } from './blogArticles'

export const SITE_URL = 'https://pokytalk.com'
export const SITE_NAME = 'Pokytalk'
export const DEFAULT_OG_IMAGE = '/og-default.png'

/** Trailing slashes matter: next.config.js sets `trailingSlash: true`, so the
 *  canonical must match the URL Amplify actually serves. */
export function canonicalPath(path: string): string {
  if (path === '/') return '/'
  return path.endsWith('/') ? path : `${path}/`
}

/** Google truncates descriptions around 155-160 chars. Cut on a word boundary
 *  rather than mid-word so the snippet reads cleanly. */
export function clampDescription(text: string, max = 155): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).replace(/[,;:.\s]+$/, '')}…`
}

/** Appends the brand suffix only when the result still fits inside the ~60 char
 *  SERP display limit, so long headlines aren't pushed out by boilerplate. */
export function pageTitle(title: string): string {
  // Don't append the brand to a title that already names it.
  if (title.includes(SITE_NAME)) return title
  const withSuffix = `${title} | ${SITE_NAME}`
  return withSuffix.length <= 60 ? withSuffix : title
}

export function getArticle(slug: string): BlogArticle {
  const article = articles.find((a) => a.slug === slug)
  if (!article) {
    // Build-time failure is deliberate: a typo'd slug would otherwise ship a
    // page with no metadata at all, which is the bug this module exists to fix.
    throw new Error(`[seo] No article in blogArticles.ts for slug "${slug}"`)
  }
  return article
}

/** ISO-8601 date for OpenGraph/JSON-LD. blogArticles.ts stores display dates
 *  like "December 23, 2025". */
export function isoDate(displayDate: string): string {
  const parsed = new Date(displayDate)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`[seo] Unparseable date "${displayDate}" in blogArticles.ts`)
  }
  // Read local components, not toISOString(): the display date parses to local
  // midnight, which UTC would shift back a day in any positive-offset timezone
  // (a build in IST turned "December 23, 2025" into 2025-12-22).
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Full per-page metadata for a blog article, derived entirely from
 * blogArticles.ts. Each article page needs only:
 *   export const metadata = articleMetadata('my-slug')
 */
export function articleMetadata(slug: string): Metadata {
  const article = getArticle(slug)
  const url = canonicalPath(`/blog/${slug}`)
  const description = clampDescription(article.excerpt)
  const image = article.featuredImage ?? DEFAULT_OG_IMAGE

  return {
    title: pageTitle(article.seoTitle ?? article.title),
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: article.title,
      description,
      url,
      siteName: SITE_NAME,
      // Dimensions are only declared for the generated OG image, whose size we
      // control. Article featured images are stock photos of varying sizes.
      images: [
        image === DEFAULT_OG_IMAGE
          ? { url: image, width: 1200, height: 630, alt: article.title }
          : { url: image, alt: article.title },
      ],
      publishedTime: isoDate(article.date),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: [image],
    },
  }
}

/** Metadata for a non-article page (landing pages, blog index, legal). */
export function pageMetadata(opts: {
  title: string
  description: string
  path: string
  image?: string
}): Metadata {
  const url = canonicalPath(opts.path)
  const description = clampDescription(opts.description)
  const image = opts.image ?? DEFAULT_OG_IMAGE

  return {
    title: pageTitle(opts.title),
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: opts.title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: opts.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description,
      images: [image],
    },
  }
}

// --- JSON-LD builders -------------------------------------------------------

export function blogPostingJsonLd(slug: string) {
  const article = getArticle(slug)
  const url = `${SITE_URL}${canonicalPath(`/blog/${slug}`)}`
  const published = isoDate(article.date)

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: clampDescription(article.excerpt),
    image: `${SITE_URL}${article.featuredImage ?? DEFAULT_OG_IMAGE}`,
    datePublished: published,
    dateModified: published,
    author: { '@type': 'Organization', name: article.author, url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon-512.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
  }
}

export function breadcrumbJsonLd(trail: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${canonicalPath(item.path)}`,
    })),
  }
}

export function articleBreadcrumb(slug: string) {
  const article = getArticle(slug)
  return breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: article.title, path: `/blog/${slug}` },
  ])
}

export function faqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}
