'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useWebRTC } from '@/hooks/useWebRTC'
import { useGame } from '@/hooks/useGame'
import { ConnectionScreen } from './ConnectionScreen'
import { UserFilters } from '@/types'

export function VoiceChatApp() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<UserFilters>({})
  const [isLoading, setIsLoading] = useState(false)
  const isUnmountingRef = useRef(false)
  const callInProgressRef = useRef(false)
  const peerSessionRef = useRef<string | null>(null)
  
  const {
    socket,
    isConnected,
    isReconnecting,
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
  } = useSocket()

  const {
    peer,
    isConnected: isWebRTCConnected,
    localStream,
    remoteStream,
    isMuted,
    localAudioLevel,
    remoteAudioLevel,
    connectionState,
    initializeAudio,
    createPeer,
    handleWebRTCMessage,
    toggleMute: toggleWebRTCMute,
    cleanup: cleanupWebRTC,
  } = useWebRTC()

  // Game state
  const gameHook = useGame({
    socket,
    sessionId,
    userId: user?.id || null,
  })

  // Initialize socket connection
  useEffect(() => {
    if (socket && !isConnected) {
      socket.connect()
    }
  }, [socket, isConnected])
  
  // Reset loading state when socket reconnects after disconnect
  useEffect(() => {
    if (isConnected && !partner && !sessionId) {
      // Socket reconnected and we're not in a call - reset loading states
      // But keep isInitialized true to maintain call screen layout
      setIsLoading(false)
      setShowFilters(false)
    }
  }, [isConnected, partner, sessionId])

  // Handle WebRTC signaling - simplified with trickle ICE enabled
  const handleWebRTCMessageCallback = useCallback((message: any) => {
    if (isUnmountingRef.current) return
    
    // Only log non-ICE messages to reduce spam
    if (message.type !== 'ice-candidate') {
      console.log('📨 Received WebRTC message:', message.type)
    }

    // Simply forward the message to the peer handler
    handleWebRTCMessage(message)
  }, [handleWebRTCMessage])

  useEffect(() => {
    if (socket && !isUnmountingRef.current) {
      socket.on('webrtc:offer', handleWebRTCMessageCallback)
      socket.on('webrtc:answer', handleWebRTCMessageCallback)
      socket.on('webrtc:ice-candidate', handleWebRTCMessageCallback)
    }

    return () => {
      if (socket) {
        socket.off('webrtc:offer', handleWebRTCMessageCallback)
        socket.off('webrtc:answer', handleWebRTCMessageCallback)
        socket.off('webrtc:ice-candidate', handleWebRTCMessageCallback)
      }
    }
  }, [socket, handleWebRTCMessageCallback])

  // Track call state changes
  useEffect(() => {
    if (partner && sessionId) {
      callInProgressRef.current = true
    } else if (!isWaiting) {
      callInProgressRef.current = false
      // Don't reset peerSessionRef here - let the cleanup effect handle it
    }
  }, [partner?.id, sessionId, isWaiting])

  // Create peer once per session - simplified flow
  useEffect(() => {
    const uid = user?.id
    const pid = partner?.id
    
    // Skip if already created for this session (check FIRST to avoid log spam)
    if (peerSessionRef.current === sessionId && sessionId) {
      return
    }
    
    // Skip if missing required data
    if (!uid || !pid || !sessionId || !localStream) {
      return
    }
    
    if (isUnmountingRef.current) return

    // Determine initiator - prefer server-declared initiator
    const serverInitiatorId: string | undefined = (socket as any)?.__webrtcInitiatorId
    const isInitiator = serverInitiatorId ? uid === serverInitiatorId : uid < pid
    
    console.log('🎯 Creating WebRTC peer:', {
      isInitiator,
      uid,
      pid,
      sessionId,
      localStreamId: localStream.id
    })
    
    // Mark session BEFORE creating peer to prevent race conditions
    peerSessionRef.current = sessionId
    
    const newPeer = createPeer(isInitiator, localStream, (data: any) => {
      if (isUnmountingRef.current) return
      
      // Handle SDP (offer/answer)
      if (data.type === 'offer' || data.type === 'answer') {
        console.log(`📤 Sending ${data.type} to partner`)
        sendWebRTCMessage({ type: data.type, sdp: data, from: uid, to: pid })
      } 
      // Handle ICE candidates (with trickle ICE enabled)
      else if (data.candidate) {
        const candidateData = {
          candidate: data.candidate.candidate,
          sdpMLineIndex: data.candidate.sdpMLineIndex,
          sdpMid: data.candidate.sdpMid
        }
        sendWebRTCMessage({ type: 'ice-candidate', candidate: candidateData, from: uid, to: pid })
      }
    })
    
    if (newPeer) {
      console.log('✅ Peer created successfully')
    } else {
      console.error('❌ Peer creation returned null')
      peerSessionRef.current = null  // Reset on failure
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, partner?.id, sessionId, localStream])

  // Handle connection state changes and retry logic
  const retryAttemptRef = useRef(0)
  const maxRetries = 3
  
  useEffect(() => {
    if (connectionState !== 'failed') {
      // Reset retry count on successful connection or other states
      if (connectionState === 'connected') {
        retryAttemptRef.current = 0
      }
      return
    }
    
    if (!partner || !sessionId || !localStream) return
    if (retryAttemptRef.current >= maxRetries) {
      console.log('❌ Max retry attempts reached')
      return
    }
    
    console.log(`🔄 Connection failed, retry attempt ${retryAttemptRef.current + 1}/${maxRetries}...`)
    retryAttemptRef.current++
    
    const retryTimeout = setTimeout(() => {
      if (isUnmountingRef.current) return
      
      console.log('🔄 Retrying WebRTC connection...')
      peerSessionRef.current = null // Reset session to allow recreation
      cleanupWebRTC()
    }, 3000)

    return () => clearTimeout(retryTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState])

  // Handle call ending - cleanup when partner disconnects
  const hadPartnerRef = useRef(false)
  useEffect(() => {
    if (partner) {
      hadPartnerRef.current = true
    } else if (hadPartnerRef.current && !partner) {
      // Partner disconnected
      console.log('📞 Partner disconnected, cleaning up...')
      hadPartnerRef.current = false
      peerSessionRef.current = null
      cleanupWebRTC()
      // Reset loading state but keep isInitialized to maintain call screen layout
      setIsLoading(false)
    }
  }, [partner, cleanupWebRTC])

  // Update audio levels - use ref to avoid dependency on localAudioLevel
  const localAudioLevelRef = useRef(localAudioLevel)
  useEffect(() => {
    localAudioLevelRef.current = localAudioLevel
  }, [localAudioLevel])
  
  useEffect(() => {
    if (isUnmountingRef.current) return

    const interval = setInterval(() => {
      if (!isUnmountingRef.current) {
        updateAudioLevel(localAudioLevelRef.current)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [updateAudioLevel])

  const handleStartCall = useCallback(async (userFilters?: UserFilters) => {
    if (isUnmountingRef.current) return
    
    try {
      setIsLoading(true)
      console.log('🚀 Starting call...')
      await initializeAudio()
      setIsInitialized(true)
      setFilters(userFilters || {})
      requestCall(userFilters)
    } catch (error) {
      console.error('Failed to start call:', error)
      alert('Failed to access microphone. Please check permissions.')
      setIsInitialized(false)
      setIsLoading(false)
    }
  }, [initializeAudio, requestCall])

  const handleEndCall = useCallback(() => {
    if (isUnmountingRef.current) return
    
    console.log('📞 Ending call...')
    callInProgressRef.current = false
    peerSessionRef.current = null
    endCall()
    cleanupWebRTC()
    // Reset loading states but keep isInitialized true to maintain call screen layout
    setIsLoading(false)
    setShowFilters(false)
    // Force reset by setting a timeout to ensure state clears
    setTimeout(() => {
      if (!isUnmountingRef.current) {
        setIsLoading(false)
      }
    }, 200)
  }, [endCall, cleanupWebRTC])

  const handleToggleMute = useCallback(() => {
    if (isUnmountingRef.current) return
    
    toggleWebRTCMute()
    toggleMute(!isMuted)
  }, [toggleWebRTCMute, toggleMute, isMuted])

  const handleToggleChat = useCallback(() => {
    if (isUnmountingRef.current) return
    
    setShowFilters(!showFilters)
    if (!showFilters && sessionId) {
      requestChatHistory()
    }
  }, [showFilters, sessionId, requestChatHistory])

  // Handle page visibility changes (screen lock, background, etc.)
  useEffect(() => {
    if (!partner || !sessionId) return

    let wakeLock: any = null

    // Request wake lock to prevent screen from sleeping during call
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen')
          console.log('✅ Wake lock acquired - screen will stay on')
        } catch (err: any) {
          console.log('⚠️ Wake lock not available:', err.message)
        }
      }
    }

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 Page hidden (screen locked/backgrounded) - keeping connections alive')
        // Don't disconnect - connections will be maintained
      } else {
        console.log('📱 Page visible (screen unlocked/foregrounded)')
        // Reconnect socket if disconnected
        if (socket && !isConnected) {
          console.log('🔄 Reconnecting socket after visibility change')
          socket.connect()
        }
        // Resume audio context if suspended
        if (localStream) {
          const audioTracks = localStream.getAudioTracks()
          audioTracks.forEach(track => {
            if (track.enabled === false) {
              track.enabled = true
            }
          })
        }
        // Re-request wake lock if released
        if (wakeLock === null) {
          requestWakeLock()
        }
      }
    }

    // Handle page freeze (iOS Safari)
    const handlePageFreeze = () => {
      console.log('❄️ Page frozen - preserving call state')
    }

    // Handle page resume (iOS Safari)
    const handlePageResume = () => {
      console.log('▶️ Page resumed - reconnecting if needed')
      if (socket && !isConnected) {
        socket.connect()
      }
    }

    // Handle online/offline events
    const handleOnline = () => {
      console.log('🌐 Network online - reconnecting if needed')
      if (socket && !isConnected) {
        socket.connect()
      }
    }

    const handleOffline = () => {
      console.log('📴 Network offline - will reconnect when online')
    }

    // Request wake lock when call starts
    requestWakeLock()

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // iOS Safari specific events
    window.addEventListener('freeze', handlePageFreeze)
    window.addEventListener('resume', handlePageResume)
    
    // Network state events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('freeze', handlePageFreeze)
      window.removeEventListener('resume', handlePageResume)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      // Release wake lock when call ends
      if (wakeLock) {
        wakeLock.release().then(() => {
          console.log('✅ Wake lock released')
        }).catch((err: any) => {
          console.log('⚠️ Error releasing wake lock:', err.message)
        })
      }
    }
  }, [partner, sessionId, socket, isConnected, localStream])

  // Recover WebRTC connection after socket reconnects
  useEffect(() => {
    if (!isConnected || !partner || !sessionId || !localStream) return
    if (peerSessionRef.current === sessionId) return // Already connected

    // If socket reconnected and we have call state, recreate WebRTC peer
    console.log('🔄 Socket reconnected during call - recovering WebRTC connection')
    peerSessionRef.current = null // Reset to allow recreation
    // The existing peer creation effect will handle recreating the connection
  }, [isConnected, partner, sessionId, localStream])

  // Single page experience - show everything on one screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow [animation-delay:1s]"></div>
      </div>

      {/* Main content - always show connection screen with inline call controls */}
      <ConnectionScreen
        onStartCall={handleStartCall}
        stats={stats}
        isConnected={isConnected}
        isReconnecting={isReconnecting}
        isInitialized={isInitialized}
        isWaiting={isWaiting}
        isLoading={isLoading}
        // Call state props
        user={user}
        partner={partner}
        sessionId={sessionId}
        isWebRTCConnected={isWebRTCConnected}
        connectionState={connectionState}
        isMuted={isMuted}
        localAudioLevel={localAudioLevel}
        remoteAudioLevel={remoteAudioLevel}
        messages={messages}
        showChat={showFilters}
        onEndCall={handleEndCall}
        onToggleMute={handleToggleMute}
        onToggleChat={handleToggleChat}
        onSendMessage={sendMessage}
        remoteStream={remoteStream}
        // Game props
        gameHook={gameHook}
      />

      {/* Connection status indicator */}
      {(!isConnected || isReconnecting) && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
          isReconnecting ? 'bg-yellow-600' : 'bg-red-600'
        } text-white`}>
          <div className="flex items-center space-x-2">
            {isReconnecting && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            )}
            <p className="text-sm">
              {isReconnecting ? 'Reconnecting...' : 'Connecting to server...'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
