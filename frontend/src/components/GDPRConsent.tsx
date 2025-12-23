'use client'

import { useState, useEffect } from 'react'
import { X, Settings } from 'lucide-react'
import Link from 'next/link'
import { 
  isConsentRequired, 
  getStoredConsent, 
  saveConsent, 
  initializeConsentMode,
  type ConsentState 
} from '@/lib/consent'

export function GDPRConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [consent, setConsent] = useState<ConsentState>({
    ad_storage: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
  })

  useEffect(() => {
    // Initialize Google Consent Mode
    initializeConsentMode()
    
    // Check if consent is required
    if (isConsentRequired()) {
      // Load existing consent if available
      const stored = getStoredConsent()
      if (stored) {
        setConsent(stored)
        setShowBanner(false)
      } else {
        setShowBanner(true)
      }
    } else {
      // Not in GDPR region, grant all consent
      const defaultConsent: ConsentState = {
        ad_storage: 'granted',
        analytics_storage: 'granted',
        functionality_storage: 'granted',
        personalization_storage: 'granted',
      }
      saveConsent(defaultConsent)
      setConsent(defaultConsent)
    }
  }, [])

  const acceptAll = () => {
    const allGranted: ConsentState = {
      ad_storage: 'granted',
      analytics_storage: 'granted',
      functionality_storage: 'granted',
      personalization_storage: 'granted',
    }
    setConsent(allGranted)
    saveConsent(allGranted)
    setShowBanner(false)
    setShowSettings(false)
  }

  const rejectAll = () => {
    const allDenied: ConsentState = {
      ad_storage: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
    }
    setConsent(allDenied)
    saveConsent(allDenied)
    setShowBanner(false)
    setShowSettings(false)
  }

  const saveCustomConsent = () => {
    saveConsent(consent)
    setShowBanner(false)
    setShowSettings(false)
  }

  const toggleConsent = (key: keyof ConsentState) => {
    setConsent(prev => ({
      ...prev,
      [key]: prev[key] === 'granted' ? 'denied' : 'granted'
    }))
  }

  if (!showBanner && !showSettings) return null

  return (
    <>
      {/* Main Consent Banner */}
      {showBanner && !showSettings && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-50 p-3 sm:p-4 shadow-lg">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 w-full sm:w-auto">
                <h3 className="text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">We value your privacy</h3>
                <p className="text-gray-300 text-xs sm:text-sm mb-2 sm:mb-3">
                  We use cookies and similar technologies to provide, protect and improve our services, 
                  to show you relevant content, and to help our partners advertise to you. 
                  <Link href="/privacy" className="text-primary-400 hover:text-primary-300 underline ml-1">
                    Learn more
                  </Link>
                </p>
                <p className="text-gray-400 text-xs hidden sm:block">
                  By clicking "Accept all", you consent to our use of cookies. You can also choose which cookies to accept.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-2 w-full sm:w-auto flex-shrink-0">
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                >
                  <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Customize</span>
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={rejectAll}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
                  >
                    Reject all
                  </button>
                  <button
                    onClick={acceptAll}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
                  >
                    Accept all
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="bg-gray-800 rounded-t-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Cookie Preferences</h2>
                <button
                  onClick={() => {
                    setShowSettings(false)
                    if (!getStoredConsent()) {
                      setShowBanner(true)
                    }
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-gray-300 text-sm mb-4">
                    Manage your cookie preferences. You can enable or disable different types of cookies below.
                    <Link href="/privacy" className="text-primary-400 hover:text-primary-300 underline ml-1">
                      Learn more in our Privacy Policy
                    </Link>
                  </p>
                </div>

                {/* Ad Storage */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-white font-semibold">Advertising Cookies</h3>
                      <p className="text-gray-400 text-xs">Used to show you relevant ads</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consent.ad_storage === 'granted'}
                        onChange={() => toggleConsent('ad_storage')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>

                {/* Analytics Storage */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-white font-semibold">Analytics Cookies</h3>
                      <p className="text-gray-400 text-xs">Help us understand how visitors interact with our site</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consent.analytics_storage === 'granted'}
                        onChange={() => toggleConsent('analytics_storage')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>

                {/* Functionality Storage */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-white font-semibold">Functionality Cookies</h3>
                      <p className="text-gray-400 text-xs">Remember your preferences and settings</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consent.functionality_storage === 'granted'}
                        onChange={() => toggleConsent('functionality_storage')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>

                {/* Personalization Storage */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-white font-semibold">Personalization Cookies</h3>
                      <p className="text-gray-400 text-xs">Used to personalize your experience</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consent.personalization_storage === 'granted'}
                        onChange={() => toggleConsent('personalization_storage')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={rejectAll}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Reject all
                  </button>
                  <button
                    onClick={acceptAll}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Accept all
                  </button>
                  <button
                    onClick={saveCustomConsent}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Save preferences
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

