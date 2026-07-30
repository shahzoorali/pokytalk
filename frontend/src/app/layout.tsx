import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { GDPRConsent } from '@/components/GDPRConsent'
import { JsonLd } from '@/components/JsonLd'
import { SiteFooter } from '@/components/SiteFooter'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pokytalk - Voice Chat with Random People',
  description: 'Connect with random people around the world through voice chat. Talk to strangers online, make new friends, and have meaningful conversations. Free anonymous voice chat platform.',
  keywords: 'voice chat, random chat, online chat, pokytalk, talk to strangers, anonymous chat, voice call, random people, chat with strangers, online voice chat',
  authors: [{ name: 'Pokytalk Team' }],
  creator: 'Pokytalk',
  publisher: 'Pokytalk',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pokytalk.com',
    siteName: 'Pokytalk',
    title: 'Pokytalk - Voice Chat with Random People',
    description: 'Connect with random people around the world through voice chat. Talk to strangers online and make new friends.',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Pokytalk - free anonymous random voice chat',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pokytalk - Voice Chat with Random People',
    description: 'Connect with random people around the world through voice chat.',
    images: ['/og-default.png'],
  },
  // NOTE: deliberately no `alternates.canonical` here. Next merges metadata
  // per-key, so a canonical set on the layout is inherited by every page that
  // doesn't override it — which previously pointed all 23 pages at the
  // homepage and told Google to drop them. Each page sets its own canonical
  // via pageMetadata()/articleMetadata() in lib/seo.ts.
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    // iOS ignores SVG icons, so this must be a PNG.
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
  manifest: '/manifest.webmanifest',
  metadataBase: new URL('https://pokytalk.com'),
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Structured Data for SEO and AI Search */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Pokytalk',
              description: 'Voice chat platform to connect with random people around the world',
              url: 'https://pokytalk.com',
              applicationCategory: 'CommunicationApplication',
              operatingSystem: 'Web Browser',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              featureList: [
                'Anonymous voice chat',
                'Random people matching',
                'Country-based filtering',
                'Text chat during calls',
                'Real-time audio communication',
              ],
              // No aggregateRating: the site has no review system, so any
              // rating here would be fabricated review data — a structured
              // data policy violation that risks a site-wide manual action.
            }),
          }}
        />
        {/* Publisher identity, referenced by the BlogPosting markup on articles */}
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Pokytalk',
            url: 'https://pokytalk.com',
            logo: {
              '@type': 'ImageObject',
              url: 'https://pokytalk.com/icon-512.png',
              width: 512,
              height: 512,
            },
            description:
              'Free anonymous random voice chat. Talk to strangers worldwide with no signup.',
          }}
        />
        {/* Google Consent Mode v2 - Must be loaded before any Google tags */}
        <Script
          id="google-consent-mode"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'analytics_storage': 'denied',
                'functionality_storage': 'denied',
                'personalization_storage': 'denied',
                'wait_for_update': 500
              });
            `,
          }}
        />
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-2M4YCB127Y"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-2M4YCB127Y');
            `,
          }}
        />
        {/* Google AdSense — loaded once site-wide. Enables Auto Ads (no slot IDs
            needed); manual <ins> units on content pages also use this loader. */}
        <Script
          id="adsense-loader"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8383127866953714"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-900">
          {children}
          <SiteFooter />
          <GDPRConsent />
        </div>
      </body>
    </html>
  )
}
