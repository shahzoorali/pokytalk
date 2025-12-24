'use client'

import { useState, useRef, useEffect } from 'react'
import { Phone, Users, Globe, ChevronDown, ChevronUp, Mic, MicOff, MessageSquare, X, Send, Search, Gamepad2 } from 'lucide-react'
import { ServerStats, UserFilters, User, ChatMessage } from '@/types'
import { AudioLevelBar } from './AudioLevelBar'
import { Flag } from './Flag'
import { HangmanGame } from './HangmanGame'
import { COUNTRIES } from '@/lib/countries'
import { getCountryName } from '@/lib/utils'
import { useGame } from '@/hooks/useGame'

interface ConnectionScreenProps {
  onStartCall: (filters?: UserFilters) => void
  stats: ServerStats | null
  isConnected?: boolean
  isInitialized?: boolean
  isWaiting?: boolean
  isLoading?: boolean
  // Call state props
  user?: User | null
  partner?: User | null
  sessionId?: string | null
  isWebRTCConnected?: boolean
  connectionState?: 'disconnected' | 'connecting' | 'connected' | 'failed'
  isMuted?: boolean
  localAudioLevel?: number
  remoteAudioLevel?: number
  messages?: ChatMessage[]
  showChat?: boolean
  onEndCall?: () => void
  onToggleMute?: () => void
  onToggleChat?: () => void
  onSendMessage?: (content: string) => void
  remoteStream?: MediaStream | null
  // Game props
  gameHook?: ReturnType<typeof useGame>
}

