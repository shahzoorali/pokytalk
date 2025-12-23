'use client'

import { useState, useEffect } from 'react'
import { Phone, Users, Globe, Calendar } from 'lucide-react'
import { ServerStats, UserFilters } from '@/types'
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

  // Removed location API call since the endpoint was removed

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-block">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-primary-400 via-primary-300 to-blue-400 bg-clip-text text-transparent mb-2 animate-pulse">
              Pokytalk
            </h1>
          </div>
          <p className="text-gray-300 text-lg">Voice chat with random people around the world</p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live & Anonymous</span>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 text-center shadow-xl">
            <div className="flex items-center justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-2 group">
                <div className="p-2 bg-primary-500/20 rounded-lg group-hover:bg-primary-500/30 transition-colors">
                  <Users className="w-5 h-5 text-primary-400" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-white">{stats.onlineUsers}</div>
                  <div className="text-xs text-gray-400">Online</div>
                </div>
              </div>
              <div className="w-px h-12 bg-gray-700"></div>
              <div className="flex items-center space-x-2 group">
                <div className="p-2 bg-primary-500/20 rounded-lg group-hover:bg-primary-500/30 transition-colors">
                  <Phone className="w-5 h-5 text-primary-400" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-white">{stats.activeCalls}</div>
                  <div className="text-xs text-gray-400">Active Calls</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Card */}
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Optional Filters</h2>
          </div>
          
          {/* Age Filter */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2 text-gray-300 font-medium">
              <Calendar className="w-4 h-4 text-primary-400" />
              <span>Age (Birth Year)</span>
            </label>
            <select
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value ? Number(e.target.value) : '')}
              className="input-field w-full bg-gray-700/50 border-gray-600/50 hover:border-primary-500/50 focus:border-primary-500 transition-colors"
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
          <div className="space-y-3">
            <label className="flex items-center space-x-2 text-gray-300 font-medium">
              <Globe className="w-4 h-4 text-primary-400" />
              <span>Country</span>
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
              {countries.map(country => (
                <button
                  key={country.code}
                  onClick={() => toggleCountry(country.code)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedCountries.includes(country.code)
                      ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/30 scale-105'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:scale-105 border border-gray-600/50'
                  }`}
                >
                  {country.name}
                </button>
              ))}
            </div>
            {userCountry && (
              <p className="text-xs text-gray-400 flex items-center space-x-1">
                <Globe className="w-3 h-3" />
                <span>Your location: {getCountryName(userCountry)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Start Call Button */}
        <button
          onClick={handleStartCall}
          disabled={isLoading}
          className="relative w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:hover:shadow-primary-500/30 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-3 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span className="relative z-10">Starting...</span>
            </>
          ) : (
            <>
              <Phone className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
              <span className="relative z-10">Start Voice Chat</span>
            </>
          )}
        </button>

        {/* Info */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/30 rounded-xl p-4 space-y-2">
          <div className="flex items-start space-x-2 text-xs text-gray-400">
            <div className="w-1.5 h-1.5 bg-primary-400 rounded-full mt-1.5 flex-shrink-0"></div>
            <p>Your microphone will be used for voice chat</p>
          </div>
          <div className="flex items-start space-x-2 text-xs text-gray-400">
            <div className="w-1.5 h-1.5 bg-primary-400 rounded-full mt-1.5 flex-shrink-0"></div>
            <p>You can skip to the next person anytime</p>
          </div>
          <div className="flex items-start space-x-2 text-xs text-gray-400">
            <div className="w-1.5 h-1.5 bg-primary-400 rounded-full mt-1.5 flex-shrink-0"></div>
            <p>Be respectful and follow community guidelines</p>
          </div>
        </div>
      </div>
    </div>
  )
}
