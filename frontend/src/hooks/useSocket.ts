import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { User, UserFilters, WebRTCMessage, ChatMessage, ServerStats, ReportUserData } from '@/types'

// Dynamic backend URL detection - use same hostname as frontend
const getBackendUrl = (): string => {
  // In browser, check if we're in local development first
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    
    // Local development: localhost, 127.0.0.1, or local IP addresses (192.168.x.x, 10.x.x.x, etc.)
    const isLocalDev = 
      hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname === 'SHAHZOORDESKTOP' ||
      hostname.match(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/) // Any IP address
    
    if (isLocalDev) {
      // For local development, always use same hostname with port 3001
      return `${protocol}//${hostname}:3001`
    }
    
    // Production domain mapping: pokytalk.com -> app.pokytalk.com
    if (hostname === 'pokytalk.com' || hostname === 'www.pokytalk.com') {
      return `${protocol}//app.pokytalk.com`
    }
    
    // For app.pokytalk.com, use same domain
    if (hostname === 'app.pokytalk.com') {
      return `${protocol}//app.pokytalk.com`
    }
    
    // If NEXT_PUBLIC_BACKEND_URL is explicitly set and we're not in local dev, use it
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
      return process.env.NEXT_PUBLIC_BACKEND_URL
    }
    
    // Fallback: use same hostname with port 3001
    return `${protocol}//${hostname}:3001`
  }
  
  // Fallback for SSR
  return 'http://localhost:3001'
}

const BACKEND_URL = getBackendUrl()