export function ConnectionScreen({ 
  onStartCall, 
  stats,
  isConnected = true,
  isInitialized = false,
  isWaiting = false,
  isLoading: externalLoading = false,
  // Call state
  user,
  partner,
  sessionId,
  isWebRTCConnected = false,
  connectionState = 'disconnected',
  isMuted = false,
  localAudioLevel = 0,
  remoteAudioLevel = 0,
  messages = [],
  showChat = false,
  onEndCall,
  onToggleMute,
  onToggleChat,
  onSendMessage,
  remoteStream,
  // Game
  gameHook,
}: ConnectionScreenProps) {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [isGameOpen, setIsGameOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  
  const loading = isLoading || externalLoading
  const isInCall = !!partner && !!sessionId

  // Filter countries based on search
  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().startsWith(countrySearch.toLowerCase())
  )

  // Store user country for GDPR detection
  useEffect(() => {
    if (user?.country && typeof window !== 'undefined') {
      localStorage.setItem('user_country', user.country)
    }
  }, [user?.country])

  // Handle remote audio stream
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      try {
        remoteAudioRef.current.srcObject = remoteStream
        remoteAudioRef.current.play().catch(() => {})
      } catch {
        // ignore
      }
    }
  }, [remoteStream])

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = () => {
    if (messageInput.trim() && messageInput.length <= 3000 && onSendMessage) {
      onSendMessage(messageInput.trim())
      setMessageInput('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

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
    setSelectedCountries(prev => {
      if (prev.includes(countryCode)) {
        // Remove if already selected
        return prev.filter(c => c !== countryCode)
      } else {
        // Add if not selected, but limit to 3
        if (prev.length >= 3) {
          return prev // Don't add if already at limit
        }
        return [...prev, countryCode]
      }
    })
  }

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      {/* Top Menu */}
      <div className="bg-gray-800 border-b border-gray-700 px-3 sm:px-4 py-2 sm:py-3">
        <div className="max-w-4xl mx-auto">
          {/* First Row: Title and Links */}
          <div className="flex items-center justify-between mb-2 sm:mb-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <h1 className="text-lg sm:text-2xl font-bold text-white">Pokytalk</h1>
              <span className="hidden sm:inline text-gray-400 text-sm">Voice chat with random people</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 text-xs text-gray-400">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <span className="hidden sm:inline">•</span>
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
          
          {/* Second Row: Filters and Stats (mobile) or inline (desktop) */}
          <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
            {/* Filters Button */}
            <button
              onClick={() => setIsFiltersModalOpen(true)}
              className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Globe className="w-4 h-4 text-primary-400" />
              <span className="text-white text-xs sm:text-sm">Filters</span>
              {selectedCountries.length > 0 && (
                <span className="bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {selectedCountries.length}
                </span>
              )}
            </button>
            
            {stats && (
              <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-400" />
                  <span className="text-gray-300">{stats.onlineUsers}</span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-400" />
                  <span className="text-gray-300">{stats.activeCalls}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800/50 border-b border-gray-700 px-3 sm:px-4 py-2 sm:py-3">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            {!isInCall && !isWaiting && !isInitialized && (
              <p className="text-gray-300 text-xs sm:text-sm">
                Click on <span className="text-primary-400 font-semibold">Call</span> to find a stranger to talk with
              </p>
            )}
            {isWaiting && (
              <p className="text-gray-300 text-xs sm:text-sm flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-primary-400 border-t-transparent"></div>
                <span><span className="text-primary-400 font-semibold">Connecting...</span> Finding someone to talk with</span>
              </p>
            )}
            {isInCall && partner && (
              <div className="flex items-center justify-center space-x-2 flex-wrap">
                <p className="text-gray-300 text-xs sm:text-sm">
                  Your partner is from <span className="text-white font-semibold">{getCountryName(partner.country)}</span>
                </p>
                {partner.country && (
                  <Flag countryCode={partner.country} size={16} className="sm:w-5 sm:h-5" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          {/* Community Guidelines - Only show when not in call */}
          {!isInCall && (
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 sm:p-6 shadow-xl">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center space-x-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400" />
                <span>Community Guidelines</span>
              </h2>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-300">
              <div className="flex items-start space-x-2">
                <span className="text-primary-400 font-bold">18+</span>
                <p>You must be 18 or older to use this service. We're serious about this.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-red-400 font-bold">⚠️</span>
                <p><strong>Stay anonymous.</strong> Never share your real name, location, phone, email, or social media. Protect your privacy.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-primary-400 font-bold">🤝</span>
                <p><strong>Be respectful.</strong> Treat others how you want to be treated. No harassment, hate speech, or bullying.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-primary-400 font-bold">🚫</span>
                <p><strong>No illegal content.</strong> Don't share anything illegal, violent, or that promotes harm.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-primary-400 font-bold">📢</span>
                <p><strong>Report bad behavior.</strong> If someone makes you uncomfortable or violates these rules, report them immediately.</p>
              </div>
              <div className="pt-2 border-t border-gray-700/50">
                <p className="text-xs text-gray-400">
                  By using Pokytalk, you agree to our <a href="/terms" className="text-primary-400 hover:text-primary-300 underline">Terms</a> and <a href="/privacy" className="text-primary-400 hover:text-primary-300 underline">Privacy Policy</a>. Violations may result in permanent ban.
                </p>
              </div>
            </div>
          </div>
          )}

          {/* Single Call Button - Changes state based on call status */}
          <div className="flex flex-col items-center space-y-4">
            {/* Call Button Container */}
            <div className="relative">
              {/* Pulse animation background when in call */}
              {isInCall && (
                <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping"></div>
              )}
              
              {/* Main Call Button */}
              <button
                onClick={() => {
                  if (isInCall) {
                    // Show confirmation or directly hang up
                    if (onEndCall) {
                      onEndCall()
                    }
                  } else if (!isWaiting && !loading) {
                    handleStartCall()
                  }
                }}
                disabled={isInCall ? loading : (loading || !isConnected || isWaiting)}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isInCall
                    ? 'bg-red-600 hover:bg-red-700'
                    : isWaiting || loading
                    ? 'bg-gray-600 cursor-wait'
                    : 'bg-primary-600 hover:bg-primary-700'
                } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
              >
                {/* Loading Spinner */}
                {(isWaiting || loading) && (
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                )}
                
                {/* Call Icon - when idle */}
                {!isInCall && !isWaiting && !loading && (
                  <Phone className="w-10 h-10 text-white" />
                )}
                
                {/* Hang Up Icon - when in call */}
                {isInCall && (
                  <X className="w-10 h-10 text-white" />
                )}
              </button>
            </div>

            {/* Button Label */}
            <span className="text-white text-sm font-medium">
              {isInCall ? 'Hang up' : isWaiting || loading ? 'Connecting...' : 'Call'}
            </span>

            {/* Call Info - Show when in call */}
            {isInCall && (
              <div className="w-full bg-gray-800 rounded-lg p-4 space-y-4">
                {/* Connection Status */}
                <div className="flex items-center justify-center space-x-2">
                  <div className={`w-2 h-2 ${
                    connectionState === 'connected' ? 'bg-green-500' :
                    connectionState === 'connecting' ? 'bg-yellow-500' :
                    connectionState === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                  } rounded-full animate-pulse`}></div>
                  <span className="text-white text-xs">
                    {connectionState === 'connected' ? 'Connected' :
                     connectionState === 'connecting' ? 'Connecting...' :
                     connectionState === 'failed' ? 'Connection Failed' : 'Disconnected'}
                  </span>
                </div>

                {/* Audio Levels */}
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">You</span>
                      {isMuted && <MicOff className="w-3 h-3 text-red-500" />}
                    </div>
                    <AudioLevelBar level={isMuted ? 0 : localAudioLevel} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Partner</span>
                    </div>
                    <AudioLevelBar level={remoteAudioLevel} />
                  </div>
                </div>

                {/* Additional Controls */}
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={onToggleMute}
                    className={`p-2 rounded-full transition-colors ${
                      isMuted
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={onToggleChat}
                    className={`p-2 rounded-full transition-colors ${
                      showChat
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                    title="Toggle Chat"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  {/* Game Button */}
                  {gameHook && (
                    <button
                      onClick={() => setIsGameOpen(true)}
                      className={`p-2 rounded-full transition-colors relative ${
                        gameHook.isPlaying || gameHook.gameStatus === 'invite_received'
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                      title="Play Games"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      {/* Notification dot for invite */}
                      {gameHook.gameStatus === 'invite_received' && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                      )}
                    </button>
                  )}
                </div>

                {/* Chat Panel */}
                {showChat && (
                  <div className="border-t border-gray-700 pt-3 mt-3 space-y-2">
                    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-2">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.senderId === partner?.id ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-xs px-2 py-1 rounded text-xs ${
                              message.senderId === partner?.id
                                ? 'bg-gray-700 text-white'
                                : 'bg-primary-600 text-white'
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="flex space-x-2">
                      <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-700 text-white rounded px-2 py-1 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
                        rows={1}
                        maxLength={3000}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white p-1.5 rounded transition-colors"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hidden audio element for remote stream */}
          {isInCall && <audio ref={remoteAudioRef} autoPlay playsInline />}
        </div>
      </div>

      {/* Filters Modal */}
      {isFiltersModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsFiltersModalOpen(false)}
        >
          <div 
            className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-primary-400" />
                <h2 className="text-xl font-semibold text-white">Select Countries</h2>
              </div>
              <button
                onClick={() => setIsFiltersModalOpen(false)}
                className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Selected Countries */}
            {selectedCountries.length > 0 && (
              <div className="p-4 border-b border-gray-700">
                <div className="flex flex-wrap gap-2">
                  {selectedCountries.map(code => {
                    const country = COUNTRIES.find(c => c.code === code)
                    return country ? (
                      <div
                        key={code}
                        className="flex items-center space-x-1.5 bg-primary-600 text-white px-3 py-1 rounded-full text-sm"
                      >
                        <Flag countryCode={country.code} size={16} />
                        <span>{country.name}</span>
                        <button
                          onClick={() => toggleCountry(code)}
                          className="hover:bg-primary-700 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : null
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {selectedCountries.length}/3 countries selected
                </p>
              </div>
            )}

            {/* Search Input */}
            <div className="p-4 border-b border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Search countries (e.g., 'cana' for Canada)"
                  className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Countries List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {filteredCountries.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No countries found</p>
              ) : (
                <div className="space-y-1">
                  {filteredCountries.map(country => {
                    const isSelected = selectedCountries.includes(country.code)
                    const isDisabled = !isSelected && selectedCountries.length >= 3
                    return (
                      <button
                        key={country.code}
                        onClick={() => toggleCountry(country.code)}
                        disabled={isDisabled}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                          isSelected
                            ? 'bg-primary-600 text-white'
                            : isDisabled
                            ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <Flag countryCode={country.code} size={20} />
                        <span>{country.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-700 flex items-center justify-between">
              <span className="text-sm text-gray-400">
                {selectedCountries.length}/3 selected
              </span>
              <button
                onClick={() => setIsFiltersModalOpen(false)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hangman Game Modal */}
      {gameHook && (
        <HangmanGame
          gameStatus={gameHook.gameStatus}
          game={gameHook.game}
          role={gameHook.role}
          pendingInvite={gameHook.pendingInvite}
          gameResult={gameHook.gameResult}
          error={gameHook.error}
          inviteToGame={gameHook.inviteToGame}
          acceptInvite={gameHook.acceptInvite}
          declineInvite={gameHook.declineInvite}
          setWord={gameHook.setWord}
          guessLetter={gameHook.guessLetter}
          guessWord={gameHook.guessWord}
          endGame={gameHook.endGame}
          requestRematch={gameHook.requestRematch}
          acceptRematch={gameHook.acceptRematch}
          resetGame={gameHook.resetGame}
          clearError={gameHook.clearError}
          isOpen={isGameOpen || gameHook.gameStatus === 'invite_received'}
          onClose={() => setIsGameOpen(false)}
        />
      )}
    </div>
  )
}
