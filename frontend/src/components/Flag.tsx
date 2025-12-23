'use client'

import { useState } from 'react'

interface FlagProps {
  countryCode: string
  className?: string
  size?: number
}

export function Flag({ countryCode, className = '', size = 20 }: FlagProps) {
  const [useEmoji, setUseEmoji] = useState(false)
  const [useLocal, setUseLocal] = useState(true)
  
  // Try local first, then CDN, then emoji
  const localSrc = `/flags/${countryCode.toLowerCase()}.svg`
  const cdnSrc = `https://flagcdn.com/w${size}/${countryCode.toLowerCase()}.svg`
  const src = useLocal ? localSrc : cdnSrc
  
  const handleError = () => {
    if (useLocal) {
      // Try CDN if local file fails
      setUseLocal(false)
    } else {
      // Fallback to emoji if CDN also fails
      setUseEmoji(true)
    }
  }
  
  if (useEmoji) {
    return (
      <span className={`inline-flex items-center justify-center ${className} text-lg`} style={{ width: size, height: size }}>
        {getEmojiFlag(countryCode)}
      </span>
    )
  }
  
  return (
    <span className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size * 0.75 }}>
      <img
        src={src}
        alt={`${countryCode} flag`}
        className="w-full h-full object-contain"
        loading="lazy"
        onError={handleError}
      />
    </span>
  )
}

// Fallback emoji flags for countries
function getEmojiFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}
