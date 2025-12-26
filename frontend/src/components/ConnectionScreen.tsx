'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Phone, Users, Globe, ChevronDown, ChevronUp, Mic, MicOff, MessageSquare, X, Send, Search, Gamepad2, Flag as FlagIcon, ShieldOff, History } from 'lucide-react'
import { ServerStats, UserFilters, User, ChatMessage, ReportUserData, CallHistoryEntry } from '@/types'
import { AudioLevelBar } from './AudioLevelBar'
import { Flag } from './Flag'
import { HangmanGame } from './HangmanGame'
import { COUNTRIES } from '@/lib/countries'
import { getCountryName } from '@/lib/utils'
import { useGame } from '@/hooks/useGame'
import { ReportModal } from './ReportModal'
import { BlockDialog } from './BlockDialog'
import { NotificationModal } from './NotificationModal'
import { CallHistorySidebar } from './CallHistorySidebar'
import { CallbackRequestModal } from './CallbackRequestModal'

interface ConnectionScreenProps {
  onStartCall: (filters?: UserFilters) => void
  stats: ServerStats | null
  isConnected?: boolean
  isReconnecting?: boolean
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
  // Moderation props
  onReportUser?: (data: ReportUserData) => void
  onBlockUser?: (blockedUserId: string) => void
  onUnblockUser?: (unblockedUserId: string) => void
  blockedUsers?: string[]
  setModerationCallbacks?: (callbacks: {
    onReportSuccess?: (message: string) => void
    onReportError?: (error: string) => void
    onBlockSuccess?: (message: string) => void
    onBlockError?: (error: string) => void
    onSuspiciousBehavior?: (data: { message: string; reasons: string[] }) => void
    onModerationWarning?: (message: string) => void
    onChatError?: (message: string) => void
  }) => void
  // Call history props
  callHistory?: CallHistoryEntry[]
  onlineUsers?: Set<string>
  onRequestCallback?: (partnerId: string, originalCallTimestamp?: Date, originalCallCountry?: string) => void
  onClearHistory?: () => void
  incomingCallbackRequest?: {
    requestId: string
    fromUserId: string
    fromCountry?: string
    originalCallTimestamp?: Date
    originalCallCountry?: string
  } | null
  onAcceptCallback?: (requestId: string) => void
  onDeclineCallback?: (requestId: string) => void
  onBlockedUserRemoved?: (blockedUserId: string) => void
}

