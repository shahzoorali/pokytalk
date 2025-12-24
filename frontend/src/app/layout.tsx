import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { GDPRConsent } from '@/components/GDPRConsent'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pokytalk - Voice Chat with Random People',
  description: 'Connect with random people around the world through voice chat',
  keywords: 'voice chat, random chat, online chat, pokytalk',
  authors: [{ name: 'Pokytalk Team' }],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
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
