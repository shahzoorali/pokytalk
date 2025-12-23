// Google Consent Mode v2 integration
// Detects EEA, UK, and Switzerland users and manages consent

export type ConsentPurpose = 'ad_storage' | 'analytics_storage' | 'functionality_storage' | 'personalization_storage'

export interface ConsentState {
  ad_storage: 'granted' | 'denied'
  analytics_storage: 'granted' | 'denied'
  functionality_storage: 'granted' | 'denied'
  personalization_storage: 'granted' | 'denied'
}

// EEA, UK, and Switzerland country codes
const GDPR_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'CH', 'IS',
  'LI', 'NO'
]

export function isGDPRCountry(countryCode: string | null | undefined): boolean {
  if (!countryCode) return false
  return GDPR_COUNTRIES.includes(countryCode.toUpperCase())
}

// Initialize Google Consent Mode
export function initializeConsentMode() {
  if (typeof window === 'undefined') return

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || []
  
  // Initialize gtag function if not already defined
  if (!window.gtag) {
    window.gtag = function() {
      window.dataLayer!.push(arguments)
    } as any
  }

  // Set default consent state to denied for GDPR compliance
  if (window.gtag) {
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      wait_for_update: 500,
    })
  }
}

// Update consent state
export function updateConsentState(state: Partial<ConsentState>) {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('consent', 'update', {
    ...state,
  })
}

// Get stored consent
export function getStoredConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem('gdpr_consent')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Save consent
export function saveConsent(consent: ConsentState) {
  if (typeof window === 'undefined') return
  
  localStorage.setItem('gdpr_consent', JSON.stringify(consent))
  localStorage.setItem('gdpr_consent_date', new Date().toISOString())
  updateConsentState(consent)
}

// Check if consent is required
export function isConsentRequired(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check if user is in GDPR region (simplified - in production, use IP geolocation)
  const storedCountry = localStorage.getItem('user_country')
  if (storedCountry && isGDPRCountry(storedCountry)) {
    return true
  }
  
  // Check if consent was already given
  const consent = getStoredConsent()
  if (consent) {
    return false
  }
  
  // Default to requiring consent for safety (can be optimized with IP detection)
  return true
}

// Declare gtag types for TypeScript
declare global {
  interface Window {
    gtag?: (
      command: 'consent' | 'config' | 'event',
      targetId: string | 'default' | 'update',
      config?: Record<string, any>
    ) => void
    dataLayer?: any[]
  }
}

