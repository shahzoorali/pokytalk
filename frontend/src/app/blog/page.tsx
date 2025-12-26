'use client'

import Link from 'next/link'
import { AdSense } from '@/components/AdSense'
import { articles } from '@/lib/blogArticles'

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-primary-400 hover:text-primary-300 mb-8 inline-block">
          ← Back to Home
        </Link>
        
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">Blog</h1>
          <p className="text-gray-400 text-lg">
            Tips, guides, and insights on connecting with people around the world
          </p>
        </div>

        <div className="space-y-8 mb-12">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="block bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors border border-gray-700 hover:border-primary-500/50"
            >
              {article.featuredImage && (
                <div className="w-full h-48 overflow-hidden">
                  <img loading="lazy" decoding="async" src={article.featuredImage}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-white mb-3 hover:text-primary-400 transition-colors">
                  {article.title}
                </h2>
                <p className="text-gray-400 mb-4 leading-relaxed">
                  {article.excerpt}
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <span>{article.date}</span>
                  <span className="mx-2">•</span>
                  <span>By {article.author}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12">
          <AdSense adSlot="1234567890" adFormat="horizontal" />
        </div>
      </div>
    </div>
  )
}

