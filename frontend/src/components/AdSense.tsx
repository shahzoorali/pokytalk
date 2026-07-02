'use client'

import { useEffect } from 'react'

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

const AD_CLIENT = 'ca-pub-8383127866953714'

// Slot values that aren't real ad units — rendering an <ins> for these produces
// a broken/empty ad unit that hurts page quality. Skip until real slots exist.
function isPlaceholderSlot(adSlot: string): boolean {
  return (
    adSlot.includes('YOUR_') ||
    adSlot.includes('PLACEHOLDER') ||
    adSlot === '1234567890'
  )
}

export function AdSense({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  style,
  className = ''
}: AdSenseProps) {
  // The AdSense loader script is included once site-wide in layout.tsx.
  // Here we just request a fill for this specific unit.
  useEffect(() => {
    if (isPlaceholderSlot(adSlot)) return
    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({})
      }
    } catch (err) {
      console.error('AdSense error:', err)
    }
  }, [adSlot])

  if (isPlaceholderSlot(adSlot)) {
    return null
  }

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: 'block', ...style }}
      data-ad-client={AD_CLIENT}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
    />
  )
}