// Detect country using IP geolocation API
async function detectCountry(): Promise<string | undefined> {
  try {
    // Use free IP geolocation API (ipapi.co)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    
    const response = await fetch('https://ipapi.co/json/', { 
      signal: controller.signal 
    })
    clearTimeout(timeoutId)
    
    const data = await response.json()
    if (data?.country_code) {
      console.log(`🌍 Detected country from IP: ${data.country_code}`)
      return data.country_code
    }
  } catch (e) {
    console.log('Could not detect country from IP geolocation:', e)
  }

  // Fallback: Try to get from timezone (less accurate but works offline)
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    // Some timezones contain country info, but this is unreliable
    // Just return undefined if IP detection fails
  } catch (e) {
    // ignore
  }

  return undefined
}

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [isWaiting, setIsWaiting] = useState(false)
  const [partner, setPartner] = useState<User | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [blockedUsers, setBlockedUsers] = useState<string[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [incomingCallbackRequest, setIncomingCallbackRequest] = useState<{
    requestId: string
    fromUserId: string
    fromCountry?: string
    originalCallTimestamp?: Date
    originalCallCountry?: string
  } | null>(null)
  
  // Preserve call state during disconnection
  const preservedPartnerRef = useRef<User | null>(null)
  const preservedSessionIdRef = useRef<string | null>(null)
  
  // Callbacks for moderation events (set by components)
  const moderationCallbacksRef = useRef<{
    onReportSuccess?: (message: string) => void
    onReportError?: (error: string) => void
    onBlockSuccess?: (message: string) => void
    onBlockError?: (error: string) => void
    onSuspiciousBehavior?: (data: { message: string; reasons: string[] }) => void
    onModerationWarning?: (message: string) => void
    onChatError?: (message: string) => void
  }>({})
  
  // Callbacks for callback request events (set by components)
  const callbackCallbacksRef = useRef<{
    onCallbackRequestReceived?: (data: {
      requestId: string
      fromUserId: string
      fromCountry?: string
      originalCallTimestamp?: Date
      originalCallCountry?: string
    }) => void
    onCallbackRequestAccepted?: (data: {
      requestId: string
      partner: User
      sessionId: string
      initiatorId: string
    }) => void
    onCallbackRequestDeclined?: (data: { requestId: string; message: string }) => void
    onCallbackRequestExpired?: (data: { requestId: string }) => void
    onCallbackMutual?: (data: {
      partner: User
      sessionId: string
      initiatorId: string
    }) => void
  }>({})

  useEffect(() => {
    console.log('Attempting to connect to:', BACKEND_URL)
    const newSocket = io(BACKEND_URL, {
      transports: ['polling', 'websocket'],  // Try polling first, then upgrade to websocket
      autoConnect: true,
      withCredentials: true,
      // Enhanced reconnection settings
      reconnection: true,
      reconnectionDelay: 1000, // Start with 1 second
      reconnectionDelayMax: 10000, // Max 10 seconds between attempts
      reconnectionAttempts: Infinity, // Keep trying indefinitely
      timeout: 20000, // Connection timeout
    })

    newSocket.on('connect', async () => {
      setIsConnected(true)
      setIsReconnecting(false)
      console.log('✅ Connected to server')
      
      // If we have preserved call state, try to restore it
      if (preservedPartnerRef.current && preservedSessionIdRef.current) {
        console.log('🔄 Restoring call state after reconnection')
        setPartner(preservedPartnerRef.current)
        setSessionId(preservedSessionIdRef.current)
        // Re-request chat history if needed
        if (preservedSessionIdRef.current) {
          newSocket.emit('chat:history', preservedSessionIdRef.current)
        }
      } else {
        // Only detect country and connect user if not in a call
        const country = await detectCountry()
        console.log('Emitting user:connect event', country ? `with country: ${country}` : 'without country')
        newSocket.emit('user:connect', country ? { country } : {})
      }
    })

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false)
      console.log('❌ Disconnected from server:', reason)
      
      // Preserve call state if we're in a call
      if (partner && sessionId) {
        console.log('💾 Preserving call state during disconnect')
        preservedPartnerRef.current = partner
        preservedSessionIdRef.current = sessionId
        setIsReconnecting(true)
      } else {
        // Only clear state if not in a call
        setUser(null)
        preservedPartnerRef.current = null
        preservedSessionIdRef.current = null
      }
      
      // Don't clear partner/sessionId on disconnect - preserve for reconnection
      // Only clear waiting state
      setIsWaiting(false)
    })

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      setIsReconnecting(true)
      console.log(`🔄 Reconnection attempt ${attemptNumber}`)
    })

    newSocket.on('reconnect', (attemptNumber) => {
      setIsReconnecting(false)
      console.log(`✅ Reconnected after ${attemptNumber} attempts`)
    })

    newSocket.on('reconnect_error', (error) => {
      console.log('⚠️ Reconnection error:', error)
      setIsReconnecting(true)
    })

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed - will keep trying')
      setIsReconnecting(true)
    })

    newSocket.on('user:connect', (userData: User) => {
      console.log('Received user:connect response:', userData)
      setUser(userData)
      // Add user to online users
      setOnlineUsers(prev => new Set(prev).add(userData.id))
    })

    // Track online/offline status for call history
    newSocket.on('user:online', (userId: string) => {
      console.log('👤 User online:', userId)
      setOnlineUsers(prev => new Set(prev).add(userId))
    })

    newSocket.on('user:offline', (userId: string) => {
      console.log('👤 User offline:', userId)
      setOnlineUsers(prev => {
        const updated = new Set(prev)
        updated.delete(userId)
        return updated
      })
    })

    newSocket.on('call:waiting', () => {
      setIsWaiting(true)
    })

    newSocket.on('call:matched', (partnerData: User, sessionId: string, initiatorId?: string) => {
      console.log('📞 call:matched received:', {
        partnerId: partnerData.id,
        partnerCountry: partnerData.country || 'undefined',
        sessionId,
        initiatorId,
        fullPartnerData: partnerData
      })
      setPartner(partnerData)
      setSessionId(sessionId)
      // Update preserved state
      preservedPartnerRef.current = partnerData
      preservedSessionIdRef.current = sessionId
      setIsWaiting(false)
      if (initiatorId) {
        // Store initiatorId on socket instance for quick access by components
        // @ts-expect-error augment runtime value
        newSocket.__webrtcInitiatorId = initiatorId
      }
      console.log('✅ Matched with partner:', partnerData.id, 'Country:', partnerData.country || 'Not set')
    })

    newSocket.on('call:ended', (sessionId: string) => {
      setPartner(null)
      setSessionId(null)
      setMessages([])
      // Clear preserved state
      preservedPartnerRef.current = null
      preservedSessionIdRef.current = null
      setIsWaiting(false) // Reset waiting state when call ends
      console.log('Call ended')
    })

    newSocket.on('chat:message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message])
    })

    newSocket.on('chat:history', (history: ChatMessage[]) => {
      setMessages(history)
    })

    newSocket.on('stats:update', (statsData: ServerStats) => {
      setStats(statsData)
    })

    // Online status tracking for call history
    newSocket.on('user:online', (userId: string) => {
      console.log('👤 User online:', userId)
      setOnlineUsers(prev => new Set([...prev, userId]))
    })

    newSocket.on('user:offline', (userId: string) => {
      console.log('👤 User offline:', userId)
      setOnlineUsers(prev => {
        const updated = new Set(prev)
        updated.delete(userId)
        return updated
      })
    })

    newSocket.on('error', (message: string) => {
      console.error('Socket error:', message)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    // Moderation event listeners
    newSocket.on('user:report:success', (data: { message: string; reportId: string }) => {
      console.log('✅ Report submitted successfully:', data)
      moderationCallbacksRef.current.onReportSuccess?.(data.message)
    })

    newSocket.on('user:report:error', (error: string) => {
      console.error('❌ Report error:', error)
      moderationCallbacksRef.current.onReportError?.(error)
    })

    newSocket.on('user:block:success', (data: { message: string; blockedUserId: string }) => {
      console.log('✅ User blocked successfully:', data)
      setBlockedUsers(prev => {
        if (!prev.includes(data.blockedUserId)) {
          return [...prev, data.blockedUserId]
        }
        return prev
      })
      moderationCallbacksRef.current.onBlockSuccess?.(data.message)
    })

    newSocket.on('user:block:error', (error: string) => {
      console.error('❌ Block error:', error)
      moderationCallbacksRef.current.onBlockError?.(error)
    })

    newSocket.on('user:unblock:success', (data: { unblockedUserId: string }) => {
      console.log('✅ User unblocked successfully:', data)
      setBlockedUsers(prev => prev.filter(id => id !== data.unblockedUserId))
    })

    newSocket.on('user:blocked:list', (blockedUserIds: string[]) => {
      console.log('📋 Blocked users list:', blockedUserIds)
      setBlockedUsers(blockedUserIds)
    })

    newSocket.on('moderation:suspicious', (data: { message: string; reasons: string[] }) => {
      console.warn('⚠️ Suspicious behavior detected:', data)
      moderationCallbacksRef.current.onSuspiciousBehavior?.(data)
    })

    newSocket.on('moderation:warning', (data: { message: string; reportCount?: number }) => {
      console.warn('⚠️ Moderation warning:', data)
      moderationCallbacksRef.current.onModerationWarning?.(data.message)
    })

    newSocket.on('chat:error', (message: string) => {
      console.error('❌ Chat error:', message)
      moderationCallbacksRef.current.onChatError?.(message)
    })

    // Callback request event listeners
    newSocket.on('callback:request:received', (data: {
      requestId: string
      fromUserId: string
      fromCountry?: string
      originalCallTimestamp?: string
      originalCallCountry?: string
    }) => {
      console.log('📞 Callback request received:', data)
      const requestData = {
        ...data,
        originalCallTimestamp: data.originalCallTimestamp ? new Date(data.originalCallTimestamp) : undefined
      }
      setIncomingCallbackRequest(requestData)
      callbackCallbacksRef.current.onCallbackRequestReceived?.(requestData)
    })

    newSocket.on('callback:request:accepted', (data: {
      requestId: string
      partner: User
      sessionId: string
      initiatorId: string
    }) => {
      console.log('✅ Callback request accepted:', data)
      setIncomingCallbackRequest(null)
      setPartner(data.partner)
      setSessionId(data.sessionId)
      preservedPartnerRef.current = data.partner
      preservedSessionIdRef.current = data.sessionId
      setIsWaiting(false)
      // Store initiatorId on socket instance
      // @ts-expect-error augment runtime value
      newSocket.__webrtcInitiatorId = data.initiatorId
      callbackCallbacksRef.current.onCallbackRequestAccepted?.(data)
    })

    newSocket.on('callback:request:declined', (data: { requestId: string; message: string }) => {
      console.log('❌ Callback request declined:', data)
      setIncomingCallbackRequest(null)
      callbackCallbacksRef.current.onCallbackRequestDeclined?.(data)
    })

    newSocket.on('callback:request:expired', (data: { requestId: string }) => {
      console.log('⏰ Callback request expired:', data)
      setIncomingCallbackRequest(null)
      callbackCallbacksRef.current.onCallbackRequestExpired?.(data)
    })

    newSocket.on('callback:mutual', (data: {
      partner: User
      sessionId: string
      initiatorId: string
    }) => {
      console.log('🤝 Mutual callback detected:', data)
      setPartner(data.partner)
      setSessionId(data.sessionId)
      preservedPartnerRef.current = data.partner
      preservedSessionIdRef.current = data.sessionId
      setIsWaiting(false)
      // Store initiatorId on socket instance
      // @ts-expect-error augment runtime value
      newSocket.__webrtcInitiatorId = data.initiatorId
      callbackCallbacksRef.current.onCallbackMutual?.(data)
    })

    newSocket.on('callback:request:queued', (data: { requestId: string; message: string }) => {
      console.log('⏳ Callback request queued:', data)
    })

    newSocket.on('callback:request:available', (data: { requestId: string; message: string }) => {
      console.log('✅ Callback target is now available:', data)
    })

    newSocket.on('callback:request:sent', (data: { requestId: string; message: string }) => {
      console.log('📤 Callback request sent:', data)
    })

    newSocket.on('callback:request:cancelled', (data: { requestId: string }) => {
      console.log('🚫 Callback request cancelled:', data)
      if (incomingCallbackRequest?.requestId === data.requestId) {
        setIncomingCallbackRequest(null)
      }
    })

    newSocket.on('callback:request:error', (data: { message: string }) => {
      console.error('❌ Callback request error:', data)
    })

    newSocket.on('callback:accept:error', (data: { message: string }) => {
      console.error('❌ Callback accept error:', data)
    })

    newSocket.on('callback:decline:error', (data: { message: string }) => {
      console.error('❌ Callback decline error:', data)
    })

    newSocket.on('callback:cancel:error', (data: { message: string }) => {
      console.error('❌ Callback cancel error:', data)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  const connectUser = (age?: number, country?: string) => {
    if (socket) {
      socket.emit('user:connect', { age, country })
    }
  }

  const requestCall = (filters?: UserFilters) => {
    if (socket) {
      socket.emit('call:request', filters || {})
    }
  }

  const endCall = () => {
    if (socket) {
      socket.emit('call:end')
    }
  }

  const sendMessage = (content: string) => {
    if (socket && sessionId) {
      socket.emit('chat:message', { sessionId, content })
    }
  }

  const requestChatHistory = () => {
    if (socket && sessionId) {
      socket.emit('chat:history', sessionId)
    }
  }

  const sendWebRTCMessage = (message: WebRTCMessage) => {
    if (socket) {
      socket.emit(`webrtc:${message.type}`, message)
    }
  }

  const updateAudioLevel = (level: number) => {
    if (socket) {
      socket.emit('audio:level', level)
    }
  }

  const toggleMute = (isMuted: boolean) => {
    if (socket) {
      socket.emit('audio:mute', isMuted)
    }
  }

  const reportUser = useCallback((data: ReportUserData) => {
    if (socket) {
      socket.emit('user:report', data)
    }
  }, [socket])

  const blockUser = useCallback((blockedUserId: string) => {
    if (socket) {
      socket.emit('user:block', blockedUserId)
    }
  }, [socket])

  const unblockUser = useCallback((unblockedUserId: string) => {
    if (socket) {
      socket.emit('user:unblock', unblockedUserId)
    }
  }, [socket])

  const getBlockedUsers = useCallback(() => {
    if (socket) {
      socket.emit('user:blocked:list')
    }
  }, [socket])

  const setModerationCallbacks = useCallback((callbacks: typeof moderationCallbacksRef.current) => {
    moderationCallbacksRef.current = callbacks
  }, [])

  const setCallbackCallbacks = useCallback((callbacks: typeof callbackCallbacksRef.current) => {
    callbackCallbacksRef.current = callbacks
  }, [])

  // Callback request functions
  const requestCallback = useCallback((toUserId: string, originalCallTimestamp?: Date, originalCallCountry?: string) => {
    if (socket) {
      socket.emit('callback:request', { 
        toUserId,
        originalCallTimestamp,
        originalCallCountry
      })
    }
  }, [socket])

  const acceptCallback = useCallback((requestId: string) => {
    if (socket) {
      socket.emit('callback:accept', requestId)
    }
  }, [socket])

  const declineCallback = useCallback((requestId: string) => {
    if (socket) {
      socket.emit('callback:decline', requestId)
    }
  }, [socket])

  const cancelCallback = useCallback((requestId: string) => {
    if (socket) {
      socket.emit('callback:cancel', requestId)
    }
  }, [socket])

  // Load blocked users list on mount
  useEffect(() => {
    if (socket && isConnected) {
      getBlockedUsers()
    }
  }, [socket, isConnected, getBlockedUsers])

  return {
    socket,
    isConnected,
    isReconnecting,
    user,
    stats,
    isWaiting,
    partner,
    sessionId,
    messages,
    blockedUsers,
    onlineUsers,
    incomingCallbackRequest,
    connectUser,
    requestCall,
    endCall,
    sendMessage,
    requestChatHistory,
    sendWebRTCMessage,
    updateAudioLevel,
    toggleMute,
    reportUser,
    blockUser,
    unblockUser,
    getBlockedUsers,
    setModerationCallbacks,
    setCallbackCallbacks,
    requestCallback,
    acceptCallback,
    declineCallback,
    cancelCallback,
  }
}
