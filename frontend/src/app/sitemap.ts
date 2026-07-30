import type { MetadataRoute } from 'next'
import { articles } from '@/lib/blogArticles'
import { SITE_URL, isoDate } from '@/lib/seo'

/**
 * Generated at build time. Blog URLs are derived from blogArticles.ts so the
 * sitemap can no longer drift out of sync with the actual pages — the previous
 * hand-maintained public/sitemap.xml listed 5 of 23 URLs.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const landingPages = ['/omegle-alternative/', '/talk-to-strangers/', '/voice-chat/']

  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: 'daily',
      priority: 1,
    },
    ...landingPages.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
    {
      url: `${SITE_URL}/blog/`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...articles.map((article) => ({
      url: `${SITE_URL}/blog/${article.slug}/`,
      lastModified: isoDate(article.date),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    {
      url: `${SITE_URL}/privacy/`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms/`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
