'use client'

import { useEffect } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

interface AdSenseProps {
  adSlot: string
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal'
  fullWidthResponsive?: boolean
  style?: React.CSSProperties
  className?: string
}

export function AdSense({ 
  adSlot, 
  adFormat = 'auto',
  fullWidthResponsive = true,
  style,
  className = ''
}: AdSenseProps) {
  const publisherId = 'pub-8383127866953714'

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({})
      }
    } catch (err) {
      console.error('AdSense error:', err)
    }
  }, [])

  // Don't render if adSlot is placeholder
  if (adSlot.includes('YOUR_') || adSlot.includes('PLACEHOLDER')) {
    return null
  }

  return (
    <>
      {/* AdSense Script - only load once */}
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
        onLoad={() => {
          try {
            if (typeof window !== 'undefined' && window.adsbygoogle) {
              window.adsbygoogle.push({})
            }
          } catch (err) {
            console.error('AdSense load error:', err)
          }
        }}
      />
      <ins
        className={`adsbygoogle ${className}`}
        style={{ display: 'block', ...style }}
        data-ad-client={publisherId}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      />
    </>
  )
}

