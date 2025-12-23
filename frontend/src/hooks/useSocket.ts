import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { User, UserFilters, WebRTCMessage, ChatMessage, ServerStats } from '@/types'

// Dynamic backend URL detection - use same hostname as frontend
const getBackendUrl = (): string => {
  // If explicitly set via environment variable, use it
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL
  }
  
  // In browser, use current hostname (works for localhost, IP addresses, and domains)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    
    // Custom domain mapping: pokytalk.com -> app.pokytalk.com
    if (hostname === 'pokytalk.com' || hostname === 'www.pokytalk.com') {
      return `${protocol}//app.pokytalk.com`
    }
    
    // For app.pokytalk.com, use same domain
    if (hostname === 'app.pokytalk.com') {
      return `${protocol}//app.pokytalk.com`
    }
    
    // For localhost or other domains, use same hostname with port 3001
    return `${protocol}//${hostname}:3001`
  }
  
  // Fallback for SSR
  return 'http://localhost:3001'
}

const BACKEND_URL = getBackendUrl()

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [isWaiting, setIsWaiting] = useState(false)
  const [partner, setPartner] = useState<User | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    console.log('Attempting to connect to:', BACKEND_URL)
    const newSocket = io(BACKEND_URL, {
      transports: ['polling', 'websocket'],  // Try polling first, then upgrade to websocket
      autoConnect: true,
      withCredentials: true,
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
      console.log('Connected to server')
      // Automatically connect user when socket connects
      console.log('Emitting user:connect event')
      newSocket.emit('user:connect', {})
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      setUser(null)
      setPartner(null)
      setSessionId(null)
      setIsWaiting(false)
      console.log('Disconnected from server')
    })

    newSocket.on('user:connect', (userData: User) => {
      console.log('Received user:connect response:', userData)
      setUser(userData)
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

    newSocket.on('error', (message: string) => {
      console.error('Socket error:', message)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
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

  return {
    socket,
    isConnected,
    user,
    stats,
    isWaiting,
    partner,
    sessionId,
    messages,
    connectUser,
    requestCall,
    endCall,
    sendMessage,
    requestChatHistory,
    sendWebRTCMessage,
    updateAudioLevel,
    toggleMute,
  }
}
