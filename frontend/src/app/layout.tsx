import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { GDPRConsent } from '@/components/GDPRConsent'
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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pokytalk - Voice Chat with Random People',
    description: 'Connect with random people around the world through voice chat.',
  },
  alternates: {
    canonical: 'https://pokytalk.com',
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
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
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.5',
                ratingCount: '100',
              },
            }),
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
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-900">
          {children}
          <GDPRConsent />
        </div>
      </body>
    </html>
  )
}
