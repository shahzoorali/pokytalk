'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { useWebRTC } from '@/hooks/useWebRTC'
import { ConnectionScreen } from './ConnectionScreen'
import { CallScreen } from './CallScreen'
import { LoadingScreen } from './LoadingScreen'
import { UserFilters } from '@pokytalk/shared'

export function VoiceChatApp() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<UserFilters>({})
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

  // Handle WebRTC signaling - use useCallback to prevent recreation
  const handleWebRTCMessageCallback = useCallback((message: any) => {
    if (!isUnmountingRef.current) {
      console.log('📨 Received WebRTC message:', message.type)
      handleWebRTCMessage(message)
    }
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
      console.log('📞 Call in progress - preventing cleanup')
    } else if (!isWaiting) {
      callInProgressRef.current = false
      peerSessionRef.current = null
      console.log('📞 No call in progress')
    }
  }, [partner?.id, sessionId, isWaiting])

  // Create peer once per session
  useEffect(() => {
    const uid = user?.id
    const pid = partner?.id
    if (!uid || !pid || !sessionId || !localStream) return
    if (isUnmountingRef.current) return

    // Only create once per session
    if (peerSessionRef.current === sessionId) {
      return
    }

    console.log('🎯 Call matched, creating WebRTC peer (guarded by session)...')
    const isInitiator = uid < pid
    const newPeer = createPeer(isInitiator, localStream)

    if (newPeer) {
      peerSessionRef.current = sessionId
      newPeer.on('signal', (data: any) => {
        if (isUnmountingRef.current) return
        console.log('📡 WebRTC signal generated:', data.type || 'candidate')
        if (data.type === 'offer' || data.type === 'answer') {
          sendWebRTCMessage({ type: data.type, sdp: data, from: uid, to: pid })
        } else if (data.candidate) {
          sendWebRTCMessage({ type: 'ice-candidate', candidate: data.candidate, from: uid, to: pid })
        }
      })
    }
  }, [user?.id, partner?.id, sessionId, localStream, createPeer, sendWebRTCMessage])

  // Handle connection state changes and retry logic
  useEffect(() => {
    if (connectionState === 'failed' && partner && sessionId && localStream) {
      console.log('🔄 Connection failed, attempting retry...')
      const retryTimeout = setTimeout(() => {
        if (!isUnmountingRef.current && connectionState === 'failed') {
          console.log('🔄 Retrying WebRTC connection...')
          peerSessionRef.current = null // Reset session to allow recreation
          cleanupWebRTC()
          
          // Recreate peer after cleanup
          setTimeout(() => {
            if (!isUnmountingRef.current && partner && sessionId && localStream) {
              const uid = user?.id
              const pid = partner?.id
              if (uid && pid) {
                const isInitiator = uid < pid
                const newPeer = createPeer(isInitiator, localStream)
                if (newPeer) {
                  peerSessionRef.current = sessionId
                  newPeer.on('signal', (data: any) => {
                    if (isUnmountingRef.current) return
                    console.log('📡 WebRTC signal generated (retry):', data.type || 'candidate')
                    if (data.type === 'offer' || data.type === 'answer') {
                      sendWebRTCMessage({ type: data.type, sdp: data, from: uid, to: pid })
                    } else if (data.candidate) {
                      sendWebRTCMessage({ type: 'ice-candidate', candidate: data.candidate, from: uid, to: pid })
                    }
                  })
                }
              }
            }
          }, 1000)
        }
      }, 3000) // Wait 3 seconds before retrying

      return () => clearTimeout(retryTimeout)
    }
  }, [connectionState, partner, sessionId, localStream, user?.id, createPeer, sendWebRTCMessage, cleanupWebRTC])

  // Handle call ending
  useEffect(() => {
    if (!partner && peer && !isUnmountingRef.current) {
      console.log('📞 Partner disconnected, cleaning up WebRTC...')
      peerSessionRef.current = null
      cleanupWebRTC()
    }
  }, [partner, peer, cleanupWebRTC])

  // Update audio levels
  useEffect(() => {
    if (isUnmountingRef.current) return

    const interval = setInterval(() => {
      if (!isUnmountingRef.current) {
        updateAudioLevel(localAudioLevel)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [localAudioLevel, updateAudioLevel])

  const handleStartCall = useCallback(async (userFilters?: UserFilters) => {
    if (isUnmountingRef.current) return
    
    try {
      console.log('🚀 Starting call...')
      await initializeAudio()
      setIsInitialized(true)
      setFilters(userFilters || {})
      requestCall(userFilters)
    } catch (error) {
      console.error('Failed to start call:', error)
      alert('Failed to access microphone. Please check permissions.')
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

  if (!isConnected) {
    return <LoadingScreen message="Connecting to server..." />
  }

  if (!isInitialized) {
    return (
      <ConnectionScreen
        onStartCall={handleStartCall}
        stats={stats}
      />
    )
  }

  if (isWaiting) {
    return <LoadingScreen message="Finding someone to talk to..." />
  }

  if (partner && sessionId) {
    return (
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
    )
  }

  // If we're initialized but not in a call, show connection screen
  return (
    <ConnectionScreen
      onStartCall={handleStartCall}
      stats={stats}
    />
  )
}
