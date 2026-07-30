import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/**
 * Generated at build time, replacing the former static public/robots.txt.
 * Rules are a direct port of that file — files in public/ are copied verbatim
 * and would shadow this route, so public/robots.txt was removed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/api/',
      },
      {
        // AI crawlers are welcomed explicitly.
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'CCBot',
          'anthropic-ai',
          'Claude-Web',
          'PerplexityBot',
          'Applebot-Extended',
        ],
        allow: '/',
      },
      {
        // Commercial SEO scrapers.
        userAgent: ['AhrefsBot', 'SemrushBot'],
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
