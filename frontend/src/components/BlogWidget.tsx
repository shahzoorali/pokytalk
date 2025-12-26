'use client'

import Link from 'next/link'
import { articles } from '@/lib/blogArticles'

export function BlogWidget() {
  // Display latest 6 articles
  const latestArticles = articles.slice(0, 6)

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
          <span>📝</span>
          <span>Latest Blog Posts</span>
        </h2>
        <Link
          href="/blog"
          className="text-primary-400 hover:text-primary-300 text-xs sm:text-sm transition-colors whitespace-nowrap"
        >
          View All →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {latestArticles.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="block bg-gray-900/50 rounded-lg overflow-hidden hover:bg-gray-900 transition-colors border border-gray-700/50 hover:border-primary-500/50 group"
          >
            {article.featuredImage && (
              <div className="w-full h-32 sm:h-40 overflow-hidden">
                <img
                  loading="lazy"
                  decoding="async"
                  src={article.featuredImage}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <div className="p-3 sm:p-4">
              <h3 className="text-sm sm:text-base font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors line-clamp-2">
                {article.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3 line-clamp-2 leading-relaxed">
                {article.excerpt}
              </p>
              <div className="flex items-center text-xs text-gray-500">
                <span>{article.date}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

