'use client'

import Link from 'next/link'
import { AdSense } from '@/components/AdSense'

interface BlogArticle {
  slug: string
  title: string
  excerpt: string
  date: string
  author: string
  featuredImage?: string
}

const articles: BlogArticle[] = [
  {
    slug: 'talk-to-strangers-online',
    title: 'How to Talk to Strangers Online',
    excerpt: 'Technology has made connecting with others easier than ever, yet we still experience a lingering sense of loneliness in this digital age. Learn how to safely and meaningfully connect with strangers online.',
    date: 'December 23, 2025',
    author: 'Pokytalk Team',
    featuredImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=630&fit=crop'
  },
  {
    slug: 'best-omegle-alternatives-2025',
    title: 'Best Omegle Alternatives in 2025: Complete Guide',
    excerpt: 'With Omegle shutting down, millions of users are searching for the best alternatives. Discover the top random chat platforms that offer safe, engaging conversations with people around the world.',
    date: 'December 23, 2025',
    author: 'Pokytalk Team',
    featuredImage: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=630&fit=crop'
  },
  {
    slug: 'stay-safe-random-chat',
    title: 'How to Stay Safe on Random Chat Platforms: Ultimate Safety Guide',
    excerpt: 'Your comprehensive guide to staying safe while enjoying random chat platforms. Learn essential safety practices, recognize red flags, and protect your privacy without sacrificing meaningful connections.',
    date: 'December 24, 2025',
    author: 'Pokytalk Team',
    featuredImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=630&fit=crop'
  },
  {
    slug: 'voice-chat-vs-text-chat',
    title: 'Voice Chat vs Text Chat: Which is Better for Online Connections?',
    excerpt: 'Explore the differences between voice and text chat platforms. Discover which format works best for different situations and learn how voice chat creates deeper, more authentic connections.',
    date: 'December 24, 2025',
    author: 'Pokytalk Team',
    featuredImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=630&fit=crop'
  },
  {
    slug: 'practice-languages-online',
    title: 'How to Practice Languages with Native Speakers Online',
    excerpt: 'Master a new language by practicing with native speakers on random chat platforms. Learn effective strategies, conversation techniques, and how to make the most of language exchange opportunities.',
    date: 'December 24, 2025',
    author: 'Pokytalk Team',
    featuredImage: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=630&fit=crop'
  },
  {
    slug: 'psychology-talking-strangers',
    title: 'The Psychology of Talking to Strangers Online: Why We Do It',
    excerpt: 'Dive deep into the psychological motivations behind talking to strangers online. Understand why anonymous conversations fulfill our need for connection and how they impact our mental well-being.',
    date: 'December 25, 2025',
    author: 'Pokytalk Team',
    featuredImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=630&fit=crop'
  },
  {
    slug: 'top-10-random-chat-apps',
    title: 'Top 10 Random Chat Apps for Making Friends in 2025',
    excerpt: 'Discover the best random chat apps available today. Compare features, safety measures, and user experiences to find the perfect platform for making new friends and meaningful connections.',
    date: 'December 25, 2025',
    author: 'Pokytalk Team',
    featuredImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop'
  },
  {
    slug: 'random-chat-changed-social-connection',
    title: 'How Random Chat Platforms Changed Social Connection Forever',
    excerpt: 'Explore how random chat platforms have revolutionized the way we connect with others. Understand their impact on social dynamics, cultural exchange, and the future of human interaction.',
    date: 'December 25, 2025',
    author: 'Pokytalk Team',
    featuredImage: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=630&fit=crop'
  },
  {
    slug: 'privacy-guide-online-chat',
    title: 'Privacy Guide for Online Chat Platforms: What You Need to Know',
    excerpt: 'Protect your privacy while using online chat platforms. Learn what information to share, what to keep private, and how to maintain anonymity while building genuine connections.',
    date: 'December 25, 2025',
    author: 'Pokytalk Team',
    featuredImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=630&fit=crop'
  },
  {
    slug: 'conversation-starters-random-chat',
    title: 'Breaking the Ice: 50 Conversation Starters for Random Chats',
    excerpt: 'Never struggle with awkward silences again. Discover 50 proven conversation starters that work across cultures and languages, helping you create engaging, meaningful conversations.',
    date: 'December 25, 2025',
    author: 'Pokytalk Team',
    featuredImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=630&fit=crop'
  },
  {
    slug: 'why-people-use-random-chat',
    title: 'Why People Use Random Chat Platforms: Understanding the Modern Appeal',
    excerpt: 'Understand the diverse reasons people turn to random chat platforms. From loneliness to curiosity, explore the motivations driving millions to connect with strangers online.',
    date: 'December 25, 2025',
    author: 'Pokytalk Team',
    featuredImage: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=630&fit=crop'
  },
  {
    slug: 'handle-awkward-moments-chat',
    title: 'How to Handle Awkward Moments in Random Chats: A Practical Guide',
    excerpt: 'Learn how to gracefully navigate awkward situations in random chats. From technical glitches to uncomfortable topics, master the art of keeping conversations flowing smoothly.',
    date: 'December 25, 2025',
    author: 'Pokytalk Team',
    featuredImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=630&fit=crop'
  },
  {
    slug: 'cultural-exchange-random-chat',
    title: 'Cultural Exchange Through Random Chat Platforms: Connecting Worlds',
    excerpt: 'Discover how random chat platforms facilitate genuine cultural exchange. Learn how these conversations break down stereotypes, build understanding, and create global connections.',
    date: 'December 25, 2025',
    author: 'Pokytalk Team',
    featuredImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=630&fit=crop'
  },
  {
    slug: 'future-random-chat',
    title: 'The Future of Random Chat: Trends and Predictions for 2025 and Beyond',
    excerpt: 'Explore emerging trends shaping the future of random chat platforms. From AI integration to virtual reality, discover what\'s next for online social connection.',
    date: 'December 25, 2025',
    author: 'Pokytalk Team',
    featuredImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=630&fit=crop'
  },
  {
    slug: 'random-chat-etiquette',
    title: 'Random Chat Etiquette: Complete Guide to Do\'s and Don\'ts',
    excerpt: 'Master the unwritten rules of random chat platforms. Learn proper etiquette, respectful communication practices, and how to be a positive member of the online community.',
    date: 'December 25, 2025',
    author: 'Pokytalk Team',
    featuredImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=630&fit=crop'
  },
  {
    slug: 'combat-harassment-random-chat',
    title: 'How Random Chat Platforms Combat Harassment: Safety Features Explained',
    excerpt: 'Understand how modern random chat platforms protect users from harassment. Learn about AI moderation, reporting systems, and safety features that keep communities safe.',
    date: 'December 25, 2025',
    author: 'Pokytalk Team',
    featuredImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=630&fit=crop'
  }
]

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

