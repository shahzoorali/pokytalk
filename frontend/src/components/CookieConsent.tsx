'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Link from 'next/link'

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookieConsent = localStorage.getItem('cookieConsent')
    if (!cookieConsent) {
      setShowBanner(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-50 p-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1 min-w-[300px]">
          <p className="text-white text-sm">
            We use cookies to enhance your experience, analyze site usage, and assist in our marketing efforts. 
            By continuing to use our site, you agree to our use of cookies.{' '}
            <Link href="/privacy" className="text-primary-400 hover:text-primary-300 underline">
              Learn more
            </Link>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={acceptCookies}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Accept
          </button>
          <button
            onClick={acceptCookies}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

