'use client'

import { useState, useEffect } from 'react'
import { Phone, Users, Globe, Calendar } from 'lucide-react'
import { ServerStats, UserFilters } from '@pokytalk/shared'
import { generateYears, getCountryName } from '@/lib/utils'

interface ConnectionScreenProps {
  onStartCall: (filters?: UserFilters) => void
  stats: ServerStats | null
}

export function ConnectionScreen({ onStartCall, stats }: ConnectionScreenProps) {
  const [birthYear, setBirthYear] = useState<number | ''>('')
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [userCountry, setUserCountry] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const years = generateYears()
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

  useEffect(() => {
    // Get user's country
    fetch('/api/location')
      .then(res => res.json())
      .then(data => {
        if (data.country) {
          setUserCountry(data.country)
        }
      })
      .catch(console.error)
  }, [])

  const handleStartCall = async () => {
    setIsLoading(true)
    
    const filters: UserFilters = {}
    
    if (birthYear) {
      const age = new Date().getFullYear() - birthYear
      filters.minAge = age
      filters.maxAge = age
    }
    
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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Pokytalk</h1>
          <p className="text-gray-400">Voice chat with random people</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-primary-400" />
                <span className="text-gray-300">{stats.onlineUsers} online</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-primary-400" />
                <span className="text-gray-300">{stats.activeCalls} active calls</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters Card */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold text-white">Optional Filters</h2>
          
          {/* Age Filter */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-gray-300">
              <Calendar className="w-4 h-4" />
              <span>Age (Birth Year)</span>
            </label>
            <select
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value ? Number(e.target.value) : '')}
              className="input-field w-full"
            >
              <option value="">Any age</option>
              {years.map(year => (
                <option key={year} value={year}>
                  {year} ({new Date().getFullYear() - year} years old)
                </option>
              ))}
            </select>
          </div>

          {/* Country Filter */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-gray-300">
              <Globe className="w-4 h-4" />
              <span>Country</span>
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
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
            {userCountry && (
              <p className="text-xs text-gray-500">
                Your location: {getCountryName(userCountry)}
              </p>
            )}
          </div>
        </div>

        {/* Start Call Button */}
        <button
          onClick={handleStartCall}
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
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

        {/* Info */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>• Your microphone will be used for voice chat</p>
          <p>• You can skip to the next person anytime</p>
          <p>• Be respectful and follow community guidelines</p>
        </div>
      </div>
    </div>
  )
}