export function ConnectionScreen({ 
  onStartCall, 
  stats,
  isConnected = true,
  isReconnecting = false,
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
  // Moderation
  onReportUser,
  onBlockUser,
  onUnblockUser,
  blockedUsers = [],
  setModerationCallbacks,
  // Call history props
  callHistory = [],
  onlineUsers = new Set(),
  onRequestCallback,
  onClearHistory,
  incomingCallbackRequest,
  onAcceptCallback,
  onDeclineCallback,
  onBlockedUserRemoved,
}: ConnectionScreenProps) {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isEndingCall, setIsEndingCall] = useState(false)
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [isGameOpen, setIsGameOpen] = useState(false)
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  
  // Moderation state
  const [showReportModal, setShowReportModal] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [notification, setNotification] = useState<{
    isOpen: boolean
    type: 'success' | 'warning' | 'error'
    title: string
    message: string
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  })
  const shouldBlockAfterReportRef = useRef(false)
  
  const loading = isLoading || externalLoading
  
  // isInCall: true only when we have partner AND sessionId (actual call state)
  const isInCall = !!partner && !!sessionId
  
  // Reset all loading states when call ends
  useEffect(() => {
    if (!isInCall) {
      // Not in call - ensure all loading states are reset
      setIsLoading(false)
      setIsEndingCall(false)
    }
  }, [isInCall])

  // Set up moderation callbacks
  useEffect(() => {
    if (setModerationCallbacks) {
      setModerationCallbacks({
        onReportSuccess: (message: string) => {
          setNotification({
            isOpen: true,
            type: 'success',
            title: 'Report Submitted',
            message: message || 'Your report has been submitted successfully. Thank you for helping keep our community safe.',
          })
          // End call after reporting
          if (onEndCall) {
            setTimeout(() => {
              onEndCall()
            }, 1000)
          }
        },
        onReportError: (error: string) => {
          setNotification({
            isOpen: true,
            type: 'error',
            title: 'Report Failed',
            message: error || 'Failed to submit report. Please try again.',
          })
        },
        onBlockSuccess: (message: string) => {
          setNotification({
            isOpen: true,
            type: 'success',
            title: 'User Blocked',
            message: message || 'This user has been blocked. You will not be matched with them again.',
          })
        },
        onBlockError: (error: string) => {
          setNotification({
            isOpen: true,
            type: 'error',
            title: 'Block Failed',
            message: error || 'Failed to block user. Please try again.',
          })
        },
        onSuspiciousBehavior: (data: { message: string; reasons: string[] }) => {
          setNotification({
            isOpen: true,
            type: 'warning',
            title: 'Suspicious Behavior Detected',
            message: `${data.message}\n\nReasons: ${data.reasons.join(', ')}\n\nYou can report this user if needed.`,
          })
        },
        onModerationWarning: (message: string) => {
          setNotification({
            isOpen: true,
            type: 'warning',
            title: 'Moderation Warning',
            message: message,
          })
        },
        onChatError: (message: string) => {
          setNotification({
            isOpen: true,
            type: 'error',
            title: 'Message Failed',
            message: message,
          })
        },
      })
    }
  }, [setModerationCallbacks, onEndCall])

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
          <div className="flex items-center justify-between mb-2 sm:mb-0 flex-wrap gap-2">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-shrink">
              <Link href="/" className="text-lg sm:text-2xl font-bold text-white whitespace-nowrap hover:opacity-80 transition-opacity">Pokytalk</Link>
              <span className="hidden sm:inline text-gray-400 text-sm">Voice chat with random people</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-4 text-xs text-gray-400 flex-shrink-0">
              <a href="/blog" className="hover:text-white transition-colors whitespace-nowrap">Blog</a>
              <span className="hidden sm:inline">•</span>
              <span className="sm:hidden text-gray-600">|</span>
              <a href="/privacy" className="hover:text-white transition-colors whitespace-nowrap">Privacy</a>
              <span className="hidden sm:inline">•</span>
              <span className="sm:hidden text-gray-600">|</span>
              <a href="/terms" className="hover:text-white transition-colors whitespace-nowrap">Terms</a>
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
              <div className="text-gray-300 text-xs sm:text-sm flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-primary-400 border-t-transparent"></div>
                <span><span className="text-primary-400 font-semibold">Connecting...</span> Finding someone to talk with</span>
              </div>
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
        <div className="w-full max-w-6xl space-y-6">
          {/* Community Guidelines - Only show when not initialized (first time, before any call) */}
          {!isInitialized && (
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
                    // Hang up: end the call
                    if (onEndCall) {
                      onEndCall()
                    }
                  } else {
                    // Start call: same function as homepage Call button
                    if (!isWaiting && !loading && isConnected) {
                      handleStartCall()
                    }
                  }
                }}
                disabled={isInCall ? false : (loading || !isConnected || isWaiting)}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isInCall
                    ? 'bg-red-600 hover:bg-red-700'
                    : isWaiting || loading
                    ? 'bg-gray-600 cursor-wait'
                    : 'bg-primary-600 hover:bg-primary-700'
                } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
              >
                {/* Loading Spinner - show when waiting or loading (before call starts) */}
                {!isInCall && (isWaiting || loading) && (
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                )}
                
                {/* Call Icon - when idle (not in call, not waiting, not loading) */}
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

            {/* Call Info - Show when initialized (audio ready) - keeps layout after hang up */}
            {isInitialized && (
              <div className={`w-full bg-gray-800 rounded-lg p-4 ${showChat && isInCall ? 'lg:flex lg:items-stretch lg:space-x-4 lg:space-y-0' : 'space-y-4'}`}>
                {/* Left Column - Controls and Audio Levels */}
                <div className={`space-y-4 ${showChat && isInCall ? 'lg:w-[350px] lg:flex-shrink-0' : 'w-full'}`}>
                  {/* Connection Status - only show when in call */}
                  {isInCall && (
                    <div className="flex items-center justify-center space-x-2">
                      <div className={`w-2 h-2 ${
                        isReconnecting ? 'bg-yellow-500' :
                        connectionState === 'connected' ? 'bg-green-500' :
                        connectionState === 'connecting' ? 'bg-yellow-500' :
                        connectionState === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                      } rounded-full animate-pulse`}></div>
                      <span className="text-white text-xs">
                        {isReconnecting ? 'Reconnecting...' :
                         connectionState === 'connected' ? 'Connected' :
                         connectionState === 'connecting' ? 'Connecting...' :
                         connectionState === 'failed' ? 'Connection Failed' : 'Disconnected'}
                      </span>
                    </div>
                  )}

                  {/* Audio Levels */}
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">You</span>
                        {isMuted && <MicOff className="w-3 h-3 text-red-500" />}
                      </div>
                      <AudioLevelBar level={isMuted ? 0 : localAudioLevel} />
                    </div>
                    {/* Partner audio level - only show when in call */}
                    {isInCall && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Partner</span>
                        </div>
                        <AudioLevelBar level={remoteAudioLevel} />
                      </div>
                    )}
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
                      className={`p-2 rounded-full transition-colors relative ${
                        showChat
                          ? 'bg-primary-600 hover:bg-primary-700 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                      title="Toggle Chat"
                    >
                      <MessageSquare className="w-4 h-4" />
                      {messages.length > 0 && !showChat && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                          {messages.length > 9 ? '9+' : messages.length}
                        </span>
                      )}
                    </button>

                    {/* History Button */}
                    {callHistory && callHistory.length > 0 && (
                      <button
                        onClick={() => setIsHistorySidebarOpen(true)}
                        className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors relative"
                        title="Call History"
                      >
                        <History className="w-4 h-4" />
                        {callHistory.length > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                            {callHistory.length > 9 ? '9+' : callHistory.length}
                          </span>
                        )}
                      </button>
                    )}

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

                  {/* Safety Section - Only show when in call */}
                  {isInCall && partner && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="flex items-center justify-center space-x-3">
                        <button
                          onClick={() => setShowReportModal(true)}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                          title="Report this user"
                        >
                          <FlagIcon className="w-4 h-4" />
                          <span>Report</span>
                        </button>
                        <button
                          onClick={() => setShowBlockDialog(true)}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
                          title="Block this user"
                        >
                          <ShieldOff className="w-4 h-4" />
                          <span>Block</span>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Report or block users who violate our community guidelines
                      </p>
                    </div>
                  )}
                </div>

                {/* Chat Panel - WhatsApp-like design - only show when in call */}
                {showChat && isInCall && (
                  <div className={`border-t border-gray-700 mt-4 lg:border-t-0 lg:mt-0 lg:border-l lg:border-gray-700 lg:pl-4 flex flex-col flex-1 lg:w-[450px] lg:flex-shrink-0`} style={{ minHeight: '500px', maxHeight: 'calc(100vh - 200px)' }}>
                    {/* Chat Header */}
                    <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700 flex items-center justify-between rounded-t-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white text-sm font-semibold">Chat</h3>
                          {partner && (
                            <p className="text-gray-400 text-xs">{getCountryName(partner.country)}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={onToggleChat}
                        className="text-gray-400 hover:text-white transition-colors p-1 lg:hidden"
                        title="Close chat"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Messages Area - WhatsApp-like bubbles */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar bg-gray-900/30">
                      {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500 text-sm">No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        messages.map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${message.senderId === partner?.id ? 'justify-start' : 'justify-end'}`}
                          >
                            <div
                              className={`max-w-[75%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm ${
                                message.senderId === partner?.id
                                  ? 'bg-gray-700 text-white rounded-tl-sm'
                                  : 'bg-primary-600 text-white rounded-tr-sm'
                              }`}
                            >
                              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area - WhatsApp-like */}
                    <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700 rounded-b-lg">
                      <div className="flex items-end space-x-2">
                        <div className="flex-1 bg-gray-700 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary-500 transition-all">
                          <textarea
                            value={messageInput}
                            onChange={(e) => {
                              setMessageInput(e.target.value)
                              // Auto-resize textarea
                              e.target.style.height = 'auto'
                              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                            }}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            className="w-full bg-transparent text-white placeholder-gray-400 text-sm resize-none focus:outline-none max-h-[120px]"
                            rows={1}
                            maxLength={3000}
                            style={{ minHeight: '24px' }}
                          />
                        </div>
                        <button
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim()}
                          className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:opacity-50 text-white p-3 rounded-full transition-all transform hover:scale-105 active:scale-95 disabled:transform-none flex-shrink-0 shadow-lg"
                          title="Send message"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        {messageInput.length}/3000 characters
                      </p>
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

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        partnerId={partner?.id || null}
        sessionId={sessionId || null}
        onClose={() => {
          setShowReportModal(false)
          shouldBlockAfterReportRef.current = false
        }}
        onReport={(data) => {
          if (onReportUser) {
            onReportUser(data)
            // If block after report was requested, block now
            if (shouldBlockAfterReportRef.current && partner && onBlockUser) {
              onBlockUser(partner.id)
            }
          }
        }}
      />

      {/* Block Dialog */}
      <BlockDialog
        isOpen={showBlockDialog}
        partnerId={partner?.id || null}
        onClose={() => setShowBlockDialog(false)}
        onBlock={(blockedUserId) => {
          if (onBlockUser) {
            onBlockUser(blockedUserId)
            // End call after blocking
            if (onEndCall) {
              onEndCall()
            }
          }
        }}
        onBlockAndReport={() => {
          setShowBlockDialog(false)
          shouldBlockAfterReportRef.current = true
          setShowReportModal(true)
        }}
      />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Call History Sidebar */}
      <CallHistorySidebar
        isOpen={isHistorySidebarOpen}
        onClose={() => setIsHistorySidebarOpen(false)}
        history={callHistory}
        onlineUsers={onlineUsers}
        blockedUsers={blockedUsers}
        onRequestCallback={(partnerId, originalCallTimestamp, originalCallCountry) => {
          if (onRequestCallback) {
            onRequestCallback(partnerId, originalCallTimestamp, originalCallCountry)
          }
        }}
        onClearHistory={() => {
          if (onClearHistory) {
            onClearHistory()
          }
        }}
      />

      {/* Callback Request Modal */}
      {incomingCallbackRequest && (
        <CallbackRequestModal
          isOpen={!!incomingCallbackRequest}
          requestId={incomingCallbackRequest.requestId}
          fromUserId={incomingCallbackRequest.fromUserId}
          fromCountry={incomingCallbackRequest.fromCountry}
          originalCallTimestamp={incomingCallbackRequest.originalCallTimestamp}
          originalCallCountry={incomingCallbackRequest.originalCallCountry}
          onAccept={(requestId) => {
            if (onAcceptCallback) {
              onAcceptCallback(requestId)
            }
          }}
          onDecline={(requestId) => {
            if (onDeclineCallback) {
              onDeclineCallback(requestId)
            }
          }}
          onClose={() => {
            // Decline the request when modal is closed
            if (onDeclineCallback && incomingCallbackRequest) {
              onDeclineCallback(incomingCallbackRequest.requestId)
            }
          }}
        />
      )}
    </div>
  )
}
