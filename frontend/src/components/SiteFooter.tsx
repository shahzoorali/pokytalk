import Link from 'next/link'
import { articles } from '@/lib/blogArticles'

/**
 * Site-wide footer. Server-rendered on purpose: before this existed the only
 * internal link into /blog was a client-rendered widget, so crawlers reaching
 * the homepage found almost no paths deeper into the site.
 */
export function SiteFooter() {
  const recentArticles = articles.slice(0, 5)

  return (
    <footer className="border-t border-gray-800 bg-gray-900 px-8 py-12 text-sm text-gray-400">
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Footer" className="grid gap-8 sm:grid-cols-3">
          <div>
            <h2 className="mb-3 font-semibold text-gray-200">Pokytalk</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-primary-400">
                  Start a voice chat
                </Link>
              </li>
              <li>
                <Link href="/voice-chat/" className="hover:text-primary-400">
                  What is random voice chat?
                </Link>
              </li>
              <li>
                <Link href="/talk-to-strangers/" className="hover:text-primary-400">
                  Talk to strangers online
                </Link>
              </li>
              <li>
                <Link href="/omegle-alternative/" className="hover:text-primary-400">
                  Omegle alternative
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-gray-200">Guides</h2>
            <ul className="space-y-2">
              {recentArticles.map((article) => (
                <li key={article.slug}>
                  <Link href={`/blog/${article.slug}/`} className="hover:text-primary-400">
                    {article.seoTitle ?? article.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/blog/" className="text-primary-400 hover:text-primary-300">
                  All articles →
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-gray-200">Legal</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy/" className="hover:text-primary-400">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms/" className="hover:text-primary-400">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        <p className="mt-10 border-t border-gray-800 pt-6 text-gray-500">
          Pokytalk is a free, anonymous, voice-only random chat service. No signup, no video,
          no conversation recording. Users must be 18 or older.
        </p>
      </div>
    </footer>
  )
}
