'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useWebRTC } from '@/hooks/useWebRTC'
import { ConnectionScreen } from './ConnectionScreen'
import { CallScreen } from './CallScreen'
import { LoadingScreen } from './LoadingScreen'
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

  // Initialize socket connection
  useEffect(() => {
    if (socket && !isConnected) {
      socket.connect()
    }
  }, [socket, isConnected])

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
    setIsInitialized(false)
    setIsLoading(false)
    setShowFilters(false)
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

  // Single page experience - show everything on one screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow [animation-delay:1s]"></div>
      </div>

      {/* Main content - always show connection screen */}
      <ConnectionScreen
        onStartCall={handleStartCall}
        stats={stats}
        isConnected={isConnected}
        isInitialized={isInitialized}
        isWaiting={isWaiting}
        isLoading={isLoading}
      />

      {/* Overlay for waiting state */}
      {isWaiting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
              <p className="text-white text-lg font-medium">Finding someone to talk to...</p>
            </div>
          </div>
        </div>
      )}

      {/* Call interface overlay - appears on top when connected */}
      {partner && sessionId && (
        <CallScreen
          partner={partner}
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
        />
      )}

      {/* Connection status indicator */}
      {!isConnected && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <p className="text-sm">Connecting to server...</p>
        </div>
      )}
    </div>
  )
}
