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
import { HomepageInfoSection } from './HomepageInfoSection'
import { BlogWidget } from './BlogWidget'

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
  const [callDuration, setCallDuration] = useState(0)
  
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

  // Call timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInCall]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

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
      <div className="flex-1 flex flex-col items-center w-full relative sm:py-6">
        <div className="w-full h-full max-w-md flex flex-col justify-between sm:rounded-[3rem] sm:border-[8px] sm:border-gray-800 sm:bg-black overflow-hidden relative shadow-2xl">
          
          {(!isInitialized || (!isInCall && !isWaiting && !loading)) && (
            // Dialer UI - Initial State
            <div className="flex-1 flex flex-col w-full h-full bg-black">
              {/* Display Area */}
              <div className="flex-1 flex flex-col items-center justify-center pb-8 min-h-[120px]">
                <div className="w-full text-center px-4">
                  <h1 className="text-4xl text-white font-light tracking-wide truncate">
                    Pokytalk
                  </h1>
                  <p className="text-sm text-gray-400 mt-2 font-medium">Tap to call a random stranger</p>
                </div>
              </div>

              {/* Call Action */}
              <div className="flex justify-center items-center w-full max-w-[280px] mx-auto mb-10 px-2">
                <button
                  onClick={() => {
                    if (!isWaiting && !loading && isConnected) handleStartCall()
                  }}
                  disabled={loading || !isConnected || isWaiting}
                  className="w-20 h-20 rounded-full bg-[#34C759] hover:bg-[#2ecc71] active:bg-[#27ae60] flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(52,199,89,0.3)] disabled:opacity-50"
                  title="Start Random Call"
                >
                  <Phone className="w-9 h-9 text-white fill-current" />
                </button>
              </div>

              {/* Minimal Community Note */}
              <div className="text-center pb-4 text-xs text-gray-600">
                18+ Only. Be respectful. <a href="/terms" className="underline hover:text-gray-400">Terms</a>
              </div>
            </div>
          )}

          {(isWaiting || loading) && !isInCall && (
            // Calling UI
            <div className="flex-1 flex flex-col items-center justify-between py-12 bg-black w-full h-full">
              <div className="text-center space-y-2 mt-8">
                <h2 className="text-3xl font-light text-white">Calling...</h2>
                <p className="text-gray-400">Finding a random stranger</p>
              </div>

              <div className="relative my-8">
                <div className="absolute inset-0 rounded-full bg-[#34C759] opacity-20 animate-ping"></div>
                <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center relative z-10 border border-gray-700">
                  <Users className="w-12 h-12 text-[#34C759] animate-pulse" />
                </div>
              </div>

              <div className="mb-10">
                 <button
                    onClick={() => {
                      if (onEndCall) onEndCall()
                      setIsLoading(false)
                    }}
                    className="w-20 h-20 rounded-full bg-[#FF3B30] hover:bg-red-500 active:bg-red-600 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,59,48,0.3)]"
                  >
                    <Phone className="w-9 h-9 text-white fill-current rotate-[135deg]" />
                  </button>
              </div>
            </div>
          )}

          {isInCall && partner && (
            // In Call UI
            <div className="flex-1 flex flex-col w-full h-full bg-black relative">
              {/* Call Info Status */}
              <div className="flex flex-col items-center pt-10 space-y-3">
                <div className="flex flex-col items-center">
                  <h2 className="text-3xl font-light text-white mb-2">{getCountryName(partner.country)}</h2>
                  <div className="flex space-x-2 items-center">
                    <span className="text-gray-400 font-mono text-sm">{formatTime(callDuration)}</span>
                    {partner.country && <Flag countryCode={partner.country} size={16} />}
                  </div>
                </div>
              </div>

              {/* Visualizer / Avatar Area */}
              <div className="flex-1 flex items-center justify-center min-h-[160px]">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#34C759] opacity-20 animate-pulse"></div>
                  <div className="w-32 h-32 rounded-full flex items-center justify-center border-2 border-[#34C759]/30 bg-gray-800 relative z-10">
                    <Users className="w-12 h-12 text-white opacity-80" />
                  </div>
                </div>
              </div>
              
              {/* Audio Bars */}
              <div className="w-full max-w-[200px] mx-auto space-y-4 mb-4">
                <div className="flex justify-between items-center opacity-70">
                  <Mic className="w-4 h-4 text-gray-500" />
                  <div className="flex-1 mx-4"><AudioLevelBar level={isMuted ? 0 : localAudioLevel} /></div>
                </div>
                <div className="flex justify-between items-center opacity-70">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div className="flex-1 mx-4"><AudioLevelBar level={remoteAudioLevel} /></div>
                </div>
              </div>

              {/* Call Controls Grid */}
              <div className="grid grid-cols-3 gap-y-6 gap-x-4 max-w-[280px] mx-auto mt-auto mb-10 w-full px-6">
                {/* Mute Button */}
                <div className="flex flex-col items-center group">
                  <button 
                    onClick={onToggleMute}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                      isMuted ? 'bg-white text-gray-900' : 'bg-gray-800 text-white hover:bg-gray-700 active:bg-gray-600'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                  </button>
                  <span className="text-xs text-gray-400 mt-2">Mute</span>
                </div>

                {/* Chat Button */}
                <div className="flex flex-col items-center group relative">
                  <button 
                    onClick={onToggleChat}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                      showChat ? 'bg-white text-gray-900' : 'bg-gray-800 text-white hover:bg-gray-700 active:bg-gray-600'
                    }`}
                  >
                    <MessageSquare className="w-7 h-7" />
                    {messages.length > 0 && !showChat && (
                      <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold border-2 border-black">
                        {messages.length}
                      </span>
                    )}
                  </button>
                  <span className="text-xs text-gray-400 mt-2">Chat</span>
                </div>

                {/* Safety / Report Button */}
                <div className="flex flex-col items-center group">
                  <button 
                    onClick={() => setShowReportModal(true)}
                    className="w-16 h-16 rounded-full flex items-center justify-center transition-all bg-gray-800 text-white hover:bg-gray-700 active:bg-gray-600"
                  >
                    <ShieldOff className="w-6 h-6 text-red-500" />
                  </button>
                  <span className="text-xs text-gray-400 mt-2">Safety</span>
                </div>
              </div>

              {/* End Call Button */}
              <div className="flex justify-center pb-10">
                <button
                  onClick={() => {
                    if (onEndCall) onEndCall()
                  }}
                  className="w-20 h-20 rounded-full bg-[#FF3B30] hover:bg-red-500 active:bg-red-600 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,59,48,0.3)]"
                >
                  <Phone className="w-9 h-9 text-white fill-current rotate-[135deg]" />
                </button>
              </div>

              {/* Native-like Chat Overlay */}
              {showChat && (
                <div className="absolute inset-x-0 bottom-0 top-16 bg-[#1C1C1E] z-30 flex flex-col rounded-t-3xl overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-5">
                  <div className="px-5 py-4 bg-[#1C1C1E] flex items-center justify-between border-b border-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white text-base font-semibold">Messages</h3>
                      </div>
                    </div>
                    <button
                      onClick={onToggleChat}
                      className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar bg-black pb-4">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-gray-500 text-sm">No messages yet</span>
                      </div>
                    ) : (
                      messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.senderId === partner?.id ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[15px] shadow-sm leading-snug ${
                              message.senderId === partner?.id
                                ? 'bg-[#2C2C2E] text-white rounded-tl-sm'
                                : 'bg-[#0B84FF] text-white rounded-tr-sm'
                            }`}
                          >
                            <p className="break-words whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="px-4 py-3 bg-[#1C1C1E] border-t border-gray-800 pb-safe">
                    <div className="flex items-end space-x-3">
                      <div className="flex-1 bg-black rounded-full px-4 py-2.5 border border-gray-800 focus-within:border-gray-600 overflow-hidden flex items-center">
                        <textarea
                          value={messageInput}
                          onChange={(e) => {
                            setMessageInput(e.target.value)
                            e.target.style.height = 'auto'
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`
                          }}
                          onKeyPress={handleKeyPress}
                          placeholder="Text Message"
                          className="w-full bg-transparent text-white placeholder-gray-500 text-[15px] resize-none focus:outline-none max-h-[100px] flex items-center pt-0.5"
                          rows={1}
                          maxLength={3000}
                          style={{ minHeight: '22px' }}
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className="bg-[#0B84FF] disabled:bg-[#0B84FF]/40 text-white w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors self-end mb-0.5"
                      >
                        <Send className="w-4 h-4 ml-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Homepage Info Section and Blog Widget - Hidden for dialer aesthetic, but kept in dom for SEO / accessibility */}
        {!isInitialized && (
          <div className="w-full max-w-md mx-auto hidden sm:block mt-8">
            <HomepageInfoSection />
            <BlogWidget />
          </div>
        )}

        {/* Hidden audio element for remote stream */}
        {isInCall && <audio ref={remoteAudioRef} autoPlay playsInline />}
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
          gameStatus={gameHook!.gameStatus}
          game={gameHook!.game}
          role={gameHook!.role}
          pendingInvite={gameHook!.pendingInvite}
          gameResult={gameHook!.gameResult}
          error={gameHook!.error}
          inviteToGame={gameHook!.inviteToGame}
          acceptInvite={gameHook!.acceptInvite}
          declineInvite={gameHook!.declineInvite}
          setWord={gameHook!.setWord}
          guessLetter={gameHook!.guessLetter}
          guessWord={gameHook!.guessWord}
          endGame={gameHook!.endGame}
          requestRematch={gameHook!.requestRematch}
          acceptRematch={gameHook!.acceptRematch}
          resetGame={gameHook!.resetGame}
          clearError={gameHook!.clearError}
          isOpen={isGameOpen || gameHook!.gameStatus === 'invite_received'}
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
          requestId={incomingCallbackRequest!.requestId}
          fromUserId={incomingCallbackRequest!.fromUserId}
          fromCountry={incomingCallbackRequest!.fromCountry}
          originalCallTimestamp={incomingCallbackRequest!.originalCallTimestamp}
          originalCallCountry={incomingCallbackRequest!.originalCallCountry}
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
