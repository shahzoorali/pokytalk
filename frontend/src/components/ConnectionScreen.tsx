'use client'

import { useState } from 'react'
import { Phone, Users, Globe, ChevronDown, ChevronUp } from 'lucide-react'
import { ServerStats, UserFilters } from '@/types'

interface ConnectionScreenProps {
  onStartCall: (filters?: UserFilters) => void
  stats: ServerStats | null
  isConnected?: boolean
  isInitialized?: boolean
  isWaiting?: boolean
  isLoading?: boolean
}

export function ConnectionScreen({ 
  onStartCall, 
  stats,
  isConnected = true,
  isInitialized = false,
  isWaiting = false,
  isLoading: externalLoading = false
}: ConnectionScreenProps) {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  
  const loading = isLoading || externalLoading

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' },
    { code: 'IN', name: 'India' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
  ]

  // Removed location API call since the endpoint was removed

  const handleStartCall = async () => {
    setIsLoading(true)
    
    const filters: UserFilters = {}
    
    if (selectedCountries.length > 0) {
      filters.countries = selectedCountries
    }
    
    try {
      await onStartCall(Object.keys(filters).length > 0 ? filters : undefined)
    } catch (error) {
      console.error('Failed to start call:', error)
      setIsLoading(false)
    }
  }

  const toggleCountry = (countryCode: string) => {
    setSelectedCountries(prev => 
      prev.includes(countryCode)
        ? prev.filter(c => c !== countryCode)
        : [...prev, countryCode]
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      {/* Top Menu */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white">Pokytalk</h1>
            <span className="text-gray-400 text-sm">Voice chat with random people</span>
          </div>
          {stats && (
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-primary-400" />
                <span className="text-gray-300">{stats.onlineUsers}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-primary-400" />
                <span className="text-gray-300">{stats.activeCalls}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          {/* Filters Card - Collapsible */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-primary-400" />
                <span className="text-white font-medium">Filters</span>
              </div>
              {isFiltersOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {isFiltersOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-700 pt-4">
                <label className="text-sm text-gray-300">Country</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                  {countries.map(country => (
                    <button
                      key={country.code}
                      onClick={() => toggleCountry(country.code)}
                      className={`p-2 rounded text-sm transition-colors ${
                        selectedCountries.includes(country.code)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {country.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Start Call Button */}
          <button
            onClick={handleStartCall}
            disabled={loading || !isConnected}
            className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Starting...</span>
              </>
            ) : (
              <>
                <Phone className="w-5 h-5" />
                <span>Start Voice Chat</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
