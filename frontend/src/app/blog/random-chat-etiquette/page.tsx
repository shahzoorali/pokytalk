'use client'

import Link from 'next/link'
import { AdSense } from '@/components/AdSense'

export default function RandomChatEtiquetteArticle() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/blog" className="text-primary-400 hover:text-primary-300 mb-8 inline-block">
          ← Back to Blog
        </Link>
        
        <article className="prose prose-invert max-w-none">
          <div className="mb-8 rounded-lg overflow-hidden">
            <img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=630&fit=crop"
              alt="Random chat etiquette - complete guide to do's and don'ts"
              className="w-full h-auto"
            />
          </div>

          <header className="mb-12">
            <h1 className="text-5xl font-bold mb-4 text-white">
              Random Chat Etiquette: Complete Guide to Do's and Don'ts
            </h1>
            <div className="flex items-center text-gray-400 text-sm mb-6">
              <span>December 25, 2025</span>
              <span className="mx-2">•</span>
              <span>By Pokytalk Team</span>
            </div>
          </header>

          <div className="space-y-8 text-gray-300 leading-relaxed">
            <div className="text-lg text-gray-200">
              <p className="mb-4">
                Good etiquette makes random chat platforms enjoyable for everyone. Understanding the unwritten rules helps you be a positive member of the community and have better conversations.
              </p>
              <p className="mb-4">
                This guide covers essential etiquette for random chat platforms: what to do, what to avoid, and how to be a respectful, engaging conversation partner. Follow these guidelines to create positive experiences for yourself and others.
              </p>
              <p>
                Good etiquette isn't about rigid rules—it's about respect, consideration, and creating positive interactions that benefit everyone.
              </p>
            </div>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Essential Do's</h2>
              
              <h3 className="text-2xl font-bold text-white mb-4">Be Respectful</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Treat others with kindness</li>
                <li>Respect boundaries</li>
                <li>Be patient with language barriers</li>
                <li>Accept differences</li>
              </ul>

              <h3 className="text-2xl font-bold text-white mb-4 mt-6">Be Present</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Focus on the conversation</li>
                <li>Listen actively</li>
                <li>Respond thoughtfully</li>
                <li>Show genuine interest</li>
              </ul>

              <div className="mb-8">
                <img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop"
                  alt="Do's and don'ts of random chat etiquette"
                  className="w-full rounded-lg mb-4"
                />
              </div>

              <h3 className="text-2xl font-bold text-white mb-4 mt-6">Be Clear About Intentions</h3>
              <p className="mb-4">
                Communicate what you're looking for: casual chat, language practice, deep conversation, etc.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Important Don'ts</h2>
              
              <h3 className="text-2xl font-bold text-white mb-4">Don't Be Inappropriate</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>No harassment or bullying</li>
                <li>No inappropriate content</li>
                <li>No unsolicited sexual content</li>
                <li>Respect age restrictions</li>
              </ul>

              <h3 className="text-2xl font-bold text-white mb-4 mt-6">Don't Share Personal Information</h3>
              <p className="mb-4">
                Protect your privacy and respect others' privacy.
              </p>

              <h3 className="text-2xl font-bold text-white mb-4 mt-6">Don't Spam or Scam</h3>
              <p className="mb-4">
                No advertising, scams, or solicitation.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Conclusion</h2>
              <p className="mb-4">
                Good etiquette creates better experiences for everyone. Be respectful, present, and clear about your intentions. Avoid inappropriate behavior and protect privacy.
              </p>
              <p>
                Follow these guidelines to be a positive member of the random chat community and enjoy better conversations.
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-700">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div>
                  <Link href="/" className="btn-primary inline-block">
                    Chat Respectfully
                  </Link>
                </div>
                <div className="text-sm text-gray-400">
                  <Link href="/blog" className="text-primary-400 hover:text-primary-300">
                    ← Back to Blog
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </article>

        <div className="mt-12">
          <AdSense adSlot="1234567890" adFormat="horizontal" />
        </div>
      </div>
    </div>
  )
}

